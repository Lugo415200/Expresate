(function () {
  "use strict";

  function normalizeCharacterRef(registry, value) {
    if (registry?.normalizeRef) return registry.normalizeRef(value);
    if (!value) return null;
    if (typeof value === "string") return { id: value, pose: "neutral" };
    if (typeof value === "object" && typeof value.id === "string") {
      return { id: value.id, pose: value.pose || "neutral" };
    }
    return null;
  }

  function displayCharacterName(registry, id) {
    if (!id) return "Exprésate";
    const entry = registry?.get?.(id);
    if (entry?.name) return entry.name;
    if (id === "community-teacher") return "Teacher";
    return id;
  }

  function fallbackInitial(name) {
    return String(name || "E").trim().charAt(0).toUpperCase() || "E";
  }

  function resolveLines(scene) {
    if (Array.isArray(scene)) return scene;
    if (Array.isArray(scene?.dialogue)) return scene.dialogue;
    if (Array.isArray(scene?.lines)) return scene.lines;
    return [];
  }

  function createMarkup() {
    const root = document.createElement("main");
    root.className = "exp-dialogue";
    root.innerHTML = [
      '<section class="exp-dialogue__scene" data-dialogue-scene>',
      '  <div class="exp-dialogue__location" data-dialogue-location></div>',
      '  <div class="exp-dialogue__stage">',
      '    <img class="exp-dialogue__portrait" data-dialogue-portrait alt="" hidden />',
      '    <div class="exp-dialogue__fallback" data-dialogue-fallback aria-hidden="true">E</div>',
      "  </div>",
      '  <div class="exp-dialogue__box" data-dialogue-box tabindex="0" role="button" aria-label="Advance dialogue">',
      '    <div class="exp-dialogue__nameplate" data-dialogue-speaker></div>',
      '    <p class="exp-dialogue__text" data-dialogue-text></p>',
      '    <div class="exp-dialogue__controls">',
      '      <button class="exp-dialogue__next" type="button" data-dialogue-next>Siguiente →</button>',
      "    </div>",
      "  </div>",
      "</section>"
    ].join("");
    return root;
  }

  function start(options) {
    const mount = options?.mount;
    const scene = options?.scene;
    const onComplete = typeof options?.onComplete === "function" ? options.onComplete : function () {};

    if (!mount || !(mount instanceof Element)) {
      throw new Error("ExpresateDialogueEngine.start requires a valid mount element.");
    }

    const registry = window.ExpresateStudioCharacters || null;
    const root = createMarkup();
    mount.replaceChildren(root);

    const lines = resolveLines(scene);
    const sceneEl = root.querySelector("[data-dialogue-scene]");
    const portrait = root.querySelector("[data-dialogue-portrait]");
    const fallback = root.querySelector("[data-dialogue-fallback]");
    const speaker = root.querySelector("[data-dialogue-speaker]");
    const text = root.querySelector("[data-dialogue-text]");
    const nextButton = root.querySelector("[data-dialogue-next]");
    const location = root.querySelector("[data-dialogue-location]");
    const box = root.querySelector("[data-dialogue-box]");
    const nextLabel = scene?.nextLabel || "Siguiente →";
    const completeLabel = scene?.completeLabel || "Start lesson →";

    let currentLine = 0;
    let typingTimer = null;
    let isTyping = false;
    let currentFullText = "";
    let destroyed = false;
    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function clearTyping() {
      if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
      }
    }

    function finishTyping() {
      clearTyping();
      text.textContent = currentFullText;
      text.classList.remove("is-typing");
      isTyping = false;
    }

    function typeWriter(value) {
      clearTyping();
      currentFullText = value || "";
      text.textContent = "";

      if (prefersReducedMotion) {
        text.textContent = currentFullText;
        text.classList.remove("is-typing");
        isTyping = false;
        return;
      }

      text.classList.add("is-typing");
      isTyping = true;
      let index = 0;
      const speed = 30;

      function step() {
        if (destroyed) return;
        text.textContent = currentFullText.slice(0, index);
        if (index < currentFullText.length) {
          index += 1;
          typingTimer = window.setTimeout(step, speed);
        } else {
          text.classList.remove("is-typing");
          isTyping = false;
        }
      }

      step();
    }

    function setPortrait(line) {
  const ref = normalizeCharacterRef(registry, line?.speaker || line?.character);
  const characterId = ref?.id || "narrator";
  const pose = line?.pose || ref?.pose || "neutral";
  const name = line?.speakerLabel || displayCharacterName(registry, characterId);
  const posePath = line?.posePath || registry?.getPosePath?.(characterId, pose) || "";

  speaker.textContent = name;
  location.textContent = line?.location || scene?.location || "Exprésate";

  fallback.textContent = line?.fallback || fallbackInitial(name);

  // Hide both while deciding what to show
  fallback.hidden = true;
  portrait.hidden = true;

  portrait.removeAttribute("src");
  portrait.alt = name;

  if (!posePath) {
    fallback.hidden = false;
    return;
  }

  const probe = new Image();

  probe.onload = function () {
    if (destroyed) return;

    portrait.src = posePath;
    portrait.hidden = false;
    fallback.hidden = true;
  };

  probe.onerror = function () {
    portrait.hidden = true;
    fallback.hidden = false;
  };

  probe.src = posePath;
}

    function renderLine() {
      if (!lines[currentLine]) return;
      const line = lines[currentLine];
      sceneEl.classList.add("is-changing");

      const swap = function () {
        setPortrait(line);
        typeWriter(line?.text || "");
        nextButton.textContent = currentLine === lines.length - 1 ? completeLabel : nextLabel;
        sceneEl.classList.remove("is-changing");
      };

      if (prefersReducedMotion) {
        swap();
      } else {
        window.setTimeout(swap, 140);
      }
    }

    function advance() {
      if (isTyping) {
        finishTyping();
        return;
      }

      if (currentLine < lines.length - 1) {
        currentLine += 1;
        renderLine();
        return;
      }

      onComplete();
    }

    function onKeydown(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        advance();
      }
    }

    nextButton.addEventListener("click", advance);
    box.addEventListener("click", function (event) {
      if (event.target === nextButton) return;
      advance();
    });
    box.addEventListener("keydown", onKeydown);

    renderLine();

    return {
      destroy() {
        destroyed = true;
        clearTyping();
        nextButton.removeEventListener("click", advance);
        box.removeEventListener("keydown", onKeydown);
        mount.replaceChildren();
      }
    };
  }

  window.ExpresateDialogueEngine = {
    start
  };
})();
