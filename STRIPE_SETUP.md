# Stripe Subscription Setup

Exprésate uses Stripe Checkout for recurring Premium subscriptions. The GitHub Pages frontend stays static and never receives Stripe secret keys. Secure Stripe calls run through Supabase Edge Functions.

Start in Stripe test mode first. Do not switch to live mode until the checklist below passes with test cards.

## Current Architecture

- `pricing.html` calls Supabase Edge Functions with `supabase.functions.invoke()`.
- `create-checkout-session` verifies the logged-in Supabase user and creates a Stripe Checkout Session in `subscription` mode.
- Stripe redirects the user to hosted Checkout.
- `stripe-webhook` receives Stripe webhook events and updates `public.profiles`.
- `access.js` grants Premium when `subscription_status = 'active'` and `current_period_end` is in the future.
- `create-billing-portal` opens Stripe Customer Portal for subscription management.

## Supabase SQL

Run `supabase/stripe_billing.sql` in the Supabase SQL Editor before deploying the Edge Functions:

```sql
-- Stripe billing columns for Exprésate Premium.
-- Run this in the Supabase SQL Editor before deploying the Stripe Edge Functions.
-- Existing premium gating already reads subscription_status and current_period_end.

alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists plan text default 'free';

create index if not exists profiles_stripe_subscription_id_idx
  on public.profiles (stripe_subscription_id);

create index if not exists profiles_subscription_status_idx
  on public.profiles (subscription_status);
```

## Stripe Test Mode Setup

In Stripe Dashboard, make sure you are in **Test mode**.

1. Go to **Product catalog**.
2. Create product: `Exprésate Premium`.
3. Add a recurring monthly price.
4. Optional: add a recurring yearly price.
5. Copy each test-mode price ID.

Price IDs start with `price_...`.

## Required Supabase Secrets

Set these in Supabase Edge Function secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_YEARLY_PRICE_ID`
- `SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not commit real values. Do not put real values in `.env.example`.

### Where To Get Each Value

- `STRIPE_SECRET_KEY`: Stripe Dashboard → Developers → API keys → Secret key. In test mode, use the test secret key.
- `STRIPE_WEBHOOK_SECRET`: Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret. If testing locally with Stripe CLI, use the `whsec_...` printed by `stripe listen`.
- `STRIPE_MONTHLY_PRICE_ID`: Stripe Dashboard → Product catalog → Exprésate Premium → monthly recurring price → Price ID.
- `STRIPE_YEARLY_PRICE_ID`: Stripe Dashboard → Product catalog → Exprésate Premium → yearly recurring price → Price ID. If you are not offering yearly yet, leave it unset.
- `SITE_URL`: `https://lugo415200.github.io/Expresate`
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Project Settings → API → service_role key.

## Supabase CLI Secret Commands

Run these locally after `supabase login` and `supabase link --project-ref wgszratizlxpxifngrrs`:

```bash
supabase secrets set STRIPE_SECRET_KEY=YOUR_TEST_STRIPE_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=YOUR_TEST_WEBHOOK_SIGNING_SECRET
supabase secrets set STRIPE_MONTHLY_PRICE_ID=YOUR_TEST_MONTHLY_PRICE_ID
supabase secrets set STRIPE_YEARLY_PRICE_ID=YOUR_TEST_YEARLY_PRICE_ID
supabase secrets set SITE_URL=https://lugo415200.github.io/Expresate
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

If you do not have a yearly plan yet, omit:

```bash
supabase secrets set STRIPE_YEARLY_PRICE_ID=YOUR_TEST_YEARLY_PRICE_ID
```

## Deploy Edge Functions

Checkout and billing portal require a logged-in user JWT, so keep normal JWT verification:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal
```

Stripe webhooks do not include a Supabase user JWT. Deploy the webhook function without JWT verification:

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

## Stripe Webhook Endpoint

Use this endpoint in Stripe test mode:

```text
https://wgszratizlxpxifngrrs.functions.supabase.co/stripe-webhook
```

Enable these events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

After creating the endpoint, copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

## Frontend Function Calls

`pricing.html` is already wired to:

- `create-checkout-session`
- `create-billing-portal`

The Supabase JS client automatically calls these at:

```text
https://wgszratizlxpxifngrrs.functions.supabase.co/create-checkout-session
https://wgszratizlxpxifngrrs.functions.supabase.co/create-billing-portal
```

## Stripe Test Checklist

Use Stripe test cards only.

1. Log into Exprésate with a test user.
2. Open `pricing.html`.
3. Click `Suscribirme con Stripe`.
4. Confirm Stripe Checkout opens.
5. Use successful test card:
   - Card: `4242 4242 4242 4242`
   - Expiration: any future date
   - CVC: any 3 digits
   - ZIP: any valid ZIP
6. Complete Checkout.
7. Confirm Stripe redirects back to:
   - `https://lugo415200.github.io/Expresate/pricing.html?checkout=success`
8. Confirm the Stripe webhook event succeeds in Stripe Dashboard.
9. Confirm the Supabase `profiles` row has:
   - `stripe_customer_id`
   - `stripe_subscription_id`
   - `subscription_status = active`
   - `current_period_end` in the future
   - `plan = premium`
10. Refresh Exprésate and confirm Premium lessons unlock.
11. Open the billing portal from the Premium state.
12. Cancel the test subscription in Stripe Customer Portal or Dashboard.
13. Confirm `customer.subscription.updated` or `customer.subscription.deleted` reaches the webhook.
14. Confirm Premium access remains until the paid period end or becomes blocked after subscription deletion, depending on Stripe status.

Additional useful Stripe test cards:

- Payment requires authentication: `4000 0025 0000 3155`
- Card declined: `4000 0000 0000 9995`

## Rollback Checklist

If payments fail during testing:

1. In `pricing.html`, disable or hide the `Suscribirme con Stripe` buttons.
2. Redeploy/push the frontend change.
3. In Stripe Dashboard, disable the webhook endpoint.
4. In Supabase Dashboard, verify no incorrect `profiles` rows were marked Premium.
5. If needed, manually reset a user:

```sql
update public.profiles
set
  plan = 'free',
  subscription_status = 'canceled',
  current_period_end = null,
  stripe_subscription_id = null
where id = 'USER_UUID_HERE';
```

6. Fix Edge Function logs in Supabase Dashboard → Edge Functions → Logs.
7. Re-enable Stripe test mode webhook and run the test checklist again.

## Switching To Live Mode Later

Only after test mode passes:

1. Create or confirm live-mode Stripe product/prices.
2. Replace Supabase secrets with live Stripe values.
3. Create the live webhook endpoint.
4. Replace `STRIPE_WEBHOOK_SECRET` with the live endpoint signing secret.
5. Redeploy functions if needed.
6. Run one live low-risk transaction before public launch.
