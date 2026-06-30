/* Expresate Studio Animation Library foundation. */
(function () {
  "use strict";

  const ANIMATIONS = Object.freeze([
    {
      id: "slide-fade",
      title: "Slide Fade",
      summary: "Short directional entrance using opacity and a small translate offset.",
      status: "ready",
      trigger: "panel reveal or step change",
      motionType: "opacity and translate",
      intendedUse: "transition",
      duration: "180ms-260ms",
      reducedMotion: "opacity only",
      recommendedFor: ["lesson steps", "modals", "drawers", "preview transitions"],
      avoidFor: ["long paragraphs", "constant looping backgrounds"],
      notes: "Use for calm guided progression."
    },
    {
      id: "soft-pop",
      title: "Soft Pop",
      summary: "Small scale-up and settle motion for selected or newly active elements.",
      status: "ready",
      trigger: "selection, reveal, or hover",
      motionType: "scale and opacity",
      intendedUse: "button interaction",
      duration: "160ms-240ms",
      reducedMotion: "opacity only",
      recommendedFor: ["chips", "cards", "example tiles", "light success feedback"],
      avoidFor: ["large containers", "dense text surfaces"],
      notes: "Keep amplitude low."
    },
    {
      id: "correct-confetti",
      title: "Correct Confetti",
      summary: "Celebratory success accent used when a learner completes or answers correctly.",
      status: "planned",
      trigger: "correct answer or completion",
      motionType: "burst and fade",
      intendedUse: "completion",
      duration: "400ms-900ms",
      reducedMotion: "simple color pulse",
      recommendedFor: ["correct quiz answers", "XP celebrations", "completion cards"],
      avoidFor: ["everyday card hover states"],
      notes: "Use sparingly so rewards stay meaningful."
    },
    {
      id: "wrong-shake",
      title: "Wrong Shake",
      summary: "Short side-to-side error signal that does not feel aggressive.",
      status: "ready",
      trigger: "incorrect answer",
      motionType: "translateX",
      intendedUse: "wrong answer",
      duration: "180ms-260ms",
      reducedMotion: "color or border change only",
      recommendedFor: ["quiz feedback", "small answer cards", "incorrect picks"],
      avoidFor: ["modals", "large shells", "long forms"],
      notes: "Keep displacement small."
    }
  ]);

  window.ExpresateStudioAnimations = Object.freeze({
    version: 1,
    all: ANIMATIONS,
    list() {
      return ANIMATIONS.map((entry) => ({ ...entry }));
    },
    get(id) {
      return ANIMATIONS.find((entry) => entry.id === id) || null;
    }
  });
})();
