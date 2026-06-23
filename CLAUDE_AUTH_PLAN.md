# Exprésate — Auth + Payment Implementation Brief
_Hand this to Claude Code to implement. All decisions are already made._

---

## Project Context

**Exprésate** — Spanish-first English learning site. Static HTML/CSS/JS on GitHub Pages.
- Local folder: `C:\Users\user\Desktop\Ynoel-english-site`
- Repo: `https://github.com/lugo415200/Expresate.git` (branch `main`)
- No build step. Plain JS globals, no modules, no bundler.
- Supabase project URL: `https://sqlmvlqwezdjoyijqhqr.supabase.co`
- Supabase anon key is already in `supabaseClient.js` — do not change it.

---

## Current Stack (what already exists)

| File | Role |
|---|---|
| `supabaseClient.js` | Creates `window.supabaseClient` from CDN. Works. Don't touch. |
| `auth.html` / `auth.js` | Login/signup UI. Has 2 bugs (see below). |
| `progress.js` | localStorage progress API (`window.Progress`). XP, streak, lessons, quizzes. Works. |
| `nav.js` | Renders topbar + sidebar on every page from a config array. |
| `app.js` | Profile menu toggle, logout, audio, lesson mark-complete. |
| `data/lessons.js` | Course structure: Module 0 (free) + Module 1 (will become premium). |
| `curso.js` | Renders modules/steps from `data/lessons.js`, handles quiz logic + unlock cascade. |

**Current script load order on pages:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabaseClient.js"></script>
<script src="progress.js"></script>
<script src="nav.js"></script>
<script src="app.js"></script>
```

---

## PHASE 1 — Auth Foundation

### Bug fixes (do these first)

**Bug 1 — `auth.js` crashes on load:**
The HTML has `id="submitAuth"` but `auth.js` does `getElementById("submitBtn")` → undefined.
Then `setMode("login")` immediately calls `submitBtn.textContent` → TypeError on page load.

Fix in `auth.js`:
```js
// Change this line:
const submitBtn = document.getElementById("submitBtn");
// To:
const submitBtn = document.getElementById("submitAuth");
```

**Bug 2 — dead `backLink` reference in `auth.js`:**
```js
const backLink = document.getElementById("backLink"); // no such element in HTML
if (backLink) backLink.href = safeRedirect;           // silent null, harmless
```
Remove both lines. No HTML change needed.

---

### New file: `access.js`

Create this file. It is the single source of truth for auth and plan state.
Load it after `supabaseClient.js`, before `progress.js`, on every page.

```js
/* access.js — Auth + plan helpers for Exprésate
   Exposes window.Access
   Load order: supabaseClient.js → access.js → progress.js → sync.js → nav.js → app.js
*/
(function () {
  "use strict";

  const sb = window.supabaseClient;

  let _session = null;
  let _profile = null;
  const _listeners = new Set();

  // Fetch the profiles row for current user (plan, subscription_status, current_period_end)
  async function fetchProfile(userId) {
    if (!sb || !userId) return null;
    try {
      const { data, error } = await sb
        .from("profiles")
        .select("plan, subscription_status, current_period_end")
        .eq("id", userId)
        .single();
      if (error) { console.warn("[Access] profile fetch:", error.message); return null; }
      return data;
    } catch (e) { return null; }
  }

  // Initialize: get session, fetch profile, then watch for changes
  async function init() {
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    _session = data?.session || null;
    if (_session?.user) _profile = await fetchProfile(_session.user.id);

    sb.auth.onAuthStateChange(async (_event, session) => {
      _session = session;
      _profile = session?.user ? await fetchProfile(session.user.id) : null;
      _listeners.forEach(cb => { try { cb(session); } catch(e) {} });
    });
  }

  init();

  const Access = {
    getSession: ()  => _session,
    getUser:    ()  => _session?.user || null,
    isLoggedIn: ()  => !!_session?.user,

    // Returns 'guest' | 'free_account' | 'premium'
    getUserPlan() {
      if (!_session?.user) return "guest";
      const status = _profile?.subscription_status;
      const periodEnd = _profile?.current_period_end;
      const isActive = status === "active" && periodEnd && new Date(periodEnd) > new Date();
      if (isActive) return "premium";
      return _profile?.plan || "free_account";
    },

    hasPremium: () => Access.getUserPlan() === "premium",

    // Lesson-level access check.
    // Pass the step object from data/lessons.js (has .premium flag, Phase 3)
    // or just the lessonId string.
    canAccessLesson(lessonIdOrStep) {
      const isPremium = typeof lessonIdOrStep === "object"
        ? !!lessonIdOrStep.premium
        : false; // if just an ID, look it up yourself or default to open
      if (!isPremium) return true;
      return Access.hasPremium();
    },

    // Redirect to auth if not logged in. Call at top of protected pages.
    requireLogin(redirectBack) {
      const page = redirectBack || window.location.pathname.split("/").pop() || "index.html";
      if (!Access.isLoggedIn()) {
        window.location.href = `auth.html?redirect=${encodeURIComponent(page)}`;
      }
    },

    // Redirect to pricing if not premium. Call at top of premium-only lesson pages.
    requirePremium(redirectBack) {
      const page = redirectBack || window.location.pathname.split("/").pop() || "curso.html";
      if (!Access.hasPremium()) {
        window.location.href = `pricing.html?from=${encodeURIComponent(page)}`;
      }
    },

    // Subscribe to auth state changes (session passed to callback)
    onAuthChange(cb) {
      _listeners.add(cb);
      return () => _listeners.delete(cb);
    }
  };

  window.Access = Access;
})();
```

---

### Update `nav.js` — profile menu shows plan badge

In `renderTopbar`, update the `profileMenu` HTML to include a plan line.
Find the `profileMenu` inner HTML block and add below the email line:

```html
<p class="small" style="margin:0 0 4px;">
  Plan: <strong id="profilePlan">—</strong>
</p>
```

Then in `app.js`, inside `updateProfileUI(session)`, add:

```js
const profilePlan = document.getElementById("profilePlan");
if (profilePlan && window.Access) {
  const plan = Access.getUserPlan();
  profilePlan.textContent =
    plan === "premium"      ? "Premium ✨" :
    plan === "free_account" ? "Cuenta gratis" : "Invitado";
}
```

---

### Updated script load order (add to every HTML page)

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabaseClient.js"></script>
<script src="access.js"></script>       ← ADD THIS
<script src="progress.js"></script>
<script src="sync.js"></script>         ← ADD THIS (Phase 2, create placeholder now)
<script src="nav.js"></script>
<script src="app.js"></script>
```

Pages that need updating: `index.html`, `curso.html`, `lessons.html`, `lesson-000-alphabet.html`, `lesson-001-sounds.html`, `lesson-001.html`, `lesson-002.html`, `lesson-003.html`, `Syllables.html`

The `auth.html` page already has its own script block — add `access.js` there too (before `auth.js`).

---

### Auth guard on `curso.html`

`curso.html` should require login. After the shared scripts, in an inline `<script>`:
```html
<script>
  // Wait for Access to initialize then guard
  document.addEventListener("DOMContentLoaded", () => {
    // Small delay to let access.js async init settle
    setTimeout(() => {
      if (window.Access && !Access.isLoggedIn()) {
        window.location.href = "auth.html?redirect=curso.html";
      }
    }, 300);
  });
</script>
```

---

## PHASE 2 — Progress Sync to Supabase

### Supabase SQL (run in Supabase SQL editor)

```sql
-- profiles: one row per user, auto-created on signup via trigger
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  plan                text default 'free_account',
  stripe_customer_id  text,
  subscription_status text default 'inactive',
  current_period_end  timestamptz,
  created_at          timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- user_progress: one row per user, jsonb blob of their progress snapshot
create table if not exists public.user_progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  progress   jsonb,
  updated_at timestamptz default now()
);

alter table public.user_progress enable row level security;
create policy "Users can read own progress"
  on public.user_progress for select using (auth.uid() = user_id);
create policy "Users can upsert own progress"
  on public.user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress"
  on public.user_progress for update using (auth.uid() = user_id);
```

---

### New file: `sync.js`

```js
/* sync.js — Supabase ↔ localStorage progress bridge for Exprésate
   Load after: progress.js and access.js
   Responsibilities:
   1. On login: download cloud progress, merge with local (newest ts wins), save locally.
   2. Guest migration: if local progress exists when user logs in, upload it.
   3. On progress change (when logged in): push snapshot to Supabase (debounced 2s).
   All failures are silent — localStorage is always the UI source of truth.
*/
(function () {
  "use strict";

  const SYNC_DEBOUNCE_MS = 2000;
  let _syncTimer = null;
  let _lastSyncedUserId = null;

  async function downloadAndMerge(userId) {
    const sb = window.supabaseClient;
    if (!sb || !userId) return;
    try {
      const { data, error } = await sb
        .from("user_progress")
        .select("progress")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows
        console.warn("[Sync] download error:", error.message);
        return;
      }

      const cloud = data?.progress;
      if (!cloud) return; // nothing in cloud yet

      const local = Progress.snapshot();

      // Merge: for each lesson/quiz, keep whichever has the newer timestamp
      const merged = {
        schemaVersion: 1,
        lessons: { ...cloud.lessons },
        quizzes: { ...cloud.quizzes }
      };

      Object.entries(local.lessons || {}).forEach(([id, entry]) => {
        const cloudEntry = merged.lessons[id];
        if (!cloudEntry || (entry.ts && cloudEntry.ts && entry.ts > cloudEntry.ts)) {
          merged.lessons[id] = entry;
        }
      });

      Object.entries(local.quizzes || {}).forEach(([id, entry]) => {
        const cloudEntry = merged.quizzes[id];
        if (!cloudEntry || (entry.ts && cloudEntry.ts && entry.ts > cloudEntry.ts)) {
          merged.quizzes[id] = entry;
        }
      });

      // Write merged result to localStorage (Progress will re-read it)
      try {
        localStorage.setItem("expresate_progress_v1", JSON.stringify(merged));
      } catch (e) {}

    } catch (e) {
      console.warn("[Sync] merge failed:", e);
    }
  }

  async function uploadProgress(userId) {
    const sb = window.supabaseClient;
    if (!sb || !userId) return;
    try {
      const snapshot = Progress.snapshot();
      await sb.from("user_progress").upsert({
        user_id: userId,
        progress: snapshot,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    } catch (e) {
      console.warn("[Sync] upload error:", e);
    }
  }

  function scheduleUpload(userId) {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => uploadProgress(userId), SYNC_DEBOUNCE_MS);
  }

  async function onLogin(userId) {
    if (_lastSyncedUserId === userId) return;
    _lastSyncedUserId = userId;

    // 1. Download + merge cloud progress into local
    await downloadAndMerge(userId);

    // 2. Upload the merged result back (handles guest migration too)
    await uploadProgress(userId);

    // 3. Watch for future local changes and push them
    Progress.on("change", () => {
      if (Access.isLoggedIn()) scheduleUpload(userId);
    });
  }

  function onLogout() {
    _lastSyncedUserId = null;
    clearTimeout(_syncTimer);
  }

  // Wire up to auth state
  if (window.Access) {
    Access.onAuthChange((session) => {
      if (session?.user) {
        onLogin(session.user.id);
      } else {
        onLogout();
      }
    });

    // Handle already-logged-in state on page load
    const user = Access.getUser();
    if (user) onLogin(user.id);
  }
})();
```

---

## PHASE 3 — Paywall Structure

### Add `premium` flags to `data/lessons.js`

Module 0 stays free. Add `premium: true` to all Module 1 steps:

```js
// In module-1 steps, add premium: true to each step:
{ id: "lesson-001-pronombres", premium: true, type: "lesson", ... }
{ id: "quiz-001",              premium: true, type: "quiz",   ... }
{ id: "lesson-002-preguntas",  premium: true, type: "lesson", ... }
{ id: "quiz-002",              premium: true, type: "quiz",   ... }
{ id: "lesson-003-negaciones", premium: true, type: "lesson", ... }
{ id: "quiz-003",              premium: true, type: "quiz",   ... }
```

Also add `premium: true` to the module object itself:
```js
{ id: "module-1", premium: true, ... }
```

---

### Update `curso.js` — lock premium steps for non-premium users

In the step renderer, after the existing `requires` lock check, add:

```js
// Premium gate (in addition to existing progress gate)
if (step.premium && window.Access && !Access.hasPremium()) {
  // Render a locked premium state
  stepEl.classList.add("is-premium-locked");
  stepEl.innerHTML += `
    <div class="premium-lock-overlay">
      🔒 <strong>Contenido Premium</strong>
      <a href="pricing.html" class="btn primary small">Ver planes →</a>
    </div>
  `;
  return; // don't add click handler
}
```

Add CSS for `.premium-lock-overlay` in `gamify.css`:
```css
.premium-lock-overlay {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: rgba(99,102,241,.08);
  border: 1px solid rgba(99,102,241,.2); border-radius: 8px;
  font-size: .85rem; margin-top: 6px;
}
.premium-lock-overlay .btn.small { padding: 4px 10px; font-size: .8rem; }
```

---

### Add guard to premium lesson pages

At the top of the `<script>` block in `lesson-001.html`, `lesson-002.html`, `lesson-003.html`:
```js
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (window.Access && !Access.hasPremium()) {
      window.location.href = "pricing.html?from=" + encodeURIComponent(window.location.pathname.split("/").pop());
    }
  }, 400);
});
```

---

### New file: `pricing.html`

A clean, standalone pricing page. Key content:
- Hero: "Desbloquea tu inglés completo"
- Two columns: **Gratis** and **Premium**
- Free includes: Módulo 0 (Alfabeto, Sonidos, Sílabas), Diccionario, Juego
- Premium includes: Todo lo gratis + Módulo 1 completo (3 Plantillas + 3 Quizzes), progreso sincronizado entre dispositivos, contenido futuro
- Price: placeholder "$X/mes" with "Suscribirse →" button (href to be wired in Phase 4)
- Nav: same topbar as other pages (load nav.js + supabaseClient.js + access.js)
- If already premium: show "Ya eres Premium ✨" state instead of CTA

---

## PHASE 4 — Stripe Subscription

### Architecture (IMPORTANT — GitHub Pages is static)

All secret key logic lives in **Supabase Edge Functions** (Deno runtime, runs on Supabase servers).
The frontend only:
1. Calls the Edge Function to get a Stripe Checkout URL
2. Redirects the user to that URL
3. Stripe handles payment
4. Stripe sends a webhook to the Edge Function
5. Edge Function updates `profiles.subscription_status` in the DB
6. Next time the user logs in, `access.js` reads the updated profile → premium unlocked

**Never:**
- Put Stripe secret key in any frontend JS
- Trust a `localStorage` premium flag as proof of payment
- Grant premium access without verifying `profiles.subscription_status` from Supabase

---

### Supabase Edge Function 1: `create-checkout-session`

File: `supabase/functions/create-checkout-session/index.ts`

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { priceId, successUrl, cancelUrl } = await req.json();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles").select("stripe_customer_id, email").eq("id", user.id).single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: profile?.email || user.email! });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { supabase_user_id: user.id }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
```

---

### Supabase Edge Function 2: `stripe-webhook`

File: `supabase/functions/stripe-webhook/index.ts`

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    return new Response(`Webhook error: ${e.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role bypasses RLS for webhook
  );

  const sub = event.data.object as Stripe.Subscription;

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const userId = sub.metadata.supabase_user_id;
    await supabase.from("profiles").update({
      subscription_status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      plan: sub.status === "active" ? "premium" : "free_account"
    }).eq("id", userId);
  }

  if (event.type === "customer.subscription.deleted") {
    const userId = sub.metadata.supabase_user_id;
    await supabase.from("profiles").update({
      subscription_status: "inactive",
      plan: "free_account",
      current_period_end: null
    }).eq("id", userId);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

---

### Frontend: trigger Stripe Checkout from `pricing.html`

```js
async function startCheckout() {
  const session = Access.getSession();
  if (!session) {
    window.location.href = "auth.html?redirect=pricing.html";
    return;
  }

  const res = await fetch(
    "https://sqlmvlqwezdjoyijqhqr.supabase.co/functions/v1/create-checkout-session",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        priceId: "price_XXXXXXXXXXXXXXXX", // replace with real Stripe price ID
        successUrl: "https://expresate.co/curso.html?welcome=1",
        cancelUrl: "https://expresate.co/pricing.html"
      })
    }
  );
  const { url, error } = await res.json();
  if (error) { alert("Error: " + error); return; }
  window.location.href = url;
}
```

---

### Stripe Customer Portal link (for premium users to cancel/manage)

In `nav.js` profile menu, for premium users add:
```html
<a id="portalLink" href="https://billing.stripe.com/p/login/XXXXXXXX" target="_blank" class="btn small">
  Gestionar suscripción
</a>
```
Replace `XXXXXXXX` with the portal ID from your Stripe dashboard → Billing → Customer portal.

---

### Environment variables to set in Supabase dashboard

Go to: Supabase → Project → Settings → Edge Functions → Secrets

```
STRIPE_SECRET_KEY         sk_live_...   (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET     whsec_...     (from Stripe webhook endpoint config)
SUPABASE_URL              https://sqlmvlqwezdjoyijqhqr.supabase.co
SUPABASE_ANON_KEY         (already in supabaseClient.js)
SUPABASE_SERVICE_ROLE_KEY (from Supabase → Settings → API → service_role)
```

---

## Implementation Order for Claude Code

1. **Fix `auth.js`** — `submitBtn` id mismatch + remove `backLink` dead code.
2. **Create `access.js`** — auth + plan helpers.
3. **Create `sync.js`** — progress bridge (can be a near-empty stub until SQL is set up).
4. **Update script tags** on all HTML pages to the new load order.
5. **Update `nav.js`** — add plan badge to profile menu HTML.
6. **Update `app.js`** — populate plan badge in `updateProfileUI`.
7. **Add auth guard** to `curso.html`.
8. **Run Supabase SQL** — `profiles` + `user_progress` tables + RLS + trigger.
9. **Add `premium: true`** flags to Module 1 in `data/lessons.js`.
10. **Update `curso.js`** — premium lock overlay for non-premium users.
11. **Add lesson guards** to `lesson-001.html`, `lesson-002.html`, `lesson-003.html`.
12. **Create `pricing.html`** — free vs. premium comparison page.
13. **Create Supabase Edge Functions** — `create-checkout-session` + `stripe-webhook`.
14. **Wire Stripe CTA** in `pricing.html`.
15. **Test end-to-end** with Stripe test mode (`sk_test_...` + test card `4242 4242 4242 4242`).

---

## Key Constraints to Respect

- **No build step.** All JS is plain globals loaded via `<script>` tags. No `import`/`export`.
- **No Stripe secret key in frontend code** — ever.
- **`window.Progress` API surface must not change.** `sync.js` wraps it from outside.
- **localStorage stays as UI source of truth.** Supabase sync is best-effort in the background.
- **Premium status is only trusted from Supabase `profiles` table**, read by `access.js` at login. Never from localStorage alone.
- **`window.supabaseClient` is the Supabase client.** Don't create additional instances.
- **GitHub Pages URL:** `https://expresate.co/` — use this for Stripe success/cancel URLs.
