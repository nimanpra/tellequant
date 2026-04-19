import type { Metadata } from "next";
import {
  Lock,
  ShieldCheck,
  Database,
  KeyRound,
  Globe,
  FileKey,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { PageHero, ContentSection } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Tellequant protects your data: encryption, isolation, audit, compliance, and retention.",
};

const PILLARS = [
  {
    icon: Lock,
    title: "Encryption everywhere",
    body: "TLS 1.3 in transit, AES-256 at rest. Recordings and transcripts are encrypted with per-tenant keys before they touch disk.",
  },
  {
    icon: Database,
    title: "Row-level isolation",
    body: "Every query passes through Postgres RLS scoped to your organization. Cross-tenant reads are physically impossible by design.",
  },
  {
    icon: KeyRound,
    title: "Zero-trust API keys",
    body: "API keys are hashed with SHA-256; plaintext is shown exactly once. All internal worker ↔ API calls are HMAC-signed.",
  },
  {
    icon: Eye,
    title: "No model training on you",
    body: "Your transcripts, recordings, and documents are never used to train any model. Provider contracts exclude training explicitly.",
  },
  {
    icon: Globe,
    title: "Data residency",
    body: "US and EU regions available. Pick where your data lives; it doesn't move without your consent.",
  },
  {
    icon: FileKey,
    title: "Audit everything",
    body: "Signed, append-only audit logs for every admin action. Export to your SIEM in JSON, CSV, or via the webhook firehose.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance posture",
    body: "Built with GDPR and CCPA principles from day one. A formal SOC 2 audit is on the roadmap, and our HIPAA-aware design will pair with a BAA when we announce Enterprise.",
  },
  {
    icon: AlertTriangle,
    title: "Responsible disclosure",
    body: "Found a vulnerability? Email security@tellequant.com. We respond within 24h and pay bounties for valid reports.",
  },
];

const SUBPROCESSORS = [
  { name: "Supabase", purpose: "Managed Postgres, auth, storage", region: "US / EU" },
  { name: "Twilio", purpose: "Telephony, SMS, Media Streams", region: "Global" },
  { name: "Deepgram", purpose: "STT + TTS", region: "US" },
  { name: "Google (Gemini API)", purpose: "LLM inference", region: "US / EU" },
  { name: "OpenAI", purpose: "Embeddings, optional LLM", region: "US" },
  { name: "Cartesia", purpose: "TTS (optional)", region: "US" },
  { name: "Fly.io / Vercel", purpose: "Compute + edge", region: "US / EU" },
  { name: "Stripe", purpose: "Billing", region: "US" },
];

const RETENTION = [
  { type: "Call recordings", value: "30 days default · configurable up to 10 years" },
  { type: "Transcripts & events", value: "Retained per workspace policy (default 2 years)" },
  { type: "Knowledge base content", value: "Until you delete it" },
  { type: "Audit logs", value: "1 year on Pro · 7 years on Enterprise" },
  { type: "Deleted data", value: "Purged from backups within 30 days" },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Boring, by design."
        subtitle="Your calls, transcripts, and knowledge are the quietest parts of our platform. Encryption, isolation, audit — on by default, not bolted on."
      />

      <ContentSection width="wide">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <Card key={p.title} className="p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#3E5CF8]/10 text-[#98C9FF]">
                <p.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-neutral-50">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.body}</p>
            </Card>
          ))}
        </div>
      </ContentSection>

      <ContentSection width="wide" className="border-t border-white/[0.06]">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">
              Sub-processors
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              The vendors that help us deliver Tellequant. Updated on every change.
            </p>
            <Card className="mt-5 overflow-hidden p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">Purpose</th>
                    <th className="px-5 py-3">Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {SUBPROCESSORS.map((s) => (
                    <tr key={s.name}>
                      <td className="px-5 py-3 font-medium text-neutral-100">{s.name}</td>
                      <td className="px-5 py-3 text-zinc-400">{s.purpose}</td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-500">{s.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">Retention</h2>
            <p className="mt-2 text-sm text-zinc-400">
              How long we keep things — and when they're purged.
            </p>
            <Card className="mt-5 p-0">
              <ul className="divide-y divide-white/[0.04]">
                {RETENTION.map((r) => (
                  <li key={r.type} className="px-5 py-4">
                    <div className="text-[13px] font-semibold text-neutral-100">{r.type}</div>
                    <div className="mt-0.5 text-sm text-zinc-400">{r.value}</div>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="mt-6 flex items-center gap-2 flex-wrap">
              <Badge variant="accent">GDPR · CCPA principles</Badge>
              <Badge variant="neutral">SOC 2 on roadmap</Badge>
              <Badge variant="neutral">HIPAA-aware design</Badge>
            </div>
          </div>
        </div>
      </ContentSection>

      <ContentSection className="border-t border-white/[0.06]">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">DPA &amp; compliance questions</h2>
        <p className="mt-3 text-[15px] text-zinc-400">
          We can countersign a standard DPA today. BAAs will be available when Enterprise launches
          — we're happy to walk you through the current posture in the meantime. Email{" "}
          <a
            href="mailto:security@tellequant.com"
            className="text-[#98C9FF] underline-offset-2 hover:underline"
          >
            security@tellequant.com
          </a>
          .
        </p>
      </ContentSection>
    </>
  );
}
