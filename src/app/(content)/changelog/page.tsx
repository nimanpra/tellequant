import type { Metadata } from "next";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every update we ship to Tellequant — big features, small wins, fixes.",
};

type Release = {
  version: string;
  date: string;
  tag: "feature" | "improvement" | "fix";
  title: string;
  items: string[];
};

const RELEASES: Release[] = [
  {
    version: "1.0.0",
    date: "2026-04-18",
    tag: "feature",
    title: "Tellequant 1.0 is live",
    items: [
      "Multi-tenant workspaces with row-level security",
      "Agent builder with persona, voice, LLM, and tool selection",
      "Real-time voice pipeline (Deepgram Nova-3 + Gemini 2.5 Flash + Aura-2)",
      "Knowledge base ingestion with pgvector RAG",
      "Outbound campaigns with CSV upload + concurrency control",
      "Dashboard analytics: 30-day calls, answer rate, sentiment, cost",
      "HMAC-signed API keys for external integrations",
    ],
  },
  {
    version: "0.9.2",
    date: "2026-04-11",
    tag: "improvement",
    title: "Faster first-token latency",
    items: [
      "Streaming TTS begins before the LLM finishes generating",
      "Pre-warm pool for Pipecat workers cut cold-start from 1.8s → 240ms",
      "Parallel RAG + LLM token streams — retrieval no longer blocks speech",
    ],
  },
  {
    version: "0.9.1",
    date: "2026-04-03",
    tag: "feature",
    title: "Campaign quiet hours + timezone awareness",
    items: [
      "Per-contact timezone detection from area code",
      "Configurable quiet hours enforced on outbound dial loop",
      "TCPA consent prompts on first contact, auto-logged for compliance",
    ],
  },
  {
    version: "0.9.0",
    date: "2026-03-22",
    tag: "feature",
    title: "Call transcript playback",
    items: [
      "Audio scrubbing with synced message highlights",
      "Click any bubble to seek to that moment in the recording",
      "Tool-call timeline with arguments and return values",
    ],
  },
  {
    version: "0.8.7",
    date: "2026-03-14",
    tag: "fix",
    title: "Stability & small fixes",
    items: [
      "Fixed a race condition in campaign_contacts status transitions",
      "Improved error messages for invalid CSV uploads",
      "Reduced noisy logs in the voice worker under load",
    ],
  },
  {
    version: "0.8.5",
    date: "2026-03-02",
    tag: "feature",
    title: "Bring-your-own providers",
    items: [
      "Plug in your own Twilio, Deepgram, OpenAI, Gemini, Groq, Claude, Cartesia, or ElevenLabs keys",
      "Platform billing decoupled from usage — you pay providers directly",
      "Per-workspace provider selection with per-agent overrides",
    ],
  },
];

function tagStyle(tag: Release["tag"]) {
  if (tag === "feature") return "accent" as const;
  if (tag === "improvement") return "success" as const;
  return "neutral" as const;
}

export default function ChangelogPage() {
  return (
    <>
      <PageHero
        eyebrow="Changelog"
        title="What we shipped."
        subtitle="Every meaningful update to Tellequant, in reverse chronological order."
      />
      <ContentSection>
        <div className="space-y-10">
          {RELEASES.map((r) => (
            <article
              key={r.version}
              className="grid gap-3 border-b border-white/[0.06] pb-10 last:border-0"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm text-zinc-400">v{r.version}</span>
                <span className="font-mono text-xs text-zinc-500">{r.date}</span>
                <Badge variant={tagStyle(r.tag)}>{r.tag}</Badge>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-50">
                {r.title}
              </h2>
              <ul className="mt-1 space-y-1.5 text-[15px] text-zinc-400">
                {r.items.map((item, idx) => (
                  <li key={`${r.version}-${idx}`} className="flex gap-3">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#3E5CF8]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </ContentSection>
    </>
  );
}
