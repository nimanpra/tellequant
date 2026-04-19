"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCallDemo } from "@/components/marketing/live-call-demo";

export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden pt-40 pb-20 sm:pt-48 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#98C9FF]">
            <Mic className="h-3 w-3" />
            <span className="font-mono tracking-tight">v1.0 · Live now</span>
          </span>

          <h1 className="mt-7 text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl md:text-7xl">
            <span className="text-gradient">Every call, answered.</span>
            <br />
            <span className="text-neutral-200">At every hour. For every caller.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Tellequant is the agentic call center for every business. Upload your docs, shape a persona,
            point a phone number — and a tireless AI agent picks up every inbound call and runs
            autonomous outbound campaigns backed by your own knowledge base.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#demo">Try the live demo</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Free demo chat · Bring your own keys · No credit card
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          className="mt-20"
        >
          <LiveCallDemo />
        </motion.div>
      </div>
    </section>
  );
}
