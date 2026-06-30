/* Expresate Studio Activity Library foundation. */
(function () {
  "use strict";

  const ACTIVITIES = Object.freeze([
    {
      id: "flashcards",
      title: "Flashcards",
      summary: "Reveal, listen, and repeat vocabulary one item at a time.",
      interactionType: "tap and reveal",
      studentGoal: "Build quick recognition and repetition.",
      requiredInputs: ["vocabulary items", "optional images", "optional audio"],
      feedbackModel: "self-paced immediate reveal",
      completionModel: "complete after reviewing all cards",
      supportedThemes: ["workbook-blue", "playful-purple", "minimal-clean"],
      supportedAnimations: ["slide-fade", "soft-pop"],
      notes: "Good default for early vocabulary practice."
    },
    {
      id: "alphabet-explorer",
      title: "Alphabet Explorer",
      summary: "Tap letters, hear audio, and browse example-rich modals.",
      interactionType: "grid exploration",
      studentGoal: "Connect letter names, sounds, and example words.",
      requiredInputs: ["letter dataset", "images", "audio", "tips"],
      feedbackModel: "audio response plus modal exploration",
      completionModel: "complete after guided exploration",
      supportedThemes: ["workbook-blue", "playful-purple"],
      supportedAnimations: ["slide-fade", "soft-pop"],
      notes: "Currently implemented in Lesson 000 and Studio experiences."
    },
    {
      id: "pronunciation-lab",
      title: "Pronunciation Lab",
      summary: "Listen, compare, and optionally speak target sounds or phrases.",
      interactionType: "audio and speech practice",
      studentGoal: "Hear target pronunciation and practice producing it.",
      requiredInputs: ["target phrase", "translation", "expected text", "optional hints"],
      feedbackModel: "listen and speech recognition feedback",
      completionModel: "complete after one or more successful attempts",
      supportedThemes: ["workbook-blue", "playful-purple"],
      supportedAnimations: ["soft-pop", "correct-confetti", "wrong-shake"],
      notes: "Reuse current speech practice engine."
    },
    {
      id: "picture-match",
      title: "Picture Match",
      summary: "Choose the image or word that matches the prompt.",
      interactionType: "selection",
      studentGoal: "Connect meaning to image quickly.",
      requiredInputs: ["prompt", "choices", "correct answer", "optional images"],
      feedbackModel: "immediate correct or wrong feedback",
      completionModel: "complete once each prompt is solved",
      supportedThemes: ["workbook-blue", "playful-purple", "minimal-clean"],
      supportedAnimations: ["soft-pop", "correct-confetti", "wrong-shake"],
      notes: "Useful for vocabulary-heavy practice."
    },
    {
      id: "sentence-builder",
      title: "Sentence Builder",
      summary: "Reorder words or choose chunks to build a correct sentence.",
      interactionType: "ordering",
      studentGoal: "Practice structure and grammar through assembly.",
      requiredInputs: ["target sentence", "tokens or chunks", "translation optional"],
      feedbackModel: "check, hint, retry",
      completionModel: "complete when sentence is assembled correctly",
      supportedThemes: ["workbook-blue", "minimal-clean"],
      supportedAnimations: ["slide-fade", "wrong-shake"],
      notes: "Good follow-up after explanation blocks."
    },
    {
      id: "story-mode",
      title: "Story Mode",
      summary: "Guided narrative sequence with vocabulary and interaction beats.",
      interactionType: "scene progression",
      studentGoal: "Understand language in context and progress through a short story.",
      requiredInputs: ["scenes", "dialogue", "prompts", "optional media"],
      feedbackModel: "scene-level feedback and checkpoints",
      completionModel: "complete after final scene",
      supportedThemes: ["playful-purple", "workbook-blue"],
      supportedAnimations: ["slide-fade", "soft-pop", "correct-confetti"],
      notes: "Placeholder for a richer future experience."
    }
  ]);

  window.ExpresateStudioActivities = Object.freeze({
    version: 1,
    all: ACTIVITIES,
    list() {
      return ACTIVITIES.map((entry) => ({ ...entry }));
    },
    get(id) {
      return ACTIVITIES.find((entry) => entry.id === id) || null;
    }
  });
})();
