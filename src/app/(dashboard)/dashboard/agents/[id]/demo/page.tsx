import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { AgentDemoChat } from "@/components/dashboard/agent-demo-chat";
import { Card } from "@/components/ui/card";
import { requireOrg } from "@/lib/auth";
import { planById } from "@/lib/billing/plans";
import { parseEncryptedMap } from "@/lib/byok";

export const dynamic = "force-dynamic";

const FREE_DAILY_LIMIT = 3;

export default async function AgentDemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, persona, opening_line, llm_provider, llm_model")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  if (!agent) notFound();

  const planType = (org.plan_type ?? "self_host") as "self_host" | "cloud";
  const planMeta = planById(org.plan, planType);
  const planLabel = planMeta?.name ?? org.plan;

  const keyMap = parseEncryptedMap(org.provider_keys_encrypted);
  const keyConfigured = hasLlmKey(agent.llm_provider, keyMap);

  const isFreePlan = org.plan === "free" || Boolean(planMeta?.demoOnly);
  let remaining: number | null = null;
  if (isFreePlan) {
    const since = startOfUtcDay();
    const { count } = await supabase
      .from("demo_chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .gte("created_at", since);
    remaining = Math.max(0, FREE_DAILY_LIMIT - (count ?? 0));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500">
            <Link href="/dashboard/agents" className="hover:text-zinc-300">
              Agents
            </Link>{" "}
            /{" "}
            <Link href={`/dashboard/agents/${agent.id}`} className="hover:text-zinc-300">
              {agent.name}
            </Link>{" "}
            / <span className="text-zinc-400">Demo chat</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">
            Demo {agent.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Text-only demo using your own LLM key. No phone is dialed and no minutes are consumed.
          </p>
        </div>
        <Link
          href={`/dashboard/agents/${agent.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#98C9FF]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to agent
        </Link>
      </div>

      {!keyConfigured ? (
        <Card className="mb-4 flex items-start gap-3 border-[#F59E0B]/30 bg-[#F59E0B]/5 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#FBBF24]" />
          <div className="text-sm text-zinc-300">
            This agent uses <span className="font-medium text-neutral-50">{agent.llm_provider}</span> but
            no matching key is configured.{" "}
            <Link
              href="/dashboard/settings/keys"
              className="font-medium text-[#98C9FF] hover:underline"
            >
              Add your key
            </Link>{" "}
            to start the demo.
          </div>
        </Card>
      ) : null}

      {isFreePlan ? (
        <Card className="mb-4 flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#98C9FF]" />
          <div className="text-sm text-zinc-300">
            Free plan · <span className="text-neutral-50">{remaining ?? 0}</span> of{" "}
            {FREE_DAILY_LIMIT} demo sessions remaining today. Upgrade on the{" "}
            <Link href="/dashboard/billing" className="text-[#98C9FF] hover:underline">
              Billing page
            </Link>{" "}
            for unlimited demos and live calls.
          </div>
        </Card>
      ) : null}

      <AgentDemoChat agent={agent} planLabel={planLabel} />
    </div>
  );
}

function hasLlmKey(
  provider: string,
  map: ReturnType<typeof parseEncryptedMap>,
): boolean {
  const p = provider.toLowerCase();
  if (p === "groq") return Boolean(map.GROQ_API_KEY);
  if (p === "openai") return Boolean(map.OPENAI_API_KEY);
  if (p === "anthropic") return Boolean(map.ANTHROPIC_API_KEY);
  if (p === "gemini") return Boolean(map.GEMINI_API_KEY);
  return false;
}

function startOfUtcDay(): string {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return utc.toISOString();
}
