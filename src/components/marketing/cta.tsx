import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#3E5CF8]/15 to-transparent px-8 py-20 text-center">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_30%,rgba(62,92,248,0.35),transparent_70%)]"
          />
          <h2 className="text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
            Spin up your AI call center in an afternoon.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
            Upload your docs, tune a persona, point a number. Tellequant handles every call while you
            focus on the work only humans can do.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Start for free</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">Book a demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
