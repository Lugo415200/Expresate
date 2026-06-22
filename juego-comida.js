/* ============================================================
   juego-comida.js — focused Exprésate food speech sandbox.
   Static, GitHub Pages friendly, no backend or audio storage.

   Future leaderboard note:
   Keep all scoring writes funneled through awardSpeechSuccess().
   That is the safest place to later mirror session XP/streak to Supabase.
   ============================================================ */

"use strict";

var STORE_KEY_LEGACY = "expresate_food_game_v3";
var STORE_KEY = "expresate_food_game_v4:guest";
var STORE_KEY_PREFIX = "expresate_food_game_v4:";
var STORE_KEY_V2 = "expresate_food_game_v2";
var STORE_KEY_OLD = "ynoel_food_game_v1";

var CARDS = [
  { id: "apple", es: "manzana", en: "apple", category: "fruta", image: "assets/food/apple.jpg", alt: "manzana / apple", audio: "" },
  { id: "banana", es: "banana", en: "banana", category: "fruta", image: "assets/food/banana.jpg", alt: "banana / banana", audio: "" },
  { id: "bread", es: "pan", en: "bread", category: "básico", image: "assets/food/bread.jpg", alt: "pan / bread", audio: "" },
  { id: "milk", es: "leche", en: "milk", category: "bebida", image: "assets/food/milk.jpg", alt: "leche / milk", audio: "" },
  { id: "water", es: "agua", en: "water", category: "bebida", image: "assets/food/water.jpg", alt: "agua / water", audio: "" },
  { id: "rice", es: "arroz", en: "rice", category: "básico", image: "assets/food/rice.jpg", alt: "arroz / rice", audio: "" },
  { id: "egg", es: "huevo", en: "egg", category: "proteína", image: "assets/food/egg.jpg", alt: "huevo / egg", audio: "" },
  { id: "chicken", es: "pollo", en: "chicken", category: "proteína", image: "assets/food/chicken.jpg", alt: "pollo / chicken", audio: "" },
  { id: "fish", es: "pescado", en: "fish", category: "proteína", image: "assets/food/fish.jpg", alt: "pescado / fish", audio: "" },
  { id: "cheese", es: "queso", en: "cheese", category: "básico", image: "assets/food/cheese.jpg", alt: "queso / cheese", audio: "" },
  { id: "coffee", es: "café", en: "coffee", category: "bebida", image: "assets/food/coffee.jpg", alt: "café / coffee", audio: "" },
  { id: "tea", es: "té", en: "tea", category: "bebida", image: "assets/food/tea.jpg", alt: "té / tea", audio: "" },
];

var SPEECH_ALIASES = {
  apple: ["apple"],
  banana: ["banana"],
  bread: ["bread"],
  milk: ["milk"],
  water: ["water"],
  rice: ["rice"],
  egg: ["egg"],
  chicken: ["chicken"],
  fish: ["fish"],
  cheese: ["cheese"],
  coffee: ["coffee"],
  tea: ["tea", "t", "tee"],
};

var XP_SPEAK = 10;
var _lastStreak = 0;

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ");
}

function getSpeechAliases(card) {
  if (!card) return [];
  return SPEECH_ALIASES[card.id] || [card.en];
}

function defaultState() {
  return {
    mode: "speak",
    index: 0,
    learned: {},
    practice: {},
    spoken: {},
    game: { streak: 0, best: 0 },
    xp: 0,
  };
}

function loadRawState() {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch (e) {
    return null;
  }
}

function loadState() {
  try {
    var raw = loadRawState();
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function validCardMap(map) {
  var ids = CARDS.reduce(function(acc, card) {
    acc[card.id] = true;
    return acc;
  }, {});
  var out = {};
  Object.keys(map || {}).forEach(function(id) {
    if (ids[id]) out[id] = map[id];
  });
  return out;
}

function getState() {
  var saved = loadState() || {};
  var def = defaultState();

  var index = typeof saved.index === "number" ? saved.index : def.index;
  if (index < 0 || index >= CARDS.length || !isFinite(index)) index = 0;

  var savedGame = saved.game && typeof saved.game === "object" ? saved.game : {};
  var streak = typeof savedGame.streak === "number" ? savedGame.streak : 0;
  var best = typeof savedGame.best === "number" ? savedGame.best : 0;
  var xp = typeof saved.xp === "number" ? saved.xp : 0;

  return {
    mode: "speak",
    index: index,
    learned: validCardMap(saved.learned),
    practice: validCardMap(saved.practice),
    spoken: validCardMap(saved.spoken),
    game: { streak: Math.max(0, streak), best: Math.max(0, best) },
    xp: Math.max(0, xp),
  };
}

function setState(patch) {
  var current = getState();
  var next = Object.assign({}, current, patch);
  next.game = Object.assign({}, current.game, patch.game || {});
  saveState(next);
  return next;
}

function currentCard() {
  var s = getState();
  var idx = Math.max(0, Math.min(CARDS.length - 1, s.index));
  return CARDS[idx] || CARDS[0];
}

function renderFoodVisual(card, container) {
  if (!container) return;
  container.innerHTML = "";

  var img = document.createElement("img");
  img.className = "food-photo";
  img.src = card.image || "";
  img.alt = card.alt || (card.es + " / " + card.en);
  img.loading = "eager";
  img.decoding = "async";

  img.onerror = function() {
    container.innerHTML =
      '<div class="food-image-fallback" role="img" aria-label="' + escapeHtml(card.alt || card.es) + '">' +
        '<span class="food-fallback-kicker">Imagen pendiente</span>' +
        '<strong>' + escapeHtml(card.es) + '</strong>' +
        '<small>' + escapeHtml(card.en) + '</small>' +
      '</div>';
  };

  container.appendChild(img);
}

function boot() {
  try {
    if (STORE_KEY.endsWith(":guest") && !localStorage.getItem(STORE_KEY)) {
      var legacy = localStorage.getItem(STORE_KEY_LEGACY) ||
        localStorage.getItem(STORE_KEY_V2) ||
        localStorage.getItem(STORE_KEY_OLD);
      if (legacy) localStorage.setItem(STORE_KEY, legacy);
    }
  } catch (e) {}

  var cardArea = byId("cardArea");
  var foodVisual = byId("foodVisual");
  var gcVisual = byId("gcVisual");
  var gameHUD = byId("gameHUD");
  var cardNumEl = byId("cardNum");
  var cardDotsFooter = byId("cardDotsFooter");
  var wordEs = byId("wordEs");
  var wordEn = byId("wordEn");
  var taskPrompt = byId("taskPrompt");
  var hintLine = byId("hintLine");
  var speechPracticeEl = byId("speechPractice");
  var audioBtn = byId("audioBtn");
  var skipBtn = byId("skipBtn");
  var introScreen = byId("introScreen");
  var startBtn = byId("startBtn");
  var transitionScreen = byId("transitionScreen");
  var transitionWord = byId("transitionWord");
  var resultScreen = byId("resultScreen");
  var resultCard = byId("resultCard");
  var resultKicker = byId("resultKicker");
  var resultTitle = byId("resultTitle");
  var resultMessage = byId("resultMessage");
  var rewardPill = byId("rewardPill");
  var retryBtn = byId("retryBtn");
  var nextBtn = byId("nextBtn");
  var completeScreen = byId("completeScreen");
  var playAgainBtn = byId("playAgainBtn");
  var fallbackPractice = byId("fallbackPractice");
  var fallbackInput = byId("fallbackInput");
  var fallbackCheck = byId("fallbackCheck");
  var resetBtn = byId("resetProgress");
  var resetModal = byId("resetModal");
  var resetCancel = byId("resetCancel");
  var resetConfirm = byId("resetConfirm");
  var speechPractice = null;
  var awaitingAdvance = false;

  var critical = {
    cardArea: cardArea,
    foodVisual: foodVisual,
    gameHUD: gameHUD,
    wordEs: wordEs,
    wordEn: wordEn,
    speechPractice: speechPracticeEl,
  };
  var missing = Object.keys(critical).filter(function(k) { return !critical[k]; });
  if (missing.length > 0) {
    console.error("[juego-comida] Missing DOM elements:", missing);
    if (cardArea) {
      cardArea.innerHTML =
        '<div class="game-boot-error">' +
          '<strong>No se pudo cargar el juego.</strong>' +
          '<p>Faltan elementos: ' + escapeHtml(missing.join(", ")) + '</p>' +
        '</div>';
    }
    return;
  }

  function renderDots(index, total) {
    if (!cardDotsFooter) return;
    cardDotsFooter.innerHTML = "";
    for (var i = 0; i < total; i++) {
      var d = document.createElement("span");
      d.className = "gc-dot-f" + (i < index ? " is-done" : i === index ? " is-current" : "");
      cardDotsFooter.appendChild(d);
    }
    if (cardNumEl) cardNumEl.textContent = (index + 1) + " / " + total;
  }

  function progressBar(percent, label) {
    var safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
    return '' +
      '<div class="game-stat-progress" aria-label="' + escapeHtml(label || "Progreso") + ': ' + safePercent + '%">' +
        '<span style="width:' + safePercent + '%"></span>' +
      '</div>';
  }

  function hudStat(label, value, tone, percent, progressLabel) {
    return '' +
      '<div class="game-stat game-stat-' + tone + '">' +
        '<span class="game-stat-icon" aria-hidden="true"></span>' +
        '<div>' +
          '<div class="game-stat-value">' + value + '</div>' +
          '<div class="game-stat-label">' + label + '</div>' +
          progressBar(percent, progressLabel || label) +
        '</div>' +
      '</div>';
  }

  function renderHUD() {
    var s = getState();
    var spokenCount = Object.keys(s.spoken || {}).length;
    var total = CARDS.length;
    var streak = s.game.streak || 0;
    var best = s.game.best || 0;
    var xp = s.xp || 0;
    var progress = Math.round((spokenCount / total) * 100);
    var positionProgress = Math.round((s.index / total) * 100);

    var streakGrew = streak > _lastStreak;
    gameHUD.innerHTML =
      '<div class="exercise-progress">' +
        '<span class="exercise-count">' + (s.index + 1) + ' / ' + total + '</span>' +
        '<div class="exercise-progress-track" aria-label="Progreso de la ronda: ' + positionProgress + '%">' +
          '<span style="width:' + positionProgress + '%"></span>' +
        '</div>' +
        '<span class="exercise-streak" title="Racha actual">Racha ' + '<span id="hud-streak-val">' + streak + '</span></span>' +
      '</div>';

    if (streakGrew) {
      var sv = byId("hud-streak-val");
      if (sv) {
        sv.classList.remove("streak-pop");
        void sv.offsetWidth;
        sv.classList.add("streak-pop");
      }
    }
    _lastStreak = streak;
  }

  function showXpToast(amount) {
    if (!gcVisual) return;
    var old = gcVisual.querySelector(".gc-xp-toast");
    if (old) old.remove();
    var toast = document.createElement("span");
    toast.className = "gc-xp-toast";
    toast.textContent = "+" + amount + " XP";
    gcVisual.appendChild(toast);
    toast.addEventListener("animationend", function() { toast.remove(); }, { once: true });
  }

  function flashCard(type) {
    if (!cardArea) return;
    cardArea.classList.remove("card-correct", "card-wrong");
    void cardArea.offsetWidth;
    cardArea.classList.add(type === "correct" ? "card-correct" : "card-wrong");
  }

  function updateActiveCard() {
    var s = getState();
    var card = currentCard();
    awaitingAdvance = false;
    cardArea.classList.remove("card-correct", "card-wrong", "is-listening", "is-transitioning-out", "is-transitioning-in");
    if (resultScreen) resultScreen.hidden = true;
    if (completeScreen) completeScreen.hidden = true;
    if (fallbackInput) fallbackInput.value = "";

    renderFoodVisual(card, foodVisual);
    renderDots(s.index, CARDS.length);
    renderHUD();

    wordEs.textContent = card.es;
    wordEn.textContent = card.en;
    if (taskPrompt) taskPrompt.textContent = "Di esta palabra en inglés";
    if (hintLine) hintLine.textContent = "Presiona Hablar y repite la palabra.";
    if (speechPractice) speechPractice.setExpected(card.en, getSpeechAliases(card));
    if (fallbackInput) fallbackInput.placeholder = "Escribe: " + card.en;
  }

  function awardSpeechSuccess(result) {
    var card = currentCard();
    var s = getState();
    var spoken = Object.assign({}, s.spoken || {});
    var learned = Object.assign({}, s.learned || {});
    var already = !!spoken[card.id];
    spoken[card.id] = { correct: true, ts: Date.now(), heard: result.transcript || "" };
    learned[card.id] = true;

    var nextGame = Object.assign({}, s.game || {});
    nextGame.streak = (nextGame.streak || 0) + 1;
    nextGame.best = Math.max(nextGame.best || 0, nextGame.streak);

    var xp = already ? s.xp : (s.xp || 0) + XP_SPEAK;
    setState({ spoken: spoken, learned: learned, game: nextGame, xp: xp });
    if (!already) showXpToast(XP_SPEAK);
    renderHUD();
    flashCard("correct");
    showResult("success", result.transcript || card.en, already ? 0 : XP_SPEAK);
  }

  function showResult(kind, heard, xpAmount) {
    if (!resultScreen || !resultCard) return;
    var card = currentCard();
    awaitingAdvance = kind === "success";
    resultCard.classList.remove("is-success", "is-almost", "is-try-again");
    resultCard.classList.add("is-" + kind);
    resultScreen.hidden = false;
    resultCard.classList.remove("is-animating");
    void resultCard.offsetWidth;
    resultCard.classList.add("is-animating");

    if (kind === "success") {
      resultKicker.textContent = "Correcto";
      resultTitle.textContent = "¡Excelente!";
      resultMessage.textContent = 'Escuché: "' + (heard || card.en) + '"';
      rewardPill.textContent = xpAmount > 0 ? "+" + xpAmount + " XP" : "Ya practicada";
      rewardPill.hidden = false;
      retryBtn.hidden = true;
      nextBtn.hidden = false;
      nextBtn.focus();
      return;
    }

    if (kind === "almost") {
      resultKicker.textContent = "Casi";
      resultTitle.textContent = "Casi lo tienes";
      resultMessage.textContent = heard ? 'Escuché: "' + heard + '"' : "Intenta decirlo una vez más.";
      rewardPill.hidden = true;
      retryBtn.hidden = false;
      nextBtn.hidden = true;
      retryBtn.focus();
      return;
    }

    resultKicker.textContent = "Intenta otra vez";
    resultTitle.textContent = "Inténtalo otra vez";
    resultMessage.textContent = heard ? 'Escuché: "' + heard + '"' : "No pude escuchar bien.";
    rewardPill.hidden = true;
    retryBtn.hidden = false;
    nextBtn.hidden = true;
    retryBtn.focus();
  }

  function handleSpeechResult(result) {
    if (!result || !result.status) return;
    if (result.status === "correct") {
      awardSpeechSuccess(result);
    } else if (result.status === "almost") {
      flashCard("wrong");
      showResult("almost", result.transcript || "", 0);
    } else {
      flashCard("wrong");
      showResult("try-again", result.transcript || "", 0);
    }
  }

  if (speechPracticeEl && window.ExpresateSpeechPractice) {
    speechPractice = window.ExpresateSpeechPractice.create({
      root: speechPracticeEl,
      expected: currentCard().en,
      aliases: getSpeechAliases(currentCard()),
      onResult: handleSpeechResult,
      formatTarget: function(expected) { return expected; },
      labels: {
        correct: "¡Correcto!",
        almost: "Casi",
        tryAgain: "Intenta otra vez",
        heard: "Escuché",
        unsupported: "La práctica de voz funciona mejor en Chrome o Edge.",
        unavailable: "Tu navegador no permite práctica de voz aquí.",
        noMic: "Permite el micrófono para practicar.",
        unclear: "No pude escuchar bien. Intenta otra vez.",
        notAvailable: "La práctica de voz no está disponible ahora."
      }
    });
    if (fallbackPractice && speechPractice.isSupported === false) {
      fallbackPractice.hidden = false;
      if (hintLine) hintLine.textContent = "Tu navegador no permite voz aquí. Puedes practicar escribiendo.";
    }
  } else if (fallbackPractice) {
    fallbackPractice.hidden = false;
  }

  function goNext() {
    if (!awaitingAdvance) return;
    var s = getState();
    if (s.index >= CARDS.length - 1) {
      if (resultScreen) resultScreen.hidden = true;
      if (completeScreen) completeScreen.hidden = false;
      return;
    }
    var nextIndex = s.index + 1;
    var nextCard = CARDS[nextIndex];
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (transitionWord && nextCard) transitionWord.textContent = nextCard.es + " → " + nextCard.en;
    if (cardArea) cardArea.classList.add("is-transitioning-out");
    if (resultScreen) resultScreen.hidden = true;
    if (transitionScreen) {
      transitionScreen.hidden = false;
      transitionScreen.classList.remove("is-running");
      void transitionScreen.offsetWidth;
      transitionScreen.classList.add("is-running");
    }
    var delay = reduceMotion ? 0 : 820;
    setTimeout(function() {
      setState({ index: nextIndex });
      if (transitionScreen) transitionScreen.hidden = true;
      updateActiveCard();
      if (!reduceMotion && cardArea) {
        cardArea.classList.add("is-transitioning-in");
        setTimeout(function() {
          cardArea.classList.remove("is-transitioning-in");
        }, 520);
      }
    }, delay);
  }

  function skipCard() {
    var s = getState();
    var nextGame = Object.assign({}, s.game || {}, { streak: 0 });
    if (s.index >= CARDS.length - 1) {
      setState({ game: nextGame });
      if (completeScreen) completeScreen.hidden = false;
      return;
    }
    setState({ index: s.index + 1, game: nextGame });
    updateActiveCard();
  }

  function playAgain() {
    setState({ index: 0 });
    if (completeScreen) completeScreen.hidden = true;
    if (introScreen) introScreen.hidden = true;
    updateActiveCard();
  }

  function speakCurrentWord() {
    var card = currentCard();
    if (card.audio) {
      try {
        var a = new Audio(card.audio);
        a.currentTime = 0;
        a.play().catch(function() {});
        return;
      } catch (e) {}
    }

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(card.en);
        utterance.lang = "en-US";
        utterance.rate = 0.82;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  }

  function checkFallbackAnswer() {
    var card = currentCard();
    var answer = norm(fallbackInput && fallbackInput.value);
    if (!answer) {
      if (fallbackInput) fallbackInput.focus();
      return;
    }
    if (getSpeechAliases(card).map(norm).indexOf(answer) !== -1) {
      awardSpeechSuccess({ status: "correct", transcript: fallbackInput.value });
    } else {
      showResult("try-again", fallbackInput.value, 0);
      flashCard("wrong");
    }
  }

  function showResetModal() {
    resetModal.hidden = false;
    resetConfirm.focus();
  }

  function hideResetModal() {
    resetModal.hidden = true;
  }

  function doReset() {
    try {
      localStorage.removeItem(STORE_KEY);
      if (STORE_KEY.endsWith(":guest")) {
        localStorage.removeItem(STORE_KEY_LEGACY);
        localStorage.removeItem(STORE_KEY_V2);
        localStorage.removeItem(STORE_KEY_OLD);
      }
    } catch (e) {}
    _lastStreak = 0;
    hideResetModal();
    if (window.Alerts) Alerts.info("Progreso reiniciado. Empieza de nuevo.");
    if (introScreen) introScreen.hidden = false;
    updateActiveCard();
  }

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      if (resetModal && !resetModal.hidden) hideResetModal();
      if (resultScreen && !resultScreen.hidden && retryBtn && !retryBtn.hidden) {
        resultScreen.hidden = true;
      }
    }
  });

  if (startBtn) startBtn.addEventListener("click", function() {
    introScreen.hidden = true;
    updateActiveCard();
  });
  if (retryBtn) retryBtn.addEventListener("click", function() {
    if (resultScreen) resultScreen.hidden = true;
    awaitingAdvance = false;
  });
  if (nextBtn) nextBtn.addEventListener("click", goNext);
  if (skipBtn) skipBtn.addEventListener("click", skipCard);
  if (audioBtn) audioBtn.addEventListener("click", speakCurrentWord);
  if (playAgainBtn) playAgainBtn.addEventListener("click", playAgain);
  if (fallbackCheck) fallbackCheck.addEventListener("click", checkFallbackAnswer);
  if (fallbackInput) {
    fallbackInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") checkFallbackAnswer();
    });
  }
  if (resetBtn) resetBtn.addEventListener("click", showResetModal);
  if (resetCancel) resetCancel.addEventListener("click", hideResetModal);
  if (resetConfirm) resetConfirm.addEventListener("click", doReset);
  if (resetModal) {
    resetModal.addEventListener("click", function(e) {
      if (e.target === resetModal) hideResetModal();
    });
  }

  try {
    updateActiveCard();
  } catch (err) {
    console.error("[juego-comida] render() threw:", err);
    cardArea.innerHTML =
      '<div class="game-boot-error">' +
        '<strong>No se pudo cargar el juego.</strong>' +
        '<p>Error al renderizar. Revisa la consola.</p>' +
      '</div>';
  }
}

function startFoodGame() {
  var userId = window.Access?.getUser?.()?.id;
  STORE_KEY = STORE_KEY_PREFIX + (userId ? "user:" + userId : "guest");
  boot();
}

if (window.Access) {
  Access.ready().then(startFoodGame);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startFoodGame);
} else {
  startFoodGame();
}
