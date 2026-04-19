"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  Loader2,
  Wrench,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AgentShape = {
  id: string;
  name: string;
  persona: string;
  opening_line: string;
  voice_provider: string;
  voice_id: string;
  llm_provider: string;
  llm_model: string;
};

type TurnRole = "agent" | "user" | "tool";

interface Turn {
  id: string;
  role: TurnRole;
  text: string;
  at: number;
  tool?: { name: string; args: string; result: string };
}

type SessionStatus = "idle" | "connecting" | "live" | "ending";

const DEMO_TURNS: Omit<Turn, "id" | "at">[] = [
  { role: "user", text: "Hi, I'd like to book a cleaning appointment for my daughter." },
  {
    role: "agent",
    text: "Of course — I'd be happy to help. What's your daughter's name and approximate age?",
  },
  { role: "user", text: "Her name's Maya, she's seven." },
  {
    role: "tool",
    text: "lookup_patient",
    tool: {
      name: "lookup_patient",
      args: '{"first_name":"Maya","age":7}',
      result: '{"found":true,"last_visit":"2025-09-12","provider":"Dr. Tanaka"}',
    },
  },
  {
    role: "agent",
    text: "Got it — I see Maya last came in with Dr. Tanaka in September. Would you like to stay with her, or try a different provider?",
  },
  { role: "user", text: "Dr. Tanaka's fine." },
  {
    role: "tool",
    text: "find_openings",
    tool: {
      name: "find_openings",
      args: '{"provider":"Dr. Tanaka","type":"cleaning","duration_min":30}',
      result: '{"slots":["2026-04-22 09:30","2026-04-24 14:00","2026-04-29 10:15"]}',
    },
  },
  {
    role: "agent",
    text: "I have Wednesday the 22nd at 9:30, Friday the 24th at 2 PM, or Tuesday the 29th at 10:15. Which works?",
  },
  { role: "user", text: "Let's do the 24th at 2." },
  {
    role: "tool",
    text: "book_appointment",
    tool: {
      name: "book_appointment",
      args: '{"patient":"Maya","provider":"Dr. Tanaka","start":"2026-04-24T14:00"}',
      result: '{"confirmed":true,"confirmation_id":"BRD-22871"}',
    },
  },
  {
    role: "agent",
    text: "Perfect — Maya's booked with Dr. Tanaka on Friday April 24th at 2 PM. I'll text you a confirmation. Anything else?",
  },
];

export function AgentTester({ agent }: { agent: AgentShape }) {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [muted, setMuted] = useState(false);
  const [typed, setTyped] = useState("");
  const [latency, setLatency] = useState({ firstToken: 0, endToEnd: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns.length]);

  const elapsedSeconds = useElapsedSeconds(status === "live" ? startedAtRef.current : 0);

  function startCall() {
    if (status !== "idle") return;
    setStatus("connecting");
    setTurns([]);

    const t1 = setTimeout(() => {
      setStatus("live");
      startedAtRef.current = Date.now();
      setLatency({ firstToken: 240 + Math.random() * 120, endToEnd: 0 });
      pushTurn({ role: "agent", text: agent.opening_line || defaultOpener(agent.name) });
      scheduleDemoConversation();
    }, 900);

    timersRef.current.push(t1);
  }

  function pushTurn(t: Omit<Turn, "id" | "at">) {
    setTurns((prev) => [
      ...prev,
      { ...t, id: `${Date.now()}-${prev.length}`, at: Date.now() },
    ]);
  }

  function scheduleDemoConversation() {
    let offset = 1400;
    for (const turn of DEMO_TURNS) {
      const gap = turn.role === "tool" ? 260 : turn.role === "user" ? 1800 : 1400;
      offset += gap;
      const t = setTimeout(() => {
        pushTurn(turn);
        if (turn.role === "agent") {
          setLatency((l) => ({
            firstToken: 200 + Math.random() * 120,
            endToEnd: 480 + Math.random() * 220,
          }));
        }
      }, offset);
      timersRef.current.push(t);
    }
  }

  function endCall() {
    setStatus("ending");
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const t = setTimeout(() => {
      setStatus("idle");
      toast.success("Test call ended. Summary saved.");
    }, 500);
    timersRef.current.push(t);
  }

  function submitTyped(e: React.FormEvent) {
    e.preventDefault();
    const text = typed.trim();
    if (!text || status !== "live") return;
    pushTurn({ role: "user", text });
    setTyped("");
    const reply = setTimeout(() => {
      pushTurn({
        role: "agent",
        text: replyTo(text),
      });
      setLatency({ firstToken: 210 + Math.random() * 100, endToEnd: 490 + Math.random() * 180 });
    }, 700);
    timersRef.current.push(reply);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <CallControls
          status={status}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          onStart={startCall}
          onEnd={endCall}
          agent={agent}
          elapsed={elapsedSeconds}
        />

        <Card className="flex h-[440px] flex-col overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <MessageSquare className="h-4 w-4 text-[#98C9FF]" />
            <span className="text-[13px] font-semibold text-neutral-100">Live transcript</span>
            {status === "live" ? (
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#4ADE80]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
                streaming
              </span>
            ) : null}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {turns.length === 0 ? (
              <EmptyHint status={status} />
            ) : (
              turns.map((t) => <TurnBubble key={t.id} turn={t} agentName={agent.name} />)
            )}
          </div>

          <form
            onSubmit={submitTyped}
            className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-3"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={status !== "live"}
              placeholder={
                status === "live" ? "Type to simulate caller input…" : "Start a call to chat"
              }
              className="flex-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-sm text-neutral-100 placeholder:text-zinc-600 focus:border-[#3E5CF8]/50 focus:outline-none disabled:opacity-50"
            />
            <Button type="submit" size="sm" disabled={status !== "live" || !typed.trim()}>
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          </form>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <MetricsCard latency={latency} status={status} />
        <ToolTracePanel turns={turns} />
        <AgentInfoCard agent={agent} />
      </div>
    </div>
  );
}

function CallControls({
  status,
  muted,
  onToggleMute,
  onStart,
  onEnd,
  agent,
  elapsed,
}: {
  status: SessionStatus;
  muted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
  onEnd: () => void;
  agent: AgentShape;
  elapsed: number;
}) {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: 24 }, () => Math.random()),
  );

  useEffect(() => {
    if (status !== "live" || muted) return;
    const id = setInterval(() => {
      setBars(Array.from({ length: 24 }, () => Math.random()));
    }, 280);
    return () => clearInterval(id);
  }, [status, muted]);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full transition-colors",
            status === "live"
              ? "bg-[#22C55E]/15 text-[#4ADE80]"
              : status === "connecting"
                ? "bg-[#F59E0B]/15 text-[#FBBF24]"
                : "bg-white/[0.04] text-zinc-400",
          )}
        >
          {status === "connecting" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === "live" ? (
            <Sparkles className="h-5 w-5" />
          ) : (
            <Phone className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-neutral-50">{agent.name}</span>
            <Badge variant={status === "live" ? "success" : "neutral"}>
              {status === "live"
                ? `Live · ${formatElapsed(elapsed)}`
                : status === "connecting"
                  ? "Connecting…"
                  : status === "ending"
                    ? "Ending…"
                    : "Idle"}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {agent.voice_provider} · {agent.voice_id} · {agent.llm_provider} · {agent.llm_model}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "live" ? (
            <>
              <Button variant="secondary" size="sm" onClick={onToggleMute}>
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {muted ? "Unmute" : "Mute"}
              </Button>
              <Button variant="destructive" size="sm" onClick={onEnd}>
                <PhoneOff className="h-4 w-4" /> End
              </Button>
            </>
          ) : (
            <Button
              onClick={onStart}
              disabled={status !== "idle"}
              size="sm"
            >
              {status === "connecting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              Start call
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex h-10 items-center gap-[3px] rounded-md border border-white/[0.04] bg-[#07090F]/70 px-3">
        {bars.map((b, i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-full transition-all",
              status === "live" && !muted ? "bg-[#3E5CF8]" : "bg-white/10",
            )}
            style={{
              height: `${
                status === "live" && !muted ? 20 + Math.round(b * 60) : 12
              }%`,
            }}
          />
        ))}
      </div>
    </Card>
  );
}

function TurnBubble({ turn, agentName }: { turn: Turn; agentName: string }) {
  if (turn.role === "tool" && turn.tool) {
    return (
      <div className="flex items-start gap-2">
        <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.04] text-zinc-400">
          <Wrench className="h-3 w-3" />
        </div>
        <div className="min-w-0 flex-1 rounded-md border border-white/[0.04] bg-white/[0.02] px-3 py-2">
          <div className="flex items-center gap-2">
            <code className="font-mono text-[11px] font-semibold text-[#98C9FF]">
              {turn.tool.name}()
            </code>
            <span className="text-[10px] text-zinc-500">tool call</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-zinc-400">
            args: <span className="text-zinc-300">{turn.tool.args}</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-400">
            → <span className="text-[#4ADE80]">{turn.tool.result}</span>
          </div>
        </div>
      </div>
    );
  }

  const isAgent = turn.role === "agent";
  return (
    <div className={cn("flex gap-2", isAgent ? "" : "flex-row-reverse")}>
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
          isAgent
            ? "bg-white/[0.03] text-neutral-100"
            : "bg-[#3E5CF8]/15 text-neutral-100",
        )}
      >
        <div
          className={cn(
            "mb-0.5 text-[10px] uppercase tracking-wider",
            isAgent ? "text-[#98C9FF]" : "text-zinc-400",
          )}
        >
          {isAgent ? agentName : "Caller"}
        </div>
        {turn.text}
      </div>
    </div>
  );
}

function EmptyHint({ status }: { status: SessionStatus }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.04] text-zinc-500">
        <Phone className="h-4 w-4" />
      </div>
      <p className="text-sm text-zinc-400">
        {status === "connecting"
          ? "Connecting to the voice worker…"
          : "Start a call to try the agent live."}
      </p>
      <p className="text-xs text-zinc-600">
        No phone number is dialed. Audio uses your browser mic and speakers.
      </p>
    </div>
  );
}

function MetricsCard({
  latency,
  status,
}: {
  latency: { firstToken: number; endToEnd: number };
  status: SessionStatus;
}) {
  return (
    <Card className="p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Live metrics
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metric
          label="First-token"
          value={status === "live" && latency.firstToken ? `${Math.round(latency.firstToken)} ms` : "—"}
        />
        <Metric
          label="End-to-end"
          value={status === "live" && latency.endToEnd ? `${Math.round(latency.endToEnd)} ms` : "—"}
        />
        <Metric label="Barge-in" value={status === "live" ? "enabled" : "—"} />
        <Metric label="Region" value="us-east-1" />
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-[13px] text-neutral-100">{value}</div>
    </div>
  );
}

function ToolTracePanel({ turns }: { turns: Turn[] }) {
  const tools = turns.filter((t) => t.role === "tool" && t.tool);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-[#98C9FF]" />
        <span className="text-[13px] font-semibold text-neutral-100">Tool trace</span>
        <span className="ml-auto text-[11px] text-zinc-500">{tools.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {tools.length === 0 ? (
          <p className="text-[12px] text-zinc-500">
            Tool invocations will show here as the agent calls functions.
          </p>
        ) : (
          tools.map((t) => (
            <div
              key={t.id}
              className="rounded-md border border-white/[0.04] bg-white/[0.02] px-3 py-2"
            >
              <code className="font-mono text-[11px] font-semibold text-[#98C9FF]">
                {t.tool?.name}
              </code>
              <div className="mt-1 truncate font-mono text-[10.5px] text-zinc-400">
                {t.tool?.args}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function AgentInfoCard({ agent }: { agent: AgentShape }) {
  return (
    <Card className="p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Persona preview
      </div>
      <p className="mt-3 max-h-[160px] overflow-y-auto text-[12.5px] leading-relaxed text-zinc-400">
        {agent.persona || "No persona configured yet."}
      </p>
    </Card>
  );
}

function useElapsedSeconds(startedAt: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!startedAt) {
      setN(0);
      return;
    }
    const tick = () => setN(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return n;
}

function formatElapsed(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function defaultOpener(name: string): string {
  return `Hi, thanks for calling — this is ${name}. How can I help?`;
}

function replyTo(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("book") || t.includes("appointment")) {
    return "Of course — what day or time works best for you?";
  }
  if (t.includes("hour") || t.includes("open")) {
    return "We're open Monday through Friday from 8 AM to 6 PM, and Saturday from 9 to 1.";
  }
  if (t.includes("price") || t.includes("cost")) {
    return "Pricing depends on the service — do you know roughly which treatment you're asking about?";
  }
  if (t.includes("bye") || t.includes("thanks")) {
    return "You're very welcome. Have a great day!";
  }
  return "Got it — can you tell me a bit more about what you need?";
}
