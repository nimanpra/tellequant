import type { Metadata } from "next";
import { ArrowRight, MapPin, Globe2 } from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "We're small, distributed, and building the AI call center for every business. Come help.",
};

type Role = {
  title: string;
  dept: string;
  location: string;
  type: "Full-time" | "Contract";
  body: string;
};

const ROLES: Role[] = [
  {
    title: "Founding Voice AI Engineer",
    dept: "Engineering",
    location: "Remote · US / EU",
    type: "Full-time",
    body: "Own the Pipecat-based voice pipeline end-to-end. Drive latency, barge-in, and turn-taking quality. Real-time audio experience required.",
  },
  {
    title: "Staff Backend Engineer (Python / Go)",
    dept: "Engineering",
    location: "Remote · US / EU",
    type: "Full-time",
    body: "Scale our worker fleet, multi-tenant Postgres, and pgvector RAG. You pick between Python and Go for the hot paths.",
  },
  {
    title: "Product Engineer (Next.js)",
    dept: "Engineering",
    location: "Remote · Global",
    type: "Full-time",
    body: "Ship features across dashboard, agent builder, analytics, and the marketing site. Design-minded, full-stack, TypeScript-fluent.",
  },
  {
    title: "Solutions Architect",
    dept: "GTM",
    location: "Remote · US",
    type: "Full-time",
    body: "Lead technical deep-dives with enterprise prospects. Prior contact-center or CPaaS experience strongly preferred.",
  },
  {
    title: "Developer Advocate",
    dept: "Community",
    location: "Remote · Global",
    type: "Full-time",
    body: "Write, speak, screencast. Help developers get a live agent on the phone in under 30 minutes.",
  },
  {
    title: "Head of Support",
    dept: "Operations",
    location: "Remote · US",
    type: "Full-time",
    body: "Stand up a world-class support org for a product that has to work at 2am. Build rotations, runbooks, status, and on-call.",
  },
];

const BENEFITS = [
  "Fully remote — work from anywhere we can employ you",
  "Top-of-market base + meaningful equity",
  "Health, dental, vision (US) / country-equivalent elsewhere",
  "$2,500/yr learning + conference budget",
  "Home office stipend + M-series laptop",
  "Quarterly all-hands offsites",
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build the call center everyone else already has."
        subtitle="We're a small distributed team, obsessed with voice, latency, and getting small businesses their nights back."
      />

      <ContentSection>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">How we work</h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-400">
          <p>
            We're distributed across three time zones with a four-hour overlap. We prefer async
            writing over synchronous meetings, ship small PRs, and test in production behind
            feature flags. Every engineer is expected to talk to customers. Every new hire ships
            something on day one.
          </p>
          <p>
            If you've ever wanted to work on a product where a single line of code is the
            difference between "the call worked" and "a 2am plumbing emergency went to voicemail" —
            this is that product.
          </p>
        </div>
      </ContentSection>

      <ContentSection width="wide" className="border-t border-white/[0.06]">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">Open roles</h2>
        <div className="mt-6 grid grid-cols-1 gap-3">
          {ROLES.map((r) => (
            <a
              key={r.title}
              href={`mailto:jobs@tellequant.com?subject=${encodeURIComponent(
                `Application: ${r.title}`,
              )}`}
              className="group"
            >
              <Card className="flex items-start gap-5 p-6 transition-colors hover:bg-white/[0.03]">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-neutral-50">{r.title}</h3>
                    <Badge variant="accent">{r.dept}</Badge>
                    <Badge variant="neutral">{r.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{r.body}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" /> {r.location}
                  </div>
                </div>
                <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-[#98C9FF]" />
              </Card>
            </a>
          ))}
        </div>

        <Card className="mt-8 p-6">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-[#98C9FF]" />
            <h3 className="text-[15px] font-semibold text-neutral-50">
              Don't see a role that fits?
            </h3>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Write to{" "}
            <a
              href="mailto:jobs@tellequant.com"
              className="text-[#98C9FF] underline-offset-2 hover:underline"
            >
              jobs@tellequant.com
            </a>{" "}
            with a one-page note on what you'd want to work on. We read every message.
          </p>
        </Card>
      </ContentSection>

      <ContentSection width="wide" className="border-t border-white/[0.06]">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">Benefits</h2>
        <ul className="mt-5 grid grid-cols-1 gap-2 text-[15px] text-zinc-300 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3E5CF8]" />
              {b}
            </li>
          ))}
        </ul>
      </ContentSection>
    </>
  );
}
