import Link from "next/link";
import { Phone, Plus } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/lib/utils";

export default async function NumbersPage() {
  const { supabase, org } = await requireOrg();
  const { data: numbers } = await supabase
    .from("phone_numbers")
    .select("*, agents(name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });
  const list = numbers ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Phone numbers</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Buy numbers from Telnyx or Twilio, or port your own. Each can route to a different
            agent.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/numbers/new">
            <Plus className="h-4 w-4" /> Buy a number
          </Link>
        </Button>
      </div>

      <Card className="mt-8">
        {list.length === 0 ? (
          <div className="grid place-items-center gap-3 p-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#3E5CF8]/10">
              <Phone className="h-6 w-6 text-[#98C9FF]" />
            </div>
            <h3 className="text-base font-semibold text-neutral-50">No numbers yet</h3>
            <p className="max-w-md text-sm text-zinc-400">
              Connect a phone number to start receiving calls or running outbound campaigns.
            </p>
            <Button asChild>
              <Link href="/dashboard/numbers/new">Buy a number</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {list.map((n) => (
              <li key={n.id} className="flex items-center gap-4 px-6 py-4">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#3E5CF8]/10">
                  <Phone className="h-4 w-4 text-[#98C9FF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-neutral-50 font-mono">
                    {formatPhone(n.e164)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {n.friendly_name ?? "—"} ·{" "}
                    {n.agents ? (n.agents as { name: string }).name : "no agent"}
                  </div>
                </div>
                <Badge variant={n.provider === "twilio" ? "accent" : "neutral"}>
                  {n.provider}
                </Badge>
                <Badge variant={n.is_active ? "success" : "neutral"}>
                  {n.is_active ? "active" : "paused"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
