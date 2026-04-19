import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CallTranscript } from "@/components/dashboard/call-transcript";
import { formatDuration, formatPhone, formatRelative, currency } from "@/lib/utils";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();

  const { data: call } = await supabase
    .from("calls")
    .select("*, agents(name), campaigns(name)")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  if (!call) notFound();

  const { data: events } = await supabase
    .from("call_events")
    .select("*")
    .eq("call_id", id)
    .order("at", { ascending: true });

  const evts = events ?? [];
  const startMs = call.started_at ? new Date(call.started_at).getTime() : 0;

  const toolCalls = evts.filter((e) => e.kind === "tool_call");

  return (
    <div className="mx-auto max-w-7xl">
      <div className="text-xs text-zinc-500">
        <Link href="/dashboard/calls" className="hover:text-zinc-300">
          Call logs
        </Link>{" "}
        / <span className="text-zinc-400 font-mono">{call.id.slice(0, 8)}</span>
      </div>

      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {call.direction === "inbound" ? (
              <PhoneIncoming className="h-5 w-5 text-[#98C9FF]" />
            ) : (
              <PhoneOutgoing className="h-5 w-5 text-[#98C9FF]" />
            )}
            <h1 className="font-mono text-xl font-semibold text-neutral-50">
              {formatPhone(call.from_number)} → {formatPhone(call.to_number)}
            </h1>
            <Badge variant={statusVariant(call.status)}>{call.status.replace("_", " ")}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {(call.agents as { name: string } | null)?.name ?? "—"}
            {call.campaigns ? (
              <>
                {" · "}
                <Link
                  href={`/dashboard/campaigns/${call.campaign_id}`}
                  className="text-[#98C9FF] hover:underline"
                >
                  {(call.campaigns as { name: string } | null)?.name}
                </Link>
              </>
            ) : null}
            {" · "}
            {formatRelative(call.created_at)}
          </p>
        </div>
        {call.recording_url && (
          <Button asChild variant="secondary">
            <a href={call.recording_url} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> Recording
            </a>
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Duration" value={formatDuration(call.duration_seconds)} />
        <Stat label="Cost" value={currency(call.cost_cents)} />
        <Stat label="Outcome" value={call.outcome ?? "—"} />
        <Stat
          label="Sentiment"
          value={
            call.sentiment ? (
              <Badge variant={sentimentVariant(call.sentiment)}>{call.sentiment}</Badge>
            ) : (
              "—"
            )
          }
        />
      </div>

      {call.summary && (
        <Card className="mt-6 p-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            AI Summary
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-200">{call.summary}</p>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-0">
          <div className="border-b border-white/[0.06] px-6 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Transcript
            </div>
          </div>
          <CallTranscript
            events={evts.map((e) => ({
              id: e.id,
              kind: e.kind,
              at: e.at,
              payload: e.payload as Record<string, unknown>,
            }))}
            recordingUrl={call.recording_url}
            startMs={startMs}
          />
        </Card>

        <Card className="p-0">
          <div className="border-b border-white/[0.06] px-5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Tool calls · {toolCalls.length}
            </div>
          </div>
          <div className="max-h-[600px] overflow-auto">
            {toolCalls.length === 0 ? (
              <div className="px-5 py-6 text-xs text-zinc-500">No tools were invoked.</div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {toolCalls.map((e) => {
                  const p = e.payload as {
                    name?: string;
                    args?: unknown;
                    result?: unknown;
                  };
                  return (
                    <li key={e.id} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-[11px] text-[#98C9FF]">
                          {p.name ?? "unknown"}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-600">
                          {offset(e.at, startMs)}
                        </div>
                      </div>
                      {p.args ? (
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-white/[0.04] bg-[#07090F] p-2 font-mono text-[10px] leading-relaxed text-zinc-400">
                          {JSON.stringify(p.args, null, 2)}
                        </pre>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function offset(at: string, startMs: number): string {
  if (!startMs) return "";
  const delta = Math.max(0, (new Date(at).getTime() - startMs) / 1000);
  return `+${formatDuration(delta)}`;
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

function sentimentVariant(
  s: "positive" | "neutral" | "negative"
): "success" | "neutral" | "danger" {
  if (s === "positive") return "success";
  if (s === "negative") return "danger";
  return "neutral";
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-neutral-50">{value}</div>
    </Card>
  );
}
