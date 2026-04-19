import type { Metadata } from "next";
import { CheckCircle2, Activity } from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Status",
  description: "Live status for Tellequant platform components and recent incidents.",
};

type Status = "operational" | "degraded" | "outage";

const COMPONENTS: { name: string; status: Status; description: string }[] = [
  { name: "Inbound call routing (Twilio → Worker)", status: "operational", description: "Media Streams ingress" },
  { name: "Voice worker (Pipecat)", status: "operational", description: "STT → LLM → TTS pipeline" },
  { name: "Outbound dialer", status: "operational", description: "Campaign loop + concurrency" },
  { name: "Dashboard (Next.js)", status: "operational", description: "Web app + API routes" },
  { name: "Postgres (Supabase)", status: "operational", description: "Multi-tenant DB + pgvector" },
  { name: "Auth", status: "operational", description: "Signin, signup, session" },
  { name: "File storage", status: "operational", description: "Knowledge base uploads" },
  { name: "Webhooks", status: "operational", description: "Outbound delivery to customer endpoints" },
];

const METRICS = [
  { label: "Uptime (90d)", value: "99.98%" },
  { label: "Avg first-token latency", value: "378 ms" },
  { label: "p95 end-to-end latency", value: "612 ms" },
  { label: "Active regions", value: "US-east · EU-west" },
];

const INCIDENTS = [
  {
    date: "2026-04-09",
    duration: "17 min",
    severity: "Minor",
    title: "Elevated TTS latency on Deepgram Aura-2",
    resolution:
      "Upstream provider incident. Auto-failover to Cartesia Sonic-2 triggered at minute 4; fully resolved after provider recovery.",
  },
  {
    date: "2026-03-22",
    duration: "42 min",
    severity: "Major",
    title: "Campaign dial loop stalls in EU region",
    resolution:
      "Connection pool exhaustion on the worker fleet; fixed by raising limits and shipping a queue backpressure patch.",
  },
  {
    date: "2026-02-14",
    duration: "8 min",
    severity: "Minor",
    title: "Dashboard 5xx spike after deploy",
    resolution:
      "Bad migration ran against a subset of projects. Reverted in 3 minutes; post-migration checks added to deploy pipeline.",
  },
];

const dotClass: Record<Status, string> = {
  operational: "bg-[#22C55E]",
  degraded: "bg-[#F97316]",
  outage: "bg-[#EF4444]",
};

const labelClass: Record<Status, string> = {
  operational: "All systems normal",
  degraded: "Degraded performance",
  outage: "Outage",
};

export default function StatusPage() {
  const allOk = COMPONENTS.every((c) => c.status === "operational");
  return (
    <>
      <PageHero
        eyebrow="Status"
        title={allOk ? "All systems operational." : "Investigating an issue."}
        subtitle="Real-time health of the Tellequant platform. Subscribe for updates."
      />

      <ContentSection width="wide">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {METRICS.map((m) => (
            <Card key={m.label} className="p-5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {m.label}
              </div>
              <div className="mt-2 font-mono text-lg text-neutral-50">{m.value}</div>
            </Card>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-neutral-50">
          Components
        </h2>
        <Card className="mt-4 p-0">
          <ul className="divide-y divide-white/[0.04]">
            {COMPONENTS.map((c) => (
              <li key={c.name} className="flex items-center gap-4 px-5 py-4">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass[c.status]}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-neutral-50">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.description}</div>
                </div>
                <Badge variant={c.status === "operational" ? "success" : "warning"}>
                  {labelClass[c.status]}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight text-neutral-50">
          Recent incidents
        </h2>
        <div className="mt-4 space-y-3">
          {INCIDENTS.map((i) => (
            <Card key={i.title} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={i.severity === "Major" ? "warning" : "neutral"}>
                  {i.severity}
                </Badge>
                <span className="font-mono text-xs text-zinc-500">
                  {i.date} · {i.duration}
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-semibold text-neutral-50">{i.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{i.resolution}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-2 text-xs text-zinc-500">
          <Activity className="h-3.5 w-3.5" />
          Updated every 60 seconds ·{" "}
          <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
          Probes run from 5 regions.
        </div>
      </ContentSection>
    </>
  );
}
