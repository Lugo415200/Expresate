/* ============================================================
   Lesson 000 alphabet content data.

   Phase 1 stores private draft overrides in localStorage only.
   A later admin phase can replace this adapter with Supabase rows
   without changing the Lesson 000 rendering contract.
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "expresate_admin_lesson000_letters_v1";
  const VERSION = 1;
  const LESSON_ID = "lesson-000-alphabet";
  const LETTER_KEYS = "abcdefghijklmnopqrstuvwxyz".split("");

  const DEFAULT_LETTERS = {
    a: { letter: "A", sound: "ay / ah", word: "Apple", pronunciation: "APPLE", spanish: "Manzana", imagePath: "assets/characters/letter-a-animals.png", examples: ["Ant", "Alligator", "Animal"], tip: "La letra A suele sonar como ah o ay dependiendo de la palabra." },
    b: { letter: "B", sound: "b", word: "Birds", pronunciation: "BIRDS", spanish: "Pájaros", imagePath: "assets/characters/letter-b-birds.png", examples: ["Bird", "Bluebird", "Branch"], tip: "La B en inglés es corta y firme. Junta los labios, suelta aire rápido y evita agregar una vocal al final." },
    c: { letter: "C", sound: "k / s", word: "Cat", pronunciation: "CAT", spanish: "Gato", imagePath: "assets/characters/letter-c-cat.png", examples: ["Cat", "City", "Circle"], tip: "La C puede sonar como K en cat o como S en city. Mira la palabra completa." },
    d: { letter: "D", sound: "d", word: "Dog", pronunciation: "DOG", spanish: "Perro", imagePath: "", examples: ["Dog"], tip: "La D en inglés es rápida. Evita agregar una vocal al final: di dog, no dog-eh." },
    e: { letter: "E", sound: "ee / eh", word: "Elephant", pronunciation: "ELEPHANT", spanish: "Elefante", imagePath: "", examples: ["Egg", "Elephant", "Evening"], tip: "El nombre de la letra E suena como ii, pero en palabras puede sonar más abierta." },
    f: { letter: "F", sound: "f", word: "Fish", pronunciation: "FISH", spanish: "Pez", imagePath: "", examples: ["Fish"], tip: "La F usa aire suave entre los dientes y el labio. No agregues una vocal al final." },
    g: { letter: "G", sound: "g / j", word: "Goat", pronunciation: "GOAT", spanish: "Cabra", imagePath: "", examples: ["Goat"], tip: "La G puede sonar fuerte como goat o suave como giant. La palabra decide." },
    h: { letter: "H", sound: "h", word: "Hat", pronunciation: "HAT", spanish: "Sombrero", imagePath: "", examples: ["Hat"], tip: "La H sí se escucha en inglés. Haz una salida suave de aire: hat." },
    i: { letter: "I", sound: "ai / ih", word: "Igloo", pronunciation: "IGLOO", spanish: "Iglú", imagePath: "", examples: ["Igloo"], tip: "El nombre de I suena como ai. Dentro de palabras puede sonar corto como ih." },
    j: { letter: "J", sound: "j", word: "Juice", pronunciation: "JUICE", spanish: "Jugo", imagePath: "", examples: ["Juice"], tip: "La J inglesa suena como una mezcla fuerte de d + y. Practica con juice." },
    k: { letter: "K", sound: "k", word: "Kite", pronunciation: "KITE", spanish: "Cometa", imagePath: "", examples: ["Kite"], tip: "K suele tener un sonido claro de K. Es útil para deletrear nombres y códigos." },
    l: { letter: "L", sound: "l", word: "Lion", pronunciation: "LION", spanish: "León", imagePath: "", examples: ["Lion"], tip: "La L toca arriba con la lengua. Mantén el sonido limpio: lion." },
    m: { letter: "M", sound: "m", word: "Moon", pronunciation: "MOON", spanish: "Luna", imagePath: "", examples: ["Moon"], tip: "M se pronuncia con los labios cerrados. Es una letra fácil para empezar." },
    n: { letter: "N", sound: "n", word: "Nose", pronunciation: "NOSE", spanish: "Nariz", imagePath: "", examples: ["Nose"], tip: "N usa la nariz y la lengua arriba. No la conviertas en ñ." },
    o: { letter: "O", sound: "oh / ah", word: "Orange", pronunciation: "ORANGE", spanish: "Naranja", imagePath: "", examples: ["Orange"], tip: "O puede sonar como ou en su nombre o más abierta dentro de palabras." },
    p: { letter: "P", sound: "p", word: "Pencil", pronunciation: "PENCIL", spanish: "Lápiz", imagePath: "", examples: ["Pencil"], tip: "La P inglesa tiene un pequeño golpe de aire. Practica pencil." },
    q: { letter: "Q", sound: "kw", word: "Queen", pronunciation: "QUEEN", spanish: "Reina", imagePath: "", examples: ["Queen"], tip: "Q casi siempre trabaja con U y suena como kw: queen." },
    r: { letter: "R", sound: "r inglesa", word: "Rabbit", pronunciation: "RABBIT", spanish: "Conejo", imagePath: "", examples: ["Rabbit"], tip: "La R inglesa no vibra como la R española. La lengua no debe golpear fuerte." },
    s: { letter: "S", sound: "s", word: "Sun", pronunciation: "SUN", spanish: "Sol", imagePath: "", examples: ["Sun"], tip: "S mantiene aire constante. Evita decir es-sun; empieza directo con S." },
    t: { letter: "T", sound: "t", word: "Tiger", pronunciation: "TIGER", spanish: "Tigre", imagePath: "", examples: ["Tiger"], tip: "La T inglesa puede tener más aire que en español. Hazla corta y clara." },
    u: { letter: "U", sound: "yu / uh", word: "Umbrella", pronunciation: "UMBRELLA", spanish: "Paraguas", imagePath: "", examples: ["Umbrella"], tip: "El nombre de U suena como iu, pero en umbrella suena más como uh." },
    v: { letter: "V", sound: "v", word: "Van", pronunciation: "VAN", spanish: "Camioneta", imagePath: "", examples: ["Van"], tip: "V no es igual que B. Usa labio y dientes para sentir vibración suave." },
    w: { letter: "W", sound: "w", word: "Water", pronunciation: "WATER", spanish: "Agua", imagePath: "", examples: ["Water"], tip: "W empieza con labios redondeados. Practica water sin empezar con gua." },
    x: { letter: "X", sound: "ks", word: "Box", pronunciation: "BOX", spanish: "Caja", imagePath: "", examples: ["Box"], tip: "X muchas veces suena como ks al final de una palabra: box." },
    y: { letter: "Y", sound: "y", word: "Yellow", pronunciation: "YELLOW", spanish: "Amarillo", imagePath: "", examples: ["Yellow"], tip: "Y al inicio suena como una y suave: yellow." },
    z: { letter: "Z", sound: "z", word: "Zebra", pronunciation: "ZEBRA", spanish: "Cebra", imagePath: "", examples: ["Zebra"], tip: "En inglés americano, Z vibra como zzz. No la pronuncies como S plana." }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function cleanText(value, fallback, maxLength) {
    const text = String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    return (text || fallback || "").slice(0, maxLength || 160);
  }

  function cleanImagePath(value, fallback) {
    const path = String(value == null ? "" : value).trim().replace(/\\/g, "/");
    if (!path) return fallback || "";
    if (path.includes("..") || path.startsWith("/") || /:|\?|#/.test(path)) return fallback || "";
    return /^[a-zA-Z0-9_./-]+$/.test(path) ? path : (fallback || "");
  }

  function cleanExamples(value, fallback) {
    const source = Array.isArray(value) ? value : String(value || "").split(/[,\n·]/);
    const examples = source
      .map((item) => cleanText(item, "", 48))
      .filter(Boolean)
      .slice(0, 8);
    return examples.length ? examples : clone(fallback || []);
  }

  function normalizeLetter(value, key) {
    const fallback = DEFAULT_LETTERS[key];
    const source = value && typeof value === "object" ? value : {};
    const requestedLetter = cleanText(source.letter, fallback.letter, 1).toUpperCase();
    return {
      letter: /^[A-Z]$/.test(requestedLetter) ? requestedLetter : fallback.letter,
      sound: cleanText(source.sound, fallback.sound, 60),
      word: cleanText(source.word, fallback.word, 80),
      pronunciation: cleanText(source.pronunciation, fallback.pronunciation, 100),
      spanish: cleanText(source.spanish, fallback.spanish, 100),
      imagePath: cleanImagePath(source.imagePath || source.sceneSrc, fallback.imagePath),
      examples: cleanExamples(source.examples || source.extra, fallback.examples),
      tip: cleanText(source.tip, fallback.tip, 320)
    };
  }

  function normalizeDocument(payload) {
    const source = payload && typeof payload === "object" ? (payload.letters || payload) : {};
    const letters = {};
    LETTER_KEYS.forEach((key) => {
      letters[key] = normalizeLetter(source[key], key);
    });
    return { version: VERSION, lessonId: LESSON_ID, letters };
  }

  function getDefaultDocument() {
    return normalizeDocument({ letters: DEFAULT_LETTERS });
  }

  function loadOverrideDocument() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return normalizeDocument(JSON.parse(raw));
    } catch (error) {
      console.warn("[Lesson000Letters] No se pudieron leer los borradores locales.", error);
      return null;
    }
  }

  function getEffectiveDocument() {
    return loadOverrideDocument() || getDefaultDocument();
  }

  function saveOverrideDocument(payload) {
    const normalized = normalizeDocument(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return clone(normalized);
  }

  function resetOverrides() {
    localStorage.removeItem(STORAGE_KEY);
    return getDefaultDocument();
  }

  window.ExpresateLesson000Letters = Object.freeze({
    STORAGE_KEY,
    VERSION,
    LESSON_ID,
    LETTER_KEYS: Object.freeze(LETTER_KEYS.slice()),
    getDefaultDocument,
    getEffectiveDocument,
    getEffectiveLetters: function () { return getEffectiveDocument().letters; },
    loadOverrideDocument,
    normalizeDocument,
    saveOverrideDocument,
    resetOverrides
  });
})();
