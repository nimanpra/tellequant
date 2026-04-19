import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { planById, type PlanId, type PlanType } from "@/lib/billing/plans";

export interface BalanceDecision {
  allow: boolean;
  reason?:
    | "free_plan_no_live_calls"
    | "cloud_plan_out_of_credits"
    | "self_host_ok"
    | "cloud_ok"
    | "unknown_org";
  planType: PlanType | null;
  plan: PlanId | null;
  creditsBalanceMinutes: number;
}

type SvcClient = ReturnType<typeof createSupabaseServiceClient>;

/**
 * Hard gate for outbound/inbound live calls. Policy:
 *   - self_host plans: always allowed (user pays their own provider bills).
 *   - cloud plans: allowed iff credits_balance_minutes > 0.
 *   - Free plan: never allowed — demo chat only.
 */
export async function canPlaceCall(
  svc: SvcClient,
  orgId: string,
): Promise<BalanceDecision> {
  const { data: org } = await svc
    .from("organizations")
    .select("plan, plan_type, credits_balance_minutes")
    .eq("id", orgId)
    .single();

  if (!org) {
    return {
      allow: false,
      reason: "unknown_org",
      planType: null,
      plan: null,
      creditsBalanceMinutes: 0,
    };
  }

  const planMeta = planById(org.plan, org.plan_type);
  const balance = org.credits_balance_minutes ?? 0;

  if (org.plan === "free" || planMeta?.demoOnly) {
    return {
      allow: false,
      reason: "free_plan_no_live_calls",
      planType: org.plan_type,
      plan: org.plan,
      creditsBalanceMinutes: balance,
    };
  }

  if (org.plan_type === "self_host") {
    return {
      allow: true,
      reason: "self_host_ok",
      planType: org.plan_type,
      plan: org.plan,
      creditsBalanceMinutes: balance,
    };
  }

  if (balance <= 0) {
    return {
      allow: false,
      reason: "cloud_plan_out_of_credits",
      planType: org.plan_type,
      plan: org.plan,
      creditsBalanceMinutes: balance,
    };
  }

  return {
    allow: true,
    reason: "cloud_ok",
    planType: org.plan_type,
    plan: org.plan,
    creditsBalanceMinutes: balance,
  };
}

/**
 * Deduct call usage from an org's balance. Only consumes credits for cloud
 * plans — self_host billing is already covered by the user's own provider keys,
 * so deduction would double-charge. Idempotency is enforced by call_id in the
 * SQL RPC: a second call with the same call_id is a no-op.
 */
export async function deductForCall(
  svc: SvcClient,
  args: { orgId: string; callId: string; durationSeconds: number },
): Promise<{ deducted: number; balanceAfter: number | null; skipped: boolean }> {
  const minutes = Math.max(0, Math.ceil(args.durationSeconds / 60));
  if (minutes === 0) {
    return { deducted: 0, balanceAfter: null, skipped: true };
  }

  const { data: org } = await svc
    .from("organizations")
    .select("plan_type, credits_balance_minutes")
    .eq("id", args.orgId)
    .single();

  if (!org || org.plan_type !== "cloud") {
    return { deducted: 0, balanceAfter: null, skipped: true };
  }

  const { data: balanceAfter, error } = await svc.rpc("deduct_credits", {
    p_org_id: args.orgId,
    p_minutes: minutes,
    p_call_id: args.callId,
    p_reason: "call_usage",
  });

  if (error) {
    return { deducted: 0, balanceAfter: null, skipped: true };
  }

  return {
    deducted: minutes,
    balanceAfter: typeof balanceAfter === "number" ? balanceAfter : null,
    skipped: false,
  };
}

export function humanReason(reason: BalanceDecision["reason"]): string {
  switch (reason) {
    case "free_plan_no_live_calls":
      return "Your organization is on the Free plan. Upgrade to a paid plan to place live calls.";
    case "cloud_plan_out_of_credits":
      return "Your cloud plan has run out of minutes. Top up with a credit pack from the Billing page.";
    case "unknown_org":
      return "Organization not found.";
    default:
      return "Calls are allowed.";
  }
}
