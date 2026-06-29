/* Exprésate Studio Vocabulary Database - Phase 3 local-only data adapter. */
(function () {
  "use strict";

  const STORAGE_KEY = "expresate_studio_vocabulary_v1";
  const VERSION = 1;
  const PARTS_OF_SPEECH = Object.freeze(["noun", "verb", "adjective", "adverb", "phrase", "other"]);
  const DIFFICULTIES = Object.freeze(["A1", "A2", "B1", "B2", "C1", "C2"]);

  function cleanText(value, fallback, maxLength) {
    const text = String(value == null ? "" : value).trim().replace(/[\u0000-\u001f\u007f]/g, " ");
    return (text || fallback || "").slice(0, maxLength);
  }

  function cleanPath(value) {
    const path = cleanText(value, "", 240).replace(/\\/g, "/");
    if (!path) return "";
    if (/^(?:[a-z]+:|\/|#|\?|\.\.)/i.test(path) || path.includes("../") || path.includes("//")) return "";
    return path;
  }

  function cleanTags(value) {
    const source = Array.isArray(value) ? value : String(value || "").split(/[,\n]/);
    return Array.from(new Set(source
      .map((tag) => cleanText(tag, "", 40).toLowerCase())
      .filter(Boolean)))
      .slice(0, 20);
  }

  function cleanDate(value, fallback) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `vocab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeItem(item, existing, touchUpdatedAt) {
    const source = item && typeof item === "object" ? item : {};
    const now = new Date().toISOString();
    return {
      id: cleanText(source.id, existing?.id || createId(), 100),
      english: cleanText(source.english, "Untitled word", 120),
      spanish: cleanText(source.spanish, "", 160),
      pronunciation: cleanText(source.pronunciation, "", 160),
      ipa: cleanText(source.ipa, "", 120),
      partOfSpeech: PARTS_OF_SPEECH.includes(source.partOfSpeech) ? source.partOfSpeech : "other",
      difficulty: DIFFICULTIES.includes(source.difficulty) ? source.difficulty : "A1",
      category: cleanText(source.category, "Uncategorized", 80),
      tags: cleanTags(source.tags),
      imagePath: cleanPath(source.imagePath),
      audioPath: cleanPath(source.audioPath),
      exampleSentenceEnglish: cleanText(source.exampleSentenceEnglish, "", 320),
      exampleSentenceSpanish: cleanText(source.exampleSentenceSpanish, "", 360),
      notes: cleanText(source.notes, "", 600),
      createdAt: cleanDate(source.createdAt, existing?.createdAt || now),
      updatedAt: touchUpdatedAt ? now : cleanDate(source.updatedAt, existing?.updatedAt || now)
    };
  }

  function normalizeDocument(payload) {
    const source = Array.isArray(payload) ? payload : payload?.items;
    const seen = new Set();
    const items = (Array.isArray(source) ? source : []).map((item) => normalizeItem(item)).filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return { version: VERSION, items };
  }

  function loadDocument() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeDocument(JSON.parse(raw)) : { version: VERSION, items: [] };
    } catch (error) {
      console.warn("[StudioVocabulary] Local vocabulary data could not be read.", error);
      return { version: VERSION, items: [] };
    }
  }

  function saveDocument(payload) {
    const normalized = normalizeDocument(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalizeDocument(normalized);
  }

  function upsertItem(documentState, item) {
    const current = normalizeDocument(documentState);
    const existing = current.items.find((entry) => entry.id === item?.id);
    const normalized = normalizeItem(item, existing, true);
    const index = current.items.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) current.items[index] = normalized;
    else current.items.unshift(normalized);
    return saveDocument(current);
  }

  function removeItem(documentState, id) {
    const current = normalizeDocument(documentState);
    current.items = current.items.filter((item) => item.id !== id);
    return saveDocument(current);
  }

  function resetDatabase() {
    localStorage.removeItem(STORAGE_KEY);
    return { version: VERSION, items: [] };
  }

  // Future dictionary, lesson, quiz, and speech adapters should consume this
  // normalized document instead of reading unvalidated localStorage directly.
  window.ExpresateStudioVocabulary = Object.freeze({
    STORAGE_KEY,
    VERSION,
    PARTS_OF_SPEECH,
    DIFFICULTIES,
    cleanPath,
    normalizeDocument,
    normalizeItem,
    loadDocument,
    saveDocument,
    upsertItem,
    removeItem,
    resetDatabase
  });
})();
