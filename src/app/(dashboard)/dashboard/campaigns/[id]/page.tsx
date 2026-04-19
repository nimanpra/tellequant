import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Pause, Download } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPhone, formatRelative } from "@/lib/utils";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();
  const { data: camp } = await supabase
    .from("campaigns")
    .select("*, agents(name), phone_numbers:from_number_id(e164)")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  if (!camp) notFound();
  const { data: contacts } = await supabase
    .from("campaign_contacts")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  const pct = camp.total_contacts
    ? Math.round((camp.completed_contacts / camp.total_contacts) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="text-xs text-zinc-500">
        <Link href="/dashboard/campaigns" className="hover:text-zinc-300">
          Campaigns
        </Link>{" "}
        / <span className="text-zinc-400">{camp.name}</span>
      </div>
      <div className="mt-1 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">{camp.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {(camp.agents as { name: string } | null)?.name} ·{" "}
            {(camp.phone_numbers as { e164: string } | null)?.e164 ?? "—"} ·{" "}
            {formatRelative(camp.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {camp.status === "running" ? (
            <form action={`/api/campaigns/${camp.id}/pause`} method="POST">
              <Button type="submit" variant="secondary">
                <Pause className="h-4 w-4" /> Pause
              </Button>
            </form>
          ) : (
            <form action={`/api/campaigns/${camp.id}/start`} method="POST">
              <Button type="submit">
                <Play className="h-4 w-4" /> {camp.status === "draft" ? "Launch" : "Resume"}
              </Button>
            </form>
          )}
          <Button asChild variant="secondary">
            <Link href={`/api/campaigns/${camp.id}/export`}>
              <Download className="h-4 w-4" /> Export
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat label="Status" value={<Badge variant="accent">{camp.status}</Badge>} />
        <Stat label="Contacts" value={`${camp.total_contacts}`} />
        <Stat
          label="Progress"
          value={
            <div>
              <div className="text-2xl font-semibold">{pct}%</div>
              <div className="text-[11px] text-zinc-500">
                {camp.completed_contacts}/{camp.total_contacts}
              </div>
            </div>
          }
        />
        <Stat label="Concurrency" value={`${camp.concurrency}`} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-neutral-50">Directive</h2>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-[#07090F] p-4 font-mono text-[12.5px] leading-relaxed text-zinc-400">
          {camp.directive}
        </pre>
      </Card>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Contacts
      </h2>
      <Card className="mt-3">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#0A0D14] text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Attempts</th>
                <th className="px-4 py-2 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {(contacts ?? []).map((c) => (
                <tr key={c.id} className="border-t border-white/[0.04]">
                  <td className="px-4 py-2 text-neutral-100">{c.name ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-zinc-300">{formatPhone(c.phone)}</td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        c.status === "done"
                          ? "success"
                          : c.status === "failed"
                          ? "danger"
                          : c.status === "calling"
                          ? "accent"
                          : "neutral"
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-zinc-400 font-mono">{c.attempts}</td>
                  <td className="px-4 py-2 text-zinc-400">{c.outcome ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-neutral-50">{value}</div>
    </Card>
  );
}
