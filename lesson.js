/* ============================================================
   lesson.js — Lesson-page controller for the flashcard layout.

   What it does:
     • Tracks per-section "Listo" clicks on every .flashcard
     • Updates the top sticky progress bar
     • Fills the right-panel checklist + XP reward + next-step CTA
     • Wires up the Mini Reto challenge card (listening drill)
     • Gates #markComplete until every section is Listo
     • If Progress already says the lesson is done, every section is
       pre-marked Listo on load.

   Requirements:
     • <body data-lesson-id="..." data-page="curso">
     • progress.js + data/lessons.js loaded before this script
     • .flashcard elements have data-fc-id="..." and data-fc-title="..."
     • Top progress bar container: <div data-lesson-progress></div>
     • Right panel container:     <div data-lesson-rightpanel></div>

   This script does NOT replace app.js's #markComplete handler.
   It only gates it via capture-phase click interception.
   ============================================================ */
(function () {
  "use strict";

  const XP_PER_LESSON = 10;

  // Card type taxonomy. Type is inferred from existing classes/IDs
  // (so existing lesson HTML doesn't need to change), but lessons can
  // override by adding data-fc-type="..." to a <section>.
  const TYPE_LABELS = {
    intro:    "Inicio",
    theory:   "Teoría",
    practice: "Práctica",
    reto:     "Reto",
    summary:  "Resumen"
  };
  function inferCardType(sec) {
    if (sec.hasAttribute("data-fc-type")) return sec.getAttribute("data-fc-type");
    if (sec.classList.contains("fc-summary") || sec.getAttribute("data-fc-summary") === "true") return "summary";
    if (sec.classList.contains("fc-reto")) return "reto";
    const id = sec.getAttribute("data-fc-id") || "";
    if (id === "intro" || id === "bienvenida" || id.startsWith("welcome")) return "intro";
    if (/pract|exercise|drill|build|arma/i.test(id)) return "practice";
    return "theory";
  }

  // Track which sections the user has marked Listo this page-view.
  // Resets on reload; the only persistent state is the lesson-done flag
  // in Progress (set by app.js when the user clicks #markComplete).
  const sectionsDone = new Set();
  let lessonId = "";

  // Step (wizard) mode state. When enabled, only the .is-current
  // flashcard is shown; Atrás/Continuar navigate one card at a time.
  let currentIndex = 0;
  let stepModeEnabled = false;
  let lastDirection = "next"; // "next" or "back" — drives card enter animation

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getSections() {
    return $$(".flashcard[data-fc-id]");
  }
  function totalSections() { return getSections().length; }

  // ---------------------------------------------------------------
  // PROGRESS BAR
  // ---------------------------------------------------------------
  function renderProgressBar() {
    const target = $("[data-lesson-progress]");
    if (!target) return;
    target.classList.add("lesson-progress");
    target.innerHTML = `
      <div class="lesson-progress-row">
        <span class="label"><span data-lp-step-label>Paso</span> <span data-lp-step>1</span> de <span data-lp-total>0</span></span>
        <span class="pct"><span data-lp-pct>0</span>%</span>
      </div>
      <div class="lesson-progress-bar">
        <div class="lesson-progress-fill" data-lp-fill></div>
      </div>
    `;
  }
  function updateProgressBar() {
    const total = totalSections();
    const done = sectionsDone.size;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const stepEl = $("[data-lp-step]");
    const totalEl = $("[data-lp-total]");
    const pctEl = $("[data-lp-pct]");
    const fillEl = $("[data-lp-fill]");
    // In step mode, the leading number is "current step". Otherwise
    // it's "sections done so far" (kept for non-stepper lessons).
    if (stepEl) stepEl.textContent = stepModeEnabled ? (currentIndex + 1) : done;
    if (totalEl) totalEl.textContent = total;
    if (pctEl) pctEl.textContent = pct;
    if (fillEl) fillEl.style.width = pct + "%";
  }

  // ---------------------------------------------------------------
  // RIGHT PANEL
  // ---------------------------------------------------------------
  function findNextStepAfter(currentId) {
    const data = (window.ExpresateLessons && window.ExpresateLessons.modules) || [];
    let found = false;
    for (const mod of data) {
      for (const step of mod.steps || []) {
        if (found) return { step, mod };
        if (step.id === currentId) found = true;
      }
    }
    return null;
  }

  function renderRightPanel() {
    const target = $("[data-lesson-rightpanel]");
    if (!target) return;

    // Lesson title/subtitle pulled from data/lessons.js so the HUD shows
    // the canonical course-route name (not whatever this HTML <h1> uses).
    const modules = (window.ExpresateLessons && window.ExpresateLessons.modules) || [];
    let lessonTitle = "";
    let lessonSub = "";
    for (const mod of modules) {
      for (const step of mod.steps || []) {
        if (step.id === lessonId) {
          lessonTitle = step.title || "";
          lessonSub = step.subtitle || "";
        }
      }
    }

    const sections = getSections();
    const total = sections.length;

    const timelineHtml = sections.map((sec) => {
      const id = sec.getAttribute("data-fc-id") || "";
      const title = sec.getAttribute("data-fc-title")
        || (sec.querySelector(".fc-title") && sec.querySelector(".fc-title").textContent.trim())
        || id;
      return `<div class="lesson-timeline-step" data-lesson-check="${esc(id)}"><span>${esc(title)}</span></div>`;
    }).join("");

    const next = findNextStepAfter(lessonId);
    const lessonDone = window.Progress && Progress.isLessonDone(lessonId);
    let nextHtml = "";
    if (next) {
      const href = next.step.type === "quiz" ? "curso.html" : (next.step.href || "curso.html");
      const sub = next.step.subtitle || (next.step.type === "quiz" ? "Confirma lo aprendido" : "");
      const lockedClass = lessonDone ? "" : "locked";
      // Wrap in a proper card so the HUD's reward + next read like a pair.
      nextHtml = `
        <a class="lesson-hud-next-card ${lockedClass}" href="${esc(href)}">
          <div class="lesson-hud-label">Siguiente</div>
          <div class="lesson-hud-next-title">${esc(next.step.title)}</div>
          ${sub ? `<div class="lesson-hud-next-sub">${esc(sub)}</div>` : ""}
        </a>
      `;
    }

    target.innerHTML = `
      <div class="lesson-hud">
        <div class="lesson-hud-header">
          <div class="lesson-hud-label">Lección actual</div>
          <div class="lesson-hud-title">${esc(lessonTitle || "Lección")}</div>
          ${lessonSub ? `<div class="lesson-hud-sub">${esc(lessonSub)}</div>` : ""}
          <div class="lesson-hud-step"><span data-hud-step>1</span><span class="of"> de ${total}</span></div>
          <div class="lesson-hud-bar"><div class="lesson-hud-bar-fill" data-hud-fill></div></div>
        </div>
        <div class="lesson-hud-divider"></div>
        <div class="lesson-timeline" data-lesson-checklist>${timelineHtml}</div>
        <div class="lesson-hud-divider"></div>
        <div class="lesson-hud-reward">
          <div class="lesson-hud-label">Al completar</div>
          <div class="lesson-hud-xp">${XP_PER_LESSON}</div>
        </div>
        ${nextHtml}
      </div>
    `;
  }

  function updateRightPanel() {
    const total = totalSections();
    const done = sectionsDone.size;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    // Modern HUD elements
    const stepEl = $("[data-hud-step]");
    const fillEl = $("[data-hud-fill]");
    if (stepEl) stepEl.textContent = stepModeEnabled ? (currentIndex + 1) : done;
    if (fillEl) fillEl.style.width = pct + "%";

    // Backward-compat with any older lessons that still use [data-lesson-pct]
    const pctEl = $("[data-lesson-pct]");
    if (pctEl) pctEl.textContent = pct;

    const cards = getSections();
    const currentId = stepModeEnabled
      ? (cards[currentIndex] && cards[currentIndex].getAttribute("data-fc-id"))
      : null;

    $$("[data-lesson-check]").forEach((el) => {
      const id = el.getAttribute("data-lesson-check");
      const isDone = sectionsDone.has(id);
      const isCurrent = currentId === id;
      // .is-current overrides done visually so the user always sees
      // "you're here" even if they navigated Atrás to a completed step.
      el.classList.toggle("is-done", isDone && !isCurrent);
      el.classList.toggle("is-current", isCurrent);
      // Keep the old .done class working too for non-step lessons.
      el.classList.toggle("done", isDone && !isCurrent);
    });

    // Drive the timeline's green progress line via a CSS variable.
    // The fill reaches the bottom of the last completed step's dot.
    const timelineEl = $(".lesson-timeline");
    if (timelineEl) {
      const stepEls = $$(".lesson-timeline-step");
      let lastDoneIdx = -1;
      stepEls.forEach((el, idx) => {
        const id = el.getAttribute("data-lesson-check");
        if (sectionsDone.has(id)) lastDoneIdx = idx;
      });
      const fillPct = stepEls.length > 0
        ? ((lastDoneIdx + 1) / stepEls.length) * 100
        : 0;
      timelineEl.style.setProperty("--timeline-fill", fillPct + "%");
    }
  }

  // ---------------------------------------------------------------
  // SECTION DONE
  // ---------------------------------------------------------------
  function markSectionDone(id, opts) {
    if (!id || sectionsDone.has(id)) return;
    sectionsDone.add(id);
    const sec = document.querySelector(`.flashcard[data-fc-id="${CSS.escape(id)}"]`);
    if (sec) {
      sec.classList.add("fc-done");
      // Note: .fc-status is hidden by the modern polish layer, so we don't
      // write "Listo" into it. The card's left rail + green num already say it.
      // Subtle pop animation, auto-cleans up so it can re-fire later
      sec.classList.add("fc-just-done");
      setTimeout(() => sec.classList.remove("fc-just-done"), 700);
    }
    updateProgressBar();
    updateRightPanel();
    updateMarkCompleteGate();
    updateMarkCompleteVisibility();

    // Optional: scroll the user to the next undone section (gentle nudge).
    // Only used in stacked (non-step) mode; in step mode showCard scrolls.
    if (opts && opts.scrollNext) {
      const next = getSections().find((s) => !sectionsDone.has(s.getAttribute("data-fc-id")));
      if (next) {
        setTimeout(() => next.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
      }
    }
  }

  function setupListoButtons() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-fc-listo]");
      if (!btn) return;
      const sec = btn.closest(".flashcard[data-fc-id]");
      if (!sec) return;
      const id = sec.getAttribute("data-fc-id");

      if (stepModeEnabled) {
        // Step mode: mark this card done, then move to the next one.
        // (showCard handles the scroll; no scrollNext nudge needed.)
        btn.disabled = true;
        markSectionDone(id);
        await showLesson000Feedback(sec);
        btn.disabled = false;
        advanceCard();
      } else {
        // Stacked mode: keep the old "scroll to next undone" nudge.
        markSectionDone(id, { scrollNext: true });
      }
    });
  }

  // ---------------------------------------------------------------
  // STEP MODE — one flashcard at a time (wizard).
  // Activated when 2+ sections exist. The body gets
  // .lesson-step-mode so the CSS hides non-current cards.
  // Each non-first card gets an injected "← Atrás" button.
  // The Mini Reto card gets its Listo button hidden — correct
  // answer is the only path forward (the bottom markComplete then
  // reveals via updateMarkCompleteVisibility).
  // ---------------------------------------------------------------
  function setupStepMode() {
    const cards = getSections();
    if (cards.length < 2) return;
    stepModeEnabled = true;
    document.body.classList.add("lesson-step-mode");

    cards.forEach((sec, i) => {
      const foot = sec.querySelector(".fc-foot");
      if (!foot) return;
      // Idempotent: don't double-inject if setupStepMode runs twice.
      if (foot.querySelector("[data-fc-back]")) return;

      const back = document.createElement("button");
      back.className = "btn fc-back";
      back.type = "button";
      back.setAttribute("data-fc-back", "");
      back.innerHTML = "← Atrás";
      if (i === 0) back.hidden = true;
      // Prepend so Atrás is on the left; existing Continuar stays on the right.
      foot.insertBefore(back, foot.firstChild);

      // Rename the Listo button to "Continuar →" everywhere for a friendlier flow.
      const listo = foot.querySelector("[data-fc-listo]");
      if (listo) listo.innerHTML = "Continuar →";

      // Mini Reto: hide Continuar initially — the reto handler reveals it
      // only after the user's first correct answer.  No auto-advance; the
      // learner clicks Continuar when they are ready to move on.
      // Summary card: same treatment — bottom markComplete is the next action.
      const isReto = sec.classList.contains("fc-reto");
      const isSummary = sec.getAttribute("data-fc-summary") === "true";
      if ((isReto || isSummary) && listo) {
        listo.style.display = "none";
      }

      // Inject the Consejo de Exprésate bubble from data-fc-tip="..."
      const tip = sec.getAttribute("data-fc-tip");
      if (tip) {
        const body = sec.querySelector(".fc-body");
        if (body && !body.querySelector(".fc-tip")) {
          const tipEl = document.createElement("div");
          tipEl.className = "fc-tip";
          tipEl.innerHTML =
            `<div><span class="fc-tip-label">Consejo de Exprésate</span>${esc(tip)}</div>`;
          body.appendChild(tipEl);
        }
      }

      // Inject the visual upgrade meta row (badge + step indicator + XP preview)
      // and tag the section with its type class. Idempotent.
      if (!sec.querySelector(":scope > .fc-meta")) {
        const type = inferCardType(sec);
        sec.classList.add("fc-type-" + type);
        const label = TYPE_LABELS[type] || "Lección";
        const meta = document.createElement("div");
        meta.className = "fc-meta";
        meta.innerHTML = `
          <span class="fc-badge">${esc(label)}</span>
          <span class="fc-step-indicator">Paso ${i + 1} / ${cards.length}</span>
          <span class="fc-xp-preview">+${XP_PER_LESSON} XP</span>
        `;
        sec.insertBefore(meta, sec.firstChild);
      }
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-fc-back]");
      if (!btn) return;
      goBack();
    });

    showCard(0);
  }

  function showCard(i, direction) {
    const cards = getSections();
    if (cards.length === 0) return;
    const dir = direction === "back" ? "back" : "next";
    lastDirection = dir;
    currentIndex = Math.max(0, Math.min(i, cards.length - 1));
    cards.forEach((sec, idx) => {
      const isCurrent = idx === currentIndex;
      sec.classList.toggle("is-current", isCurrent);
      // Reset direction classes so the animation re-fires reliably
      sec.classList.remove("from-next", "from-back");
      if (isCurrent) {
        // Force reflow so the animation restarts on the same card if needed
        // eslint-disable-next-line no-unused-expressions
        sec.offsetWidth;
        sec.classList.add("from-" + dir);
      }
    });
    updateProgressBar();
    updateRightPanel();
    // Bring the new card under the topbar so it feels like a real "step".
    const active = cards[currentIndex];
    if (active) {
      const fixedLesson000 = lessonId === "lesson-000-alphabet" &&
        window.matchMedia &&
        window.matchMedia("(min-width: 761px)").matches;
      if (fixedLesson000) return;
      const top = active.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }
  function advanceCard() {
    if (currentIndex < totalSections() - 1) showCard(currentIndex + 1, "next");
  }
  function goBack() {
    if (currentIndex > 0) showCard(currentIndex - 1, "back");
  }

  function showLesson000Feedback(sec) {
    if (lessonId !== "lesson-000-alphabet") return Promise.resolve();
    if (!sec || sec.getAttribute("data-fc-summary") === "true") return Promise.resolve();

    let sheet = document.querySelector("[data-lesson-session-feedback]");
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.className = "lesson-session-feedback";
      sheet.setAttribute("data-lesson-session-feedback", "");
      sheet.setAttribute("role", "status");
      sheet.setAttribute("aria-live", "polite");
      document.body.appendChild(sheet);
    }

    const isReto = sec.classList.contains("fc-reto");
    sheet.innerHTML = `
      <div class="lesson-session-feedback-card">
        <span class="lesson-session-feedback-mark">✓</span>
        <strong>${isReto ? "¡Bien hecho!" : "¡Buen paso!"}</strong>
        <span>${isReto ? "Escuchaste la letra y elegiste la respuesta." : "Sigue con la siguiente parte de la lección."}</span>
      </div>
    `;
    sheet.classList.add("is-visible");

    const reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 120 : 650;

    return new Promise((resolve) => {
      setTimeout(() => {
        sheet.classList.remove("is-visible");
        resolve();
      }, delay);
    });
  }

  // ---------------------------------------------------------------
  // MARK COMPLETE VISIBILITY — show the bottom CTA only after the
  // FINAL flashcard is done (in lesson-000 that's the Mini Reto).
  // Also revealed when the lesson is already done in Progress, so a
  // returning learner can re-toggle if they want.
  // ---------------------------------------------------------------
  function revealMarkComplete() {
    const btn = document.getElementById("markComplete");
    if (btn) btn.classList.remove("lesson-complete-hidden");
  }
  function hideMarkComplete() {
    const btn = document.getElementById("markComplete");
    if (btn) btn.classList.add("lesson-complete-hidden");
  }
  function updateMarkCompleteVisibility() {
    const cards = getSections();
    if (cards.length === 0) return;
    // The "gating" card is the last non-summary section. A summary card
    // is celebration-only and shouldn't gate the markComplete reveal.
    let gating = null;
    for (let i = cards.length - 1; i >= 0; i--) {
      if (cards[i].getAttribute("data-fc-summary") !== "true") {
        gating = cards[i];
        break;
      }
    }
    const gatingId = gating && gating.getAttribute("data-fc-id");
    const gatingDone = gatingId && sectionsDone.has(gatingId);
    const lessonDone = window.Progress && Progress.isLessonDone(lessonId);
    if (gatingDone || lessonDone) revealMarkComplete();
    else hideMarkComplete();
  }

  // ---------------------------------------------------------------
  // MARK COMPLETE GATE
  // The main #markComplete click is owned by app.js. We intercept in
  // the capture phase and block it if not all content sections are Listo.
  //
  // NOTE: Summary cards (data-fc-summary="true") are excluded from the
  // count — they are celebration-only and have no Listo button, so they
  // never enter sectionsDone. This mirrors updateMarkCompleteVisibility()
  // which already uses the same "last non-summary section" gating logic.
  // Without this exclusion the gate is never lifted when the final card
  // is a summary, keeping aria-disabled="true" and silently eating clicks.
  // ---------------------------------------------------------------
  function updateMarkCompleteGate() {
    const btn = document.getElementById("markComplete");
    if (!btn) return;

    // Only count sections that actually have a Listo/Continuar button.
    const contentSections = getSections().filter(
      (s) => s.getAttribute("data-fc-summary") !== "true"
    );
    const total   = contentSections.length;
    const allDone = total > 0 && contentSections.every(
      (s) => sectionsDone.has(s.getAttribute("data-fc-id"))
    );
    const lessonDone = window.Progress && Progress.isLessonDone(lessonId);

    // If lesson already done, the button stays active (so user can re-toggle).
    // Otherwise, gate it.
    if (lessonDone || allDone) {
      btn.removeAttribute("aria-disabled");
    } else {
      btn.setAttribute("aria-disabled", "true");
    }

    const hint = document.getElementById("lessonStatus");
    if (hint && !lessonDone) {
      const buttonHidden = btn.classList.contains("lesson-complete-hidden");
      // In step mode the top progress bar + visible primary button already
      // tell the user where they are; the hint just adds noise. We only
      // surface the hint for the older stacked-lesson layout.
      if (buttonHidden || stepModeEnabled) {
        hint.textContent = "";
      } else if (allDone) {
        hint.textContent = "¡Todo listo! Marca la lección como completada para ganar tu XP.";
        hint.classList.add("lesson-hint");
      } else {
        const doneSections = contentSections.filter(
          (s) => sectionsDone.has(s.getAttribute("data-fc-id"))
        ).length;
        const remaining = total - doneSections;
        hint.textContent = `Te faltan ${remaining} ${remaining === 1 ? "paso" : "pasos"} para completar la lección.`;
        hint.classList.add("lesson-hint");
      }
    }
  }
  function installCompleteGate() {
    const btn = document.getElementById("markComplete");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      if (btn.getAttribute("aria-disabled") === "true") {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true); // capture phase — runs before app.js's bubble-phase handler
  }

  // ---------------------------------------------------------------
  // MINI RETO — challenge card.
  //
  // Two reto types are supported. The HTML opts in via:
  //   data-reto-type="audio-letter"    (default — used by lesson-000)
  //   data-reto-type="multiple-choice" (text Q + 3 buttons w/ data-reto-correct)
  //
  // Both mark the section done on the first correct answer and then reveal
  // the Continuar button — the learner decides when to move on. No auto-advance.
  // ---------------------------------------------------------------
  function setupMiniReto() {
    const reto = document.querySelector(".flashcard.fc-reto");
    if (!reto) return;
    const type = reto.getAttribute("data-reto-type") || "audio-letter";
    if (type === "multiple-choice") {
      setupMultipleChoiceReto(reto);
    } else {
      setupAudioLetterReto(reto);
    }
  }

  function setupMultipleChoiceReto(reto) {
    const optsEl = reto.querySelector("[data-reto-options]");
    const feedbackEl = reto.querySelector("[data-reto-feedback]");
    if (!optsEl || !feedbackEl) return;

    let answered = false;

    optsEl.addEventListener("click", (e) => {
      const opt = e.target.closest("button, [data-reto-option]");
      if (!opt || answered) return;
      const isCorrect = opt.hasAttribute("data-reto-correct");
      if (isCorrect) {
        opt.classList.add("right");
        optsEl.querySelectorAll("button").forEach((b) => b.classList.add("disabled"));
        feedbackEl.textContent = "✅ ¡Correcto!";
        feedbackEl.classList.add("ok");
        feedbackEl.classList.remove("bad");
        answered = true;
        markSectionDone(reto.getAttribute("data-fc-id"));
        // Reveal Continuar so the user decides when to move on.
        // No auto-advance — the learner clicks when ready.
        const listoBtn = reto.querySelector("[data-fc-listo]");
        if (listoBtn) listoBtn.style.display = "";
      } else {
        opt.classList.add("wrong");
        feedbackEl.textContent = "❌ Intenta otra vez.";
        feedbackEl.classList.add("bad");
        feedbackEl.classList.remove("ok");
        setTimeout(() => opt.classList.remove("wrong"), 420);
      }
    });
  }

  function setupAudioLetterReto(reto) {
    const pool = (reto.getAttribute("data-reto-pool") || "abcdefghijklmnopqrstuvwxyz").split("");
    const audioBase = reto.getAttribute("data-reto-audio-base") || "audio/alphabet/";
    const playBtn   = reto.querySelector("[data-reto-play]");
    const optsEl    = reto.querySelector("[data-reto-options]");
    const feedbackEl = reto.querySelector("[data-reto-feedback]");
    const retryBtn  = reto.querySelector("[data-reto-retry]");
    // Score-counter elements injected in the HTML (hidden until first answer).
    const scoreEl         = reto.querySelector("[data-reto-score]");
    const correctCountEl  = reto.querySelector("[data-reto-correct-count]");
    const attemptsEl      = reto.querySelector("[data-reto-attempts]");
    if (!playBtn || !optsEl || !feedbackEl) return;

    const player = new Audio();
    player.preload = "auto";

    let correctLetter  = "";
    let answered       = false;
    // Running totals — never reset across rounds.
    let attempts       = 0;
    let correctCount   = 0;
    // True once the first correct answer marks the section done.
    let sectionMarkedDone = false;

    // ------------------------------------------------------------------
    // Score display helper
    // ------------------------------------------------------------------
    function updateScore() {
      if (!scoreEl) return;
      scoreEl.hidden = (attempts === 0);
      if (correctCountEl) correctCountEl.textContent = correctCount;
      if (attemptsEl)     attemptsEl.textContent     = attempts;
    }

    // ------------------------------------------------------------------
    // Round setup — picks a new target letter and two random distractors.
    // Scoring state is intentionally preserved across rounds.
    // ------------------------------------------------------------------
    function pickRound() {
      correctLetter = pool[Math.floor(Math.random() * pool.length)];
      const distractors = [];
      while (distractors.length < 2) {
        const cand = pool[Math.floor(Math.random() * pool.length)];
        if (cand !== correctLetter && !distractors.includes(cand)) distractors.push(cand);
      }
      const options = [correctLetter, ...distractors].sort(() => Math.random() - 0.5);

      optsEl.innerHTML = options
        .map((l) => `<button type="button" class="fc-letter" data-reto-option="${esc(l)}">${esc(l.toUpperCase())}</button>`)
        .join("");

      // On first load show the play hint; after the first attempt just clear
      // the text so it doesn't compete with the score row.
      feedbackEl.textContent = attempts === 0
        ? "Toca ▶️ para escuchar, luego elige."
        : "";
      feedbackEl.classList.remove("ok", "bad");
      if (retryBtn) retryBtn.hidden = true;
      answered = false;
    }

    // ------------------------------------------------------------------
    // Audio playback
    // ------------------------------------------------------------------
    function play() {
      const src = audioBase + correctLetter + ".mp3";
      try {
        player.pause();
        player.currentTime = 0;
        player.src = src;
        player.play().catch((err) => console.error("[reto] audio failed", src, err));
      } catch (err) {
        console.error("[reto] audio error", err);
      }
    }

    // ------------------------------------------------------------------
    // Event listeners
    // ------------------------------------------------------------------
    playBtn.addEventListener("click", play);

    // "Otra ronda" — pick fresh letters, auto-play so the user can start
    // listening immediately without an extra click.
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        pickRound();
        play();
      });
    }

    optsEl.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-reto-option]");
      if (!opt || answered) return;

      const guess = opt.getAttribute("data-reto-option");
      attempts++;

      if (guess === correctLetter) {
        correctCount++;
        opt.classList.add("right");
        optsEl.querySelectorAll(".fc-letter").forEach((b) => b.classList.add("disabled"));
        feedbackEl.textContent = `✅ Correcto — era la ${correctLetter.toUpperCase()}.`;
        feedbackEl.classList.add("ok");
        feedbackEl.classList.remove("bad");
        if (retryBtn) retryBtn.hidden = false;
        answered = true;
        updateScore();

        // Gate: mark section done only on the FIRST correct answer.
        // This unlocks the Continuar button and updates the progress bar.
        // Subsequent correct rounds do not re-fire it (idempotent by design,
        // but we guard here to avoid redundant panel re-renders).
        if (!sectionMarkedDone) {
          sectionMarkedDone = true;
          markSectionDone(reto.getAttribute("data-fc-id"));
          // Reveal Continuar — user decides when to leave the reto card.
          // No auto-advance.
          const listoBtn = reto.querySelector("[data-fc-listo]");
          if (listoBtn) listoBtn.style.display = "";
        }

      } else {
        opt.classList.add("wrong");
        feedbackEl.textContent = "❌ Intenta otra vez.";
        feedbackEl.classList.add("bad");
        feedbackEl.classList.remove("ok");
        updateScore();
        // Flash the wrong state briefly, then restore so the user can
        // pick a different option in the same round.
        setTimeout(() => opt.classList.remove("wrong"), 420);
      }
    });

    pickRound();
  }

  // ---------------------------------------------------------------
  // NAME SPELLER
  // Turns a typed name into clickable letter tiles. Each generated tile
  // reuses the global .letter-btn + data-letter audio handler in app.js.
  // ---------------------------------------------------------------
  function setupNameSpellers() {
    $$("[data-name-speller]").forEach((wrap) => {
      const input = wrap.querySelector("[data-name-input]");
      const output = wrap.querySelector("[data-name-output]");
      const clear = wrap.querySelector("[data-name-clear]");
      if (!input || !output) return;

      const render = () => {
        const raw = input.value || "";
        const letters = Array.from(raw.toUpperCase()).filter((ch) => /[A-Z]/.test(ch));

        if (letters.length === 0) {
          output.innerHTML = `<span class="small">Escribe arriba para ver tus letras.</span>`;
          return;
        }

        output.innerHTML = letters.map((letter) => `
          <button class="fc-letter letter-btn name-letter" type="button" data-letter="${esc(letter.toLowerCase())}" aria-label="Escuchar letra ${esc(letter)}">
            ${esc(letter)}
          </button>
        `).join("");
      };

      input.addEventListener("input", render);
      clear?.addEventListener("click", () => {
        input.value = "";
        input.focus();
        render();
      });
      render();
    });
  }

  // ---------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------
  function init() {
    lessonId = document.body.dataset.lessonId || "";

    renderProgressBar();
    renderRightPanel();
    setupListoButtons();
    setupNameSpellers();
    setupMiniReto();
    installCompleteGate();
    setupStepMode();
    hideMarkComplete(); // start hidden; revealed by updateMarkCompleteVisibility

    // If the lesson is already marked done in Progress, pre-fill every
    // section and show the markComplete button so the user can re-toggle.
    if (window.Progress && Progress.isLessonDone(lessonId)) {
      getSections().forEach((sec) => markSectionDone(sec.getAttribute("data-fc-id")));
      revealMarkComplete();
    } else {
      updateProgressBar();
      updateRightPanel();
      updateMarkCompleteGate();
      updateMarkCompleteVisibility();
    }

    // Keep things fresh if Progress changes (cross-tab, or app.js toggle).
    if (window.Progress && Progress.on) {
      Progress.on("change", () => {
        const nowDone = Progress.isLessonDone(lessonId);
        const btn = document.getElementById("markComplete");
        if (nowDone) {
          getSections().forEach((sec) => markSectionDone(sec.getAttribute("data-fc-id")));
          revealMarkComplete();
          // Once the user has actually claimed the lesson, drop the pulse.
          if (btn) btn.classList.add("lesson-mc-claimed");
        } else if (btn) {
          btn.classList.remove("lesson-mc-claimed");
        }
        updateMarkCompleteGate();
        updateMarkCompleteVisibility();
        // Re-render right panel so the "Siguiente" CTA can light up
        renderRightPanel();
        updateRightPanel();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
