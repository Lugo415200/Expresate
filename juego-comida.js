/* ============================================================
   juego-comida.js — Exprésate food flashcard game.
   Static, GitHub Pages friendly, no external assets.
   ============================================================ */

"use strict";

var STORE_KEY = "expresate_food_game_v3";
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

var XP_LEARN = 1;
var XP_PRACTICE = 2;
var XP_GAME = 1;
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
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ");
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function defaultState() {
  return {
    mode: "learn",
    index: 0,
    learned: {},
    practice: {},
    game: { streak: 0, best: 0 },
    xp: 0,
  };
}

function loadRawState() {
  try {
    return localStorage.getItem(STORE_KEY) ||
      localStorage.getItem(STORE_KEY_V2) ||
      localStorage.getItem(STORE_KEY_OLD);
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

  var mode = saved.mode;
  if (mode !== "learn" && mode !== "practice" && mode !== "game") mode = def.mode;

  var index = typeof saved.index === "number" ? saved.index : def.index;
  if (index < 0 || index >= CARDS.length || !isFinite(index)) index = 0;

  var savedGame = saved.game && typeof saved.game === "object" ? saved.game : {};
  var streak = typeof savedGame.streak === "number" ? savedGame.streak : 0;
  var best = typeof savedGame.best === "number" ? savedGame.best : 0;
  var xp = typeof saved.xp === "number" ? saved.xp : 0;

  return {
    mode: mode,
    index: index,
    learned: validCardMap(saved.learned),
    practice: validCardMap(saved.practice),
    game: { streak: Math.max(0, streak), best: Math.max(0, best) },
    xp: Math.max(0, xp),
  };
}

function setState(patch) {
  var next = Object.assign({}, getState(), patch);
  saveState(next);
  return next;
}

function renderFoodVisual(card, container) {
  if (!container) return;
  container.innerHTML = "";

  var img = document.createElement("img");
  img.className = "food-photo";
  img.src = card.image || "";
  img.alt = card.alt || (card.es + " / " + card.en);
  img.loading = "lazy";
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
    if (!localStorage.getItem(STORE_KEY) && localStorage.getItem(STORE_KEY_V2)) {
      saveState(getState());
    }
    localStorage.removeItem(STORE_KEY_OLD);
  } catch (e) {}

  var modeLearnBtn = byId("modeLearn");
  var modePracticeBtn = byId("modePractice");
  var modeGameBtn = byId("modeGame");
  var resetBtn = byId("resetProgress");
  var statusLine = byId("statusLine");
  var cardArea = byId("cardArea");
  var gcVisual = byId("gcVisual");
  var foodVisual = byId("foodVisual");
  var cardDots = byId("cardDots");
  var cardDotsFooter = byId("cardDotsFooter");
  var cardNumEl = byId("cardNum");
  var wordEs = byId("wordEs");
  var wordEn = byId("wordEn");
  var hintLine = byId("hintLine");
  var speechPracticeEl = byId("speechPractice");
  var learnActions = byId("learnActions");
  var revealBtn = byId("revealBtn");
  var audioBtn = byId("audioBtn");
  var nextBtn = byId("nextBtn");
  var practiceArea = byId("practiceArea");
  var practiceInput = byId("practiceInput");
  var checkBtn = byId("checkBtn");
  var showAnswerBtn = byId("showAnswerBtn");
  var nextBtnPractice = byId("nextBtnPractice");
  var practiceResult = byId("practiceResult");
  var gameArea = byId("gameArea");
  var choicesWrap = byId("choices");
  var gameResult = byId("gameResult");
  var gameNextWrap = byId("gameNextWrap");
  var nextBtnGame = byId("nextBtnGame");
  var gameHUD = byId("gameHUD");
  var resetModal = byId("resetModal");
  var resetCancel = byId("resetCancel");
  var resetConfirm = byId("resetConfirm");
  var speechPractice = null;

  var critical = {
    modeLearn: modeLearnBtn,
    wordEs: wordEs,
    wordEn: wordEn,
    foodVisual: foodVisual,
    gameHUD: gameHUD,
  };
  var missing = Object.keys(critical).filter(function(k) { return !critical[k]; });
  if (missing.length > 0) {
    console.error("[juego-comida] Missing DOM elements:", missing);
    showBootError("Error al cargar el juego: faltan elementos (" + missing.join(", ") + ").");
    return;
  }

  if (speechPracticeEl && window.ExpresateSpeechPractice) {
    speechPractice = window.ExpresateSpeechPractice.create({
      root: speechPracticeEl,
      expected: currentCard().en,
    });
  }

  function showBootError(msg) {
    if (!cardArea) return;
    cardArea.innerHTML =
      '<div class="game-boot-error">' +
        '<strong>No se pudo cargar el juego.</strong>' +
        '<p>' + escapeHtml(msg) + '</p>' +
      '</div>';
  }

  function currentCard() {
    var s = getState();
    var idx = Math.max(0, Math.min(CARDS.length - 1, s.index));
    return CARDS[idx] || CARDS[0];
  }

  function setResult(el, text, type) {
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("ok", "bad");
    if (type) el.classList.add(type);
  }

  function flashCard(type) {
    if (!cardArea) return;
    cardArea.classList.remove("card-correct", "card-wrong");
    void cardArea.offsetWidth;
    cardArea.classList.add(type === "correct" ? "card-correct" : "card-wrong");
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

  function markLearned(cardId) {
    var s = getState();
    var already = s.learned && s.learned[cardId];
    var learned = Object.assign({}, s.learned || {});
    learned[cardId] = true;
    var xp = already ? s.xp : (s.xp || 0) + XP_LEARN;
    setState({ learned: learned, xp: xp });
    if (!already) showXpToast(XP_LEARN);
  }

  function revealEnglish(card) {
    wordEn.textContent = card.en;
    wordEn.classList.remove("is-hidden");
    void wordEn.offsetWidth;
    wordEn.classList.add("revealing");
    wordEn.addEventListener("animationend", function() {
      wordEn.classList.remove("revealing");
    }, { once: true });
  }

  function renderDots(index, total) {
    function makeDots(container, cls) {
      if (!container) return;
      container.innerHTML = "";
      for (var i = 0; i < total; i++) {
        var d = document.createElement("span");
        d.className = cls + (i < index ? " is-done" : i === index ? " is-current" : "");
        container.appendChild(d);
      }
    }
    makeDots(cardDots, "gc-dot");
    makeDots(cardDotsFooter, "gc-dot-f");
    if (cardNumEl) cardNumEl.textContent = (index + 1) + " / " + total;
  }

  function setModeButtons(mode) {
    modeLearnBtn.classList.toggle("is-active", mode === "learn");
    modePracticeBtn.classList.toggle("is-active", mode === "practice");
    modeGameBtn.classList.toggle("is-active", mode === "game");
  }

  function updateStatusLine(mode) {
    var msgs = {
      learn: "Modo Aprender: mira la carta, revela el inglés y repite en voz alta.",
      practice: "Modo Practicar: escribe la palabra en inglés. Puedes intentar otra vez antes de avanzar.",
      game: "Modo Jugar: elige la respuesta correcta para subir tu racha y ganar XP.",
    };
    statusLine.textContent = msgs[mode] || "";
  }

  function renderHUD() {
    var s = getState();
    var learnedCount = Object.keys(s.learned || {}).length;
    var practicedCount = Object.keys(s.practice || {}).filter(function(id) {
      return s.practice[id] && s.practice[id].correct;
    }).length;
    var total = CARDS.length;
    var streak = s.game.streak || 0;
    var best = s.game.best || 0;
    var xp = s.xp || 0;

    var tip;
    if (learnedCount < total) {
      tip = "Sigue en Aprender hasta revelar todas las cartas. Después pasa a Practicar.";
    } else if (practicedCount < total) {
      tip = "Ya viste todas las cartas. Practica las palabras que faltan escribiendo en inglés.";
    } else {
      tip = "Buen trabajo. Ahora intenta una racha larga en modo Jugar.";
    }

    var streakGrew = streak > _lastStreak;
    gameHUD.innerHTML =
      '<div class="game-hud">' +
        hudStat("Aprendidas", learnedCount + " / " + total, "learned") +
        hudStat("Practicadas", practicedCount + " / " + total, "practice") +
        hudStat("Racha", '<span id="hud-streak-val">' + streak + '</span><small> mejor ' + best + '</small>', "streak") +
        hudStat("XP", xp, "xp") +
        '<div class="hud-tip"><strong>Siguiente paso</strong><span>' + escapeHtml(tip) + '</span></div>' +
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

  function hudStat(label, value, tone) {
    return '' +
      '<div class="game-stat game-stat-' + tone + '">' +
        '<span class="game-stat-icon" aria-hidden="true"></span>' +
        '<div>' +
          '<div class="game-stat-value">' + value + '</div>' +
          '<div class="game-stat-label">' + label + '</div>' +
        '</div>' +
      '</div>';
  }

  function setupGameChoices() {
    var card = currentCard();
    var others = CARDS.filter(function(c) { return c.id !== card.id; });
    var distractors = shuffle(others).slice(0, 3).map(function(c) { return c.en; });
    var options = shuffle([card.en].concat(distractors));

    choicesWrap.innerHTML = "";
    setResult(gameResult, "");
    gameNextWrap.hidden = true;

    options.forEach(function(opt) {
      var btn = document.createElement("button");
      btn.className = "gc-choice";
      btn.type = "button";
      btn.textContent = opt;

      btn.addEventListener("click", function() {
        var allChoices = choicesWrap.querySelectorAll(".gc-choice");
        allChoices.forEach(function(b) { b.disabled = true; });

        var picked = norm(opt) === norm(card.en);
        var fresh = getState();
        var nextGame = Object.assign({}, fresh.game);

        if (picked) {
          btn.classList.add("choice-correct");
          nextGame.streak = (nextGame.streak || 0) + 1;
          nextGame.best = Math.max(nextGame.best || 0, nextGame.streak);
          setState({ game: nextGame, xp: (fresh.xp || 0) + XP_GAME });
          setResult(gameResult, "Correcto. Racha: " + nextGame.streak, "ok");
          revealEnglish(card);
          flashCard("correct");
          markLearned(card.id);
          showXpToast(XP_GAME);
          renderHUD();
          setTimeout(goNext, 750);
        } else {
          btn.classList.add("choice-wrong");
          allChoices.forEach(function(b) {
            if (norm(b.textContent) === norm(card.en)) b.classList.add("choice-correct");
          });
          nextGame.streak = 0;
          setState({ game: nextGame });
          setResult(gameResult, "Respuesta correcta: " + card.en + ". Inténtalo en la próxima carta.", "bad");
          revealEnglish(card);
          flashCard("wrong");
          renderHUD();
          gameNextWrap.hidden = false;
        }
      });

      choicesWrap.appendChild(btn);
    });
  }

  function showCard(card, mode) {
    wordEs.textContent = card.es;
    wordEn.textContent = "—";
    wordEn.classList.add("is-hidden");
    wordEn.classList.remove("revealing");
    renderFoodVisual(card, foodVisual);
    if (speechPractice) speechPractice.setExpected(card.en);

    if (practiceInput) {
      practiceInput.value = "";
      practiceInput.classList.remove("input-correct", "input-wrong");
    }
    setResult(practiceResult, "");
    setResult(gameResult, "");
    cardArea.classList.remove("card-correct", "card-wrong");

    practiceArea.hidden = mode !== "practice";
    gameArea.hidden = mode !== "game";
    learnActions.hidden = mode === "game";
    gameNextWrap.hidden = true;
    nextBtnPractice.hidden = true;
    nextBtn.hidden = mode !== "learn";
    audioBtn.disabled = !card.audio;

    if (mode === "learn") {
      revealBtn.textContent = "Mostrar inglés";
      revealBtn.hidden = false;
      hintLine.textContent = "Mira la imagen, di la palabra en español y revela el inglés.";
    } else if (mode === "practice") {
      revealBtn.textContent = "Ver respuesta";
      revealBtn.hidden = false;
      hintLine.textContent = "Escribe en inglés. Si fallas, corrige y vuelve a intentar.";
      setTimeout(function() { practiceInput.focus(); }, 80);
    } else {
      revealBtn.hidden = true;
      hintLine.textContent = "Elige la opción correcta. La racha sube solo con aciertos.";
      setupGameChoices();
    }
  }

  function checkPractice() {
    var card = currentCard();
    var s = getState();
    var answer = norm(practiceInput ? practiceInput.value : "");
    var correct = norm(card.en);

    if (!answer) {
      if (practiceInput) practiceInput.focus();
      return;
    }

    var prev = (s.practice || {})[card.id] || { correct: false, attempts: 0 };
    var attempts = prev.attempts + 1;
    var isRight = answer === correct;
    var practice = Object.assign({}, s.practice || {});
    practice[card.id] = { correct: prev.correct || isRight, attempts: attempts };

    if (isRight) {
      var alreadyCorrect = prev.correct;
      var xp = alreadyCorrect ? s.xp : (s.xp || 0) + XP_PRACTICE;
      setState({ practice: practice, xp: xp });
      practiceInput.classList.add("input-correct");
      practiceInput.classList.remove("input-wrong");
      setResult(practiceResult, "Correcto: " + card.en, "ok");
      revealEnglish(card);
      flashCard("correct");
      markLearned(card.id);
      if (!alreadyCorrect) showXpToast(XP_PRACTICE);
      nextBtnPractice.hidden = false;
      revealBtn.hidden = true;
    } else {
      setState({ practice: practice });
      practiceInput.classList.add("input-wrong");
      practiceInput.classList.remove("input-correct");
      setResult(practiceResult, "Todavía no. Corrige y prueba otra vez.", "bad");
      flashCard("wrong");
      nextBtnPractice.hidden = true;
    }

    renderHUD();
  }

  function goNext() {
    var s = getState();
    setState({ index: (s.index + 1) % CARDS.length });
    render();
  }

  function render() {
    var s = getState();
    var card = currentCard();
    setModeButtons(s.mode);
    updateStatusLine(s.mode);
    showCard(card, s.mode);
    renderDots(s.index, CARDS.length);
    renderHUD();
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
      localStorage.removeItem(STORE_KEY_V2);
      localStorage.removeItem(STORE_KEY_OLD);
    } catch (e) {}
    _lastStreak = 0;
    hideResetModal();
    if (window.Alerts) Alerts.info("Progreso reiniciado. Empieza de nuevo.");
    render();
  }

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && resetModal && !resetModal.hidden) hideResetModal();
  });

  resetModal.addEventListener("click", function(e) {
    if (e.target === resetModal) hideResetModal();
  });

  modeLearnBtn.addEventListener("click", function() { setState({ mode: "learn" }); render(); });
  modePracticeBtn.addEventListener("click", function() { setState({ mode: "practice" }); render(); });
  modeGameBtn.addEventListener("click", function() { setState({ mode: "game" }); render(); });
  resetBtn.addEventListener("click", showResetModal);
  resetCancel.addEventListener("click", hideResetModal);
  resetConfirm.addEventListener("click", doReset);

  revealBtn.addEventListener("click", function() {
    var card = currentCard();
    revealEnglish(card);
    markLearned(card.id);
    renderHUD();
  });

  audioBtn.addEventListener("click", function() {
    var card = currentCard();
    if (!card.audio) return;
    try {
      var a = new Audio(card.audio);
      a.currentTime = 0;
      a.play().catch(function() {});
    } catch (e) {}
  });

  nextBtn.addEventListener("click", goNext);
  nextBtnPractice.addEventListener("click", goNext);
  nextBtnGame.addEventListener("click", goNext);
  checkBtn.addEventListener("click", checkPractice);

  showAnswerBtn.addEventListener("click", function() {
    var card = currentCard();
    revealEnglish(card);
    setResult(practiceResult, "Respuesta: " + card.en, "");
    practiceInput.classList.remove("input-correct", "input-wrong");
  });

  practiceInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") checkPractice();
  });

  try {
    render();
  } catch (err) {
    console.error("[juego-comida] render() threw:", err);
    showBootError("Error al renderizar el juego. Revisa la consola.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
