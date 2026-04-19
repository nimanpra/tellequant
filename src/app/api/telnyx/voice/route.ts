import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Telnyx TeXML is shape-compatible with TwiML, including the <Stream> verb.
// Accepts the same form-encoded payload Twilio uses: From, To, CallSid.
export async function POST(req: Request) {
  const form = await req.formData();
  const from = String(form.get("From") ?? "");
  const to = String(form.get("To") ?? "");
  const callSid = String(form.get("CallSid") ?? "");

  const svc = createSupabaseServiceClient();

  const { data: number } = await svc
    .from("phone_numbers")
    .select("id, org_id, agent_id")
    .eq("e164", to)
    .eq("is_active", true)
    .maybeSingle();

  if (!number?.agent_id) {
    return texml(
      `<Response><Say voice="Polly.Joanna">This number is not configured. Goodbye.</Say><Hangup/></Response>`,
    );
  }

  const { data: call } = await svc
    .from("calls")
    .insert({
      org_id: number.org_id,
      agent_id: number.agent_id,
      phone_number_id: number.id,
      campaign_id: null,
      contact_id: null,
      direction: "inbound",
      from_number: from,
      to_number: to,
      status: "in_progress",
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_seconds: 0,
      cost_cents: 0,
      recording_url: null,
      transcript_url: null,
      summary: null,
      outcome: null,
      sentiment: null,
      metadata: { telnyx_call_sid: callSid },
    })
    .select("id")
    .single();

  const workerUrl = process.env.VOICE_WORKER_WS_URL;
  if (!workerUrl || !call) {
    return texml(
      `<Response><Say voice="Polly.Joanna">Voice worker unavailable. Please try again later.</Say><Hangup/></Response>`,
    );
  }

  const url = new URL(workerUrl);
  url.searchParams.set("call_id", call.id);
  url.searchParams.set("agent_id", number.agent_id);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(url.toString())}">
      <Parameter name="call_id" value="${call.id}"/>
      <Parameter name="agent_id" value="${number.agent_id}"/>
    </Stream>
  </Connect>
</Response>`;

  return texml(xml);
}

function texml(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: { "content-type": "text/xml" },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
