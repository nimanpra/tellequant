import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Flip campaign to running and signal the worker. The worker polls pending
 * `campaign_contacts` rows and places outbound calls up to `concurrency`.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ status: "running" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget worker notify
  try {
    await fetch(`${process.env.WORKER_URL}/campaigns/${id}/kick`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.WORKER_SHARED_SECRET}`,
      },
    });
  } catch {
    /* worker may be offline in dev — no-op */
  }

  return NextResponse.json({ ok: true });
}
