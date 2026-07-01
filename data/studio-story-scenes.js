/* Expresate Studio story scene registry.
   Read-only planning data for short curriculum-driven story moments. */
(function () {
  "use strict";

  const STORY_SCENES = Object.freeze([
    {
      id: "scene-s1e1-welcome-to-class",
      episodeId: "season-1-episode-1",
      sceneOrder: 1,
      title: "Welcome to Class",
      lessonSlug: "lesson-000-alphabet",
      chapter: "season-1",
      module: "module-0",
      characters: [
        { id: "sofia", pose: "happy" },
        { id: "community-teacher", pose: "neutral" }
      ],
      setting: "English class on the first day",
      studentGoal: "Understand that this course will teach English through guided practice and exact communication.",
      dialogue: [
        "Sofia: Hola. Soy Sofia y hoy es mi primer dia aprendiendo ingles.",
        "Sofia: Tu tambien estas aqui para empezar conmigo, verdad?",
        "Teacher: Welcome to class. Today we start with the alphabet so everyone can share information clearly."
      ],
      userPrompt: "Identificate como nuevo estudiante y preparate para trabajar con Sofia durante la clase.",
      mistakeMoment: "Sofia can introduce herself in Spanish, but she still needs English building blocks before she can participate with confidence.",
      teachingPoint: "The class begins with the alphabet because exact information comes before longer conversation.",
      activityPrompt: "Get ready to tap letters, hear their names, and notice how English class will guide each step.",
      outro: "The teacher opens the first practice board and Sofia stays close so the learner never feels alone.",
      suggestedActivity: "alphabet-explorer",
      suggestedTheme: "workbook-blue",
      suggestedAnimations: ["slide-fade", "soft-pop"],
      status: "ready"
    },
    {
      id: "scene-s1e1-alphabet-practice",
      episodeId: "season-1-episode-1",
      sceneOrder: 2,
      title: "Alphabet Practice Together",
      lessonSlug: "lesson-000-alphabet",
      chapter: "season-1",
      module: "module-0",
      characters: [
        { id: "community-teacher", pose: "neutral" },
        { id: "sofia", pose: "thinking" },
        { id: "alex", pose: "pointing" }
      ],
      setting: "Front board with alphabet tiles",
      studentGoal: "Practice the alphabet and see how it helps with names, emails, and addresses.",
      dialogue: [
        "Teacher: These letters help us say exact information.",
        "Sofia: Puedo decir mi nombre, pero necesito practicar como deletrearlo.",
        "Alex: Vamos paso a paso. Primero escucha las letras y luego usa las tuyas."
      ],
      userPrompt: "Cuando aparezcan las letras, toca y escucha. Luego deletrea tu propio nombre.",
      mistakeMoment: "Sofia knows her name, but not yet how to break it into English letter names.",
      teachingPoint: "Alphabet practice is not random memorization; it supports real tasks like spelling names and contact details.",
      activityPrompt: "Tap the alphabet tiles, then move into the name-spelling activity with your own name.",
      outro: "After hearing the letters, Sofia is ready to try spelling her name out loud with the learner.",
      suggestedActivity: "alphabet-explorer",
      suggestedTheme: "workbook-green",
      suggestedAnimations: ["slide-fade", "soft-pop"],
      status: "ready"
    },
    {
      id: "scene-s1e1-key-sounds-intro",
      episodeId: "season-1-episode-1",
      sceneOrder: 3,
      title: "Key English Sounds",
      lessonSlug: "lesson-001-sounds",
      chapter: "season-1",
      module: "module-0",
      characters: [
        { id: "community-teacher", pose: "neutral" },
        { id: "alex", pose: "explaining" },
        { id: "sofia", pose: "confused" }
      ],
      setting: "Pronunciation practice at the front of class",
      studentGoal: "Notice that English letters and sound combinations do not always behave like Spanish.",
      dialogue: [
        "Teacher: English sounds can change depending on the letter pair.",
        "Sofia: En espanol espero un sonido mas fijo.",
        "Alex: Exacto. Por eso hoy veremos SH, CH y TH con ejemplos faciles."
      ],
      userPrompt: "Escucha los sonidos clave y compara como cambian entre palabras parecidas.",
      mistakeMoment: "Sofia expects one stable sound per letter because that is usually closer to Spanish reading patterns.",
      teachingPoint: "English needs explicit phonetic practice because one spelling pattern can sound different from what a Spanish-speaking learner first expects.",
      activityPrompt: "Practice key sound pairs, then test yourself with simple examples and repeats.",
      outro: "Now the learner knows that sounds deserve special attention, not just the alphabet names.",
      suggestedActivity: "pronunciation-lab",
      suggestedTheme: "workbook-blue",
      suggestedAnimations: ["slide-fade", "soft-pop"],
      status: "ready"
    },
    {
      id: "scene-s1e1-pair-up-review",
      episodeId: "season-1-episode-1",
      sceneOrder: 4,
      title: "Pair Up With Sofia",
      lessonSlug: "lesson-000-syllables",
      chapter: "season-1",
      module: "module-0",
      characters: [
        { id: "community-teacher", pose: "neutral" },
        { id: "sofia", pose: "speaking" },
        { id: "alex", pose: "listening" }
      ],
      setting: "Partner practice after the first class explanation",
      studentGoal: "Move from passive listening into active recall and guided review.",
      dialogue: [
        "Teacher: Work with a partner and check what you remember.",
        "Sofia: Perfecto. Yo voy contigo.",
        "Sofia: Vamos a repasar letras, sonidos y como dividir palabras paso a paso."
      ],
      userPrompt: "Acepta la pareja con Sofia y entra en modo repaso activo.",
      mistakeMoment: "The learner may understand examples when the teacher explains them, but still need partner repetition to keep them.",
      teachingPoint: "Partner review turns recognition into recall, which prepares the learner for checkpoints and future lessons.",
      activityPrompt: "Review what you heard, repeat short items, and prepare for the checkpoint.",
      outro: "Sofia is no longer just another student. She becomes the learner's practice partner.",
      suggestedActivity: "flashcards",
      suggestedTheme: "workbook-blue",
      suggestedAnimations: ["slide-fade", "soft-pop"],
      status: "ready"
    },
    {
      id: "scene-s1e1-module0-checkpoint",
      episodeId: "season-1-episode-1",
      sceneOrder: 5,
      title: "Module 0 Checkpoint",
      lessonSlug: "quiz-000",
      chapter: "season-1",
      module: "module-0",
      characters: [
        { id: "community-teacher", pose: "neutral" },
        { id: "sofia", pose: "thinking" },
        { id: "alex", pose: "explaining" }
      ],
      setting: "Short class review before moving into Module 1",
      studentGoal: "Confirm alphabet, sound awareness, and early listening recall before advancing.",
      dialogue: [
        "Teacher: Antes de avanzar, revisemos lo esencial.",
        "Sofia: A ver si ya puedo reconocer palabras y sonidos mejor que al principio.",
        "Alex: No busques perfeccion. Busca claridad y progreso."
      ],
      userPrompt: "Responde preguntas cortas para demostrar que ya puedes reconocer letras, sonidos y palabras basicas.",
      mistakeMoment: "Checkpoint pressure can make learners doubt what they actually know, even when the foundation is already there.",
      teachingPoint: "Checkpoints are for confirming core patterns, not for punishing small mistakes.",
      activityPrompt: "Answer review questions, listen carefully, and choose the best response before moving on.",
      quizPromptMetadata: {
        multipleChoiceExamples: [
          "Como se dice 'elefante' en ingles?",
          "Que sonido hace esta letra?",
          "Escucha el audio y elige la palabra correcta."
        ],
        skillsChecked: ["alphabet recognition", "key sounds", "basic listening recall"],
        futureModes: ["multiple-choice", "audio recognition", "matching"]
      },
      outro: "Episode 1 closes with a stronger foundation: the learner and Sofia are ready for real beginner English.",
      suggestedActivity: "quiz",
      suggestedTheme: "workbook-blue",
      suggestedAnimations: ["slide-fade", "correct-confetti"],
      status: "ready"
    },
    {
      id: "scene-greetings-first-meeting",
      episodeId: "season-1-episode-2",
      sceneOrder: 1,
      title: "A first greeting",
      lessonSlug: "lesson-004-greetings",
      chapter: "survival-english",
      module: "module-2",
      characters: [
        { id: "sofia", pose: "speaking" },
        { id: "alex", pose: "pointing" },
        "community-neighbor"
      ],
      setting: "meeting someone new",
      studentGoal: "Use simple greetings and introduce yourself.",
      dialogue: [
        "Neighbor: Hello!",
        "Sofia: Hello. My name is Sofia.",
        "Alex: Muy bien. Luego puedes agregar nice to meet you."
      ],
      userPrompt: "Saluda, di tu nombre y responde con una frase completa.",
      mistakeMoment: "Sofia knows hello, but needs structure for a full basic introduction.",
      teachingPoint: "Use hello, my name is..., and nice to meet you for first contact.",
      activityPrompt: "Practice greeting, saying your name, and responding politely.",
      outro: "The conversation stays simple, but Sofia now sounds more complete and confident.",
      suggestedActivity: "flashcards",
      suggestedTheme: "workbook-blue",
      suggestedAnimations: ["slide-fade", "soft-pop"],
      status: "draft"
    },
    {
      id: "scene-i-am-hungry-correction",
      episodeId: "season-1-episode-3",
      sceneOrder: 1,
      title: "From 'I hungry' to 'I am hungry'",
      lessonSlug: "lesson-013-i-am",
      chapter: "survival-english",
      module: "module-1",
      characters: [
        { id: "sofia", pose: "confused" },
        { id: "alex", pose: "explaining" }
      ],
      setting: "school break",
      studentGoal: "Say how you feel with I am.",
      dialogue: [
        "Sofia: I hungry.",
        "Alex: Casi. En ingles decimos I am hungry.",
        "Sofia: I am hungry."
      ],
      userPrompt: "Corrige la frase corta y repitela de forma completa.",
      mistakeMoment: "The learner drops the verb am, following a direct Spanish transfer pattern.",
      teachingPoint: "English uses I am + feeling/state: I am hungry, I am tired, I am ready.",
      activityPrompt: "Build and repeat short I am sentences.",
      outro: "Sofia can now describe how she feels using a complete English sentence.",
      suggestedActivity: "sentence-builder",
      suggestedTheme: "workbook-blue",
      suggestedAnimations: ["slide-fade", "soft-pop", "correct-confetti"],
      status: "draft"
    },
    {
      id: "scene-ordering-food-basics",
      episodeId: "season-1-episode-4",
      sceneOrder: 1,
      title: "Ordering food with confidence",
      lessonSlug: "lesson-012-food-phrases",
      chapter: "everyday-english",
      module: "module-2",
      characters: [
        { id: "sofia", pose: "speaking" },
        { id: "emma", pose: "listening" },
        "community-waiter"
      ],
      setting: "casual restaurant counter",
      studentGoal: "Use short food-request phrases politely.",
      dialogue: [
        "Waiter: What would you like?",
        "Sofia: I want chicken, please.",
        "Emma: Good. You can also say, Can I have chicken, please?"
      ],
      userPrompt: "Combina una palabra de comida con una peticion natural y cortesia.",
      mistakeMoment: "Sofia knows the food word but needs a natural request pattern.",
      teachingPoint: "Food vocabulary becomes more useful when paired with request phrases like I want... or Can I have...?",
      activityPrompt: "Match food words to polite request phrases, then repeat the full sentence.",
      outro: "The food word is no longer isolated. Sofia can use it in a real interaction.",
      suggestedActivity: "picture-match",
      suggestedTheme: "playful-purple",
      suggestedAnimations: ["soft-pop", "correct-confetti"],
      status: "planned"
    }
  ]);

  window.ExpresateStudioStoryScenes = Object.freeze({
    version: 2,
    all: STORY_SCENES,
    list() {
      return STORY_SCENES.map((entry) => ({
        ...entry,
        characters: Array.isArray(entry.characters)
          ? entry.characters.map((character) => (typeof character === "object" && character ? { ...character } : character))
          : [],
        dialogue: Array.isArray(entry.dialogue) ? [...entry.dialogue] : [],
        quizPromptMetadata: entry.quizPromptMetadata ? { ...entry.quizPromptMetadata } : null
      }));
    },
    get(id) {
      return STORY_SCENES.find((entry) => entry.id === id) || null;
    }
  });
})();
