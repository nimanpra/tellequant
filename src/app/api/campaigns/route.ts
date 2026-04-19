import { NextResponse } from "next/server";
import { z } from "zod";
import Papa from "papaparse";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CampaignSchema = z.object({
  name: z.string().min(1).max(80),
  agent_id: z.string().uuid(),
  from_number_id: z.string().uuid(),
  directive: z.string().min(10),
  concurrency: z.number().int().min(1).max(50).default(3),
  retries: z.number().int().min(0).max(5).default(2),
  retry_delay_minutes: z.number().int().min(5).max(1440).default(30),
  schedule_start: z.string().datetime().optional(),
  schedule_window_start: z.string().optional(),
  schedule_window_end: z.string().optional(),
  contacts_csv: z.string(), // raw csv
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, agents(name), phone_numbers:from_number_id(e164)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(req: Request) {
  const parsed = CampaignSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: mem } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!mem) return NextResponse.json({ error: "No org" }, { status: 400 });

  const parsedCsv = Papa.parse<Record<string, string>>(parsed.data.contacts_csv, {
    header: true,
    skipEmptyLines: true,
  });
  const contacts = (parsedCsv.data as Record<string, string>[])
    .map((row) => {
      const phone =
        row.phone ?? row.Phone ?? row.PHONE ?? row.number ?? row.Number ?? row["Phone Number"];
      if (!phone) return null;
      const { phone: _, ...rest } = row;
      return { phone: String(phone).trim(), name: row.name ?? row.Name ?? null, variables: rest };
    })
    .filter(Boolean) as { phone: string; name: string | null; variables: Record<string, string> }[];

  if (contacts.length === 0)
    return NextResponse.json({ error: "CSV has no valid rows (need a 'phone' column)" }, { status: 400 });

  const { data: camp, error: campErr } = await supabase
    .from("campaigns")
    .insert({
      org_id: mem.org_id,
      name: parsed.data.name,
      agent_id: parsed.data.agent_id,
      directive: parsed.data.directive,
      from_number_id: parsed.data.from_number_id,
      status: "draft",
      concurrency: parsed.data.concurrency,
      retries: parsed.data.retries,
      retry_delay_minutes: parsed.data.retry_delay_minutes,
      schedule_start: parsed.data.schedule_start,
      schedule_window_start: parsed.data.schedule_window_start,
      schedule_window_end: parsed.data.schedule_window_end,
    })
    .select()
    .single();
  if (campErr || !camp) return NextResponse.json({ error: campErr?.message }, { status: 500 });

  const rows = contacts.map((c) => ({
    campaign_id: camp.id,
    name: c.name,
    phone: c.phone,
    variables: c.variables,
  }));
  const { error: contactsErr } = await supabase.from("campaign_contacts").insert(rows);
  if (contactsErr) return NextResponse.json({ error: contactsErr.message }, { status: 500 });

  await supabase
    .from("campaigns")
    .update({ total_contacts: rows.length })
    .eq("id", camp.id);

  return NextResponse.json({ campaign: { ...camp, total_contacts: rows.length } });
}
