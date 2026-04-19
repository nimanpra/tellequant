import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Customers",
  description:
    "Dental groups, service businesses, and SaaS teams use Tellequant to answer every call 24/7.",
};

const LOGOS = [
  "Briarwood Dental",
  "Helix Clinics",
  "Vanguard Plumbing",
  "Rowan Legal",
  "Lumen Wellness",
  "Port & Keys",
  "Maple Auto Group",
  "Northline HVAC",
];

const STORIES = [
  {
    company: "Helix Clinics",
    industry: "Multi-site healthcare",
    metric: "91% first-call containment",
    quote:
      "We replaced an eight-seat support desk with Tellequant in three weeks and never went back. It books appointments, handles intake, and routes insurance questions — 24/7, in seven languages.",
    who: "Jordan Rivera, COO",
    detail: {
      calls: "42k/mo",
      avgDuration: "2m 18s",
      containment: "91%",
      savings: "$68k/yr",
    },
  },
  {
    company: "Briarwood Dental",
    industry: "Dental · 6 locations",
    metric: "3.4× booking lift",
    quote:
      "After-hours calls used to go to voicemail. Now they book themselves. Our new-patient volume is up 3.4× in the first quarter, and our front desk gets to focus on in-office patients.",
    who: "Dr. Mei Tanaka, owner",
    detail: {
      calls: "8.2k/mo",
      avgDuration: "3m 04s",
      containment: "86%",
      savings: "2 FTE",
    },
  },
  {
    company: "Vanguard Plumbing",
    industry: "Home services",
    metric: "2m 03s avg resolution",
    quote:
      "Emergency callers get a real answer at 2am instead of a page. Tellequant triages the call, dispatches on-call, and texts the customer a confirmed ETA before I'm even out of bed.",
    who: "Casey Alvarez, ops lead",
    detail: {
      calls: "3.1k/mo",
      avgDuration: "2m 03s",
      containment: "78%",
      savings: "$42k/yr",
    },
  },
];

export default function CustomersPage() {
  return (
    <>
      <PageHero
        eyebrow="Customers"
        title="Teams shipping real calls, today."
        subtitle="From six-chair dental groups to after-hours plumbing dispatch. If the call needs to be answered, Tellequant answers it."
      />

      <ContentSection width="wide">
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
          {LOGOS.map((l) => (
            <div
              key={l}
              className="text-center font-serif text-[15px] font-medium tracking-tight text-zinc-500"
            >
              {l}
            </div>
          ))}
        </div>
      </ContentSection>

      <ContentSection width="wide" className="border-t border-white/[0.06]">
        <div className="flex flex-col gap-10">
          {STORIES.map((s) => (
            <Card key={s.company} className="relative overflow-hidden p-8 md:p-10">
              <div className="absolute right-8 top-8 opacity-10">
                <Quote className="h-20 w-20 text-[#98C9FF]" />
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="accent">{s.industry}</Badge>
                <Badge variant="success">{s.metric}</Badge>
              </div>
              <p className="mt-5 max-w-3xl text-xl font-medium leading-snug tracking-tight text-neutral-50">
                "{s.quote}"
              </p>
              <div className="mt-4 text-sm text-zinc-500">
                <span className="text-neutral-200">{s.who}</span> · {s.company}
              </div>
              <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-6 md:grid-cols-4">
                <Stat label="Monthly calls" value={s.detail.calls} />
                <Stat label="Avg duration" value={s.detail.avgDuration} />
                <Stat label="Containment" value={s.detail.containment} />
                <Stat label="Savings" value={s.detail.savings} />
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-zinc-400">
            Running a team that's ready to stop answering its own phone?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#98C9FF] hover:underline"
          >
            Talk to sales <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </ContentSection>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-base text-neutral-50">{value}</div>
    </div>
  );
}
