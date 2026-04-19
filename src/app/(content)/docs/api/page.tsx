import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Braces } from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "API reference · Docs",
  description: "The Tellequant public API is coming soon.",
};

export default function ApiDocsPage() {
  return (
    <>
      <PageHero
        eyebrow="API reference"
        title="Public API — coming soon."
        subtitle="Our REST API is in active development. All dashboard actions will be available as versioned, HMAC-signed endpoints."
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
              <Braces className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-neutral-50">
                  Private beta in progress
                </h2>
                <Badge variant="accent">Coming soon</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                We're finalizing the public API surface — agents, calls, campaigns, contacts,
                knowledge bases — alongside stable HMAC-signed auth, rate limits, and OpenAPI.
                Until then, dashboard actions handle every workflow. If you need programmatic
                access today, join the API beta and we'll share the preview spec.
              </p>
              <a
                href="mailto:api-beta@tellequant.com?subject=API%20beta%20access"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#98C9FF] hover:underline"
              >
                <Mail className="h-4 w-4" /> Request beta access
              </a>
            </div>
          </div>
        </Card>

        <Card className="mt-4 p-8">
          <h3 className="text-[15px] font-semibold text-neutral-50">
            What's shipping in the first release
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#3E5CF8]" />
              Versioned endpoints under <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">/v1/</code>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#3E5CF8]" />
              Workspace-scoped API keys (SHA-256 hashed, shown once)
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#3E5CF8]" />
              HMAC-signed webhooks for call + campaign lifecycle
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#3E5CF8]" />
              OpenAPI 3.1 spec, Postman collection, TS + Python SDKs
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#3E5CF8]" />
              Rate limits, idempotency keys, cursor pagination
            </li>
          </ul>
        </Card>
      </ContentSection>
    </>
  );
}
