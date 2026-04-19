import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Webhook not configured (missing signature or STRIPE_WEBHOOK_SECRET)" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook verification failed: ${msg}` }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.client_reference_id;
      if (orgId && session.subscription && session.customer) {
        await svc
          .from("organizations")
          .update({
            stripe_customer_id: String(session.customer),
            stripe_subscription_id: String(session.subscription),
          })
          .eq("id", orgId);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const plan = planFromPriceId(priceId);
      const status = sub.status as Stripe.Subscription.Status;
      const periodEndSec =
        (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null;

      await svc
        .from("organizations")
        .update({
          stripe_subscription_id: sub.id,
          subscription_status: status,
          plan: sub.status === "canceled" ? "free" : plan,
          current_period_end: periodEndSec
            ? new Date(periodEndSec * 1000).toISOString()
            : null,
        })
        .eq("stripe_customer_id", String(sub.customer));
      break;
    }

    default:
      // Other events are acknowledged with 200 but not processed.
      break;
  }

  return NextResponse.json({ received: true });
}

function planFromPriceId(priceId: string | null): PlanId {
  if (!priceId) return "free";
  for (const p of PLANS) {
    if (!p.priceEnv) continue;
    if (process.env[p.priceEnv] === priceId) return p.id;
  }
  return "free";
}
