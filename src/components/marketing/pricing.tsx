"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, CREDIT_PACKS, type Plan, type PlanType } from "@/lib/billing/plans";

export function Pricing() {
  const [planType, setPlanType] = useState<PlanType>("cloud");

  const free = PLANS.find((p) => p.id === "free")!;
  const paid = PLANS.filter(
    (p) => p.planType === planType && p.group !== "Free" && !p.contactOnly,
  );

  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#98C9FF]">
            Pricing
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
            Flat subscription. Bring your own keys.
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            Pick a plan, connect your Twilio / Deepgram / LLM keys, and pay provider
            usage at cost — not marked up. Every tier includes the full product.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => setPlanType("cloud")}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
                (planType === "cloud"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-zinc-200")
              }
            >
              Cloud-hosted
            </button>
            <button
              type="button"
              onClick={() => setPlanType("self_host")}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
                (planType === "self_host"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-zinc-200")
              }
            >
              Self-hosted
            </button>
          </div>
        </div>

        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-500">
          {planType === "cloud"
            ? "We run the voice worker for you. Monthly minutes included; top up anytime with credit packs."
            : "Run the Python worker on your own infrastructure. Unlimited minutes* — your provider bills stay yours."}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <PricingCard plan={free} href="/signup" ctaOverride="Start for free" />
          {paid.map((p) => (
            <PricingCard
              key={`${p.id}-${p.planType}`}
              plan={p}
              href={`/signup?plan=${p.id}&type=${p.planType}`}
            />
          ))}
        </div>

        {planType === "self_host" && (
          <p className="mt-4 text-center text-xs text-zinc-500">
            * Unlimited platform minutes on self-host. Fair-use limits apply for
            anti-abuse. Provider minutes (Twilio, Deepgram, LLM) are billed directly
            by the provider on your own account.
          </p>
        )}

        <div className="mt-20">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#98C9FF]">
              Credit packs
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">
              Top up Cloud plans anytime
            </h3>
            <p className="mt-3 text-sm text-zinc-400">
              One-time packs stack with your monthly inclusion and never expire.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {CREDIT_PACKS.map((pk) => (
              <div
                key={pk.id}
                className={
                  "relative flex flex-col gap-3 rounded-2xl border p-6 " +
                  (pk.highlight
                    ? "border-[#3E5CF8]/50 bg-gradient-to-b from-[#3E5CF8]/10 to-white/[0.01]"
                    : "border-white/[0.08] bg-white/[0.02]")
                }
              >
                {pk.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-[#3E5CF8]/60 bg-[#3E5CF8] px-3 py-0.5 text-[11px] font-semibold tracking-wide text-white">
                    BEST VALUE
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-neutral-50">
                    {pk.priceDisplay}
                  </span>
                  <span className="text-sm text-zinc-500">one-time</span>
                </div>
                <div className="text-sm text-zinc-300">
                  {pk.minutes.toLocaleString()} minutes
                  <span className="text-zinc-500"> · {pk.perMinute}</span>
                </div>
                <p className="text-sm text-zinc-400">{pk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  plan: Plan;
  href: string;
  ctaOverride?: string;
}

function PricingCard({ plan, href, ctaOverride }: PricingCardProps) {
  return (
    <div
      className={
        "relative flex flex-col gap-6 rounded-2xl border p-7 " +
        (plan.highlight
          ? "border-[#3E5CF8]/50 bg-gradient-to-b from-[#3E5CF8]/10 to-white/[0.01] shadow-[0_40px_80px_-40px_rgba(62,92,248,0.5)]"
          : "border-white/[0.08] bg-white/[0.02]")
      }
    >
      {plan.highlight && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-[#3E5CF8]/60 bg-[#3E5CF8] px-3 py-0.5 text-[11px] font-semibold tracking-wide text-white shadow-[0_4px_16px_rgba(62,92,248,0.6)]">
          MOST POPULAR
        </span>
      )}
      <div>
        <h3 className="text-xl font-semibold text-neutral-50">{plan.name}</h3>
        <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight text-neutral-50">
          {plan.priceDisplay}
        </span>
        <span className="text-sm text-zinc-500">{plan.perDisplay}</span>
      </div>
      <ul className="flex flex-col gap-2.5 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-zinc-300">
            <Check
              className={
                "mt-0.5 h-4 w-4 shrink-0 " +
                (plan.highlight ? "text-[#98C9FF]" : "text-emerald-400")
              }
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild variant={plan.highlight ? "primary" : "secondary"} className="mt-auto">
        <Link href={href}>{ctaOverride ?? plan.ctaLabel}</Link>
      </Button>
    </div>
  );
}
