"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const res = await fetch("/api/orgs/bootstrap", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "content-type": "application/json" },
    });
    setLoading(false);
    if (!res.ok) return toast.error((await res.json()).error ?? "Failed");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Logo />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight text-neutral-50">
        Let's set up your workspace
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        We create a private workspace per company so your agents, knowledge, and call logs stay
        isolated.
      </p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" placeholder="Briarwood Dental" required autoFocus />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Setting up…" : "Create workspace"}
        </Button>
      </form>
    </div>
  );
}
