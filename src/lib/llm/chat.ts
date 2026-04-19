// =============================================================================
// Minimal BYOK streaming chat dispatcher. Intentionally dependency-free — no
// AI SDK. We forward requests directly to each provider's own HTTP API using
// the keys the user has stored in `organizations.provider_keys_encrypted`.
//
// This is used by the Free-plan demo chat only. The voice worker handles live
// calls in Python and has its own provider abstraction.
// =============================================================================

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  provider: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  apiKeys: Record<string, string>;
  signal?: AbortSignal;
}

export interface ChatChunk {
  delta: string;
  done: boolean;
}

export class ChatConfigError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Stream assistant text deltas from the selected provider. Yields chunks with
 * incremental text; the final chunk always has `done: true` and `delta: ""`.
 */
export async function* streamChat(options: ChatOptions): AsyncGenerator<ChatChunk> {
  const provider = options.provider.toLowerCase();

  if (provider === "groq" || provider === "openai") {
    const baseUrl =
      provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
    const keyName = provider === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY";
    const apiKey = options.apiKeys[keyName];
    if (!apiKey) {
      throw new ChatConfigError(
        "missing_key",
        `Missing ${keyName}. Add it on the Provider keys page to use ${provider} for demos.`,
      );
    }
    yield* streamOpenAICompat({
      url: baseUrl,
      apiKey,
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      signal: options.signal,
    });
    return;
  }

  if (provider === "anthropic") {
    const apiKey = options.apiKeys.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ChatConfigError(
        "missing_key",
        "Missing ANTHROPIC_API_KEY. Add it on the Provider keys page to use Anthropic for demos.",
      );
    }
    yield* streamAnthropic({
      apiKey,
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      signal: options.signal,
    });
    return;
  }

  if (provider === "gemini") {
    const apiKey = options.apiKeys.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ChatConfigError(
        "missing_key",
        "Missing GEMINI_API_KEY. Add it on the Provider keys page to use Gemini for demos.",
      );
    }
    yield* streamGemini({
      apiKey,
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      signal: options.signal,
    });
    return;
  }

  throw new ChatConfigError(
    "unsupported_provider",
    `Demo chat does not support provider "${options.provider}". Use groq, openai, anthropic, or gemini.`,
  );
}

// -----------------------------------------------------------------------------
// OpenAI-compatible (Groq, OpenAI)
// -----------------------------------------------------------------------------

interface OpenAICompatArgs {
  url: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

async function* streamOpenAICompat(args: OpenAICompatArgs): AsyncGenerator<ChatChunk> {
  const res = await fetch(args.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: args.temperature ?? 0.7,
      max_tokens: args.maxTokens ?? 512,
      stream: true,
    }),
    signal: args.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new ChatConfigError(
      "upstream_error",
      `Upstream ${res.status}: ${text.slice(0, 500) || res.statusText}`,
    );
  }
  for await (const event of readSSE(res.body)) {
    if (!event.data || event.data === "[DONE]") {
      if (event.data === "[DONE]") yield { delta: "", done: true };
      continue;
    }
    try {
      const payload = JSON.parse(event.data) as {
        choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
      };
      const delta = payload.choices?.[0]?.delta?.content ?? "";
      if (delta) yield { delta, done: false };
    } catch {
      /* skip malformed chunk */
    }
  }
  yield { delta: "", done: true };
}

// -----------------------------------------------------------------------------
// Anthropic (/v1/messages with stream=true)
// -----------------------------------------------------------------------------

interface AnthropicArgs {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

async function* streamAnthropic(args: AnthropicArgs): AsyncGenerator<ChatChunk> {
  const systemParts = args.messages.filter((m) => m.role === "system").map((m) => m.content);
  const chat = args.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: args.model,
      messages: chat,
      system: systemParts.join("\n\n") || undefined,
      temperature: args.temperature ?? 0.7,
      max_tokens: args.maxTokens ?? 512,
      stream: true,
    }),
    signal: args.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new ChatConfigError(
      "upstream_error",
      `Upstream ${res.status}: ${text.slice(0, 500) || res.statusText}`,
    );
  }
  for await (const event of readSSE(res.body)) {
    if (!event.data) continue;
    try {
      const payload = JSON.parse(event.data) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };
      if (payload.type === "content_block_delta" && payload.delta?.type === "text_delta") {
        const delta = payload.delta.text ?? "";
        if (delta) yield { delta, done: false };
      }
      if (payload.type === "message_stop") {
        yield { delta: "", done: true };
      }
    } catch {
      /* skip malformed chunk */
    }
  }
}

// -----------------------------------------------------------------------------
// Google Gemini (streamGenerateContent, `?alt=sse`)
// -----------------------------------------------------------------------------

interface GeminiArgs {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

async function* streamGemini(args: GeminiArgs): AsyncGenerator<ChatChunk> {
  const system = args.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = args.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    args.model,
  )}:streamGenerateContent?alt=sse`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": args.apiKey,
    },
    body: JSON.stringify({
      contents,
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      generationConfig: {
        temperature: args.temperature ?? 0.7,
        maxOutputTokens: args.maxTokens ?? 512,
      },
    }),
    signal: args.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new ChatConfigError(
      "upstream_error",
      `Upstream ${res.status}: ${text.slice(0, 500) || res.statusText}`,
    );
  }
  for await (const event of readSSE(res.body)) {
    if (!event.data) continue;
    try {
      const payload = JSON.parse(event.data) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const delta = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (delta) yield { delta, done: false };
    } catch {
      /* skip malformed chunk */
    }
  }
  yield { delta: "", done: true };
}

// -----------------------------------------------------------------------------
// Shared SSE reader
// -----------------------------------------------------------------------------

interface SSEEvent {
  event?: string;
  data: string;
}

async function* readSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<SSEEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        yield parseSSEBlock(raw);
      }
    }
    if (buffer.trim()) yield parseSSEBlock(buffer);
  } finally {
    reader.releaseLock();
  }
}

function parseSSEBlock(raw: string): SSEEvent {
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^\s/, ""));
  }
  return { event, data: dataLines.join("\n") };
}
