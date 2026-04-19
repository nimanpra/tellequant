import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyWorkerRequest } from "@/lib/worker-auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const raw = await req.text();
  if (!verifyWorkerRequest(req, raw)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const svc = createSupabaseServiceClient();

  const { data: agent, error } = await svc
    .from("agents")
    .select("*, knowledge_bases:knowledge_base_id(id, name, embedding_model)")
    .eq("id", id)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: agent.id,
    org_id: agent.org_id,
    name: agent.name,
    persona: agent.persona,
    opening_line: agent.opening_line,
    voice_provider: agent.voice_provider,
    voice_id: agent.voice_id,
    llm_provider: agent.llm_provider,
    llm_model: agent.llm_model,
    temperature: Number(agent.temperature),
    max_duration_seconds: agent.max_duration_seconds,
    knowledge_base_id: agent.knowledge_base_id,
    knowledge_base: agent.knowledge_bases ?? null,
    tools: agent.tools,
  });
}
