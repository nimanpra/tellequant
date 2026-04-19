import type { Metadata } from "next";
import { Mail, MessageSquare, Calendar, Building2 } from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Tellequant — sales, support, partnerships, or just to say hi. We reply within one business day.",
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    body: "Reach the team at hello@tellequant.com. We reply within one business day.",
    href: "mailto:hello@tellequant.com",
    cta: "hello@tellequant.com",
  },
  {
    icon: MessageSquare,
    title: "Support",
    body: "Paying customers get Slack Connect. Free accounts use Discord.",
    href: "https://discord.gg/tellequant",
    cta: "Join the community",
  },
  {
    icon: Calendar,
    title: "Book a demo",
    body: "30 min walkthrough of inbound, outbound, RAG, analytics — your call, tailored.",
    href: "https://cal.com/tellequant/demo",
    cta: "Pick a slot",
  },
  {
    icon: Building2,
    title: "Enterprise",
    body: "BAA, custom SLAs, on-prem, single-tenant deployments, or white-label.",
    href: "mailto:enterprise@tellequant.com",
    cta: "enterprise@tellequant.com",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk."
        subtitle="Sales, support, partnerships — pick the channel that fits. We're small enough that real people answer every message."
      />
      <ContentSection width="wide">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
          <Card className="p-7">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-50">
              Send us a note
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Tell us what you're working on and we'll route your message to the right person.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </Card>
          <div className="flex flex-col gap-3">
            {CHANNELS.map((c) => (
              <a
                key={c.title}
                href={c.href}
                className="group surface block rounded-2xl p-5 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#3E5CF8]/10 text-[#98C9FF]">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-neutral-50">{c.title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{c.body}</p>
                    <div className="mt-2 font-mono text-xs text-[#98C9FF]">{c.cta}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </ContentSection>
    </>
  );
}
