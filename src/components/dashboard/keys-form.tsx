"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { ProviderDef, ProviderStatus } from "@/lib/byok";

interface Props {
  providers: ProviderDef[];
  initialStatus: ProviderStatus[];
}

export function KeysForm({ providers, initialStatus }: Props) {
  const [status, setStatus] = useState<ProviderStatus[]>(initialStatus);

  function providerStatus(id: string): ProviderStatus | undefined {
    return status.find((s) => s.provider === id);
  }

  async function handleSave(provider: ProviderDef, fields: Record<string, string | null>) {
    const res = await fetch("/api/settings/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: provider.id, fields }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json?.error ?? "Could not save keys");
      return;
    }
    setStatus(json.providers as ProviderStatus[]);
    toast.success(`${provider.name} keys saved`);
  }

  async function handleClear(provider: ProviderDef) {
    const clearFields: Record<string, null> = {};
    for (const f of provider.fields) clearFields[f.key] = null;
    await handleSave(provider, clearFields);
  }

  const grouped: Record<string, ProviderDef[]> = {};
  for (const p of providers) {
    grouped[p.category] ??= [];
    grouped[p.category].push(p);
  }

  const categoryLabels: Record<string, string> = {
    telephony: "Telephony",
    llm: "Language models",
    stt: "Speech-to-text",
    tts: "Text-to-speech",
  };

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            {categoryLabels[cat] ?? cat}
          </div>
          <div className="mt-3 flex flex-col gap-4">
            {items.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                status={providerStatus(p.id)}
                onSave={(fields) => handleSave(p, fields)}
                onClear={() => handleClear(p)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CardProps {
  provider: ProviderDef;
  status?: ProviderStatus;
  onSave: (fields: Record<string, string | null>) => Promise<void>;
  onClear: () => Promise<void>;
}

function ProviderCard({ provider, status, onSave, onClear }: CardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nonEmpty: Record<string, string | null> = {};
    let hasAny = false;
    for (const f of provider.fields) {
      const v = values[f.key]?.trim();
      if (v) {
        nonEmpty[f.key] = v;
        hasAny = true;
      }
    }
    if (!hasAny) {
      toast.error("Enter at least one value to save");
      return;
    }
    setSaving(true);
    try {
      await onSave(nonEmpty);
      setValues({});
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    if (!status?.configured) return;
    setClearing(true);
    try {
      await onClear();
    } finally {
      setClearing(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-50">{provider.name}</h3>
            {status?.configured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <Check className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                Not configured
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">{provider.description}</p>
        </div>
        <a
          href={provider.signupUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-neutral-50"
        >
          Get a key <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        {provider.fields.map((f) => {
          const configured = status?.fields.find((x) => x.key === f.key)?.configured ?? false;
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between">
                <Label className="text-xs">{f.label}</Label>
                {configured ? (
                  <span className="text-[10px] text-emerald-400">Stored</span>
                ) : null}
              </div>
              <Input
                type={f.type ?? "password"}
                autoComplete="off"
                spellCheck={false}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={configured ? "•••••••• (leave blank to keep)" : `Paste ${f.label}`}
              />
              {f.hint ? <p className="mt-1 text-[11px] text-zinc-500">{f.hint}</p> : null}
            </div>
          );
        })}
        <div className="flex items-center justify-end gap-2 pt-1">
          {status?.configured ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={clear}
              disabled={clearing || saving}
            >
              {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Remove"}
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
