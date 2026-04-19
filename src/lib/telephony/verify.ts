import { createHmac, verify as cryptoVerify, timingSafeEqual } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { decryptAll, parseEncryptedMap } from "@/lib/byok";

// -----------------------------------------------------------------------------
// Twilio signature verification
// -----------------------------------------------------------------------------
//
// https://www.twilio.com/docs/usage/security#validating-requests
//
// For a form-encoded POST:
//   signature = base64(HMAC-SHA1(authToken, url + sortedParamKeysConcatValues))
// where `url` is the full request URL the webhook hit, and the sorted params
// are `key1value1key2value2…` alphabetized by key.

export interface TwilioVerifyArgs {
  url: string;
  params: Record<string, string>;
  signature: string | null | undefined;
  authToken: string;
}

export function verifyTwilioSignature(args: TwilioVerifyArgs): boolean {
  if (!args.signature) return false;
  const sortedKeys = Object.keys(args.params).sort();
  let data = args.url;
  for (const k of sortedKeys) data += k + args.params[k];
  const expected = createHmac("sha1", args.authToken).update(data, "utf8").digest("base64");
  const a = Buffer.from(args.signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// -----------------------------------------------------------------------------
// Telnyx signature verification
// -----------------------------------------------------------------------------
//
// https://developers.telnyx.com/docs/api/v2/overview#webhook-signing
//
// Headers:
//   telnyx-signature-ed25519 — base64 Ed25519 signature
//   telnyx-timestamp         — unix seconds timestamp
//
// Signed data:
//   `<timestamp>|<raw-body>`  (utf8)
//
// Public key is per-connection in the Telnyx portal.

export interface TelnyxVerifyArgs {
  rawBody: string;
  signatureB64: string | null | undefined;
  timestamp: string | null | undefined;
  publicKeyB64: string;
  maxSkewSeconds?: number;
}

export function verifyTelnyxSignature(args: TelnyxVerifyArgs): boolean {
  if (!args.signatureB64 || !args.timestamp) return false;
  const ts = Number.parseInt(args.timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const skew = args.maxSkewSeconds ?? 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > skew) return false;

  const data = Buffer.from(`${args.timestamp}|${args.rawBody}`, "utf8");
  const signature = Buffer.from(args.signatureB64, "base64");
  const publicKeyRaw = Buffer.from(args.publicKeyB64, "base64");
  if (publicKeyRaw.length !== 32) return false;

  // Wrap raw 32-byte Ed25519 public key in the SPKI DER envelope Node requires.
  const spki = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    publicKeyRaw,
  ]);

  try {
    return cryptoVerify(
      null,
      data,
      {
        key: spki,
        format: "der",
        type: "spki",
      },
      signature,
    );
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// BYOK-aware helpers — look up the org for an inbound number and fetch the
// auth token / public key from its encrypted provider keys.
// -----------------------------------------------------------------------------

type SvcClient = ReturnType<typeof createSupabaseServiceClient>;

export async function resolveOrgKeysForNumber(
  svc: SvcClient,
  e164: string,
): Promise<{ orgId: string; keys: Record<string, string> } | null> {
  const { data: number } = await svc
    .from("phone_numbers")
    .select("org_id")
    .eq("e164", e164)
    .eq("is_active", true)
    .maybeSingle();
  if (!number) return null;

  const { data: org } = await svc
    .from("organizations")
    .select("id, provider_keys_encrypted")
    .eq("id", number.org_id)
    .single();
  if (!org) return null;

  const map = parseEncryptedMap(org.provider_keys_encrypted);
  return { orgId: org.id, keys: decryptAll(map) };
}

/**
 * Reconstruct the URL Twilio actually hit. Behind Vercel/Cloudflare, the
 * request is re-proxied; the URL Twilio signed is the external one in the
 * `x-forwarded-proto` + `x-forwarded-host` (or `host`) headers.
 */
export function reconstructExternalUrl(req: Request): string {
  const u = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host;
  return `${proto}://${host}${u.pathname}${u.search}`;
}
