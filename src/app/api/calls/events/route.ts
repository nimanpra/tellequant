import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyWorkerRequest } from "@/lib/worker-auth";

const schema = z.object({
  call_id: z.string().uuid(),
  events: z
    .array(
      z.object({
        kind: z.string().min(1).max(50),
        at: z.string(),
        payload: z.record(z.string(), z.unknown()).default({}),
      })
    )
    .min(1)
    .max(200),
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
  const { call_id, events } = parsed.data;
  const svc = createSupabaseServiceClient();

  const rows = events.map((e) => ({
    call_id,
    kind: e.kind,
    at: e.at,
    payload: e.payload,
  }));

  const { error } = await svc.from("call_events").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
