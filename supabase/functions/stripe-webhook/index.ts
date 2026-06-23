import Stripe from "npm:stripe@16.12.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function periodEndFromSubscription(subscription: Stripe.Subscription) {
  return subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
}

function premiumStatusFromSubscription(subscription: Stripe.Subscription) {
  return ["active", "trialing"].includes(subscription.status) ? "active" : subscription.status;
}

async function updateProfileFromSubscription(subscription: Stripe.Subscription, fallbackUserId = "") {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id || "";
  const userId = subscription.metadata?.supabase_user_id || fallbackUserId;

  const update = {
    plan: ["active", "trialing"].includes(subscription.status) ? "premium" : "free",
    subscription_status: premiumStatusFromSubscription(subscription),
    current_period_end: periodEndFromSubscription(subscription),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
  };

  if (userId) {
    await supabase.from("profiles").upsert({ id: userId, ...update }, { onConflict: "id" });
    return;
  }

  if (customerId) {
    await supabase.from("profiles").update(update).eq("stripe_customer_id", customerId);
  }
}

async function markSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id || "";

  const update = {
    plan: "free",
    subscription_status: "canceled",
    current_period_end: periodEndFromSubscription(subscription),
    stripe_subscription_id: subscription.id,
  };

  const userId = subscription.metadata?.supabase_user_id || "";
  if (userId) {
    await supabase.from("profiles").upsert({ id: userId, ...update }, { onConflict: "id" });
    return;
  }

  if (customerId) {
    await supabase.from("profiles").update(update).eq("stripe_customer_id", customerId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Webhook is not configured." }, 500);
  }

  const signature = req.headers.get("Stripe-Signature");
  if (!signature) return jsonResponse({ error: "Missing Stripe signature." }, 400);

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", error);
    return jsonResponse({ error: "Invalid Stripe signature." }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await updateProfileFromSubscription(subscription, session.client_reference_id || session.metadata?.supabase_user_id || "");
        break;
      }

      case "customer.subscription.updated": {
        await updateProfileFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        await markSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }

      default:
        break;
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] handler failed", error);
    return jsonResponse({ error: "Webhook handler failed." }, 500);
  }
});
