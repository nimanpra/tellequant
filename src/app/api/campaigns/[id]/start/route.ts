import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canPlaceCall, humanReason } from "@/lib/billing/balance";

export const dynamic = "force-dynamic";

/**
 * Flip a campaign to running and signal the worker. Hard-gates on plan:
 *   - Free plan: refused (demo chat only).
 *   - Cloud plan with 0 balance: refused until a credit pack is bought.
 *   - Self-host: always allowed.
 *
 * Authorization is enforced by RLS via createSupabaseServerClient (anon client
 * with the user's session): `.eq("id", id).single()` on campaigns will only
 * return a row if the authenticated user is a member of the campaign's org.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: campaign, error: fetchErr } = await supabase
    .from("campaigns")
    .select("id, org_id")
    .eq("id", id)
    .single();

  if (fetchErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const decision = await canPlaceCall(supabase, campaign.org_id);
  if (!decision.allow) {
    return NextResponse.json(
      {
        error: humanReason(decision.reason),
        code: decision.reason,
        creditsBalanceMinutes: decision.creditsBalanceMinutes,
      },
      { status: 402 },
    );
  }

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "running" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Signal the worker. Use the same HMAC scheme the worker uses when calling us
  // back so both sides share a single secret (VOICE_WORKER_SHARED_SECRET).
  const workerUrl = process.env.WORKER_URL;
  const secret = process.env.VOICE_WORKER_SHARED_SECRET;
  if (workerUrl && secret) {
    const body = JSON.stringify({ campaign_id: id });
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    try {
      await fetch(`${workerUrl}/campaigns/${id}/kick`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tellequant-worker-key": sig,
        },
        body,
      });
    } catch {
      /* worker may be offline in dev — no-op */
    }
  }

  return NextResponse.json({ ok: true });
}
