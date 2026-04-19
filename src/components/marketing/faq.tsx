"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "How fast does the agent actually respond?",
    a: "End-to-end first-token latency is ~380 ms (Deepgram Nova-3 streaming + Gemini 2.5 Flash + Aura-2 TTS). On Cartesia Sonic-2 it drops to ~300 ms. Tellequant starts TTS before the LLM finishes so the caller never feels the wait.",
  },
  {
    q: "Can I use my own Twilio / OpenAI / ElevenLabs accounts?",
    a: "Yes. BYO keys for any provider (Twilio, Telnyx, Deepgram, Groq, OpenAI, Gemini, Claude, Cartesia, ElevenLabs) and Tellequant bills you only for the platform — you keep usage at cost.",
  },
  {
    q: "How does outbound work, legally?",
    a: "Tellequant enforces quiet-hours per timezone, TCPA consent prompts on first contact, STIR/SHAKEN attestations, and per-campaign opt-out handling. DNC list upload and caller-ID rotation are built in.",
  },
  {
    q: "What happens if the AI doesn't know an answer?",
    a: "It retrieves from your RAG; if retrieval is low-confidence, it follows your fallback policy (ask clarifying question, warm transfer to a human, take a callback request, or email a human with full context).",
  },
  {
    q: "Is my data used for model training?",
    a: "Never. All RAG indexes are per-tenant and isolated. We use provider APIs that contractually exclude your data from training. Gemini free-tier excluded from prod deployments.",
  },
  {
    q: "Can I plug Tellequant into my CRM?",
    a: "Yes. Each call fires a signed webhook with the transcript, summary, outcome, and structured claim extraction. Prebuilt outputs for HubSpot, Salesforce, Zoho, Attio, Pipedrive, and any HTTPS endpoint.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#98C9FF]">FAQ</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
            Questions, answered.
          </h2>
        </div>
        <div className="mt-10 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.015]">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={f.q}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="mt-0.5 text-zinc-500">
                  {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-medium text-neutral-50">{f.q}</div>
                  {isOpen && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.a}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
