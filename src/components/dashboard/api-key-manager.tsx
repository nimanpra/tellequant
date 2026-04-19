"use client";

import { useState } from "react";
import { Plus, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/utils";

interface KeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used: string | null;
  revoked_at: string | null;
}

export function ApiKeyManager({ initial }: { initial: KeyRow[] }) {
  const [keys, setKeys] = useState<KeyRow[]>(initial);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<{ id: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setCreating(false);
    if (!res.ok) return toast.error((await res.json()).error ?? "Failed");
    const { key, secret } = await res.json();
    setKeys((prev) => [key, ...prev]);
    setJustCreated({ id: key.id, secret });
    setName("");
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Any integrations using it will break immediately.")) return;
    const res = await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error((await res.json()).error ?? "Failed");
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k))
    );
  }

  function copy(secret: string) {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="flex gap-2 border-b border-white/[0.06] p-4">
        <Input
          placeholder="Key name (e.g. production)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={create} disabled={creating || !name.trim()}>
          <Plus className="h-4 w-4" /> Create key
        </Button>
      </div>

      {justCreated && (
        <div className="m-4 rounded-xl border border-[#3E5CF8]/30 bg-[#3E5CF8]/5 p-4">
          <div className="text-xs font-medium text-[#98C9FF]">
            Copy your key now — it won&apos;t be shown again
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md border border-white/[0.06] bg-[#07090F] px-3 py-2 font-mono text-xs text-neutral-100">
              {justCreated.secret}
            </code>
            <Button variant="secondary" size="sm" onClick={() => copy(justCreated.secret)}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="px-6 py-10 text-center text-xs text-zinc-500">
          No API keys yet. Create one above to integrate with Tellequant.
        </div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Last used</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-white/[0.04]">
                <td className="px-4 py-3 text-neutral-100">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">{k.key_prefix}…</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {formatRelative(k.created_at)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {k.last_used ? formatRelative(k.last_used) : "never"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {k.revoked_at ? (
                    <span className="text-zinc-500">revoked</span>
                  ) : (
                    <span className="text-[#98C9FF]">active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!k.revoked_at && (
                    <button
                      type="button"
                      onClick={() => revoke(k.id)}
                      className="text-zinc-500 hover:text-red-400"
                      aria-label="Revoke"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
