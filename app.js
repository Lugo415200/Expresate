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


    // =========================
  // Audio buttons (alphabet + custom)
  // =========================
  // Existing alphabet audio lives in audio/alphabet/*.mp3.
  // Future lesson audio can be placed in:
  // - assets/audio/letters/
  // - assets/audio/words/
  // - assets/audio/phrases/
  // - assets/audio/lesson-intros/
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
  const speechSynth = "speechSynthesis" in window ? window.speechSynthesis : null;

  // Speech synthesis quality is controlled by the device/browser. This
  // ranking selects the best installed English voice we can find, but real
  // recorded audio remains the preferred and most consistent option.
  const preferredVoiceNames = [
    "microsoft aria",
    "microsoft jenny",
    "microsoft ava",
    "google us english",
    "samantha",
    "allison",
    "ava",
    "susan",
    "tom"
  ];
  let rankedEnglishVoices = [];
  let selectedEnglishVoice = null;
  let playbackRequestId = 0;
  let currentMediaRequestId = 0;
  let activeUtterance = null;

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

  function _voiceScore(voice) {
    const name = String(voice?.name || "").toLowerCase();
    const lang = String(voice?.lang || "").toLowerCase();
    let score = 0;

    if (lang === "en-us") score += 120;
    else if (lang.startsWith("en-us")) score += 110;
    else if (lang.startsWith("en-")) score += 45;
    else return -1000;

    if (/natural|neural|premium|enhanced|online/.test(name)) score += 45;
    if (/google|microsoft|apple/.test(name)) score += 12;
    if (voice.localService) score += 6;
    if (voice.default) score += 3;
    if (/compact|espeak|festival|mbrola/.test(name)) score -= 60;

    const preferredIndex = preferredVoiceNames.findIndex((candidate) => name.includes(candidate));
    if (preferredIndex >= 0) score += 35 - preferredIndex;
    return score;
  }

  function _refreshSpeechVoices() {
    if (!speechSynth) return [];
    rankedEnglishVoices = speechSynth.getVoices()
      .filter((voice) => String(voice.lang || "").toLowerCase().startsWith("en"))
      .sort((a, b) => _voiceScore(b) - _voiceScore(a));
    selectedEnglishVoice = rankedEnglishVoices[0] || null;
    return rankedEnglishVoices;
  }

  if (speechSynth) {
    _refreshSpeechVoices();
    speechSynth.addEventListener?.("voiceschanged", _refreshSpeechVoices);
    // Safari and some Chromium builds populate voices after page startup.
    window.setTimeout(_refreshSpeechVoices, 250);
    window.setTimeout(_refreshSpeechVoices, 1000);
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
      speechSynth?.cancel();
    } catch {}
    _clearPlayingBtn();
  }

  function _audioFallbackSpeech(text, trigger, options = {}) {
    const rawText = String(text || "").trim();
    if (!rawText || !speechSynth || !("SpeechSynthesisUtterance" in window)) return false;

    const requestId = options.requestId || ++playbackRequestId;
    if (requestId !== playbackRequestId) return false;

    try {
      _cancelCurrentPlayback(false);
      _refreshSpeechVoices();

      const profile = _speechProfile(rawText, options);
      const utterance = new SpeechSynthesisUtterance(_prepareSpeechText(rawText, profile.kind));
      const requestedVoice = options.voice || selectedEnglishVoice;
      if (requestedVoice) utterance.voice = requestedVoice;
      utterance.lang = requestedVoice?.lang || "en-US";
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = profile.volume;
      utterance.onend = () => {
        if (requestId !== playbackRequestId) return;
        activeUtterance = null;
        _clearPlayingBtn();
      };
      utterance.onerror = () => {
        if (requestId !== playbackRequestId) return;
        activeUtterance = null;
        _clearPlayingBtn();
      };

      activeUtterance = utterance;
      if (trigger) _setPlayingBtn(trigger);
      audioDebugState.lastSelection = {
        requestedText: rawText,
        sourceType: "speech synthesis",
        voice: requestedVoice?.name || "browser default",
        resolvedUrl: null
      };
      _audioDebug("selected source", audioDebugState.lastSelection);
      speechSynth.speak(utterance);
      return true;
    } catch {
      if (requestId === playbackRequestId) _clearPlayingBtn();
      return false;
    }
  }

  function _shouldVerifyAudioSrc(src) {
    return /^assets\/audio\//i.test(src) || /\/assets\/audio\//i.test(src);
  }

  async function _audioExists(src) {
    const resolvedSrc = _resolveAudioUrl(src);
    if (!_shouldVerifyAudioSrc(resolvedSrc)) return true;
    if (audioAvailability.has(resolvedSrc)) return audioAvailability.get(resolvedSrc);

    try {
      const response = await fetch(resolvedSrc, { method: "HEAD", cache: "no-cache" });
      const ok = response.ok;
      audioAvailability.set(resolvedSrc, ok);
      return ok;
    } catch {
      audioAvailability.set(resolvedSrc, false);
      return false;
    }
  }

  async function _tryAudioSource(src, requestId, trigger, sourceType, requestedText) {
    if (!src || requestId !== playbackRequestId) return false;
    if (_shouldVerifyAudioSrc(src) && !(await _audioExists(src))) return false;
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
    const fallbackOptions = { ...options, src: legacySrc, requestId };

    (async () => {
      const manifestMatch = await _manifestAudioMatch(options.fallbackText);
      if (requestId !== playbackRequestId) return;

      // Generated ElevenLabs audio is first priority. Existing explicit paths
      // remain the second priority for legacy recordings and custom assets.
      const candidates = [
        { src: manifestMatch.path, type: "ElevenLabs MP3" },
        {
          src: legacySrc,
          type: /^audio\/alphabet\//i.test(legacySrc) ? "original alphabet MP3" : "legacy MP3"
        }
      ].filter((candidate, index, all) => candidate.src && all.findIndex((item) => item.src === candidate.src) === index);
      for (const candidate of candidates) {
        if (await _tryAudioSource(candidate.src, requestId, trigger, candidate.type, options.fallbackText)) return;
      }

      if (requestId === playbackRequestId && options.fallbackText) {
        _audioFallbackSpeech(options.fallbackText, trigger, fallbackOptions);
      }
    })().catch(() => {
      if (requestId === playbackRequestId && options.fallbackText) {
        _audioFallbackSpeech(options.fallbackText, trigger, fallbackOptions);
      }
    });

    return Boolean(legacySrc || options.fallbackText);
  }

  window.ExpresateAudio = {
    play: (src, options = {}) => playLessonAudio({ ...options, src }),
    speak: _audioFallbackSpeech,
    stop: () => _cancelCurrentPlayback(true),
    // Developer helpers:
    //   await ExpresateAudio.debugManifest()
    //   ExpresateAudio.testAudio("words-apple")
    //   await ExpresateAudio.clearAudioCache()
    //   ExpresateAudio.debugVoices()
    //   ExpresateAudio.previewVoice(0, "I am learning English.")
    debugManifest: async () => {
      audioDebugEnabled = true;
      try { window.localStorage.setItem("expresate_audio_debug", "1"); } catch {}
      const manifest = await audioManifestReady;
      const summary = {
        status: audioManifestState.status,
        url: audioManifestState.url,
        entryCount: Object.keys(manifest?.entries || {}).length,
        cacheVersionExpected: "v5",
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
    },
    debugVoices: () => {
      const rows = _refreshSpeechVoices().map((voice, index) => ({
        index,
        selected: voice === selectedEnglishVoice,
        name: voice.name,
        lang: voice.lang,
        local: voice.localService,
        default: voice.default,
        score: _voiceScore(voice)
      }));
      console.table(rows);
      return rows;
    },
    previewVoice: (voiceNameOrIndex = 0, text = "I am learning English.") => {
      const voices = _refreshSpeechVoices();
      const voice = typeof voiceNameOrIndex === "number"
        ? voices[voiceNameOrIndex]
        : voices.find((item) => item.name.toLowerCase().includes(String(voiceNameOrIndex).toLowerCase()));
      if (!voice) return false;
      return _audioFallbackSpeech(text, null, { voice, speechType: "phrase" });
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

  enhanceLessonAudioTargets();

  // Optional: stop any current audio when leaving page
  window.addEventListener("beforeunload", () => {
    try {
      player.pause();
      player.currentTime = 0;
      window.speechSynthesis?.cancel?.();
    } catch {}
  });

  document.addEventListener("click", (e) => {
    const dynamicOutput = e.target.closest(".name-output");
    if (dynamicOutput && !e.target.closest("button, a, input, textarea, select")) {
      const text = _primaryAudioText(dynamicOutput);
      if (text) {
        playLessonAudio({
          src: _audioPathForText(text),
          trigger: dynamicOutput,
          fallbackText: text
        });
      }
      return;
    }

    // 0) Works for vowel buttons and any clickable item with audio data.
    // Add data-audio-fallback="word or phrase" when a missing local file
    // should fall back to browser speech synthesis. Optional fine-tuning:
    // data-speech-type="letter|word|phrase", data-speech-rate="0.88",
    // and data-speech-pitch="1.0".
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
    const dynamicOutput = e.target.closest(".name-output");
    if (dynamicOutput) {
      e.preventDefault();
      dynamicOutput.click();
      return;
    }
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

    navigator.serviceWorker.register(serviceWorkerUrl.pathname, { scope: scopeUrl.pathname })
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
