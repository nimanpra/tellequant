export type PlanId = "free" | "pro" | "scale";

export interface Plan {
  id: PlanId;
  name: string;
  priceDisplay: string;
  perDisplay: string;
  description: string;
  features: string[];
  includedMinutes: number;
  priceEnv: string | null; // env var that holds the Stripe Price ID for this plan
  ctaLabel: string;
  highlight: boolean;
  contactOnly?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceDisplay: "$0",
    perDisplay: "forever",
    description: "Get a feel for Tellequant. Bring your own keys.",
    features: [
      "100 minutes / mo included",
      "1 workspace, 2 agents",
      "Community support",
      "Self-hosted voice worker",
    ],
    includedMinutes: 100,
    priceEnv: null,
    ctaLabel: "Current plan",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    priceDisplay: "$49",
    perDisplay: "per month",
    description: "For small teams running real campaigns.",
    features: [
      "2,000 minutes / mo included",
      "Unlimited agents",
      "Priority support",
      "Custom voices (ElevenLabs)",
      "DPA available",
    ],
    includedMinutes: 2000,
    priceEnv: "STRIPE_PRICE_ID_PRO",
    ctaLabel: "Upgrade",
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    priceDisplay: "Custom",
    perDisplay: "contact us",
    description: "High-volume call centers, dedicated infra.",
    features: [
      "Volume pricing per minute",
      "Dedicated voice worker",
      "SSO + SCIM",
      "SLA + 24/7 support",
      "Custom LLM routing",
    ],
    includedMinutes: 0,
    priceEnv: null,
    ctaLabel: "Contact sales",
    highlight: false,
    contactOnly: true,
  },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function priceIdForPlan(id: PlanId): string | null {
  const plan = planById(id);
  if (!plan?.priceEnv) return null;
  return process.env[plan.priceEnv] ?? null;
}
