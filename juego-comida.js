// =========================
// Flashcards: Food (Spanish-first)
// Modes: learn / practice / game
// =========================

const STORE_KEY = "ynoel_food_game_v1";

const CARDS = [
  // You can replace emoji with real images later:
  // img: "img/food/apple.jpg"
  // audio: "audio/food/apple.mp3"
  { id:"apple",  es:"manzana", en:"apple",  emoji:"🍎", img:"", audio:"" },
  { id:"banana", es:"banana",  en:"banana", emoji:"🍌", img:"", audio:"" },
  { id:"bread",  es:"pan",     en:"bread",  emoji:"🍞", img:"", audio:"" },
  { id:"milk",   es:"leche",   en:"milk",   emoji:"🥛", img:"", audio:"" },
  { id:"water",  es:"agua",    en:"water",  emoji:"💧", img:"", audio:"" },
  { id:"rice",   es:"arroz",   en:"rice",   emoji:"🍚", img:"", audio:"" },
  { id:"egg",    es:"huevo",   en:"egg",    emoji:"🥚", img:"", audio:"" },
  { id:"chicken",es:"pollo",   en:"chicken",emoji:"🍗", img:"", audio:"" },
  { id:"fish",   es:"pescado", en:"fish",   emoji:"🐟", img:"", audio:"" },
  { id:"cheese", es:"queso",   en:"cheese", emoji:"🧀", img:"", audio:"" },
  { id:"coffee", es:"café",    en:"coffee", emoji:"☕", img:"", audio:"" },
  { id:"tea",    es:"té",      en:"tea",    emoji:"🍵", img:"", audio:"" }
];

// ---------- helpers ----------
function $(id){ return document.getElementById(id); }

function norm(s){
  return (s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove accents
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ");
}

function loadState(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}

function saveState(state){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function defaultState(){
  return {
    mode: "learn",
    index: 0,
    learned: {},    // id -> true
    practice: {},   // id -> {correct, attempts}
    game: { streak: 0, best: 0 }
  };
}

function getState(){
  const s = loadState();
  return { ...defaultState(), ...s, game: { ...defaultState().game, ...(s.game||{}) } };
}

function setState(patch){
  const s = getState();
  const next = { ...s, ...patch };
  saveState(next);
  return next;
}

function shuffle(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- UI refs ----------
const modeLearnBtn = $("modeLearn");
const modePracticeBtn = $("modePractice");
const modeGameBtn = $("modeGame");
const resetBtn = $("resetProgress");

const statusLine = $("statusLine");
const progressLine = $("progressLine");

const wordEs = $("wordEs");
const wordEn = $("wordEn");
const hintLine = $("hintLine");

const img = $("cardImg");
const emoji = $("cardEmoji");

const revealBtn = $("revealBtn");
const audioBtn = $("audioBtn");
const nextBtn = $("nextBtn");

const practiceArea = $("practiceArea");
const practiceInput = $("practiceInput");
const checkBtn = $("checkBtn");
const showAnswerBtn = $("showAnswerBtn");
const practiceResult = $("practiceResult");

const gameArea = $("gameArea");
const choicesWrap = $("choices");
const gameResult = $("gameResult");

// ---------- rendering ----------
function setModeButtons(mode){
  modeLearnBtn.classList.toggle("primary", mode==="learn");
  modePracticeBtn.classList.toggle("primary", mode==="practice");
  modeGameBtn.classList.toggle("primary", mode==="game");
}

function showCard(card, mode){
  wordEs.textContent = card.es;
  wordEn.textContent = (mode === "learn") ? "—" : "—";
  hintLine.textContent = "";

  // image/emoji
  if (card.img){
    img.src = card.img;
    img.style.display = "block";
    emoji.style.display = "none";
    img.onerror = () => {
      img.style.display = "none";
      emoji.style.display = "block";
      emoji.textContent = card.emoji || "🍽️";
    };
  } else {
    img.style.display = "none";
    emoji.style.display = "block";
    emoji.textContent = card.emoji || "🍽️";
  }

  // areas
  practiceArea.style.display = (mode === "practice") ? "block" : "none";
  gameArea.style.display = (mode === "game") ? "block" : "none";

  practiceResult.textContent = "";
  gameResult.textContent = "";
  practiceInput.value = "";

  // reveal button meaning changes by mode
  if (mode === "learn"){
    revealBtn.textContent = "Mostrar inglés";
  } else if (mode === "practice"){
    revealBtn.textContent = "Mostrar inglés (pista)";
  } else {
    revealBtn.textContent = "Mostrar inglés";
  }

  // audio availability
  audioBtn.disabled = !card.audio;
  audioBtn.textContent = card.audio ? "▶️ Audio" : "Audio (pendiente)";
}

function updateProgressUI(){
  const s = getState();
  const learnedCount = Object.keys(s.learned || {}).length;
  const practicedCount = Object.keys(s.practice || {}).length;
  const total = CARDS.length;

  progressLine.textContent =
    `Aprendidas: ${learnedCount}/${total} • Practicadas: ${practicedCount}/${total} • Racha: ${s.game.streak} (Mejor: ${s.game.best})`;

  statusLine.textContent =
    s.mode === "learn"
      ? "Modo Aprender: mira la carta, revela el inglés, escucha, repite."
      : s.mode === "practice"
      ? "Modo Practicar: escribe en inglés y verifica."
      : "Modo Jugar: elige la opción correcta para mantener tu racha.";
}

function currentCard(){
  const s = getState();
  const idx = Math.max(0, Math.min(CARDS.length - 1, s.index));
  return CARDS[idx];
}

function goNext(){
  const s = getState();
  const nextIndex = (s.index + 1) % CARDS.length;
  setState({ index: nextIndex });
  render();
}

// ---------- quiz logic ----------
function revealEnglish(){
  const card = currentCard();
  wordEn.textContent = card.en;
}

function playAudio(){
  const card = currentCard();
  if (!card.audio) return;
  const a = new Audio(card.audio);
  a.currentTime = 0;
  a.play().catch(()=>{});
}

function markLearned(cardId){
  const s = getState();
  const learned = { ...(s.learned||{}), [cardId]: true };
  setState({ learned });
}

function checkPractice(){
  const card = currentCard();
  const s = getState();

  const answer = norm(practiceInput.value);
  const correct = norm(card.en);

  const prev = s.practice?.[card.id] || { correct: false, attempts: 0 };
  const attempts = prev.attempts + 1;

  let isRight = (answer === correct);

  // allow simple alternate forms if you want later (e.g., "fries" vs "french fries")
  // for now: exact.

  const practice = { ...(s.practice||{}), [card.id]: { correct: prev.correct || isRight, attempts } };
  setState({ practice });

  if (isRight){
    practiceResult.textContent = `✅ Correcto: "${card.en}"`;
    wordEn.textContent = card.en;
    markLearned(card.id);
  } else {
    practiceResult.textContent = `❌ Incorrecto. Intenta de nuevo. (Pista: usa “Mostrar inglés”)`;
  }

  updateProgressUI();
}

function setupGameChoices(){
  const card = currentCard();
  const s = getState();

  // 1 correct + 3 random incorrect
  const others = CARDS.filter(c => c.id !== card.id);
  const distractors = shuffle(others).slice(0, 3).map(c => c.en);
  const options = shuffle([card.en, ...distractors]);

  choicesWrap.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.type = "button";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      const picked = norm(opt) === norm(card.en);
      const nextGame = { ...s.game };

      if (picked){
        nextGame.streak = (nextGame.streak || 0) + 1;
        nextGame.best = Math.max(nextGame.best || 0, nextGame.streak);
        gameResult.textContent = `✅ Bien. Racha: ${nextGame.streak}`;
        wordEn.textContent = card.en;
        markLearned(card.id);
        setState({ game: nextGame });
        updateProgressUI();
        setTimeout(goNext, 450);
      } else {
        nextGame.streak = 0;
        setState({ game: nextGame });
        updateProgressUI();
        gameResult.textContent = `❌ No. Correcto: "${card.en}". Racha reiniciada.`;
        wordEn.textContent = card.en;
      }
    });
    choicesWrap.appendChild(btn);
  });
}

// ---------- main render ----------
function render(){
  const s = getState();
  setModeButtons(s.mode);

  const card = currentCard();
  showCard(card, s.mode);

  // mode-specific behavior
  if (s.mode === "learn"){
    // hide practice/game elements already handled
    hintLine.textContent = "Haz clic en “Mostrar inglés”, luego repite 3 veces.";
  }

  if (s.mode === "practice"){
    hintLine.textContent = "Escribe la palabra en inglés y presiona “Verificar”.";
  }

  if (s.mode === "game"){
    hintLine.textContent = "Elige la opción correcta para mantener tu racha.";
    setupGameChoices();
  }

  updateProgressUI();
}

// ---------- events ----------
modeLearnBtn.addEventListener("click", () => { setState({ mode:"learn" }); render(); });
modePracticeBtn.addEventListener("click", () => { setState({ mode:"practice" }); render(); });
modeGameBtn.addEventListener("click", () => { setState({ mode:"game" }); render(); });

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORE_KEY);
  render();
});

revealBtn.addEventListener("click", () => {
  revealEnglish();
  markLearned(currentCard().id);
  updateProgressUI();
});

audioBtn.addEventListener("click", playAudio);
nextBtn.addEventListener("click", goNext);

checkBtn.addEventListener("click", checkPractice);
showAnswerBtn.addEventListener("click", () => {
  revealEnglish();
  practiceResult.textContent = `Respuesta: "${currentCard().en}"`;
});

practiceInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkPractice();
});

// start
document.addEventListener("DOMContentLoaded", () => {
  render();
});
