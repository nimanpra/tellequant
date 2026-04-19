import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  parseEncryptedMap,
  statusFor,
  upsertKeysForProvider,
  type ProviderId,
} from "@/lib/byok";

export const dynamic = "force-dynamic";

/** GET: returns which provider fields are configured. Never leaks secrets. */
export async function GET() {
  const { org } = await requireOrg();
  const current = parseEncryptedMap(org.provider_keys_encrypted);
  return NextResponse.json({ providers: statusFor(current) });
}

const BodySchema = z.object({
  provider: z.string().min(1).max(32),
  fields: z.record(z.string().min(1).max(64), z.string().nullable()),
});

/** POST: upsert keys for a single provider. */
export async function POST(req: Request) {
  const { org } = await requireOrg();
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  // Re-read to avoid racing against concurrent edits in another tab.
  const { data: fresh, error: readErr } = await service
    .from("organizations")
    .select("provider_keys_encrypted")
    .eq("id", org.id)
    .single();
  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  const current = parseEncryptedMap(fresh.provider_keys_encrypted);
  let next;
  try {
    next = upsertKeysForProvider(current, {
      provider: parsed.data.provider as ProviderId,
      fields: parsed.data.fields,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid provider fields";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { error: writeErr } = await service
    .from("organizations")
    .update({ provider_keys_encrypted: next })
    .eq("id", org.id);
  if (writeErr) {
    return NextResponse.json({ error: writeErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, providers: statusFor(next) });
}
