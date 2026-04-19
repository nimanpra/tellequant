"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type Match = { id: string; document_id: string; content: string; similarity: number };

export function SearchPlayground({ kbId }: { kbId: string }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/knowledge/${kbId}/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, k: 6 }),
    });
    setLoading(false);
    const json = await res.json();
    setMatches(json.matches ?? []);
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Ask a question the agent might need to answer…"
            className="pl-9"
          />
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>
      {matches.length > 0 && (
        <ul className="mt-5 space-y-2">
          {matches.map((m, i) => (
            <li
              key={m.id}
              className="rounded-xl border border-white/[0.06] bg-[#07090F] p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300"
            >
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider">
                <span className="text-[#98C9FF]">match #{i + 1}</span>
                <span className="text-zinc-500">
                  score {(m.similarity * 100).toFixed(1)}%
                </span>
              </div>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
