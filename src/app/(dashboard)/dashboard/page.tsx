import Link from "next/link";
import {
  Bot,
  PhoneIncoming,
  PhoneOutgoing,
  FileStack,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
} from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";

export default async function OverviewPage() {
  const { supabase, org } = await requireOrg();

  const [agentsRes, callsRes, kbsRes, campaignsRes] = await Promise.all([
    supabase.from("agents").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase
      .from("calls")
      .select("*", { count: "exact" })
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("knowledge_bases").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("org_id", org.id),
  ]);

  const calls = callsRes.data ?? [];
  const totalMinutes = calls.reduce((a, c) => a + (c.duration_seconds ?? 0) / 60, 0);
  const totalCost = calls.reduce((a, c) => a + (c.cost_cents ?? 0), 0);
  const containment = calls.filter((c) => c.outcome !== "escalated" && c.status === "completed").length;
  const containmentPct = calls.length > 0 ? Math.round((containment / calls.length) * 100) : 0;

  const stats = [
    {
      label: "Calls (7d)",
      value: callsRes.count ?? 0,
      icon: Activity,
      trend: "+12.4%",
    },
    {
      label: "Talk time (7d)",
      value: `${totalMinutes.toFixed(0)} min`,
      icon: Clock,
      trend: "+8%",
    },
    {
      label: "AI containment",
      value: `${containmentPct}%`,
      icon: TrendingUp,
      trend: "+3.1pt",
    },
    {
      label: "Est. cost (7d)",
      value: `$${(totalCost / 100).toFixed(2)}`,
      icon: DollarSign,
      trend: "-4%",
    },
  ];

  const quickLinks = [
    { href: "/dashboard/agents/new", label: "Create an agent", icon: Bot },
    { href: "/dashboard/knowledge/new", label: "Upload knowledge", icon: FileStack },
    { href: "/dashboard/numbers", label: "Get a phone number", icon: PhoneIncoming },
    { href: "/dashboard/campaigns/new", label: "Launch a campaign", icon: PhoneOutgoing },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
            Welcome to {org.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            A snapshot of your live call center.{" "}
            <Link href="/docs/getting-started" className="text-[#98C9FF] hover:underline">
              Getting-started guide →
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/dashboard/agents/new">New agent</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/campaigns/new">New campaign</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {s.label}
              </div>
              <s.icon className="h-4 w-4 text-[#98C9FF]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-neutral-50">
                {s.value}
              </span>
              <span className="text-xs text-emerald-400">{s.trend}</span>
            </div>
          </Card>
        ))}
      </div>

      {(agentsRes.count ?? 0) === 0 && (
        <Card className="mt-8 border-[#3E5CF8]/30 bg-gradient-to-b from-[#3E5CF8]/10 to-transparent">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-50">
                Let's create your first agent.
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                A persona, a voice, a knowledge base, and a phone number — you'll be live in 4 minutes.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/agents/new">Create agent</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-50">Recent calls</h3>
              <p className="text-xs text-zinc-500">Latest 8 calls across all agents.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/calls">View all →</Link>
            </Button>
          </div>
          {calls.length === 0 ? (
            <div className="grid place-items-center p-14 text-sm text-zinc-500">
              No calls yet. Once your agent is live, every call shows up here.
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {calls.map((c) => (
                <li key={c.id} className="flex items-center gap-4 px-6 py-3">
                  <div className={`h-2 w-2 rounded-full ${
                    c.status === "completed"
                      ? "bg-emerald-400"
                      : c.status === "failed"
                      ? "bg-red-400"
                      : "bg-zinc-500"
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm text-neutral-100">
                      {c.from_number} → {c.to_number}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                      {c.summary ?? "Awaiting summary…"}
                    </div>
                  </div>
                  <Badge variant={c.direction === "inbound" ? "accent" : "neutral"}>
                    {c.direction}
                  </Badge>
                  <span className="font-mono text-xs text-zinc-500 w-14 text-right">
                    {formatDuration(c.duration_seconds)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-neutral-50">Quick actions</h3>
            <ul className="mt-4 flex flex-col gap-1.5">
              {quickLinks.map((q) => (
                <li key={q.href}>
                  <Link
                    href={q.href}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/[0.14] hover:bg-white/[0.035]"
                  >
                    <q.icon className="h-4 w-4 text-[#98C9FF]" />
                    <span>{q.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-neutral-50">Usage this month</h3>
            <div className="mt-4 space-y-3 text-sm">
              <UsageBar label="Inbound minutes" value={23} max={100} />
              <UsageBar label="Outbound minutes" value={48} max={500} />
              <UsageBar label="Storage (KB)" value={0.12} max={0.5} suffix=" GB" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  value,
  max,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span className="font-mono">
          {value.toFixed(value < 1 ? 2 : 0)}
          {suffix} / {max}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3E5CF8] to-[#98C9FF]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
