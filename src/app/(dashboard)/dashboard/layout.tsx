import { requireOrg } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { planById } from "@/lib/billing/plans";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrg();
  const plan = planById(org.plan);
  const badge = {
    planLabel: plan?.name ?? org.plan,
    creditsRemaining: org.credits_balance_minutes ?? 0,
    planType: (org.plan_type ?? "self_host") as "self_host" | "cloud",
  };
  return (
    <div className="flex min-h-screen bg-[#0A0D14]">
      <Sidebar orgName={org.name} badge={badge} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user.email ?? ""} />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
