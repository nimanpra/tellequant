import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { extractText } from "@/lib/rag/parse";
import { chunkText } from "@/lib/rag/chunk";
import { embed } from "@/lib/rag/embed";

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: kbId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Validate kb belongs to a user org (RLS also protects).
  const { data: kb, error: kbErr } = await supabase
    .from("knowledge_bases")
    .select("id, org_id")
    .eq("id", kbId)
    .single();
  if (kbErr || !kb) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${kb.org_id}/${kbId}/${Date.now()}-${file.name}`;

  const { error: uploadErr } = await supabase.storage
    .from("kb-docs")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      kb_id: kbId,
      name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: buffer.byteLength,
      storage_path: storagePath,
      status: "processing",
    })
    .select()
    .single();
  if (docErr || !doc) return NextResponse.json({ error: docErr?.message ?? "Doc insert failed" }, { status: 500 });

  // Ingest synchronously for small files; queue for large.
  try {
    const text = await extractText({ buffer, mime: file.type, name: file.name });
    const chunks = chunkText(text);
    if (!chunks.length) throw new Error("No extractable text");

    const vectors = await embed(chunks);
    // Service client bypasses RLS for the chunk insert
    const admin = createSupabaseServiceClient();
    const rows = chunks.map((content, i) => ({
      kb_id: kbId,
      document_id: doc.id,
      content,
      token_count: Math.ceil(content.length / 4),
      chunk_index: i,
      embedding: vectors[i] as unknown as string,
    }));
    const { error: insErr } = await admin.from("chunks").insert(rows);
    if (insErr) throw new Error(insErr.message);
    await supabase.from("documents").update({ status: "ready" }).eq("id", doc.id);
    return NextResponse.json({ doc, chunks: chunks.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ingest failed";
    await supabase.from("documents").update({ status: "failed", error: msg }).eq("id", doc.id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: kbId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("kb_id", kbId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}
