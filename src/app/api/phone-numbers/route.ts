import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTelephonyProvider } from "@/lib/telephony";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const area = url.searchParams.get("area") ?? undefined;
  // If search param is present, return telephony inventory from the default provider
  if (url.searchParams.has("search")) {
    try {
      const provider = getTelephonyProvider();
      const results = await provider.searchAvailableNumbers(area);
      return NextResponse.json({ results, provider: provider.name });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Search failed" },
        { status: 500 },
      );
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("phone_numbers")
    .select("*, agents(name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ numbers: data });
}

const PurchaseSchema = z.object({
  e164: z.string().regex(/^\+\d{7,15}$/),
  friendly_name: z.string().optional(),
  agent_id: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const parsed = PurchaseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

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

  const publicBaseUrl = process.env.PUBLIC_WEBHOOK_URL ?? "http://localhost:3000";
  const provider = getTelephonyProvider();

  let purchased;
  try {
    purchased = await provider.purchaseNumber(parsed.data.e164, publicBaseUrl);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : `${provider.name} purchase failed`,
      },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("phone_numbers")
    .insert({
      org_id: mem.org_id,
      e164: parsed.data.e164,
      friendly_name: parsed.data.friendly_name,
      provider: provider.name,
      provider_sid: purchased.sid,
      agent_id: parsed.data.agent_id,
      is_active: true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ number: data });
}
