/* Exprésate Studio - Phase 2. Local drafts only; no content is written to Supabase. */
(function () {
  "use strict";

  const ADMIN_EMAILS = ["ynoellugo@icloud.com"];
  const store = window.ExpresateLesson000Letters;
  const sb = window.supabaseClient;
  const SECTION_COPY = {
    dashboard: ["Content overview", "Dashboard", "Manage local content drafts and preview how they appear in Exprésate."],
    alphabet: ["Lesson 000", "Alphabet", "Edit letter content, examples, sound labels, and local media paths."],
    lessons: ["Future builder", "Lessons", "Plan reusable learning blocks for future guided lessons."],
    vocabulary: ["Future library", "Vocabulary", "Organize reusable words and translations across learning experiences."],
    quizzes: ["Future builder", "Quizzes", "Plan quick checks, answer feedback, and audio prompts."],
    media: ["Future library", "Media Library", "Prepare the workflow for images, audio, and reusable assets."],
    settings: ["Prototype configuration", "Settings", "Review the local-only data boundary for this Studio phase."]
  };

  const loading = document.querySelector("[data-admin-loading]");
  const denied = document.querySelector("[data-admin-denied]");
  const app = document.querySelector("[data-admin-dashboard]");
  const status = document.querySelector("[data-admin-status]");
  const list = document.querySelector("[data-admin-letter-list]");
  const form = document.querySelector("[data-admin-letter-form]");
  const title = document.querySelector("[data-admin-editor-title]");
  const letterPreview = document.querySelector("[data-admin-letter-preview]");
  const saveState = document.querySelector("[data-admin-save-state]");
  const imageWrap = document.querySelector("[data-admin-image-preview]");
  const image = document.querySelector("[data-admin-image]");
  const imageEmpty = document.querySelector("[data-admin-image-empty]");
  const imageFallback = document.querySelector("[data-admin-image-fallback]");
  const importFile = document.querySelector("[data-admin-import-file]");
  const exampleList = document.querySelector("[data-admin-example-list]");
  const draftStatus = document.querySelector("[data-admin-draft-status]");
  const updatedAt = document.querySelector("[data-admin-updated-at]");
  const sectionEyebrow = document.querySelector("[data-studio-eyebrow]");
  const sectionTitle = document.querySelector("[data-studio-title]");
  const sectionDescription = document.querySelector("[data-studio-description]");

  let documentState = null;
  let activeKey = "a";
  let activeSection = "dashboard";
  let saveTimer = 0;
  let hasAdminAccess = false;

  function normalizedEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function isAdmin(user) {
    return ADMIN_EMAILS.includes(normalizedEmail(user?.email));
  }

  function redirectToLogin() {
    window.location.replace(`auth.html?mode=login&redirect=${encodeURIComponent("admin.html")}`);
  }

  function showDenied(message) {
    hasAdminAccess = false;
    loading.hidden = true;
    app.hidden = true;
    denied.hidden = false;
    if (message) denied.querySelector("p").textContent = message;
  }

  function showStatus(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function activateSection(section) {
    if (!SECTION_COPY[section]) return;
    activeSection = section;
    document.querySelectorAll("[data-studio-panel]").forEach((panel) => {
      const active = panel.dataset.studioPanel === section;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    document.querySelectorAll("[data-studio-target]").forEach((button) => {
      const active = button.dataset.studioTarget === section;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    const copy = SECTION_COPY[section];
    sectionEyebrow.textContent = copy[0];
    sectionTitle.textContent = copy[1];
    sectionDescription.textContent = copy[2];
    if (section === "alphabet") renderEditor(activeKey);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function setField(name, value) {
    const field = form?.elements?.namedItem(name);
    if (field) field.value = value == null ? "" : String(value);
  }

  function createExampleRow(value) {
    const row = document.createElement("div");
    row.className = "admin-example-row";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 80;
    input.value = String(value || "");
    input.placeholder = "Example word";
    input.dataset.adminExampleInput = "";
    input.setAttribute("aria-label", "Example word");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "admin-icon-button";
    remove.dataset.adminRemoveExample = "";
    remove.setAttribute("aria-label", "Remove example");
    remove.textContent = "×";
    row.append(input, remove);
    return row;
  }

  function renderExamples(examples) {
    if (!exampleList) return;
    const values = Array.isArray(examples) && examples.length ? examples : [""];
    exampleList.replaceChildren(...values.map(createExampleRow));
  }

  function readFormIntoState() {
    if (!form || !documentState?.letters?.[activeKey]) return;
    const data = new FormData(form);
    const current = documentState.letters[activeKey];
    const examples = Array.from(form.querySelectorAll("[data-admin-example-input]"))
      .map((input) => input.value.trim())
      .filter(Boolean);
    documentState.letters[activeKey] = {
      ...current,
      letter: String(data.get("letter") || ""),
      word: String(data.get("word") || ""),
      spanish: String(data.get("spanish") || ""),
      sound: String(data.get("sound") || ""),
      pronunciation: String(data.get("pronunciation") || ""),
      imagePath: String(data.get("imagePath") || ""),
      examples
    };
  }

  function updateDraftSummary() {
    const hasDraft = Boolean(store.loadOverrideDocument());
    if (draftStatus) {
      draftStatus.textContent = hasDraft ? "Local draft active" : "Using defaults";
      draftStatus.classList.toggle("is-active", hasDraft);
    }
    if (updatedAt) {
      const stamp = documentState?.updatedAt;
      const date = stamp ? new Date(stamp) : null;
      updatedAt.textContent = date && !Number.isNaN(date.getTime())
        ? date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
        : "Not edited";
    }
  }

  function saveDraft(message) {
    if (!hasAdminAccess || !store || !documentState) return;
    readFormIntoState();
    documentState = store.saveOverrideDocument(documentState);
    renderLetterList();
    updateDraftSummary();
    if (saveState) saveState.textContent = "Saved locally";
    showStatus(message || "Draft saved in this browser.");
  }

  function scheduleSave() {
    if (saveState) saveState.textContent = "Saving…";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => saveDraft(), 500);
  }

  function renderLetterList() {
    if (!list || !documentState) return;
    const fragment = document.createDocumentFragment();
    store.LETTER_KEYS.forEach((key) => {
      const item = documentState.letters[key];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "admin-letter-item";
      button.classList.toggle("is-active", key === activeKey);
      button.dataset.letterKey = key;
      button.setAttribute("aria-pressed", key === activeKey ? "true" : "false");
      button.setAttribute("aria-label", `Edit letter ${item.letter}`);
      const letter = document.createElement("strong");
      letter.textContent = item.letter;
      const word = document.createElement("span");
      word.textContent = item.word;
      button.append(letter, word);
      fragment.appendChild(button);
    });
    list.replaceChildren(fragment);
  }

  function renderImage(path) {
    const safePath = String(path || "").trim();
    if (!imageWrap || !image || !imageEmpty || !imageFallback) return;
    image.hidden = true;
    imageFallback.hidden = true;
    imageEmpty.hidden = Boolean(safePath);
    if (!safePath) {
      image.removeAttribute("src");
      return;
    }
    image.src = safePath;
  }

  function renderEditor(key) {
    if (!documentState?.letters?.[key] || !form) return;
    activeKey = key;
    const item = documentState.letters[key];
    setField("letter", item.letter);
    setField("word", item.word);
    setField("spanish", item.spanish);
    setField("sound", item.sound);
    setField("pronunciation", item.pronunciation);
    setField("imagePath", item.imagePath);
    renderExamples(item.examples);
    title.textContent = `Letter ${item.letter}`;
    letterPreview.textContent = item.letter;
    renderImage(item.imagePath);
    list?.querySelectorAll("[data-letter-key]").forEach((button) => {
      const active = button.dataset.letterKey === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function initializeStudio() {
    const override = store.loadOverrideDocument();
    documentState = override || store.getDefaultDocument();
    renderLetterList();
    renderEditor(activeKey);
    updateDraftSummary();
    loading.hidden = true;
    denied.hidden = true;
    app.hidden = false;
    hasAdminAccess = true;
    activateSection("dashboard");
    showStatus(override
      ? "Local Alphabet draft loaded. Lesson 000 is using these changes on this device."
      : "Alphabet is using default data. Edit a letter to create a local draft.");
  }

  function exportJson() {
    saveDraft("Draft saved and prepared for export.");
    const blob = new Blob([JSON.stringify(documentState, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lesson-000-alphabet-letters.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function importJson(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const letters = parsed?.letters || parsed;
      if (!letters || typeof letters !== "object" || !store.LETTER_KEYS.some((key) => letters[key])) {
        throw new Error("The file does not contain compatible letter data.");
      }
      documentState = store.saveOverrideDocument(parsed);
      activeKey = "a";
      renderLetterList();
      renderEditor(activeKey);
      updateDraftSummary();
      activateSection("alphabet");
      showStatus(`Import complete: ${file.name}`);
      saveState.textContent = "Imported and saved";
    } catch (error) {
      showStatus(error?.message || "The JSON file could not be imported.", true);
    } finally {
      importFile.value = "";
    }
  }

  function resetAllData() {
    if (!window.confirm("Reset all 26 letters to the default data?")) return;
    documentState = store.resetOverrides();
    activeKey = "a";
    renderLetterList();
    renderEditor(activeKey);
    updateDraftSummary();
    showStatus("Default Alphabet data restored. The local draft was removed.");
    saveState.textContent = "Default values";
  }

  function resetCurrentLetter() {
    if (!window.confirm(`Reset letter ${documentState.letters[activeKey].letter} to its default data?`)) return;
    const defaults = store.getDefaultDocument();
    documentState.letters[activeKey] = defaults.letters[activeKey];
    documentState = store.saveOverrideDocument(documentState);
    renderLetterList();
    renderEditor(activeKey);
    updateDraftSummary();
    saveState.textContent = "Letter reset";
    showStatus(`Letter ${documentState.letters[activeKey].letter} restored to its default content.`);
  }

  async function applySession(session) {
    const user = session?.user;
    if (!user) {
      redirectToLogin();
      return;
    }
    if (!isAdmin(user)) {
      showDenied();
      return;
    }
    if (!hasAdminAccess) initializeStudio();
  }

  async function init() {
    if (!store) {
      showDenied("The content module could not be loaded.");
      return;
    }
    if (!sb?.auth?.getSession) {
      showDenied("The Supabase session could not be verified.");
      return;
    }
    const { data, error } = await sb.auth.getSession();
    if (error) {
      showDenied("The Supabase session could not be verified.");
      return;
    }
    await applySession(data?.session);
    sb.auth.onAuthStateChange((_event, session) => applySession(session));
  }

  document.addEventListener("click", (event) => {
    const sectionButton = event.target.closest("[data-studio-target], [data-studio-open]");
    if (sectionButton) {
      activateSection(sectionButton.dataset.studioTarget || sectionButton.dataset.studioOpen);
      return;
    }
    const letterButton = event.target.closest("[data-letter-key]");
    if (letterButton && letterButton.dataset.letterKey !== activeKey) {
      window.clearTimeout(saveTimer);
      readFormIntoState();
      documentState = store.saveOverrideDocument(documentState);
      renderLetterList();
      renderEditor(letterButton.dataset.letterKey);
      updateDraftSummary();
      saveState.textContent = "Saved locally";
      return;
    }
    if (event.target.closest("[data-admin-import]")) {
      importFile.click();
      return;
    }
    if (event.target.closest("[data-admin-export]")) {
      exportJson();
      return;
    }
    if (event.target.closest("[data-admin-reset]")) {
      resetAllData();
      return;
    }
    if (event.target.closest("[data-admin-reset-letter]")) {
      resetCurrentLetter();
      return;
    }
    if (event.target.closest("[data-admin-add-example]")) {
      exampleList.appendChild(createExampleRow(""));
      exampleList.querySelector(".admin-example-row:last-child input")?.focus();
      scheduleSave();
      return;
    }
    const removeExample = event.target.closest("[data-admin-remove-example]");
    if (removeExample) {
      removeExample.closest(".admin-example-row")?.remove();
      if (!exampleList.children.length) exampleList.appendChild(createExampleRow(""));
      scheduleSave();
    }
  });

  form?.addEventListener("input", scheduleSave);
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    window.clearTimeout(saveTimer);
    saveDraft("Alphabet draft saved locally.");
  });
  image?.addEventListener("error", () => {
    image.hidden = true;
    imageEmpty.hidden = true;
    imageFallback.hidden = false;
  });
  image?.addEventListener("load", () => {
    image.hidden = false;
    imageEmpty.hidden = true;
    imageFallback.hidden = true;
  });
  importFile?.addEventListener("change", () => importJson(importFile.files?.[0]));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
