"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "Free",
    suffix: "forever",
    description: "For prototyping and personal projects.",
    features: [
      "100 inbound minutes / month",
      "1 AI agent · 1 phone number",
      "100MB knowledge base",
      "Community support",
      "Deepgram + Gemini free tier",
    ],
    cta: "Start for free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    suffix: "/mo + usage",
    description: "For growing teams running real call flows.",
    features: [
      "2,500 inbound minutes / month",
      "Unlimited agents · 10 numbers",
      "10GB knowledge base",
      "Outbound campaigns (CSV)",
      "Webhooks + function tools",
      "Call recording + analytics",
      "Usage billed at $0.07/min after",
    ],
    cta: "Start 14-day trial",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Scale",
    price: "Custom",
    suffix: "",
    description: "For organizations with compliance needs.",
    features: [
      "Volume pricing (from $0.045/min)",
      "Unlimited numbers + agents",
      "Dedicated vector cluster",
      "SOC-2, HIPAA BAA, SSO/SAML",
      "Private voice model cloning",
      "White-label + API platform",
      "Pooled concurrency SLA",
    ],
    cta: "Talk to sales",
    href: "/contact",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#98C9FF]">
            Pricing
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
            Pay for what you talk.
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            No setup fees. No minimums. Bring your own voice + LLM API keys to cut usage cost ~40%.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                "relative flex flex-col gap-6 rounded-2xl border p-7 " +
                (p.highlight
                  ? "border-[#3E5CF8]/50 bg-gradient-to-b from-[#3E5CF8]/10 to-white/[0.01] shadow-[0_40px_80px_-40px_rgba(62,92,248,0.5)]"
                  : "border-white/[0.08] bg-white/[0.02]")
              }
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-[#3E5CF8]/60 bg-[#3E5CF8] px-3 py-0.5 text-[11px] font-semibold tracking-wide text-white shadow-[0_4px_16px_rgba(62,92,248,0.6)]">
                  MOST POPULAR
                </span>
              )}
              <div>
                <h3 className="text-xl font-semibold text-neutral-50">{p.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{p.description}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-neutral-50">
                  {p.price}
                </span>
                <span className="text-sm text-zinc-500">{p.suffix}</span>
              </div>
              <ul className="flex flex-col gap-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-zinc-300">
                    <Check
                      className={
                        "mt-0.5 h-4 w-4 shrink-0 " +
                        (p.highlight ? "text-[#98C9FF]" : "text-emerald-400")
                      }
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={p.highlight ? "primary" : "secondary"} className="mt-auto">
                <Link href={p.href}>{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
