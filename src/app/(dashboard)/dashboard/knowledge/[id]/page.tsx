import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/auth";
import { DocUploader } from "@/components/dashboard/doc-uploader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";
import { SearchPlayground } from "@/components/dashboard/search-playground";

export default async function KbDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();
  const { data: kb } = await supabase
    .from("knowledge_bases")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  if (!kb) notFound();
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("kb_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-xs text-zinc-500">
        <Link href="/dashboard/knowledge" className="hover:text-zinc-300">
          Knowledge base
        </Link>{" "}
        / <span className="text-zinc-400">{kb.name}</span>
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">{kb.name}</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {kb.doc_count} docs · {kb.chunk_count} chunks · embedded with{" "}
        <span className="font-mono text-zinc-300">{kb.embedding_model}</span>
      </p>

      <Card className="mt-8 p-6">
        <DocUploader kbId={kb.id} />
      </Card>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Documents
      </h2>
      <Card className="mt-3">
        {!docs || docs.length === 0 ? (
          <div className="grid place-items-center p-10 text-sm text-zinc-500">
            No docs yet. Drop files above.
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-4 px-6 py-3">
                <div className="flex-1">
                  <div className="text-sm text-neutral-100">{d.name}</div>
                  <div className="text-xs text-zinc-500 font-mono">
                    {(d.size_bytes / 1024).toFixed(0)} KB · {d.mime_type}
                  </div>
                </div>
                <Badge
                  variant={
                    d.status === "ready"
                      ? "success"
                      : d.status === "failed"
                      ? "danger"
                      : "warning"
                  }
                >
                  {d.status}
                </Badge>
                <span className="font-mono text-xs text-zinc-500">
                  {formatRelative(d.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Retrieval playground
      </h2>
      <Card className="mt-3 p-6">
        <SearchPlayground kbId={kb.id} />
      </Card>
    </div>
  );
}
