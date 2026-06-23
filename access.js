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
  const POST_LOGIN_REDIRECT_KEY = "expresate_post_login_redirect";
  const POST_LOGIN_REDIRECT_TTL = 30 * 60 * 1000;
  const DEVICE_ID_KEY = "expresate_device_id";
  const MAX_PREMIUM_DEVICES = 2;
  const accessScriptUrl = Array.from(document.scripts)
    .map((script) => script.src)
    .find((src) => /\/access\.js(?:[?#]|$)/.test(src));
  const siteBaseUrl = new URL("./", accessScriptUrl || window.location.href);

  let _session  = null;
  let _profile  = null;
  const _listeners = new Set();
  const _deviceListeners = new Set();
  const _devPremiumBypass = isLocalDevOrigin();
  let _deviceId = "";
  let _deviceWarningShown = false;
  let _accessRefreshVersion = 0;
  let _deviceState = createDeviceState("signed-out");

  function isLocalDevOrigin() {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  }

  function sanitizeRedirect(value, fallback = "curso.html") {
    const safeFallback = fallback === "index.html" ? fallback : "curso.html";
    const candidate = String(value || "").trim();
    if (!candidate) return safeFallback;

    try {
      const url = new URL(candidate, siteBaseUrl);
      if (url.origin !== window.location.origin) return safeFallback;
      if (!url.pathname.startsWith(siteBaseUrl.pathname)) return safeFallback;

      const relativePath = url.pathname.slice(siteBaseUrl.pathname.length);
      if (!relativePath || !/^[a-z0-9][a-z0-9._/-]*\.html$/i.test(relativePath)) return safeFallback;
      if (relativePath.toLowerCase() === "auth.html") return safeFallback;
      return `${relativePath}${url.search}${url.hash}`;
    } catch {
      return safeFallback;
    }
  }

  function currentDestination() {
    const relativePath = window.location.pathname.startsWith(siteBaseUrl.pathname)
      ? window.location.pathname.slice(siteBaseUrl.pathname.length)
      : "";
    return sanitizeRedirect(`${relativePath}${window.location.search}${window.location.hash}`, "index.html");
  }

  function rememberPostLoginRedirect(destination) {
    const redirect = sanitizeRedirect(destination);
    try {
      window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, JSON.stringify({
        redirect,
        createdAt: Date.now()
      }));
    } catch {}
    return redirect;
  }

  function storedPostLoginRedirect() {
    try {
      const stored = JSON.parse(window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || "null");
      if (!stored || Date.now() - Number(stored.createdAt || 0) > POST_LOGIN_REDIRECT_TTL) {
        window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
        return "";
      }
      return sanitizeRedirect(stored.redirect, "");
    } catch {
      return "";
    }
  }

  function resolvePostLoginRedirect(explicitRedirect) {
    return explicitRedirect
      ? rememberPostLoginRedirect(explicitRedirect)
      : storedPostLoginRedirect() || "curso.html";
  }

  function consumePostLoginRedirect(explicitRedirect) {
    const redirect = resolvePostLoginRedirect(explicitRedirect);
    try { window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY); } catch {}
    return redirect;
  }

  function loginUrl(destination) {
    const redirect = rememberPostLoginRedirect(destination || currentDestination());
    return `auth.html?redirect=${encodeURIComponent(redirect)}`;
  }

  function createDeviceState(status) {
    return {
      status,
      allowed: true,
      enforcementAvailable: status !== "unavailable",
      maxDevices: MAX_PREMIUM_DEVICES,
      activeCount: 0,
      currentDeviceId: "",
      devices: [],
      error: null
    };
  }

  function makeDeviceId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    window.crypto?.getRandomValues?.(bytes);
    const random = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
    return `device-${Date.now().toString(36)}-${random || Math.random().toString(36).slice(2)}`;
  }

  function getDeviceId() {
    if (_deviceId) return _deviceId;
    try {
      _deviceId = window.localStorage.getItem(DEVICE_ID_KEY) || "";
      if (!_deviceId) {
        _deviceId = makeDeviceId();
        window.localStorage.setItem(DEVICE_ID_KEY, _deviceId);
      }
    } catch {
      _deviceId = makeDeviceId();
    }
    return _deviceId;
  }

  function getDeviceName() {
    const ua = navigator.userAgent || "";
    const platform = navigator.userAgentData?.platform || navigator.platform || "Dispositivo";
    let browser = "Navegador";
    if (/Edg\//.test(ua)) browser = "Edge";
    else if (/CriOS|Chrome\//.test(ua)) browser = "Chrome";
    else if (/Firefox\//.test(ua)) browser = "Firefox";
    else if (/Safari\//.test(ua)) browser = "Safari";

    let device = platform;
    if (/iPhone/.test(ua)) device = "iPhone";
    else if (/iPad/.test(ua)) device = "iPad";
    else if (/Android/.test(ua)) device = "Android";
    else if (/Windows/.test(ua)) device = "Windows";
    else if (/Macintosh|Mac OS/.test(ua)) device = "Mac";
    else if (/Linux/.test(ua)) device = "Linux";
    return `${browser} on ${device}`.slice(0, 120);
  }

  function isPremiumProfile(profile) {
    const periodEnd = profile?.current_period_end;
    return profile?.subscription_status === "active"
      && !!periodEnd
      && new Date(periodEnd) > new Date();
  }

  function deviceStateSnapshot() {
    return {
      ..._deviceState,
      devices: _deviceState.devices.map((device) => ({ ...device }))
    };
  }

  function emitDeviceChange() {
    const snapshot = deviceStateSnapshot();
    _deviceListeners.forEach((callback) => {
      try { callback(snapshot); } catch {}
    });
    window.dispatchEvent(new CustomEvent("expresate:device-limit", { detail: snapshot }));
  }

  async function fetchDevices(userId) {
    const { data, error } = await sb
      .from("user_devices")
      .select("id, user_id, device_id, device_name, user_agent, first_seen, last_seen, is_active")
      .eq("user_id", userId)
      .order("first_seen", { ascending: true })
      .order("id", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  function applyDevicePolicy(devices) {
    const currentDeviceId = getDeviceId();
    const activeDevices = devices.filter((device) => device.is_active);
    const allowedIds = new Set(activeDevices.slice(0, MAX_PREMIUM_DEVICES).map((device) => device.device_id));
    const premiumAccount = isPremiumProfile(_profile);
    const limited = premiumAccount
      && activeDevices.length > MAX_PREMIUM_DEVICES
      && !allowedIds.has(currentDeviceId);

    _deviceState = {
      status: limited ? "limited" : "allowed",
      allowed: !limited,
      enforcementAvailable: true,
      maxDevices: MAX_PREMIUM_DEVICES,
      activeCount: activeDevices.length,
      currentDeviceId,
      devices: devices.map((device) => ({
        ...device,
        is_current: device.device_id === currentDeviceId,
        is_allowed: premiumAccount && device.is_active && allowedIds.has(device.device_id)
      })),
      error: null
    };
    emitDeviceChange();
    return deviceStateSnapshot();
  }

  async function refreshDeviceState(options = {}) {
    const register = options.register !== false;
    if (!sb || !_session?.user) {
      _deviceState = createDeviceState("signed-out");
      emitDeviceChange();
      return deviceStateSnapshot();
    }

    if (_devPremiumBypass) {
      _deviceState = {
        ...createDeviceState("bypassed"),
        currentDeviceId: getDeviceId()
      };
      emitDeviceChange();
      return deviceStateSnapshot();
    }

    _deviceState = {
      ...createDeviceState("loading"),
      currentDeviceId: getDeviceId()
    };
    emitDeviceChange();

    try {
      if (register) {
        const now = new Date().toISOString();
        const { error } = await sb.from("user_devices").upsert({
          user_id: _session.user.id,
          device_id: getDeviceId(),
          device_name: getDeviceName(),
          user_agent: (navigator.userAgent || "").slice(0, 1000),
          last_seen: now,
          is_active: true
        }, { onConflict: "user_id,device_id" });
        if (error) throw error;
      }

      return applyDevicePolicy(await fetchDevices(_session.user.id));
    } catch (error) {
      _deviceState = {
        ...createDeviceState("unavailable"),
        currentDeviceId: getDeviceId(),
        error: error?.message || "Device registry unavailable"
      };
      if (!_deviceWarningShown) {
        console.warn("[Access] Device limit unavailable; Premium access remains unchanged:", _deviceState.error);
        _deviceWarningShown = true;
      }
      emitDeviceChange();
      return deviceStateSnapshot();
    }
  }

  async function refreshSessionAccess(session, options = {}) {
    const refreshVersion = ++_accessRefreshVersion;
    _session = session || null;
    _profile = _session?.user ? await fetchProfile(_session.user.id) : null;
    if (refreshVersion !== _accessRefreshVersion) return;
    await refreshDeviceState({ register: options.registerDevice !== false });
  }

  async function deactivateDevice(deviceId) {
    if (!sb || !_session?.user || !deviceId) return deviceStateSnapshot();
    const now = new Date().toISOString();
    const { error } = await sb
      .from("user_devices")
      // Moving first_seen forward means a deactivated device rejoins at the
      // back of the queue if its existing browser session is used again.
      .update({ is_active: false, first_seen: now, last_seen: now })
      .eq("user_id", _session.user.id)
      .eq("device_id", deviceId);
    if (error) throw error;
    return refreshDeviceState({ register: false });
  }

  async function deactivateCurrentDevice() {
    if (!sb || !_session?.user || _devPremiumBypass) return;
    try {
      await deactivateDevice(getDeviceId());
    } catch (error) {
      console.warn("[Access] Could not deactivate current device during logout:", error?.message || error);
    }
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
      await refreshSessionAccess(data?.session || null);
    } catch (e) {
      console.warn("[Access] init error — treating as guest:", e);
      // _session stays null → getUserPlan() returns 'guest'
    } finally {
      _resolveReady(); // Always resolve, even on network failure
    }

    // Watch for sign-in / sign-out / token refresh after init.
    sb.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(async () => {
        await refreshSessionAccess(session);
        _listeners.forEach(function (cb) { try { cb(session); } catch (e) {} });
      }, 0);
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

    hasPremiumSubscription: function () { return Access.getUserPlan() === "premium"; },
    hasPremium: function () {
      if (_devPremiumBypass) return true;
      return Access.hasPremiumSubscription() && _deviceState.allowed !== false;
    },

    getDeviceId,
    getDeviceLimitState: deviceStateSnapshot,
    refreshDevices: function () { return refreshDeviceState({ register: false }); },
    deactivateDevice,
    deactivateCurrentDevice,
    isPremiumDeviceLimited: function () {
      return Access.hasPremiumSubscription() && _deviceState.allowed === false;
    },
    onDeviceChange: function (callback) {
      _deviceListeners.add(callback);
      return function () { _deviceListeners.delete(callback); };
    },

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
      if (!Access.isLoggedIn()) {
        window.location.href = loginUrl(redirectBack || currentDestination());
        return false;
      }
      return true;
    },

    // Redirect to pricing if not premium.
    requirePremium: function (redirectBack) {
      const page = redirectBack || window.location.pathname.split("/").pop() || "curso.html";
      if (!Access.hasPremium()) {
        if (window.Alerts) {
          const message = Access.isPremiumDeviceLimited()
            ? "Tu cuenta Premium superó el límite de 2 dispositivos. Desactiva uno para continuar."
            : "Esta lección es Premium. Revisa los planes para desbloquearla.";
          Alerts.premium(message);
        }
        window.location.href = Access.isPremiumDeviceLimited()
          ? "devices.html?from=" + encodeURIComponent(page)
          : "pricing.html?from=" + encodeURIComponent(page);
      }
    },

    // Subscribe to auth state changes. Returns an unsubscribe function.
    onAuthChange: function (cb) {
      _listeners.add(cb);
      return function () { _listeners.delete(cb); };
    },

    sanitizeRedirect,
    currentDestination,
    rememberPostLoginRedirect,
    resolvePostLoginRedirect,
    consumePostLoginRedirect,
    loginUrl
  };

  window.Access = Access;

  // Plain auth links also retain their source page without page-specific JS.
  document.addEventListener("click", function (event) {
    const link = event.target.closest?.("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0) return;
    try {
      const url = new URL(link.getAttribute("href") || "", siteBaseUrl);
      if (url.origin !== window.location.origin || !url.pathname.endsWith("/auth.html")) return;
      if (url.searchParams.has("redirect")) return;
      event.preventDefault();
      window.location.href = loginUrl(currentDestination());
    } catch {}
  }, true);
})();
