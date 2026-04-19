import { Check } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PLANS, planById } from "@/lib/billing/plans";
import { BillingActions } from "@/components/dashboard/billing-actions";

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
  const currentPlan = planById(org.plan) ?? PLANS[0];
  const includedMinutes = currentPlan.includedMinutes;
  const usagePct =
    includedMinutes > 0 ? Math.min(100, Math.round((usedMinutes / includedMinutes) * 100)) : 0;

  const hasCustomer = Boolean(org.stripe_customer_id);

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Billing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Current plan · <span className="text-neutral-50 capitalize">{org.plan}</span>
          {org.subscription_status ? (
            <>
              {" · "}
              <span className="capitalize text-zinc-300">
                {String(org.subscription_status).replaceAll("_", " ")}
              </span>
            </>
          ) : null}
          . Usage resets on the first of each month.
        </p>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">This month</div>
            <div className="mt-1 text-2xl font-semibold text-neutral-50">
              {usedMinutes.toLocaleString()}{" "}
              <span className="text-base font-normal text-zinc-400">
                / {includedMinutes.toLocaleString()} min
              </span>
            </div>
          </div>
          {hasCustomer ? <BillingActions intent="portal" /> : null}
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full bg-[#3E5CF8]"
            style={{ width: `${includedMinutes > 0 ? usagePct : 0}%` }}
          />
        </div>
      </Card>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === org.plan;
          return (
            <Card
              key={p.id}
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
                intent={isCurrent ? "current" : p.contactOnly ? "contact" : "upgrade"}
                plan={p.id}
                highlight={p.highlight}
                label={isCurrent ? "Current plan" : p.ctaLabel}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
