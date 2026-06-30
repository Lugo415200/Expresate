/* Expresate Studio story scene registry.
   Read-only planning data for short curriculum-driven story moments. */
(function () {
  "use strict";

  const STORY_SCENES = Object.freeze([
    {
      id: "scene-lesson000-spell-your-name",
      title: "Spell your name clearly",
      lessonSlug: "lesson-000-alphabet",
      chapter: "foundation",
      module: "module-0",
      characters: ["sofia", "alex", "community-teacher"],
      setting: "first class introduction",
      studentGoal: "Understand that the alphabet helps you give exact information.",
      dialogue: [
        "Teacher: Can you spell your name for me?",
        "Sofia: I can say it, but I need the letters.",
        "Alex: Aqui usamos el alfabeto para decirlo exacto."
      ],
      mistakeMoment: "Sofia can say her name, but cannot yet spell it clearly letter by letter.",
      teachingPoint: "The alphabet matters when you need exact information like names, emails, and addresses.",
      activityPrompt: "Tap letters, hear them, and practice spelling your own name.",
      outro: "Now Sofia can give her name clearly when someone needs to write it down.",
      suggestedActivity: "alphabet-explorer",
      suggestedTheme: "workbook-blue",
      suggestedAnimations: ["slide-fade", "soft-pop"],
      status: "ready"
    },
    {
      id: "scene-greetings-first-meeting",
      title: "A first greeting",
      lessonSlug: "greetings-introductions",
      chapter: "survival-english",
      module: "module-1",
      characters: ["sofia", "alex", "community-neighbor"],
      setting: "meeting someone new",
      studentGoal: "Use simple greetings and introduce yourself.",
      dialogue: [
        "Neighbor: Hello!",
        "Sofia: Hello. My name is Sofia.",
        "Alex: Muy bien. Luego puedes agregar nice to meet you."
      ],
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
      title: "From 'I hungry' to 'I am hungry'",
      lessonSlug: "i-am-yo-estoy",
      chapter: "survival-english",
      module: "module-1",
      characters: ["sofia", "alex"],
      setting: "school break",
      studentGoal: "Say how you feel with I am.",
      dialogue: [
        "Sofia: I hungry.",
        "Alex: Casi. En ingles decimos I am hungry.",
        "Sofia: I am hungry."
      ],
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
      title: "Ordering food with confidence",
      lessonSlug: "ordering-food-basics",
      chapter: "everyday-english",
      module: "module-2",
      characters: ["sofia", "emma", "community-waiter"],
      setting: "casual restaurant counter",
      studentGoal: "Use short food-request phrases politely.",
      dialogue: [
        "Waiter: What would you like?",
        "Sofia: I want chicken, please.",
        "Emma: Good. You can also say, Can I have chicken, please?"
      ],
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
    version: 1,
    all: STORY_SCENES,
    list() {
      return STORY_SCENES.map((entry) => ({
        ...entry,
        characters: Array.isArray(entry.characters) ? [...entry.characters] : []
      }));
    },
    get(id) {
      return STORY_SCENES.find((entry) => entry.id === id) || null;
    }
  });
})();
