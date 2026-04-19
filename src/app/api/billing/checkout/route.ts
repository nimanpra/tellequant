import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicAppUrl, getStripe } from "@/lib/stripe";
import {
  priceIdFor,
  priceIdForCreditPack,
  type PlanId,
  type PlanType,
} from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

const SubscriptionBody = z.object({
  kind: z.literal("subscription"),
  plan: z.enum(["solo", "team", "business"]),
  planType: z.enum(["self_host", "cloud"]),
});

const CreditsBody = z.object({
  kind: z.literal("credits"),
  pack: z.enum(["credits_500", "credits_2000", "credits_10000"]),
});

const BodySchema = z.discriminatedUnion("kind", [SubscriptionBody, CreditsBody]);

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
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
    | { id: string; name: string; stripe_customer_id: string | null }
    | undefined;
  if (!org) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const stripe = getStripe();
  const baseUrl = getPublicAppUrl();

  // Lazy-create a Stripe Customer on first purchase.
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

  if (parsed.data.kind === "subscription") {
    const { plan, planType } = parsed.data;
    const priceId = priceIdFor(plan as PlanId, planType as PlanType);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price not configured for ${plan}/${planType}. Set the matching STRIPE_PRICE_* env var.`,
        },
        { status: 500 },
      );
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${baseUrl}/dashboard/billing?checkout=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: org.id,
      subscription_data: {
        metadata: { org_id: org.id, plan, plan_type: planType },
      },
    });
    return NextResponse.json({ url: session.url });
  }

  // kind === "credits"
  const priceId = priceIdForCreditPack(parsed.data.pack);
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price for ${parsed.data.pack} is not configured.` },
      { status: 500 },
    );
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?credits=success`,
    cancel_url: `${baseUrl}/dashboard/billing?credits=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: org.id,
    payment_intent_data: {
      metadata: { org_id: org.id, pack: parsed.data.pack },
    },
    metadata: { org_id: org.id, pack: parsed.data.pack },
  });
  return NextResponse.json({ url: session.url });
}
