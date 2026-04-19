import { Check, Zap } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { CREDIT_PACKS, PLANS, planById } from "@/lib/billing/plans";
import { BillingActions } from "@/components/dashboard/billing-actions";

export const dynamic = "force-dynamic";

function monthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  return { start, end };
}

export default async function BillingPage() {
  const { supabase, org } = await requireOrg();
  const { start, end } = monthRange();

  const { data: calls } = await supabase
    .from("calls")
    .select("duration_seconds")
    .eq("org_id", org.id)
    .gte("started_at", start)
    .lt("started_at", end);

  const usedSeconds = (calls ?? []).reduce(
    (acc, c) => acc + (c.duration_seconds ?? 0),
    0,
  );
  const usedMinutes = Math.ceil(usedSeconds / 60);

  const planType = (org.plan_type ?? "self_host") as "self_host" | "cloud";
  const currentPlan = planById(org.plan, planType) ?? PLANS[0];
  const balance = org.credits_balance_minutes ?? 0;
  const hasCustomer = Boolean(org.stripe_customer_id);

  const selfHostPlans = PLANS.filter(
    (p) => p.group === "Self-hosted" && !p.contactOnly,
  );
  const cloudPlans = PLANS.filter((p) => p.group === "Cloud" && !p.contactOnly);
  const freePlan = PLANS.find((p) => p.id === "free");

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Billing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Current plan ·{" "}
          <span className="text-neutral-50">{currentPlan.name}</span>
          {org.subscription_status ? (
            <>
              {" · "}
              <span className="capitalize text-zinc-300">
                {String(org.subscription_status).replaceAll("_", " ")}
              </span>
            </>
          ) : null}
          . All provider costs (Telnyx, Groq, Deepgram, etc.) are billed to your keys directly.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            This month ({planType === "cloud" ? "cloud compute" : "calls"})
          </div>
          <div className="mt-1 flex items-end justify-between">
            <div className="text-2xl font-semibold text-neutral-50">
              {usedMinutes.toLocaleString()}{" "}
              <span className="text-base font-normal text-zinc-400">
                {planType === "cloud" && currentPlan.includedMinutes > 0
                  ? `/ ${currentPlan.includedMinutes.toLocaleString()} min`
                  : "min"}
              </span>
            </div>
            {hasCustomer ? <BillingActions intent="portal" /> : null}
          </div>
          {planType === "cloud" && currentPlan.includedMinutes > 0 ? (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full bg-[#3E5CF8]"
                style={{
                  width: `${Math.min(100, Math.round((usedMinutes / currentPlan.includedMinutes) * 100))}%`,
                }}
              />
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Credit balance</div>
          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-neutral-50">
                {balance.toLocaleString()}{" "}
                <span className="text-base font-normal text-zinc-400">min</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {planType === "cloud"
                  ? "Used after your monthly allotment runs out. Never expires."
                  : "Self-hosted plans don’t consume platform credits."}
              </p>
            </div>
            <Zap className="h-6 w-6 text-[#98C9FF]" />
          </div>
        </Card>
      </div>

      {/* --- Self-hosted plans --- */}
      <div className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-50">Self-hosted plans</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Run the voice worker on your own machine or cloud. Zero platform compute fees.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {selfHostPlans.map((p) => {
            const isCurrent = p.id === org.plan && planType === "self_host";
            return (
              <Card
                key={`${p.id}-${p.planType}`}
                className={
                  p.highlight
                    ? "relative border-[#3E5CF8]/40 bg-gradient-to-b from-[#3E5CF8]/10 to-transparent p-6"
                    : "p-6"
                }
              >
                <div className="text-sm font-medium text-neutral-50">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold text-neutral-50">{p.priceDisplay}</div>
                  <div className="text-xs text-zinc-500">{p.perDisplay}</div>
                </div>
                <p className="mt-2 text-xs text-zinc-400">{p.description}</p>
                <ul className="mt-5 flex flex-col gap-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#98C9FF]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <BillingActions
                  intent={isCurrent ? "current" : "upgrade"}
                  plan={p.id}
                  planType={p.planType}
                  highlight={p.highlight}
                  label={isCurrent ? "Current plan" : p.ctaLabel}
                />
              </Card>
            );
          })}
        </div>
      </div>

      {/* --- Cloud plans --- */}
      <div className="mt-12">
        <div>
          <h2 className="text-lg font-semibold text-neutral-50">Cloud plans</h2>
          <p className="mt-1 text-sm text-zinc-400">
            We host the Python voice worker. Included minutes reset monthly; top up with credits.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cloudPlans.map((p) => {
            const isCurrent = p.id === org.plan && planType === "cloud";
            return (
              <Card
                key={`${p.id}-${p.planType}`}
                className={
                  p.highlight
                    ? "relative border-[#3E5CF8]/40 bg-gradient-to-b from-[#3E5CF8]/10 to-transparent p-6"
                    : "p-6"
                }
              >
                <div className="text-sm font-medium text-neutral-50">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold text-neutral-50">{p.priceDisplay}</div>
                  <div className="text-xs text-zinc-500">{p.perDisplay}</div>
                </div>
                <p className="mt-2 text-xs text-zinc-400">{p.description}</p>
                <ul className="mt-5 flex flex-col gap-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#98C9FF]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <BillingActions
                  intent={isCurrent ? "current" : "upgrade"}
                  plan={p.id}
                  planType={p.planType}
                  highlight={p.highlight}
                  label={isCurrent ? "Current plan" : p.ctaLabel}
                />
              </Card>
            );
          })}
        </div>
      </div>

      {/* --- Credit packs --- */}
      <div className="mt-12">
        <div>
          <h2 className="text-lg font-semibold text-neutral-50">Credit packs</h2>
          <p className="mt-1 text-sm text-zinc-400">
            One-time top-ups for cloud plans. Minutes never expire and roll over across months.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {CREDIT_PACKS.map((p) => (
            <Card
              key={p.id}
              className={
                p.highlight
                  ? "relative border-[#3E5CF8]/40 bg-gradient-to-b from-[#3E5CF8]/10 to-transparent p-6"
                  : "p-6"
              }
            >
              <div className="text-sm font-medium text-neutral-50">
                {p.minutes.toLocaleString()} minutes
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-3xl font-semibold text-neutral-50">{p.priceDisplay}</div>
                <div className="text-xs text-zinc-500">{p.perMinute}</div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">{p.description}</p>
              <BillingActions
                intent="credits"
                pack={p.id as "credits_500" | "credits_2000" | "credits_10000"}
                highlight={p.highlight}
                label={`Buy ${p.minutes.toLocaleString()} min`}
              />
            </Card>
          ))}
        </div>
      </div>

      {/* --- Free tier reminder --- */}
      {freePlan && org.plan === "free" ? (
        <div className="mt-12 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="text-sm font-medium text-neutral-50">You’re on the Free plan</div>
          <p className="mt-1 text-xs text-zinc-400">
            You can run typed demo chats against any agent to try the flow end-to-end. Live phone
            calls are unlocked on any paid plan (self-hosted or cloud) once you connect your
            provider keys.
          </p>
        </div>
      ) : null}
    </div>
  );
}
