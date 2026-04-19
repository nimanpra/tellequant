import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const schema = z.object({ name: z.string().min(2).max(80) });

function slugify(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6)
  );
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = slugify(parsed.data.name);
  // Use service client to bypass RLS — the user is verified above, and this is
  // a privileged bootstrap (user can only create their own first org via this route).
  const admin = createSupabaseServiceClient();
  const { data: org, error } = await admin
    .from("organizations")
    .insert({ name: parsed.data.name, slug, owner_id: user.id, plan: "free" })
    .select()
    .single();
  if (error || !org) return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });

  const { error: mErr } = await admin
    .from("memberships")
    .insert({ org_id: org.id, user_id: user.id, role: "owner" });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  return NextResponse.json({ org });
}
