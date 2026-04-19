import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const KBSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = KBSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: mem } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!mem) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { data, error } = await supabase
    .from("knowledge_bases")
    .insert({
      org_id: mem.org_id,
      name: parsed.data.name,
      description: parsed.data.description,
      embedding_model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kb: data });
}
