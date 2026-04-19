import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { ApiKeyManager } from "@/components/dashboard/api-key-manager";

export default async function ApiKeysPage() {
  const { supabase, org } = await requireOrg();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used, revoked_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">API keys</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Use Tellequant programmatically — place calls, upload contacts, query call logs from your own
          app.
        </p>
      </div>
      <Card className="mt-6 p-0">
        <ApiKeyManager initial={keys ?? []} />
      </Card>
    </div>
  );
}
