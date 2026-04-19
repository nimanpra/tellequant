import Link from "next/link";
import { Bot, Plus, Phone, FileStack } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";

export default async function AgentsPage() {
  const { supabase, org } = await requireOrg();
  const { data: agents } = await supabase
    .from("agents")
    .select("*, phone_numbers(e164), knowledge_bases(name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const list = agents ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Agents</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Personas that pick up and drive conversations. One per line, or reuse across multiple
            phone numbers.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agents/new">
            <Plus className="h-4 w-4" />
            New agent
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="mt-8">
          <div className="flex flex-col items-center gap-4 p-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#3E5CF8]/10">
              <Bot className="h-6 w-6 text-[#98C9FF]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-50">No agents yet</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Agents are where persona, voice, LLM, and knowledge come together.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/agents/new">Create your first agent</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/agents/${a.id}`}
              className="group block"
            >
              <Card className="p-6 transition-all group-hover:border-white/[0.14] group-hover:bg-white/[0.035]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#3E5CF8]/30 to-[#98C9FF]/20">
                      <Bot className="h-5 w-5 text-[#98C9FF]" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-neutral-50">{a.name}</div>
                      <div className="text-xs text-zinc-500">
                        {a.llm_provider} · {a.llm_model}
                      </div>
                    </div>
                  </div>
                  <Badge variant={a.is_active ? "success" : "neutral"}>
                    {a.is_active ? "live" : "paused"}
                  </Badge>
                </div>
                <p className="mt-4 line-clamp-2 text-sm text-zinc-400">{a.persona}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
                  {a.knowledge_bases && (
                    <span className="inline-flex items-center gap-1">
                      <FileStack className="h-3 w-3" /> {(a.knowledge_bases as { name: string }).name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {a.phone_numbers?.[0]?.e164 ?? "No number attached"}
                  </span>
                  <span className="ml-auto font-mono">{formatRelative(a.updated_at)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
