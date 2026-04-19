"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  FileStack,
  PhoneCall,
  PhoneOutgoing,
  ListMusic,
  BarChart3,
  Settings,
  CreditCard,
  KeySquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

const groups: { label: string; items: { href: string; label: string; icon: typeof Bot }[] }[] = [
  {
    label: "Build",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/agents", label: "Agents", icon: Bot },
      { href: "/dashboard/knowledge", label: "Knowledge base", icon: FileStack },
      { href: "/dashboard/numbers", label: "Phone numbers", icon: PhoneCall },
    ],
  },
  {
    label: "Run",
    items: [
      { href: "/dashboard/campaigns", label: "Campaigns", icon: PhoneOutgoing },
      { href: "/dashboard/calls", label: "Call logs", icon: ListMusic },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/api-keys", label: "API keys", icon: KeySquare },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0D14]/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-4">
        <Logo />
      </div>
      <div className="mx-3 mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Workspace
        </div>
        <div className="mt-0.5 text-sm font-medium text-neutral-50 truncate">{orgName}</div>
      </div>
      <nav className="mt-5 flex flex-1 flex-col gap-6 px-3 pb-6 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              {g.label}
            </div>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? path === "/dashboard"
                    : path.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-white/[0.06] text-neutral-50"
                          : "text-zinc-400 hover:bg-white/[0.03] hover:text-neutral-100"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <Link
          href="/dashboard/billing"
          className="flex items-center justify-between rounded-lg border border-[#3E5CF8]/30 bg-[#3E5CF8]/10 px-3 py-2 text-xs text-[#98C9FF] transition-colors hover:bg-[#3E5CF8]/15"
        >
          <span>Free plan · 23 / 100 min used</span>
          <span className="font-medium">Upgrade →</span>
        </Link>
      </div>
    </aside>
  );
}
