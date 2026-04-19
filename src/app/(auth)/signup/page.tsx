"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const company = String(form.get("company"));

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { company },
        emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);

    if (data.session) {
      await fetch("/api/orgs/bootstrap", {
        method: "POST",
        body: JSON.stringify({ name: company }),
        headers: { "content-type": "application/json" },
      });
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    toast.success("Check your email to confirm — we sent you a link.");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Create your workspace</h1>
      <p className="mt-1.5 text-sm text-zinc-400">Free forever · 100 min/month inbound.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" placeholder="Briarwood Dental" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <span className="text-[11px] text-zinc-500">Minimum 8 characters.</span>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create workspace"}
        </Button>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          By continuing, you agree to the{" "}
          <Link href="/legal/terms" className="underline-offset-2 hover:text-zinc-300">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline-offset-2 hover:text-zinc-300">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-[#98C9FF] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
