import type { Metadata } from "next";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tellequant is building the AI call center for every business — small teams, global reach, zero missed calls.",
};

const VALUES = [
  {
    title: "Never miss a call.",
    body: "A missed call is a missed customer. We measure success by the calls you didn't have to pick up — and the ones that still ended well.",
  },
  {
    title: "Open components, no lock-in.",
    body: "Bring your own Twilio, your own STT, your own LLM. We'd rather earn the seat than trap you in our stack.",
  },
  {
    title: "Fair, metered pricing.",
    body: "A minute of voice should not cost more than a minute of coffee. We pass through provider cost and take a transparent margin.",
  },
  {
    title: "Boring, rigorous security.",
    body: "Per-tenant isolation, encrypted everything, audit logs by default. No models train on your transcripts, ever.",
  },
];

const TIMELINE = [
  {
    year: "2024",
    title: "Early prototypes",
    body: "Built the first voice RAG pipeline on Pipecat + Deepgram + Gemini to answer support calls for a 6-clinic dental group.",
  },
  {
    year: "2025",
    title: "First paying customers",
    body: "Shipped outbound campaigns, knowledge ingestion, and multi-tenant RLS. Ten customers; 120k minutes in month one.",
  },
  {
    year: "2026",
    title: "Public launch",
    body: "Tellequant is live — self-hosted, open components, provider-agnostic. The AI call center for every business.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Every business deserves a call center."
        subtitle="We're building Tellequant so a three-person team can answer calls like a 300-person team — warmly, accurately, and at 3am."
      />
      <ContentSection>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">Why we started</h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-400">
          <p>
            The founding team spent a decade inside contact centers and dev-tool companies. We
            watched voice AI go from novelty to production-grade — and watched most SMBs get
            priced out of it anyway. Enterprise platforms cost $10k+/month. Retail APIs cost
            $0.20/minute. Neither felt like something a dental group, a plumber, or a two-person
            SaaS startup could actually use.
          </p>
          <p>
            Tellequant is our answer: the same voice stack that powers $100M+ call centers,
            packaged so a small team can deploy it in an afternoon and pay by the minute. The
            product is self-hostable, the components are swappable, and the price is capped at
            provider cost plus a clear margin.
          </p>
        </div>
      </ContentSection>

      <ContentSection width="wide" className="border-t border-white/[0.06]">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">What we believe</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {VALUES.map((v) => (
            <Card key={v.title} className="p-6">
              <h3 className="text-[15px] font-semibold text-neutral-50">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{v.body}</p>
            </Card>
          ))}
        </div>
      </ContentSection>

      <ContentSection width="wide" className="border-t border-white/[0.06]">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">How we got here</h2>
        <div className="mt-6 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08]">
          {TIMELINE.map((t) => (
            <div key={t.year} className="flex gap-6 px-6 py-5">
              <div className="w-16 shrink-0 font-mono text-xs text-zinc-500">{t.year}</div>
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-50">{t.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </ContentSection>

      <ContentSection className="border-t border-white/[0.06]">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">Team & investors</h2>
        <p className="mt-4 text-[15px] text-zinc-400">
          We're a small distributed team across San Francisco, Colombo, and Lisbon. Backed by a
          handful of angels from the voice-AI, developer-tools, and contact-center spaces —
          happy to introduce you.
        </p>
      </ContentSection>
    </>
  );
}
