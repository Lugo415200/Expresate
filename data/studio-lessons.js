/* Exprésate Studio Lesson Builder - Phase 4 local-only data adapter. */
(function () {
  "use strict";

  const STORAGE_KEY = "expresate_studio_lessons_v1";
  const VERSION = 1;
  const LEVELS = Object.freeze(["A1", "A2", "B1", "B2", "C1", "C2"]);
  const STATUSES = Object.freeze(["draft", "published"]);
  const BLOCK_TYPES = Object.freeze(["explanation", "vocabulary", "image", "quiz", "speech", "completion"]);
  const VOCABULARY_DISPLAY_MODES = Object.freeze(["cards", "list", "flashcards"]);

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

  function cleanSlug(value, fallback) {
    const slug = String(value || fallback || "lesson")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return (slug || "lesson").slice(0, 100);
  }

  function cleanTags(value) {
    const source = Array.isArray(value) ? value : String(value || "").split(/[,\n]/);
    return Array.from(new Set(source.map((tag) => cleanText(tag, "", 40).toLowerCase()).filter(Boolean))).slice(0, 20);
  }

  function cleanIds(value) {
    const source = Array.isArray(value) ? value : [];
    return Array.from(new Set(source.map((id) => cleanText(id, "", 100)).filter(Boolean))).slice(0, 100);
  }

  function cleanDate(value, fallback) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  function createId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function baseBlock(type, source) {
    return { id: cleanText(source?.id, createId("block"), 120), type };
  }

  function normalizeBlock(block) {
    const source = block && typeof block === "object" ? block : {};
    const type = BLOCK_TYPES.includes(source.type) ? source.type : "explanation";
    const base = baseBlock(type, source);
    if (type === "explanation") return {
      ...base,
      title: cleanText(source.title, "Explanation", 140),
      body: cleanText(source.body, "", 1600),
      consejo: cleanText(source.consejo, "", 500)
    };
    if (type === "vocabulary") return {
      ...base,
      selectedVocabularyIds: cleanIds(source.selectedVocabularyIds),
      displayMode: VOCABULARY_DISPLAY_MODES.includes(source.displayMode) ? source.displayMode : "cards",
      // Cloud-published lessons carry a safe snapshot because the Phase 7
      // vocabulary database remains local-only.
      resolvedVocabularyItems: (Array.isArray(source.resolvedVocabularyItems) ? source.resolvedVocabularyItems : [])
        .map((item) => ({
          id: cleanText(item?.id, "", 100),
          english: cleanText(item?.english, "", 160),
          spanish: cleanText(item?.spanish, "", 160),
          pronunciation: cleanText(item?.pronunciation, "", 180),
          imagePath: cleanPath(item?.imagePath),
          audioPath: cleanPath(item?.audioPath)
        }))
        .filter((item) => item.id && item.english)
        .slice(0, 100)
    };
    if (type === "image") return {
      ...base,
      title: cleanText(source.title, "", 140),
      imagePath: cleanPath(source.imagePath),
      caption: cleanText(source.caption, "", 400)
    };
    if (type === "quiz") return {
      ...base,
      question: cleanText(source.question, "Question", 500),
      options: (Array.isArray(source.options) ? source.options : []).map((option) => cleanText(option, "", 240)).filter(Boolean).slice(0, 8),
      correctAnswer: cleanText(source.correctAnswer, "", 240),
      explanation: cleanText(source.explanation, "", 600)
    };
    if (type === "speech") return {
      ...base,
      phrase: cleanText(source.phrase, "", 400),
      translation: cleanText(source.translation, "", 500),
      expectedText: cleanText(source.expectedText, "", 400),
      hint: cleanText(source.hint, "", 400)
    };
    const nextLessonSlug = source.nextLessonSlug ? cleanSlug(source.nextLessonSlug, "") : "";
    return {
      ...base,
      message: cleanText(source.message, "Lesson complete", 500),
      nextLessonSlug
    };
  }

  function normalizeLesson(lesson, existing, touchUpdatedAt) {
    const source = lesson && typeof lesson === "object" ? lesson : {};
    const now = new Date().toISOString();
    const title = cleanText(source.title, "Untitled lesson", 160);
    const xp = Number.parseInt(source.xpReward, 10);
    const seenBlocks = new Set();
    const blocks = (Array.isArray(source.blocks) ? source.blocks : []).map(normalizeBlock).filter((block) => {
      if (seenBlocks.has(block.id)) return false;
      seenBlocks.add(block.id);
      return true;
    }).slice(0, 100);
    return {
      id: cleanText(source.id, existing?.id || createId("lesson"), 120),
      title,
      slug: cleanSlug(source.slug, title),
      module: cleanText(source.module, "Unassigned", 100),
      level: LEVELS.includes(source.level) ? source.level : "A1",
      premium: source.premium === true || source.premium === "true" || source.premium === "on",
      xpReward: Number.isFinite(xp) ? Math.max(0, Math.min(1000, xp)) : 10,
      description: cleanText(source.description, "", 700),
      status: STATUSES.includes(source.status) ? source.status : "draft",
      tags: cleanTags(source.tags),
      blocks,
      createdAt: cleanDate(source.createdAt, existing?.createdAt || now),
      updatedAt: touchUpdatedAt ? now : cleanDate(source.updatedAt, existing?.updatedAt || now)
    };
  }

  function normalizeDocument(payload) {
    const source = Array.isArray(payload) ? payload : payload?.lessons;
    const seen = new Set();
    const lessons = (Array.isArray(source) ? source : []).map((lesson) => normalizeLesson(lesson)).filter((lesson) => {
      if (seen.has(lesson.id)) return false;
      seen.add(lesson.id);
      return true;
    });
    return { version: VERSION, lessons };
  }

  function loadDocument() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeDocument(JSON.parse(raw)) : { version: VERSION, lessons: [] };
    } catch (error) {
      console.warn("[StudioLessons] Local lesson data could not be read.", error);
      return { version: VERSION, lessons: [] };
    }
  }

  function saveDocument(payload) {
    const normalized = normalizeDocument(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalizeDocument(normalized);
  }

  function upsertLesson(documentState, lesson) {
    const current = normalizeDocument(documentState);
    const existing = current.lessons.find((entry) => entry.id === lesson?.id);
    const normalized = normalizeLesson(lesson, existing, true);
    const index = current.lessons.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) current.lessons[index] = normalized;
    else current.lessons.unshift(normalized);
    return saveDocument(current);
  }

  function removeLesson(documentState, id) {
    const current = normalizeDocument(documentState);
    current.lessons = current.lessons.filter((lesson) => lesson.id !== id);
    return saveDocument(current);
  }

  function resetDatabase() {
    localStorage.removeItem(STORAGE_KEY);
    return { version: VERSION, lessons: [] };
  }

  function createBlock(type) {
    return normalizeBlock({ type });
  }

  // Future course and live-renderer adapters should consume normalized lessons
  // here rather than reading unvalidated localStorage directly.
  window.ExpresateStudioLessons = Object.freeze({
    STORAGE_KEY,
    VERSION,
    LEVELS,
    STATUSES,
    BLOCK_TYPES,
    VOCABULARY_DISPLAY_MODES,
    cleanPath,
    cleanSlug,
    normalizeBlock,
    normalizeLesson,
    normalizeDocument,
    loadDocument,
    saveDocument,
    upsertLesson,
    removeLesson,
    resetDatabase,
    createBlock
  });
})();
