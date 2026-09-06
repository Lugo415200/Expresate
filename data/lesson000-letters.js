/* ============================================================
   Lesson 000 alphabet content data.

   Phase 1 stores private draft overrides in localStorage only.
   A later admin phase can replace this adapter with Supabase rows
   without changing the Lesson 000 rendering contract.
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "expresate_admin_lesson000_letters_v2";
  const VERSION = 2;
  const LESSON_ID = "lesson-000-alphabet";
  const LETTER_KEYS = "abcdefghijklmnopqrstuvwxyz".split("");

  const DEFAULT_LETTERS = window.ExpresateLesson000.letters;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function cleanText(value, fallback, maxLength) {
    const text = (typeof value === "string" || typeof value === "number")
      ? String(value).replace(/[\u0000-\u001f\u007f]/g, " ").trim()
      : "";
    const fallbackText = (typeof fallback === "string" || typeof fallback === "number")
      ? String(fallback).replace(/[\u0000-\u001f\u007f]/g, " ").trim()
      : "";
    return (text || fallbackText).slice(0, maxLength || 160);
  }

  function cleanImagePath(value, fallback) {
    const path = String(value == null ? "" : value).trim().replace(/\\/g, "/");
    if (!path) return fallback || "";
    if (path.includes("..") || path.startsWith("/") || /:|\?|#/.test(path)) return fallback || "";
    return /^[a-zA-Z0-9_./-]+$/.test(path) ? path : (fallback || "");
  }

  function cleanAudioPath(value, fallback) {
    return cleanImagePath(value, fallback);
  }

  function normalizeExample(value, fallback) {
    const source = value && typeof value === "object" && !Array.isArray(value)
      ? value
      : { word: value };
    const base = fallback && typeof fallback === "object" ? fallback : {};
    const word = cleanText(source.word, base.word, 80);
    return {
      word,
      spanish: cleanText(source.spanish, base.spanish, 100),
      pronunciation: cleanText(source.pronunciation, base.pronunciation || word, 100),
      imagePath: cleanImagePath(source.imagePath || source.image, base.imagePath),
      audioPath: cleanAudioPath(source.audioPath || source.audio, base.audioPath),
      tip: cleanText(source.tip, base.tip, 220)
    };
  }

  function cleanExamples(value, fallbackExamples) {
    const fallback = Array.isArray(fallbackExamples)
      ? fallbackExamples.map((item) => normalizeExample(item, {}))
      : [];
    const source = Array.isArray(value) ? value : String(value || "").split(/[,\n·]/);
    const examples = source
      .map((item, index) => normalizeExample(item, fallback[index] || fallback[0] || {}))
      .filter((item) => item.word)
      .slice(0, 8);
    return examples.length ? examples : clone(fallback);
  }

  function normalizeLetter(value, key) {
    const fallback = DEFAULT_LETTERS[key];
    const source = value && typeof value === "object" ? value : {};
    const requestedLetter = cleanText(source.letter, fallback.letter, 1).toUpperCase();
    const fallbackExamples = cleanExamples(fallback.examples, []);
    const examples = cleanExamples(source.examples || source.extra, fallbackExamples);
    const primaryExample = examples[0] || normalizeExample({
      word: fallback.word,
      spanish: fallback.spanish,
      pronunciation: fallback.pronunciation,
      imagePath: fallback.imagePath
    }, {});

    return {
      letter: /^[A-Z]$/.test(requestedLetter) ? requestedLetter : fallback.letter,
      sound: cleanText(source.sound, fallback.sound, 60),
      word: cleanText(source.word, primaryExample.word || fallback.word, 80),
      pronunciation: cleanText(source.pronunciation, primaryExample.pronunciation || fallback.pronunciation, 100),
      spanish: cleanText(source.spanish, primaryExample.spanish || fallback.spanish, 100),
      imagePath: cleanImagePath(source.imagePath || source.sceneSrc || primaryExample.imagePath, fallback.imagePath),
      examples,
      tip: cleanText(source.tip, fallback.tip, 320)
    };
  }

  function normalizeDocument(payload) {
    const source = payload && typeof payload === "object" ? (payload.letters || payload) : {};
    const letters = {};
    LETTER_KEYS.forEach((key) => {
      letters[key] = normalizeLetter(source[key], key);
    });
    const updatedAt = typeof payload?.updatedAt === "string" ? payload.updatedAt.slice(0, 40) : "";
    return { version: VERSION, lessonId: LESSON_ID, updatedAt, letters };
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
      console.warn("[Lesson000Letters] Could not read local overrides.", error);
      return null;
    }
  }

  function getEffectiveDocument() {
    return loadOverrideDocument() || getDefaultDocument();
  }

  function saveOverrideDocument(payload) {
    const normalized = normalizeDocument({
      ...(payload && typeof payload === "object" ? payload : {}),
      updatedAt: new Date().toISOString()
    });
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
