import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import {
  creditPackById,
  planById,
  planFromPriceId,
  type PlanId,
  type PlanType,
} from "@/lib/billing/plans";

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
      const orgId =
        session.client_reference_id ??
        (typeof session.metadata?.org_id === "string" ? session.metadata.org_id : null);

      if (!orgId) break;

      if (session.mode === "subscription" && session.subscription && session.customer) {
        await svc
          .from("organizations")
          .update({
            stripe_customer_id: String(session.customer),
            stripe_subscription_id: String(session.subscription),
          })
          .eq("id", orgId);
      }

      if (session.mode === "payment" && session.payment_status === "paid") {
        // Credit pack purchase. Find the pack from line items or metadata.
        const packId = typeof session.metadata?.pack === "string" ? session.metadata.pack : null;
        if (packId) {
          await grantPackById(svc, orgId, packId, session.payment_intent);
        }
      }
      break;
    }

    // Subscription lifecycle — drives plan + plan_type + status columns.
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const mapped = priceId ? planFromPriceId(priceId) : null;
      const status = sub.status as Stripe.Subscription.Status;
      const periodEndSec =
        (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null;

      const planUpdate: {
        plan?: PlanId;
        plan_type?: PlanType;
      } = {};
      if (sub.status === "canceled") {
        planUpdate.plan = "free";
        planUpdate.plan_type = "self_host";
      } else if (mapped) {
        planUpdate.plan = mapped.plan;
        planUpdate.plan_type = mapped.planType;
      }

      await svc
        .from("organizations")
        .update({
          ...planUpdate,
          stripe_subscription_id: sub.id,
          subscription_status: status,
          current_period_end: periodEndSec
            ? new Date(periodEndSec * 1000).toISOString()
            : null,
        })
        .eq("stripe_customer_id", String(sub.customer));
      break;
    }

    // Monthly invoice → top up included cloud minutes for the new billing period.
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer ? String(invoice.customer) : null;
      if (!customerId) break;

      const { data: org } = await svc
        .from("organizations")
        .select("id, plan, plan_type")
        .eq("stripe_customer_id", customerId)
        .single();
      if (!org || org.plan_type !== "cloud") break;

      const plan = planById(org.plan, "cloud");
      if (!plan || plan.includedMinutes <= 0) break;

      await svc.rpc("grant_credits", {
        p_org_id: org.id,
        p_minutes: plan.includedMinutes,
        p_reason: "subscription_grant",
        p_stripe_payment_intent_id: null,
        p_stripe_invoice_id: invoice.id ?? null,
        p_note: `Monthly grant for ${plan.name}`,
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function grantPackById(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  orgId: string,
  packId: string,
  paymentIntentId: string | Stripe.PaymentIntent | null,
) {
  const pack = creditPackById(packId);
  if (!pack) return;

  const intentId =
    typeof paymentIntentId === "string"
      ? paymentIntentId
      : paymentIntentId
        ? paymentIntentId.id
        : null;

  await svc.rpc("grant_credits", {
    p_org_id: orgId,
    p_minutes: pack.minutes,
    p_reason: "credit_pack",
    p_stripe_payment_intent_id: intentId,
    p_stripe_invoice_id: null,
    p_note: `Credit pack ${pack.id}`,
  });
}
