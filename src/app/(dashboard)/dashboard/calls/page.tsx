import Link from "next/link";
import { PhoneIncoming, PhoneOutgoing, ListMusic } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatPhone, formatRelative, currency } from "@/lib/utils";

const STATUS_FILTERS = ["all", "completed", "failed", "in_progress", "no_answer"] as const;
const DIR_FILTERS = ["all", "inbound", "outbound"] as const;

type CallRow = {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  status: string;
  duration_seconds: number;
  cost_cents: number;
  outcome: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  created_at: string;
  agents: { name: string } | null;
  campaigns: { name: string } | null;
};

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; direction?: string }>;
}) {
  const { status, direction } = await searchParams;
  const { supabase, org } = await requireOrg();

  let q = supabase
    .from("calls")
    .select("*, agents(name), campaigns(name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") q = q.eq("status", status);
  if (direction && direction !== "all") q = q.eq("direction", direction);

  const { data } = await q;
  const calls = (data ?? []) as unknown as CallRow[];

  const totalDuration = calls.reduce((a, c) => a + c.duration_seconds, 0);
  const totalCost = calls.reduce((a, c) => a + c.cost_cents, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Call logs</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Every call Tellequant has answered or placed. Click any row to replay the transcript.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Calls" value={`${calls.length}`} />
        <Stat label="Talk time" value={formatDuration(totalDuration)} />
        <Stat label="Cost" value={currency(totalCost)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Filter
          name="Direction"
          current={direction ?? "all"}
          options={DIR_FILTERS.map((o) => ({ value: o, label: o }))}
          paramName="direction"
          otherParam={["status", status]}
        />
        <Filter
          name="Status"
          current={status ?? "all"}
          options={STATUS_FILTERS.map((o) => ({ value: o, label: o.replace("_", " ") }))}
          paramName="status"
          otherParam={["direction", direction]}
        />
      </div>

      {calls.length === 0 ? (
        <Card className="mt-6 p-14 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#3E5CF8]/10">
            <ListMusic className="h-6 w-6 text-[#98C9FF]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-neutral-50">No calls yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-400">
            Once an agent answers a call or a campaign dials out, every conversation appears here
            with a full transcript, summary, and recording.
          </p>
        </Card>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Dir</th>
                <th className="px-4 py-3 font-medium">From → To</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    {c.direction === "inbound" ? (
                      <PhoneIncoming className="h-4 w-4 text-[#98C9FF]" />
                    ) : (
                      <PhoneOutgoing className="h-4 w-4 text-[#98C9FF]" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/calls/${c.id}`}
                      className="font-mono text-xs text-neutral-50 hover:text-[#98C9FF]"
                    >
                      {formatPhone(c.from_number)} → {formatPhone(c.to_number)}
                    </Link>
                    {c.campaigns?.name && (
                      <div className="mt-0.5 text-[10px] text-zinc-500">{c.campaigns.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{c.agents?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(c.status)}>{c.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-zinc-300">{c.outcome ?? "—"}</div>
                    {c.sentiment && (
                      <div className="text-[10px] text-zinc-500">{c.sentiment}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {formatDuration(c.duration_seconds)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {currency(c.cost_cents)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {formatRelative(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function statusVariant(
  s: string
): "success" | "warning" | "danger" | "accent" | "neutral" {
  if (s === "completed") return "success";
  if (s === "failed") return "danger";
  if (s === "no_answer") return "warning";
  if (s === "in_progress" || s === "ringing") return "accent";
  return "neutral";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-neutral-50">{value}</div>
    </Card>
  );
}

function Filter({
  name,
  current,
  options,
  paramName,
  otherParam,
}: {
  name: string;
  current: string;
  options: { value: string; label: string }[];
  paramName: string;
  otherParam: [string, string | undefined];
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {name}
      </span>
      {options.map((o) => {
        const params = new URLSearchParams();
        if (o.value !== "all") params.set(paramName, o.value);
        if (otherParam[1] && otherParam[1] !== "all") params.set(otherParam[0], otherParam[1]);
        const qs = params.toString();
        return (
          <Link
            key={o.value}
            href={`/dashboard/calls${qs ? `?${qs}` : ""}`}
            className={
              o.value === current
                ? "rounded-full border border-[#3E5CF8]/40 bg-[#3E5CF8]/15 px-2.5 py-1 text-[11px] text-[#98C9FF]"
                : "rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-zinc-400 hover:border-white/10 hover:text-zinc-200"
            }
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
