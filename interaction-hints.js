(function (window, document) {
  "use strict";

  const demoDefinitions = {
    "tap-letter": {
      targetSelector: "[data-fc-id='alphabet-grid'] .alphabet-grid-compact",
      targetFilter: ".letter-btn[data-letter]"
    },
    "press-listen": { visualOnly: true },
    "press-speak": { visualOnly: true },
    "open-consejo": { visualOnly: true },
    "earn-xp": { visualOnly: true },
    "build-streak": { visualOnly: true },
    "complete-activity": { visualOnly: true }
  };

  function initVisualDemo(hint) {
    hint.classList.add("is-guided-demo");
  }

  function dismiss(hint) {
    if (hint.hidden || hint.classList.contains("is-dismissed")) return;
    hint.classList.add("is-dismissed");
    window.setTimeout(function () {
      hint.hidden = true;
    }, 220);
  }

  function initHint(hint) {
    const type = hint.dataset.demo;
    const definition = demoDefinitions[type];
    if (!definition) return;

    if (definition.visualOnly) {
      initVisualDemo(hint);
      return;
    }

    const target = document.querySelector(hint.dataset.demoTarget || definition.targetSelector);
    if (!target) return;

    target.addEventListener("pointerdown", function (event) {
      if (event.target.closest(definition.targetFilter)) dismiss(hint);
    }, true);

    target.addEventListener("click", function (event) {
      if (event.target.closest(definition.targetFilter)) dismiss(hint);
    }, true);
  }

  function init(scope) {
    (scope || document).querySelectorAll("[data-demo]").forEach(initHint);
  }

  window.ExpresateInteractionHints = { init: init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { init(); }, { once: true });
  } else {
    init();
  }
})(window, document);
