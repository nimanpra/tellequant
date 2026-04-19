import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { embedOne } from "@/lib/rag/embed";

const SearchSchema = z.object({ query: z.string().min(1), k: z.number().int().min(1).max(20).default(6) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: kbId } = await params;
  const parsed = SearchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const vec = await embedOne(parsed.data.query);
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: vec as unknown as string,
    kb_id: kbId,
    match_count: parsed.data.k,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data });
}
