import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/[0.06] lg:block">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(50%_50%_at_30%_30%,rgba(62,92,248,0.22),transparent_70%)]"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/">
            <Logo />
          </Link>
          <div>
            <p className="max-w-md text-2xl font-medium leading-tight tracking-tight text-neutral-100">
              "We replaced an eight-seat support desk with Tellequant in three weeks and never went
              back. 91% first-call containment, 24/7, in seven languages."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3E5CF8] to-[#98C9FF]" />
              <div>
                <div className="text-sm font-medium text-neutral-50">Jordan Rivera</div>
                <div className="text-xs text-zinc-500">COO · Helix Clinics</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            3.2M calls answered · 99.98% uptime
          </div>
        </div>
      </aside>
      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <Link href="/" className="text-xs text-zinc-500 hover:text-white">
              ← Home
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
