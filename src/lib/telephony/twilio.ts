import twilio from "twilio";
import type {
  AvailableNumber,
  PurchasedNumber,
  TelephonyProvider,
} from "./types";

let _client: ReturnType<typeof twilio> | null = null;
export function getTwilio() {
  if (_client) return _client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !auth) throw new Error("Twilio credentials missing");
  _client = twilio(sid, auth);
  return _client;
}

export async function searchAvailableNumbers(
  areaCode?: string,
  country = "US",
): Promise<AvailableNumber[]> {
  const client = getTwilio();
  const results = await client
    .availablePhoneNumbers(country)
    .local.list({ areaCode: areaCode ? parseInt(areaCode, 10) : undefined, limit: 10 });
  return results.map((r) => ({
    phoneNumber: r.phoneNumber,
    friendlyName: r.friendlyName,
    locality: r.locality,
    region: r.region,
    provider: "twilio" as const,
    capabilities: {
      voice: Boolean(r.capabilities?.voice),
      sms: Boolean(r.capabilities?.SMS),
      mms: Boolean(r.capabilities?.MMS),
    },
  }));
}

export async function purchaseNumber(
  e164: string,
  publicBaseUrl: string,
): Promise<PurchasedNumber> {
  const client = getTwilio();
  const result = await client.incomingPhoneNumbers.create({
    phoneNumber: e164,
    voiceUrl: `${publicBaseUrl}/api/twilio/voice`,
    voiceMethod: "POST",
  });
  return { sid: result.sid, e164: result.phoneNumber, provider: "twilio" };
}

export async function releaseNumber(sid: string): Promise<void> {
  const client = getTwilio();
  await client.incomingPhoneNumbers(sid).remove();
}

export const twilioProvider: TelephonyProvider = {
  name: "twilio",
  voiceWebhookPath: "/api/twilio/voice",
  searchAvailableNumbers,
  purchaseNumber,
  releaseNumber,
};
