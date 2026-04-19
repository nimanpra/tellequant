export type VoiceOption = {
  id: string;
  label: string;
  provider: "deepgram" | "cartesia" | "elevenlabs" | "openai";
  language: string;
  gender: "male" | "female" | "neutral";
  style: string;
  sampleUrl?: string;
};

export const VOICES: VoiceOption[] = [
  { id: "aura-2-thalia-en", label: "Thalia", provider: "deepgram", language: "en-US", gender: "female", style: "warm, professional" },
  { id: "aura-2-apollo-en", label: "Apollo", provider: "deepgram", language: "en-US", gender: "male",   style: "confident, measured" },
  { id: "aura-2-luna-en",   label: "Luna",   provider: "deepgram", language: "en-US", gender: "female", style: "friendly, upbeat" },
  { id: "aura-2-orion-en",  label: "Orion",  provider: "deepgram", language: "en-US", gender: "male",   style: "calm, assuring" },
  { id: "sonic-2-alex",     label: "Alex",   provider: "cartesia", language: "en-US", gender: "neutral", style: "clear, neutral, low-latency" },
  { id: "sonic-2-mia",      label: "Mia",    provider: "cartesia", language: "en-US", gender: "female", style: "empathetic, soft" },
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel", provider: "elevenlabs", language: "en-US", gender: "female", style: "premium studio voice" },
  { id: "gpt-4o-mini-tts-alloy", label: "Alloy",  provider: "openai",   language: "en-US", gender: "neutral", style: "natural, conversational" },
];

export type LLMOption = { id: string; label: string; provider: string; notes: string };
export const LLMS: LLMOption[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)", provider: "groq",   notes: "Free tier · ~250ms TTFT · default" },
  { id: "gemini-2.5-flash",     label: "Gemini 2.5 Flash",   provider: "gemini",    notes: "$0.15/$0.60 · cheap at scale" },
  { id: "gpt-4o-mini",          label: "GPT-4o mini",        provider: "openai",    notes: "$0.15/$0.60 · balanced" },
  { id: "gpt-4.1-mini",         label: "GPT-4.1 mini",       provider: "openai",    notes: "$0.40/$1.60 · strongest reasoning" },
  { id: "claude-haiku-4-5",     label: "Claude Haiku 4.5",   provider: "anthropic", notes: "$1.00/$5.00 · premium tone" },
];

export type ToolDef = {
  id: string;
  label: string;
  description: string;
  icon: string;
  builtin: boolean;
  schema: Record<string, unknown>;
};

export const BUILTIN_TOOLS: ToolDef[] = [
  {
    id: "search_knowledge_base",
    label: "Search knowledge base",
    description: "Retrieve top-k chunks from the agent's attached knowledge base. Called automatically mid-turn.",
    icon: "file-stack",
    builtin: true,
    schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    id: "end_call",
    label: "End call",
    description: "Gracefully hang up after a short closing line.",
    icon: "phone-off",
    builtin: true,
    schema: { type: "object", properties: { reason: { type: "string" } } },
  },
  {
    id: "transfer_call",
    label: "Warm transfer",
    description: "Transfer caller to a human extension or phone number.",
    icon: "phone-forwarded",
    builtin: true,
    schema: {
      type: "object",
      properties: { to: { type: "string" }, note: { type: "string" } },
      required: ["to"],
    },
  },
  {
    id: "send_sms",
    label: "Send SMS",
    description: "Text the caller with structured info (link, code, confirmation).",
    icon: "message-square",
    builtin: true,
    schema: {
      type: "object",
      properties: { to: { type: "string" }, message: { type: "string" } },
      required: ["to", "message"],
    },
  },
  {
    id: "schedule_meeting",
    label: "Schedule meeting",
    description: "Book a slot on a calendar.",
    icon: "calendar",
    builtin: true,
    schema: {
      type: "object",
      properties: {
        when_iso: { type: "string" },
        duration_minutes: { type: "number" },
        attendee_email: { type: "string" },
        subject: { type: "string" },
      },
      required: ["when_iso", "duration_minutes"],
    },
  },
  {
    id: "webhook",
    label: "Webhook",
    description: "Call an arbitrary HTTPS endpoint (your backend) with typed args.",
    icon: "webhook",
    builtin: true,
    schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        method: { enum: ["POST", "PUT"] },
        body: { type: "object" },
      },
      required: ["url"],
    },
  },
];
