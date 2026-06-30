/* Exprésate Studio - local drafts only; no content is written to Supabase. */
(function () {
  "use strict";

  const ADMIN_EMAILS = ["ynoellugo@icloud.com"];
  const store = window.ExpresateLesson000Letters;
  const mediaStore = window.ExpresateStudioMedia;
  const vocabularyStore = window.ExpresateStudioVocabulary;
  const lessonStore = window.ExpresateStudioLessons;
  const sb = window.supabaseClient;
  const SECTION_COPY = {
    dashboard: ["Content overview", "Dashboard", "Manage local content drafts and preview how they appear in Exprésate."],
    alphabet: ["Lesson 000", "Alphabet", "Edit letter content, examples, sound labels, and local media paths."],
    lessons: ["Local lesson prototypes", "Lessons", "Build reusable guided lessons and preview them inside Studio."],
    vocabulary: ["Reusable content", "Vocabulary", "Create structured words and phrases for lessons, quizzes, and practice."],
    quizzes: ["Future builder", "Quizzes", "Plan quick checks, answer feedback, and audio prompts."],
    media: ["Asset catalog", "Media Library", "Organize local images, audio, animations, textures, and characters."],
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
  const mediaForm = document.querySelector("[data-media-form]");
  const mediaFormMode = document.querySelector("[data-media-form-mode]");
  const mediaFormTitle = document.querySelector("[data-media-form-title]");
  const mediaCancel = document.querySelector("[data-media-cancel]");
  const mediaFormPreview = document.querySelector("[data-media-form-preview]");
  const mediaGrid = document.querySelector("[data-media-grid]");
  const mediaEmpty = document.querySelector("[data-media-empty]");
  const mediaCount = document.querySelector("[data-media-count]");
  const mediaDashboardCount = document.querySelector("[data-media-dashboard-count]");
  const mediaSearch = document.querySelector("[data-media-search]");
  const mediaTypeFilter = document.querySelector("[data-media-type-filter]");
  const mediaCategoryFilter = document.querySelector("[data-media-category-filter]");
  const mediaImportFile = document.querySelector("[data-media-import-file]");
  const mediaPicker = document.querySelector("[data-media-picker]");
  const mediaPickerGrid = document.querySelector("[data-media-picker-grid]");
  const mediaPickerEmpty = document.querySelector("[data-media-picker-empty]");
  const mediaPickerSearch = document.querySelector("[data-media-picker-search]");
  const mediaPickerEyebrow = document.querySelector("[data-media-picker-eyebrow]");
  const mediaPickerTitle = document.querySelector("[data-media-picker-title]");
  const mediaPickerDescription = document.querySelector("[data-media-picker-description]");
  const vocabularyForm = document.querySelector("[data-vocab-form]");
  const vocabularyFormMode = document.querySelector("[data-vocab-form-mode]");
  const vocabularyFormTitle = document.querySelector("[data-vocab-form-title]");
  const vocabularyCancel = document.querySelector("[data-vocab-cancel]");
  const vocabularyImagePreview = document.querySelector("[data-vocab-image-preview]");
  const vocabularyAudioPreview = document.querySelector("[data-vocab-audio-preview]");
  const vocabularyGrid = document.querySelector("[data-vocab-grid]");
  const vocabularyEmpty = document.querySelector("[data-vocab-empty]");
  const vocabularyCount = document.querySelector("[data-vocab-count]");
  const vocabularyDashboardCount = document.querySelector("[data-vocab-dashboard-count]");
  const vocabularyRecentList = document.querySelector("[data-vocab-recent-list]");
  const vocabularyRecentEmpty = document.querySelector("[data-vocab-recent-empty]");
  const vocabularySearch = document.querySelector("[data-vocab-search]");
  const vocabularyDifficultyFilter = document.querySelector("[data-vocab-difficulty-filter]");
  const vocabularyPosFilter = document.querySelector("[data-vocab-pos-filter]");
  const vocabularyCategoryFilter = document.querySelector("[data-vocab-category-filter]");
  const vocabularyImportFile = document.querySelector("[data-vocab-import-file]");
  const lessonList = document.querySelector("[data-lesson-list]");
  const lessonListEmpty = document.querySelector("[data-lesson-list-empty]");
  const lessonCount = document.querySelector("[data-lesson-count]");
  const lessonDashboardCount = document.querySelector("[data-lesson-dashboard-count]");
  const lessonSearch = document.querySelector("[data-lesson-search]");
  const lessonModuleFilter = document.querySelector("[data-lesson-module-filter]");
  const lessonLevelFilter = document.querySelector("[data-lesson-level-filter]");
  const lessonStatusFilter = document.querySelector("[data-lesson-status-filter]");
  const lessonPremiumFilter = document.querySelector("[data-lesson-premium-filter]");
  const lessonBuilderEmpty = document.querySelector("[data-lesson-builder-empty]");
  const lessonEditor = document.querySelector("[data-lesson-editor]");
  const lessonForm = document.querySelector("[data-lesson-form]");
  const lessonEditorTitle = document.querySelector("[data-lesson-editor-title]");
  const lessonSaveState = document.querySelector("[data-lesson-save-state]");
  const lessonBlockType = document.querySelector("[data-lesson-block-type]");
  const lessonBlockList = document.querySelector("[data-lesson-block-list]");
  const lessonBlockEmpty = document.querySelector("[data-lesson-block-empty]");
  const lessonBuilderPanel = document.querySelector("[data-lesson-builder-panel]");
  const lessonPreviewPanel = document.querySelector("[data-lesson-preview-panel]");
  const lessonPreview = document.querySelector("[data-lesson-preview]");
  const lessonImportFile = document.querySelector("[data-lesson-import-file]");
  const vocabularyPicker = document.querySelector("[data-vocabulary-picker]");
  const vocabularyPickerSearch = document.querySelector("[data-vocabulary-picker-search]");
  const vocabularyPickerGrid = document.querySelector("[data-vocabulary-picker-grid]");
  const vocabularyPickerEmpty = document.querySelector("[data-vocabulary-picker-empty]");
  const vocabularyPickerCount = document.querySelector("[data-vocabulary-picker-count]");

  let documentState = null;
  let activeKey = "a";
  let activeSection = "dashboard";
  let saveTimer = 0;
  let hasAdminAccess = false;
  let mediaDocument = { version: 1, items: [] };
  let editingMediaId = "";
  let mediaPickerReturnFocus = null;
  let mediaPickerTarget = "alphabet-image";
  let vocabularyDocument = { version: 1, items: [] };
  let editingVocabularyId = "";
  let lessonDocument = { version: 1, lessons: [] };
  let activeLessonId = "";
  let lessonSaveTimer = 0;
  let mediaPickerBlockId = "";
  let vocabularyPickerBlockId = "";
  let vocabularyPickerReturnFocus = null;
  let vocabularyPickerSelection = new Set();

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

  function mediaSymbol(type) {
    return ({ image: "▧", audio: "♪", animation: "▶", texture: "◫", character: "☺", other: "•" })[type] || "•";
  }

  function createMediaPreview(item, compact) {
    const wrap = document.createElement("div");
    wrap.className = compact ? "media-card-preview" : "media-form-preview-content";
    const imagePath = mediaStore.cleanPath(item.thumbnailPath || item.assetPath);
    if (item.type !== "audio" && mediaStore.isImagePath(imagePath)) {
      const previewImage = document.createElement("img");
      previewImage.src = imagePath;
      previewImage.alt = `${item.title || "Media"} preview`;
      previewImage.addEventListener("error", () => {
        const fallback = document.createElement("span");
        fallback.className = "media-preview-symbol";
        fallback.textContent = mediaSymbol(item.type);
        previewImage.replaceWith(fallback);
      }, { once: true });
      wrap.appendChild(previewImage);
      return wrap;
    }
    if (item.type === "audio" && mediaStore.isAudioPath(item.assetPath)) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "none";
      audio.src = item.assetPath;
      audio.setAttribute("aria-label", `Preview ${item.title || "audio"}`);
      wrap.appendChild(audio);
      return wrap;
    }
    const fallback = document.createElement("span");
    fallback.className = "media-preview-symbol";
    fallback.textContent = mediaSymbol(item.type);
    wrap.appendChild(fallback);
    return wrap;
  }

  function renderMediaFormPreview() {
    if (!mediaForm || !mediaFormPreview) return;
    const data = new FormData(mediaForm);
    const item = {
      title: String(data.get("title") || "Media"),
      type: String(data.get("type") || "other"),
      assetPath: mediaStore.cleanPath(data.get("assetPath")),
      thumbnailPath: mediaStore.cleanPath(data.get("thumbnailPath"))
    };
    if (!item.assetPath && !item.thumbnailPath) {
      const message = document.createElement("span");
      message.textContent = "Preview appears after a valid image or audio path is entered.";
      mediaFormPreview.replaceChildren(message);
      return;
    }
    mediaFormPreview.replaceChildren(createMediaPreview(item, false));
  }

  function createTag(text) {
    const tag = document.createElement("span");
    tag.className = "media-tag";
    tag.textContent = text;
    return tag;
  }

  function createMediaCard(item) {
    const card = document.createElement("article");
    card.className = "media-card";
    card.dataset.mediaId = item.id;
    card.appendChild(createMediaPreview(item, true));

    const body = document.createElement("div");
    body.className = "media-card-body";
    const topline = document.createElement("div");
    topline.className = "media-card-topline";
    const badge = document.createElement("span");
    badge.className = "media-type-badge";
    badge.textContent = item.type;
    const category = document.createElement("span");
    category.className = "media-category";
    category.textContent = item.category;
    topline.append(badge, category);

    const heading = document.createElement("h4");
    heading.textContent = item.title;
    const description = document.createElement("p");
    description.className = "media-card-description";
    description.textContent = item.description || "No description.";
    const tags = document.createElement("div");
    tags.className = "media-tags";
    item.tags.slice(0, 5).forEach((tag) => tags.appendChild(createTag(tag)));
    const path = document.createElement("code");
    path.className = "media-path";
    path.textContent = item.assetPath || "No asset path";
    path.title = item.assetPath || "";

    const actions = document.createElement("div");
    actions.className = "media-card-actions";
    [
      ["Edit", "edit"],
      ["Copy path", "copy"],
      ["Delete", "delete"]
    ].forEach(([label, action]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.mediaAction = action;
      button.dataset.mediaId = item.id;
      if (action === "delete") button.classList.add("is-danger");
      actions.appendChild(button);
    });
    body.append(topline, heading, description, tags, path, actions);
    card.appendChild(body);
    return card;
  }

  function mediaMatchesFilters(item) {
    const query = String(mediaSearch?.value || "").trim().toLowerCase();
    const type = mediaTypeFilter?.value || "all";
    const category = mediaCategoryFilter?.value || "all";
    const searchable = [item.title, item.category, item.assetPath, item.description, ...item.tags].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (type === "all" || item.type === type)
      && (category === "all" || item.category === category);
  }

  function updateCategoryFilter() {
    if (!mediaCategoryFilter) return;
    const selected = mediaCategoryFilter.value;
    const categories = Array.from(new Set(mediaDocument.items.map((item) => item.category))).sort((a, b) => a.localeCompare(b));
    const options = [new Option("All categories", "all"), ...categories.map((category) => new Option(category, category))];
    mediaCategoryFilter.replaceChildren(...options);
    mediaCategoryFilter.value = categories.includes(selected) ? selected : "all";
  }

  function renderMediaLibrary() {
    if (!mediaGrid || !mediaEmpty) return;
    updateCategoryFilter();
    const filtered = mediaDocument.items.filter(mediaMatchesFilters);
    mediaGrid.replaceChildren(...filtered.map(createMediaCard));
    mediaGrid.hidden = filtered.length === 0;
    mediaEmpty.hidden = filtered.length !== 0;
    if (mediaCount) mediaCount.textContent = filtered.length === mediaDocument.items.length
      ? String(mediaDocument.items.length)
      : `${filtered.length}/${mediaDocument.items.length}`;
    if (mediaDashboardCount) mediaDashboardCount.textContent = String(mediaDocument.items.length);
    renderMediaPicker();
  }

  function clearMediaForm() {
    editingMediaId = "";
    mediaForm?.reset();
    if (mediaFormMode) mediaFormMode.textContent = "New asset";
    if (mediaFormTitle) mediaFormTitle.textContent = "Add media item";
    if (mediaCancel) mediaCancel.hidden = true;
    renderMediaFormPreview();
  }

  function editMediaItem(id) {
    const item = mediaDocument.items.find((entry) => entry.id === id);
    if (!item || !mediaForm) return;
    editingMediaId = item.id;
    const set = (name, value) => {
      const field = mediaForm.elements.namedItem(name);
      if (field) field.value = value == null ? "" : String(value);
    };
    set("id", item.id);
    set("title", item.title);
    set("type", item.type);
    set("category", item.category);
    set("tags", item.tags.join(", "));
    set("assetPath", item.assetPath);
    set("thumbnailPath", item.thumbnailPath);
    set("description", item.description);
    mediaFormMode.textContent = "Editing asset";
    mediaFormTitle.textContent = item.title;
    mediaCancel.hidden = false;
    renderMediaFormPreview();
    mediaForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function collectMediaForm() {
    const data = new FormData(mediaForm);
    const rawAssetPath = String(data.get("assetPath") || "").trim();
    const rawThumbnailPath = String(data.get("thumbnailPath") || "").trim();
    const assetPath = mediaStore.cleanPath(rawAssetPath);
    const thumbnailPath = mediaStore.cleanPath(rawThumbnailPath);
    if (!String(data.get("title") || "").trim()) throw new Error("Add a title before saving.");
    if (!assetPath) throw new Error("Add a valid project-relative asset path.");
    if (rawThumbnailPath && !thumbnailPath) throw new Error("The thumbnail path is not a safe project-relative path.");
    return {
      id: editingMediaId || String(data.get("id") || ""),
      title: String(data.get("title") || ""),
      type: String(data.get("type") || "other"),
      category: String(data.get("category") || ""),
      tags: String(data.get("tags") || "").split(","),
      assetPath,
      thumbnailPath,
      description: String(data.get("description") || "")
    };
  }

  function saveMediaItem(event) {
    event.preventDefault();
    try {
      const item = collectMediaForm();
      const wasEditing = Boolean(editingMediaId);
      mediaDocument = mediaStore.upsertItem(mediaDocument, item);
      renderMediaLibrary();
      clearMediaForm();
      showStatus(wasEditing ? "Media item updated locally." : "Media item added to the local library.");
    } catch (error) {
      showStatus(error?.message || "The media item could not be saved.", true);
    }
  }

  async function copyMediaPath(id) {
    const item = mediaDocument.items.find((entry) => entry.id === id);
    if (!item?.assetPath) return;
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(item.assetPath);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }
      if (!copied) {
        const field = document.createElement("textarea");
        field.value = item.assetPath;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        copied = Boolean(document.execCommand?.("copy"));
        field.remove();
      }
      if (!copied) throw new Error("Copy was not permitted.");
      showStatus(`Copied: ${item.assetPath}`);
    } catch (error) {
      const card = Array.from(document.querySelectorAll("[data-media-id]")).find((entry) => entry.dataset.mediaId === id);
      const pathText = card?.querySelector(".media-path");
      if (pathText && window.getSelection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(pathText);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        showStatus("Clipboard access is unavailable. The path is selected; press Ctrl+C to copy it.");
      } else {
        showStatus("The asset path could not be copied. Select the path from the card instead.", true);
      }
    }
  }

  function deleteMediaItem(id) {
    const item = mediaDocument.items.find((entry) => entry.id === id);
    if (!item || !window.confirm(`Delete “${item.title}” from the local Media Library?`)) return;
    mediaDocument = mediaStore.removeItem(mediaDocument, id);
    if (editingMediaId === id) clearMediaForm();
    renderMediaLibrary();
    showStatus("Media item deleted from this browser.");
  }

  function exportMediaLibrary() {
    const blob = new Blob([JSON.stringify(mediaDocument, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "expresate-studio-media-library.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showStatus("Media Library export prepared.");
  }

  async function importMediaLibrary(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed) && !Array.isArray(parsed?.items)) throw new Error("The file does not contain a compatible media item list.");
      mediaDocument = mediaStore.saveDocument(parsed);
      clearMediaForm();
      renderMediaLibrary();
      activateSection("media");
      showStatus(`Media import complete: ${file.name}`);
    } catch (error) {
      showStatus(error?.message || "The Media Library JSON could not be imported.", true);
    } finally {
      mediaImportFile.value = "";
    }
  }

  function resetMediaLibrary() {
    if (!window.confirm("Delete every item from the local Media Library?")) return;
    mediaDocument = mediaStore.resetLibrary();
    clearMediaForm();
    renderMediaLibrary();
    showStatus("The local Media Library was reset.");
  }

  function compatiblePickerItems() {
    const query = String(mediaPickerSearch?.value || "").trim().toLowerCase();
    return mediaDocument.items.filter((item) => {
      const compatible = mediaPickerTarget === "vocabulary-audio"
        ? item.type === "audio" && mediaStore.isAudioPath(item.assetPath)
        : ["vocabulary-image", "lesson-image"].includes(mediaPickerTarget)
          ? ["image", "character", "texture", "animation"].includes(item.type) && mediaStore.isImagePath(item.assetPath)
          : ["image", "character"].includes(item.type) && mediaStore.isImagePath(item.assetPath);
      const searchable = [item.title, item.category, ...item.tags].join(" ").toLowerCase();
      return compatible && (!query || searchable.includes(query));
    });
  }

  function createPickerItem(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "media-picker-item";
    button.dataset.pickMediaId = item.id;
    let preview;
    if (item.type === "audio") {
      preview = document.createElement("span");
      preview.className = "media-picker-audio-symbol";
      preview.textContent = "♪";
    } else {
      preview = document.createElement("img");
      preview.src = item.thumbnailPath || item.assetPath;
      preview.alt = "";
      preview.addEventListener("error", () => { preview.hidden = true; }, { once: true });
    }
    const body = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.title;
    const path = document.createElement("small");
    path.textContent = item.assetPath;
    body.append(title, path);
    button.append(preview, body);
    return button;
  }

  function renderMediaPicker() {
    if (!mediaPickerGrid || !mediaPickerEmpty) return;
    const items = compatiblePickerItems();
    mediaPickerGrid.replaceChildren(...items.map(createPickerItem));
    mediaPickerGrid.hidden = items.length === 0;
    mediaPickerEmpty.hidden = items.length !== 0;
  }

  function openMediaPicker(trigger) {
    mediaPickerReturnFocus = trigger || document.activeElement;
    mediaPickerTarget = trigger?.dataset?.mediaPickerTarget || "alphabet-image";
    mediaPickerBlockId = trigger?.dataset?.blockId || "";
    const isAudio = mediaPickerTarget === "vocabulary-audio";
    const isVocabulary = mediaPickerTarget.startsWith("vocabulary-");
    const isLesson = mediaPickerTarget === "lesson-image";
    mediaPickerEyebrow.textContent = isLesson ? "Lesson image block" : isVocabulary ? "Vocabulary asset" : "Alphabet image";
    mediaPickerTitle.textContent = isAudio ? "Choose vocabulary audio" : "Choose an image";
    mediaPickerDescription.textContent = isAudio
      ? "Select an Audio item to fill the vocabulary audio path."
      : isLesson
        ? "Select a visual asset to fill this lesson image block."
        : isVocabulary
        ? "Select a visual asset to fill the vocabulary image path."
        : "Select an Image or Character item to fill the current letter image path.";
    if (mediaPickerSearch) mediaPickerSearch.placeholder = isAudio
      ? "Search audio assets…"
      : "Search images and characters…";
    const pickerEmptyCopy = mediaPickerEmpty?.querySelector("p");
    if (pickerEmptyCopy) pickerEmptyCopy.textContent = isAudio
      ? "Add an Audio item to the Media Library first."
      : "Add an Image or Character item to the Media Library first.";
    if (mediaPickerSearch) mediaPickerSearch.value = "";
    renderMediaPicker();
    mediaPicker.hidden = false;
    document.body.classList.add("studio-modal-open");
    mediaPickerSearch?.focus();
  }

  function closeMediaPicker() {
    if (!mediaPicker || mediaPicker.hidden) return;
    mediaPicker.hidden = true;
    document.body.classList.remove("studio-modal-open");
    mediaPickerReturnFocus?.focus?.();
  }

  function chooseMediaItem(id) {
    const item = mediaDocument.items.find((entry) => entry.id === id);
    if (item && mediaPickerTarget === "lesson-image") {
      const lesson = activeLesson();
      const block = lesson?.blocks.find((entry) => entry.id === mediaPickerBlockId && entry.type === "image");
      if (!block) return;
      block.imagePath = item.assetPath;
      closeMediaPicker();
      saveActiveLesson(`${item.title} selected for the lesson image block.`, true);
      return;
    }
    const field = mediaPickerTarget === "vocabulary-image"
      ? vocabularyForm?.elements?.namedItem("imagePath")
      : mediaPickerTarget === "vocabulary-audio"
        ? vocabularyForm?.elements?.namedItem("audioPath")
        : form?.elements?.namedItem("imagePath");
    if (!item || !field) return;
    field.value = item.assetPath;
    if (mediaPickerTarget === "alphabet-image") {
      renderImage(item.assetPath);
      scheduleSave();
    } else {
      renderVocabularyPreviews();
    }
    closeMediaPicker();
    showStatus(mediaPickerTarget === "alphabet-image"
      ? `${item.title} selected for letter ${documentState.letters[activeKey].letter}.`
      : `${item.title} selected for the vocabulary ${mediaPickerTarget === "vocabulary-audio" ? "audio" : "image"} path.`);
  }

  function renderVocabularyPreviews() {
    if (!vocabularyForm) return;
    const imagePath = vocabularyStore.cleanPath(vocabularyForm.elements.namedItem("imagePath")?.value);
    const audioPath = vocabularyStore.cleanPath(vocabularyForm.elements.namedItem("audioPath")?.value);
    if (vocabularyImagePreview) {
      if (imagePath && mediaStore.isImagePath(imagePath)) {
        const image = document.createElement("img");
        image.src = imagePath;
        image.alt = "Vocabulary image preview";
        image.addEventListener("error", () => {
          const message = document.createElement("span");
          message.textContent = "Image could not be loaded.";
          image.replaceWith(message);
        }, { once: true });
        vocabularyImagePreview.replaceChildren(image);
      } else {
        const message = document.createElement("span");
        message.textContent = imagePath ? "Path is not a supported image." : "Image preview";
        vocabularyImagePreview.replaceChildren(message);
      }
    }
    if (vocabularyAudioPreview) {
      if (audioPath && mediaStore.isAudioPath(audioPath)) {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.preload = "none";
        audio.src = audioPath;
        audio.setAttribute("aria-label", "Vocabulary audio preview");
        vocabularyAudioPreview.replaceChildren(audio);
      } else {
        const message = document.createElement("span");
        message.textContent = audioPath ? "Path is not a supported audio file." : "Audio preview";
        vocabularyAudioPreview.replaceChildren(message);
      }
    }
  }

  function createVocabularyCard(item) {
    const card = document.createElement("article");
    card.className = "vocab-card";
    card.dataset.vocabId = item.id;
    const visual = document.createElement("div");
    visual.className = "vocab-card-visual";
    if (item.imagePath && mediaStore.isImagePath(item.imagePath)) {
      const image = document.createElement("img");
      image.src = item.imagePath;
      image.alt = `${item.english} visual`;
      image.addEventListener("error", () => {
        const fallback = document.createElement("span");
        fallback.className = "vocab-card-placeholder";
        fallback.textContent = item.english.slice(0, 1).toUpperCase();
        image.replaceWith(fallback);
      }, { once: true });
      visual.appendChild(image);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "vocab-card-placeholder";
      fallback.textContent = item.english.slice(0, 1).toUpperCase();
      visual.appendChild(fallback);
    }
    const indicators = document.createElement("div");
    indicators.className = "vocab-media-indicators";
    if (item.imagePath) {
      const imageIndicator = document.createElement("span");
      imageIndicator.textContent = "IMG";
      imageIndicator.title = "Image attached";
      indicators.appendChild(imageIndicator);
    }
    if (item.audioPath) {
      const audioIndicator = document.createElement("span");
      audioIndicator.textContent = "AUD";
      audioIndicator.title = "Audio attached";
      indicators.appendChild(audioIndicator);
    }
    visual.appendChild(indicators);

    const body = document.createElement("div");
    body.className = "vocab-card-body";
    const topline = document.createElement("div");
    topline.className = "vocab-card-topline";
    const difficulty = document.createElement("span");
    difficulty.className = "vocab-difficulty";
    difficulty.textContent = item.difficulty;
    const category = document.createElement("span");
    category.className = "media-category";
    category.textContent = `${item.category} · ${item.partOfSpeech}`;
    topline.append(difficulty, category);
    const heading = document.createElement("h4");
    heading.textContent = item.english;
    const translation = document.createElement("p");
    translation.className = "vocab-translation";
    translation.textContent = item.spanish || "No Spanish translation";
    const pronunciation = document.createElement("p");
    pronunciation.className = "vocab-pronunciation";
    pronunciation.textContent = [item.pronunciation, item.ipa].filter(Boolean).join(" · ") || "No pronunciation guidance";
    const example = document.createElement("p");
    example.className = "vocab-example";
    example.textContent = item.exampleSentenceEnglish || "No example sentence.";
    const tags = document.createElement("div");
    tags.className = "media-tags";
    item.tags.slice(0, 5).forEach((tag) => tags.appendChild(createTag(tag)));
    let audioPreview = null;
    if (item.audioPath && mediaStore.isAudioPath(item.audioPath)) {
      audioPreview = document.createElement("audio");
      audioPreview.className = "vocab-card-audio";
      audioPreview.controls = true;
      audioPreview.preload = "none";
      audioPreview.src = item.audioPath;
      audioPreview.setAttribute("aria-label", `Preview ${item.english} audio`);
    }
    const actions = document.createElement("div");
    actions.className = "vocab-card-actions";
    [["Edit", "edit"], ["Delete", "delete"]].forEach(([label, action]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.vocabAction = action;
      button.dataset.vocabId = item.id;
      if (action === "delete") button.classList.add("is-danger");
      actions.appendChild(button);
    });
    body.append(topline, heading, translation, pronunciation, example, tags);
    if (audioPreview) body.appendChild(audioPreview);
    body.appendChild(actions);
    card.append(visual, body);
    return card;
  }

  function vocabularyMatchesFilters(item) {
    const query = String(vocabularySearch?.value || "").trim().toLowerCase();
    const difficulty = vocabularyDifficultyFilter?.value || "all";
    const partOfSpeech = vocabularyPosFilter?.value || "all";
    const category = vocabularyCategoryFilter?.value || "all";
    const searchable = [item.english, item.spanish, item.category, item.pronunciation, item.ipa, ...item.tags].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (difficulty === "all" || item.difficulty === difficulty)
      && (partOfSpeech === "all" || item.partOfSpeech === partOfSpeech)
      && (category === "all" || item.category === category);
  }

  function updateVocabularyCategoryFilter() {
    if (!vocabularyCategoryFilter) return;
    const selected = vocabularyCategoryFilter.value;
    const categories = Array.from(new Set(vocabularyDocument.items.map((item) => item.category))).sort((a, b) => a.localeCompare(b));
    vocabularyCategoryFilter.replaceChildren(
      new Option("All categories", "all"),
      ...categories.map((category) => new Option(category, category))
    );
    vocabularyCategoryFilter.value = categories.includes(selected) ? selected : "all";
  }

  function renderRecentVocabulary() {
    if (!vocabularyRecentList || !vocabularyRecentEmpty) return;
    const recent = vocabularyDocument.items.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
    const rows = recent.map((item) => {
      const row = document.createElement("div");
      row.className = "vocab-recent-item";
      const copy = document.createElement("div");
      const english = document.createElement("strong");
      english.textContent = item.english;
      const spanish = document.createElement("small");
      spanish.textContent = item.spanish || "No translation";
      copy.append(english, spanish);
      const level = document.createElement("span");
      level.textContent = item.difficulty;
      row.append(copy, level);
      return row;
    });
    vocabularyRecentList.replaceChildren(...rows);
    vocabularyRecentList.hidden = rows.length === 0;
    vocabularyRecentEmpty.hidden = rows.length !== 0;
  }

  function renderVocabularyDatabase() {
    if (!vocabularyGrid || !vocabularyEmpty) return;
    updateVocabularyCategoryFilter();
    const filtered = vocabularyDocument.items.filter(vocabularyMatchesFilters);
    vocabularyGrid.replaceChildren(...filtered.map(createVocabularyCard));
    vocabularyGrid.hidden = filtered.length === 0;
    vocabularyEmpty.hidden = filtered.length !== 0;
    vocabularyCount.textContent = filtered.length === vocabularyDocument.items.length
      ? String(vocabularyDocument.items.length)
      : `${filtered.length}/${vocabularyDocument.items.length}`;
    vocabularyDashboardCount.textContent = String(vocabularyDocument.items.length);
    renderRecentVocabulary();
  }

  function clearVocabularyForm() {
    editingVocabularyId = "";
    vocabularyForm?.reset();
    if (vocabularyFormMode) vocabularyFormMode.textContent = "New item";
    if (vocabularyFormTitle) vocabularyFormTitle.textContent = "Add vocabulary";
    if (vocabularyCancel) vocabularyCancel.hidden = true;
    renderVocabularyPreviews();
  }

  function editVocabularyItem(id) {
    const item = vocabularyDocument.items.find((entry) => entry.id === id);
    if (!item || !vocabularyForm) return;
    editingVocabularyId = item.id;
    const set = (name, value) => {
      const field = vocabularyForm.elements.namedItem(name);
      if (field) field.value = value == null ? "" : String(value);
    };
    Object.entries(item).forEach(([name, value]) => {
      if (name === "tags") set(name, value.join(", "));
      else set(name, value);
    });
    vocabularyFormMode.textContent = "Editing item";
    vocabularyFormTitle.textContent = item.english;
    vocabularyCancel.hidden = false;
    renderVocabularyPreviews();
    vocabularyForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function collectVocabularyForm() {
    const data = new FormData(vocabularyForm);
    const rawImagePath = String(data.get("imagePath") || "").trim();
    const rawAudioPath = String(data.get("audioPath") || "").trim();
    const imagePath = vocabularyStore.cleanPath(rawImagePath);
    const audioPath = vocabularyStore.cleanPath(rawAudioPath);
    if (!String(data.get("english") || "").trim()) throw new Error("Add the English word or phrase before saving.");
    if (!String(data.get("spanish") || "").trim()) throw new Error("Add the Spanish translation before saving.");
    if (rawImagePath && !imagePath) throw new Error("The image path is not a safe project-relative path.");
    if (rawAudioPath && !audioPath) throw new Error("The audio path is not a safe project-relative path.");
    return {
      id: editingVocabularyId || String(data.get("id") || ""),
      english: String(data.get("english") || ""),
      spanish: String(data.get("spanish") || ""),
      pronunciation: String(data.get("pronunciation") || ""),
      ipa: String(data.get("ipa") || ""),
      partOfSpeech: String(data.get("partOfSpeech") || "other"),
      difficulty: String(data.get("difficulty") || "A1"),
      category: String(data.get("category") || ""),
      tags: String(data.get("tags") || "").split(","),
      imagePath,
      audioPath,
      exampleSentenceEnglish: String(data.get("exampleSentenceEnglish") || ""),
      exampleSentenceSpanish: String(data.get("exampleSentenceSpanish") || ""),
      notes: String(data.get("notes") || "")
    };
  }

  function saveVocabularyItem(event) {
    event.preventDefault();
    try {
      const item = collectVocabularyForm();
      const wasEditing = Boolean(editingVocabularyId);
      vocabularyDocument = vocabularyStore.upsertItem(vocabularyDocument, item);
      renderVocabularyDatabase();
      clearVocabularyForm();
      showStatus(wasEditing ? "Vocabulary item updated locally." : "Vocabulary item added to the local database.");
    } catch (error) {
      showStatus(error?.message || "The vocabulary item could not be saved.", true);
    }
  }

  function deleteVocabularyItem(id) {
    const item = vocabularyDocument.items.find((entry) => entry.id === id);
    if (!item || !window.confirm(`Delete “${item.english}” from the local Vocabulary Database?`)) return;
    vocabularyDocument = vocabularyStore.removeItem(vocabularyDocument, id);
    if (editingVocabularyId === id) clearVocabularyForm();
    renderVocabularyDatabase();
    showStatus("Vocabulary item deleted from this browser.");
  }

  function exportVocabulary() {
    const blob = new Blob([JSON.stringify(vocabularyDocument, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "expresate-studio-vocabulary.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showStatus("Vocabulary export prepared.");
  }

  async function importVocabulary(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed) && !Array.isArray(parsed?.items)) throw new Error("The file does not contain a compatible vocabulary item list.");
      vocabularyDocument = vocabularyStore.saveDocument(parsed);
      clearVocabularyForm();
      renderVocabularyDatabase();
      activateSection("vocabulary");
      showStatus(`Vocabulary import complete: ${file.name}`);
    } catch (error) {
      showStatus(error?.message || "The Vocabulary JSON could not be imported.", true);
    } finally {
      vocabularyImportFile.value = "";
    }
  }

  function resetVocabulary() {
    if (!window.confirm("Delete every item from the local Vocabulary Database?")) return;
    vocabularyDocument = vocabularyStore.resetDatabase();
    clearVocabularyForm();
    renderVocabularyDatabase();
    showStatus("The local Vocabulary Database was reset.");
  }

  function activeLesson() {
    return lessonDocument.lessons.find((lesson) => lesson.id === activeLessonId) || null;
  }

  function textElement(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    return element;
  }

  function lessonField(labelText, field, value, options) {
    const label = document.createElement("label");
    label.className = options?.wide ? "lesson-block-field is-wide" : "lesson-block-field";
    label.appendChild(textElement("span", "", labelText));
    let input;
    if (options?.select) {
      input = document.createElement("select");
      options.select.forEach(([optionValue, optionLabel]) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionLabel;
        input.appendChild(option);
      });
    } else if (options?.textarea) {
      input = document.createElement("textarea");
      input.rows = options.rows || 3;
    } else {
      input = document.createElement("input");
      input.type = options?.type || "text";
    }
    input.value = value == null ? "" : String(value);
    input.dataset.blockField = field;
    if (options?.placeholder) input.placeholder = options.placeholder;
    label.appendChild(input);
    return label;
  }

  function selectedVocabularyItems(block) {
    const selected = new Set(block.selectedVocabularyIds || []);
    return vocabularyDocument.items.filter((item) => selected.has(item.id));
  }

  function renderSelectedVocabulary(block) {
    const wrap = document.createElement("div");
    wrap.className = "lesson-selected-vocabulary";
    const items = selectedVocabularyItems(block);
    if (!items.length) {
      wrap.appendChild(textElement("p", "lesson-inline-empty", "No vocabulary selected."));
      return wrap;
    }
    items.forEach((item) => {
      const chip = document.createElement("div");
      const words = document.createElement("span");
      words.append(textElement("strong", "", item.english), document.createTextNode(` — ${item.spanish}`));
      const indicators = document.createElement("small");
      indicators.textContent = [item.imagePath ? "image" : "", item.audioPath ? "audio" : ""].filter(Boolean).join(" + ") || item.difficulty;
      chip.append(words, indicators);
      wrap.appendChild(chip);
    });
    return wrap;
  }

  function createBlockFields(block) {
    const fields = document.createElement("div");
    fields.className = "lesson-block-fields";
    if (block.type === "explanation") {
      fields.append(
        lessonField("Title", "title", block.title),
        lessonField("Body", "body", block.body, { textarea: true, rows: 5, wide: true }),
        lessonField("Consejo (optional)", "consejo", block.consejo, { textarea: true, wide: true })
      );
    } else if (block.type === "vocabulary") {
      fields.appendChild(lessonField("Display mode", "displayMode", block.displayMode, { select: [["cards", "Cards"], ["list", "List"], ["flashcards", "Flashcards"]] }));
      const pickerButton = document.createElement("button");
      pickerButton.type = "button";
      pickerButton.className = "btn lesson-vocabulary-picker-button";
      pickerButton.dataset.openVocabularyPicker = "";
      pickerButton.dataset.blockId = block.id;
      pickerButton.textContent = "Select vocabulary";
      fields.append(pickerButton, renderSelectedVocabulary(block));
    } else if (block.type === "image") {
      fields.append(
        lessonField("Title (optional)", "title", block.title),
        lessonField("Image path", "imagePath", block.imagePath, { placeholder: "assets/..." }),
        lessonField("Caption (optional)", "caption", block.caption, { textarea: true, wide: true })
      );
      const pickerButton = document.createElement("button");
      pickerButton.type = "button";
      pickerButton.className = "btn lesson-media-picker-button";
      pickerButton.dataset.openMediaPicker = "";
      pickerButton.dataset.mediaPickerTarget = "lesson-image";
      pickerButton.dataset.blockId = block.id;
      pickerButton.textContent = "Choose from Media Library";
      fields.appendChild(pickerButton);
    } else if (block.type === "quiz") {
      fields.append(
        lessonField("Question", "question", block.question, { textarea: true, wide: true }),
        lessonField("Options (one per line)", "options", (block.options || []).join("\n"), { textarea: true, rows: 5 }),
        lessonField("Correct answer", "correctAnswer", block.correctAnswer),
        lessonField("Explanation (optional)", "explanation", block.explanation, { textarea: true, wide: true })
      );
    } else if (block.type === "speech") {
      fields.append(
        lessonField("Phrase", "phrase", block.phrase, { textarea: true }),
        lessonField("Translation", "translation", block.translation, { textarea: true }),
        lessonField("Expected text", "expectedText", block.expectedText),
        lessonField("Hint (optional)", "hint", block.hint)
      );
    } else {
      fields.append(
        lessonField("Completion message", "message", block.message, { textarea: true, wide: true }),
        lessonField("Next lesson slug (optional)", "nextLessonSlug", block.nextLessonSlug)
      );
    }
    return fields;
  }

  function createBlockCard(block, index, total) {
    const card = document.createElement("article");
    card.className = "studio-card lesson-block-card";
    card.dataset.blockId = block.id;
    const header = document.createElement("header");
    const identity = document.createElement("div");
    identity.append(textElement("span", "lesson-block-index", `Step ${index + 1}`), textElement("h4", "", block.type));
    const actions = document.createElement("div");
    actions.className = "lesson-block-actions";
    [["up", "Move up", "↑"], ["down", "Move down", "↓"], ["delete", "Delete block", "×"]].forEach(([action, label, symbol]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = action === "delete" ? "admin-icon-button is-danger" : "admin-icon-button";
      button.dataset.blockAction = action;
      button.dataset.blockId = block.id;
      button.setAttribute("aria-label", label);
      button.textContent = symbol;
      if ((action === "up" && index === 0) || (action === "down" && index === total - 1)) button.disabled = true;
      actions.appendChild(button);
    });
    header.append(identity, actions);
    card.append(header, createBlockFields(block));
    return card;
  }

  function renderLessonBlocks() {
    const lesson = activeLesson();
    if (!lessonBlockList || !lessonBlockEmpty) return;
    const blocks = lesson?.blocks || [];
    lessonBlockList.replaceChildren(...blocks.map((block, index) => createBlockCard(block, index, blocks.length)));
    lessonBlockList.hidden = blocks.length === 0;
    lessonBlockEmpty.hidden = blocks.length !== 0;
  }

  function appendPreviewText(parent, tag, value, className) {
    if (!value) return;
    parent.appendChild(textElement(tag, className || "", value));
  }

  function createLessonPreviewBlock(block) {
    const card = document.createElement("article");
    card.className = `studio-preview-block is-${block.type}`;
    appendPreviewText(card, "span", block.type, "studio-preview-type");
    if (block.type === "explanation") {
      appendPreviewText(card, "h3", block.title);
      appendPreviewText(card, "p", block.body);
      appendPreviewText(card, "aside", block.consejo, "studio-preview-consejo");
    } else if (block.type === "vocabulary") {
      appendPreviewText(card, "h3", "Vocabulary");
      const grid = document.createElement("div");
      grid.className = `studio-preview-vocabulary is-${block.displayMode}`;
      selectedVocabularyItems(block).forEach((item) => {
        const itemCard = document.createElement("div");
        if (item.imagePath) {
          const image = document.createElement("img");
          image.src = item.imagePath;
          image.alt = "";
          image.addEventListener("error", () => { image.hidden = true; }, { once: true });
          itemCard.appendChild(image);
        }
        itemCard.append(textElement("strong", "", item.english), textElement("span", "", item.spanish));
        if (item.audioPath) itemCard.appendChild(textElement("small", "", "Audio available"));
        grid.appendChild(itemCard);
      });
      if (!grid.children.length) appendPreviewText(grid, "p", "No vocabulary selected.");
      card.appendChild(grid);
    } else if (block.type === "image") {
      appendPreviewText(card, "h3", block.title);
      if (block.imagePath) {
        const image = document.createElement("img");
        image.src = block.imagePath;
        image.alt = block.caption || block.title || "Lesson image";
        image.addEventListener("error", () => { image.replaceWith(textElement("p", "lesson-inline-empty", "Image could not be loaded.")); }, { once: true });
        card.appendChild(image);
      }
      appendPreviewText(card, "p", block.caption);
    } else if (block.type === "quiz") {
      appendPreviewText(card, "h3", block.question);
      const options = document.createElement("div");
      options.className = "studio-preview-options";
      (block.options || []).forEach((option) => options.appendChild(textElement("div", option === block.correctAnswer ? "is-correct" : "", option)));
      card.appendChild(options);
      appendPreviewText(card, "p", block.explanation);
    } else if (block.type === "speech") {
      appendPreviewText(card, "h3", block.phrase || "Speech practice");
      appendPreviewText(card, "p", block.translation);
      appendPreviewText(card, "strong", block.expectedText ? `Expected: ${block.expectedText}` : "");
      appendPreviewText(card, "small", block.hint);
    } else {
      appendPreviewText(card, "h3", block.message || "Lesson complete");
      appendPreviewText(card, "p", block.nextLessonSlug ? `Next lesson: ${block.nextLessonSlug}` : "");
    }
    return card;
  }

  function renderLessonPreview() {
    if (!lessonPreview) return;
    const lesson = activeLesson();
    if (!lesson) {
      lessonPreview.replaceChildren();
      return;
    }
    const header = document.createElement("header");
    header.className = "studio-preview-lesson-header";
    header.append(textElement("span", "admin-eyebrow", `${lesson.module} · ${lesson.level}`), textElement("h2", "", lesson.title), textElement("p", "", lesson.description || "No description yet."));
    const badges = document.createElement("div");
    badges.className = "studio-preview-badges";
    badges.append(textElement("span", "", lesson.status), textElement("span", "", `${lesson.xpReward} XP`));
    if (lesson.premium) badges.appendChild(textElement("span", "is-premium", "Premium"));
    header.appendChild(badges);
    lessonPreview.replaceChildren(header, ...(lesson.blocks || []).map(createLessonPreviewBlock));
  }

  function setLessonForm(lesson) {
    if (!lessonForm || !lesson) return;
    ["id", "title", "slug", "module", "level", "status", "xpReward", "description"].forEach((name) => {
      const field = lessonForm.elements.namedItem(name);
      if (field) field.value = lesson[name] == null ? "" : String(lesson[name]);
    });
    lessonForm.elements.namedItem("tags").value = lesson.tags.join(", ");
    lessonForm.elements.namedItem("premium").checked = lesson.premium;
    lessonEditorTitle.textContent = lesson.title;
  }

  function renderLessonEditor() {
    const lesson = activeLesson();
    lessonBuilderEmpty.hidden = Boolean(lesson);
    lessonEditor.hidden = !lesson;
    if (!lesson) return;
    setLessonForm(lesson);
    renderLessonBlocks();
    renderLessonPreview();
  }

  function filteredLessons() {
    const query = String(lessonSearch?.value || "").trim().toLowerCase();
    const module = lessonModuleFilter?.value || "all";
    const level = lessonLevelFilter?.value || "all";
    const statusValue = lessonStatusFilter?.value || "all";
    const premium = lessonPremiumFilter?.value || "all";
    return lessonDocument.lessons.filter((lesson) => {
      const searchable = [lesson.title, lesson.slug, lesson.module, ...lesson.tags].join(" ").toLowerCase();
      return (!query || searchable.includes(query)) && (module === "all" || lesson.module === module) && (level === "all" || lesson.level === level) && (statusValue === "all" || lesson.status === statusValue) && (premium === "all" || (premium === "premium") === lesson.premium);
    });
  }

  function renderLessonModuleFilter() {
    if (!lessonModuleFilter) return;
    const current = lessonModuleFilter.value;
    const first = document.createElement("option");
    first.value = "all";
    first.textContent = "All modules";
    const modules = Array.from(new Set(lessonDocument.lessons.map((lesson) => lesson.module).filter(Boolean))).sort();
    lessonModuleFilter.replaceChildren(first, ...modules.map((module) => {
      const option = document.createElement("option");
      option.value = module;
      option.textContent = module;
      return option;
    }));
    lessonModuleFilter.value = modules.includes(current) ? current : "all";
  }

  function createLessonListItem(lesson) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lesson-list-item";
    button.classList.toggle("is-active", lesson.id === activeLessonId);
    button.dataset.lessonId = lesson.id;
    button.setAttribute("aria-pressed", lesson.id === activeLessonId ? "true" : "false");
    const top = document.createElement("span");
    top.append(textElement("strong", "", lesson.title), textElement("small", "", lesson.status));
    const meta = textElement("span", "lesson-list-meta", `${lesson.module} · ${lesson.level} · ${lesson.blocks.length} blocks${lesson.premium ? " · Premium" : ""}`);
    button.append(top, meta);
    return button;
  }

  function renderLessonDatabase() {
    renderLessonModuleFilter();
    const lessons = filteredLessons();
    lessonList.replaceChildren(...lessons.map(createLessonListItem));
    lessonList.hidden = lessons.length === 0;
    lessonListEmpty.hidden = lessons.length !== 0;
    lessonCount.textContent = String(lessonDocument.lessons.length);
    if (lessonDashboardCount) lessonDashboardCount.textContent = String(lessonDocument.lessons.length);
    renderLessonEditor();
  }

  function readLessonForm() {
    const lesson = activeLesson();
    if (!lesson || !lessonForm) return lesson;
    const data = new FormData(lessonForm);
    return {
      ...lesson,
      title: String(data.get("title") || ""),
      slug: String(data.get("slug") || ""),
      module: String(data.get("module") || ""),
      level: String(data.get("level") || "A1"),
      status: String(data.get("status") || "draft"),
      xpReward: String(data.get("xpReward") || "0"),
      premium: data.get("premium") === "on",
      description: String(data.get("description") || ""),
      tags: String(data.get("tags") || "")
    };
  }

  function saveActiveLesson(message, rerender) {
    const lesson = readLessonForm();
    if (!lesson) return;
    lessonDocument = lessonStore.upsertLesson(lessonDocument, lesson);
    activeLessonId = lesson.id;
    if (lessonSaveState) lessonSaveState.textContent = "Saved locally";
    if (rerender) renderLessonDatabase();
    else {
      renderLessonModuleFilter();
      const lessons = filteredLessons();
      lessonList.replaceChildren(...lessons.map(createLessonListItem));
      lessonList.hidden = lessons.length === 0;
      lessonListEmpty.hidden = lessons.length !== 0;
      renderLessonPreview();
    }
    if (message) showStatus(message);
  }

  function scheduleLessonSave() {
    if (lessonSaveState) lessonSaveState.textContent = "Saving…";
    window.clearTimeout(lessonSaveTimer);
    lessonSaveTimer = window.setTimeout(() => saveActiveLesson(), 450);
  }

  function createLesson() {
    const number = lessonDocument.lessons.length + 1;
    const lesson = lessonStore.normalizeLesson({ title: `New lesson ${number}`, slug: `new-lesson-${number}`, module: "Module 1", level: "A1", status: "draft", xpReward: 10, blocks: [] });
    lessonDocument = lessonStore.upsertLesson(lessonDocument, lesson);
    activeLessonId = lesson.id;
    renderLessonDatabase();
    activateSection("lessons");
    lessonForm?.elements?.namedItem("title")?.focus();
    showStatus("New local lesson created.");
  }

  function duplicateLesson() {
    const source = activeLesson();
    if (!source) return;
    const copy = lessonStore.normalizeLesson({ ...source, id: "", title: `${source.title} (Copy)`, slug: `${source.slug}-copy`, status: "draft", blocks: source.blocks.map((block) => ({ ...block, id: "" })), createdAt: "", updatedAt: "" });
    lessonDocument = lessonStore.upsertLesson(lessonDocument, copy);
    activeLessonId = copy.id;
    renderLessonDatabase();
    showStatus("Lesson duplicated as a local draft.");
  }

  function deleteLesson() {
    const lesson = activeLesson();
    if (!lesson || !window.confirm(`Delete “${lesson.title}” from this browser?`)) return;
    lessonDocument = lessonStore.removeLesson(lessonDocument, lesson.id);
    activeLessonId = lessonDocument.lessons[0]?.id || "";
    renderLessonDatabase();
    showStatus("Local lesson deleted.");
  }

  function addLessonBlock() {
    const lesson = activeLesson();
    if (!lesson) return;
    lesson.blocks.push(lessonStore.createBlock(lessonBlockType?.value || "explanation"));
    saveActiveLesson("Block added.", true);
  }

  function updateLessonBlockField(target) {
    const card = target.closest("[data-block-id]");
    const lesson = activeLesson();
    const block = lesson?.blocks.find((entry) => entry.id === card?.dataset.blockId);
    if (!block) return;
    block[target.dataset.blockField] = target.dataset.blockField === "options"
      ? target.value.split("\n").map((option) => option.trim()).filter(Boolean)
      : target.value;
    scheduleLessonSave();
  }

  function runBlockAction(action, id) {
    const lesson = activeLesson();
    const index = lesson?.blocks.findIndex((block) => block.id === id) ?? -1;
    if (!lesson || index < 0) return;
    if (action === "delete") lesson.blocks.splice(index, 1);
    if (action === "up" && index > 0) [lesson.blocks[index - 1], lesson.blocks[index]] = [lesson.blocks[index], lesson.blocks[index - 1]];
    if (action === "down" && index < lesson.blocks.length - 1) [lesson.blocks[index + 1], lesson.blocks[index]] = [lesson.blocks[index], lesson.blocks[index + 1]];
    saveActiveLesson(action === "delete" ? "Block deleted." : "Block order updated.", true);
  }

  function setLessonMode(mode) {
    const previewing = mode === "preview";
    lessonBuilderPanel.hidden = previewing;
    lessonPreviewPanel.hidden = !previewing;
    document.querySelectorAll("[data-lesson-mode]").forEach((button) => {
      const active = button.dataset.lessonMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (previewing) renderLessonPreview();
  }

  function exportLessons() {
    if (activeLesson()) saveActiveLesson();
    const blob = new Blob([JSON.stringify(lessonDocument, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "expresate-studio-lessons.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showStatus("Lesson export prepared.");
  }

  async function importLessons(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed) && !Array.isArray(parsed?.lessons)) throw new Error("The file does not contain a compatible lesson list.");
      lessonDocument = lessonStore.saveDocument(parsed);
      activeLessonId = lessonDocument.lessons[0]?.id || "";
      renderLessonDatabase();
      activateSection("lessons");
      showStatus(`Lesson import complete: ${file.name}`);
    } catch (error) {
      showStatus(error?.message || "The lesson JSON could not be imported.", true);
    } finally {
      lessonImportFile.value = "";
    }
  }

  function resetLessons() {
    if (!window.confirm("Delete every local Studio lesson?")) return;
    lessonDocument = lessonStore.resetDatabase();
    activeLessonId = "";
    renderLessonDatabase();
    showStatus("The local Lesson Builder database was reset.");
  }

  function vocabularyPickerItems() {
    const query = String(vocabularyPickerSearch?.value || "").trim().toLowerCase();
    return vocabularyDocument.items.filter((item) => !query || [item.english, item.spanish, item.category, ...item.tags].join(" ").toLowerCase().includes(query));
  }

  function renderVocabularyPicker() {
    const items = vocabularyPickerItems();
    vocabularyPickerGrid.replaceChildren(...items.map((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "vocabulary-picker-item";
      button.classList.toggle("is-selected", vocabularyPickerSelection.has(item.id));
      button.dataset.pickVocabularyId = item.id;
      button.setAttribute("aria-pressed", vocabularyPickerSelection.has(item.id) ? "true" : "false");
      button.append(textElement("strong", "", item.english), textElement("span", "", item.spanish), textElement("small", "", `${item.difficulty} · ${item.category}`));
      return button;
    }));
    vocabularyPickerGrid.hidden = items.length === 0;
    vocabularyPickerEmpty.hidden = items.length !== 0;
    vocabularyPickerCount.textContent = `${vocabularyPickerSelection.size} selected`;
  }

  function openVocabularyPicker(trigger) {
    const lesson = activeLesson();
    const block = lesson?.blocks.find((entry) => entry.id === trigger.dataset.blockId && entry.type === "vocabulary");
    if (!block) return;
    vocabularyPickerBlockId = block.id;
    vocabularyPickerSelection = new Set(block.selectedVocabularyIds || []);
    vocabularyPickerReturnFocus = trigger;
    vocabularyPickerSearch.value = "";
    renderVocabularyPicker();
    vocabularyPicker.hidden = false;
    document.body.classList.add("studio-modal-open");
    vocabularyPickerSearch.focus();
  }

  function closeVocabularyPicker() {
    if (!vocabularyPicker || vocabularyPicker.hidden) return;
    vocabularyPicker.hidden = true;
    document.body.classList.remove("studio-modal-open");
    vocabularyPickerReturnFocus?.focus?.();
  }

  function applyVocabularyPicker() {
    const lesson = activeLesson();
    const block = lesson?.blocks.find((entry) => entry.id === vocabularyPickerBlockId && entry.type === "vocabulary");
    if (!block) return;
    block.selectedVocabularyIds = Array.from(vocabularyPickerSelection);
    closeVocabularyPicker();
    saveActiveLesson("Vocabulary selection saved.", true);
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
    if (section === "lessons") renderLessonDatabase();
    if (section === "media") renderMediaLibrary();
    if (section === "vocabulary") renderVocabularyDatabase();
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
    mediaDocument = mediaStore.loadDocument();
    vocabularyDocument = vocabularyStore.loadDocument();
    lessonDocument = lessonStore.loadDocument();
    activeLessonId = lessonDocument.lessons[0]?.id || "";
    renderLetterList();
    renderEditor(activeKey);
    clearMediaForm();
    renderMediaLibrary();
    clearVocabularyForm();
    renderVocabularyDatabase();
    renderLessonDatabase();
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
    if (!store || !mediaStore || !vocabularyStore || !lessonStore) {
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
    if (event.target.closest("[data-lesson-new]")) {
      createLesson();
      return;
    }
    const lessonItem = event.target.closest("[data-lesson-id]");
    if (lessonItem) {
      window.clearTimeout(lessonSaveTimer);
      if (activeLesson()) saveActiveLesson();
      activeLessonId = lessonItem.dataset.lessonId;
      renderLessonDatabase();
      return;
    }
    if (event.target.closest("[data-lesson-duplicate]")) {
      duplicateLesson();
      return;
    }
    if (event.target.closest("[data-lesson-delete]")) {
      deleteLesson();
      return;
    }
    if (event.target.closest("[data-lesson-add-block]")) {
      addLessonBlock();
      return;
    }
    const blockAction = event.target.closest("[data-block-action]");
    if (blockAction) {
      runBlockAction(blockAction.dataset.blockAction, blockAction.dataset.blockId);
      return;
    }
    const lessonMode = event.target.closest("[data-lesson-mode]");
    if (lessonMode) {
      setLessonMode(lessonMode.dataset.lessonMode);
      return;
    }
    const vocabularyPickerOpen = event.target.closest("[data-open-vocabulary-picker]");
    if (vocabularyPickerOpen) {
      openVocabularyPicker(vocabularyPickerOpen);
      return;
    }
    if (event.target.closest("[data-close-vocabulary-picker]")) {
      closeVocabularyPicker();
      return;
    }
    const vocabularyPickerItem = event.target.closest("[data-pick-vocabulary-id]");
    if (vocabularyPickerItem) {
      const id = vocabularyPickerItem.dataset.pickVocabularyId;
      if (vocabularyPickerSelection.has(id)) vocabularyPickerSelection.delete(id);
      else vocabularyPickerSelection.add(id);
      renderVocabularyPicker();
      return;
    }
    if (event.target.closest("[data-apply-vocabulary-picker]")) {
      applyVocabularyPicker();
      return;
    }
    if (event.target.closest("[data-lesson-import]")) {
      lessonImportFile.click();
      return;
    }
    if (event.target.closest("[data-lesson-export]")) {
      exportLessons();
      return;
    }
    if (event.target.closest("[data-lesson-reset]")) {
      resetLessons();
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
      return;
    }
    if (event.target.closest("[data-open-media-picker]")) {
      openMediaPicker(event.target.closest("[data-open-media-picker]"));
      return;
    }
    if (event.target.closest("[data-close-media-picker]")) {
      closeMediaPicker();
      return;
    }
    const pickerItem = event.target.closest("[data-pick-media-id]");
    if (pickerItem) {
      chooseMediaItem(pickerItem.dataset.pickMediaId);
      return;
    }
    const mediaAction = event.target.closest("[data-media-action]");
    if (mediaAction) {
      const id = mediaAction.dataset.mediaId;
      if (mediaAction.dataset.mediaAction === "edit") editMediaItem(id);
      if (mediaAction.dataset.mediaAction === "copy") copyMediaPath(id);
      if (mediaAction.dataset.mediaAction === "delete") deleteMediaItem(id);
      return;
    }
    const vocabularyAction = event.target.closest("[data-vocab-action]");
    if (vocabularyAction) {
      const id = vocabularyAction.dataset.vocabId;
      if (vocabularyAction.dataset.vocabAction === "edit") editVocabularyItem(id);
      if (vocabularyAction.dataset.vocabAction === "delete") deleteVocabularyItem(id);
      return;
    }
    if (event.target.closest("[data-media-import]")) {
      mediaImportFile.click();
      return;
    }
    if (event.target.closest("[data-media-export]")) {
      exportMediaLibrary();
      return;
    }
    if (event.target.closest("[data-media-reset]")) {
      resetMediaLibrary();
      return;
    }
    if (event.target.closest("[data-media-cancel], [data-media-clear]")) {
      clearMediaForm();
      return;
    }
    if (event.target.closest("[data-vocab-import]")) {
      vocabularyImportFile.click();
      return;
    }
    if (event.target.closest("[data-vocab-export]")) {
      exportVocabulary();
      return;
    }
    if (event.target.closest("[data-vocab-reset]")) {
      resetVocabulary();
      return;
    }
    if (event.target.closest("[data-vocab-cancel], [data-vocab-clear]")) {
      clearVocabularyForm();
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
  mediaForm?.addEventListener("submit", saveMediaItem);
  mediaForm?.addEventListener("input", (event) => {
    if (["assetPath", "thumbnailPath", "type", "title"].includes(event.target.name)) renderMediaFormPreview();
  });
  mediaSearch?.addEventListener("input", renderMediaLibrary);
  mediaTypeFilter?.addEventListener("change", renderMediaLibrary);
  mediaCategoryFilter?.addEventListener("change", renderMediaLibrary);
  mediaImportFile?.addEventListener("change", () => importMediaLibrary(mediaImportFile.files?.[0]));
  mediaPickerSearch?.addEventListener("input", renderMediaPicker);
  vocabularyForm?.addEventListener("submit", saveVocabularyItem);
  vocabularyForm?.addEventListener("input", (event) => {
    if (["imagePath", "audioPath"].includes(event.target.name)) renderVocabularyPreviews();
  });
  vocabularySearch?.addEventListener("input", renderVocabularyDatabase);
  vocabularyDifficultyFilter?.addEventListener("change", renderVocabularyDatabase);
  vocabularyPosFilter?.addEventListener("change", renderVocabularyDatabase);
  vocabularyCategoryFilter?.addEventListener("change", renderVocabularyDatabase);
  vocabularyImportFile?.addEventListener("change", () => importVocabulary(vocabularyImportFile.files?.[0]));
  lessonForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    window.clearTimeout(lessonSaveTimer);
    saveActiveLesson("Lesson saved locally.", true);
  });
  lessonForm?.addEventListener("input", scheduleLessonSave);
  lessonBlockList?.addEventListener("input", (event) => {
    if (event.target.matches("[data-block-field]")) updateLessonBlockField(event.target);
  });
  lessonBlockList?.addEventListener("change", (event) => {
    if (event.target.matches("[data-block-field]")) updateLessonBlockField(event.target);
  });
  lessonSearch?.addEventListener("input", renderLessonDatabase);
  lessonModuleFilter?.addEventListener("change", renderLessonDatabase);
  lessonLevelFilter?.addEventListener("change", renderLessonDatabase);
  lessonStatusFilter?.addEventListener("change", renderLessonDatabase);
  lessonPremiumFilter?.addEventListener("change", renderLessonDatabase);
  lessonImportFile?.addEventListener("change", () => importLessons(lessonImportFile.files?.[0]));
  vocabularyPickerSearch?.addEventListener("input", renderVocabularyPicker);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMediaPicker();
      closeVocabularyPicker();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
