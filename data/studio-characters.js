/* Expresate Studio story character registry.
   Read-only planning data for future story-guided lessons. */
(function () {
  "use strict";

  const CHARACTERS = Object.freeze([
    {
      id: "sofia",
      name: "Sofia",
      role: "learner",
      assetBase: "assets/characters/sofia/",
      poses: {
        greeting: "assets/characters/sofia/greeting.webp",
        happy: "assets/characters/sofia/happy.webp",
        confused: "assets/characters/sofia/confused.webp",
        questioning: "assets/characters/sofia/questioning.webp",
        thinking: "assets/characters/sofia/thinking.webp",
        celebrating: "assets/characters/sofia/celebrating.webp",
        speaking: "assets/characters/sofia/speaking.webp"
      },
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
      assetBase: "assets/characters/alex/",
      poses: {
        neutral: "assets/characters/alex/neutral.webp",
        explaining: "assets/characters/alex/explaining.webp",
        pointing: "assets/characters/alex/pointing.webp",
        listening: "assets/characters/alex/listening.webp",
        celebrating: "assets/characters/alex/celebrating.webp"
      },
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
      assetBase: "assets/characters/emma/",
      poses: {
        neutral: "assets/characters/emma/neutral.webp",
        greeting: "assets/characters/emma/greeting.webp",
        listening: "assets/characters/emma/listening.webp",
        speaking: "assets/characters/emma/speaking.webp",
        surprised: "assets/characters/emma/surprised.webp"
      },
      languages: ["en"],
      levelContext: "listening and natural phrase exposure",
      personality: "Warm, natural, supportive, calm.",
      teachingFunction: "Provides natural English input and helps learners hear how real phrases sound in context.",
      useFor: ["listening examples", "natural phrase models", "short authentic dialogue"],
      avoidFor: ["dense idioms too early", "long unexplained speech", "advanced slang"],
      status: "ready"
    },
    {
      id: "professor",
      name: "Professor",
      role: "community",
      assetBase: "assets/characters/professor/",
      poses: {
        neutral: "assets/characters/professor/neutral.webp",
        pointing: "assets/characters/professor/pointing.webp",
        celebrating: "assets/characters/professor/celebrating.webp"
      },
      languages: ["en"],
      levelContext: "classroom and school scenarios",
      personality: "Structured, welcoming, patient.",
      teachingFunction: "Supports lessons about introductions, spelling, and classroom language.",
      useFor: ["spelling names", "classroom phrases", "introductions"],
      avoidFor: ["casual street dialogue", "dense conversation scenes"],
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
  // Retain compatibility with saved Studio scenes created before Professor became canonical.
  const CHARACTER_ALIASES = Object.freeze({
    "community-teacher": "professor"
  });

  function canonicalId(id) {
    return CHARACTER_ALIASES[id] || id;
  }

  window.ExpresateStudioCharacters = Object.freeze({
    version: 1,
    all: CHARACTERS,
    list() {
      return CHARACTERS.map((entry) => ({ ...entry }));
    },
    get(id) {
      return CHARACTERS.find((entry) => entry.id === canonicalId(id)) || null;
    },
    normalizeRef(value) {
      if (!value) return null;
      if (typeof value === "string") return { id: canonicalId(value), pose: "neutral" };
      if (typeof value === "object" && typeof value.id === "string" && value.id.trim()) {
        return {
          id: canonicalId(value.id.trim()),
          pose: typeof value.pose === "string" && value.pose.trim() ? value.pose.trim() : "neutral"
        };
      }
      return null;
    },
    getPosePath(id, pose) {
      const entry = CHARACTERS.find((character) => character.id === canonicalId(id));
      if (!entry) return null;
      if (pose && entry.poses && entry.poses[pose]) return entry.poses[pose];
      return entry.poses?.neutral || entry.poses?.happy || Object.values(entry.poses || {})[0] || null;
    }
  });
})();
