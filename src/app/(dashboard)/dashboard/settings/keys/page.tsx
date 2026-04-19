import { ShieldCheck } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { KeysForm } from "@/components/dashboard/keys-form";
import { PROVIDERS, parseEncryptedMap, statusFor } from "@/lib/byok";

export const dynamic = "force-dynamic";

export default async function KeysSettingsPage() {
  const { org } = await requireOrg();
  const current = parseEncryptedMap(org.provider_keys_encrypted);
  const initialStatus = statusFor(current);

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Provider keys</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Tellequant runs on <span className="text-neutral-200">your</span> provider accounts. Paste
          your keys below — every call, STT chunk, LLM request, and TTS synth hits your billing, not
          ours.
        </p>
      </div>

      <Card className="mt-6 flex gap-3 border-emerald-500/20 bg-emerald-500/[0.04] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div className="text-xs text-zinc-300">
          <div className="font-medium text-neutral-50">End-to-end encrypted</div>
          <p className="mt-1 leading-relaxed text-zinc-400">
            Keys are encrypted with AES-256-GCM at rest. They are only decrypted in-memory on the
            voice worker during an active call, and never returned to the browser. You can rotate
            or remove them any time.
          </p>
        </div>
      </Card>

      <div className="mt-8">
        <KeysForm providers={PROVIDERS} initialStatus={initialStatus} />
      </div>
    </div>
  );
}
