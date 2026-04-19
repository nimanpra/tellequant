import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PageHero, ContentSection, Prose } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Getting started · Docs",
  description: "Provision your first number, build an agent, and take a live call in minutes.",
};

const STEPS = [
  {
    n: "01",
    title: "Create your workspace",
    body: "Sign up with email or Google. Your workspace is multi-tenant — all data (agents, calls, contacts, keys) is scoped to it under Postgres RLS.",
  },
  {
    n: "02",
    title: "Claim a phone number",
    body: "In Settings → Numbers, bring your own Twilio number (paste SID + token) or buy one from any local area code. We configure the Media Streams webhook automatically.",
  },
  {
    n: "03",
    title: "Build an agent",
    body: "Open Agents → New. Pick a voice (Aura-2 for Americana, Cartesia Sonic-2 for expressive, ElevenLabs for character). Write a persona, paste your FAQ, choose an LLM.",
  },
  {
    n: "04",
    title: "Connect a knowledge base",
    body: "Upload PDFs, paste URLs, or drop in markdown. We chunk, embed with text-embedding-3-small, and store in pgvector. Retrieval streams in parallel with the LLM.",
  },
  {
    n: "05",
    title: "Wire up tools",
    body: "Book appointments, look up customers, transfer to a human, send an SMS follow-up. Each tool is a JSON-schema-described function the agent can call mid-conversation.",
  },
  {
    n: "06",
    title: "Take the first call",
    body: "Click Test Live in the agent detail view, dial your agent's number, or attach it to a campaign. Recordings, transcripts, and tool-call timelines land in the dashboard instantly.",
  },
];

export default function GettingStartedPage() {
  return (
    <>
      <PageHero
        eyebrow="Getting started"
        title="From zero to live call."
        subtitle="Six steps, about fifteen minutes. No DevOps required."
      />

      <ContentSection>
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#98C9FF]"
        >
          <ArrowLeft className="h-4 w-4" /> All docs
        </Link>

        <div className="mt-8 space-y-4">
          {STEPS.map((s) => (
            <Card key={s.n} className="p-6">
              <div className="flex items-start gap-5">
                <div className="font-mono text-xs text-zinc-500">{s.n}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-neutral-50">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Prose className="mt-14">
          <h2>What you'll need</h2>
          <ul>
            <li>A Tellequant account (free to start, $20 trial credit)</li>
            <li>A Twilio account (optional — we can also provision the number)</li>
            <li>At most 15 minutes of undivided attention</li>
          </ul>

          <h2>Test it locally first</h2>
          <p>
            Click <strong>Test Live</strong> on any agent. It opens a browser-based voice session
            that uses your mic and speakers — no phone call required. Everything the caller would
            experience, you experience: turn-taking, barge-in, tool calls, knowledge base retrieval.
          </p>

          <h2>Ship to production</h2>
          <p>
            Attach the agent to a number. That's production. There is no staging deploy step —
            Tellequant is a managed runtime. You can still gate rollouts with <code>traffic_split</code>{" "}
            to send, say, 10% of calls to a new agent version and the rest to the stable one.
          </p>
        </Prose>

        <Card className="mt-12 p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
            <h3 className="text-[15px] font-semibold text-neutral-50">Next up</h3>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Once your agent is live, wire up{" "}
            <Link href="/docs/webhooks" className="text-[#98C9FF] hover:underline">
              webhooks
            </Link>{" "}
            to stream transcripts into your CRM, or read the{" "}
            <Link href="/docs/api" className="text-[#98C9FF] hover:underline">
              API reference
            </Link>{" "}
            to launch campaigns programmatically.
          </p>
        </Card>
      </ContentSection>
    </>
  );
}
