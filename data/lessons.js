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
          id: "lesson-014-ing-pattern",
          type: "lesson",
          premium: true,
          title: "Lección 014 — -ando / -endo = -ing",
          subtitle: "Reconoce acciones en progreso",
          href: "lesson-014-ing-pattern.html",
          requires: "quiz-000"
        },
        {
          id: "lesson-013-i-am",
          type: "lesson",
          premium: true,
          title: "Lección 013 — I am / Yo estoy",
          subtitle: "Sentimientos · estados · acciones ahora",
          href: "lesson-013-i-am.html",
          requires: "lesson-014-ing-pattern"
        },
        {
          id: "lesson-001-pronombres",
          type: "lesson",
          premium: true,
          title: "Plantilla 001 — Pronombres + Verbos",
          subtitle: "Yo, tú, él / ella, nosotros, ellos",
          href: "lesson-001.html",
          requires: "lesson-013-i-am"
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
    },
    {
      id: "module-2",
      title: "Módulo 2 — Inglés de supervivencia",
      style: "numbered",
      open: false,
      lockOnQuiz: "quiz-003",
      hint: "Conversaciones prácticas",
      lockedHint: "Completa el Quiz 003 para desbloquear Inglés de supervivencia.",
      steps: [
        {
          id: "lesson-004-greetings",
          type: "lesson",
          premium: true,
          title: "Lección 004 — Saludos y presentaciones",
          subtitle: "Hello, my name is..., nice to meet you",
          href: "lesson-004-greetings.html",
          requires: "quiz-003"
        },
        {
          id: "lesson-005-classroom-phrases",
          type: "lesson",
          premium: true,
          title: "Lección 005 — Frases para clase y la app",
          subtitle: "Repeat, please · I don’t understand · How do you say...?",
          href: "lesson-005-classroom-phrases.html",
          requires: "lesson-004-greetings"
        },
        {
          id: "lesson-006-identity-place",
          type: "lesson",
          premium: true,
          title: "Lección 006 — ¿De dónde eres?",
          subtitle: "I am from... · I live in... · I speak Spanish",
          href: "lesson-006-identity-place.html",
          requires: "lesson-005-classroom-phrases"
        },
        {
          id: "lesson-007-basic-questions",
          type: "lesson",
          premium: true,
          title: "Lección 007 — Preguntas básicas",
          subtitle: "What is this? · What does this mean? · I need help",
          href: "lesson-007-basic-questions.html",
          requires: "lesson-006-identity-place"
        },
        {
          id: "lesson-008-numbers-1-20",
          type: "lesson",
          premium: true,
          title: "Lección 008 — Números del 1 al 20",
          subtitle: "Edad · números de teléfono · sonidos teen",
          href: "lesson-008-numbers-1-20.html",
          requires: "lesson-007-basic-questions"
        },
        {
          id: "lesson-009-days-of-week",
          type: "lesson",
          premium: true,
          title: "Lección 009 — Días de la semana",
          subtitle: "Today is... · on Monday · días de clase",
          href: "lesson-009-days-of-week.html",
          requires: "lesson-008-numbers-1-20"
        },
        {
          id: "lesson-010-months-dates",
          type: "lesson",
          premium: true,
          title: "Lección 010 — Meses y fechas",
          subtitle: "in January · on May 5 · cumpleaños",
          href: "lesson-010-months-dates.html",
          requires: "lesson-009-days-of-week"
        },
        {
          id: "lesson-011-time-basics",
          type: "lesson",
          premium: true,
          title: "Lección 011 — Hora básica",
          subtitle: "What time is it? · at 8:00 · mañana/noche",
          href: "lesson-011-time-basics.html",
          requires: "lesson-010-months-dates"
        },
        {
          id: "lesson-012-food-phrases",
          type: "lesson",
          premium: true,
          title: "Lección 012 — Frases con comida",
          subtitle: "I want... · I like... · Can I have...?",
          href: "lesson-012-food-phrases.html",
          requires: "lesson-011-time-basics"
        }
      ]
    }
  ]
};
