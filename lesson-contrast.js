/* Reusable listen-choose-replay interaction for handcrafted lessons. */
(function (global) {
  "use strict";

  function playAudio(button) {
    var src = button.getAttribute("data-contrast-audio");
    var fallback = button.getAttribute("data-contrast-fallback") || "";
    if (src && global.ExpresateAudio) {
      global.ExpresateAudio.play(src, { trigger: button, fallbackText: fallback });
    }
  }

  function setup(root) {
    var answer = root.getAttribute("data-contrast-answer");
    var feedback = root.querySelector("[data-contrast-feedback]");
    var reveal = root.querySelector("[data-contrast-reveal]");
    var continueButton = root.querySelector("[data-fc-listo]");
    var options = Array.prototype.slice.call(root.querySelectorAll("[data-contrast-option]"));
    var complete = false;

    root.querySelectorAll("[data-contrast-play]").forEach(playAudio);
    if (continueButton) continueButton.hidden = true;

    options.forEach(function (option) {
      option.addEventListener("click", function () {
        if (complete) return;
        var correct = option.getAttribute("data-contrast-option") === answer;
        option.classList.remove("is-wrong");
        if (!correct) {
          option.classList.add("is-wrong");
          feedback.textContent = "Casi. Escucha otra vez y fíjate en el sonido.";
          feedback.dataset.state = "retry";
          return;
        }

        complete = true;
        option.classList.add("is-correct");
        options.forEach(function (item) { item.disabled = true; });
        feedback.textContent = root.getAttribute("data-contrast-success") || "¡Buen oído!";
        feedback.dataset.state = "correct";
        if (reveal) reveal.hidden = false;
        if (continueButton) continueButton.hidden = false;
      });
    });
  }

  global.ExpresateContrast = {
    init: function () {
      document.querySelectorAll("[data-contrast]").forEach(function(root) {
        if (!root.closest(".flashcard")?.classList.contains("lesson-window")) return;
        setup(root);
      });
    }
  };
})(window);
