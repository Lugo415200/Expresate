/******************************
 * curso.js — Course route, locks, quizzes
 *
 * Progress is stored by progress.js (window.Progress).
 * Load order on curso.html: progress.js -> curso.js -> app.js.
 ******************************/

// Animation state — tracks XP and completion so we can fire one-shot CSS
// animations only when values actually change (not on every re-render).
let   _lastRenderedXP;          // undefined until first render
const _doneStepsBefore = new Set(); // step ids that were already .isDone

// Thin wrappers so the existing code below reads cleanly. They all
// delegate to the unified Progress API.
function isQuizPassed(quizId) {
  return Progress.isQuizPassed(quizId);
}
function setQuizPassed(quizId, passed, score, total) {
  Progress.setQuizPassed(quizId, !!passed, score, total);
}
function isLessonDone(lessonId) {
  return Progress.isLessonDone(lessonId);
}
function setLessonDone(lessonId, done = true) {
  Progress.setLessonDone(lessonId, !!done);
}

/** ---------------------------
 * Quiz + lesson data
 *
 * Quiz content lives in data/quizzes.js (window.ExpresateQuizzes).
 * Lesson/module structure lives in data/lessons.js (window.ExpresateLessons).
 * Both are loaded as plain scripts BEFORE curso.js.
 *
 * Reading via a getter (not a const at load time) means hot-reload-friendly
 * and we don't crash if a page accidentally forgets to include the data.
 ----------------------------*/
function getQuizzes() {
  return (window.ExpresateQuizzes && typeof window.ExpresateQuizzes === "object")
    ? window.ExpresateQuizzes
    : {};
}

function getLessons() {
  return (window.ExpresateLessons && typeof window.ExpresateLessons === "object")
    ? window.ExpresateLessons
    : { modules: [] };
}

/** ---------------------------
 * Render the course page from data
 *
 * Looks for <div id="modulesContainer"></div> in the page and fills it
 * with the module/step UI defined in data/lessons.js. If the container
 * isn't on the page (e.g. someone wired the static HTML by hand), this
 * is a no-op and applyLocks just operates on whatever HTML was authored.
 ----------------------------*/
function escAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escText(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderStep(step, isFirst, numbered, displayNumber) {
  const primary = isFirst ? " primary" : "";
  const requiresAttr = step.requires
    ? ` data-requires="${escAttr(step.requires)}"`
    : "";
  const premiumAttr = step.premium ? ` data-premium="true"` : "";

  if (numbered) {
    const subtitle = step.subtitle
      ? `<span class="stepSub">${escText(step.subtitle)}</span>`
      : "";
    const inner = `
      <span class="stepLeft">
        <span class="stepNum">${displayNumber}</span>
        <span class="stepText">
          <strong>${escText(step.title)}</strong>
          ${subtitle}
        </span>
      </span>
      <span class="stepStatus" data-status-for="${escAttr(step.id)}"></span>
    `;
    if (step.type === "lesson") {
      return `<a class="btn${primary} courseStep" href="${escAttr(step.href || "#")}" data-step-id="${escAttr(step.id)}"${requiresAttr}${premiumAttr}>${inner}</a>`;
    }
    if (step.type === "quiz") {
      return `<button class="btn${primary} courseStep" type="button" data-open-quiz="${escAttr(step.id)}" data-step-id="${escAttr(step.id)}"${requiresAttr}${premiumAttr}>${inner}</button>`;
    }
    return "";
  }

  // Plain style: simple labeled button, no step number
  if (step.type === "lesson") {
    return `<a class="btn${primary} courseStep" href="${escAttr(step.href || "#")}" data-step-id="${escAttr(step.id)}"${requiresAttr}${premiumAttr}>${escText(step.title)}</a>`;
  }
  if (step.type === "quiz") {
    return `<button class="btn${primary} courseStep" type="button" data-open-quiz="${escAttr(step.id)}" data-step-id="${escAttr(step.id)}"${requiresAttr}${premiumAttr}>${escText(step.title)}</button>`;
  }
  return "";
}

function renderModule(mod) {
  const lockAttr = mod.lockOnQuiz ? ` data-lock="${escAttr(mod.lockOnQuiz)}"` : "";
  const openAttr = mod.open ? " open" : "";
  const badge = mod.lockOnQuiz
    ? ` <span class="doneBadge" data-lock-badge="${escAttr(mod.lockOnQuiz)}">Bloqueado</span>`
    : "";
  const hint = mod.hint
    ? `<div class="small">${escText(mod.hint)}</div>`
    : "";
  // Always emit the hint when defined; gamify.css hides it unless the
  // module currently carries .module-is-locked (toggled by applyLocks).
  const lockedHint = mod.lockedHint
    ? `<p class="small module-locked-hint">${escText(mod.lockedHint)}</p>`
    : "";

  const isNumbered = mod.style === "numbered";
  const actionsStyle = isNumbered
    ? ' style="flex-direction:column; align-items:stretch; gap:10px;"'
    : "";

  const steps = Array.isArray(mod.steps) ? mod.steps : [];
  const stepsHtml = steps
    .map((step, i) => renderStep(step, i === 0, isNumbered, i + 1))
    .join("\n          ");

  // One hidden container per inline quiz step.
  const quizContainers = steps
    .filter((s) => s.type === "quiz")
    .map((s) => `<div id="${escAttr(s.id)}" style="display:none; margin-top:14px;"></div>`)
    .join("\n        ");

  return `
    <details class="block"${openAttr}${lockAttr}>
      <summary style="cursor:pointer; font-weight:700;">${escText(mod.title)}${badge}</summary>
      <div style="margin-top:12px;">
        ${hint}
        <div class="actions"${actionsStyle}>
          ${stepsHtml}
        </div>
        ${lockedHint}
        ${quizContainers}
      </div>
    </details>
  `;
}

function renderCourse() {
  const container = document.getElementById("modulesContainer");
  if (!container) return; // page wasn't migrated yet; leave hand-authored markup alone
  const data = getLessons();
  if (!data.modules || data.modules.length === 0) {
    container.innerHTML = `<p class="small">No se pudo cargar el curso. (Falta data/lessons.js)</p>`;
    return;
  }
  container.innerHTML = data.modules.map(renderModule).join("\n");
}

/** ---------------------------
 * Render quiz
 ----------------------------*/
function renderQuiz(container, quizId) {
  const quiz = getQuizzes()[quizId];
  if (!quiz) {
    container.innerHTML = `<p class="small">Quiz no encontrado: ${escText(quizId)}</p>`;
    return;
  }

  const alreadyPassed = isQuizPassed(quizId);

  container.innerHTML = `
    <div class="block" style="margin-top:0;">
      <h2 style="margin-top:0;">${quiz.title}</h2>
      <p class="small">Necesitas ${quiz.passingScore}/${quiz.questions.length} correctas para aprobar.</p>

      <form id="form-${quizId}">
        ${quiz.questions.map((q, qi) => `
          <div class="block">
            <p><strong>${qi + 1})</strong> ${q.prompt}</p>
            ${q.options.map((opt, oi) => `
              <label style="display:block; margin:6px 0;">
                <input type="radio" name="q${qi}" value="${oi}" ${alreadyPassed ? "disabled" : ""} />
                ${opt}
              </label>
            `).join("")}
          </div>
        `).join("")}

        <div class="actions">
          <button class="btn primary" type="submit" ${alreadyPassed ? "disabled" : ""}>Enviar</button>
          <button class="btn" type="button" data-reset="${quizId}">Reintentar</button>
        </div>

        <p class="small" id="result-${quizId}">${alreadyPassed ? "✅ Ya aprobaste este quiz." : ""}</p>
      </form>
    </div>
  `;

  const form = document.getElementById(`form-${quizId}`);
  const result = document.getElementById(`result-${quizId}`);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let score = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      const chosen = form.querySelector(`input[name="q${i}"]:checked`);
      if (!chosen) continue;
      if (Number(chosen.value) === quiz.questions[i].correctIndex) score++;
    }

    const passed = score >= quiz.passingScore;
    setQuizPassed(quizId, passed, score, quiz.questions.length);

    result.textContent = passed
      ? `✅ Aprobado. Puntaje: ${score}/${quiz.questions.length}.`
      : `❌ No aprobado. Puntaje: ${score}/${quiz.questions.length}. Intenta de nuevo.`;

    applyLocks();
    updateProgressUI();
  });
}

/** ---------------------------
 * Apply locks:
 * 1) Module locks via data-lock="quiz-000"
 * 2) Lesson progression via .courseStep + data-requires
 ----------------------------*/
function applyLocks() {
  // Resolve premium state once up-front — used in sections B, C, and D.
  const userIsPremium = window.Access ? Access.hasPremium() : false;

  // A) Module locks (your existing behavior)
  document.querySelectorAll("[data-lock]").forEach((module) => {
    const lockId = module.getAttribute("data-lock"); // expects a quizId like "quiz-000"
    const unlocked = isQuizPassed(lockId);

    const badge = module.querySelector(`[data-lock-badge="${lockId}"]`);
    if (badge) badge.textContent = unlocked ? "Desbloqueado ✅" : "Bloqueado";

    module.querySelectorAll(`[data-locked-link="${lockId}"]`).forEach((a) => {
      if (unlocked) {
        a.removeAttribute("aria-disabled");
        a.classList.remove("is-locked");
      } else {
        a.setAttribute("aria-disabled", "true");
        a.classList.add("is-locked");
      }
    });

    module.querySelectorAll(`[data-open-quiz]`).forEach((btn) => {
      btn.disabled = !unlocked;
    });

    // Toggle a class so gamify.css can show/hide the "Completa el Quiz..."
    // hint without re-rendering the module markup.
    module.classList.toggle("module-is-locked", !unlocked);

    if (!unlocked) module.open = false;
  });

  // B) Lesson steps progression (Module 0 route)
  document.querySelectorAll(".courseStep").forEach((el) => {
    const stepId = el.getAttribute("data-step-id");
    const requires = el.getAttribute("data-requires");

    // Step can be lesson or quiz
    const done =
      stepId?.startsWith("quiz-") ? isQuizPassed(stepId) : isLessonDone(stepId);

    const unlocked =
      !requires || (requires.startsWith("quiz-") ? isQuizPassed(requires) : isLessonDone(requires));

    // Status label — premium steps show "Premium" as the dominant state
    // for non-premium users, regardless of completion or unlock status.
    // Progress data is preserved; the label is purely display.
    const isPremiumStep = el.getAttribute("data-premium") === "true";
    if (stepId) {
      const statusEl = document.querySelector(`[data-status-for="${stepId}"]`);
      if (statusEl) {
        if (isPremiumStep && !userIsPremium) {
          statusEl.textContent = "Premium";
        } else if (done) {
          statusEl.textContent = "Completado";
        } else if (!unlocked) {
          statusEl.textContent = "Bloqueado";
        } else {
          statusEl.textContent = "Disponible";
        }
      }
    }

    // Classes for styling — suppress isDone on premium steps for non-premium
    // users so the green ✅ prefix doesn't compete with the Premium state.
    // The underlying progress record is unchanged.
    el.classList.toggle("isDone", !!done && (!isPremiumStep || userIsPremium));

    // Completion pop — animate .stepNum once when a step first becomes done.
    const isNowDone = el.classList.contains("isDone");
    if (stepId) {
      if (isNowDone && !_doneStepsBefore.has(stepId)) {
        const stepNum = el.querySelector(".stepNum");
        if (stepNum) {
          stepNum.classList.remove("step-complete-pop"); // reset if already there
          // Force reflow so removing+re-adding triggers the animation again
          void stepNum.offsetWidth;
          stepNum.classList.add("step-complete-pop");
          stepNum.addEventListener(
            "animationend",
            () => stepNum.classList.remove("step-complete-pop"),
            { once: true }
          );
        }
      }
      if (isNowDone) _doneStepsBefore.add(stepId);
      else           _doneStepsBefore.delete(stepId);
    }

    // Lock
    if (!unlocked) {
      el.classList.add("isLocked");
      el.setAttribute("aria-disabled", "true");
      if (el.tagName === "BUTTON") el.disabled = true;
    } else {
      el.classList.remove("isLocked");
      el.removeAttribute("aria-disabled");
      if (el.tagName === "BUTTON") el.disabled = false;
    }
  });

  // C) Mark the FIRST available step as .is-next so gamify.css can
  //    pulse it. "Available" = not done, not locked, not a premium-gated
  //    step for a non-premium user (premium steps never become the CTA).
  let nextFound = false;
  document.querySelectorAll(".courseStep").forEach((el) => {
    const isGatedPremium =
      el.getAttribute("data-premium") === "true" && !userIsPremium;
    const isAvailable =
      !el.classList.contains("isDone") &&
      !el.classList.contains("isLocked") &&
      !isGatedPremium;
    el.classList.toggle("is-next", isAvailable && !nextFound);
    if (isAvailable) nextFound = true;
  });

  // D) Premium locks — overlay on any step with data-premium="true"
  //    when the user is not premium. Shown regardless of quiz unlock state.
  document.querySelectorAll("[data-premium='true']").forEach((el) => {
    // Remove any existing overlay first (in case applyLocks runs again)
    const existing = el.querySelector(".premium-lock-overlay");
    if (existing) existing.remove();

    if (!userIsPremium) {
      // Prevent navigation / quiz opening
      el.setAttribute("aria-disabled", "true");
      if (el.tagName === "A") el.removeAttribute("href");
      if (el.tagName === "BUTTON") el.disabled = true;

      const overlay = document.createElement("span");
      overlay.className = "premium-lock-overlay";
      overlay.innerHTML = `<span class="lock-icon">🔒</span> Premium · <a class="btn small" href="pricing.html">Ver planes</a>`;
      el.appendChild(overlay);
    }
  });
}

/** ---------------------------
 * Progress UI (right panel)
 ----------------------------*/
function updateProgressUI() {
  // Legacy text-only progress, only fires if the old #progressText
  // element is still on the page. Kept for safety; the gamified
  // panel (renderProgressPanel) is the primary surface now.
  const quizzes = getQuizzes();
  const ids = Object.keys(quizzes);
  const totalQuizzes = ids.length;
  const passedCount = ids.filter(isQuizPassed).length;

  const el = document.getElementById("progressText");
  if (el) el.textContent = `Quizzes aprobados: ${passedCount}/${totalQuizzes}`;
}

/** ---------------------------
 * Find the first un-done, un-locked step the user can tackle right now.
 * Walks modules in declared order, respecting both module-level locks
 * and step-level requires. Returns { step, mod } or null when finished.
 ----------------------------*/
function findNextStep() {
  const data = getLessons();
  for (const mod of data.modules || []) {
    if (mod.lockOnQuiz && !isQuizPassed(mod.lockOnQuiz)) continue;
    for (const step of mod.steps || []) {
      const done = step.type === "quiz"
        ? isQuizPassed(step.id)
        : isLessonDone(step.id);
      if (done) continue;
      const reqMet = !step.requires ||
        (step.requires.startsWith("quiz-")
          ? isQuizPassed(step.requires)
          : isLessonDone(step.requires));
      if (!reqMet) continue;
      return { step, mod };
    }
  }
  return null;
}

/** ---------------------------
 * Render the gamified right panel: streak, total XP, daily-goal donut,
 * and a "Continuar →" CTA pointing at the next available step.
 ----------------------------*/
function renderProgressPanel() {
  const container = document.getElementById("progressPanel");
  if (!container) return;

  const streak = Progress.getStreak();
  const xp = Progress.getXP();
  const xpToday = Progress.getXPToday();
  const todayDone = Progress.isTodayActive();
  const dailyGoalCount = 1;
  const todayPct = todayDone ? 100 : 0;

  // SVG donut math
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - todayPct / 100);

  const next = findNextStep();

  let ctaHtml;
  if (!next) {
    ctaHtml = `
      <div class="cta-next cta-done">
        <span class="cta-label">¡Lo lograste!</span>
        <span class="cta-title">Curso completado 🎉</span>
        <span class="cta-sub">Has terminado todas las lecciones y quizzes.</span>
      </div>
    `;
  } else {
    const isQuiz = next.step.type === "quiz";
    // Quizzes open inline on curso.html — link there. Lessons link to
    // their own page (or fall back to curso.html if href missing).
    const href = isQuiz ? "curso.html" : (next.step.href || "curso.html");
    const ctaSub = next.step.subtitle
      || (isQuiz ? "Confirma lo aprendido" : "");
    ctaHtml = `
      <a class="cta-next" href="${escAttr(href)}">
        <span class="cta-label">Continuar →</span>
        <span class="cta-title">${escText(next.step.title)}</span>
        ${ctaSub ? `<span class="cta-sub">${escText(ctaSub)}</span>` : ""}
      </a>
    `;
  }

  const streakLabel = streak === 1 ? "día seguido" : "días seguidos";
  const xpTodayBit = xpToday > 0
    ? `+${xpToday} hoy`
    : "sin XP hoy";

  container.innerHTML = `
    <div class="gamify-stats">
      <div class="stat-card ${streak === 0 ? "streak-zero" : ""}">
        <div class="stat-icon fire">🔥</div>
        <div class="stat-text">
          <div class="stat-value">${streak}</div>
          <div class="stat-label">${streakLabel}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon xp">⭐</div>
        <div class="stat-text">
          <div class="stat-value" id="xp-stat-value">${xp}</div>
          <div class="stat-label">XP total · ${xpTodayBit}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon donut">
          <svg class="progress-donut" viewBox="0 0 44 44" aria-hidden="true">
            <circle class="bg" cx="22" cy="22" r="${radius}"></circle>
            <circle class="fg" cx="22" cy="22" r="${radius}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"></circle>
          </svg>
        </div>
        <div class="stat-text">
          <div class="stat-value">${todayDone ? "✓" : "0"}/${dailyGoalCount}</div>
          <div class="stat-label">Meta de hoy</div>
        </div>
      </div>
    </div>

    ${ctaHtml}

    <p class="gamify-rule">Sigue paso a paso. Cada lección suma XP y mantiene tu racha.</p>
  `;

  // XP pop — fire the spring animation only when XP actually increased
  // (not on the initial render, which would feel noisy).
  if (typeof _lastRenderedXP !== "undefined" && xp > _lastRenderedXP) {
    const xpEl = container.querySelector("#xp-stat-value");
    if (xpEl) {
      xpEl.classList.remove("xp-value-pop");
      void xpEl.offsetWidth; // force reflow to restart animation
      xpEl.classList.add("xp-value-pop");
      xpEl.addEventListener(
        "animationend",
        () => xpEl.classList.remove("xp-value-pop"),
        { once: true }
      );
    }
  }
  _lastRenderedXP = xp;
}

/** ---------------------------
 * Click handlers
 ----------------------------*/
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-open-quiz]");
  if (!btn) return;

  // If locked by aria-disabled, ignore
  if (btn.getAttribute("aria-disabled") === "true") return;

  const quizId = btn.getAttribute("data-open-quiz");
  const container = document.getElementById(quizId);
  if (!container) return;

  container.style.display = container.style.display === "none" ? "block" : "none";
  if (container.innerHTML.trim() === "") renderQuiz(container, quizId);
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-reset]");
  if (!btn) return;

  const quizId = btn.getAttribute("data-reset");
  Progress.reset(quizId);

  const container = document.getElementById(quizId);
  if (container) {
    container.innerHTML = "";
    container.style.display = "block";
    renderQuiz(container, quizId);
  }

  applyLocks();
  updateProgressUI();
});

/** ---------------------------
 * Accept completion from lessons:
 * curso.html?complete=lesson-000-alphabet
 ----------------------------*/
(function handleCompleteFromQuery() {
  const params = new URLSearchParams(location.search);
  const lessonId = params.get("complete");
  if (!lessonId) return;

  setLessonDone(lessonId, true);

  params.delete("complete");
  const newUrl = `${location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
  history.replaceState({}, "", newUrl);
})();

document.addEventListener("DOMContentLoaded", () => {
  // Build the module/step UI from data/lessons.js first, so applyLocks
  // has the right elements (.courseStep, [data-lock], etc.) to operate on.
  renderCourse();
  applyLocks();
  updateProgressUI();
  renderProgressPanel();

  // Re-apply locks once Access.ready() resolves so premium state is
  // accurate (not just a guess from before getSession() completes).
  (window.Access ? Access.ready() : Promise.resolve()).then(() => {
    applyLocks();
    renderProgressPanel();
  });

  // If progress changes (another tab, returning from a lesson page),
  // re-render locks + the gamified panel. The module DOM is unchanged,
  // so we don't re-render the modules — just refresh state.
  Progress.on("change", () => {
    applyLocks();
    updateProgressUI();
    renderProgressPanel();
  });
});
