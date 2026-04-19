import type {
  AvailableNumber,
  PurchasedNumber,
  TelephonyProvider,
} from "./types";

const TELNYX_BASE = "https://api.telnyx.com/v2";

function getApiKey(): string {
  const key = process.env.TELNYX_API_KEY;
  if (!key) throw new Error("TELNYX_API_KEY is not set");
  return key;
}

function getConnectionId(): string {
  const id = process.env.TELNYX_CONNECTION_ID;
  if (!id)
    throw new Error(
      "TELNYX_CONNECTION_ID is not set (TeXML application ID that points at /api/telnyx/voice)",
    );
  return id;
}

async function telnyxRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${TELNYX_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Telnyx ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

interface TelnyxAvailableNumber {
  phone_number: string;
  region_information?: Array<{ region_type: string; region_name: string }>;
  features?: Array<{ name: string }>;
}

interface TelnyxNumberOrder {
  data: {
    id: string;
    phone_numbers: Array<{ id: string; phone_number: string }>;
  };
}

interface TelnyxPhoneNumber {
  data: { id: string; phone_number: string };
}

export async function searchAvailableNumbers(
  areaCode?: string,
  country = "US",
): Promise<AvailableNumber[]> {
  const qs = new URLSearchParams();
  qs.set("filter[country_code]", country);
  qs.set("filter[features][]", "voice");
  qs.set("filter[limit]", "10");
  if (areaCode) qs.set("filter[national_destination_code]", areaCode);

  const data = await telnyxRequest<{ data: TelnyxAvailableNumber[] }>(
    `/available_phone_numbers?${qs.toString()}`,
  );

  return data.data.map((n) => {
    const locality = n.region_information?.find(
      (r) => r.region_type === "locality",
    )?.region_name;
    const region = n.region_information?.find(
      (r) => r.region_type === "state",
    )?.region_name;
    const featureSet = new Set((n.features ?? []).map((f) => f.name));
    return {
      phoneNumber: n.phone_number,
      locality,
      region,
      provider: "telnyx" as const,
      capabilities: {
        voice: featureSet.has("voice"),
        sms: featureSet.has("sms"),
        mms: featureSet.has("mms"),
      },
    };
  });
}

export async function purchaseNumber(
  e164: string,
  _publicBaseUrl: string,
): Promise<PurchasedNumber> {
  const order = await telnyxRequest<TelnyxNumberOrder>("/number_orders", {
    method: "POST",
    body: JSON.stringify({
      phone_numbers: [{ phone_number: e164 }],
      connection_id: getConnectionId(),
    }),
  });

  const purchased = order.data.phone_numbers[0];
  if (!purchased) throw new Error("Telnyx order returned no phone numbers");

  // Ensure the number is attached to our TeXML connection (the one pointing at /api/telnyx/voice)
  await telnyxRequest(`/phone_numbers/${purchased.id}`, {
    method: "PATCH",
    body: JSON.stringify({ connection_id: getConnectionId() }),
  }).catch(() => {
    /* idempotent — ignore if already attached */
  });

  return {
    sid: purchased.id,
    e164: purchased.phone_number,
    provider: "telnyx",
  };
}

export async function releaseNumber(sid: string): Promise<void> {
  await telnyxRequest(`/phone_numbers/${sid}`, { method: "DELETE" });
}

export const telnyxProvider: TelephonyProvider = {
  name: "telnyx",
  voiceWebhookPath: "/api/telnyx/voice",
  searchAvailableNumbers,
  purchaseNumber,
  releaseNumber,
};
