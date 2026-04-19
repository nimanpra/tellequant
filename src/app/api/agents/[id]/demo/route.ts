import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decryptAll, parseEncryptedMap } from "@/lib/byok";
import { ChatConfigError, streamChat, type ChatMessage } from "@/lib/llm/chat";
import { planById } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

const FREE_DAILY_LIMIT = 3;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, organizations(id, plan, plan_type, provider_keys_encrypted)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const org = membership?.organizations as
    | {
        id: string;
        plan: "free" | "solo" | "team" | "business" | "pro" | "scale";
        plan_type: "self_host" | "cloud";
        provider_keys_encrypted: unknown;
      }
    | undefined;
  if (!org) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, persona, opening_line, llm_provider, llm_model, temperature")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const planMeta = planById(org.plan, org.plan_type);
  if (org.plan === "free" || planMeta?.demoOnly) {
    const since = startOfUtcDay();
    const { count } = await supabase
      .from("demo_chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .gte("created_at", since);
    if ((count ?? 0) >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Free plan is capped at ${FREE_DAILY_LIMIT} demo sessions per day. Upgrade to any paid plan for unlimited demos and live calls.`,
          code: "free_daily_limit",
        },
        { status: 429 },
      );
    }
  }

  const encryptedMap = parseEncryptedMap(org.provider_keys_encrypted);
  const apiKeys = decryptAll(encryptedMap);

  const history: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(agent) },
    ...(agent.opening_line
      ? ([{ role: "assistant", content: agent.opening_line }] satisfies ChatMessage[])
      : []),
    ...parsed.data.messages.map((m) => ({ role: m.role, content: m.content }) satisfies ChatMessage),
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      try {
        let buffered = "";
        for await (const chunk of streamChat({
          provider: agent.llm_provider,
          model: agent.llm_model,
          messages: history,
          temperature: agent.temperature,
          apiKeys,
          signal: req.signal,
        })) {
          if (chunk.delta) {
            buffered += chunk.delta;
            write({ type: "delta", text: chunk.delta });
          }
          if (chunk.done) break;
        }

        await supabase
          .from("demo_chat_sessions")
          .insert({
            org_id: org.id,
            agent_id: agent.id,
            user_id: user.id,
            messages: [
              ...parsed.data.messages,
              { role: "assistant", content: buffered },
            ] as unknown as never,
          });

        write({ type: "done" });
      } catch (err) {
        const code = err instanceof ChatConfigError ? err.code : "error";
        const message =
          err instanceof Error ? err.message : "Demo chat failed unexpectedly.";
        write({ type: "error", code, message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

function buildSystemPrompt(agent: {
  name: string;
  persona: string;
  opening_line: string;
}): string {
  return [
    `You are ${agent.name}, an AI voice agent talking to a customer over the phone.`,
    "This is a TEXT DEMO, not a real phone call — keep replies concise (1-3 sentences, ~40 words max) and natural, as you would speak them aloud.",
    "Do not invent real personal data, appointment times, or confirmations unless the user provides them.",
    "",
    "--- PERSONA ---",
    agent.persona || "No persona configured. Be a helpful, friendly phone agent.",
  ].join("\n");
}

function startOfUtcDay(): string {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return utc.toISOString();
}
