import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AgentTester } from "@/components/dashboard/agent-tester";
import { requireOrg } from "@/lib/auth";

export default async function AgentTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, persona, opening_line, voice_provider, voice_id, llm_provider, llm_model")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500">
            <Link href="/dashboard/agents" className="hover:text-zinc-300">
              Agents
            </Link>{" "}
            /{" "}
            <Link href={`/dashboard/agents/${agent.id}`} className="hover:text-zinc-300">
              {agent.name}
            </Link>{" "}
            / <span className="text-zinc-400">Test live</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">
            Test {agent.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Browser-based voice session. Uses your mic + speakers. No phone call placed.
          </p>
        </div>
        <Link
          href={`/dashboard/agents/${agent.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#98C9FF]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to agent
        </Link>
      </div>

      <AgentTester agent={agent} />
    </div>
  );
}
