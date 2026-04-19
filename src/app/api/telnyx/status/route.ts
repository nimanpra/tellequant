import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAP: Record<string, "completed" | "failed" | "no_answer" | "in_progress"> = {
  completed: "completed",
  failed: "failed",
  busy: "failed",
  "no-answer": "no_answer",
  canceled: "failed",
  "in-progress": "in_progress",
};

export async function POST(req: Request) {
  const form = await req.formData();
  const callSid = String(form.get("CallSid") ?? "");
  const status = String(form.get("CallStatus") ?? "");
  const recordingUrl = form.get("RecordingUrl");
  const duration = Number(form.get("CallDuration") ?? 0);

  const mapped = MAP[status];
  if (!mapped || !callSid) return NextResponse.json({ ok: true });

  const svc = createSupabaseServiceClient();
  const update: Record<string, unknown> = { status: mapped };
  if (mapped !== "in_progress") {
    update.ended_at = new Date().toISOString();
    update.duration_seconds = Number.isFinite(duration) ? duration : 0;
  }
  if (recordingUrl) update.recording_url = String(recordingUrl);

  await svc
    .from("calls")
    .update(update)
    .contains("metadata", { telnyx_call_sid: callSid });
  return NextResponse.json({ ok: true });
}
