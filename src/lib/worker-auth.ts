import { createHmac, timingSafeEqual } from "node:crypto";

const WORKER_HEADER = "x-tellequant-worker-key";

export function verifyWorkerRequest(req: Request, rawBody: string): boolean {
  const secret = process.env.VOICE_WORKER_SHARED_SECRET;
  if (!secret) return false;
  const provided = req.headers.get(WORKER_HEADER);
  if (!provided) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
