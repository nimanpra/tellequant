import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicAppUrl, getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("memberships")
    .select("organizations(id, stripe_customer_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const org = membership?.organizations as
    | { id: string; stripe_customer_id: string | null }
    | undefined;
  if (!org?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer on file. Start a subscription first." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${getPublicAppUrl()}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
