import Stripe from "npm:stripe@16.12.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const siteUrl = (Deno.env.get("SITE_URL") || "https://expresate.co").replace(/\/$/, "");
const monthlyPriceId = Deno.env.get("STRIPE_MONTHLY_PRICE_ID") || Deno.env.get("STRIPE_PRICE_MONTHLY_ID") || "";
const yearlyPriceId = Deno.env.get("STRIPE_YEARLY_PRICE_ID") || Deno.env.get("STRIPE_PRICE_YEARLY_ID") || "";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    if (!stripeSecretKey || !supabaseUrl || !serviceRoleKey || !monthlyPriceId) {
      return jsonResponse({ error: "Stripe checkout is not configured." }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return jsonResponse({ error: "You must be logged in to subscribe." }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session." }, 401);
    }

    const user = userData.user;
    const body = await req.json().catch(() => ({}));
    const interval = body?.interval === "yearly" ? "yearly" : "monthly";
    const priceId = interval === "yearly" && yearlyPriceId ? yearlyPriceId : monthlyPriceId;

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id || "";
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .upsert({ id: user.id, stripe_customer_id: customerId }, { onConflict: "id" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${siteUrl}/pricing.html?checkout=success`,
      cancel_url: `${siteUrl}/pricing.html?checkout=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: "premium",
          interval,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        plan: "premium",
        interval,
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error("[create-checkout-session]", error);
    return jsonResponse({ error: "Could not create checkout session." }, 500);
  }
});
