import { AgentForm } from "@/components/dashboard/agent-form";
import { requireOrg } from "@/lib/auth";

export default async function NewAgentPage() {
  const { supabase, org } = await requireOrg();
  const [{ data: kbs }] = await Promise.all([
    supabase.from("knowledge_bases").select("id, name").eq("org_id", org.id),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">New agent</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Shape a persona, pick a voice, attach a knowledge base and tools. Test live in the
          playground after save.
        </p>
      </div>
      <AgentForm knowledgeBases={kbs ?? []} mode="create" />
    </div>
  );
}
