export type CourseStep = {
  id: string;
  type: "lesson" | "quiz";
  title: string;
  subtitle: string;
  requires?: string | null;
  premium?: boolean;
  native?: boolean;
};

export type CourseModule = {
  id: string;
  title: string;
  hint: string;
  lockOnQuiz?: string | null;
  steps: CourseStep[];
};

// Mirrors data/lessons.js so the native app shows the same learning journey
// while native lesson implementations are migrated incrementally.
export const courseModules: CourseModule[] = [
  {
    id: "module-0",
    title: "Módulo 0 — Fundamentos (Pronunciación)",
    hint: "Teoría · sigue el orden",
    steps: [
      {
        id: "lesson-000-alphabet",
        type: "lesson",
        title: "Lección 000 — Alfabeto",
        subtitle: "Base: deletrear, A–Z",
        native: true,
      },
      {
        id: "lesson-001-sounds",
        type: "lesson",
        title: "Lección 001 — Sonidos clave",
        subtitle: "SH / CH / TH + pares mínimos",
        requires: "lesson-000-alphabet",
      },
      {
        id: "lesson-000-syllables",
        type: "lesson",
        title: "Lección 002 — Sílabas y Acento",
        subtitle: "Stress + reducción (ritmo)",
        requires: "lesson-001-sounds",
      },
      {
        id: "quiz-000",
        type: "quiz",
        title: "Quiz 000",
        subtitle: "Aprobado = desbloquea Módulo 1",
        requires: "lesson-000-syllables",
      },
    ],
  },
  {
    id: "module-1",
    title: "Módulo 1 — Plantillas (Presente)",
    hint: "Teoría",
    lockOnQuiz: "quiz-000",
    steps: [
      {
        id: "lesson-014-ing-pattern",
        type: "lesson",
        premium: true,
        title: "Lección 014 — -ando / -endo = -ing",
        subtitle: "Reconoce acciones en progreso",
        requires: "quiz-000",
      },
      {
        id: "lesson-013-i-am",
        type: "lesson",
        premium: true,
        title: "Lección 013 — I am / Yo estoy",
        subtitle: "Sentimientos · estados · acciones ahora",
        requires: "lesson-014-ing-pattern",
      },
      {
        id: "lesson-001-pronombres",
        type: "lesson",
        premium: true,
        title: "Plantilla 001 — Pronombres + Verbos",
        subtitle: "Yo, tú, él / ella, nosotros, ellos",
        requires: "lesson-013-i-am",
      },
      {
        id: "quiz-001",
        type: "quiz",
        premium: true,
        title: "Quiz 001 — Pronombres",
        subtitle: "Confirma la Plantilla 001",
        requires: "lesson-001-pronombres",
      },
      {
        id: "lesson-002-preguntas",
        type: "lesson",
        premium: true,
        title: "Plantilla 002 — Preguntas (Do/Does)",
        subtitle: "Formular preguntas en presente",
        requires: "quiz-001",
      },
      {
        id: "quiz-002",
        type: "quiz",
        premium: true,
        title: "Quiz 002 — Preguntas",
        subtitle: "Confirma la Plantilla 002",
        requires: "lesson-002-preguntas",
      },
      {
        id: "lesson-003-negaciones",
        type: "lesson",
        premium: true,
        title: "Plantilla 003 — Negaciones (Don't/Doesn't)",
        subtitle: "Negar en presente",
        requires: "quiz-002",
      },
      {
        id: "quiz-003",
        type: "quiz",
        premium: true,
        title: "Quiz 003 — Negaciones",
        subtitle: "Confirma la Plantilla 003",
        requires: "lesson-003-negaciones",
      },
    ],
  },
  {
    id: "module-2",
    title: "Módulo 2 — Inglés de supervivencia",
    hint: "Conversaciones prácticas",
    lockOnQuiz: "quiz-003",
    steps: [
      {
        id: "lesson-004-greetings",
        type: "lesson",
        premium: true,
        title: "Lección 004 — Saludos y presentaciones",
        subtitle: "Hello, my name is... · nice to meet you",
        requires: "quiz-003",
      },
      {
        id: "lesson-005-classroom-phrases",
        type: "lesson",
        premium: true,
        title: "Lección 005 — Frases para clase y la app",
        subtitle: "Repeat, please · I don’t understand · How do you say...?",
        requires: "lesson-004-greetings",
      },
      {
        id: "lesson-006-identity-place",
        type: "lesson",
        premium: true,
        title: "Lección 006 — ¿De dónde eres?",
        subtitle: "I am from... · I live in... · I speak Spanish",
        requires: "lesson-005-classroom-phrases",
      },
      {
        id: "lesson-007-basic-questions",
        type: "lesson",
        premium: true,
        title: "Lección 007 — Preguntas básicas",
        subtitle: "What is this? · What does this mean? · I need help",
        requires: "lesson-006-identity-place",
      },
      {
        id: "lesson-008-numbers-1-20",
        type: "lesson",
        premium: true,
        title: "Lección 008 — Números del 1 al 20",
        subtitle: "Edad · números de teléfono · sonidos teen",
        requires: "lesson-007-basic-questions",
      },
      {
        id: "lesson-009-days-of-week",
        type: "lesson",
        premium: true,
        title: "Lección 009 — Días de la semana",
        subtitle: "Today is... · on Monday · días de clase",
        requires: "lesson-008-numbers-1-20",
      },
      {
        id: "lesson-010-months-dates",
        type: "lesson",
        premium: true,
        title: "Lección 010 — Meses y fechas",
        subtitle: "in January · on May 5 · cumpleaños",
        requires: "lesson-009-days-of-week",
      },
      {
        id: "lesson-011-time-basics",
        type: "lesson",
        premium: true,
        title: "Lección 011 — Hora básica",
        subtitle: "What time is it? · at 8:00 · mañana/noche",
        requires: "lesson-010-months-dates",
      },
      {
        id: "lesson-012-food-phrases",
        type: "lesson",
        premium: true,
        title: "Lección 012 — Frases con comida",
        subtitle: "I want... · I like... · Can I have...?",
        requires: "lesson-011-time-basics",
      },
    ],
  },
];
