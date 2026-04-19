import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyWorkerRequest } from "@/lib/worker-auth";
import { embed } from "@/lib/rag/embed";

const schema = z.object({
  kb_id: z.string().uuid(),
  query: z.string().min(1).max(2000),
  top_k: z.number().int().min(1).max(20).default(6),
});

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWorkerRequest(req, raw)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { kb_id, query, top_k } = parsed.data;

  const [vector] = await embed([query]);
  if (!vector) return NextResponse.json({ matches: [] });

  const svc = createSupabaseServiceClient();
  const { data, error } = await svc.rpc("match_chunks", {
    query_embedding: vector,
    kb_id,
    match_count: top_k,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    matches: (data ?? []).map((m) => ({
      id: m.id,
      content: m.content,
      similarity: m.similarity,
    })),
  });
}
