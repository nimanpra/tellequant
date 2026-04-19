import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";

const createSchema = z.object({ name: z.string().min(1).max(80) });

export async function POST(req: Request) {
  const { supabase, org } = await requireOrg();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const secret = `vk_${randomBytes(32).toString("base64url")}`;
  const prefix = secret.slice(0, 8);
  const hash = createHash("sha256").update(secret).digest("hex");

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      org_id: org.id,
      name: parsed.data.name,
      key_prefix: prefix,
      key_hash: hash,
    })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ key: data, secret });
}

export async function DELETE(req: Request) {
  const { supabase } = await requireOrg();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
