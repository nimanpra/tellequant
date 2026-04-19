// =============================================================================
// Tellequant plans.
//
// Pricing model: BYOK + subscription (+ optional prepaid credits for cloud).
//   - Free: demo chat only (no phone, no voice), no cost to platform.
//   - Self-host tiers: flat subscription, user runs the Python worker locally.
//     Platform cost per user is effectively zero.
//   - Cloud tiers: flat subscription with an included bundle of compute-minutes
//     per month; overage and top-ups are sold via credit packs. Platform charges
//     well above its compute cost (Fly.io ~$0.005/min) so every minute = profit.
// =============================================================================

export type PlanId = "free" | "solo" | "team" | "business" | "pro" | "scale";
export type PlanType = "self_host" | "cloud";

export interface Plan {
  id: PlanId;
  planType: PlanType;
  name: string;
  group: "Free" | "Self-hosted" | "Cloud";
  priceDisplay: string;
  perDisplay: string;
  description: string;
  features: string[];
  includedMinutes: number;
  /** Env var holding the Stripe Price ID for this SKU; null for free/contact-only. */
  priceEnv: string | null;
  ctaLabel: string;
  highlight: boolean;
  contactOnly?: boolean;
  /** true = demo chat only, no live calls anywhere. */
  demoOnly?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    planType: "self_host",
    name: "Free",
    group: "Free",
    priceDisplay: "$0",
    perDisplay: "forever",
    description:
      "Try every feature in a typed demo chat. No phone, no calls — connect your provider keys and upgrade when you’re ready.",
    features: [
      "3 demo chat sessions / day",
      "1 agent, 1 knowledge base",
      "BYOK (provider keys required for live calls)",
      "Community support",
    ],
    includedMinutes: 0,
    priceEnv: null,
    ctaLabel: "Current plan",
    highlight: false,
    demoOnly: true,
  },

  // --- Self-hosted tiers — user runs the Python voice worker ----------------
  {
    id: "solo",
    planType: "self_host",
    name: "Solo",
    group: "Self-hosted",
    priceDisplay: "$19",
    perDisplay: "per month",
    description: "For one operator. Run the worker on your box.",
    features: [
      "Unlimited call minutes*",
      "3 agents · 1 knowledge base",
      "BYOK (all providers)",
      "Docker self-host worker",
      "Community support",
    ],
    includedMinutes: 0, // self-host has no platform compute
    priceEnv: "STRIPE_PRICE_SOLO_SELF_HOST",
    ctaLabel: "Choose Solo",
    highlight: false,
  },
  {
    id: "team",
    planType: "self_host",
    name: "Team",
    group: "Self-hosted",
    priceDisplay: "$49",
    perDisplay: "per month",
    description: "For small teams running real campaigns.",
    features: [
      "Unlimited call minutes*",
      "Unlimited agents · 5 KBs",
      "BYOK (all providers)",
      "Priority email support",
      "Team roles & audit log",
    ],
    includedMinutes: 0,
    priceEnv: "STRIPE_PRICE_TEAM_SELF_HOST",
    ctaLabel: "Choose Team",
    highlight: true,
  },
  {
    id: "business",
    planType: "self_host",
    name: "Business",
    group: "Self-hosted",
    priceDisplay: "$149",
    perDisplay: "per month",
    description: "For regulated teams. SSO, DPA, dedicated Slack.",
    features: [
      "Unlimited call minutes*",
      "Unlimited agents & KBs",
      "SSO + SCIM",
      "DPA + recording retention controls",
      "Dedicated Slack channel",
    ],
    includedMinutes: 0,
    priceEnv: "STRIPE_PRICE_BUSINESS_SELF_HOST",
    ctaLabel: "Choose Business",
    highlight: false,
  },

  // --- Cloud tiers — platform runs the worker -------------------------------
  {
    id: "solo",
    planType: "cloud",
    name: "Cloud Solo",
    group: "Cloud",
    priceDisplay: "$29",
    perDisplay: "per month",
    description: "We host the voice worker. Zero DevOps on your side.",
    features: [
      "200 call minutes / month",
      "3 agents · 1 KB",
      "BYOK (all providers)",
      "Top up with credit packs",
      "Community support",
    ],
    includedMinutes: 200,
    priceEnv: "STRIPE_PRICE_SOLO_CLOUD",
    ctaLabel: "Choose Cloud Solo",
    highlight: false,
  },
  {
    id: "team",
    planType: "cloud",
    name: "Cloud Team",
    group: "Cloud",
    priceDisplay: "$79",
    perDisplay: "per month",
    description: "Hosted worker for small teams.",
    features: [
      "1,000 call minutes / month",
      "Unlimited agents · 5 KBs",
      "BYOK (all providers)",
      "Priority email support",
      "Credit pack top-ups",
    ],
    includedMinutes: 1000,
    priceEnv: "STRIPE_PRICE_TEAM_CLOUD",
    ctaLabel: "Choose Cloud Team",
    highlight: true,
  },
  {
    id: "business",
    planType: "cloud",
    name: "Cloud Business",
    group: "Cloud",
    priceDisplay: "$249",
    perDisplay: "per month",
    description: "Hosted worker with SSO, DPA, and 24/7 support.",
    features: [
      "5,000 call minutes / month",
      "Unlimited agents & KBs",
      "SSO + SCIM · DPA",
      "Dedicated Slack · 24/7 support",
      "Best rate on credit packs",
    ],
    includedMinutes: 5000,
    priceEnv: "STRIPE_PRICE_BUSINESS_CLOUD",
    ctaLabel: "Choose Cloud Business",
    highlight: false,
  },

  // --- Back-compat legacy IDs (so old records keep resolving) ---------------
  // These shouldn't appear in the pricing table; hidden via `contactOnly`.
  {
    id: "pro",
    planType: "self_host",
    name: "Pro (legacy)",
    group: "Self-hosted",
    priceDisplay: "—",
    perDisplay: "legacy",
    description: "Legacy plan, renamed to Team.",
    features: [],
    includedMinutes: 0,
    priceEnv: null,
    ctaLabel: "Legacy",
    highlight: false,
    contactOnly: true,
  },
  {
    id: "scale",
    planType: "cloud",
    name: "Scale (legacy)",
    group: "Cloud",
    priceDisplay: "—",
    perDisplay: "legacy",
    description: "Legacy plan, renamed to Cloud Business.",
    features: [],
    includedMinutes: 0,
    priceEnv: null,
    ctaLabel: "Legacy",
    highlight: false,
    contactOnly: true,
  },
];

export function planById(id: string, planType?: PlanType): Plan | undefined {
  if (planType) {
    return PLANS.find((p) => p.id === id && p.planType === planType);
  }
  return PLANS.find((p) => p.id === id);
}

export function priceIdFor(id: PlanId, planType: PlanType): string | null {
  const plan = planById(id, planType);
  if (!plan?.priceEnv) return null;
  return process.env[plan.priceEnv] ?? null;
}

/**
 * Map a Stripe Price ID back to (plan, plan_type). Used by the subscription
 * webhook so a single webhook handler drives every SKU.
 */
export function planFromPriceId(
  priceId: string,
): { plan: PlanId; planType: PlanType } | null {
  for (const p of PLANS) {
    if (p.contactOnly || !p.priceEnv) continue;
    if (process.env[p.priceEnv] === priceId) {
      return { plan: p.id, planType: p.planType };
    }
  }
  return null;
}

// =============================================================================
// Credit packs — one-time Stripe Checkout payments that top up the
// organizations.credits_balance_minutes column via grant_credits().
// =============================================================================

export interface CreditPack {
  id: string;
  minutes: number;
  priceDisplay: string;
  perMinute: string;
  description: string;
  priceEnv: string;
  highlight?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "credits_500",
    minutes: 500,
    priceDisplay: "$19",
    perMinute: "$0.038/min",
    description: "Starter top-up.",
    priceEnv: "STRIPE_PRICE_CREDITS_500",
  },
  {
    id: "credits_2000",
    minutes: 2000,
    priceDisplay: "$59",
    perMinute: "$0.030/min",
    description: "Best for a full campaign month.",
    priceEnv: "STRIPE_PRICE_CREDITS_2000",
    highlight: true,
  },
  {
    id: "credits_10000",
    minutes: 10000,
    priceDisplay: "$249",
    perMinute: "$0.025/min",
    description: "Power users and high-volume teams.",
    priceEnv: "STRIPE_PRICE_CREDITS_10000",
  },
];

export function creditPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function priceIdForCreditPack(id: string): string | null {
  const pack = creditPackById(id);
  if (!pack) return null;
  return process.env[pack.priceEnv] ?? null;
}

/** Reverse lookup used by the webhook. */
export function creditPackFromPriceId(priceId: string): CreditPack | null {
  for (const p of CREDIT_PACKS) {
    if (process.env[p.priceEnv] === priceId) return p;
  }
  return null;
}
