"use client";

import { useRouter } from "next/navigation";
import { Search, LogOut, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Topbar({ email }: { email: string }) {
  const router = useRouter();

  async function onSignOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success("Signed out");
      router.replace("/");
    } catch {
      toast.error("Sign-out failed. Please try again.");
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0A0D14]/70 px-6 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Search calls, agents, docs…"
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-16 text-sm text-neutral-50 placeholder:text-zinc-500 focus:border-[#3E5CF8]/40 focus:outline-none focus:ring-2 focus:ring-[#3E5CF8]/15"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
            ⌘K
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <div className="mx-2 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#3E5CF8] to-[#98C9FF] text-[10px] font-semibold text-white">
            {initials(email)}
          </div>
          <span className="text-xs text-zinc-300 max-w-[140px] truncate">{email}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
