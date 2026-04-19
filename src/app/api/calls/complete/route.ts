import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyWorkerRequest } from "@/lib/worker-auth";
import { deductForCall } from "@/lib/billing/balance";

const schema = z.object({
  call_id: z.string().uuid(),
  status: z.enum(["completed", "failed", "no_answer"]),
  ended_at: z.string(),
  duration_seconds: z.number().int().min(0),
  cost_cents: z.number().int().min(0).default(0),
  recording_url: z.string().url().nullable().optional(),
  transcript_url: z.string().url().nullable().optional(),
  summary: z.string().nullable().optional(),
  outcome: z.string().nullable().optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
  const body = parsed.data;
  const svc = createSupabaseServiceClient();

  const { data: call, error } = await svc
    .from("calls")
    .update({
      status: body.status,
      ended_at: body.ended_at,
      duration_seconds: body.duration_seconds,
      cost_cents: body.cost_cents,
      recording_url: body.recording_url ?? null,
      transcript_url: body.transcript_url ?? null,
      summary: body.summary ?? null,
      outcome: body.outcome ?? null,
      sentiment: body.sentiment ?? null,
      metadata: body.metadata ?? {},
    })
    .eq("id", body.call_id)
    .select("id, org_id, campaign_id, contact_id")
    .single();

  if (error || !call) {
    return NextResponse.json({ error: error?.message ?? "not found" }, { status: 500 });
  }

  // Deduct minutes against the org balance for cloud plans. Idempotent on call_id.
  const deduction = await deductForCall(svc, {
    orgId: call.org_id,
    callId: call.id,
    durationSeconds: body.duration_seconds,
  });

  if (call.contact_id) {
    const contactStatus = body.status === "completed" ? "done" : "failed";
    await svc
      .from("campaign_contacts")
      .update({ status: contactStatus, outcome: body.outcome ?? null, last_call_id: call.id })
      .eq("id", call.contact_id);
  }

  if (call.campaign_id) {
    const { count } = await svc
      .from("campaign_contacts")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", call.campaign_id)
      .in("status", ["done", "failed", "skipped"]);
    await svc
      .from("campaigns")
      .update({ completed_contacts: count ?? 0 })
      .eq("id", call.campaign_id);
  }

  return NextResponse.json({
    ok: true,
    deducted_minutes: deduction.deducted,
    balance_after: deduction.balanceAfter,
  });
}
