/* Exprésate Studio Media Library - Phase 2.5 local-only data adapter. */
(function () {
  "use strict";

  const STORAGE_KEY = "expresate_studio_media_library_v1";
  const VERSION = 1;
  const MEDIA_TYPES = Object.freeze(["image", "audio", "animation", "texture", "character", "other"]);
  const IMAGE_EXTENSIONS = Object.freeze(["png", "jpg", "jpeg", "webp", "gif", "avif"]);
  const AUDIO_EXTENSIONS = Object.freeze(["mp3", "wav", "ogg", "m4a", "aac", "webm"]);

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
    return `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeItem(item, existing, touchUpdatedAt) {
    const source = item && typeof item === "object" ? item : {};
    const now = new Date().toISOString();
    const type = MEDIA_TYPES.includes(source.type) ? source.type : "other";
    return {
      id: cleanText(source.id, existing?.id || createId(), 100),
      title: cleanText(source.title, "Untitled asset", 100),
      type,
      category: cleanText(source.category, "Uncategorized", 80),
      tags: cleanTags(source.tags),
      assetPath: cleanPath(source.assetPath),
      thumbnailPath: cleanPath(source.thumbnailPath),
      description: cleanText(source.description, "", 500),
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
      console.warn("[StudioMedia] Local media data could not be read.", error);
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

  function resetLibrary() {
    localStorage.removeItem(STORAGE_KEY);
    return { version: VERSION, items: [] };
  }

  function extensionFor(path) {
    const match = cleanPath(path).toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
  }

  function isImagePath(path) {
    return IMAGE_EXTENSIONS.includes(extensionFor(path));
  }

  function isAudioPath(path) {
    return AUDIO_EXTENSIONS.includes(extensionFor(path));
  }

  window.ExpresateStudioMedia = Object.freeze({
    STORAGE_KEY,
    VERSION,
    MEDIA_TYPES,
    cleanPath,
    normalizeDocument,
    normalizeItem,
    loadDocument,
    saveDocument,
    upsertItem,
    removeItem,
    resetLibrary,
    isImagePath,
    isAudioPath
  });
})();
