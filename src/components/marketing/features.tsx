"use client";

import { motion } from "framer-motion";
import {
  PhoneIncoming,
  PhoneOutgoing,
  BrainCircuit,
  FileStack,
  Wand2,
  Workflow,
  LineChart,
  ShieldCheck,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: PhoneIncoming,
    title: "Always-on inbound",
    body:
      "Never miss a call. Tellequant answers 24/7, routes by intent, transfers to a human when needed, and sends recap SMS after hang-up.",
  },
  {
    icon: PhoneOutgoing,
    title: "Autonomous outbound",
    body:
      "Upload a CSV, write a directive, and Tellequant works the list — concurrently — with retries, quiet-hour guardrails, and per-call outcome tagging.",
  },
  {
    icon: FileStack,
    title: "Bring your own knowledge",
    body:
      "Drop PDFs, Word docs, web pages, policies. Tellequant chunks and embeds them into a per-tenant vector index for grounded, accurate answers.",
  },
  {
    icon: Wand2,
    title: "Persona builder",
    body:
      "Name, voice, tone, opening line, guardrails, and transferable scenarios — all without writing a single line of code.",
  },
  {
    icon: Workflow,
    title: "Agentic tool use",
    body:
      "Function calls for booking, CRM writes, SMS, email, webhook, and warm transfer. Plug into your stack or extend with your own tools.",
  },
  {
    icon: LineChart,
    title: "Every call, transcribed",
    body:
      "Recording + aligned transcript + AI summary + sentiment + outcome — searchable, exportable, and ready for QA.",
  },
  {
    icon: Globe,
    title: "Real-time RAG",
    body:
      "Sub-400 ms end-to-end first token. Retrieval happens mid-sentence so the agent never hesitates or hallucinates.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance-ready",
    body:
      "Per-tenant isolation, audit logs, PII redaction, consent prompts, and quiet-hours scheduling. SOC-2 ready.",
  },
  {
    icon: BrainCircuit,
    title: "Provider-agnostic",
    body:
      "Pick your LLM (Gemini / Claude / GPT / Llama), your STT (Deepgram / Whisper), your TTS (Cartesia / Aura / ElevenLabs). No lock-in.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#98C9FF]">
            Platform
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
            Everything you need to stand up a call center by lunch.
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            A batteries-included stack: voice, knowledge, actions, analytics.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              className="surface group rounded-2xl p-6 transition-all duration-300"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-[#3E5CF8]/10 text-[#98C9FF] transition-colors group-hover:bg-[#3E5CF8]/15">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-[17px] font-semibold text-neutral-50">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
