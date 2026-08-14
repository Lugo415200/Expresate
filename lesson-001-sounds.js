/* Lesson 001 scene bootstrap. Reuses the shared dialogue engine and story registry. */
(function () {
  "use strict";

  function dialogueFor(scene) {
    var characters = {};
    (scene.characters || []).forEach(function (entry) { characters[entry.id] = entry; });
    return (scene.dialogue || []).map(function (line) {
      var parts = String(line).split(":");
      var name = parts.shift().trim();
      var key = name.toLowerCase() === "teacher" ? "professor" : name.toLowerCase();
      return {
        speaker: characters[key] || { id: key, pose: "neutral" },
        speakerLabel: name === "Teacher" ? "Profesor" : name,
        location: scene.setting,
        text: parts.join(":").trim()
      };
    }).filter(function (line) { return line.text; });
  }

  function initStory() {
    var root = document.querySelector("[data-lesson001-story]");
    var start = root && root.querySelector("[data-story-start]");
    var mount = root && root.querySelector("[data-story-mount]");
    var store = window.ExpresateStudioStoryScenes;
    var engine = window.ExpresateDialogueEngine;
    if (!root || !start || !mount || !store || !engine) return;

    var scene = store.list().filter(function (entry) {
      return entry.lessonSlug === "lesson-001-sounds" && entry.status === "ready";
    })[0];
    if (!scene) return;

    document.body.classList.add("lesson001-story-active");
    start.addEventListener("click", function () {
      start.closest("[data-story-orientation]").hidden = true;
      engine.start({
        mount: mount,
        mode: "scene",
        scene: {
          background: "assets/backgrounds/classroom/classroom-day.webp",
          location: scene.setting,
          nextLabel: "Siguiente →",
          completeLabel: "Entrar al laboratorio →",
          dialogue: dialogueFor(scene)
        },
        onComplete: function () {
          root.hidden = true;
          document.body.classList.remove("lesson001-story-active");
        }
      });
    }, { once: true });
  }

  function showUnavailable() {
    var story = document.querySelector("[data-lesson001-story]");
    var shell = document.querySelector(".shell");
    if (story) story.hidden = true;
    if (shell) shell.hidden = true;
    if (document.querySelector("[data-lesson001-unavailable]")) return;

    var panel = document.createElement("main");
    panel.className = "lesson001-unavailable";
    panel.setAttribute("data-lesson001-unavailable", "");
    panel.innerHTML = '<span>Lección 001</span><h1>Próximamente</h1><p>Esta lección estará disponible muy pronto.</p><a class="btn primary" href="curso.html">Volver al curso</a>';
    document.body.appendChild(panel);
  }

  function hydrateNextLesson() {
    var modules = (window.ExpresateLessons && window.ExpresateLessons.modules) || [];
    var found = false;
    var next = null;
    modules.some(function (module) {
      return (module.steps || []).some(function (step) {
        if (found) { next = step; return true; }
        if (step.id === "lesson-001-sounds") found = true;
        return false;
      });
    });
    if (!next || !next.href) return;
    document.querySelectorAll("[data-next-lesson]").forEach(function (link) {
      link.href = next.href;
      var title = link.querySelector(".title");
      if (title) title.textContent = next.title || title.textContent;
    });
  }

  document.addEventListener("lesson-audio-unavailable", showUnavailable);

  document.addEventListener("DOMContentLoaded", function () {
    window.ExpresateLessonAudioReadiness.getReadiness("lesson-001-sounds").then(function (state) {
      if (!state.ready) {
        showUnavailable();
        return;
      }
      if (window.ExpresateContrast) window.ExpresateContrast.init();
      hydrateNextLesson();
      initStory();
    });
  });
})();
