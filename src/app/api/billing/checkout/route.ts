import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicAppUrl, getStripe } from "@/lib/stripe";
import { priceIdForPlan, type PlanId } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  plan: z.enum(["pro"]),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, organizations(id, name, stripe_customer_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const org = membership?.organizations as
    | {
        id: string;
        name: string;
        stripe_customer_id: string | null;
      }
    | undefined;
  if (!org) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const priceId = priceIdForPlan(parsed.data.plan as PlanId);
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Price ID for plan '${parsed.data.plan}' is not configured. Set STRIPE_PRICE_ID_${parsed.data.plan.toUpperCase()} in env.`,
      },
      { status: 500 },
    );
  }

  const stripe = getStripe();

  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: org.name,
      metadata: { org_id: org.id, user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  const baseUrl = getPublicAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${baseUrl}/dashboard/billing?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: org.id,
    subscription_data: {
      metadata: { org_id: org.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
