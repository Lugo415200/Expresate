/* ------------------------------------------------------------
   Progress is provided by progress.js (window.Progress).
   This page loads progress.js BEFORE app.js, so the global is
   guaranteed to exist by the time DOMContentLoaded fires.

   If you ever load app.js without progress.js, the calls below
   will throw — that's intentional, so the issue is loud and
   obvious instead of silently breaking the unlock system.
   ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  function pulseTextureReward() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelector(".texture-reward-burst")?.remove();
    const burst = document.createElement("div");
    burst.className = "texture-reward-burst";
    burst.setAttribute("aria-hidden", "true");
    document.body.appendChild(burst);
    burst.addEventListener("animationend", () => burst.remove(), { once: true });
    window.setTimeout(() => burst.remove(), 2200);
  }

  window.ExpresateTextureReward = { pulse: pulseTextureReward };
  // Footer year (if present)
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  function renderDeviceLimitNotice(state) {
    const existing = document.getElementById("deviceLimitNotice");
    if (!state || state.status !== "limited") {
      existing?.remove();
      return;
    }

    const notice = existing || document.createElement("aside");
    notice.id = "deviceLimitNotice";
    notice.className = "device-limit-notice";
    notice.setAttribute("role", "alert");
    const returnTo = window.Access?.currentDestination?.() || "curso.html";
    notice.innerHTML = `
      <div>
        <strong>Límite de dispositivos Premium</strong>
        <span>Esta cuenta tiene ${state.activeCount} dispositivos activos. Desactiva uno para usar Premium aquí.</span>
      </div>
      <a class="btn primary" href="devices.html?from=${encodeURIComponent(returnTo)}">Administrar</a>
    `;
    if (!existing) {
      const topbar = document.querySelector(".topbar");
      topbar?.insertAdjacentElement("afterend", notice) || document.body.prepend(notice);
    }
  }

  if (window.Access) {
    Access.ready().then(() => renderDeviceLimitNotice(Access.getDeviceLimitState?.()));
    Access.onDeviceChange?.(renderDeviceLimitNotice);
  }

  const GUEST_REMINDER_KEY = "expresate_guest_account_reminder_dismissed_until";
  const GUEST_REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const GUEST_REMINDER_PAGES = new Set(["curso", "diccionario", "juego"]);

  function shouldShowGuestReminder() {
    if (document.body.dataset.page === "auth" || document.body.dataset.page === "pricing") return false;
    if (document.body.dataset.lessonId) return true;
    return GUEST_REMINDER_PAGES.has(document.body.dataset.page || "");
  }

  function guestReminderDismissed() {
    try {
      const until = Number(window.localStorage.getItem(GUEST_REMINDER_KEY) || 0);
      return Number.isFinite(until) && until > Date.now();
    } catch (_) {
      return false;
    }
  }

  function dismissGuestReminder() {
    try {
      window.localStorage.setItem(GUEST_REMINDER_KEY, String(Date.now() + GUEST_REMINDER_COOLDOWN_MS));
    } catch (_) {}
    document.getElementById("guestAccountReminder")?.remove();
  }

  function authReminderUrl(mode) {
    const redirect = window.Access?.currentDestination?.() || window.location.pathname.split("/").pop() || "curso.html";
    const params = new URLSearchParams({ mode, redirect });
    return `auth.html?${params.toString()}`;
  }

  function renderGuestAccountReminder(session) {
    const existing = document.getElementById("guestAccountReminder");
    if (session?.user || !shouldShowGuestReminder() || guestReminderDismissed()) {
      existing?.remove();
      return;
    }
    if (existing) return;

    const reminder = document.createElement("aside");
    reminder.id = "guestAccountReminder";
    reminder.className = "guest-account-reminder";
    reminder.setAttribute("role", "region");
    reminder.setAttribute("aria-label", "Recordatorio para guardar tu progreso");
    reminder.innerHTML = `
      <div class="guest-account-reminder__icon" aria-hidden="true">★</div>
      <div class="guest-account-reminder__copy">
        <strong>Guarda tu progreso</strong>
        <span>Crea una cuenta gratis o inicia sesión para guardar tu XP, racha y lecciones completadas.</span>
      </div>
      <div class="guest-account-reminder__actions">
        <a class="btn primary" href="${authReminderUrl("signup")}">Crear cuenta</a>
        <a class="btn" href="${authReminderUrl("login")}">Iniciar sesión</a>
        <button class="btn ghost" type="button" data-guest-reminder-dismiss>Más tarde</button>
      </div>
    `;
    reminder.querySelector("[data-guest-reminder-dismiss]")?.addEventListener("click", dismissGuestReminder);
    document.body.appendChild(reminder);
  }

  if (window.Access) {
    Access.ready().then(() => renderGuestAccountReminder(Access.getSession?.()));
    Access.onAuthChange?.((session) => renderGuestAccountReminder(session));
  }


    // =========================
  // Audio buttons (alphabet + custom)
  // =========================
  // Existing alphabet audio lives in audio/alphabet/*.mp3.
  // Future human recordings must be registered in assets/audio/audio-manifest.json.
  const player = new Audio();
  player.preload = "auto";
  const audioAvailability = new Map();
  const appScriptUrl = Array.from(document.scripts)
    .map((script) => script.src)
    .find((src) => /\/app\.js(?:[?#]|$)/.test(src));
  const siteBaseUrl = new URL("./", appScriptUrl || window.location.href);
  const audioManifestUrl = new URL("assets/audio/audio-manifest.json", siteBaseUrl).href;
  const audioManifestState = {
    status: "loading",
    url: audioManifestUrl,
    manifest: null,
    error: null
  };
  const audioDebugState = {
    lastRequest: null,
    lastLookup: null,
    lastSelection: null
  };
  let audioDebugEnabled = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  try {
    audioDebugEnabled ||= window.localStorage.getItem("expresate_audio_debug") === "1";
  } catch {}

  function _audioDebug(event, details = {}) {
    if (!audioDebugEnabled) return;
    console.debug(`[ExpresateAudio] ${event}`, details);
  }

  const audioManifestReady = fetch(audioManifestUrl, {
    cache: "no-cache"
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Audio manifest request failed (${response.status})`);
      return response.json();
    })
    .then((manifest) => {
      audioManifestState.status = "ready";
      audioManifestState.manifest = manifest;
      _audioDebug("manifest ready", {
        url: audioManifestUrl,
        entries: Object.keys(manifest?.entries || {}).length
      });
      return manifest;
    })
    .catch((error) => {
      audioManifestState.status = "failed";
      audioManifestState.error = error;
      _audioDebug("manifest failed", { url: audioManifestUrl, error: error.message });
      return { entries: {}, byText: {} };
    });
  let playbackRequestId = 0;
  let currentMediaRequestId = 0;

  // Tracks the button that triggered the current audio so we can apply
  // the .is-playing ripple class and remove it when playback ends.
  let _playingBtn = null;

  function _clearPlayingBtn() {
    if (_playingBtn) {
      _playingBtn.classList.remove("is-playing");
      _playingBtn = null;
    }
  }
  function _setPlayingBtn(el) {
    _clearPlayingBtn();
    if (el) {
      _playingBtn = el;
      el.classList.add("is-playing");
    }
  }

  function _clearMediaPlayingState() {
    if (currentMediaRequestId && currentMediaRequestId === playbackRequestId) {
      _clearPlayingBtn();
    }
  }

  player.addEventListener("ended", _clearMediaPlayingState);
  player.addEventListener("error", _clearMediaPlayingState);

  function _cleanAudioSrc(src) {
    return String(src || "").trim();
  }

  function _normalizeAudioManifestText(value) {
    return String(value || "")
      .replace(/[’‘]/g, "'")
      .replace(/[.,!?]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function _resolveAudioUrl(src) {
    const cleanSrc = _cleanAudioSrc(src);
    if (!cleanSrc) return "";
    try {
      return new URL(cleanSrc, siteBaseUrl).href;
    } catch {
      return cleanSrc;
    }
  }

  async function _manifestAudioMatch(text) {
    const normalizedText = _normalizeAudioManifestText(text);
    if (!normalizedText) return { id: "", path: "", url: "" };

    // Always await the manifest before trying legacy audio or synthesis. This
    // prevents a fast tap during startup from bypassing generated MP3 audio.
    const manifest = await audioManifestReady;
    const path = _cleanAudioSrc(manifest?.byText?.[normalizedText]);
    const entryMatch = Object.entries(manifest?.entries || {})
      .find(([, entry]) => _cleanAudioSrc(entry?.path) === path);
    const match = {
      id: entryMatch?.[0] || "",
      path,
      url: _resolveAudioUrl(path)
    };
    audioDebugState.lastLookup = {
      requestedText: text,
      normalizedText,
      found: Boolean(path),
      ...match
    };
    _audioDebug("manifest lookup", audioDebugState.lastLookup);
    return match;
  }

  function _speechKind(text, options = {}) {
    if (["letter", "word", "phrase"].includes(options.speechType)) return options.speechType;

    const src = String(options.src || "").toLowerCase();
    const phrase = String(text || "").trim();
    if (/\/letters\/|\/alphabet\//.test(src)) return "letter";
    if (/^[a-z]$/i.test(phrase) || /^(?:[a-z]\s*-\s*)+[a-z]$/i.test(phrase)) return "letter";

    const words = phrase.match(/[a-z]+(?:'[a-z]+)?/gi) || [];
    return words.length <= 1 ? "word" : "phrase";
  }

  function _prepareSpeechText(text, kind) {
    let phrase = String(text || "")
      .replace(/\s*[|→]\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim();

    // A hyphenated letter sequence sounds clearer as short spoken units.
    if (kind === "letter" && /^(?:[a-z]\s*-\s*)+[a-z]$/i.test(phrase)) {
      phrase = phrase.replace(/\s*-\s*/g, ", ");
    }

    // Normal punctuation creates reliable pauses across browsers. SSML tags
    // are intentionally avoided because several Web Speech engines read them.
    if (kind === "phrase" && !/[.!?]$/.test(phrase)) phrase += ".";
    return phrase;
  }

  function _clampSpeechValue(value, fallback, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }

  function _speechProfile(text, options = {}) {
    const kind = _speechKind(text, options);
    const profiles = {
      letter: { rate: 0.82, pitch: 1.03, volume: 1 },
      word: { rate: 0.86, pitch: 1.0, volume: 1 },
      phrase: { rate: 0.92, pitch: 0.98, volume: 1 }
    };
    const defaults = profiles[kind];

    return {
      kind,
      rate: _clampSpeechValue(options.rate, defaults.rate, 0.5, 1.5),
      pitch: _clampSpeechValue(options.pitch, defaults.pitch, 0.5, 1.5),
      volume: _clampSpeechValue(options.volume, defaults.volume, 0, 1)
    };
  }

  function _cancelCurrentPlayback(invalidateRequest = true) {
    if (invalidateRequest) playbackRequestId += 1;
    currentMediaRequestId = 0;
    activeUtterance = null;
    try {
      player.pause();
      player.removeAttribute("src");
      player.currentTime = 0;
    } catch {}
    _clearPlayingBtn();
  }

  function _isAlphabetRecording(src) {
    return /^audio\/alphabet\/[a-z]\.mp3$/i.test(_cleanAudioSrc(src));
  }

  async function _hasHumanRecording(src) {
    const cleanSrc = _cleanAudioSrc(src);
    if (_isAlphabetRecording(cleanSrc)) return true;
    if (!/^assets\/audio\//i.test(cleanSrc)) return false;

    const manifest = await audioManifestReady;
    return Object.values(manifest?.entries || {}).some((entry) => _cleanAudioSrc(entry?.path) === cleanSrc);
  }

  function _markAudioUnavailable(trigger) {
    if (!trigger) return;
    trigger.classList.remove("is-playing");
    trigger.classList.add("is-audio-unavailable");
    trigger.setAttribute("aria-disabled", "true");
    if ("disabled" in trigger) trigger.disabled = true;
  }

  async function _tryAudioSource(src, requestId, trigger, sourceType, requestedText) {
    if (!src || requestId !== playbackRequestId) return false;
    if (!(await _hasHumanRecording(src))) {
      _markAudioUnavailable(trigger);
      return false;
    }
    if (requestId !== playbackRequestId) return false;

    try {
      const resolvedUrl = _resolveAudioUrl(src);
      player.src = resolvedUrl;
      currentMediaRequestId = requestId;
      if (trigger) _setPlayingBtn(trigger);
      await player.play();
      audioDebugState.lastSelection = {
        requestedText,
        sourceType,
        resolvedUrl
      };
      _audioDebug("selected source", audioDebugState.lastSelection);
      return true;
    } catch {
      if (requestId === playbackRequestId) {
        currentMediaRequestId = 0;
        _clearPlayingBtn();
      }
      return false;
    }
  }

  function playLessonAudio(options = {}) {
    const legacySrc = _cleanAudioSrc(options.src);
    const trigger = options.trigger || null;
    const requestId = ++playbackRequestId;
    audioDebugState.lastRequest = {
      requestId,
      requestedText: options.fallbackText || "",
      requestedId: options.audioId || "",
      explicitSource: legacySrc || null
    };
    audioDebugState.lastSelection = null;
    _audioDebug("play requested", audioDebugState.lastRequest);

    // One tap owns playback. This invalidates older manifest/HEAD checks.
    _cancelCurrentPlayback(false);
    (async () => {
      const sourceType = _isAlphabetRecording(legacySrc) ? "human alphabet recording" : "human recording";
      if (await _tryAudioSource(legacySrc, requestId, trigger, sourceType, options.fallbackText)) return;
      if (requestId === playbackRequestId) _markAudioUnavailable(trigger);
    })().catch(() => {
      if (requestId === playbackRequestId) _markAudioUnavailable(trigger);
    });

    return Boolean(legacySrc);
  }

  window.ExpresateAudio = {
    play: (src, options = {}) => playLessonAudio({ ...options, src }),
    hasRecording: _hasHumanRecording,
    stop: () => _cancelCurrentPlayback(true),
    // Developer helpers:
    //   await ExpresateAudio.debugManifest()
    //   ExpresateAudio.testAudio("words-apple")
    //   await ExpresateAudio.clearAudioCache()
    debugManifest: async () => {
      audioDebugEnabled = true;
      try { window.localStorage.setItem("expresate_audio_debug", "1"); } catch {}
      const manifest = await audioManifestReady;
      const summary = {
        status: audioManifestState.status,
        url: audioManifestState.url,
        entryCount: Object.keys(manifest?.entries || {}).length,
        cacheVersionExpected: "v72",
        error: audioManifestState.error?.message || null,
        lastRequest: audioDebugState.lastRequest,
        lastLookup: audioDebugState.lastLookup,
        lastSelection: audioDebugState.lastSelection
      };
      console.info("[ExpresateAudio] manifest", summary);
      return summary;
    },
    testAudio: async (id) => {
      audioDebugEnabled = true;
      const manifest = await audioManifestReady;
      const entry = manifest?.entries?.[String(id || "")];
      if (!entry) {
        console.warn(`[ExpresateAudio] Unknown manifest audio id: ${id}`);
        return false;
      }
      return playLessonAudio({
        src: entry.path,
        fallbackText: entry.text,
        audioId: id
      });
    },
    clearAudioCache: async () => {
      audioAvailability.clear();
      const deleted = [];
      if ("caches" in window) {
        const names = await window.caches.keys();
        for (const name of names.filter((item) => item.startsWith("expresate-static-"))) {
          if (await window.caches.delete(name)) deleted.push(name);
        }
      }
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.update();
      console.info("[ExpresateAudio] cleared PWA static caches", deleted);
      return { deleted, reloadRequired: true };
    }
  };

  function _audioSlug(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function _audioPathForText(text) {
    const slug = _audioSlug(text);
    if (!slug) return "";
    const folder = slug.includes("-") ? "phrases" : "words";
    return `assets/audio/${folder}/${slug}.mp3`;
  }

  function _primaryAudioText(el) {
    const strong = el.querySelector("strong");
    return (strong ? strong.textContent : el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function _isLikelyAudioText(text) {
    return /[a-z]/i.test(text) && !/[¿¡]/.test(text) && text.length <= 90;
  }

  function enhanceLessonAudioTargets() {
    document.querySelectorAll(".phrase-card, .name-script-card").forEach((el) => {
      if (el.hasAttribute("data-audio") || el.hasAttribute("data-audio-fallback")) return;

      const text = _primaryAudioText(el);
      if (!_isLikelyAudioText(text)) return;

      el.setAttribute("data-audio", _audioPathForText(text));
      el.setAttribute("data-audio-fallback", text);
      el.setAttribute("aria-label", `Escuchar ${text}`);
      if (!/^(button|a)$/i.test(el.tagName)) {
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
      }
    });

    document.querySelectorAll(".name-output").forEach((el) => {
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", "Escuchar frase");
    });
  }

  audioManifestReady.then(() => {
    document.querySelectorAll("[data-audio]").forEach((control) => {
      if (!_isAlphabetRecording(control.getAttribute("data-audio"))) _markAudioUnavailable(control);
    });
  });

  // Optional: stop any current audio when leaving page
  window.addEventListener("beforeunload", () => {
    try {
      player.pause();
      player.currentTime = 0;
    } catch {}
  });

  document.addEventListener("click", (e) => {
    // 0) Explicit human recordings only.
    const anyAudio = e.target.closest("[data-audio], [data-audio-fallback]");
    if (anyAudio) {
      const src = (anyAudio.getAttribute("data-audio") || "").trim();
      playLessonAudio({
        src,
        trigger: anyAudio,
        fallbackText: anyAudio.getAttribute("data-audio-fallback"),
        speechType: anyAudio.getAttribute("data-speech-type") || undefined,
        rate: anyAudio.getAttribute("data-speech-rate") || undefined,
        pitch: anyAudio.getAttribute("data-speech-pitch") || undefined
      });
      return;
    }
    // 1) Alphabet letters: <button class="letter-btn" data-letter="a">A</button>
    const letterBtn = e.target.closest(".letter-btn");
    if (letterBtn) {
      const letter = (letterBtn.dataset.letter || "").toLowerCase().trim();
      if (!letter) return;

      const src = `audio/alphabet/${letter}.mp3`;
      playLessonAudio({
        src,
        trigger: letterBtn,
        fallbackText: letter.toUpperCase(),
        speechType: "letter"
      });
      return;
    }

    // 2) Custom audio: <button class="audio-btn" data-audio="audio/words/eat.mp3">🔊</button>
    const audioBtn = e.target.closest(".audio-btn");
    if (audioBtn) {
      const src = (audioBtn.dataset.audio || "").trim();
      if (!src) return;

      playLessonAudio({
        src,
        trigger: audioBtn,
        fallbackText: audioBtn.getAttribute("data-audio-fallback"),
        speechType: audioBtn.getAttribute("data-speech-type") || undefined,
        rate: audioBtn.getAttribute("data-speech-rate") || undefined,
        pitch: audioBtn.getAttribute("data-speech-pitch") || undefined
      });
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const anyAudio = e.target.closest("[data-audio], [data-audio-fallback]");
    if (!anyAudio || /^(button|a|input|textarea|select)$/i.test(anyAudio.tagName)) return;
    e.preventDefault();
    anyAudio.click();
  });

  // Lesson page: wire up completion button.
  // Requires: <body data-lesson-id="..."> using a canonical ID.
  const lessonId = document.body.dataset.lessonId;
  const completeBtn = document.getElementById("markComplete");
  const status = document.getElementById("lessonStatus");

  if (lessonId && completeBtn) {
    const refresh = () => {
      const done = Progress.isLessonDone(lessonId);

      completeBtn.textContent = done ? "Completada ✅" : "Marcar como completada";
      if (status) {
        status.textContent = done
          ? "Estado: Completada ✅"
          : "Estado: No completada todavía";
      }

      // Style: primary when not done (more inviting click target)
      completeBtn.classList.toggle("primary", !done);
    };

    completeBtn.addEventListener("click", () => {
      const done = Progress.isLessonDone(lessonId);
      Progress.setLessonDone(lessonId, !done);
      refresh();
      if (!done && window.Alerts) {
        // !done means we just marked it complete (was false, now true)
        Alerts.success("¡Lección completada! +10 XP 🎉");
      }
      if (!done) pulseTextureReward();
    });

    // React if another tab (or the curso page) changes progress.
    Progress.on("change", refresh);

    refresh();
  }

  // Lessons page: show completed badges next to lessons that are done.
  const renderLessonIndexProgress = () => {
    document.querySelectorAll("[data-progress-id]").forEach((el) => {
      const id = el.getAttribute("data-progress-id");
      const done = Progress.isLessonDone(id);
      el.classList.toggle("done", done);

      const existingBadge = el.querySelector(".doneBadge");
      if (!done) {
        existingBadge?.remove();
      } else if (!existingBadge) {
        const badge = document.createElement("span");
        badge.className = "doneBadge";
        badge.textContent = "Completada ✅";
        el.appendChild(badge);
      }
    });
  };
  renderLessonIndexProgress();
  Progress.on("change", renderLessonIndexProgress);
});

/* ------------------------------------------------------------
   Progressive Web App support

   Registration is intentionally shared here because every main
   page already loads app.js. The service worker itself only caches
   an explicit list of same-origin static files and never handles
   Supabase or other external requests.
   ------------------------------------------------------------ */
(() => {
  if (!("serviceWorker" in navigator)) return;
  if (!window.isSecureContext && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  window.addEventListener("load", () => {
    const serviceWorkerUrl = new URL("service-worker.js", window.location.href);
    const scopeUrl = new URL("./", serviceWorkerUrl);

    navigator.serviceWorker.register(serviceWorkerUrl.pathname, {
      scope: scopeUrl.pathname,
      updateViaCache: "none"
    })
      .catch((error) => console.warn("PWA service worker registration failed:", error));
  });
})();

(() => {
  let deferredInstallPrompt = null;
  let installBanner = null;

  function removeInstallBanner() {
    installBanner?.remove();
    installBanner = null;
  }

  function renderInstallBanner() {
    if (installBanner || !deferredInstallPrompt) return;
    if (sessionStorage.getItem("expresate_pwa_install_dismissed") === "1") return;

    installBanner = document.createElement("aside");
    installBanner.className = "pwa-install-banner";
    installBanner.setAttribute("role", "dialog");
    installBanner.setAttribute("aria-label", "Instalar Exprésate");
    installBanner.innerHTML = `
      <div class="pwa-install-mark" aria-hidden="true">E</div>
      <div class="pwa-install-copy">
        <strong>Instala Exprésate</strong>
        <span>Abre tus lecciones como una app desde tu dispositivo.</span>
      </div>
      <div class="pwa-install-actions">
        <button class="btn pwa-install-dismiss" type="button">Ahora no</button>
        <button class="btn primary pwa-install-confirm" type="button">Instalar</button>
      </div>
    `;

    installBanner.querySelector(".pwa-install-dismiss")?.addEventListener("click", () => {
      sessionStorage.setItem("expresate_pwa_install_dismissed", "1");
      removeInstallBanner();
    });

    installBanner.querySelector(".pwa-install-confirm")?.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      removeInstallBanner();
    });

    document.body.appendChild(installBanner);
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallBanner();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    removeInstallBanner();
  });
})();
