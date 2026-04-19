import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";

export interface EncryptedEnvelope {
  v: string; // base64 ciphertext
  iv: string; // base64 12-byte IV
  t: string; // base64 16-byte auth tag
}

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not configured (expected 64 hex chars / 32 bytes)");
  }
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must decode to 32 bytes; got ${key.length}`);
  }
  return key;
}

export function encryptSecret(plaintext: string): EncryptedEnvelope {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: ct.toString("base64"),
    iv: iv.toString("base64"),
    t: tag.toString("base64"),
  };
}

export function decryptSecret(env: EncryptedEnvelope): string {
  const key = getKey();
  const iv = Buffer.from(env.iv, "base64");
  const tag = Buffer.from(env.t, "base64");
  const ct = Buffer.from(env.v, "base64");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export function isEnvelope(value: unknown): value is EncryptedEnvelope {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.v === "string" && typeof v.iv === "string" && typeof v.t === "string";
}
