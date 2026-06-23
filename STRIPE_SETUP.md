# Stripe Subscription Setup

Exprésate uses Stripe Checkout for recurring Premium subscriptions. The static GitHub Pages frontend never receives Stripe secret keys. Secure Stripe calls run through Supabase Edge Functions.

## Architecture

- `pricing.html` calls `create-checkout-session` through `supabase.functions.invoke()`.
- `create-checkout-session` verifies the Supabase user session, creates or reuses a Stripe customer, then creates a subscription Checkout Session.
- Stripe redirects the user to Checkout.
- `stripe-webhook` receives Stripe events and updates `public.profiles`.
- `access.js` already grants Premium when `subscription_status = 'active'` and `current_period_end` is in the future.
- `create-billing-portal` opens Stripe Customer Portal for Premium users.

## Supabase Schema

Run:

```sql
-- supabase/stripe_billing.sql
```

The important profile fields are:

- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_status`
- `current_period_end`
- `plan`

## Stripe Product Setup

In Stripe Dashboard:

1. Create product: `Exprésate Premium`
2. Add a recurring monthly price.
3. Optional: add a recurring yearly price.
4. Copy the price IDs:
   - Monthly: `price_...`
   - Yearly: `price_...`

## Supabase Secrets

Set secrets with the Supabase CLI:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_or_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set STRIPE_PRICE_MONTHLY_ID=price_xxx
supabase secrets set STRIPE_PRICE_YEARLY_ID=price_xxx
supabase secrets set SITE_URL=https://lugo415200.github.io/Expresate
```

Supabase provides `SUPABASE_URL` automatically. Add `SUPABASE_SERVICE_ROLE_KEY` as a secret if it is not already available in your Edge Function environment.

Never commit `.env`, Stripe secret keys, service role keys, or webhook secrets.

## Deploy Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal
supabase functions deploy stripe-webhook
```

## Stripe Webhook

Create a webhook endpoint in Stripe:

```text
https://YOUR_PROJECT_REF.functions.supabase.co/stripe-webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Local Testing

Use Stripe CLI:

```bash
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

Then set the local `STRIPE_WEBHOOK_SECRET` from the Stripe CLI output.

## Frontend Behavior

- Logged-out users who click Premium are redirected to `auth.html`.
- Logged-in users are redirected to Stripe Checkout.
- Active Premium users see an account state and can open the Stripe billing portal.
- If the webhook has not processed yet, users may need to refresh `pricing.html` after checkout.
