import Stripe from "stripe";

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _client = new Stripe(key, {
    // Pin an API version so Stripe SDK + response shapes stay stable.
    apiVersion: "2025-03-31.basil",
    appInfo: { name: "Tellequant", version: "0.1.0" },
  });
  return _client;
}

export function getPublicAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
