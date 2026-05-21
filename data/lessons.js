/* ============================================================
   data/lessons.js — Course structure for Exprésate.

   Exposed as window.ExpresateLessons.

   The curso.html page reads this and renders the module/step UI.
   To add a new lesson or quiz to the course route, edit the data
   here — no HTML or JS changes needed.

   Conventions
   -----------
   step.id        Canonical ID (used for storage + locks).
                  Lessons: "lesson-NNN-name". Quizzes: "quiz-NNN".
   step.type      "lesson"  — links to an .html lesson page
                  "quiz"    — opens an inline quiz (data/quizzes.js)
   step.requires  ID of the step that must be completed first, or
                  null for "always available".
   step.href      Only for type:"lesson" — target HTML page.
   module.style   "numbered" — shows step number + title + subtitle
                  "plain"    — flat button row, label only
   module.lockOnQuiz
                  If set, the whole module stays closed/locked until
                  that quiz is passed. Independent from step.requires.
   ============================================================ */
window.ExpresateLessons = {
  modules: [
    {
      id: "module-0",
      title: "Módulo 0 — Fundamentos (Pronunciación)",
      style: "numbered",
      open: true,
      lockOnQuiz: null,
      hint: "Teoría (sigue el orden)",
      steps: [
        {
          id: "lesson-000-alphabet",
          type: "lesson",
          title: "Lección 000 — Alfabeto",
          subtitle: "Base: deletrear, A–Z",
          href: "lesson-000-alphabet.html",
          requires: null
        },
        {
          id: "lesson-001-sounds",
          type: "lesson",
          title: "Lección 001 — Sonidos clave",
          subtitle: "SH / CH / TH + pares mínimos",
          href: "lesson-001-sounds.html",
          requires: "lesson-000-alphabet"
        },
        {
          id: "lesson-000-syllables",
          type: "lesson",
          title: "Lección 002 — Sílabas y Acento",
          subtitle: "Stress + reducción (ritmo)",
          href: "Syllables.html",
          requires: "lesson-001-sounds"
        },
        {
          id: "quiz-000",
          type: "quiz",
          title: "Abrir Quiz 000",
          subtitle: "Aprobado = desbloquea Módulo 1",
          requires: "lesson-000-syllables"
        }
      ]
    },
    {
      id: "module-1",
      title: "Módulo 1 — Plantillas (Presente)",
      style: "numbered",
      open: false,
      lockOnQuiz: "quiz-000",
      hint: "Teoría",
      lockedHint: "Completa el Quiz 000 para desbloquear este módulo.",
      steps: [
        {
          id: "lesson-001-pronombres",
          type: "lesson",
          premium: true,
          title: "Plantilla 001 — Pronombres + Verbos",
          subtitle: "Yo, tú, él / ella, nosotros, ellos",
          href: "lesson-001.html",
          requires: "quiz-000"
        },
        {
          id: "quiz-001",
          type: "quiz",
          premium: true,
          title: "Quiz 001 — Pronombres",
          subtitle: "Confirma la Plantilla 001",
          requires: "lesson-001-pronombres"
        },
        {
          id: "lesson-002-preguntas",
          type: "lesson",
          premium: true,
          title: "Plantilla 002 — Preguntas (Do/Does)",
          subtitle: "Formular preguntas en presente",
          href: "lesson-002.html",
          requires: "quiz-001"
        },
        {
          id: "quiz-002",
          type: "quiz",
          premium: true,
          title: "Quiz 002 — Preguntas",
          subtitle: "Confirma la Plantilla 002",
          requires: "lesson-002-preguntas"
        },
        {
          id: "lesson-003-negaciones",
          type: "lesson",
          premium: true,
          title: "Plantilla 003 — Negaciones (Don't/Doesn't)",
          subtitle: "Negar en presente",
          href: "lesson-003.html",
          requires: "quiz-002"
        },
        {
          id: "quiz-003",
          type: "quiz",
          premium: true,
          title: "Quiz 003 — Negaciones",
          subtitle: "Confirma la Plantilla 003",
          requires: "lesson-003-negaciones"
        }
      ]
    }
  ]
};
