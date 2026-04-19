import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Rocket,
  Webhook,
  Terminal,
  Braces,
  BookOpen,
  Shield,
  Phone,
  Bot,
} from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Docs",
  description: "Everything you need to build, deploy, and scale AI voice agents on Tellequant.",
};

const QUICKSTART = [
  {
    href: "/docs/getting-started",
    icon: Rocket,
    title: "Getting started",
    body: "Provision your first number, build an agent, and take a live call in under 15 minutes.",
    beta: false,
  },
  {
    href: "/docs/api",
    icon: Braces,
    title: "API reference",
    body: "REST endpoints for agents, campaigns, calls, and contacts. Private beta in progress.",
    beta: true,
  },
  {
    href: "/docs/webhooks",
    icon: Webhook,
    title: "Webhooks",
    body: "Real-time event delivery for call lifecycle and campaign progress. Beta alongside the API.",
    beta: true,
  },
  {
    href: "/docs/sdks",
    icon: Terminal,
    title: "SDKs",
    body: "Official TypeScript and Python clients, shipping with the public API.",
    beta: true,
  },
];

const GUIDES = [
  {
    icon: Bot,
    title: "Agent design patterns",
    body: "Persona prompts, tool calling, handoff flows, and knowledge base grounding.",
  },
  {
    icon: Phone,
    title: "Telephony primitives",
    body: "Numbers, SIP trunks, transfer flows, recording, DTMF, and carrier best practices.",
  },
  {
    icon: BookOpen,
    title: "Knowledge base",
    body: "Chunking, embeddings, retrieval tuning, and keeping answers fresh.",
  },
  {
    icon: Shield,
    title: "Compliance playbook",
    body: "TCPA consent, quiet hours, opt-out handling, HIPAA-aware configuration.",
  },
];

export default function DocsHomePage() {
  return (
    <>
      <PageHero
        eyebrow="Documentation"
        title="Build voice agents that work."
        subtitle="A complete reference for the Tellequant platform — from your first live call to a million-contact campaign."
      />

      <ContentSection width="wide">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">Start here</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {QUICKSTART.map((q) => (
            <Link key={q.href} href={q.href} className="group">
              <Card className="h-full p-6 transition-colors hover:bg-white/[0.03]">
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#3E5CF8]/10 text-[#98C9FF]">
                    <q.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-neutral-50">{q.title}</h3>
                        {q.beta ? <Badge variant="accent">Coming soon</Badge> : null}
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-[#98C9FF]" />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{q.body}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </ContentSection>

      <ContentSection width="wide" className="border-t border-white/[0.06]">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">Guides</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDES.map((g) => (
            <Card key={g.title} className="p-5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#3E5CF8]/10 text-[#98C9FF]">
                <g.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-neutral-50">{g.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{g.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-zinc-400">
            Something missing or unclear? We read every note.
          </p>
          <a
            href="mailto:docs@tellequant.com"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#98C9FF] hover:underline"
          >
            docs@tellequant.com <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </ContentSection>
    </>
  );
}
