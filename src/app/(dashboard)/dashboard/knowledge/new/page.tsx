"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function NewKnowledgeBasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name")),
        description: String(form.get("description") || ""),
      }),
    });
    setLoading(false);
    if (!res.ok) return toast.error((await res.json()).error ?? "Failed");
    const { kb } = await res.json();
    router.replace(`/dashboard/knowledge/${kb.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">New knowledge base</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Create an empty KB — you'll add docs on the next screen.
      </p>
      <Card className="mt-8 p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Name</Label>
            <Input name="name" placeholder="Company policies" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" placeholder="Customer-facing policies, refund rules, SLAs…" />
          </div>
          <Button type="submit" disabled={loading} className="self-start">
            {loading ? "Creating…" : "Create KB"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
