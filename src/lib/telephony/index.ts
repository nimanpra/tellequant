import { telnyxProvider } from "./telnyx";
import { twilioProvider } from "./twilio";
import type { TelephonyProvider, TelephonyProviderName } from "./types";

export type { TelephonyProvider, TelephonyProviderName } from "./types";
export type { AvailableNumber, PurchasedNumber } from "./types";

const PROVIDERS: Record<TelephonyProviderName, TelephonyProvider> = {
  twilio: twilioProvider,
  telnyx: telnyxProvider,
};

function readDefaultProvider(): TelephonyProviderName {
  const raw = process.env.TELEPHONY_PROVIDER?.toLowerCase();
  if (raw === "twilio" || raw === "telnyx") return raw;
  return "telnyx";
}

export function getTelephonyProvider(
  name?: TelephonyProviderName,
): TelephonyProvider {
  const resolved = name ?? readDefaultProvider();
  return PROVIDERS[resolved];
}

export function getTelephonyProviderByName(
  name: string | null | undefined,
): TelephonyProvider {
  if (name === "twilio" || name === "telnyx") return PROVIDERS[name];
  return getTelephonyProvider();
}
