/******************************
 * curso.js — Unified Progress
 ******************************/

const COURSE_KEY = "ynoel_course_progress_v1";

/** ---------------------------
 * Storage
 * data shape:
 * {
 *   "quiz-000": { passed: true, ts: 123 },
 *   "lesson-000-alphabet": { done: true, ts: 123 },
 *   "lesson-001-sounds": { done: true, ts: 123 },
 *   "lesson-000-syllables": { done: true, ts: 123 }
 * }
 ----------------------------*/
function loadCourse() {
  try {
    return JSON.parse(localStorage.getItem(COURSE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCourse(data) {
  localStorage.setItem(COURSE_KEY, JSON.stringify(data));
}

/** ---------------------------
 * Quiz helpers
 ----------------------------*/
function setQuizPassed(quizId, passed) {
  const data = loadCourse();
  data[quizId] = { passed: !!passed, ts: Date.now() };
  saveCourse(data);
}

function isQuizPassed(quizId) {
  const data = loadCourse();
  return !!data?.[quizId]?.passed;
}

/** ---------------------------
 * Lesson completion helpers
 ----------------------------*/
function setLessonDone(lessonId, done = true) {
  const data = loadCourse();
  data[lessonId] = { ...(data[lessonId] || {}), done: !!done, ts: Date.now() };
  saveCourse(data);
}

function isLessonDone(lessonId) {
  const data = loadCourse();
  return !!data?.[lessonId]?.done;
}

/** ---------------------------
 * Quizzes
 ----------------------------*/
const QUIZZES = {
  "quiz-000": {
    title: "Quiz 000 — Alfabeto (básico)",
    passingScore: 3,
    questions: [
      { prompt: "¿Cuál letra es la primera del alfabeto?", options: ["A", "E", "I"], correctIndex: 0 },
      { prompt: "¿Cuántas letras tiene el alfabeto en inglés?", options: ["26", "27", "25"], correctIndex: 0 },
      { prompt: "Selecciona una vocal:", options: ["B", "A", "T"], correctIndex: 1 },
      { prompt: "¿Cuál es una consonante?", options: ["O", "U", "M"], correctIndex: 2 }
    ]
  },

  "quiz-001": {
    title: "Quiz 001 — Pronombres + Verbos",
    passingScore: 3,
    questions: [
      { prompt: "Traduce: Yo trabajo.", options: ["I work.", "He works.", "I worked."], correctIndex: 0 },
      { prompt: "Traduce: Él trabaja.", options: ["He work.", "He works.", "He working."], correctIndex: 1 },
      { prompt: "Completa: She ____ here.", options: ["live", "lives", "living"], correctIndex: 1 }
    ]
  },

  "quiz-003": {
    title: "Quiz 003 — Negaciones (Don't/Doesn't)",
    passingScore: 3,
    questions: [
      { prompt: "Traduce: Yo no trabajo.", options: ["I don't work.", "I doesn't work.", "I not work."], correctIndex: 0 },
      { prompt: "Traduce: Ella no vive aquí.", options: ["She don't live here.", "She doesn't live here.", "She doesn't lives here."], correctIndex: 1 },
      { prompt: "Completa: He ____ study English.", options: ["don't", "doesn't", "isn't"], correctIndex: 1 },
      { prompt: "Selecciona la opción correcta:", options: ["They don't work here.", "They doesn't work here.", "They not work here."], correctIndex: 0 }
    ]
  }
};

/** ---------------------------
 * Render quiz
 ----------------------------*/
function renderQuiz(container, quizId) {
  const quiz = QUIZZES[quizId];
  if (!quiz) {
    container.innerHTML = `<p class="small">Quiz no encontrado.</p>`;
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
    setQuizPassed(quizId, passed);

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

    // Status label (optional)
    if (stepId) {
      const statusEl = document.querySelector(`[data-status-for="${stepId}"]`);
      if (statusEl) {
        if (done) statusEl.textContent = "Completado";
        else if (!unlocked) statusEl.textContent = "Bloqueado";
        else statusEl.textContent = "Disponible";
      }
    }

    // Classes for styling
    el.classList.toggle("isDone", !!done);

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
}

/** ---------------------------
 * Progress UI (right panel)
 ----------------------------*/
function updateProgressUI() {
  const totalQuizzes = Object.keys(QUIZZES).length;
  const passedCount = Object.keys(QUIZZES).filter(isQuizPassed).length;

  const el = document.getElementById("progressText");
  if (el) el.textContent = `Quizzes aprobados: ${passedCount}/${totalQuizzes}`;
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
  const data = loadCourse();
  delete data[quizId];
  saveCourse(data);

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
  applyLocks();
  updateProgressUI();
});
;


