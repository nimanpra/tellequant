"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, RefreshCw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AgentShape {
  id: string;
  name: string;
  persona: string;
  opening_line: string;
  llm_provider: string;
  llm_model: string;
}

interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function AgentDemoChat({
  agent,
  planLabel,
}: {
  agent: AgentShape;
  planLabel: string;
}) {
  const opener = agent.opening_line?.trim() || defaultOpener(agent.name);
  const [turns, setTurns] = useState<Turn[]>([
    { id: "opener", role: "assistant", content: opener },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userTurn: Turn = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const assistantId = `a-${Date.now()}`;
    setTurns((prev) => [
      ...prev,
      userTurn,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setSending(true);

    const wireMessages = [...turns, userTurn]
      .filter((t) => t.id !== "opener")
      .map((t) => ({ role: t.role, content: t.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/agents/${agent.id}/demo`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: wireMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        toast.error(payload.error ?? "Demo chat failed.");
        setTurns((prev) => prev.filter((t) => t.id !== assistantId));
        return;
      }
      if (!res.body) {
        toast.error("Empty response from demo chat.");
        setTurns((prev) => prev.filter((t) => t.id !== assistantId));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = block.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const msg = JSON.parse(payload) as
              | { type: "delta"; text: string }
              | { type: "done" }
              | { type: "error"; code?: string; message?: string };
            if (msg.type === "delta") {
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === assistantId ? { ...t, content: t.content + msg.text } : t,
                ),
              );
            } else if (msg.type === "error") {
              toast.error(msg.message ?? "Demo chat errored.");
            }
          } catch {
            /* ignore malformed SSE chunk */
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error((err as Error).message || "Demo chat failed.");
      }
      setTurns((prev) => prev.filter((t) => t.id !== assistantId));
    } finally {
      setTurns((prev) =>
        prev.map((t) => (t.id === assistantId ? { ...t, streaming: false } : t)),
      );
      setSending(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setTurns([{ id: "opener", role: "assistant", content: opener }]);
    setInput("");
    setSending(false);
  }

  return (
    <Card className="flex h-[640px] flex-col overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <Sparkles className="h-4 w-4 text-[#98C9FF]" />
        <span className="text-[13px] font-semibold text-neutral-100">
          Demo chat with {agent.name}
        </span>
        <span className="ml-2 rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-400">
          {agent.llm_provider} · {agent.llm_model}
        </span>
        <span className="ml-auto text-[11px] text-zinc-500">{planLabel}</span>
        <Button variant="ghost" size="sm" onClick={reset} disabled={sending}>
          <RefreshCw className="h-3.5 w-3.5" /> Restart
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {turns.map((t) => (
          <Bubble key={t.id} turn={t} agentName={agent.name} />
        ))}
        {turns.length === 1 ? <EmptyHint /> : null}
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          placeholder="Type a message as the caller…"
          className="flex-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-neutral-100 placeholder:text-zinc-600 focus:border-[#3E5CF8]/50 focus:outline-none disabled:opacity-50"
        />
        <Button type="submit" size="sm" disabled={sending || !input.trim()}>
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send
        </Button>
      </form>
    </Card>
  );
}

function Bubble({ turn, agentName }: { turn: Turn; agentName: string }) {
  const isAgent = turn.role === "assistant";
  return (
    <div className={cn("flex gap-2", isAgent ? "" : "flex-row-reverse")}>
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
          isAgent ? "bg-white/[0.03] text-neutral-100" : "bg-[#3E5CF8]/15 text-neutral-100",
        )}
      >
        <div
          className={cn(
            "mb-0.5 text-[10px] uppercase tracking-wider",
            isAgent ? "text-[#98C9FF]" : "text-zinc-400",
          )}
        >
          {isAgent ? agentName : "You"}
        </div>
        <div className="whitespace-pre-wrap">
          {turn.content}
          {turn.streaming ? (
            <span className="ml-1 inline-block h-3 w-[2px] animate-pulse bg-zinc-400 align-middle" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.04] text-zinc-500">
        <MessageSquare className="h-4 w-4" />
      </div>
      <p className="text-sm text-zinc-400">Send a message to start the demo.</p>
      <p className="text-xs text-zinc-600">
        The agent replies with its real LLM using your stored provider key.
      </p>
    </div>
  );
}

function defaultOpener(name: string): string {
  return `Hi, thanks for calling — this is ${name}. How can I help?`;
}
