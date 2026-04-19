import { decryptSecret, encryptSecret, isEnvelope, type EncryptedEnvelope } from "@/lib/crypto";

// -----------------------------------------------------------------------------
// Provider key registry. Every user-supplied secret the platform accepts must
// be declared here so the settings UI, API validator, and worker decryption
// all agree on the same set of fields.
// -----------------------------------------------------------------------------

export type ProviderId =
  | "telnyx"
  | "twilio"
  | "groq"
  | "openai"
  | "anthropic"
  | "gemini"
  | "deepgram"
  | "cartesia"
  | "elevenlabs";

export interface ProviderKeyField {
  /** Stable key used in storage and API. */
  key: string;
  /** Human label for the UI. */
  label: string;
  /** Short hint rendered under the input. */
  hint?: string;
  /** Input type; password masks characters. */
  type?: "password" | "text";
}

export interface ProviderDef {
  id: ProviderId;
  name: string;
  category: "telephony" | "llm" | "stt" | "tts";
  description: string;
  signupUrl: string;
  fields: ProviderKeyField[];
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: "telnyx",
    name: "Telnyx",
    category: "telephony",
    description: "Default telephony. ~50% cheaper per minute than Twilio.",
    signupUrl: "https://telnyx.com/sign-up",
    fields: [
      { key: "TELNYX_API_KEY", label: "API key", type: "password" },
      {
        key: "TELNYX_CONNECTION_ID",
        label: "TeXML Application ID",
        hint: "The voice app whose webhook points at your Tellequant deployment.",
      },
      {
        key: "TELNYX_PUBLIC_KEY",
        label: "Webhook public key",
        type: "password",
        hint: "Base64 Ed25519 public key from the Telnyx portal. Used to verify inbound voice webhooks.",
      },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "telephony",
    description: "Fallback telephony for legacy numbers.",
    signupUrl: "https://www.twilio.com/try-twilio",
    fields: [
      { key: "TWILIO_ACCOUNT_SID", label: "Account SID" },
      { key: "TWILIO_AUTH_TOKEN", label: "Auth token", type: "password" },
      { key: "TWILIO_APP_SID", label: "TwiML App SID" },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    category: "llm",
    description: "Default LLM. Llama 3.3 70B with ~250ms TTFT.",
    signupUrl: "https://console.groq.com/keys",
    fields: [{ key: "GROQ_API_KEY", label: "API key", type: "password" }],
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "llm",
    description: "GPT-4o / GPT-4o-mini. Also used for default embeddings.",
    signupUrl: "https://platform.openai.com/api-keys",
    fields: [{ key: "OPENAI_API_KEY", label: "API key", type: "password" }],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    category: "llm",
    description: "Claude models for high-reasoning agents.",
    signupUrl: "https://console.anthropic.com",
    fields: [{ key: "ANTHROPIC_API_KEY", label: "API key", type: "password" }],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "llm",
    description: "Gemini 1.5 Flash / Pro.",
    signupUrl: "https://aistudio.google.com/app/apikey",
    fields: [{ key: "GEMINI_API_KEY", label: "API key", type: "password" }],
  },
  {
    id: "deepgram",
    name: "Deepgram",
    category: "stt",
    description: "Default STT (Nova-2) and budget TTS (Aura).",
    signupUrl: "https://console.deepgram.com/signup",
    fields: [{ key: "DEEPGRAM_API_KEY", label: "API key", type: "password" }],
  },
  {
    id: "cartesia",
    name: "Cartesia",
    category: "tts",
    description: "Low-latency Sonic voices.",
    signupUrl: "https://cartesia.ai",
    fields: [{ key: "CARTESIA_API_KEY", label: "API key", type: "password" }],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "tts",
    description: "Premium cloned/custom voices.",
    signupUrl: "https://elevenlabs.io",
    fields: [{ key: "ELEVENLABS_API_KEY", label: "API key", type: "password" }],
  },
];

export function providerById(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function allowedKeyNames(): Set<string> {
  const out = new Set<string>();
  for (const p of PROVIDERS) for (const f of p.fields) out.add(f.key);
  return out;
}

// -----------------------------------------------------------------------------
// Storage shape: the organizations.provider_keys_encrypted JSONB column is
// a flat map of { <KEY_NAME>: EncryptedEnvelope }. We never store plaintext
// and never return plaintext from user-facing routes.
// -----------------------------------------------------------------------------

export type EncryptedKeyMap = Record<string, EncryptedEnvelope>;

export function parseEncryptedMap(value: unknown): EncryptedKeyMap {
  if (!value || typeof value !== "object") return {};
  const out: EncryptedKeyMap = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (isEnvelope(v)) out[k] = v;
  }
  return out;
}

export interface UpsertInput {
  provider: ProviderId;
  fields: Record<string, string | null>; // null = remove
}

export function upsertKeysForProvider(
  current: EncryptedKeyMap,
  input: UpsertInput,
): EncryptedKeyMap {
  const def = providerById(input.provider);
  if (!def) throw new Error(`Unknown provider "${input.provider}"`);
  const allowed = new Set(def.fields.map((f) => f.key));

  const next: EncryptedKeyMap = { ...current };
  for (const [name, raw] of Object.entries(input.fields)) {
    if (!allowed.has(name)) {
      throw new Error(`Field "${name}" is not valid for provider "${input.provider}"`);
    }
    if (raw === null || raw === undefined || raw === "") {
      delete next[name];
      continue;
    }
    if (typeof raw !== "string") {
      throw new Error(`Field "${name}" must be a string`);
    }
    // Length cap — longest keys we've seen are ~200 chars (Stripe restricted, etc.).
    if (raw.length > 4000) throw new Error(`Field "${name}" is too long`);
    next[name] = encryptSecret(raw);
  }
  return next;
}

export interface ProviderStatus {
  provider: ProviderId;
  configured: boolean;
  fields: Array<{ key: string; configured: boolean }>;
}

export function statusFor(current: EncryptedKeyMap): ProviderStatus[] {
  return PROVIDERS.map((p) => {
    const fields = p.fields.map((f) => ({ key: f.key, configured: Boolean(current[f.key]) }));
    return {
      provider: p.id,
      configured: fields.every((f) => f.configured),
      fields,
    };
  });
}

/**
 * Decrypt the full map. Used server-side only (worker and demo chat routes).
 * Individual failures don't poison the whole map — a single corrupted envelope
 * is skipped and the rest continue.
 */
export function decryptAll(map: EncryptedKeyMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, env] of Object.entries(map)) {
    try {
      out[k] = decryptSecret(env);
    } catch {
      // Skip — likely a rotated ENCRYPTION_KEY or corrupted envelope.
    }
  }
  return out;
}
