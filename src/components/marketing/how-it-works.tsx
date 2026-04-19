"use client";

import { motion } from "framer-motion";
import { FileUp, User, PhoneCall, Activity } from "lucide-react";

const steps = [
  {
    icon: FileUp,
    title: "Upload your knowledge",
    body:
      "Drop PDFs, docs, FAQs, policies. Tellequant chunks, embeds, and indexes them into your private vector store.",
    code: `tq kb create "briarwood-dental"
tq kb upload ./policies/*.pdf
# 42 chunks indexed · pgvector`,
  },
  {
    icon: User,
    title: "Design a persona",
    body:
      "Name, voice, temperament, opening line, guardrails, transfer rules. Test it live in a browser call.",
    code: `name:   Aria
voice:  aura-2-thalia-en
opening: "Hi, this is Aria —"
tools:  [schedule_meeting,
         send_sms, transfer]`,
  },
  {
    icon: PhoneCall,
    title: "Point a number",
    body:
      "Buy a Twilio number in one click or BYO. Tellequant provisions the media webhook, SIP trunk, and routing.",
    code: `number:  +1 (415) 555-0199
agent:   aria-v3
routing: auto
fallback:→ front-desk`,
  },
  {
    icon: Activity,
    title: "Watch it work",
    body:
      "Every call gets a transcript, recording, summary, sentiment, outcome, and cost line — instantly.",
    code: `123 calls · 91% containment
avg 87s · $0.074/min
outcomes: booked 48, triaged
18, no-answer 6, escalated 3`,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#98C9FF]">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
            Go from zero to live in four steps.
          </h2>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="surface relative flex flex-col gap-5 overflow-hidden rounded-2xl p-6"
            >
              <span className="absolute right-6 top-6 font-mono text-xs text-zinc-600">
                0{i + 1}
              </span>
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#3E5CF8]/10 text-[#98C9FF]">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-neutral-50">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.body}</p>
                </div>
              </div>
              <pre className="mt-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#07090F] p-4 font-mono text-[12.5px] leading-relaxed text-zinc-400">
                <code>{s.code}</code>
              </pre>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
