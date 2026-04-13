import type Stripe from "stripe";

let _stripe: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    const { default: Stripe } = await import("stripe");
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}
