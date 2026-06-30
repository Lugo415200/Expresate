/* Expresate Studio story character registry.
   Read-only planning data for future story-guided lessons. */
(function () {
  "use strict";

  const CHARACTERS = Object.freeze([
    {
      id: "sofia",
      name: "Sofia",
      role: "learner",
      languages: ["es", "basic-en"],
      levelContext: "beginner",
      personality: "Curious, realistic, occasionally unsure, willing to try.",
      teachingFunction: "Represents the Spanish-speaking learner perspective and makes believable beginner mistakes.",
      useFor: ["beginner confusion", "realistic mistakes", "student point of view", "small learning wins"],
      avoidFor: ["advanced explanations", "instant perfect English", "comic relief with no teaching value"],
      status: "ready"
    },
    {
      id: "alex",
      name: "Alex",
      role: "bilingual-guide",
      languages: ["es", "en"],
      levelContext: "all beginner modules",
      personality: "Patient, clear, encouraging, direct.",
      teachingFunction: "Explains concepts in Spanish, connects mistakes to the target pattern, and keeps lessons moving.",
      useFor: ["spanish-first explanations", "gentle corrections", "lesson transitions", "guided practice prompts"],
      avoidFor: ["long monologues", "replacing student discovery", "overly formal teacher tone"],
      status: "ready"
    },
    {
      id: "emma",
      name: "Emma",
      role: "native-speaker",
      languages: ["en"],
      levelContext: "listening and natural phrase exposure",
      personality: "Warm, natural, supportive, calm.",
      teachingFunction: "Provides natural English input and helps learners hear how real phrases sound in context.",
      useFor: ["listening examples", "natural phrase models", "short authentic dialogue"],
      avoidFor: ["dense idioms too early", "long unexplained speech", "advanced slang"],
      status: "ready"
    },
    {
      id: "community-cashier",
      name: "Community Cashier",
      role: "community",
      languages: ["en"],
      levelContext: "food, shopping, payment, simple requests",
      personality: "Brief, practical, polite.",
      teachingFunction: "Creates real-world purchase and ordering situations.",
      useFor: ["ordering food", "shopping basics", "price questions"],
      avoidFor: ["long explanations", "grammar teaching"],
      status: "planned"
    },
    {
      id: "community-teacher",
      name: "Community Teacher",
      role: "community",
      languages: ["en"],
      levelContext: "classroom and school scenarios",
      personality: "Structured, welcoming, patient.",
      teachingFunction: "Supports lessons about introductions, spelling, and classroom language.",
      useFor: ["spelling names", "classroom phrases", "introductions"],
      avoidFor: ["casual street dialogue", "dense conversation scenes"],
      status: "planned"
    },
    {
      id: "community-waiter",
      name: "Community Waiter",
      role: "community",
      languages: ["en"],
      levelContext: "restaurant and food practice",
      personality: "Polite, fast-paced, clear.",
      teachingFunction: "Supports food and restaurant interaction scenes.",
      useFor: ["ordering food", "polite requests", "menu language"],
      avoidFor: ["long explanations", "abstract grammar scenes"],
      status: "planned"
    },
    {
      id: "community-neighbor",
      name: "Community Neighbor",
      role: "community",
      languages: ["en"],
      levelContext: "daily small talk and location-based lessons",
      personality: "Friendly, informal, approachable.",
      teachingFunction: "Provides low-pressure conversation settings.",
      useFor: ["greetings", "where are you from", "basic identity phrases"],
      avoidFor: ["formal service interactions"],
      status: "planned"
    }
  ]);

  window.ExpresateStudioCharacters = Object.freeze({
    version: 1,
    all: CHARACTERS,
    list() {
      return CHARACTERS.map((entry) => ({ ...entry }));
    },
    get(id) {
      return CHARACTERS.find((entry) => entry.id === id) || null;
    }
  });
})();
