/* ============================================================
   data/quizzes.js — Quiz content for the Exprésate course.

   Exposed as window.ExpresateQuizzes (keyed by quiz id).

   Each quiz:
     - title         : display title
     - passingScore  : min correct answers to pass
     - questions[]   : { prompt, options[], correctIndex }

   To add a new quiz, add a key here. To use it from the course, also
   add a step entry in data/lessons.js so the unlock graph stays in sync.
   ============================================================ */
window.ExpresateQuizzes = {
  "quiz-000": {
    title: "Quiz 000 — Alfabeto (básico)",
    passingScore: 3,
    questions: [
      { prompt: "¿Cuál letra es la primera del alfabeto?",       options: ["A", "E", "I"],   correctIndex: 0 },
      { prompt: "¿Cuántas letras tiene el alfabeto en inglés?",  options: ["26", "27", "25"], correctIndex: 0 },
      { prompt: "Selecciona una vocal:",                          options: ["B", "A", "T"],   correctIndex: 1 },
      { prompt: "¿Cuál es una consonante?",                       options: ["O", "U", "M"],   correctIndex: 2 }
    ]
  },

  "quiz-001": {
    title: "Quiz 001 — Pronombres + Verbos",
    passingScore: 3,
    questions: [
      { prompt: "Traduce: Yo trabajo.",          options: ["I work.", "He works.", "I worked."],     correctIndex: 0 },
      { prompt: "Traduce: Él trabaja.",          options: ["He work.", "He works.", "He working."],  correctIndex: 1 },
      { prompt: "Completa: She ____ here.",      options: ["live", "lives", "living"],                correctIndex: 1 },
      { prompt: "Traduce: Nosotros vivimos aquí.", options: ["We live here.", "We lives here.", "We living here."], correctIndex: 0 }
    ]
  },

  // Previously missing — referenced by curso.html but had no data,
  // so the button used to show "Quiz no encontrado". Restored here.
  "quiz-002": {
    title: "Quiz 002 — Preguntas (Do/Does)",
    passingScore: 3,
    questions: [
      { prompt: "Traduce: ¿Tú trabajas?",          options: ["Do you work?", "Does you work?", "You work?"],                correctIndex: 0 },
      { prompt: "Traduce: ¿Ella vive aquí?",       options: ["Do she live here?", "Does she live here?", "Does she lives here?"], correctIndex: 1 },
      { prompt: "Completa: ____ they study?",      options: ["Do", "Does", "Are"],                                            correctIndex: 0 },
      { prompt: "Selecciona la opción correcta:", options: ["Does he works?", "Does he work?", "Do he work?"],              correctIndex: 1 }
    ]
  },

  "quiz-003": {
    title: "Quiz 003 — Negaciones (Don't/Doesn't)",
    passingScore: 3,
    questions: [
      { prompt: "Traduce: Yo no trabajo.",                options: ["I don't work.", "I doesn't work.", "I not work."],                correctIndex: 0 },
      { prompt: "Traduce: Ella no vive aquí.",            options: ["She don't live here.", "She doesn't live here.", "She doesn't lives here."], correctIndex: 1 },
      { prompt: "Completa: He ____ study English.",       options: ["don't", "doesn't", "isn't"],                                     correctIndex: 1 },
      { prompt: "Selecciona la opción correcta:",          options: ["They don't work here.", "They doesn't work here.", "They not work here."], correctIndex: 0 }
    ]
  }
};
