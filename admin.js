/* Exprésate Admin Content Hub — Phase 1 (local drafts only). */
(function () {
  "use strict";

  const ADMIN_EMAILS = ["ynoellugo@icloud.com"];
  const store = window.ExpresateLesson000Letters;
  const sb = window.supabaseClient;

  const loading = document.querySelector("[data-admin-loading]");
  const denied = document.querySelector("[data-admin-denied]");
  const dashboard = document.querySelector("[data-admin-dashboard]");
  const status = document.querySelector("[data-admin-status]");
  const list = document.querySelector("[data-admin-letter-list]");
  const form = document.querySelector("[data-admin-letter-form]");
  const title = document.querySelector("[data-admin-editor-title]");
  const letterPreview = document.querySelector("[data-admin-letter-preview]");
  const saveState = document.querySelector("[data-admin-save-state]");
  const imageWrap = document.querySelector("[data-admin-image-preview]");
  const image = document.querySelector("[data-admin-image]");
  const imageFallback = document.querySelector("[data-admin-image-fallback]");
  const importButton = document.querySelector("[data-admin-import]");
  const importFile = document.querySelector("[data-admin-import-file]");
  const exportButton = document.querySelector("[data-admin-export]");
  const resetButton = document.querySelector("[data-admin-reset]");

  let documentState = null;
  let activeKey = "a";
  let saveTimer = 0;
  let hasAdminAccess = false;

  function normalizedEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function isAdmin(user) {
    return ADMIN_EMAILS.includes(normalizedEmail(user?.email));
  }

  function redirectToLogin() {
    const redirect = encodeURIComponent("admin.html");
    window.location.replace(`auth.html?mode=login&redirect=${redirect}`);
  }

  function showDenied() {
    hasAdminAccess = false;
    loading.hidden = true;
    dashboard.hidden = true;
    denied.hidden = false;
  }

  function showStatus(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function readFormIntoState() {
    if (!form || !documentState?.letters?.[activeKey]) return;
    const data = new FormData(form);
    const current = documentState.letters[activeKey];
    documentState.letters[activeKey] = {
      ...current,
      letter: String(data.get("letter") || ""),
      word: String(data.get("word") || ""),
      spanish: String(data.get("spanish") || ""),
      sound: String(data.get("sound") || ""),
      pronunciation: String(data.get("pronunciation") || ""),
      imagePath: String(data.get("imagePath") || ""),
      examples: String(data.get("examples") || "").split(/[,\n·]/).map((item) => item.trim()).filter(Boolean)
    };
  }

  function saveDraft(message) {
    if (!hasAdminAccess || !store || !documentState) return;
    readFormIntoState();
    documentState = store.saveOverrideDocument(documentState);
    renderLetterList();
    renderEditor(activeKey, { preserveFocus: true });
    if (saveState) saveState.textContent = "Guardado localmente";
    showStatus(message || "Borrador guardado en este navegador.");
  }

  function scheduleSave() {
    if (saveState) saveState.textContent = "Guardando…";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => saveDraft(), 400);
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
      button.setAttribute("aria-label", `Editar letra ${item.letter}`);
      const letter = document.createElement("strong");
      letter.textContent = item.letter;
      const word = document.createElement("span");
      word.textContent = item.word;
      button.append(letter, word);
      fragment.appendChild(button);
    });
    list.replaceChildren(fragment);
  }

  function setField(name, value) {
    const field = form?.elements?.namedItem(name);
    if (field) field.value = value == null ? "" : String(value);
  }

  function renderImage(path) {
    const safePath = String(path || "").trim();
    if (!imageWrap || !image || !imageFallback) return;
    imageWrap.hidden = !safePath;
    imageFallback.hidden = true;
    image.hidden = !safePath;
    if (!safePath) {
      image.removeAttribute("src");
      return;
    }
    image.src = safePath;
  }

  function renderEditor(key, options) {
    if (!documentState?.letters?.[key] || !form) return;
    activeKey = key;
    const item = documentState.letters[key];
    const focusedName = options?.preserveFocus ? document.activeElement?.name : "";
    setField("letter", item.letter);
    setField("word", item.word);
    setField("spanish", item.spanish);
    setField("sound", item.sound);
    setField("pronunciation", item.pronunciation);
    setField("examples", item.examples.join("\n"));
    setField("imagePath", item.imagePath);
    if (title) title.textContent = `Letra ${item.letter}`;
    if (letterPreview) letterPreview.textContent = item.letter;
    renderImage(item.imagePath);
    list?.querySelectorAll("[data-letter-key]").forEach((button) => {
      const active = button.dataset.letterKey === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (focusedName) form.elements.namedItem(focusedName)?.focus();
  }

  function initializeEditor() {
    documentState = store.loadOverrideDocument() || store.getDefaultDocument();
    renderLetterList();
    renderEditor(activeKey);
    loading.hidden = true;
    denied.hidden = true;
    dashboard.hidden = false;
    hasAdminAccess = true;
    showStatus(store.loadOverrideDocument()
      ? "Borrador local cargado. La Lección 000 ya puede usar estos cambios."
      : "Usando los datos predeterminados. Edita cualquier campo para crear un borrador local.");
  }

  function exportJson() {
    saveDraft("Borrador guardado y preparado para exportar.");
    const blob = new Blob([JSON.stringify(documentState, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lesson-000-alphabet-letters.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function importJson(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const letters = parsed?.letters || parsed;
      if (!letters || typeof letters !== "object" || !store.LETTER_KEYS.some((key) => letters[key])) {
        throw new Error("El archivo no contiene datos de letras compatibles.");
      }
      documentState = store.saveOverrideDocument(parsed);
      activeKey = "a";
      renderLetterList();
      renderEditor(activeKey);
      showStatus(`Importación completada: ${file.name}`);
      if (saveState) saveState.textContent = "Importado y guardado";
    } catch (error) {
      showStatus(error?.message || "No se pudo importar el archivo JSON.", true);
    } finally {
      importFile.value = "";
    }
  }

  function resetData() {
    if (!window.confirm("¿Restablecer las 26 letras a los datos predeterminados?")) return;
    documentState = store.resetOverrides();
    activeKey = "a";
    renderLetterList();
    renderEditor(activeKey);
    showStatus("Datos predeterminados restaurados. El borrador local fue eliminado.");
    if (saveState) saveState.textContent = "Valores predeterminados";
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
    if (!hasAdminAccess) initializeEditor();
  }

  async function init() {
    if (!store) {
      loading.hidden = true;
      showDenied();
      denied.querySelector("p").textContent = "No se pudo cargar el módulo de contenido.";
      return;
    }
    if (!sb?.auth?.getSession) {
      loading.hidden = true;
      showDenied();
      denied.querySelector("p").textContent = "No se pudo verificar la sesión de Supabase.";
      return;
    }

    const { data, error } = await sb.auth.getSession();
    if (error) {
      showDenied();
      return;
    }
    await applySession(data?.session);
    sb.auth.onAuthStateChange((_event, session) => applySession(session));
  }

  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-letter-key]");
    if (!button || button.dataset.letterKey === activeKey) return;
    window.clearTimeout(saveTimer);
    readFormIntoState();
    documentState = store.saveOverrideDocument(documentState);
    renderLetterList();
    renderEditor(button.dataset.letterKey);
    if (saveState) saveState.textContent = "Guardado localmente";
  });
  form?.addEventListener("input", scheduleSave);
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    window.clearTimeout(saveTimer);
    saveDraft("Cambios guardados localmente.");
  });
  image?.addEventListener("error", () => {
    image.hidden = true;
    imageFallback.hidden = false;
  });
  image?.addEventListener("load", () => {
    image.hidden = false;
    imageFallback.hidden = true;
  });
  importButton?.addEventListener("click", () => importFile?.click());
  importFile?.addEventListener("change", () => importJson(importFile.files?.[0]));
  exportButton?.addEventListener("click", exportJson);
  resetButton?.addEventListener("click", resetData);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
