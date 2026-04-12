import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) break;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      let trialEnd: string | null = null;
      let status: string = "active";
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        status = sub.status;
        trialEnd = sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null;
      }

      await supabase
        .from("profiles")
        .update({
          tier: "pro",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          subscription_status: status,
          trial_ends_at: trialEnd,
          is_verified: true,
        })
        .eq("id", userId);

      await supabase
        .from("listings")
        .update({ status: "active" })
        .eq("user_id", userId)
        .eq("status", "paused");

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      await supabase
        .from("profiles")
        .update({
          subscription_status: subscription.status,
          tier:
            subscription.status === "active" ||
            subscription.status === "trialing"
              ? "pro"
              : "free",
          is_verified:
            subscription.status === "active" ||
            subscription.status === "trialing",
        })
        .eq("stripe_customer_id", customerId);

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const { data: profile } = await supabase
        .from("profiles")
        .update({
          tier: "free",
          subscription_status: "canceled",
          is_verified: false,
        })
        .eq("stripe_customer_id", customerId)
        .select("id")
        .single();

      if (profile) {
        await supabase
          .from("listings")
          .update({ status: "paused" })
          .eq("user_id", profile.id)
          .eq("price_type", "fixed");
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
