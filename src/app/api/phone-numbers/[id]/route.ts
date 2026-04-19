import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTelephonyProviderByName } from "@/lib/telephony";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const body = await req.json();
  const { data, error } = await supabase
    .from("phone_numbers")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ number: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: n } = await supabase
    .from("phone_numbers")
    .select("provider, provider_sid")
    .eq("id", id)
    .single();
  if (n?.provider_sid) {
    try {
      const provider = getTelephonyProviderByName(n.provider);
      await provider.releaseNumber(n.provider_sid);
    } catch {
      /* continue and delete from DB regardless — the remote number may already be gone */
    }
  }
  const { error } = await supabase.from("phone_numbers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
