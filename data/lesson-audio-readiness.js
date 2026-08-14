/* Manifest-backed publish readiness for lessons with required human audio. */
(function (global) {
  "use strict";

  var manifestPromise = null;
  var manifestState = null;

  function lessonById(lessonId) {
    var modules = global.ExpresateLessons?.modules || [];
    for (var i = 0; i < modules.length; i += 1) {
      var lesson = (modules[i].steps || []).find(function (step) { return step.id === lessonId; });
      if (lesson) return lesson;
    }
    return null;
  }

  function requiredPaths(lessonId) {
    var paths = lessonById(lessonId)?.requiredAudioPaths;
    return Array.isArray(paths) ? paths.slice() : [];
  }

  function evaluate(lessonId, manifest) {
    var required = requiredPaths(lessonId);
    var available = new Set(Object.values(manifest?.entries || {}).map(function (entry) {
      return String(entry?.path || "").trim();
    }));
    var missing = required.filter(function (path) { return !available.has(path); });
    return { lessonId: lessonId, requiredPaths: required, missingPaths: missing, ready: missing.length === 0 };
  }

  function loadManifest() {
    if (manifestPromise) return manifestPromise;
    manifestPromise = fetch("assets/audio/audio-manifest.json", { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("Audio manifest unavailable.");
        return response.json();
      })
      .then(function (manifest) {
        manifestState = manifest;
        return manifest;
      })
      .catch(function () {
        manifestState = { entries: {} };
        return manifestState;
      });
    return manifestPromise;
  }

  function getCachedReadiness(lessonId) {
    if (!requiredPaths(lessonId).length) return { lessonId: lessonId, ready: true, pending: false };
    if (!manifestState) return { lessonId: lessonId, ready: false, pending: true };
    return Object.assign({ pending: false }, evaluate(lessonId, manifestState));
  }

  global.ExpresateLessonAudioReadiness = Object.freeze({
    getRequiredPaths: requiredPaths,
    evaluateManifest: evaluate,
    getCachedReadiness: getCachedReadiness,
    getReadiness: function (lessonId) {
      return loadManifest().then(function (manifest) { return evaluate(lessonId, manifest); });
    },
    loadManifest: loadManifest
  });
})(window);
