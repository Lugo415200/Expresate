/* ================================================================
   home.js - Guided onboarding + returning home hub for Expresate.
   Static, GitHub Pages compatible, and localStorage-safe.
   ================================================================ */
(function () {
  "use strict";

  var ONBOARDING_DONE_KEY = "expresate_home_onboarding_done";
  var LAST_ACTION_KEY = "expresate_home_last_recommended_action";

  var GOALS = {
    trabajo: {
      title: "Ruta: Inglés profesional",
      sub: "Aprende a comunicarte con claridad en el trabajo: correos, reuniones y presentaciones.",
      items: [
        "Lección 1: Preséntate en inglés",
        "Vocabulario del trabajo y oficina",
        "Frases para correos y reuniones"
      ],
      cta: "curso.html",
      ctaLabel: "Empezar lección 1 →",
      hubTitle: "Inglés profesional",
      hubText: "Sigue con frases utiles para trabajo, correos y reuniones."
    },
    viaje: {
      title: "Ruta: Inglés para viajeros",
      sub: "Maneja aeropuertos, hoteles, restaurantes y situaciones cotidianas con confianza.",
      items: [
        "Lección 1: En el aeropuerto",
        "Vocabulario de viaje esencial",
        "Frases para pedir ayuda"
      ],
      cta: "curso.html",
      ctaLabel: "Empezar lección 1 →",
      hubTitle: "Inglés para viajar",
      hubText: "Practica las frases que más ayudan en viajes y situaciones rápidas."
    },
    cotidiano: {
      title: "Ruta: Inglés del día a día",
      sub: "Aprende a hablar con naturalidad en conversaciones cotidianas desde el primer día.",
      items: [
        "Lección 1: Saludos y presentaciones",
        "Verbos más usados en la vida real",
        "Frases para conversaciones básicas"
      ],
      cta: "curso.html",
      ctaLabel: "Empezar lección 1 →",
      hubTitle: "Inglés del día a día",
      hubText: "Continua con conversaciones simples y patrones que puedes usar hoy."
    },
    basico: {
      title: "Ruta: Inglés desde cero",
      sub: "Empieza por lo más fundamental, sin presión, paso a paso y con mucha práctica.",
      items: [
        "Lección 1: El alfabeto y pronunciación",
        "Números, colores y objetos básicos",
        "Las primeras 50 palabras esenciales"
      ],
      cta: "curso.html",
      ctaLabel: "Empezar lección 1 →",
      hubTitle: "Inglés desde cero",
      hubText: "Empieza por la base: sonidos, primeras palabras y practica guiada."
    }
  };

  var DEFAULT_GOAL = "cotidiano";
  var TOTAL_STEPS = 5;
  var currentStep = 0;
  var selectedGoal = null;
  var isAnimating = false;
  var T_OUT = 200;
  var T_IN = 300;

  var noMotion = !!(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  var steps = [];
  var dots = [];
  var guidedFlow = null;
  var homeHub = null;

  function init() {
    guidedFlow = document.getElementById("guidedFlow");
    homeHub = document.getElementById("homeHub");
    steps = Array.prototype.slice.call(document.querySelectorAll(".flow-step"));
    dots = Array.prototype.slice.call(document.querySelectorAll(".flow-dot"));

    if (!guidedFlow || !steps.length) return;

    showStepInstant(0);
    wireEvents();
    updateHub();
    chooseInitialView();
  }

  function wireEvents() {
    document.querySelectorAll(".step-next").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goTo(parseInt(btn.getAttribute("data-next"), 10), "forward");
      });
    });

    document.querySelectorAll(".step-back").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goTo(parseInt(btn.getAttribute("data-back"), 10), "back");
      });
    });

    document.querySelectorAll(".goal-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedGoal = btn.getAttribute("data-goal") || DEFAULT_GOAL;

        document.querySelectorAll(".goal-btn").forEach(function (b) {
          b.classList.toggle("is-selected", b === btn);
        });

        buildPathStep(selectedGoal);
        saveLastAction(selectedGoal);

        setTimeout(function () { goTo(3, "forward"); }, 240);
      });
    });

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        if (i < currentStep) goTo(i, "back");
      });
    });

    var skip = document.getElementById("skipOnboarding");
    if (skip) {
      skip.addEventListener("click", function () {
        completeOnboarding();
        showHub();
      });
    }

    document.querySelectorAll(".finish-onboarding").forEach(function (btn) {
      btn.addEventListener("click", function () {
        completeOnboarding();
        showHub();
      });
    });

    document.querySelectorAll("[data-complete-onboarding]").forEach(function (link) {
      link.addEventListener("click", function () {
        completeOnboarding();
      });
    });

    var repeat = document.getElementById("repeatGuide");
    if (repeat) {
      repeat.addEventListener("click", function () {
        showFlow();
        showStepInstant(0);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (homeHub && !homeHub.hidden) return;

      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (currentStep !== 2 && currentStep < TOTAL_STEPS - 1) {
          goTo(currentStep + 1, "forward");
        }
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentStep > 0) goTo(currentStep - 1, "back");
      }
    });

    if (window.Progress && typeof window.Progress.on === "function") {
      window.Progress.on("change", updateHub);
    }

    watchAuthChanges();
  }

  function chooseInitialView() {
    if (isOnboardingDone()) {
      showHub();
      return;
    }

    getSessionWithTimeout().then(function (session) {
      if (session && session.user) {
        showHub();
      } else if (!isOnboardingDone()) {
        showFlow();
      }
    });
  }

  function watchAuthChanges() {
    var sb = window.supabaseClient;
    if (!sb || !sb.auth || typeof sb.auth.onAuthStateChange !== "function") return;

    try {
      sb.auth.onAuthStateChange(function (_event, session) {
        if (session && session.user) showHub();
      });
    } catch (_) {}
  }

  function getSessionWithTimeout() {
    var sb = window.supabaseClient;
    if (!sb || !sb.auth || typeof sb.auth.getSession !== "function") {
      return Promise.resolve(null);
    }

    var sessionPromise = sb.auth.getSession()
      .then(function (res) { return res && res.data && res.data.session; })
      .catch(function () { return null; });

    var timeoutPromise = new Promise(function (resolve) {
      setTimeout(function () { resolve(null); }, 700);
    });

    return Promise.race([sessionPromise, timeoutPromise]);
  }

  function showFlow() {
    if (homeHub) homeHub.hidden = true;
    if (guidedFlow) guidedFlow.hidden = false;
    document.body.classList.add("home-showing-flow");
    document.body.classList.remove("home-showing-hub");
    updateDots();
    window.scrollTo(0, 0);
  }

  function showHub() {
    updateHub();
    if (guidedFlow) guidedFlow.hidden = true;
    if (homeHub) homeHub.hidden = false;
    document.body.classList.add("home-showing-hub");
    document.body.classList.remove("home-showing-flow");
    window.scrollTo(0, 0);
  }

  function completeOnboarding() {
    safeSet(ONBOARDING_DONE_KEY, "1");
    if (selectedGoal) saveLastAction(selectedGoal);
  }

  function isOnboardingDone() {
    return safeGet(ONBOARDING_DONE_KEY) === "1";
  }

  function saveLastAction(goal) {
    var data = GOALS[goal] || GOALS[DEFAULT_GOAL];
    safeSet(LAST_ACTION_KEY, JSON.stringify({
      goal: goal,
      title: data.hubTitle,
      text: data.hubText,
      href: data.cta,
      label: "Continuar →"
    }));
  }

  function readLastAction() {
    try {
      var parsed = JSON.parse(safeGet(LAST_ACTION_KEY) || "null");
      if (parsed && parsed.href && parsed.title) return parsed;
    } catch (_) {}
    return null;
  }

  function updateHub() {
    var action = readLastAction();
    var titleEl = document.getElementById("hubRecommendedTitle");
    var textEl = document.getElementById("hubRecommendedText");
    var ctaEl = document.getElementById("hubRecommendedCta");

    if (action) {
      if (titleEl) titleEl.textContent = action.title;
      if (textEl) textEl.textContent = action.text || "Continua con tu ruta recomendada.";
      if (ctaEl) {
        ctaEl.href = action.href;
        ctaEl.textContent = action.label || "Continuar →";
      }
    }

    var xpEl = document.getElementById("hubXp");
    var streakEl = document.getElementById("hubStreak");
    var progress = window.Progress;

    if (progress) {
      try {
        var xp = typeof progress.getXP === "function" ? progress.getXP() : 0;
        var streak = typeof progress.getStreak === "function" ? progress.getStreak() : 0;
        if (xpEl) xpEl.textContent = xp + " XP";
        if (streakEl) {
          streakEl.textContent = streak > 0
            ? streak + " día" + (streak === 1 ? "" : "s") + " de racha"
            : "Empieza tu racha hoy";
        }
      } catch (_) {}
    }
  }

  function showStepInstant(targetStep) {
    steps.forEach(function (el, i) {
      el.classList.toggle("is-active", i === targetStep);
      el.style.cssText = "";
    });
    currentStep = targetStep;
    isAnimating = false;
    updateDots();
  }

  function goTo(targetStep, direction) {
    if (isAnimating) return;
    if (targetStep === currentStep) return;
    if (targetStep < 0 || targetStep >= TOTAL_STEPS) return;

    if (targetStep === 3 && !selectedGoal) {
      goTo(2, direction || "forward");
      return;
    }

    isAnimating = true;
    direction = direction || (targetStep > currentStep ? "forward" : "back");

    var fromEl = steps[currentStep];
    var toEl = steps[targetStep];

    if (noMotion) {
      showStepInstant(targetStep);
      window.scrollTo(0, 0);
      return;
    }

    var exitY = direction === "forward" ? "-20px" : "20px";
    var enterY = direction === "forward" ? "24px" : "-24px";

    fromEl.style.transition = "opacity " + T_OUT + "ms ease, transform " + T_OUT + "ms ease";
    fromEl.style.opacity = "0";
    fromEl.style.transform = "translateY(" + exitY + ")";

    setTimeout(function () {
      fromEl.classList.remove("is-active");
      fromEl.style.cssText = "";

      toEl.style.cssText = "opacity:0;transform:translateY(" + enterY + ");transition:none";
      toEl.classList.add("is-active");
      void toEl.offsetHeight;

      toEl.style.transition = "opacity " + T_IN + "ms ease, transform " + T_IN + "ms ease";
      toEl.style.opacity = "1";
      toEl.style.transform = "translateY(0)";

      setTimeout(function () {
        toEl.style.cssText = "";
        currentStep = targetStep;
        updateDots();
        isAnimating = false;
        window.scrollTo(0, 0);
      }, T_IN);
    }, T_OUT);
  }

  function updateDots() {
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === currentStep);
      dot.classList.toggle("is-visited", i < currentStep);
    });
  }

  function buildPathStep(goal) {
    var data = GOALS[goal] || GOALS[DEFAULT_GOAL];
    var titleEl = document.getElementById("pathTitle");
    var subEl = document.getElementById("pathSub");
    var recEl = document.getElementById("pathRec");

    if (titleEl) titleEl.textContent = data.title;
    if (subEl) subEl.textContent = data.sub;
    if (!recEl) return;

    recEl.innerHTML =
      data.items.map(function (item, idx) {
        return (
          "<div class=\"path-rec-item\">" +
          "<span class=\"path-rec-num\">" + (idx + 1) + "</span>" +
          "<span class=\"path-rec-text\">" + esc(item) + "</span>" +
          "</div>"
        );
      }).join("") +
      "<a class=\"btn primary path-rec-cta\" href=\"" + esc(data.cta) + "\" data-complete-onboarding>" +
        esc(data.ctaLabel) +
      "</a>";

    var cta = recEl.querySelector("[data-complete-onboarding]");
    if (cta) {
      cta.addEventListener("click", function () {
        completeOnboarding();
      });
    }
  }

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {}
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
