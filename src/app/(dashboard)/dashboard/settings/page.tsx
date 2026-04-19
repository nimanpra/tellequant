import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SettingsPage() {
  const { user, org, role } = await requireOrg();
  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Workspace and profile.</p>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-neutral-50">Workspace</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={org.name} readOnly />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={org.slug} readOnly />
          </div>
          <div>
            <Label>Plan</Label>
            <Input value={org.plan} readOnly />
          </div>
          <div>
            <Label>Your role</Label>
            <Input value={role} readOnly />
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-neutral-50">Profile</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Email</Label>
            <Input value={user.email ?? ""} readOnly />
          </div>
          <div>
            <Label>User ID</Label>
            <Input value={user.id} readOnly className="font-mono text-xs" />
          </div>
        </div>
      </Card>
    </div>
  );
}
