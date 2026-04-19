"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, PhoneOutgoing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhone } from "@/lib/utils";

export function CampaignForm({
  agents,
  numbers,
}: {
  agents: { id: string; name: string }[];
  numbers: { id: string; e164: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("Outreach wave 1");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [numberId, setNumberId] = useState(numbers[0]?.id ?? "");
  const [directive, setDirective] = useState(
    `You are calling existing customers to remind them their annual checkup is due this quarter. Offer Friday 2pm or Monday 9:30am. If neither works, ask for their preferred time and note it. If they ask about cost, say "your insurance covers the exam in full." Mark the contact as rescheduled, declined, voicemail, or no-answer.`
  );
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [concurrency, setConcurrency] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      setCsv(text);
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      setPreview((parsed.data as Record<string, string>[]).slice(0, 5));
    };
    reader.readAsText(file);
  }

  async function submit(start: boolean) {
    if (!agentId || !numberId || !csv.trim()) {
      toast.error("Agent, number, and CSV are required");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        agent_id: agentId,
        from_number_id: numberId,
        directive,
        concurrency,
        contacts_csv: csv,
      }),
    });
    if (!res.ok) {
      setSubmitting(false);
      return toast.error((await res.json()).error ?? "Failed");
    }
    const { campaign } = await res.json();
    if (start) {
      await fetch(`/api/campaigns/${campaign.id}/start`, { method: "POST" });
    }
    setSubmitting(false);
    toast.success(start ? "Campaign launched" : "Draft saved");
    router.replace(`/dashboard/campaigns/${campaign.id}`);
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Campaign name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Max concurrent calls</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value || "1", 10))}
            />
          </div>
          <div>
            <Label>Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>From number</Label>
            <Select value={numberId} onValueChange={setNumberId}>
              <SelectTrigger>
                <SelectValue placeholder="Select number" />
              </SelectTrigger>
              <SelectContent>
                {numbers.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {formatPhone(n.e164)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <Label>Directive</Label>
        <p className="mb-2 text-xs text-zinc-500">
          What is the agent trying to accomplish on each call? Be specific about success vs.
          failure outcomes.
        </p>
        <Textarea
          rows={6}
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          className="font-mono text-[13px] leading-relaxed"
        />
      </Card>

      <Card className="p-6">
        <Label>Contact list (CSV)</Label>
        <p className="mb-2 text-xs text-zinc-500">
          Required header: <code className="text-zinc-300">phone</code>. Optional:{" "}
          <code className="text-zinc-300">name</code>. Extra columns are passed to the agent as
          per-call variables.
        </p>
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center hover:border-white/20">
          <UploadCloud className="h-6 w-6 text-[#98C9FF]" />
          <span className="text-sm text-neutral-50">
            {csv ? "Replace CSV" : "Click to choose a CSV"}
          </span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </label>
        {preview.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-zinc-500">
                <tr>
                  {Object.keys(preview[0]).map((k) => (
                    <th key={k} className="px-3 py-2 font-medium">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-white/[0.04]">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2 text-zinc-300 font-mono text-xs">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-white/[0.04] px-3 py-2 text-xs text-zinc-500">
              Preview · first 5 rows
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={() => submit(false)} disabled={submitting}>
          <CheckCircle2 className="h-4 w-4" /> Save draft
        </Button>
        <Button onClick={() => submit(true)} disabled={submitting}>
          <PhoneOutgoing className="h-4 w-4" />
          {submitting ? "Launching…" : "Launch campaign"}
        </Button>
      </div>
    </div>
  );
}
