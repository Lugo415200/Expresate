/* Exprésate Studio - Phase 2. Local drafts only; no content is written to Supabase. */
(function () {
  "use strict";

  const ADMIN_EMAILS = ["ynoellugo@icloud.com"];
  const store = window.ExpresateLesson000Letters;
  const mediaStore = window.ExpresateStudioMedia;
  const vocabularyStore = window.ExpresateStudioVocabulary;
  const sb = window.supabaseClient;
  const SECTION_COPY = {
    dashboard: ["Content overview", "Dashboard", "Manage local content drafts and preview how they appear in Exprésate."],
    alphabet: ["Lesson 000", "Alphabet", "Edit letter content, examples, sound labels, and local media paths."],
    lessons: ["Future builder", "Lessons", "Plan reusable learning blocks for future guided lessons."],
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
        : mediaPickerTarget === "vocabulary-image"
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
    const isAudio = mediaPickerTarget === "vocabulary-audio";
    const isVocabulary = mediaPickerTarget.startsWith("vocabulary-");
    mediaPickerEyebrow.textContent = isVocabulary ? "Vocabulary asset" : "Alphabet image";
    mediaPickerTitle.textContent = isAudio ? "Choose vocabulary audio" : "Choose an image";
    mediaPickerDescription.textContent = isAudio
      ? "Select an Audio item to fill the vocabulary audio path."
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
    renderLetterList();
    renderEditor(activeKey);
    clearMediaForm();
    renderMediaLibrary();
    clearVocabularyForm();
    renderVocabularyDatabase();
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
    if (!store || !mediaStore || !vocabularyStore) {
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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMediaPicker();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
