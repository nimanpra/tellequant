"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Wrench } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

type Event = {
  id: string;
  kind: string;
  at: string;
  payload: Record<string, unknown>;
};

interface CallTranscriptProps {
  events: Event[];
  recordingUrl: string | null;
  startMs: number;
}

export function CallTranscript({ events, recordingUrl, startMs }: CallTranscriptProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCursor(el.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  const speechEvents = events.filter(
    (e) => e.kind === "user_speech" || e.kind === "agent_speech" || e.kind === "tool_call"
  );

  const activeId = findActiveEvent(speechEvents, cursor, startMs);

  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(`[data-ev="${activeId}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeId]);

  function seek(at: string) {
    if (!audioRef.current || !startMs) return;
    const t = (new Date(at).getTime() - startMs) / 1000;
    audioRef.current.currentTime = Math.max(0, t);
    audioRef.current.play().catch(() => undefined);
  }

  function toggle() {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(() => undefined);
  }

  return (
    <div>
      {recordingUrl ? (
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-3">
          <button
            type="button"
            onClick={toggle}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#3E5CF8] text-neutral-50 transition-colors hover:bg-[#5471FF]"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <div className="flex-1 font-mono text-[11px] text-zinc-500">
            {formatDuration(cursor)}
          </div>
          <audio ref={audioRef} src={recordingUrl} preload="metadata" className="hidden" />
        </div>
      ) : null}

      <div ref={listRef} className="max-h-[600px] overflow-auto px-6 py-4">
        {speechEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No transcript yet. Waiting for the worker to post call events.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {speechEvents.map((e) => {
              const text = (e.payload.text as string | undefined) ?? "";
              const isUser = e.kind === "user_speech";
              const isTool = e.kind === "tool_call";
              const active = activeId === e.id;
              return (
                <li
                  key={e.id}
                  data-ev={e.id}
                  className={cn(
                    "flex gap-3",
                    isUser ? "justify-start" : "justify-end",
                    isTool && "justify-center"
                  )}
                >
                  {isTool ? (
                    <button
                      type="button"
                      onClick={() => seek(e.at)}
                      className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 font-mono text-[10px] text-zinc-400 hover:border-[#3E5CF8]/30 hover:text-[#98C9FF]"
                    >
                      <Wrench className="h-3 w-3" />
                      {(e.payload.name as string | undefined) ?? "tool"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => seek(e.at)}
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed transition-colors",
                        isUser
                          ? "rounded-bl-md bg-white/[0.04] text-zinc-100 hover:bg-white/[0.06]"
                          : "rounded-br-md bg-gradient-to-br from-[#3E5CF8]/20 to-[#3E5CF8]/5 text-neutral-50 hover:from-[#3E5CF8]/30",
                        active && "ring-1 ring-[#98C9FF]/40"
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2 text-[10px] text-zinc-500">
                        <span className="uppercase tracking-wider">
                          {isUser ? "Caller" : "Agent"}
                        </span>
                        <span className="font-mono">{offset(e.at, startMs)}</span>
                      </div>
                      {text || <span className="italic text-zinc-500">(no text)</span>}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function offset(at: string, startMs: number): string {
  if (!startMs) return "";
  const delta = Math.max(0, (new Date(at).getTime() - startMs) / 1000);
  return formatDuration(delta);
}

function findActiveEvent(events: Event[], cursor: number, startMs: number): string | null {
  if (!startMs || cursor <= 0) return null;
  const cursorMs = startMs + cursor * 1000;
  let active: string | null = null;
  for (const e of events) {
    if (new Date(e.at).getTime() <= cursorMs) active = e.id;
    else break;
  }
  return active;
}
