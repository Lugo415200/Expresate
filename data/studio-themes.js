/* Expresate Studio Theme Library foundation. */
(function () {
  "use strict";

  const THEMES = Object.freeze([
    {
      id: "workbook-blue",
      title: "Workbook Blue",
      summary: "Readable workbook-style cards with soft blue paper surfaces.",
      tone: "calm, instructional, friendly",
      shell: "light or dark shell with light workbook content surfaces",
      surfaceModel: "paper cards, blue accents, visible but controlled texture",
      textureUsage: "use paper-blue and paper-white lightly on learning cards",
      contrastModel: "high contrast dark text on light surfaces",
      recommendedFor: ["alphabet explorer", "flashcards", "pronunciation lessons", "guided reading"],
      avoidFor: ["checkout", "dense admin-only data tables"],
      notes: "Default learning theme for beginner lesson content."
    },
    {
      id: "playful-purple",
      title: "Playful Purple",
      summary: "Bright premium shell with stronger accent energy and guided interaction highlights.",
      tone: "playful, confident, premium",
      shell: "dark shell with vivid purple and blue accents",
      surfaceModel: "bright cards floating over a darker background",
      textureUsage: "use selectively for hero moments, exploration modals, and rewards",
      contrastModel: "bright content surfaces over a darker shell",
      recommendedFor: ["onboarding", "exploration modals", "achievement moments", "game-like activities"],
      avoidFor: ["long reading passages", "billing flows"],
      notes: "Use for high-attention moments, not for every page."
    },
    {
      id: "minimal-clean",
      title: "Minimal Clean",
      summary: "Low-distraction instructional presentation with restrained accents.",
      tone: "quiet, clear, modern",
      shell: "subtle background with low visual noise",
      surfaceModel: "clean cards with restrained texture and small accent color",
      textureUsage: "optional and very light",
      contrastModel: "strong text hierarchy and reduced decoration",
      recommendedFor: ["dictionary", "course overviews", "utility screens"],
      avoidFor: ["celebrations that need emotional lift"],
      notes: "Best when clarity matters more than energy."
    }
  ]);

  window.ExpresateStudioThemes = Object.freeze({
    version: 1,
    all: THEMES,
    list() {
      return THEMES.map((entry) => ({ ...entry }));
    },
    get(id) {
      return THEMES.find((entry) => entry.id === id) || null;
    }
  });
})();
