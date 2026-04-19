"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SUBJECTS = ["Sales", "Support", "Partnership", "Press", "Other"] as const;

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("Sales");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    toast.success("Thanks — we'll be in touch within one business day.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Ada Lovelace" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ada@example.com"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" placeholder="Briarwood Dental" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Subject</Label>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSubject(s)}
              className={
                "rounded-full border px-3 py-1 text-xs transition-colors " +
                (subject === s
                  ? "border-[#3E5CF8] bg-[#3E5CF8]/10 text-[#98C9FF]"
                  : "border-white/[0.08] bg-transparent text-zinc-400 hover:text-white")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          placeholder="What are you working on? What are you trying to solve?"
          className="resize-y rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 placeholder:text-zinc-500 focus:border-[#3E5CF8]/60 focus:outline-none"
        />
      </div>
      <input type="hidden" name="subject" value={subject} />
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          We reply within one business day. No marketing sequences.
        </p>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
