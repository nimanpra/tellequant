"use client";

import { useEffect, useState } from "react";
import { Phone, MessageSquare, FileText, CheckCircle2 } from "lucide-react";

type Line = { role: "user" | "agent" | "system"; text: string; tool?: string };

const script: Line[] = [
  { role: "system", text: "Inbound call · +1 (415) 555-0133 · Evelyn at Acme Dental" },
  { role: "agent", text: "Hi Evelyn, this is Aria from Briarwood Dental. How can I help today?" },
  { role: "user", text: "Hey, I need to reschedule my Thursday cleaning." },
  { role: "agent", text: "Of course — let me pull up your appointment." },
  { role: "system", tool: "search_knowledge_base", text: "Fetched office policy · next-day slots" },
  {
    role: "agent",
    text: "I have Friday at 2pm or Monday at 9:30am open. Which works better for you?",
  },
  { role: "user", text: "Friday 2pm is perfect." },
  { role: "system", tool: "schedule_meeting", text: "Booked Fri 2026-04-24 · 14:00 PT" },
  { role: "agent", text: "Booked. You'll get a confirmation text in a moment. Anything else?" },
];

export function LiveCallDemo() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % (script.length + 4)), 2200);
    return () => clearInterval(t);
  }, []);

  const visible = script.slice(0, Math.min(step, script.length));

  return (
    <div className="relative mx-auto max-w-5xl">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_60%_at_50%_0%,rgba(62,92,248,0.25),transparent_70%)] blur-3xl"
      />
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-[0_60px_120px_-40px_rgba(62,92,248,0.35)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse-ring" />
            <span className="text-xs font-medium text-zinc-300">Call in progress</span>
            <span className="text-xs text-zinc-500 font-mono">00:14</span>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-4 w-[3px] rounded-full bg-[#98C9FF] animate-wave origin-center"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
          <div className="flex min-h-[380px] flex-col gap-3 p-6">
            {visible.map((line, i) => (
              <TranscriptLine key={i} line={line} />
            ))}
            {step < script.length && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
                Aria is listening…
              </div>
            )}
          </div>
          <div className="border-t border-white/[0.06] md:border-l md:border-t-0">
            <SidePanel step={step} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TranscriptLine({ line }: { line: Line }) {
  if (line.role === "system") {
    return (
      <div className="flex items-center gap-2 self-start rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
        <FileText className="h-3.5 w-3.5 text-[#98C9FF]" />
        <span className="font-mono text-[11px] text-zinc-400">
          {line.tool ? `tool.${line.tool}` : "system"} · {line.text}
        </span>
      </div>
    );
  }
  const isAgent = line.role === "agent";
  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAgent
            ? "border border-white/[0.08] bg-white/[0.03] text-neutral-100"
            : "bg-[#3E5CF8]/90 text-white"
        }`}
      >
        {line.text}
      </div>
    </div>
  );
}

function SidePanel({ step }: { step: number }) {
  return (
    <div className="flex h-full flex-col divide-y divide-white/[0.04]">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#98C9FF]" />
          <span className="text-xs font-medium text-zinc-300">Caller</span>
        </div>
        <div className="mt-2">
          <div className="text-sm font-medium text-neutral-50">Evelyn R.</div>
          <div className="text-xs text-zinc-500">+1 (415) 555-0133</div>
          <div className="mt-1 font-mono text-[11px] text-zinc-500">patient #8831 · recurring</div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#98C9FF]" />
          <span className="text-xs font-medium text-zinc-300">Live intent</span>
        </div>
        <div className="mt-2 text-sm text-neutral-100">Reschedule existing cleaning</div>
        <div className="mt-1 text-[11px] text-zinc-500">confidence · 0.93</div>
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium text-zinc-300">Actions</span>
        </div>
        <ul className="mt-2 space-y-1.5 text-xs">
          <li className="flex items-center gap-1.5 text-zinc-400">
            <Dot active={step >= 5} /> Lookup policy
          </li>
          <li className="flex items-center gap-1.5 text-zinc-400">
            <Dot active={step >= 7} /> Offer open slots
          </li>
          <li className="flex items-center gap-1.5 text-zinc-400">
            <Dot active={step >= 8} /> Book appointment
          </li>
          <li className="flex items-center gap-1.5 text-zinc-400">
            <Dot active={step >= 9} /> Send SMS confirmation
          </li>
        </ul>
      </div>
    </div>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        active ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" : "bg-white/20"
      }`}
    />
  );
}
