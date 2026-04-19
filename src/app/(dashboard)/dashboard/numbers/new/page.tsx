"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/utils";

type Available = { phoneNumber: string; locality: string; region: string };

export default function NewNumberPage() {
  const router = useRouter();
  const [area, setArea] = useState("415");
  const [results, setResults] = useState<Available[]>([]);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    const res = await fetch(`/api/phone-numbers?search=1&area=${encodeURIComponent(area)}`);
    setLoading(false);
    const json = await res.json();
    if (!res.ok) return toast.error(json.error ?? "Search failed");
    setResults(json.results ?? []);
  }

  async function buy(e164: string) {
    setBuying(e164);
    const res = await fetch(`/api/phone-numbers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ e164 }),
    });
    setBuying(null);
    const json = await res.json();
    if (!res.ok) return toast.error(json.error ?? "Purchase failed");
    toast.success(`Purchased ${formatPhone(e164)}`);
    router.replace("/dashboard/numbers");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Buy a phone number</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Search available numbers by area code. One-click provisioning.
      </p>
      <Card className="mt-6 p-6">
        <Label>US area code</Label>
        <div className="mt-2 flex gap-2">
          <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="415" />
          <Button onClick={search} disabled={loading}>
            <Search className="h-4 w-4" />
            {loading ? "Searching…" : "Search"}
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <Card className="mt-6">
          <ul className="divide-y divide-white/[0.04]">
            {results.map((r) => (
              <li key={r.phoneNumber} className="flex items-center gap-3 px-6 py-3">
                <Phone className="h-4 w-4 text-[#98C9FF]" />
                <div className="flex-1">
                  <div className="font-mono text-sm text-neutral-50">
                    {formatPhone(r.phoneNumber)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {r.locality}, {r.region}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => buy(r.phoneNumber)}
                  disabled={buying === r.phoneNumber}
                >
                  {buying === r.phoneNumber ? "Buying…" : "Buy"}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
