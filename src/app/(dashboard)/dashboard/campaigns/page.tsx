import Link from "next/link";
import { PhoneOutgoing, Plus } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";

export default async function CampaignsPage() {
  const { supabase, org } = await requireOrg();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, agents(name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });
  const list = campaigns ?? [];

  const statusVariant = (s: string) =>
    s === "running"
      ? "success"
      : s === "paused"
      ? "warning"
      : s === "completed"
      ? "accent"
      : "neutral";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Campaigns</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Autonomous outbound calling — upload a list, write a directive, monitor outcomes.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/campaigns/new">
            <Plus className="h-4 w-4" /> New campaign
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="mt-8">
          <div className="flex flex-col items-center gap-4 p-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#3E5CF8]/10">
              <PhoneOutgoing className="h-6 w-6 text-[#98C9FF]" />
            </div>
            <h3 className="text-base font-semibold text-neutral-50">No campaigns yet</h3>
            <p className="max-w-md text-sm text-zinc-400">
              Upload a CSV of contacts and Tellequant calls them in parallel, driving each conversation
              toward your goal — appointment, survey, follow-up, payment reminder.
            </p>
            <Button asChild>
              <Link href="/dashboard/campaigns/new">Launch your first campaign</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-8">
          <ul className="divide-y divide-white/[0.04]">
            {list.map((c) => {
              const pct = c.total_contacts
                ? Math.round((c.completed_contacts / c.total_contacts) * 100)
                : 0;
              return (
                <li key={c.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/campaigns/${c.id}`}
                      className="text-sm font-medium text-neutral-50 hover:text-[#98C9FF]"
                    >
                      {c.name}
                    </Link>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {(c.agents as { name: string } | null)?.name ?? "agent deleted"} ·{" "}
                      {c.total_contacts} contacts
                    </div>
                  </div>
                  <div className="w-40">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3E5CF8] to-[#98C9FF]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      {c.completed_contacts}/{c.total_contacts} · {pct}%
                    </div>
                  </div>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                  <span className="font-mono text-xs text-zinc-500 w-14 text-right">
                    {formatRelative(c.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
