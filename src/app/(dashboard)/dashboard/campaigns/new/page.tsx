import { requireOrg } from "@/lib/auth";
import { CampaignForm } from "@/components/dashboard/campaign-form";

export default async function NewCampaignPage() {
  const { supabase, org } = await requireOrg();
  const [{ data: agents }, { data: numbers }] = await Promise.all([
    supabase.from("agents").select("id, name").eq("org_id", org.id).eq("is_active", true),
    supabase.from("phone_numbers").select("id, e164").eq("org_id", org.id).eq("is_active", true),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">New campaign</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Upload contacts, write a directive, and Tellequant will work the list autonomously.
      </p>
      <CampaignForm agents={agents ?? []} numbers={numbers ?? []} />
    </div>
  );
}
