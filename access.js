/* access.js — Auth + plan helpers for Exprésate
   Exposes window.Access
   Load order: supabaseClient.js → access.js → progress.js → sync.js → nav.js → app.js

   Key guarantee: Access.ready() is a Promise that resolves once the
   initial getSession() call settles (success, error, or Supabase absent).
   Use it instead of setTimeout for auth guards — no race conditions.
*/
(function () {
  "use strict";

  const sb = window.supabaseClient;

  let _session  = null;
  let _profile  = null;
  const _listeners = new Set();
  const _devPremiumBypass = isLocalDevOrigin();

  function isLocalDevOrigin() {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  }

  if (_devPremiumBypass) {
    console.info("[Access] Local developer premium bypass active. This only works on localhost/127.0.0.1/::1.");
  }

  // Resolves once the initial session check is done.
  // Guaranteed to resolve even if Supabase is unreachable.
  let _resolveReady;
  const _ready = new Promise(function (resolve) { _resolveReady = resolve; });

  // ----------------------------------------------------------------
  // Fetch the profiles row (plan, subscription_status, period_end).
  // Returns null on any error — callers treat null as free_account.
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // init — runs once on page load.
  // Gets the cached session, fetches profile, resolves _ready,
  // then subscribes to future auth state changes.
  // The finally block guarantees _ready always resolves, even if
  // the CDN is down or getSession() throws.
  // ----------------------------------------------------------------
  async function init() {
    if (!sb) {
      // Supabase library unavailable — treat user as guest immediately.
      _resolveReady();
      return;
    }

    try {
      const { data } = await sb.auth.getSession();
      _session = data?.session || null;
      if (_session?.user) _profile = await fetchProfile(_session.user.id);
    } catch (e) {
      console.warn("[Access] init error — treating as guest:", e);
      // _session stays null → getUserPlan() returns 'guest'
    } finally {
      _resolveReady(); // Always resolve, even on network failure
    }

    // Watch for sign-in / sign-out / token refresh after init.
    sb.auth.onAuthStateChange(async (_event, session) => {
      _session = session;
      _profile = session?.user ? await fetchProfile(session.user.id) : null;
      _listeners.forEach(function (cb) { try { cb(session); } catch (e) {} });
    });
  }

  init();

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------
  const Access = {

    // Resolves once the initial session check is complete.
    // Always resolves — never rejects.
    // Use: Access.ready().then(() => { /* guard logic */ });
    ready: function () { return _ready; },

    getSession: function () { return _session; },
    getUser:    function () { return _session?.user || null; },
    isLoggedIn: function () { return !!_session?.user; },

    // 'guest' | 'free_account' | 'premium'
    // Premium requires BOTH subscription_status === "active" AND a non-expired
    // current_period_end. The plan column is never used alone as authority.
    getUserPlan: function () {
      if (_devPremiumBypass) return "premium";

      if (!_session?.user) return "guest";
      const status    = _profile?.subscription_status;
      const periodEnd = _profile?.current_period_end;
      const isActive  = status === "active" && periodEnd && new Date(periodEnd) > new Date();

      if (isActive) return "premium";
      // Always return free_account for logged-in non-premium users.
      // Never elevate to premium from the plan column alone — only
      // subscription_status + period_end are authoritative.
      return "free_account";
    },

    hasPremium: function () { return Access.getUserPlan() === "premium"; },

    // Pass the step object from data/lessons.js (has .premium flag)
    // or just a lessonId string (defaults to open).
    canAccessLesson: function (lessonIdOrStep) {
      const isPremium = typeof lessonIdOrStep === "object"
        ? !!lessonIdOrStep.premium
        : false;
      if (!isPremium) return true;
      return Access.hasPremium();
    },

    // Redirect to auth if not logged in.
    requireLogin: function (redirectBack) {
      const page = redirectBack || window.location.pathname.split("/").pop() || "index.html";
      if (!Access.isLoggedIn()) {
        window.location.href = "auth.html?redirect=" + encodeURIComponent(page);
      }
    },

    // Redirect to pricing if not premium.
    requirePremium: function (redirectBack) {
      const page = redirectBack || window.location.pathname.split("/").pop() || "curso.html";
      if (!Access.hasPremium()) {
        if (window.Alerts) {
          Alerts.premium("Esta lección es Premium. Revisa los planes para desbloquearla.");
        }
        window.location.href = "pricing.html?from=" + encodeURIComponent(page);
      }
    },

    // Subscribe to auth state changes. Returns an unsubscribe function.
    onAuthChange: function (cb) {
      _listeners.add(cb);
      return function () { _listeners.delete(cb); };
    }
  };

  window.Access = Access;
})();
