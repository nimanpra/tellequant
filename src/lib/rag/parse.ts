import pdf from "pdf-parse";

export async function extractText(file: {
  buffer: Buffer;
  mime: string;
  name: string;
}): Promise<string> {
  const { buffer, mime, name } = file;
  if (mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdf(buffer);
    return parsed.text ?? "";
  }
  if (mime.startsWith("text/") || /\.(txt|md|html|csv|json)$/i.test(name)) {
    return buffer.toString("utf-8");
  }
  // fallback
  return buffer.toString("utf-8");
}
