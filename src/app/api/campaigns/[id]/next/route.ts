import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyWorkerRequest } from "@/lib/worker-auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const raw = await req.text();
  if (!verifyWorkerRequest(req, raw)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const svc = createSupabaseServiceClient();

  const { data: camp } = await svc
    .from("campaigns")
    .select("*, phone_numbers:from_number_id(e164)")
    .eq("id", id)
    .single();
  if (!camp || camp.status !== "running") {
    return NextResponse.json({ contact: null, reason: "campaign_not_running" });
  }

  const { count: activeCount } = await svc
    .from("calls")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", id)
    .in("status", ["queued", "ringing", "in_progress"]);

  if ((activeCount ?? 0) >= camp.concurrency) {
    return NextResponse.json({ contact: null, reason: "at_concurrency_limit" });
  }

  const { data: contact } = await svc
    .from("campaign_contacts")
    .select("*")
    .eq("campaign_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!contact) {
    await svc.from("campaigns").update({ status: "completed" }).eq("id", id);
    return NextResponse.json({ contact: null, reason: "completed" });
  }

  await svc
    .from("campaign_contacts")
    .update({ status: "calling", attempts: contact.attempts + 1 })
    .eq("id", contact.id);

  return NextResponse.json({
    contact: {
      id: contact.id,
      phone: contact.phone,
      name: contact.name,
      variables: contact.variables,
    },
    campaign: {
      id: camp.id,
      name: camp.name,
      agent_id: camp.agent_id,
      directive: camp.directive,
      from_number: (camp.phone_numbers as { e164: string } | null)?.e164 ?? null,
    },
  });
}
