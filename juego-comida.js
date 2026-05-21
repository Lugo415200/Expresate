/* ============================================================
   juego-comida.js — Flashcard game: Food vocabulary.
   Modes: Aprender · Practicar · Jugar

   Boot sequence mirrors nav.js: readyState guard so render()
   fires even if DOMContentLoaded has already passed.
   All DOM queries and event-listener attachments live inside
   boot() so a bad module-level statement can never silently
   swallow the initial render.
   ============================================================ */

"use strict";

/* ── Storage keys ── */
var STORE_KEY     = "expresate_food_game_v2";
var STORE_KEY_OLD = "ynoel_food_game_v1";   /* cleared on first run */

/* ── Vocabulary ── */
var CARDS = [
  { id: "apple",   es: "manzana",  en: "apple",   emoji: "🍎", img: "", audio: "" },
  { id: "banana",  es: "banana",   en: "banana",  emoji: "🍌", img: "", audio: "" },
  { id: "bread",   es: "pan",      en: "bread",   emoji: "🍞", img: "", audio: "" },
  { id: "milk",    es: "leche",    en: "milk",    emoji: "🥛", img: "", audio: "" },
  { id: "water",   es: "agua",     en: "water",   emoji: "💧", img: "", audio: "" },
  { id: "rice",    es: "arroz",    en: "rice",    emoji: "🍚", img: "", audio: "" },
  { id: "egg",     es: "huevo",    en: "egg",     emoji: "🥚", img: "", audio: "" },
  { id: "chicken", es: "pollo",    en: "chicken", emoji: "🍗", img: "", audio: "" },
  { id: "fish",    es: "pescado",  en: "fish",    emoji: "🐟", img: "", audio: "" },
  { id: "cheese",  es: "queso",    en: "cheese",  emoji: "🧀", img: "", audio: "" },
  { id: "coffee",  es: "café", en: "coffee",  emoji: "☕",       img: "", audio: "" },
  { id: "tea",     es: "té",   en: "tea",     emoji: "🍵", img: "", audio: "" },
];

/* ── Pure helpers (no DOM, no side-effects — safe at module level) ── */

function byId(id) { return document.getElementById(id); }

/** Accent-strip + lowercase normaliser for answer comparison. */
function norm(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   /* explicit Unicode escape — no raw combining chars */
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ");
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

/* ── State helpers ── */

function defaultState() {
  return {
    mode:     "learn",
    index:    0,
    learned:  {},
    practice: {},
    game:     { streak: 0, best: 0 },
    xp:       0,
  };
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveState(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}

/**
 * Merge saved state with defaults and validate every field.
 * Returns a guaranteed-valid state object even if localStorage is corrupt.
 */
function getState() {
  var saved   = loadState() || {};
  var def     = defaultState();

  var mode    = saved.mode;
  if (mode !== "learn" && mode !== "practice" && mode !== "game") mode = def.mode;

  var index   = typeof saved.index === "number" ? saved.index : def.index;
  if (index < 0 || index >= CARDS.length || !isFinite(index)) index = 0;

  var learned  = (saved.learned  && typeof saved.learned  === "object") ? saved.learned  : {};
  var practice = (saved.practice && typeof saved.practice === "object") ? saved.practice : {};

  var savedGame = (saved.game && typeof saved.game === "object") ? saved.game : {};
  var streak = typeof savedGame.streak === "number" ? savedGame.streak : 0;
  var best   = typeof savedGame.best   === "number" ? savedGame.best   : 0;

  var xp = typeof saved.xp === "number" ? saved.xp : 0;

  return {
    mode:     mode,
    index:    index,
    learned:  learned,
    practice: practice,
    game:     { streak: streak, best: best },
    xp:       xp,
  };
}

function setState(patch) {
  var next = Object.assign({}, getState(), patch);
  saveState(next);
  return next;
}

/* ── XP awards ── */
var XP_LEARN    = 1;
var XP_PRACTICE = 2;
var XP_GAME     = 1;

/* ── Streak tracker for HUD pop animation ── */
var _lastStreak = 0;

/* ============================================================
   BOOT  — all DOM access and side-effects live here
   Mirrors nav.js readyState guard to be safe in any load order.
   ============================================================ */
function boot() {
  /* 1. Clear legacy v1 key so old saved state never interferes */
  try { localStorage.removeItem(STORE_KEY_OLD); } catch (e) {}

  /* 2. Grab DOM refs — check each one so we fail loudly instead
        of silently if an ID was accidentally changed in HTML.   */
  var modeLearnBtn    = byId("modeLearn");
  var modePracticeBtn = byId("modePractice");
  var modeGameBtn     = byId("modeGame");
  var resetBtn        = byId("resetProgress");

  var statusLine = byId("statusLine");
  var cardArea   = byId("cardArea");
  var gcVisual   = byId("gcVisual");

  var cardImg          = byId("cardImg");
  var cardEmoji        = byId("cardEmoji");
  var cardDots         = byId("cardDots");
  var cardDotsFooter   = byId("cardDotsFooter");
  var cardNumEl        = byId("cardNum");

  var wordEs   = byId("wordEs");
  var wordEn   = byId("wordEn");
  var hintLine = byId("hintLine");

  var learnActions    = byId("learnActions");
  var revealBtn       = byId("revealBtn");
  var audioBtn        = byId("audioBtn");
  var nextBtn         = byId("nextBtn");

  var practiceArea    = byId("practiceArea");
  var practiceInput   = byId("practiceInput");
  var checkBtn        = byId("checkBtn");
  var showAnswerBtn   = byId("showAnswerBtn");
  var nextBtnPractice = byId("nextBtnPractice");
  var practiceResult  = byId("practiceResult");

  var gameArea     = byId("gameArea");
  var choicesWrap  = byId("choices");
  var gameResult   = byId("gameResult");
  var gameNextWrap = byId("gameNextWrap");
  var nextBtnGame  = byId("nextBtnGame");

  var gameHUD = byId("gameHUD");

  var resetModal   = byId("resetModal");
  var resetCancel  = byId("resetCancel");
  var resetConfirm = byId("resetConfirm");

  /* 3. Verify critical refs — report any mismatch visibly */
  var critical = {
    modeLearn:    modeLearnBtn,
    wordEs:       wordEs,
    wordEn:       wordEn,
    cardEmoji:    cardEmoji,
    gameHUD:      gameHUD,
  };
  var missing = Object.keys(critical).filter(function(k) { return !critical[k]; });
  if (missing.length > 0) {
    console.error("[juego-comida] Missing DOM elements:", missing);
    showBootError("Error al cargar el juego: elementos del DOM no encontrados (" + missing.join(", ") + ").");
    return;
  }

  /* ── Inner helpers that close over DOM refs ── */

  function showBootError(msg) {
    if (cardArea) {
      cardArea.innerHTML =
        '<div style="padding:28px 24px;text-align:center;">' +
        '<p style="font-size:1.4rem;">⚠️</p>' +
        '<p style="font-weight:700;color:#dc2626;">' + msg + '</p>' +
        '<p class="small" style="color:rgba(15,23,42,.5);">Recarga la página o borra el caché del navegador.</p>' +
        '</div>';
    }
  }

  function currentCard() {
    var s   = getState();
    var idx = Math.max(0, Math.min(CARDS.length - 1, s.index));
    return CARDS[idx] || CARDS[0];
  }

  /* ── Result feedback ── */
  function setResult(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.classList.remove("ok", "bad");
    if (type) el.classList.add(type);
  }

  /* ── Card border flash ── */
  function flashCard(type) {
    if (!cardArea) return;
    cardArea.classList.remove("card-correct", "card-wrong");
    void cardArea.offsetWidth;
    cardArea.classList.add(type === "correct" ? "card-correct" : "card-wrong");
  }

  /* ── Floating XP toast ── */
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

  /* ── Mark a card as learned (awards XP once) ── */
  function markLearned(cardId) {
    var s = getState();
    var already = s.learned && s.learned[cardId];
    var learned = Object.assign({}, s.learned || {});
    learned[cardId] = true;
    var xp = already ? s.xp : (s.xp || 0) + XP_LEARN;
    setState({ learned: learned, xp: xp });
    if (!already) showXpToast(XP_LEARN);
  }

  /* ── Reveal English answer ── */
  function revealEnglish(card) {
    wordEn.textContent = card.en;
    wordEn.classList.remove("is-hidden");
    void wordEn.offsetWidth;
    wordEn.classList.add("revealing");
    wordEn.addEventListener("animationend",
      function() { wordEn.classList.remove("revealing"); }, { once: true });
  }

  /* ── Progress dots ── */
  function renderDots(index, total) {
    function makeDots(container, cls) {
      if (!container) return;
      container.innerHTML = "";
      for (var i = 0; i < total; i++) {
        var d = document.createElement("span");
        d.className = cls +
          (i < index ? " is-done" : i === index ? " is-current" : "");
        container.appendChild(d);
      }
    }
    makeDots(cardDots,       "gc-dot");
    makeDots(cardDotsFooter, "gc-dot-f");
    if (cardNumEl) cardNumEl.textContent = (index + 1) + " / " + total;
  }

  /* ── Mode selector highlight ── */
  function setModeButtons(mode) {
    if (modeLearnBtn)    modeLearnBtn.classList.toggle("is-active",    mode === "learn");
    if (modePracticeBtn) modePracticeBtn.classList.toggle("is-active", mode === "practice");
    if (modeGameBtn)     modeGameBtn.classList.toggle("is-active",     mode === "game");
  }

  /* ── Status line below mode selector ── */
  function updateStatusLine(mode) {
    if (!statusLine) return;
    var msgs = {
      learn:    "Modo Aprender — mira la carta, revela el inglés y repite en voz alta.",
      practice: "Modo Practicar — escribe la palabra en inglés y presiona Verificar.",
      game:     "Modo Jugar — elige la opción correcta para mantener tu racha.",
    };
    statusLine.textContent = msgs[mode] || "";
  }

  /* ── Right-panel HUD ── */
  function renderHUD() {
    if (!gameHUD) return;
    var s            = getState();
    var learnedCount  = Object.keys(s.learned  || {}).length;
    var practicedCount = Object.keys(s.practice || {}).length;
    var total         = CARDS.length;
    var streak        = s.game.streak || 0;
    var best          = s.game.best   || 0;
    var xp            = s.xp          || 0;

    var tip;
    if (learnedCount < total) {
      var rem = total - learnedCount;
      tip = "<strong>💡 Sugerencia:</strong> Aprende " + rem + " carta" +
            (rem !== 1 ? "s" : "") + " más en modo <em>Aprender</em>, luego pasa a Practicar.";
    } else if (practicedCount < total) {
      var remP = total - practicedCount;
      tip = "<strong>💡 Sugerencia:</strong> Ya aprendiste todas. Practica las " +
            remP + " restantes en modo <em>Practicar</em>.";
    } else {
      tip = "<strong>🏆 ¡Excelente!</strong> Aprendiste y practicaste las " +
            total + " cartas. ¡Intenta una racha larga en modo <em>Jugar</em>!";
    }

    var streakZero   = streak === 0 ? " streak-zero" : "";
    var streakGrew   = streak > _lastStreak;

    gameHUD.innerHTML =
      '<div class="game-hud">' +

      '<div class="stat-card">' +
        '<div class="stat-icon">📖</div>' +
        '<div class="stat-text">' +
          '<div class="stat-value">' + learnedCount +
            '<span style="font-size:.70em;opacity:.55;font-weight:600"> /' + total + '</span>' +
          '</div>' +
          '<div class="stat-label">Aprendidas</div>' +
        '</div>' +
      '</div>' +

      '<div class="stat-card">' +
        '<div class="stat-icon">✏️</div>' +
        '<div class="stat-text">' +
          '<div class="stat-value">' + practicedCount +
            '<span style="font-size:.70em;opacity:.55;font-weight:600"> /' + total + '</span>' +
          '</div>' +
          '<div class="stat-label">Practicadas</div>' +
        '</div>' +
      '</div>' +

      '<div class="stat-card' + streakZero + '">' +
        '<div class="stat-icon fire">⚡</div>' +
        '<div class="stat-text">' +
          '<div class="stat-value" id="hud-streak-val">' + streak + '</div>' +
          '<div class="stat-label">Racha · mejor ' + best + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="stat-card">' +
        '<div class="stat-icon xp">⭐</div>' +
        '<div class="stat-text">' +
          '<div class="stat-value">' + xp + '</div>' +
          '<div class="stat-label">XP ganado</div>' +
        '</div>' +
      '</div>' +

      '<div class="hud-tip">' + tip + '</div>' +
      '</div>';

    /* Streak pop animation */
    if (streakGrew) {
      var sv = byId("hud-streak-val");
      if (sv) {
        sv.classList.remove("streak-pop");
        void sv.offsetWidth;
        sv.classList.add("streak-pop");
        sv.addEventListener("animationend",
          function() { sv.classList.remove("streak-pop"); }, { once: true });
      }
    }
    _lastStreak = streak;
  }

  /* ── Game choices (multiple-choice mode) ── */
  function setupGameChoices() {
    var card = currentCard();
    var s    = getState();

    var others      = CARDS.filter(function(c) { return c.id !== card.id; });
    var distractors = shuffle(others).slice(0, 3).map(function(c) { return c.en; });
    var options     = shuffle([card.en].concat(distractors));

    choicesWrap.innerHTML = "";
    if (gameResult)   { gameResult.textContent = ""; gameResult.className = "gc-result"; }
    if (gameNextWrap) gameNextWrap.hidden = true;

    options.forEach(function(opt) {
      var btn = document.createElement("button");
      btn.className  = "gc-choice";
      btn.type       = "button";
      btn.textContent = opt;

      btn.addEventListener("click", function() {
        /* Lock all choices */
        var allChoices = choicesWrap.querySelectorAll(".gc-choice");
        allChoices.forEach(function(b) { b.disabled = true; });

        var picked   = norm(opt) === norm(card.en);
        var nextGame = Object.assign({}, s.game);

        if (picked) {
          btn.classList.add("choice-correct");
          nextGame.streak = (nextGame.streak || 0) + 1;
          nextGame.best   = Math.max(nextGame.best || 0, nextGame.streak);

          var fresh        = getState();
          var alreadyLearned = fresh.learned && fresh.learned[card.id];
          var xp           = alreadyLearned ? fresh.xp : (fresh.xp || 0) + XP_GAME;

          setState({ game: nextGame, xp: xp });
          setResult(gameResult, "✅ ¡Bien! Racha: " + nextGame.streak, "ok");
          revealEnglish(card);
          flashCard("correct");
          markLearned(card.id);
          if (!alreadyLearned) showXpToast(XP_GAME);

          renderHUD();
          setTimeout(goNext, 700);

        } else {
          btn.classList.add("choice-wrong");
          /* Highlight correct choice */
          allChoices.forEach(function(b) {
            if (norm(b.textContent) === norm(card.en)) b.classList.add("choice-correct");
          });
          nextGame.streak = 0;
          setState({ game: nextGame });

          setResult(gameResult, "❌ Correcto: \"" + card.en + "\" — racha reiniciada.", "bad");
          revealEnglish(card);
          flashCard("wrong");
          renderHUD();
          if (gameNextWrap) gameNextWrap.hidden = false;
        }
      });

      choicesWrap.appendChild(btn);
    });
  }

  /* ── Show a card in the given mode ── */
  function showCard(card, mode) {
    /* Words */
    wordEs.textContent = card.es;
    wordEn.textContent = "—";
    wordEn.classList.add("is-hidden");
    wordEn.classList.remove("revealing");

    /* Reset inputs */
    if (practiceInput) {
      practiceInput.value = "";
      practiceInput.classList.remove("input-correct", "input-wrong");
    }
    setResult(practiceResult, "");
    setResult(gameResult, "");

    /* Reset card flash */
    if (cardArea) cardArea.classList.remove("card-correct", "card-wrong");

    /* Image or emoji */
    if (card.img) {
      if (cardImg)   { cardImg.src = card.img; cardImg.style.display = "block"; }
      if (cardEmoji) cardEmoji.style.display = "none";
      if (cardImg) cardImg.onerror = function() {
        cardImg.style.display = "none";
        if (cardEmoji) {
          cardEmoji.style.display = "block";
          cardEmoji.textContent = card.emoji || "🍽️";
        }
      };
    } else {
      if (cardImg)   cardImg.style.display = "none";
      if (cardEmoji) {
        cardEmoji.style.display = "block";
        cardEmoji.textContent = card.emoji || "🍽️";
      }
    }

    /* Area visibility */
    if (practiceArea)    practiceArea.hidden    = (mode !== "practice");
    if (gameArea)        gameArea.hidden        = (mode !== "game");
    if (learnActions)    learnActions.hidden    = (mode === "game");
    if (gameNextWrap)    gameNextWrap.hidden    = true;
    if (nextBtnPractice) nextBtnPractice.hidden = true;
    if (nextBtn)         nextBtn.hidden         = (mode !== "learn");

    /* Audio button */
    if (audioBtn) audioBtn.disabled = !card.audio;

    /* Mode-specific label + hint */
    if (mode === "learn") {
      if (revealBtn) { revealBtn.textContent = "👁 Mostrar inglés"; revealBtn.hidden = false; }
      if (hintLine)  hintLine.textContent = "Toca “Mostrar inglés”, luego repite 3 veces en voz alta.";

    } else if (mode === "practice") {
      if (revealBtn) { revealBtn.textContent = "👁 Ver respuesta (pista)"; revealBtn.hidden = false; }
      if (hintLine)  hintLine.textContent = "Escribe en inglés y presiona Verificar.";
      if (practiceInput) setTimeout(function() { practiceInput.focus(); }, 80);

    } else if (mode === "game") {
      if (revealBtn) revealBtn.hidden = true;
      if (hintLine)  hintLine.textContent = "Elige la respuesta correcta para sumar a tu racha.";
      setupGameChoices();
    }
  }

  /* ── Practice mode: check typed answer ── */
  function checkPractice() {
    var card    = currentCard();
    var s       = getState();
    var answer  = norm(practiceInput ? practiceInput.value : "");
    var correct = norm(card.en);

    if (!answer) {
      if (practiceInput) practiceInput.focus();
      return;
    }

    var prev     = (s.practice || {})[card.id] || { correct: false, attempts: 0 };
    var attempts = prev.attempts + 1;
    var isRight  = (answer === correct);

    var practice = Object.assign({}, s.practice || {});
    practice[card.id] = { correct: prev.correct || isRight, attempts: attempts };

    if (isRight) {
      var alreadyCorrect = prev.correct;
      var xp = alreadyCorrect ? s.xp : (s.xp || 0) + XP_PRACTICE;
      setState({ practice: practice, xp: xp });

      if (practiceInput) {
        practiceInput.classList.add("input-correct");
        practiceInput.classList.remove("input-wrong");
      }
      setResult(practiceResult, "✅ ¡Correcto! \"" + card.en + "\"", "ok");
      revealEnglish(card);
      flashCard("correct");
      markLearned(card.id);
      if (!alreadyCorrect) showXpToast(XP_PRACTICE);

      if (nextBtnPractice) nextBtnPractice.hidden = false;
      if (revealBtn)       revealBtn.hidden       = true;

    } else {
      setState({ practice: practice });

      if (practiceInput) {
        practiceInput.classList.add("input-wrong");
        practiceInput.classList.remove("input-correct");
      }
      setResult(practiceResult, "❌ Intenta otra vez. (Pista: “Mostrar inglés”)", "bad");
      flashCard("wrong");
    }

    renderHUD();
  }

  /* ── Navigate to next card ── */
  function goNext() {
    var s    = getState();
    var next = (s.index + 1) % CARDS.length;
    setState({ index: next });
    render();
  }

  /* ── Main render ── */
  function render() {
    var s    = getState();
    var card = currentCard();

    setModeButtons(s.mode);
    updateStatusLine(s.mode);
    showCard(card, s.mode);
    renderDots(s.index, CARDS.length);
    renderHUD();
  }

  /* ── Reset modal ── */
  function showResetModal() {
    if (resetModal) {
      resetModal.hidden = false;
      if (resetConfirm) resetConfirm.focus();
    }
  }
  function hideResetModal() {
    if (resetModal) resetModal.hidden = true;
  }
  function doReset() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    _lastStreak = 0;
    hideResetModal();
    if (window.Alerts) Alerts.info("Progreso reiniciado. ¡Empieza de nuevo!");
    render();
  }

  /* ── Event listeners (all inside boot so no module-level crash risk) ── */

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && resetModal && !resetModal.hidden) hideResetModal();
  });

  if (resetModal) {
    resetModal.addEventListener("click", function(e) {
      if (e.target === resetModal) hideResetModal();
    });
  }

  if (modeLearnBtn)    modeLearnBtn.addEventListener("click",    function() { setState({ mode: "learn" });    render(); });
  if (modePracticeBtn) modePracticeBtn.addEventListener("click", function() { setState({ mode: "practice" }); render(); });
  if (modeGameBtn)     modeGameBtn.addEventListener("click",     function() { setState({ mode: "game" });     render(); });

  if (resetBtn)    resetBtn.addEventListener("click",    showResetModal);
  if (resetCancel) resetCancel.addEventListener("click", hideResetModal);
  if (resetConfirm) resetConfirm.addEventListener("click", doReset);

  if (revealBtn) {
    revealBtn.addEventListener("click", function() {
      var card = currentCard();
      revealEnglish(card);
      markLearned(card.id);
      renderHUD();
    });
  }

  if (audioBtn) {
    audioBtn.addEventListener("click", function() {
      var card = currentCard();
      if (!card.audio) return;
      try {
        var a = new Audio(card.audio);
        a.currentTime = 0;
        a.play().catch(function() {});
      } catch (e) {}
    });
  }

  if (nextBtn)          nextBtn.addEventListener("click",          goNext);
  if (nextBtnPractice)  nextBtnPractice.addEventListener("click",  goNext);
  if (nextBtnGame)      nextBtnGame.addEventListener("click",      goNext);

  if (checkBtn)     checkBtn.addEventListener("click",     checkPractice);
  if (showAnswerBtn) {
    showAnswerBtn.addEventListener("click", function() {
      var card = currentCard();
      revealEnglish(card);
      setResult(practiceResult, "Respuesta: \"" + card.en + "\"", "");
      if (practiceInput) practiceInput.classList.remove("input-correct", "input-wrong");
    });
  }

  if (practiceInput) {
    practiceInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") checkPractice();
    });
  }

  /* ── Initial render ── */
  try {
    render();
  } catch (err) {
    console.error("[juego-comida] render() threw:", err);
    showBootError("Error al renderizar el juego. Revisa la consola para más detalles.");
  }
}

/* ── Safe boot: same readyState guard as nav.js ── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
