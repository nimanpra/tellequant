import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AgentSchema = z.object({
  name: z.string().min(1).max(80),
  persona: z.string().default(""),
  opening_line: z.string().default("Hi, how can I help?"),
  voice_provider: z.string(),
  voice_id: z.string(),
  llm_provider: z.string(),
  llm_model: z.string(),
  temperature: z.number().min(0).max(2).default(0.4),
  max_duration_seconds: z.number().int().min(30).max(7200).default(600),
  knowledge_base_id: z.string().uuid().nullable().optional(),
  tools: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agents: data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: org } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!org) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { data, error } = await supabase
    .from("agents")
    .insert({ ...parsed.data, org_id: org.org_id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}
