"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bot, Save, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VOICES, LLMS, BUILTIN_TOOLS } from "@/lib/catalog";

type AgentShape = {
  id?: string;
  name: string;
  persona: string;
  opening_line: string;
  voice_provider: string;
  voice_id: string;
  llm_provider: string;
  llm_model: string;
  temperature: number;
  max_duration_seconds: number;
  knowledge_base_id: string | null;
  tools: unknown;
  is_active?: boolean;
};

const DEFAULTS: AgentShape = {
  name: "Aria",
  persona: `You are Aria, a warm and efficient AI assistant for {{company_name}}.
You answer customer calls with calm confidence. When you don't know, you say so and offer to transfer.
Always greet by name if the caller is known. Keep replies to 1-2 sentences unless explicitly asked for detail.
Follow the company's tone: {{tone}}. Hard rules: never discuss pricing outside of the published rate sheet.`,
  opening_line: "Hi, this is Aria. How can I help today?",
  voice_provider: "deepgram",
  voice_id: "aura-2-thalia-en",
  llm_provider: "groq",
  llm_model: "llama-3.3-70b-versatile",
  temperature: 0.4,
  max_duration_seconds: 600,
  knowledge_base_id: null,
  tools: ["search_knowledge_base", "end_call", "transfer_call", "send_sms"],
  is_active: true,
};

export function AgentForm({
  mode,
  agent,
  knowledgeBases,
}: {
  mode: "create" | "edit";
  agent?: AgentShape;
  knowledgeBases: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [state, setState] = useState<AgentShape>(agent ?? DEFAULTS);
  const [saving, setSaving] = useState(false);

  function updateTool(id: string, on: boolean) {
    const current = new Set<string>(Array.isArray(state.tools) ? (state.tools as string[]) : []);
    if (on) current.add(id);
    else current.delete(id);
    setState({ ...state, tools: Array.from(current) });
  }

  async function onSave() {
    setSaving(true);
    const url = mode === "create" ? "/api/agents" : `/api/agents/${agent?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    setSaving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Save failed");
      return;
    }
    toast.success(mode === "create" ? "Agent created" : "Saved");
    const { agent: saved } = await res.json();
    if (mode === "create") router.replace(`/dashboard/agents/${saved.id}`);
    router.refresh();
  }

  const tools = Array.isArray(state.tools) ? (state.tools as string[]) : [];
  const selectedVoice = VOICES.find((v) => v.id === state.voice_id);

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Identity */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#3E5CF8]/10">
            <Bot className="h-4 w-4 text-[#98C9FF]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-50">Identity</h2>
            <p className="text-xs text-zinc-500">What the agent is called and what it's for.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input
              value={state.name}
              onChange={(e) => setState({ ...state, name: e.target.value })}
              placeholder="Aria"
            />
          </div>
          <div>
            <Label>Opening line</Label>
            <Input
              value={state.opening_line}
              onChange={(e) => setState({ ...state, opening_line: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label>Persona & instructions</Label>
          <Textarea
            rows={8}
            value={state.persona}
            onChange={(e) => setState({ ...state, persona: e.target.value })}
            className="font-mono text-[13px] leading-relaxed"
          />
          <p className="mt-2 text-[11px] text-zinc-500">
            Use <code className="text-zinc-300">{"{{company_name}}"}</code> and{" "}
            <code className="text-zinc-300">{"{{caller_name}}"}</code> for dynamic injection at call
            time.
          </p>
        </div>
      </Card>

      {/* Voice */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#3E5CF8]/10">
            <Volume2 className="h-4 w-4 text-[#98C9FF]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-50">Voice</h2>
            <p className="text-xs text-zinc-500">
              Deepgram Aura-2 is the cheapest/best balance; Cartesia Sonic-2 for lowest latency.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Voice</Label>
            <Select
              value={state.voice_id}
              onValueChange={(v) => {
                const voice = VOICES.find((x) => x.id === v);
                setState({
                  ...state,
                  voice_id: v,
                  voice_provider: voice?.provider ?? state.voice_provider,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label} · {v.provider} · {v.style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoice && (
              <p className="mt-2 text-[11px] text-zinc-500">
                {selectedVoice.language} · {selectedVoice.gender} · {selectedVoice.style}
              </p>
            )}
          </div>
          <div>
            <Label>LLM</Label>
            <Select
              value={state.llm_model}
              onValueChange={(v) => {
                const llm = LLMS.find((x) => x.id === v);
                setState({
                  ...state,
                  llm_model: v,
                  llm_provider: llm?.provider ?? state.llm_provider,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LLMS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.label} · {l.notes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Temperature</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={state.temperature}
                onChange={(e) => setState({ ...state, temperature: parseFloat(e.target.value) })}
                className="h-1 w-full appearance-none rounded-full bg-white/[0.06] accent-[#3E5CF8]"
              />
              <span className="w-10 text-right font-mono text-xs text-zinc-400">
                {state.temperature.toFixed(2)}
              </span>
            </div>
          </div>
          <div>
            <Label>Max call duration (seconds)</Label>
            <Input
              type="number"
              min={30}
              max={3600}
              value={state.max_duration_seconds}
              onChange={(e) =>
                setState({ ...state, max_duration_seconds: parseInt(e.target.value || "0", 10) })
              }
            />
          </div>
        </div>
      </Card>

      {/* Knowledge base */}
      <Card className="p-6">
        <div>
          <h2 className="text-base font-semibold text-neutral-50">Knowledge base</h2>
          <p className="text-xs text-zinc-500">
            Grounds every answer. Leave empty for a pure persona assistant.
          </p>
        </div>
        <div className="mt-5">
          <Select
            value={state.knowledge_base_id ?? "__none__"}
            onValueChange={(v) =>
              setState({ ...state, knowledge_base_id: v === "__none__" ? null : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a knowledge base" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {knowledgeBases.map((kb) => (
                <SelectItem key={kb.id} value={kb.id}>
                  {kb.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tools */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-50">Tools</h2>
            <p className="text-xs text-zinc-500">
              The agent will call these autonomously when the conversation calls for it.
            </p>
          </div>
        </div>
        <ul className="mt-5 divide-y divide-white/[0.04]">
          {BUILTIN_TOOLS.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-50">{t.label}</span>
                  <Badge variant="neutral">built-in</Badge>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{t.description}</p>
              </div>
              <Switch
                checked={tools.includes(t.id)}
                onCheckedChange={(on) => updateTool(t.id, on)}
              />
            </li>
          ))}
        </ul>
      </Card>

      {/* Status + save */}
      <Card className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Switch
            checked={state.is_active ?? true}
            onCheckedChange={(on) => setState({ ...state, is_active: on })}
          />
          <div>
            <div className="text-sm font-medium text-neutral-50">
              {state.is_active ? "Agent is live" : "Agent is paused"}
            </div>
            <div className="text-xs text-zinc-500">
              Paused agents won't pick up inbound or make outbound calls.
            </div>
          </div>
        </div>
        <Button onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : mode === "create" ? "Create agent" : "Save changes"}
        </Button>
      </Card>
    </div>
  );
}
