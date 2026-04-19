const DEFAULT_CHUNK = 900;
const DEFAULT_OVERLAP = 120;

export function chunkText(
  text: string,
  size = DEFAULT_CHUNK,
  overlap = DEFAULT_OVERLAP
): string[] {
  const clean = text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > size && buf.length > 0) {
      chunks.push(buf.trim());
      buf = buf.slice(-overlap) + "\n\n" + p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.flatMap((c) => (c.length > size * 1.5 ? splitLong(c, size, overlap) : [c]));
}

function splitLong(text: string, size: number, overlap: number): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    out.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}
