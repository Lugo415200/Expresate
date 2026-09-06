/* Lesson 000: protected-audio recognition and spelling practice. */
(function () {
  "use strict";

  const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
  const playLetter = (letter, trigger) => window.ExpresateAudio?.play?.(
    `audio/alphabet/${String(letter).toLowerCase()}.mp3`,
    { trigger: trigger || null, fallbackText: String(letter).toUpperCase(), speechType: "letter" }
  );
  const shuffle = (items) => items.slice().sort(() => Math.random() - 0.5);
  const unlock = (root) => {
    const button = root.closest(".flashcard")?.querySelector("[data-fc-listo]");
    if (button) button.hidden = false;
  };
  const playSequence = (letters, trigger) => {
    window.ExpresateAudio?.stop?.();
    letters.forEach((letter, index) => window.setTimeout(() => playLetter(letter, index === 0 ? trigger : null), index * 720));
  };

  function setupRecognition() {
    const root = document.querySelector("[data-letter-recognition]");
    if (!root) return;
    const rounds = window.ExpresateLesson000.recognition;
    const roundLabel = root.querySelector("[data-recognition-round]");
    const options = root.querySelector("[data-recognition-options]");
    const feedback = root.querySelector("[data-recognition-feedback]");
    const play = root.querySelector("[data-recognition-play]");
    let round = 0;
    let locked = false;
    const render = () => {
      const item = rounds[round];
      roundLabel.textContent = String(round + 1);
      options.replaceChildren(...shuffle(item.choices).map((letter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sequence-letter-choice";
        button.dataset.letter = letter;
        button.setAttribute("aria-label", `Elegir letra ${letter.toUpperCase()}`);
        button.textContent = letter.toUpperCase();
        return button;
      }));
      feedback.textContent = "Escucha y elige una letra.";
      locked = false;
    };
    play.addEventListener("click", () => playLetter(rounds[round].target, play));
    options.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-letter]");
      if (!button || locked) return;
      const correct = button.dataset.letter === rounds[round].target;
      if (!correct) {
        button.classList.add("is-wrong");
        feedback.textContent = "Casi. Escucha otra vez.";
        window.setTimeout(() => button.classList.remove("is-wrong"), 420);
        return;
      }
      locked = true;
      button.classList.add("is-correct");
      feedback.textContent = `¡Exacto! Esa es la letra ${rounds[round].target.toUpperCase()}.`;
      if (round === rounds.length - 1) {
        unlock(root);
        return;
      }
      window.setTimeout(() => { round += 1; render(); playLetter(rounds[round].target, play); }, 850);
    });
    render();
  }

  function setupFirstListen() {
    const root = document.querySelector("[data-first-listen]");
    if (!root) return;
    const play = root.querySelector("[data-first-listen-play]");
    const options = root.querySelector("[data-first-listen-options]");
    const feedback = root.querySelector("[data-first-listen-feedback]");
    play.addEventListener("click", () => {
      play.classList.remove("is-listen-prompt");
      playLetter("a", play);
    });
    options.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-letter]");
      if (!button) return;
      if (button.dataset.letter === "a") {
        button.classList.add("is-correct");
        feedback.textContent = "¡Exacto! Escuchaste la letra A.";
        unlock(root);
      } else {
        button.classList.add("is-wrong");
        feedback.textContent = "Casi. Escucha otra vez.";
        window.setTimeout(() => button.classList.remove("is-wrong"), 420);
      }
    });
  }

  function setupSequenceBuilder(root, config) {
    const rounds = config.rounds;
    const roundLabel = root.querySelector(config.roundSelector);
    const options = root.querySelector(config.optionsSelector);
    const slots = root.querySelector(config.slotsSelector);
    const feedback = root.querySelector(config.feedbackSelector);
    const play = root.querySelector(config.playSelector);
    const clear = root.querySelector(config.clearSelector);
    if (!options || !slots || !feedback || !play) return;
    let round = 0;
    let selected = [];
    const render = () => {
      const item = rounds[round];
      if (roundLabel) roundLabel.textContent = String(round + 1);
      slots.replaceChildren(...item.target.map((_, index) => {
        const slot = document.createElement("span");
        slot.className = "sequence-slot";
        slot.textContent = selected[index] || "";
        return slot;
      }));
      options.replaceChildren(...shuffle(item.choices).map((letter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sequence-letter-choice";
        button.dataset.letter = letter;
        button.textContent = letter;
        button.disabled = selected.filter((value) => value === letter).length >= item.target.filter((value) => value === letter).length;
        button.setAttribute("aria-label", `Añadir letra ${letter}`);
        return button;
      }));
      feedback.textContent = selected.length ? "Sigue construyendo la secuencia." : "Toca las letras en el orden que escuchaste.";
    };
    const check = () => {
      const target = rounds[round].target;
      if (selected.length !== target.length) return;
      if (selected.join("") !== target.join("")) {
        feedback.textContent = "Casi. Escucha la secuencia otra vez y corrige tus letras.";
        slots.classList.add("is-wrong");
        window.setTimeout(() => { slots.classList.remove("is-wrong"); selected = []; render(); }, 700);
        return;
      }
      feedback.textContent = config.successText || `¡Muy bien! Construiste ${target.join(" · ")}.`;
      slots.classList.add("is-correct");
      if (round === rounds.length - 1) {
        unlock(root);
        return;
      }
      window.setTimeout(() => { round += 1; selected = []; slots.classList.remove("is-correct"); render(); }, 900);
    };
    play.addEventListener("click", () => playSequence(rounds[round].target, play));
    clear?.addEventListener("click", () => { selected = []; render(); });
    options.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-letter]");
      if (!button || button.disabled) return;
      selected.push(button.dataset.letter);
      render();
      check();
    });
    render();
  }

  function setupWordSpelling() {
    const root = document.querySelector("[data-word-spelling]");
    if (!root) return;
    setupSequenceBuilder(root, {
      rounds: [{ target: ["w", "a", "l", "k"], choices: ["w", "a", "l", "k", "m", "t"] }],
      successText: "¡Muy bien! Formaste WALK.",
      optionsSelector: "[data-word-spelling-options]", slotsSelector: "[data-word-spelling-slots]", feedbackSelector: "[data-word-spelling-feedback]", playSelector: "[data-word-spelling-play]", clearSelector: "[data-word-spelling-clear]"
    });
  }

  function setupStoryReturn() {
    const card = document.querySelector("[data-fc-id='story-return']");
    const ready = card?.querySelector("[data-story-return-ready]");
    if (!card || !window.ExpresateDialogueEngine) return;
    let started = false;

    const closeOverlay = (overlay, preserveScrollLock) => {
      overlay.classList.add("is-leaving");
      window.setTimeout(() => {
        overlay.remove();
        if (!preserveScrollLock) document.body.classList.remove("lesson-final-cinematic-open");
      }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 260);
    };

    const showRetoTransition = () => {
      const overlay = document.createElement("div");
      overlay.className = "lesson-final-cinematic lesson-final-reto";
      overlay.innerHTML = `<section class="lesson-final-reto-panel" role="dialog" aria-modal="true" aria-labelledby="finalRetoTitle" tabindex="-1"><p>Reto final</p><h2 id="finalRetoTitle">¿Puedes reconocer las letras solo por su sonido?</h2><span>Ayuda a Sofía a construir su nombre.</span><button class="btn primary" type="button">Comenzar reto →</button></section>`;
      document.body.appendChild(overlay);
      document.body.classList.add("lesson-final-cinematic-open");
      const panel = overlay.querySelector(".lesson-final-reto-panel");
      window.requestAnimationFrame(() => { overlay.classList.add("is-open"); panel.focus(); });
      panel.querySelector("button").addEventListener("click", () => {
        closeOverlay(overlay);
        ready.hidden = false;
        ready.textContent = "El reto final está listo.";
        unlock(card);
        window.setTimeout(() => card.querySelector("[data-fc-listo]")?.click(), 280);
      });
    };

    const start = () => {
      if (started || !card.classList.contains("is-current")) return;
      started = true;
      const overlay = document.createElement("div");
      overlay.className = "lesson-final-cinematic lesson-final-story";
      const mount = document.createElement("div");
      mount.className = "lesson-final-story-mount";
      overlay.appendChild(mount);
      document.body.appendChild(overlay);
      document.body.classList.add("lesson-final-cinematic-open");
      window.requestAnimationFrame(() => overlay.classList.add("is-open"));
      window.ExpresateDialogueEngine.start({
        mount,
        mode: "scene",
        scene: {
          background: "assets/backgrounds/classroom/classroom-day.webp",
          location: "Clase de inglés",
          nextLabel: "Siguiente →",
          completeLabel: "Ir al reto →",
          dialogue: [
            { speaker: "sofia", pose: "happy", text: "Antes de irme… ¿me ayudas con mi nombre?" },
            { speaker: "sofia", pose: "thinking", text: "Quiero ver si puedes reconocer mis letras solo al escucharlas." },
            { speaker: "professor", pose: "neutral", text: "Escucha con calma. Reconoce cada letra y ayúdala a construir su nombre." }
          ]
        },
        onComplete: () => { closeOverlay(overlay, true); showRetoTransition(); }
      });
    };
    new MutationObserver(start).observe(card, { attributes: true, attributeFilter: ["class"] });
    start();
  }

  function setupMastery() {
    const root = document.querySelector("[data-final-mastery]");
    if (!root) return;
    const target = ["s", "o", "f", "i", "a"];
    const choices = ["s", "o", "f", "i", "a", "m", "t", "r", "b", "l"];
    const options = root.querySelector("[data-mastery-options]");
    const slots = root.querySelector("[data-mastery-slots]");
    const feedback = root.querySelector("[data-mastery-feedback]");
    const reset = root.querySelector("[data-mastery-reset]");
    let selected = [];
    let heard = null;
    const renderSlots = () => {
      slots.replaceChildren(...target.map((_, index) => {
        const slot = document.createElement("span");
        slot.className = "final-answer-slot";
        slot.textContent = selected[index] || "";
        return slot;
      }));
    };
    const renderOptions = () => {
      options.replaceChildren(...shuffle(choices).map((letter, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "final-audio-tile";
        button.dataset.letter = letter;
        button.dataset.option = String(index + 1);
        button.setAttribute("aria-label", `Reproducir opción de letra ${index + 1}`);
        button.innerHTML = `<span class="final-audio-icon" aria-hidden="true">🔊</span><span class="final-audio-letter" aria-hidden="true"></span>`;
        return button;
      }));
    };
    const reveal = (button, letter) => {
      button.classList.add("is-revealed");
      button.querySelector(".final-audio-letter").textContent = letter.toUpperCase();
    };
    const showSuccess = () => {
      const overlay = document.createElement("div");
      overlay.className = "lesson-final-cinematic lesson-final-story";
      const mount = document.createElement("div");
      mount.className = "lesson-final-story-mount";
      overlay.appendChild(mount);
      document.body.appendChild(overlay);
      document.body.classList.add("lesson-final-cinematic-open");
      window.requestAnimationFrame(() => overlay.classList.add("is-open"));
      window.ExpresateDialogueEngine.start({
        mount,
        mode: "scene",
        scene: { background: "assets/backgrounds/classroom/classroom-day.webp", location: "Clase de inglés", completeLabel: "Continuar →", dialogue: [{ speaker: "sofia", pose: "happy", text: "¡Ese es mi nombre! Sofia." }] },
        onComplete: () => {
          overlay.remove();
          document.body.classList.remove("lesson-final-cinematic-open");
          unlock(root);
          root.closest(".flashcard")?.querySelector("[data-fc-listo]")?.click();
        }
      });
    };
    const resetChallenge = () => {
      selected = [];
      heard = null;
      renderSlots();
      renderOptions();
      feedback.textContent = "Escucha con calma y elige la primera letra.";
    };
    options.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-letter]");
      if (!button || button.disabled) return;
      const letter = button.dataset.letter;
      if (heard !== button) {
        heard?.classList.remove("is-auditioned");
        heard = button;
        button.classList.add("is-auditioned");
        playLetter(letter, button);
        feedback.textContent = "Escuchaste una opción. Tócala otra vez para elegirla.";
        return;
      }
      reveal(button, letter);
      if (letter !== target[selected.length]) {
        button.classList.add("is-wrong");
        feedback.textContent = "Escucha otra vez.";
        heard = null;
        window.setTimeout(() => button.classList.remove("is-wrong", "is-auditioned"), 550);
        return;
      }
      selected.push(letter);
      button.disabled = true;
      button.classList.remove("is-auditioned");
      button.classList.add("is-used");
      heard = null;
      renderSlots();
      feedback.textContent = selected.length === target.length ? "¡Excelente! Reconociste las letras de Sofía." : "¡Muy bien! Escucha la siguiente letra.";
      if (selected.length === target.length) window.setTimeout(showSuccess, 750);
    });
    reset?.addEventListener("click", resetChallenge);
    resetChallenge();
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupFirstListen();
    setupRecognition();
    setupSequenceBuilder(document.querySelector("[data-sequence-builder]"), {
      rounds: window.ExpresateLesson000.spelling,
      roundSelector: "[data-sequence-round]", optionsSelector: "[data-sequence-options]", slotsSelector: "[data-sequence-slots]", feedbackSelector: "[data-sequence-feedback]", playSelector: "[data-sequence-play]", clearSelector: "[data-sequence-clear]"
    });
    setupWordSpelling();
    setupStoryReturn();
    setupMastery();
  });
})();
