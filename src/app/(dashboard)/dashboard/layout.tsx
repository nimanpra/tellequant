import { requireOrg } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrg();
  return (
    <div className="flex min-h-screen bg-[#0A0D14]">
      <Sidebar orgName={org.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user.email ?? ""} />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
