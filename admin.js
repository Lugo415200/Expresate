/* Exprésate Studio - local authoring with explicit Supabase publishing. */
(function () {
  "use strict";

  const ADMIN_EMAILS = ["ynoellugo@icloud.com"];
  const store = window.ExpresateLesson000Letters;
  const mediaStore = window.ExpresateStudioMedia;
  const vocabularyStore = window.ExpresateStudioVocabulary;
  const lessonStore = window.ExpresateStudioLessons;
  const lessonRenderer = window.ExpresateStudioLessonRenderer;
  const lessonPublisher = window.ExpresateStudioPublishing;
  const experienceLibrary = window.ExpresateStudioExperiences;
  const themeLibrary = window.ExpresateStudioThemes;
  const activityLibrary = window.ExpresateStudioActivities;
  const animationLibrary = window.ExpresateStudioAnimations;
  const storyCharacterLibrary = window.ExpresateStudioCharacters;
  const storySceneLibrary = window.ExpresateStudioStoryScenes;
  const sb = window.supabaseClient;
  const SECTION_COPY = {
    dashboard: ["Content overview", "Dashboard", "Manage local content drafts and preview how they appear in Exprésate."],
    alphabet: ["Lesson 000", "Alphabet", "Edit letter content, examples, sound labels, and local media paths."],
    lessons: ["Local lesson prototypes", "Lessons", "Build reusable guided lessons and preview them inside Studio."],
    vocabulary: ["Reusable content", "Vocabulary", "Create structured words and phrases for lessons, quizzes, and practice."],
    quizzes: ["Future builder", "Quizzes", "Plan quick checks, answer feedback, and audio prompts."],
    media: ["Asset catalog", "Media Library", "Organize local images, audio, animations, textures, and characters."],
    creative: ["Creative system", "Creative Libraries", "Browse reusable experiences, activities, themes, and animations before they become editable Studio tools."],
    settings: ["Prototype configuration", "Settings", "Review the local-only data boundary for this Studio phase."]
  };
  const BLOCK_LIBRARY = Object.freeze([
    { type: "explanation", icon: "Aa", title: "Explanation", description: "Introduce a concept with a clear title, body copy, and optional consejo.", helper: "Use for teaching moments, rules, or context before practice." },
    { type: "vocabulary", icon: "Ab", title: "Vocabulary", description: "Pull reusable words from the Vocabulary Database and show them as cards, a list, or flashcards.", helper: "Best for reusable content that should stay linked to the vocabulary database." },
    { type: "image", icon: "Img", title: "Image", description: "Show a visual teaching aid with an optional title and caption.", helper: "Use Media Library assets or type a project-relative path manually." },
    { type: "quiz", icon: "?", title: "Quiz", description: "Check understanding with one question, several options, and answer feedback.", helper: "Answers stay in memory during preview and live playback." },
    { type: "speech", icon: "Mic", title: "Speech Practice", description: "Prompt the learner to say a phrase and compare it with expected text.", helper: "Reuse the existing speech practice engine without duplicating audio logic." },
    { type: "experience", icon: "Exp", title: "Experience", description: "Drop in a reusable learning experience such as the Alphabet Explorer.", helper: "Use this for richer interactions that go beyond generic blocks." },
    { type: "completion", icon: "XP", title: "Completion", description: "Close the lesson with a reward message, XP, and an optional next lesson slug.", helper: "Keep one completion block at the end of the flow." }
  ]);
  const LESSON_TEMPLATES = Object.freeze({
    blank: {
      title: "Blank lesson",
      description: "Start from an empty lesson shell.",
      create(number) {
        return {
          title: `New lesson ${number}`,
          slug: `new-lesson-${number}`,
          module: "Module 1",
          level: "A1",
          status: "draft",
          xpReward: 10,
          premium: false,
          description: "",
          tags: [],
          blocks: []
        };
      }
    },
    vocabulary: {
      title: "Vocabulary lesson",
      description: "Explanation, vocabulary practice, quick quiz, and completion.",
      create(number) {
        return {
          title: `Vocabulary lesson ${number}`,
          slug: `vocabulary-lesson-${number}`,
          module: "Module 1",
          level: "A1",
          status: "draft",
          xpReward: 15,
          premium: false,
          description: "Teach a tight set of reusable words and reinforce them with a quick check.",
          tags: ["vocabulary"],
          blocks: [
            { type: "explanation", title: "What you will learn", body: "Introduce the key words, what they mean, and when to use them." },
            { type: "vocabulary", displayMode: "cards", selectedVocabularyIds: [] },
            { type: "quiz", question: "Add your first quiz question", options: ["Option 1", "Option 2"], correctAnswer: "Option 1" },
            { type: "completion", message: "Lesson complete" }
          ]
        };
      }
    },
    pronunciation: {
      title: "Pronunciation lesson",
      description: "Explain the sound, practice hearing it, then ask the learner to say it.",
      create(number) {
        return {
          title: `Pronunciation lesson ${number}`,
          slug: `pronunciation-lesson-${number}`,
          module: "Module 1",
          level: "A1",
          status: "draft",
          xpReward: 20,
          premium: false,
          description: "Teach a sound step by step with examples and speaking practice.",
          tags: ["pronunciation", "speech"],
          blocks: [
            { type: "explanation", title: "Listen first", body: "Explain how the sound works and what the learner should notice." },
            { type: "speech", phrase: "Repeat the target sound", translation: "Escucha y repite el sonido.", expectedText: "target sound", hint: "Keep the prompt short and specific." },
            { type: "speech", phrase: "Use it in a short phrase", translation: "Ahora dilo dentro de una frase.", expectedText: "short phrase" },
            { type: "completion", message: "Sound practice complete" }
          ]
        };
      }
    },
    quiz: {
      title: "Quiz lesson",
      description: "Teach, test, explain, and close the lesson cleanly.",
      create(number) {
        return {
          title: `Quiz lesson ${number}`,
          slug: `quiz-lesson-${number}`,
          module: "Module 1",
          level: "A1",
          status: "draft",
          xpReward: 15,
          premium: false,
          description: "Use a short teaching block and several quick checks.",
          tags: ["quiz"],
          blocks: [
            { type: "explanation", title: "Quick review", body: "Summarize what the learner should remember before the quiz starts." },
            { type: "quiz", question: "Question 1", options: ["Option 1", "Option 2"], correctAnswer: "Option 1" },
            { type: "quiz", question: "Question 2", options: ["Option 1", "Option 2"], correctAnswer: "Option 1" },
            { type: "completion", message: "Quiz complete" }
          ]
        };
      }
    },
    conversation: {
      title: "Conversation lesson",
      description: "Placeholder flow for future dialogue-based lessons.",
      create(number) {
        return {
          title: `Conversation lesson ${number}`,
          slug: `conversation-lesson-${number}`,
          module: "Module 1",
          level: "A1",
          status: "draft",
          xpReward: 20,
          premium: false,
          description: "Practice turn-based dialogue with context, vocabulary, and speaking prompts.",
          tags: ["conversation", "speech"],
          blocks: [
            { type: "explanation", title: "Set the scene", body: "Explain who is speaking and what the learner should be able to say." },
            { type: "vocabulary", displayMode: "cards", selectedVocabularyIds: [] },
            { type: "speech", phrase: "Hello, my name is Ana.", translation: "Hola, me llamo Ana.", expectedText: "Hello, my name is Ana." },
            { type: "completion", message: "Conversation practice complete" }
          ]
        };
      }
    }
  });

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
  const lessonCloudStatus = document.querySelector("[data-lesson-cloud-status]");
  const lessonBlockLibrary = document.querySelector("[data-lesson-block-library]");
  const lessonBlockSummary = document.querySelector("[data-lesson-block-summary]");
  const lessonBlockList = document.querySelector("[data-lesson-block-list]");
  const lessonBlockEmpty = document.querySelector("[data-lesson-block-empty]");
  const lessonBuilderPanel = document.querySelector("[data-lesson-builder-panel]");
  const lessonPreviewPanel = document.querySelector("[data-lesson-preview-panel]");
  const lessonPreview = document.querySelector("[data-lesson-preview]");
  const lessonPreviewStage = document.querySelector("[data-lesson-preview-stage]");
  const lessonPreviewStepNav = document.querySelector("[data-preview-step-nav]");
  const lessonPreviewStepCurrent = document.querySelector("[data-preview-step-current]");
  const lessonPreviewStepTotal = document.querySelector("[data-preview-step-total]");
  const lessonPreviewProgressBar = document.querySelector("[data-preview-progress-bar]");
  const lessonInlinePreview = document.querySelector("[data-lesson-inline-preview]");
  const lessonInlinePreviewStage = document.querySelector("[data-lesson-inline-preview-stage]");
  const lessonInlinePreviewStepNav = document.querySelector("[data-inline-preview-step-nav]");
  const lessonInlinePreviewStepCurrent = document.querySelector("[data-inline-preview-step-current]");
  const lessonInlinePreviewStepTotal = document.querySelector("[data-inline-preview-step-total]");
  const lessonInlinePreviewProgressBar = document.querySelector("[data-inline-preview-progress-bar]");
  const lessonPreviewStatus = document.querySelector("[data-lesson-preview-status]");
  const lessonImportFile = document.querySelector("[data-lesson-import-file]");
  const lessonDraftCount = document.querySelector("[data-lesson-draft-count]");
  const lessonPublishedCount = document.querySelector("[data-lesson-published-count]");
  const lessonRecentList = document.querySelector("[data-lesson-recent-list]");
  const lessonRecentEmpty = document.querySelector("[data-lesson-recent-empty]");
  const vocabularyPicker = document.querySelector("[data-vocabulary-picker]");
  const vocabularyPickerSearch = document.querySelector("[data-vocabulary-picker-search]");
  const vocabularyPickerGrid = document.querySelector("[data-vocabulary-picker-grid]");
  const vocabularyPickerEmpty = document.querySelector("[data-vocabulary-picker-empty]");
  const vocabularyPickerCount = document.querySelector("[data-vocabulary-picker-count]");
  const creativeGrid = document.querySelector("[data-creative-grid]");
  const creativeEmpty = document.querySelector("[data-creative-empty]");
  const creativeSearch = document.querySelector("[data-creative-search]");
  const creativeStatus = document.querySelector("[data-creative-status]");
  const creativePreviewTitle = document.querySelector("[data-creative-preview-title]");
  const creativePreviewStatus = document.querySelector("[data-creative-preview-status]");
  const creativePreviewSummary = document.querySelector("[data-creative-preview-summary]");
  const creativePreviewSwatches = document.querySelector("[data-creative-preview-swatches]");
  const creativePreviewMeta = document.querySelector("[data-creative-preview-meta]");
  const creativePreviewBestFor = document.querySelector("[data-creative-preview-bestfor]");
  const creativePreviewCompatible = document.querySelector("[data-creative-preview-compatible]");
  const creativePreviewNotes = document.querySelector("[data-creative-preview-notes]");

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
  let lessonPreviewMode = "full";
  let lessonPreviewStep = 0;
  let lessonPreviewDevice = "desktop";
  let previewLessonId = "";
  let cloudLessons = [];
  let cloudLessonsLoaded = false;
  let lessonDirty = false;
  let collapsedLessonBlocks = new Set();
  let activeCreativeCategory = "experiences";
  let activeCreativeSelection = "";

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

  function failAdminLoad(error, message) {
    console.error("[StudioAdmin]", error);
    showDenied(message || "Studio could not finish loading.");
    showStatus(message || "Studio could not finish loading.", true);
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
    body.className = "media-picker-copy";
    const meta = document.createElement("div");
    meta.className = "media-picker-meta";
    meta.append(
      textElement("span", "lesson-vocabulary-pill", item.type),
      textElement("span", "lesson-vocabulary-pill is-muted", item.category || "Uncategorized")
    );
    const title = document.createElement("strong");
    title.textContent = item.title;
    const path = document.createElement("small");
    path.textContent = item.assetPath;
    body.append(meta, title, path);
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

  function cloudLessonFor(lesson) {
    return lesson ? cloudLessons.find((entry) => entry.slug === lesson.slug) || null : null;
  }

  function renderCloudStatus(lesson) {
    if (!lessonCloudStatus) return;
    const cloudLesson = cloudLessonFor(lesson);
    const state = lessonPublisher?.statusFor?.(lesson, cloudLesson) || "local-only";
    const labels = {
      "local-only": cloudLessonsLoaded ? "Local only" : "Checking cloud…",
      published: "Published",
      "cloud-draft": "Draft in cloud",
      "local-newer": "Updated locally after publish"
    };
    lessonCloudStatus.textContent = labels[state] || "Local only";
    lessonCloudStatus.className = `lesson-cloud-status ${state === "published" ? "is-published" : state === "cloud-draft" ? "is-draft" : state === "local-newer" ? "is-newer" : "is-local"}`;
    const publishButton = document.querySelector("[data-lesson-publish]");
    const unpublishButton = document.querySelector("[data-lesson-unpublish]");
    if (publishButton) publishButton.disabled = !lessonPublisher?.available;
    if (unpublishButton) unpublishButton.disabled = !lessonPublisher?.available || !cloudLesson || cloudLesson.status !== "published";
  }

  async function refreshCloudLessons(options = {}) {
    if (!lessonPublisher?.available) {
      cloudLessonsLoaded = true;
      renderCloudStatus(activeLesson());
      return [];
    }
    try {
      cloudLessons = await lessonPublisher.listAdminLessons();
      cloudLessonsLoaded = true;
      renderLessonDatabase();
      if (!options.silent) showStatus(`Cloud catalog synced: ${cloudLessons.length} lesson${cloudLessons.length === 1 ? "" : "s"}.`);
      return cloudLessons;
    } catch (error) {
      cloudLessonsLoaded = true;
      renderCloudStatus(activeLesson());
      if (!options.silent) showStatus(error?.message || "Cloud lessons could not be loaded.", true);
      return [];
    }
  }

  function validateLessonForPublishing(lesson) {
    if (!lesson?.title?.trim()) return "A lesson title is required.";
    if (!lesson?.slug?.trim()) return "A lesson slug is required.";
    if (!lesson.blocks?.length) return "Add at least one lesson block before publishing.";
    const duplicate = lessonDocument.lessons.find((entry) => entry.id !== lesson.id && entry.slug === lesson.slug);
    if (duplicate) return `The slug “${lesson.slug}” is already used by another local lesson.`;
    return "";
  }

  async function publishActiveLesson() {
    window.clearTimeout(lessonSaveTimer);
    saveActiveLesson();
    let lesson = activeLesson();
    const validationError = validateLessonForPublishing(lesson);
    if (validationError) {
      showStatus(validationError, true);
      return;
    }
    if (!lessonPublisher?.available) {
      showStatus("Supabase publishing is unavailable. Run supabase/studio_publishing.sql first.", true);
      return;
    }
    try {
      showStatus("Publishing lesson…");
      lessonDocument = lessonStore.upsertLesson(lessonDocument, { ...lesson, status: "published" });
      lesson = activeLesson();
      const cloudRow = await lessonPublisher.publishLesson(lesson, vocabularyDocument.items, "published");
      lessonPublisher.saveSyncRecord(lesson.id, {
        cloudId: cloudRow.id,
        slug: lesson.slug,
        status: "published",
        cloudUpdatedAt: cloudRow.updated_at,
        localUpdatedAt: lesson.updatedAt
      });
      await refreshCloudLessons({ silent: true });
      renderLessonDatabase();
      showStatus(`Published “${lesson.title}” to Supabase.`);
    } catch (error) {
      showStatus(error?.message || "The lesson could not be published.", true);
    }
  }

  async function unpublishActiveLesson() {
    window.clearTimeout(lessonSaveTimer);
    saveActiveLesson();
    let lesson = activeLesson();
    if (!lesson || !cloudLessonFor(lesson)) {
      showStatus("This lesson has not been published to Supabase.", true);
      return;
    }
    try {
      showStatus("Unpublishing lesson…");
      const cloudRow = await lessonPublisher.unpublishLesson(lesson.slug);
      lessonDocument = lessonStore.upsertLesson(lessonDocument, { ...lesson, status: "draft" });
      lesson = activeLesson();
      lessonPublisher.saveSyncRecord(lesson.id, {
        cloudId: cloudRow.id,
        slug: lesson.slug,
        status: "draft",
        cloudUpdatedAt: cloudRow.updated_at,
        localUpdatedAt: lesson.updatedAt
      });
      await refreshCloudLessons({ silent: true });
      renderLessonDatabase();
      showStatus(`“${lesson.title}” is now a cloud draft and is hidden from learners.`);
    } catch (error) {
      showStatus(error?.message || "The lesson could not be unpublished.", true);
    }
  }

  async function syncLessonsFromSupabase() {
    if (!lessonPublisher?.available) {
      showStatus("Supabase publishing is unavailable. Run supabase/studio_publishing.sql first.", true);
      return;
    }
    if (!window.confirm("Sync cloud lessons into this browser? Matching local lessons will be replaced by their cloud versions.")) return;
    try {
      showStatus("Syncing cloud lessons…");
      const cloud = await lessonPublisher.listAdminLessons();
      cloud.forEach((cloudLesson) => {
        const existing = lessonDocument.lessons.find((entry) => entry.slug === cloudLesson.slug);
        lessonDocument = lessonStore.upsertLesson(lessonDocument, {
          ...cloudLesson,
          id: existing?.id || cloudLesson.id,
          createdAt: existing?.createdAt || cloudLesson.createdAt
        });
        const local = lessonDocument.lessons.find((entry) => entry.slug === cloudLesson.slug);
        lessonPublisher.saveSyncRecord(local.id, {
          cloudId: cloudLesson.id,
          slug: cloudLesson.slug,
          status: cloudLesson.status,
          cloudUpdatedAt: cloudLesson.updatedAt,
          localUpdatedAt: local.updatedAt
        });
      });
      cloudLessons = cloud;
      cloudLessonsLoaded = true;
      if (!activeLessonId && lessonDocument.lessons[0]) activeLessonId = lessonDocument.lessons[0].id;
      renderLessonDatabase();
      showStatus(`Synced ${cloud.length} cloud lesson${cloud.length === 1 ? "" : "s"} into local Studio.`);
    } catch (error) {
      showStatus(error?.message || "Cloud lessons could not be synced.", true);
    }
  }

  function textElement(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    return element;
  }

  function blockDefinition(type) {
    return BLOCK_LIBRARY.find((item) => item.type === type) || BLOCK_LIBRARY[0];
  }

  function updateLessonSaveLabel(message, isError) {
    if (lessonSaveState) {
      lessonSaveState.textContent = message;
      lessonSaveState.classList.toggle("is-error", Boolean(isError));
      lessonSaveState.classList.toggle("is-success", !isError && /saved/i.test(message));
      lessonSaveState.classList.toggle("is-pending", !isError && /unsaved|saving/i.test(message));
    }
    if (lessonPreviewStatus) {
      lessonPreviewStatus.textContent = lessonDirty ? "Unsaved changes" : "In sync with local draft";
      lessonPreviewStatus.classList.toggle("is-dirty", lessonDirty);
    }
  }

  function markLessonDirty(message) {
    lessonDirty = true;
    updateLessonSaveLabel(message || "Unsaved changes", false);
  }

  function validateLessonDraft(lesson, options) {
    const titleValue = String(lesson?.title || "").trim();
    const slugValue = String(lesson?.slug || "").trim();
    if (titleValue && slugValue) return true;
    updateLessonSaveLabel("Title and slug are required", true);
    if (!options?.silent) showStatus("Add both a lesson title and slug before saving or publishing.", true);
    return false;
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
    if (options?.help) label.appendChild(textElement("small", "lesson-block-help", options.help));
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
      const chip = document.createElement("article");
      chip.className = "lesson-selected-vocabulary-card";
      if (item.imagePath && mediaStore.isImagePath(item.imagePath)) {
        const image = document.createElement("img");
        image.src = item.imagePath;
        image.alt = item.english;
        image.addEventListener("error", () => image.remove(), { once: true });
        chip.appendChild(image);
      }
      const copy = document.createElement("div");
      copy.className = "lesson-selected-vocabulary-copy";
      copy.append(
        textElement("strong", "", item.english),
        textElement("span", "", item.spanish)
      );
      if (item.pronunciation) copy.appendChild(textElement("small", "", item.pronunciation));
      const meta = document.createElement("div");
      meta.className = "lesson-selected-vocabulary-meta";
      meta.append(
        textElement("span", "lesson-vocabulary-pill", item.difficulty || "A1"),
        textElement("span", "lesson-vocabulary-pill is-muted", item.category || item.partOfSpeech || "Vocabulary")
      );
      if (item.audioPath) meta.appendChild(textElement("span", "lesson-vocabulary-pill is-audio", "Audio"));
      copy.appendChild(meta);
      chip.appendChild(copy);
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
        lessonField("Body", "body", block.body, { textarea: true, rows: 5, wide: true, help: "Keep the explanation short and learner-facing." }),
        lessonField("Consejo (optional)", "consejo", block.consejo, { textarea: true, wide: true, help: "Use this for a side tip or extra support." })
      );
    } else if (block.type === "vocabulary") {
      fields.appendChild(lessonField("Display mode", "displayMode", block.displayMode, { select: [["cards", "Cards"], ["list", "List"], ["flashcards", "Flashcards"]], help: "Cards work best for most beginner lessons." }));
      const pickerButton = document.createElement("button");
      pickerButton.type = "button";
      pickerButton.className = "btn lesson-vocabulary-picker-button";
      pickerButton.dataset.openVocabularyPicker = "";
      pickerButton.dataset.blockId = block.id;
      pickerButton.textContent = "Choose vocabulary";
      const helper = textElement("p", "lesson-field-inline-help", "Select from the Vocabulary Database. The lesson stores only the item IDs.");
      fields.append(pickerButton, helper, renderSelectedVocabulary(block));
    } else if (block.type === "image") {
      fields.append(
        lessonField("Title (optional)", "title", block.title),
        lessonField("Image path", "imagePath", block.imagePath, { placeholder: "assets/...", help: "Project-relative path. Use the media picker when possible." }),
        lessonField("Caption (optional)", "caption", block.caption, { textarea: true, wide: true, help: "Use the caption to explain what the learner should notice." })
      );
      const pickerButton = document.createElement("button");
      pickerButton.type = "button";
      pickerButton.className = "btn lesson-media-picker-button";
      pickerButton.dataset.openMediaPicker = "";
      pickerButton.dataset.mediaPickerTarget = "lesson-image";
      pickerButton.dataset.blockId = block.id;
      pickerButton.textContent = "Choose from Media Library";
      fields.append(pickerButton, textElement("p", "lesson-field-inline-help", "Visual picker uses thumbnails and fills the image path automatically."));
    } else if (block.type === "quiz") {
      fields.append(
        lessonField("Question", "question", block.question, { textarea: true, wide: true, help: "Write exactly what the learner should answer." }),
        lessonField("Options (one per line)", "options", (block.options || []).join("\n"), { textarea: true, rows: 5, help: "One answer option per line." }),
        lessonField("Correct answer", "correctAnswer", block.correctAnswer),
        lessonField("Explanation (optional)", "explanation", block.explanation, { textarea: true, wide: true, help: "Shown after the learner answers." })
      );
    } else if (block.type === "speech") {
      fields.append(
        lessonField("Phrase", "phrase", block.phrase, { textarea: true, help: "Displayed as the spoken prompt." }),
        lessonField("Translation", "translation", block.translation, { textarea: true, help: "Keep the learner guidance in plain Spanish." }),
        lessonField("Expected text", "expectedText", block.expectedText, { help: "Used by the speech engine for matching." }),
        lessonField("Hint (optional)", "hint", block.hint, { help: "Short learner hint for pronunciation or context." })
      );
    } else if (block.type === "experience") {
      fields.append(
        lessonField("Experience type", "experienceType", block.experienceType, {
          select: [["alphabet-explorer", "Alphabet Explorer"]],
          help: "Phase 9 starts with one reusable experience."
        }),
        lessonField("Title", "title", block.title, { wide: true }),
        lessonField("Subtitle", "subtitle", block.subtitle, {
          textarea: true,
          wide: true,
          help: "This becomes the learner-facing intro above the experience."
        }),
        lessonField("Theme", "theme", block.theme, {
          select: [["workbook-green", "Workbook green"], ["default", "Default"]],
          help: "Workbook green matches the Lesson 000 alphabet experience."
        }),
        lessonField("Dataset", "dataset", block.dataset, {
          select: [["lesson000-alphabet", "Lesson 000 alphabet data"]],
          help: "Future phases can add more reusable datasets."
        }),
        lessonField("Show vowels", "showVowels", block.showVowels ? "true" : "false", {
          select: [["true", "Yes"], ["false", "No"]],
          help: "Highlights A, E, I, O, and U in the grid."
        }),
        lessonField("Enable letter modal", "enableLetterModal", block.enableLetterModal ? "true" : "false", {
          select: [["true", "Yes"], ["false", "No"]],
          help: "Opens the detailed mini-lesson when a learner taps a letter."
        })
      );
    } else {
      fields.append(
        lessonField("Completion message", "message", block.message, { textarea: true, wide: true, help: "The student sees this at the end of the lesson." }),
        lessonField("Next lesson slug (optional)", "nextLessonSlug", block.nextLessonSlug, { help: "Optional future handoff into another Studio lesson." })
      );
    }
    return fields;
  }

  function createBlockHeaderBadge(type) {
    const meta = blockDefinition(type);
    const badge = document.createElement("span");
    badge.className = "lesson-block-type-badge";
    badge.textContent = meta.title;
    return badge;
  }

  function createBlockCard(block, index, total) {
    const card = document.createElement("article");
    card.className = "studio-card lesson-block-card";
    card.dataset.blockId = block.id;
    card.classList.toggle("is-collapsed", collapsedLessonBlocks.has(block.id));
    const header = document.createElement("header");
    const identity = document.createElement("div");
    identity.className = "lesson-block-identity";
    const meta = blockDefinition(block.type);
    identity.append(
      textElement("span", "lesson-block-index", `Step ${index + 1}`),
      createBlockHeaderBadge(block.type),
      textElement("h4", "", meta.title)
    );
    identity.appendChild(textElement("p", "lesson-block-description", meta.description));
    const actions = document.createElement("div");
    actions.className = "lesson-block-actions";
    [["collapse", collapsedLessonBlocks.has(block.id) ? "Expand block" : "Collapse block", collapsedLessonBlocks.has(block.id) ? "+" : "–"], ["up", "Move up", "↑"], ["down", "Move down", "↓"], ["duplicate", "Duplicate block", "⧉"], ["delete", "Delete block", "×"]].forEach(([action, label, symbol]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = action === "delete" ? "admin-icon-button is-danger" : "admin-icon-button";
      button.dataset.blockAction = action;
      button.dataset.blockId = block.id;
      button.setAttribute("aria-label", label);
      button.title = label;
      button.textContent = symbol;
      if ((action === "up" && index === 0) || (action === "down" && index === total - 1)) button.disabled = true;
      actions.appendChild(button);
    });
    header.append(identity, actions);
    const body = document.createElement("div");
    body.className = "lesson-block-body";
    const helper = textElement("p", "lesson-block-helper", meta.helper);
    body.append(helper, createBlockFields(block));
    if (collapsedLessonBlocks.has(block.id)) body.hidden = true;
    card.append(header, body);
    return card;
  }

  function renderLessonBlockLibrary() {
    if (!lessonBlockLibrary) return;
    lessonBlockLibrary.replaceChildren(...BLOCK_LIBRARY.map((block) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-block-library-item";
      button.dataset.addBlockType = block.type;
      button.append(
        textElement("span", "lesson-block-library-icon", block.icon),
        textElement("strong", "", block.title),
        textElement("p", "", block.description),
        textElement("span", "lesson-block-library-add", "Add")
      );
      return button;
    }));
  }

  function renderLessonBlocks() {
    const lesson = activeLesson();
    if (!lessonBlockList || !lessonBlockEmpty) return;
    const blocks = lesson?.blocks || [];
    lessonBlockList.replaceChildren(...blocks.map((block, index) => createBlockCard(block, index, blocks.length)));
    lessonBlockList.hidden = blocks.length === 0;
    lessonBlockEmpty.hidden = blocks.length !== 0;
    if (lessonBlockSummary) lessonBlockSummary.textContent = blocks.length ? `${blocks.length} ${blocks.length === 1 ? "step" : "steps"} in this lesson` : "No blocks yet";
  }

  function previewTargets() {
    return [
      {
        container: lessonPreview,
        stage: lessonPreviewStage,
        stepNav: lessonPreviewStepNav,
        current: lessonPreviewStepCurrent,
        total: lessonPreviewStepTotal,
        progress: lessonPreviewProgressBar
      },
      {
        container: lessonInlinePreview,
        stage: lessonInlinePreviewStage,
        stepNav: lessonInlinePreviewStepNav,
        current: lessonInlinePreviewStepCurrent,
        total: lessonInlinePreviewStepTotal,
        progress: lessonInlinePreviewProgressBar
      }
    ].filter((entry) => entry.container && entry.stage);
  }

  function renderLessonPreview() {
    if (!lessonRenderer) return;
    const lesson = activeLesson();
    const targets = previewTargets();
    if (!targets.length) return;
    if (!lesson) {
      targets.forEach((target) => target.container.replaceChildren());
      return;
    }
    if (previewLessonId !== lesson.id) {
      previewLessonId = lesson.id;
      lessonPreviewStep = 0;
    }
    const blockCount = lesson.blocks.length;
    lessonPreviewStep = Math.max(0, Math.min(lessonPreviewStep, Math.max(0, blockCount - 1)));
    targets.forEach((target) => {
      target.stage.dataset.previewDeviceStage = lessonPreviewDevice;
      target.stage.classList.toggle("is-phone-width", lessonPreviewDevice === "phone");
      target.stage.classList.toggle("is-tablet-width", lessonPreviewDevice === "tablet");
      lessonRenderer.render(target.container, lesson, {
        mode: lessonPreviewMode,
        stepIndex: lessonPreviewStep,
        vocabularyItems: vocabularyDocument.items
      });
      const stepMode = lessonPreviewMode === "step";
      if (target.stepNav) target.stepNav.hidden = !stepMode;
      if (target.current) target.current.textContent = String(blockCount ? lessonPreviewStep + 1 : 0);
      if (target.total) target.total.textContent = String(blockCount);
      if (target.progress) target.progress.style.width = `${blockCount ? ((lessonPreviewStep + 1) / blockCount) * 100 : 0}%`;
      const previous = target.stepNav?.querySelector('[data-preview-step-action="previous"], [data-inline-preview-step-action="previous"]');
      const next = target.stepNav?.querySelector('[data-preview-step-action="next"], [data-inline-preview-step-action="next"]');
      if (previous) previous.disabled = lessonPreviewStep <= 0;
      if (next) next.disabled = !blockCount || lessonPreviewStep >= blockCount - 1;
    });
    document.querySelectorAll("[data-preview-mode]").forEach((button) => {
      const active = button.dataset.previewMode === lessonPreviewMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    document.querySelectorAll("[data-preview-device]").forEach((button) => {
      const active = button.dataset.previewDevice === lessonPreviewDevice;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderLessonDashboard() {
    if (lessonDraftCount) lessonDraftCount.textContent = String(lessonDocument.lessons.filter((lesson) => lesson.status === "draft").length);
    if (lessonPublishedCount) lessonPublishedCount.textContent = String(lessonDocument.lessons.filter((lesson) => lesson.status === "published").length);
    if (!lessonRecentList || !lessonRecentEmpty) return;
    const recent = [...lessonDocument.lessons]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 4);
    lessonRecentList.replaceChildren(...recent.map((lesson) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-recent-item";
      button.dataset.previewLessonId = lesson.id;
      const copy = document.createElement("span");
      copy.append(textElement("strong", "", lesson.title), textElement("small", "", `${lesson.module} · ${lesson.level} · ${lesson.blocks.length} ${lesson.blocks.length === 1 ? "step" : "steps"}`));
      button.append(copy, textElement("span", "", "Preview →"));
      return button;
    }));
    lessonRecentList.hidden = recent.length === 0;
    lessonRecentEmpty.hidden = recent.length !== 0;
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
    if (!lesson) {
      updateLessonSaveLabel("No lesson selected", false);
      return;
    }
    setLessonForm(lesson);
    renderCloudStatus(lesson);
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
    const meta = textElement("span", "lesson-list-meta", `${lesson.module} · ${lesson.level} · ${lesson.blocks.length} ${lesson.blocks.length === 1 ? "step" : "steps"}${lesson.premium ? " · Premium" : ""}`);
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
    renderLessonDashboard();
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

  function syncActiveLessonDraftFromForm() {
    const lesson = activeLesson();
    const draft = readLessonForm();
    if (!lesson || !draft) return null;
    const next = lessonStore.normalizeLesson({
      ...lesson,
      ...draft,
      blocks: lesson.blocks,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    }, lesson, false);
    const index = lessonDocument.lessons.findIndex((entry) => entry.id === lesson.id);
    if (index >= 0) lessonDocument.lessons[index] = next;
    if (lessonEditorTitle) lessonEditorTitle.textContent = next.title || "Untitled lesson";
    return next;
  }

  function saveActiveLesson(message, rerender, options) {
    const lesson = readLessonForm();
    if (!lesson) return false;
    if (!validateLessonDraft(lesson, { silent: options?.silentValidation })) return false;
    lessonDocument = lessonStore.upsertLesson(lessonDocument, lesson);
    activeLessonId = lesson.id;
    lessonDirty = false;
    updateLessonSaveLabel(message || "Saved locally", false);
    if (rerender) renderLessonDatabase();
    else {
      renderLessonModuleFilter();
      const lessons = filteredLessons();
      lessonList.replaceChildren(...lessons.map(createLessonListItem));
      lessonList.hidden = lessons.length === 0;
      lessonListEmpty.hidden = lessons.length !== 0;
      renderLessonDashboard();
      renderLessonPreview();
    }
    if (message) showStatus(message);
    return true;
  }

  function scheduleLessonSave() {
    markLessonDirty("Saving...");
    window.clearTimeout(lessonSaveTimer);
    lessonSaveTimer = window.setTimeout(() => saveActiveLesson("", false, { silentValidation: true }), 450);
  }

  function createLesson(templateKey) {
    const template = LESSON_TEMPLATES[templateKey] || LESSON_TEMPLATES.blank;
    const number = lessonDocument.lessons.length + 1;
    const lesson = lessonStore.normalizeLesson(template.create(number));
    lessonDocument = lessonStore.upsertLesson(lessonDocument, lesson);
    activeLessonId = lesson.id;
    collapsedLessonBlocks = new Set();
    lessonDirty = false;
    renderLessonDatabase();
    activateSection("lessons");
    setLessonMode("builder");
    lessonForm?.elements?.namedItem("title")?.focus();
    updateLessonSaveLabel("Saved locally", false);
    showStatus(`${template.title} created locally.`);
  }

  function duplicateLesson() {
    const source = activeLesson();
    if (!source) return;
    const copy = lessonStore.normalizeLesson({ ...source, id: "", title: `${source.title} (Copy)`, slug: `${source.slug}-copy`, status: "draft", blocks: source.blocks.map((block) => ({ ...block, id: "" })), createdAt: "", updatedAt: "" });
    lessonDocument = lessonStore.upsertLesson(lessonDocument, copy);
    activeLessonId = copy.id;
    collapsedLessonBlocks = new Set();
    lessonDirty = false;
    renderLessonDatabase();
    setLessonMode("builder");
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

  function addLessonBlock(type) {
    if (!activeLesson()) createLesson("blank");
    const lesson = activeLesson();
    if (!lesson) return;
    lesson.blocks.push(lessonStore.createBlock(type || "explanation"));
    saveActiveLesson("Block added.", true);
  }

  function updateLessonBlockField(target) {
    const card = target.closest("[data-block-id]");
    const lesson = activeLesson();
    const block = lesson?.blocks.find((entry) => entry.id === card?.dataset.blockId);
    if (!block) return;
    const field = target.dataset.blockField;
    if (field === "options") {
      block[field] = target.value.split("\n").map((option) => option.trim()).filter(Boolean);
    } else if (field === "showVowels" || field === "enableLetterModal") {
      block[field] = target.value === "true";
    } else {
      block[field] = target.value;
    }
    renderLessonPreview();
    scheduleLessonSave();
  }

  function runBlockAction(action, id) {
    const lesson = activeLesson();
    const index = lesson?.blocks.findIndex((block) => block.id === id) ?? -1;
    if (!lesson || index < 0) return;
    if (action === "collapse") {
      if (collapsedLessonBlocks.has(id)) collapsedLessonBlocks.delete(id);
      else collapsedLessonBlocks.add(id);
      renderLessonBlocks();
      return;
    }
    if (action === "delete" && !window.confirm("Delete this block from the lesson?")) return;
    if (action === "delete") lesson.blocks.splice(index, 1);
    if (action === "up" && index > 0) [lesson.blocks[index - 1], lesson.blocks[index]] = [lesson.blocks[index], lesson.blocks[index - 1]];
    if (action === "down" && index < lesson.blocks.length - 1) [lesson.blocks[index + 1], lesson.blocks[index]] = [lesson.blocks[index], lesson.blocks[index + 1]];
    if (action === "duplicate") {
      const duplicate = lessonStore.createBlock(lesson.blocks[index].type);
      const cloned = lessonStore.normalizeBlock({ ...lesson.blocks[index], id: duplicate.id });
      lesson.blocks.splice(index + 1, 0, cloned);
    }
    saveActiveLesson(action === "delete" ? "Block deleted." : action === "duplicate" ? "Block duplicated." : "Block order updated.", true);
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

  function setStudentPreviewMode(mode) {
    lessonPreviewMode = mode === "step" ? "step" : "full";
    lessonPreviewStep = 0;
    renderLessonPreview();
  }

  function setPreviewDevice(device) {
    lessonPreviewDevice = ["desktop", "tablet", "phone"].includes(device) ? device : "desktop";
    renderLessonPreview();
  }

  function moveStudentPreview(direction) {
    const lesson = activeLesson();
    if (!lesson?.blocks.length) return;
    lessonPreviewStep = Math.max(0, Math.min(lessonPreviewStep + direction, lesson.blocks.length - 1));
    renderLessonPreview();
  }

  function previewDashboardLesson(id) {
    const lesson = lessonDocument.lessons.find((entry) => entry.id === id);
    if (!lesson) return;
    activeLessonId = lesson.id;
    lessonPreviewMode = "step";
    lessonPreviewStep = 0;
    previewLessonId = lesson.id;
    activateSection("lessons");
    setLessonMode("preview");
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
    collapsedLessonBlocks = new Set();
    lessonDirty = false;
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
      if (item.imagePath && mediaStore.isImagePath(item.imagePath)) {
        const preview = document.createElement("img");
        preview.className = "vocabulary-picker-thumb";
        preview.src = item.imagePath;
        preview.alt = "";
        preview.addEventListener("error", () => preview.remove(), { once: true });
        button.appendChild(preview);
      }
      const copy = document.createElement("div");
      copy.className = "vocabulary-picker-copy";
      copy.append(
        textElement("strong", "", item.english),
        textElement("span", "", item.spanish),
        textElement("small", "", item.pronunciation || `${item.difficulty} · ${item.category}`)
      );
      const meta = document.createElement("div");
      meta.className = "vocabulary-picker-meta";
      meta.append(
        textElement("span", "lesson-vocabulary-pill", item.difficulty || "A1"),
        textElement("span", "lesson-vocabulary-pill is-muted", item.category || item.partOfSpeech || "Vocabulary")
      );
      if (item.audioPath) meta.appendChild(textElement("span", "lesson-vocabulary-pill is-audio", "Audio"));
      copy.appendChild(meta);
      button.appendChild(copy);
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
    if (section === "creative") renderCreativeLibraries();
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function creativeRegistry(category) {
    if (category === "activities") return activityLibrary?.list?.() || activityLibrary?.all || [];
    if (category === "themes") return themeLibrary?.list?.() || themeLibrary?.all || [];
    if (category === "animations") return animationLibrary?.list?.() || animationLibrary?.all || [];
    if (category === "story") return storySceneLibrary?.list?.() || storySceneLibrary?.all || [];
    return experienceLibrary?.listDefinitions?.() || experienceLibrary?.definitions || [];
  }

  function creativeCategoryLabel(category) {
    return ({
      experiences: "Experience",
      activities: "Activity",
      themes: "Theme",
      animations: "Animation",
      story: "Story scene"
    })[category] || "Library";
  }

  function normalizeCreativeText(value) {
    if (Array.isArray(value)) return value.join(" ");
    if (value && typeof value === "object") return Object.values(value).join(" ");
    return String(value || "");
  }

  function creativeMatchesFilters(entry) {
    const query = String(creativeSearch?.value || "").trim().toLowerCase();
    const statusFilter = creativeStatus?.value || "all";
    const haystack = [
      entry.title,
      entry.summary,
      entry.category,
      entry.studentGoal,
      entry.notes,
      normalizeCreativeText(entry.recommendedFor),
      normalizeCreativeText(entry.supportedThemes),
      normalizeCreativeText(entry.supportedAnimations),
      normalizeCreativeText(entry.requiredInputs),
      normalizeCreativeText(entry.layoutTags),
      normalizeCreativeText(entry.effectTags),
      normalizeCreativeText(entry.intendedUse),
      normalizeCreativeText(entry.characters),
      entry.setting,
      entry.lessonSlug,
      entry.teachingPoint,
      entry.activityPrompt
    ].join(" ").toLowerCase();
    const entryStatus = String(entry.status || "").toLowerCase();
    return (!query || haystack.includes(query))
      && (statusFilter === "all" || entryStatus === statusFilter);
  }

  function createBadge(text, className) {
    const badge = document.createElement("span");
    badge.className = className || "creative-pill";
    badge.textContent = text;
    return badge;
  }

  function createCreativeCard(entry, category) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "creative-library-card";
    button.dataset.creativeId = entry.id;
    button.dataset.creativeCategory = category;
    button.classList.toggle("is-active", activeCreativeSelection === entry.id);

    const header = document.createElement("div");
    header.className = "creative-library-card-top";
    header.append(
      createBadge(creativeCategoryLabel(category), "creative-type-pill"),
      createBadge(entry.status || "planned", `creative-status-pill is-${String(entry.status || "planned").toLowerCase()}`)
    );

    const titleNode = document.createElement("h3");
    titleNode.textContent = entry.title || entry.id;
    const summaryNode = document.createElement("p");
    summaryNode.textContent = entry.summary || "No summary yet.";

    const meta = document.createElement("div");
    meta.className = "creative-library-meta";
    const metaValues = [];
    if (entry.category) metaValues.push(entry.category);
    if (entry.interactionType) metaValues.push(entry.interactionType);
    if (entry.motionType) metaValues.push(entry.motionType);
    if (entry.chapter) metaValues.push(entry.chapter);
    if (entry.module) metaValues.push(entry.module);
    if (entry.trigger) metaValues.push(`Trigger: ${entry.trigger}`);
    if (entry.intendedUse) metaValues.push(`Use: ${normalizeCreativeText(entry.intendedUse)}`);
    metaValues.slice(0, 3).forEach((value) => meta.appendChild(createBadge(value)));

    const helper = document.createElement("div");
    helper.className = "creative-library-helper";
    const helperText = entry.studentGoal
      || entry.teachingPoint
      || entry.tone
      || entry.typography
      || normalizeCreativeText(entry.requiredInputs)
      || entry.notes
      || "";
    helper.textContent = helperText;

    button.append(header, titleNode, summaryNode);
    if (meta.childElementCount) button.appendChild(meta);
    if (helperText) button.appendChild(helper);
    return button;
  }

  function fillPreviewTags(container, values, emptyText) {
    if (!container) return;
    container.replaceChildren();
    const list = Array.isArray(values)
      ? values.filter(Boolean)
      : (values ? [String(values)] : []);
    if (!list.length) {
      container.appendChild(createBadge(emptyText || "Not specified"));
      return;
    }
    list.forEach((value) => container.appendChild(createBadge(String(value))));
  }

  function renderCreativePreview(entry, category) {
    if (!creativePreviewTitle) return;
    if (!entry) {
      creativePreviewTitle.textContent = "Choose a library entry";
      creativePreviewStatus.textContent = "Read only";
      creativePreviewSummary.textContent = "Select an experience, activity, theme, or animation to inspect its intended use and compatibility.";
      creativePreviewMeta.replaceChildren();
      creativePreviewSwatches.hidden = true;
      creativePreviewSwatches.replaceChildren();
      fillPreviewTags(creativePreviewBestFor, [], "Select an entry");
      fillPreviewTags(creativePreviewCompatible, [], "Read-only preview");
      creativePreviewNotes.textContent = "This panel is intentionally read-only for now.";
      return;
    }

    creativePreviewTitle.textContent = entry.title || entry.id;
    creativePreviewStatus.textContent = `${creativeCategoryLabel(category)} · ${entry.status || "planned"}`;
    creativePreviewSummary.textContent = entry.summary || "No summary available.";

    const metaRows = [];
    if (entry.studentGoal) metaRows.push(["Purpose", entry.studentGoal]);
    if (entry.requiredInputs) metaRows.push(["Required inputs", normalizeCreativeText(entry.requiredInputs)]);
    if (entry.contentInputs) metaRows.push(["Content inputs", normalizeCreativeText(entry.contentInputs)]);
    if (entry.interactionType) metaRows.push(["Interaction", entry.interactionType]);
    if (entry.motionType) metaRows.push(["Motion", entry.motionType]);
    if (entry.trigger) metaRows.push(["Trigger", entry.trigger]);
    if (entry.typography) metaRows.push(["Typography", entry.typography]);
    if (entry.shell) metaRows.push(["Shell", entry.shell]);
    if (entry.textureUsage) metaRows.push(["Texture", entry.textureUsage]);
    if (entry.intendedUse) metaRows.push(["Use", normalizeCreativeText(entry.intendedUse)]);
    if (entry.lessonSlug) metaRows.push(["Lesson slug", entry.lessonSlug]);
    if (entry.setting) metaRows.push(["Setting", entry.setting]);
    if (entry.teachingPoint) metaRows.push(["Teaching point", entry.teachingPoint]);
    if (entry.activityPrompt) metaRows.push(["Activity prompt", entry.activityPrompt]);
    if (Array.isArray(entry.characters) && entry.characters.length) {
      const names = entry.characters.map((id) => storyCharacterLibrary?.get?.(id)?.name || id);
      metaRows.push(["Characters", names.join(", ")]);
    }

    creativePreviewMeta.replaceChildren(...metaRows.map(([label, value]) => {
      const row = document.createElement("div");
      row.className = "creative-preview-row";
      const labelNode = document.createElement("span");
      labelNode.textContent = label;
      const valueNode = document.createElement("strong");
      valueNode.textContent = value;
      row.append(labelNode, valueNode);
      return row;
    }));

    const swatches = Array.isArray(entry.swatches) ? entry.swatches.filter(Boolean) : [];
    creativePreviewSwatches.hidden = swatches.length === 0;
    creativePreviewSwatches.replaceChildren(...swatches.map((value) => {
      const chip = document.createElement("span");
      chip.className = "creative-swatch";
      chip.style.setProperty("--swatch", value);
      chip.title = value;
      const code = document.createElement("small");
      code.textContent = value;
      chip.appendChild(code);
      return chip;
    }));

    fillPreviewTags(
      creativePreviewBestFor,
      entry.recommendedFor || entry.intendedUse || entry.layoutTags || entry.characters,
      "No usage notes"
    );

    const compatible = [];
    if (entry.supportedThemes) compatible.push(...entry.supportedThemes);
    if (entry.supportedAnimations) compatible.push(...entry.supportedAnimations);
    if (entry.effectTags) compatible.push(...entry.effectTags);
    if (entry.suggestedTheme) compatible.push(entry.suggestedTheme);
    if (entry.suggestedAnimations) compatible.push(...entry.suggestedAnimations);
    if (entry.suggestedActivity) compatible.push(entry.suggestedActivity);
    fillPreviewTags(creativePreviewCompatible, compatible, "No compatibility data");

    creativePreviewNotes.textContent = entry.notes || "No implementation notes.";
  }

  function renderCreativeLibraries() {
    if (!creativeGrid || !creativeEmpty) return;
    const category = activeCreativeCategory;
    const items = creativeRegistry(category).filter(creativeMatchesFilters);
    if (!activeCreativeSelection || !items.some((entry) => entry.id === activeCreativeSelection)) {
      activeCreativeSelection = items[0]?.id || "";
    }
    creativeGrid.replaceChildren(...items.map((entry) => createCreativeCard(entry, category)));
    creativeGrid.hidden = items.length === 0;
    creativeEmpty.hidden = items.length !== 0;
    document.querySelectorAll("[data-creative-category]").forEach((button) => {
      const active = button.dataset.creativeCategory === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    renderCreativePreview(items.find((entry) => entry.id === activeCreativeSelection) || null, category);
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
    renderLessonBlockLibrary();
    renderLetterList();
    renderEditor(activeKey);
    clearMediaForm();
    renderMediaLibrary();
    clearVocabularyForm();
    renderVocabularyDatabase();
    renderCreativeLibraries();
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
    void refreshCloudLessons({ silent: true });
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
    try {
      if (!store || !mediaStore || !vocabularyStore || !lessonStore || !lessonRenderer) {
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
      sb.auth.onAuthStateChange((_event, session) => {
        Promise.resolve(applySession(session)).catch((authError) => {
          failAdminLoad(authError, "The admin session could not be refreshed.");
        });
      });
    } catch (error) {
      failAdminLoad(error, "Studio could not finish loading.");
    }
  }

  document.addEventListener("click", (event) => {
    const sectionButton = event.target.closest("[data-studio-target], [data-studio-open]");
    if (sectionButton) {
      activateSection(sectionButton.dataset.studioTarget || sectionButton.dataset.studioOpen);
      return;
    }
    const creativeCategoryButton = event.target.closest("[data-creative-category]");
    if (creativeCategoryButton) {
      activeCreativeCategory = creativeCategoryButton.dataset.creativeCategory;
      activeCreativeSelection = "";
      renderCreativeLibraries();
      return;
    }
    const creativeCard = event.target.closest("[data-creative-id]");
    if (creativeCard) {
      activeCreativeSelection = creativeCard.dataset.creativeId;
      renderCreativeLibraries();
      return;
    }
    const lessonTemplateButton = event.target.closest("[data-lesson-template]");
    if (lessonTemplateButton) {
      createLesson(lessonTemplateButton.dataset.lessonTemplate);
      return;
    }
    if (event.target.closest("[data-lesson-new]")) {
      createLesson("blank");
      return;
    }
    const lessonItem = event.target.closest("[data-lesson-id]");
    if (lessonItem) {
      window.clearTimeout(lessonSaveTimer);
      if (activeLesson() && !saveActiveLesson("", false, { silentValidation: true })) return;
      activeLessonId = lessonItem.dataset.lessonId;
      lessonDirty = false;
      renderLessonDatabase();
      return;
    }
    const recentLesson = event.target.closest("[data-preview-lesson-id]");
    if (recentLesson) {
      previewDashboardLesson(recentLesson.dataset.previewLessonId);
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
    if (event.target.closest("[data-lesson-publish]")) {
      void publishActiveLesson();
      return;
    }
    if (event.target.closest("[data-lesson-unpublish]")) {
      void unpublishActiveLesson();
      return;
    }
    if (event.target.closest("[data-lesson-sync]")) {
      void syncLessonsFromSupabase();
      return;
    }
    const addBlockButton = event.target.closest("[data-add-block-type]");
    if (addBlockButton) {
      addLessonBlock(addBlockButton.dataset.addBlockType);
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
    const previewMode = event.target.closest("[data-preview-mode]");
    if (previewMode) {
      setStudentPreviewMode(previewMode.dataset.previewMode);
      return;
    }
    const previewDevice = event.target.closest("[data-preview-device]");
    if (previewDevice) {
      setPreviewDevice(previewDevice.dataset.previewDevice);
      return;
    }
    const previewStepAction = event.target.closest("[data-preview-step-action], [data-inline-preview-step-action]");
    if (previewStepAction) {
      const action = previewStepAction.dataset.previewStepAction || previewStepAction.dataset.inlinePreviewStepAction;
      moveStudentPreview(action === "next" ? 1 : -1);
      renderLessonPreview();
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
  lessonForm?.addEventListener("input", () => {
    syncActiveLessonDraftFromForm();
    renderLessonPreview();
    scheduleLessonSave();
  });
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
  creativeSearch?.addEventListener("input", renderCreativeLibraries);
  creativeStatus?.addEventListener("change", renderCreativeLibraries);
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
