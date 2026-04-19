import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  return { user, supabase };
}

export async function requireOrg() {
  const { user, supabase } = await requireUser();
  const { data: memberships } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const first = memberships?.[0];
  if (!first?.organizations) redirect("/onboarding");
  return { user, supabase, org: first.organizations, role: first.role };
}
