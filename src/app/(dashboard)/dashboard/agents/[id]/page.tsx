import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { AgentForm } from "@/components/dashboard/agent-form";
import { Button } from "@/components/ui/button";
import { requireOrg } from "@/lib/auth";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();
  const [{ data: agent }, { data: kbs }] = await Promise.all([
    supabase.from("agents").select("*").eq("id", id).eq("org_id", org.id).single(),
    supabase.from("knowledge_bases").select("id, name").eq("org_id", org.id),
  ]);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-zinc-500">
            <Link href="/dashboard/agents" className="hover:text-zinc-300">
              Agents
            </Link>{" "}
            / <span className="text-zinc-400">{agent.name}</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">
            {agent.name}
          </h1>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/agents/${agent.id}/test`}>
            <Play className="h-4 w-4" /> Test live
          </Link>
        </Button>
      </div>
      <AgentForm mode="edit" agent={agent} knowledgeBases={kbs ?? []} />
    </div>
  );
}
