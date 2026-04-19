import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Terminal } from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "SDKs · Docs",
  description: "TypeScript and Python SDKs are coming alongside the public API.",
};

export default function SdksDocsPage() {
  return (
    <>
      <PageHero
        eyebrow="SDKs"
        title="SDKs — coming soon."
        subtitle="TypeScript and Python clients will ship alongside the public API, generated from a shared OpenAPI spec."
      />

      <ContentSection>
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#98C9FF]"
        >
          <ArrowLeft className="h-4 w-4" /> All docs
        </Link>

        <Card className="mt-8 p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#3E5CF8]/10 text-[#98C9FF]">
              <Terminal className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-neutral-50">
                  Paired with the API beta
                </h2>
                <Badge variant="accent">Coming soon</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Official <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">@tellequant/sdk</code>{" "}
                (TypeScript) and <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">tellequant</code>{" "}
                (Python) will ship when the{" "}
                <Link href="/docs/api" className="text-[#98C9FF] hover:underline">
                  public API
                </Link>{" "}
                exits beta. Both will be generated from the same OpenAPI spec the API serves, with
                automatic retries, streaming iterators, and webhook verification helpers.
              </p>
              <a
                href="mailto:api-beta@tellequant.com?subject=SDK%20beta%20access"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#98C9FF] hover:underline"
              >
                <Mail className="h-4 w-4" /> Request beta access
              </a>
            </div>
          </div>
        </Card>
      </ContentSection>
    </>
  );
}
