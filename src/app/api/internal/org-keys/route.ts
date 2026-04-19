import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyWorkerRequest } from "@/lib/worker-auth";
import { decryptAll, parseEncryptedMap } from "@/lib/byok";

export const dynamic = "force-dynamic";

const BodySchema = z.object({ org_id: z.string().uuid() });

/**
 * Worker-only endpoint that returns decrypted provider keys for an org.
 * Called at the start of every outbound call / inbound handoff so the worker
 * can authenticate against the user's own Telnyx/Groq/Deepgram/etc accounts.
 *
 * Auth: HMAC(VOICE_WORKER_SHARED_SECRET) over the raw request body.
 * Never exposed to browser traffic.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWorkerRequest(req, raw)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(JSON.parse(raw || "{}"));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, plan, plan_type, provider_keys_encrypted, credits_balance_minutes")
    .eq("id", parsed.data.org_id)
    .single();
  if (error || !org) {
    return NextResponse.json({ error: "org not found" }, { status: 404 });
  }

  const map = parseEncryptedMap(org.provider_keys_encrypted);
  const decrypted = decryptAll(map);

  return NextResponse.json({
    org_id: org.id,
    plan: org.plan,
    plan_type: org.plan_type,
    credits_balance_minutes: org.credits_balance_minutes,
    keys: decrypted,
  });
}
