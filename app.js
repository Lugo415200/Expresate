/* ------------------------------------------------------------
   Progress is provided by progress.js (window.Progress).
   This page loads progress.js BEFORE app.js, so the global is
   guaranteed to exist by the time DOMContentLoaded fires.

   If you ever load app.js without progress.js, the calls below
   will throw — that's intentional, so the issue is loud and
   obvious instead of silently breaking the unlock system.
   ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  // Footer year (if present)
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

    // =========================
  // Profile menu + logout (global)
  // =========================
  const sb = window.supabaseClient; // from supabaseClient.js
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profileEmail = document.getElementById("profileEmail");
  const logoutBtnGlobal = document.getElementById("logoutBtnGlobal");

  // current page for redirect (index.html, curso.html, etc.)
  const redirectUrl = window.location.pathname.split("/").pop() || "index.html";

  // if the HTML elements aren't on this page, skip
  if (profileBtn && profileMenu) {
    // Always show the button (we change label based on login)
    profileBtn.style.display = "inline-flex";

    // If Supabase isn't loaded on this page, fallback to auth page
    if (!sb) {
      profileBtn.textContent = "Iniciar sesión";
      profileBtn.addEventListener("click", () => {
        window.location.href = `auth.html?redirect=${encodeURIComponent(redirectUrl)}`;
      });
    } else {
      // On load, check session
      sb.auth.getSession().then(({ data }) => {
        updateProfileUI(data?.session);
      });

      // Keep updated
      sb.auth.onAuthStateChange((_event, session) => {
        updateProfileUI(session);
      });

      // Toggle menu ONLY when logged in
      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (profileBtn.dataset.state !== "signed-in") {
          window.location.href = `auth.html?redirect=${encodeURIComponent(redirectUrl)}`;
          return;
        }
        profileMenu.style.display = (profileMenu.style.display === "block") ? "none" : "block";
      });

      // Close when clicking outside
      document.addEventListener("click", () => {
        profileMenu.style.display = "none";
      });

      // Logout
      logoutBtnGlobal?.addEventListener("click", async () => {
        try {
          await sb.auth.signOut();
          profileMenu.style.display = "none";
          if (window.Alerts) Alerts.success("¡Hasta pronto! Sesión cerrada.", { duration: 2500 });
          // Short delay so the toast is briefly visible before the redirect.
          setTimeout(() => { window.location.href = "index.html"; }, 600);
        } catch (err) {
          console.error("Logout failed:", err);
          if (window.Alerts) Alerts.error("Error al cerrar sesión. Intenta de nuevo.");
        }
      });
    }
  }

  function updateProfileUI(session) {
    const signedIn = !!session?.user;

    if (!profileBtn || !profileMenu) return;

    if (signedIn) {
      profileBtn.textContent = "Perfil ▾";
      profileBtn.dataset.state = "signed-in";
      if (profileEmail) profileEmail.textContent = session.user.email || "usuario";
    } else {
      profileBtn.textContent = "Iniciar sesión";
      profileBtn.dataset.state = "logged-out";
      profileMenu.style.display = "none";
      if (profileEmail) profileEmail.textContent = "—";
    }
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
    if (!_shouldVerifyAudioSrc(src)) return true;
    if (audioAvailability.has(src)) return audioAvailability.get(src);

    try {
      const response = await fetch(src, { method: "HEAD", cache: "force-cache" });
      const ok = response.ok;
      audioAvailability.set(src, ok);
      return ok;
    } catch {
      audioAvailability.set(src, false);
      return false;
    }
  }

  function playLessonAudio(options = {}) {
    const src = _cleanAudioSrc(options.src);
    const trigger = options.trigger || null;
    const requestId = ++playbackRequestId;

    // One tap owns playback. This also invalidates older async HEAD checks.
    _cancelCurrentPlayback(false);
    const fallbackOptions = { ...options, src, requestId };

    if (!src) {
      return options.fallbackText ? _audioFallbackSpeech(options.fallbackText, trigger, fallbackOptions) : false;
    }

    const playExistingSrc = () => {
      if (requestId !== playbackRequestId) return;
      player.src = src;
      currentMediaRequestId = requestId;
      if (trigger) _setPlayingBtn(trigger);
      player.play().catch(() => {
        if (requestId !== playbackRequestId) return;
        currentMediaRequestId = 0;
        _clearPlayingBtn();
        if (options.fallbackText) _audioFallbackSpeech(options.fallbackText, trigger, fallbackOptions);
      });
    };

    try {
      if (_shouldVerifyAudioSrc(src)) {
        _audioExists(src).then((exists) => {
          if (requestId !== playbackRequestId) return;
          if (exists) {
            playExistingSrc();
          } else if (options.fallbackText) {
            _audioFallbackSpeech(options.fallbackText, trigger, fallbackOptions);
          }
        });
        return true;
      }

      playExistingSrc();
      return true;
    } catch {
      if (requestId === playbackRequestId) _clearPlayingBtn();
      return options.fallbackText ? _audioFallbackSpeech(options.fallbackText, trigger, fallbackOptions) : false;
    }
  }

  window.ExpresateAudio = {
    play: (src, options = {}) => playLessonAudio({ ...options, src }),
    speak: _audioFallbackSpeech,
    stop: () => _cancelCurrentPlayback(true),
    // Developer helpers:
    //   ExpresateAudio.debugVoices()
    //   ExpresateAudio.previewVoice(0, "I am learning English.")
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
    });

    // React if another tab (or the curso page) changes progress.
    Progress.on("change", refresh);

    refresh();
  }

  // Lessons page: show completed badges next to lessons that are done.
  document.querySelectorAll("[data-progress-id]").forEach((el) => {
    const id = el.getAttribute("data-progress-id");
    if (Progress.isLessonDone(id)) {
      el.classList.add("done");

      // Prevent duplicates if you refresh multiple times
      if (!el.querySelector(".doneBadge")) {
        const badge = document.createElement("span");
        badge.className = "doneBadge";
        badge.textContent = "Completada ✅";
        el.appendChild(badge);
      }
    }
  });
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
