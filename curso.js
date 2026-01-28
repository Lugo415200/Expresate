const COURSE_KEY = "ynoel_course_progress_v1";

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

function setQuizPassed(quizId, passed) {
  const data = loadCourse();
  data[quizId] = { passed: !!passed, ts: Date.now() };
  saveCourse(data);
}

function isQuizPassed(quizId) {
  const data = loadCourse();
  return !!data?.[quizId]?.passed;
}

const QUIZZES = {
  "quiz-000": {
    title: "Quiz 000 — Alfabeto (básico)",
    passingScore: 3,
    questions: [
      {
        prompt: "¿Cuál letra es la primera del alfabeto?",
        options: ["A", "E", "I"],
        correctIndex: 0
      },
      {
        prompt: "¿Cuántas letras tiene el alfabeto en inglés?",
        options: ["26", "27", "25"],
        correctIndex: 0
      },
      {
        prompt: "Selecciona una vocal:",
        options: ["B", "A", "T"],
        correctIndex: 1
      },
      {
        prompt: "¿Cuál es una consonante?",
        options: ["O", "U", "M"],
        correctIndex: 2
      }
    ]
  },

  "quiz-001": {
    title: "Quiz 001 — Pronombres + Verbos",
    passingScore: 3,
    questions: [
      {
        prompt: "Traduce: Yo trabajo.",
        options: ["I work.", "He works.", "I worked."],
        correctIndex: 0
      },
      {
        prompt: "Traduce: Él trabaja.",
        options: ["He work.", "He works.", "He working."],
        correctIndex: 1
      },
      {
        prompt: "Completa: She ____ here.",
        options: ["live", "lives", "living"],
        correctIndex: 1
      }
    ]
  },
  "quiz-003": {
  title: "Quiz 003 — Negaciones (Don't/Doesn't)",
  passingScore: 3,
  questions: [
    {
      prompt: "Traduce: Yo no trabajo.",
      options: ["I don't work.", "I doesn't work.", "I not work."],
      correctIndex: 0
    },
    {
      prompt: "Traduce: Ella no vive aquí.",
      options: ["She don't live here.", "She doesn't live here.", "She doesn't lives here."],
      correctIndex: 1
    },
    {
      prompt: "Completa: He ____ study English.",
      options: ["don't", "doesn't", "isn't"],
      correctIndex: 1
    },
    {
      prompt: "Selecciona la opción correcta:",
      options: ["They don't work here.", "They doesn't work here.", "They not work here."],
      correctIndex: 0
    }
  ]
}

};

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

function applyLocks() {
  document.querySelectorAll("[data-lock]").forEach((module) => {
    const lockId = module.getAttribute("data-lock");
    const unlocked = isQuizPassed(lockId);

    // Badge text
    const badge = module.querySelector(`[data-lock-badge="${lockId}"]`);
    if (badge) badge.textContent = unlocked ? "Desbloqueado ✅" : "Bloqueado";

    // Locked lesson links (keep their real href; just block clicking via CSS class)
    module.querySelectorAll(`[data-locked-link="${lockId}"]`).forEach((a) => {
      if (unlocked) {
        a.removeAttribute("aria-disabled");
        a.classList.remove("is-locked");
      } else {
        a.setAttribute("aria-disabled", "true");
        a.classList.add("is-locked");
      }
    });

    // Enable/disable ANY quiz button inside that module (quiz-001, quiz-002, etc.)
    module.querySelectorAll(`[data-open-quiz]`).forEach((btn) => {
      btn.disabled = !unlocked;
    });

    // Prevent expanding locked module
    if (!unlocked) module.open = false;
  });
}


function updateProgressUI() {
  const passedCount = Object.keys(QUIZZES).filter(isQuizPassed).length;
  const total = Object.keys(QUIZZES).length;
  const el = document.getElementById("progressText");
  if (el) el.textContent = `Quizzes aprobados: ${passedCount}/${total}`;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-open-quiz]");
  if (!btn) return;

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

document.addEventListener("DOMContentLoaded", () => {
  applyLocks();
  updateProgressUI();
});

