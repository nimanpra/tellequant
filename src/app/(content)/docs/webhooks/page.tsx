import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Webhook } from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Webhooks · Docs",
  description: "Real-time event delivery is coming alongside the public API.",
};

const PLANNED_EVENTS = [
  { name: "call.started", body: "Voice worker connected, agent streaming." },
  { name: "call.transcript.final", body: "Finalized user/assistant turns with timing." },
  { name: "call.tool.invoked", body: "Tool calls with arguments and return values." },
  { name: "call.ended", body: "Duration, outcome, cost, sentiment." },
  { name: "campaign.progress", body: "Dialed / connected / succeeded counts." },
  { name: "campaign.completed", body: "Emitted when the contact list is exhausted." },
];

export default function WebhooksDocsPage() {
  return (
    <>
      <PageHero
        eyebrow="Webhooks"
        title="Webhooks — coming soon."
        subtitle="HMAC-signed event delivery is in active development alongside the public API."
      />

      <ContentSection>
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#98C9FF]"
        >
          <ArrowLeft className="h-4 w-4" /> All docs
        </Link>

        <Card className="mt-8 p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#3E5CF8]/10 text-[#98C9FF]">
              <Webhook className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-neutral-50">Beta access</h2>
                <Badge variant="accent">Coming soon</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Webhooks will ship with the{" "}
                <Link href="/docs/api" className="text-[#98C9FF] hover:underline">
                  public API beta
                </Link>
                . Every call and campaign event will POST to your endpoint with an{" "}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">
                  X-Tellequant-Signature
                </code>{" "}
                HMAC header, exponential-backoff retries, and a dead-letter queue in the dashboard.
              </p>
              <a
                href="mailto:api-beta@tellequant.com?subject=Webhooks%20beta%20access"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#98C9FF] hover:underline"
              >
                <Mail className="h-4 w-4" /> Request beta access
              </a>
            </div>
          </div>
        </Card>

        <h2 className="mt-14 text-2xl font-semibold tracking-tight text-neutral-50">
          Planned event types
        </h2>
        <div className="mt-4 space-y-3">
          {PLANNED_EVENTS.map((e) => (
            <Card key={e.name} className="p-5">
              <Badge variant="accent">{e.name}</Badge>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{e.body}</p>
            </Card>
          ))}
        </div>
      </ContentSection>
    </>
  );
}
