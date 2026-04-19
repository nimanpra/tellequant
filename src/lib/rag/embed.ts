import OpenAI from "openai";

const provider = process.env.EMBEDDING_PROVIDER ?? "openai";
const model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

let _openai: OpenAI | null = null;
function openai() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  if (provider === "openai") {
    const res = await openai().embeddings.create({ model, input: texts });
    return res.data.map((d) => d.embedding);
  }
  if (provider === "jina") {
    const res = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({ model: model || "jina-embeddings-v3", input: texts }),
    });
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data.map((d) => d.embedding);
  }
  if (provider === "voyage") {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ model: model || "voyage-3-lite", input: texts }),
    });
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data.map((d) => d.embedding);
  }
  throw new Error(`Unknown EMBEDDING_PROVIDER: ${provider}`);
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embed([text]);
  return v;
}
