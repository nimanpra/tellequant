export type TelephonyProviderName = "twilio" | "telnyx";

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName?: string;
  locality?: string;
  region?: string;
  provider: TelephonyProviderName;
  capabilities: {
    voice: boolean;
    sms?: boolean;
    mms?: boolean;
  };
}

export interface PurchasedNumber {
  sid: string;
  e164: string;
  provider: TelephonyProviderName;
}

export interface TelephonyProvider {
  readonly name: TelephonyProviderName;
  /**
   * Path on this app that handles inbound voice webhooks for this provider.
   * Used when registering a purchased number.
   */
  readonly voiceWebhookPath: string;
  searchAvailableNumbers(
    areaCode?: string,
    country?: string,
  ): Promise<AvailableNumber[]>;
  purchaseNumber(
    e164: string,
    publicBaseUrl: string,
  ): Promise<PurchasedNumber>;
  releaseNumber(sid: string): Promise<void>;
}
