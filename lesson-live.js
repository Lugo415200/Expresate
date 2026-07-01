/* Exprésate Live Lesson Engine for published Studio lessons. */
(function () {
  "use strict";

  const lessonStore = window.ExpresateStudioLessons;
  const lessonPublisher = window.ExpresateStudioPublishing;
  const vocabularyStore = window.ExpresateStudioVocabulary;
  const renderer = window.ExpresateStudioLessonRenderer;
  const storySceneLibrary = window.ExpresateStudioStoryScenes;
  const loading = document.querySelector("[data-live-loading]");
  const message = document.querySelector("[data-live-message]");
  const messageTitle = document.querySelector("[data-live-message-title]");
  const messageCopy = document.querySelector("[data-live-message-copy]");
  const messageActions = document.querySelector("[data-live-message-actions]");
  const app = document.querySelector("[data-live-app]");
  const stage = document.querySelector("[data-live-renderer]");
  const title = document.querySelector("[data-live-title]");
  const moduleName = document.querySelector("[data-live-module]");
  const premiumBadge = document.querySelector("[data-live-premium]");
  const xpBadge = document.querySelector("[data-live-xp]");
  const progressBar = document.querySelector("[data-live-progress-bar]");
  const currentStep = document.querySelector("[data-live-step-current]");
  const totalSteps = document.querySelector("[data-live-step-total]");
  const storyIntro = document.querySelector("[data-live-story-intro]");
  const storyIntroRender = document.querySelector("[data-live-story-intro-render]");
  const storyIntroContinue = document.querySelector("[data-live-story-intro-continue]");
  const backButton = document.querySelector("[data-live-back]");
  const nextButton = document.querySelector("[data-live-next]");

  let lesson = null;
  let vocabularyItems = [];
  let stepIndex = 0;
  let completed = false;
  let introScene = null;
  const quizAnswers = new Map();

  function progressId() {
    return lesson ? `studio:${lesson.slug}` : "";
  }

  function showMessage(titleText, copyText, actions) {
    loading.hidden = true;
    app.hidden = true;
    message.hidden = false;
    messageTitle.textContent = titleText;
    messageCopy.textContent = copyText;
    if (actions) messageActions.replaceChildren(...actions);
  }

  function actionLink(label, href, primary) {
    const link = document.createElement("a");
    link.className = `btn${primary ? " primary" : ""}`;
    link.href = href;
    link.textContent = label;
    return link;
  }

  function showMissing() {
    showMessage(
      "Lección no encontrada",
      "Esta lección no existe, sigue en borrador o ya no está disponible.",
      [actionLink("Volver al curso", "curso.html", true)]
    );
  }

  function showPremiumLock() {
    const limited = window.Access?.isPremiumDeviceLimited?.();
    const returnTo = `lesson.html?slug=${encodeURIComponent(lesson.slug)}`;
    showMessage(
      limited ? "Límite de dispositivos Premium" : "Lección Premium",
      limited
        ? "Desactiva un dispositivo antiguo para continuar con esta lección."
        : "Necesitas Premium para abrir esta lección.",
      limited
        ? [actionLink("Administrar dispositivos", `devices.html?from=${encodeURIComponent(returnTo)}`, true), actionLink("Volver al curso", "curso.html", false)]
        : [actionLink("Ver Premium", `pricing.html?from=${encodeURIComponent(returnTo)}`, true), actionLink("Volver al curso", "curso.html", false)]
    );
  }

  function currentBlock() {
    return lesson?.blocks?.[stepIndex] || null;
  }

  function canAdvance() {
    const block = currentBlock();
    if (block?.type !== "quiz") return true;
    return quizAnswers.get(block.id)?.correct === true;
  }

  function completionBlock() {
    return [...(lesson?.blocks || [])].reverse().find((block) => block.type === "completion") || null;
  }

  function updateControls() {
    const count = lesson?.blocks?.length || 0;
    const position = count ? stepIndex + 1 : 0;
    backButton.disabled = stepIndex <= 0 || completed;
    nextButton.disabled = !count || !canAdvance();
    if (completed) {
      nextButton.disabled = false;
      nextButton.textContent = completionBlock()?.nextLessonSlug ? "Siguiente lección →" : "Volver al curso";
    } else if (stepIndex >= count - 1) {
      nextButton.textContent = "Completar lección";
    } else if (!canAdvance()) {
      nextButton.textContent = "Responde correctamente";
    } else {
      nextButton.textContent = "Siguiente →";
    }
    currentStep.textContent = String(position);
    totalSteps.textContent = String(count);
    progressBar.style.width = `${count ? (position / count) * 100 : 0}%`;
  }

  function render() {
    renderer.render(stage, lesson, {
      mode: "step",
      environment: "live",
      stepIndex,
      vocabularyItems,
      quizAnswers,
      onQuizAnswer(result) {
        quizAnswers.set(result.blockId, result);
        updateControls();
      }
    });
    updateControls();
  }

  function lessonStoryScenes(slug) {
    const scenes = storySceneLibrary?.list?.() || storySceneLibrary?.all || [];
    return scenes
      .filter((scene) => scene?.lessonSlug === slug && scene?.status === "ready")
      .sort((a, b) => Number(a?.sceneOrder || 0) - Number(b?.sceneOrder || 0));
  }

  function hasExplicitStoryScene(sceneId) {
    return Array.isArray(lesson?.blocks) && lesson.blocks.some((block) => block?.type === "story-scene" && block?.sceneId === sceneId);
  }

  function renderStoryIntro() {
    if (!storyIntro || !storyIntroRender) return;
    storyIntro.classList.remove("is-dismissed");
    if (!introScene || hasExplicitStoryScene(introScene.id)) {
      storyIntro.hidden = true;
      storyIntroRender.replaceChildren();
      return;
    }
    const introBlock = {
      id: `auto-story-intro:${introScene.id}`,
      type: "story-scene",
      sceneId: introScene.id,
      title: introScene.title
    };
    const card = renderer.renderBlock(introBlock, {
      lesson,
      vocabularyItems,
      environment: "live",
      quizAnswers,
      cleanups: []
    });
    storyIntroRender.replaceChildren(card);
    storyIntro.hidden = false;
  }

  function dismissStoryIntro() {
    if (!storyIntro) return;
    storyIntro.hidden = true;
    storyIntro.classList.add("is-dismissed");
    stage?.scrollIntoView?.({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function completeLesson() {
    if (completed) return;
    const id = progressId();
    const alreadyDone = window.Progress.isLessonDone(id);
    if (!alreadyDone) {
      window.Progress.setLessonDone(id, true, { xpReward: lesson.xpReward });
      window.Progress.recordActivity("studio-lesson", id);
      window.ExpresateTextureReward?.pulse?.();
      window.Alerts?.success?.(`¡Lección completada! +${lesson.xpReward} XP`);
    }
    completed = true;
    app.classList.add("is-complete");
    updateControls();
  }

  function openCompletionDestination() {
    const nextSlug = completionBlock()?.nextLessonSlug;
    window.location.href = nextSlug
      ? `lesson.html?slug=${encodeURIComponent(nextSlug)}`
      : "curso.html";
  }

  function next() {
    if (completed) {
      openCompletionDestination();
      return;
    }
    if (!canAdvance()) return;
    if (stepIndex >= lesson.blocks.length - 1) {
      completeLesson();
      return;
    }
    stepIndex += 1;
    render();
  }

  function back() {
    if (stepIndex <= 0 || completed) return;
    stepIndex -= 1;
    render();
  }

  function publishedLesson(slug) {
    const documentState = lessonStore.loadDocument();
    return documentState.lessons.find((entry) => entry.slug === slug && entry.status === "published") || null;
  }

  async function loadPublishedLesson(slug) {
    if (lessonPublisher?.available) {
      try {
        const cloudLesson = await lessonPublisher.getPublishedLesson(slug);
        if (cloudLesson) return cloudLesson;
      } catch (error) {
        console.warn("[LiveLesson] Cloud lesson lookup failed; trying local content.", error);
      }
    }
    return publishedLesson(slug);
  }

  async function init() {
    if (!lessonStore || !vocabularyStore || !renderer || !window.Progress) {
      showMessage("No se pudo abrir la lección", "Falta un componente necesario. Vuelve a intentarlo.", [actionLink("Volver al curso", "curso.html", true)]);
      return;
    }
    const rawSlug = new URLSearchParams(window.location.search).get("slug") || "";
    const slug = rawSlug ? lessonStore.cleanSlug(rawSlug, "") : "";
    lesson = slug ? await loadPublishedLesson(slug) : null;
    if (!lesson) {
      showMissing();
      return;
    }

    try { await (window.Access?.ready?.() || Promise.resolve()); } catch (_error) {}
    if (lesson.premium && !window.Access?.canAccessLesson?.(lesson)) {
      showPremiumLock();
      return;
    }

    vocabularyItems = vocabularyStore.loadDocument().items;
    introScene = lessonStoryScenes(lesson.slug)[0] || null;
    // A completed lesson can still be reviewed. The existing progress record
    // prevents duplicate XP when the learner reaches the end again.
    completed = false;
    document.body.dataset.lessonId = progressId();
    document.title = `${lesson.title} | Exprésate`;
    title.textContent = lesson.title;
    moduleName.textContent = `${lesson.module} · ${lesson.level}`;
    premiumBadge.hidden = !lesson.premium;
    xpBadge.textContent = `+${lesson.xpReward} XP`;
    loading.hidden = true;
    message.hidden = true;
    app.hidden = false;
    renderStoryIntro();
    render();
  }

  backButton?.addEventListener("click", back);
  nextButton?.addEventListener("click", next);
  storyIntroContinue?.addEventListener("click", dismissStoryIntro);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
