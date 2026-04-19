import Link from "next/link";
import { FileStack, Plus } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/utils";

export default async function KnowledgePage() {
  const { supabase, org } = await requireOrg();
  const { data: kbs } = await supabase
    .from("knowledge_bases")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });
  const list = kbs ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Knowledge base</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Drop docs here and Tellequant grounds every agent reply in your real content.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/knowledge/new">
            <Plus className="h-4 w-4" /> New KB
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="mt-8">
          <div className="flex flex-col items-center gap-4 p-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#3E5CF8]/10">
              <FileStack className="h-6 w-6 text-[#98C9FF]" />
            </div>
            <h3 className="text-base font-semibold text-neutral-50">No knowledge bases yet</h3>
            <p className="max-w-md text-sm text-zinc-400">
              A knowledge base holds everything an agent should know — policies, product catalogs,
              FAQs, SOPs. We chunk + embed + index to pgvector automatically.
            </p>
            <Button asChild>
              <Link href="/dashboard/knowledge/new">Create a KB</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((kb) => (
            <Link key={kb.id} href={`/dashboard/knowledge/${kb.id}`} className="group block">
              <Card className="h-full p-6 transition-colors group-hover:border-white/[0.14] group-hover:bg-white/[0.035]">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#3E5CF8]/10">
                    <FileStack className="h-5 w-5 text-[#98C9FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-neutral-50">{kb.name}</div>
                    <div className="text-xs text-zinc-500 font-mono">
                      {kb.embedding_model}
                    </div>
                  </div>
                </div>
                {kb.description && (
                  <p className="mt-4 line-clamp-2 text-sm text-zinc-400">{kb.description}</p>
                )}
                <div className="mt-5 flex items-center gap-4 text-xs text-zinc-500">
                  <span>{kb.doc_count} docs</span>
                  <span>{kb.chunk_count} chunks</span>
                  <span className="ml-auto font-mono">{formatRelative(kb.created_at)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
