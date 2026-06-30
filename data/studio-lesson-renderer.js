/* Exprésate Studio lesson renderer. Preview UI only: no progress, XP, or streak writes. */
(function () {
  "use strict";

  const cleanupByContainer = new WeakMap();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function appendText(parent, tag, value, className) {
    if (!value) return null;
    const node = element(tag, className, value);
    parent.appendChild(node);
    return node;
  }

  function imageNode(path, alt) {
    const image = document.createElement("img");
    image.src = String(path || "");
    image.alt = String(alt || "");
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.replaceWith(element("p", "student-preview-empty", "No se pudo cargar la imagen."));
    }, { once: true });
    return image;
  }

  function typeLabel(type) {
    return ({
      explanation: "Explicación",
      vocabulary: "Vocabulario",
      image: "Imagen",
      quiz: "Pregunta",
      speech: "Práctica de voz",
      completion: "Cierre"
    })[type] || "Contenido";
  }

  function baseCard(block) {
    const card = element("article", `student-preview-card is-${block.type}`);
    card.dataset.previewBlockId = block.id || "";
    card.appendChild(element("span", "student-preview-type", typeLabel(block.type)));
    return card;
  }

  function renderConsejo(text) {
    const wrap = element("aside", "student-preview-consejo");
    const toggle = element("button", "student-preview-consejo-toggle", "Consejo");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    const panel = element("div", "student-preview-consejo-panel");
    panel.hidden = true;
    panel.append(element("strong", "", "Consejo de Exprésate"), element("p", "", text));
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      wrap.classList.toggle("is-open", open);
      panel.hidden = !open;
    });
    wrap.append(toggle, panel);
    return wrap;
  }

  function renderExplanation(block) {
    const card = baseCard(block);
    appendText(card, "h3", block.title || "Explicación");
    appendText(card, "p", block.body, "student-preview-body");
    if (block.consejo) card.appendChild(renderConsejo(block.consejo));
    return card;
  }

  function vocabularyByIds(ids, items) {
    const map = new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
    return (Array.isArray(ids) ? ids : []).map((id) => map.get(id)).filter(Boolean);
  }

  function audioButton(path, label) {
    const button = element("button", "student-preview-audio", "Escuchar");
    button.type = "button";
    button.setAttribute("aria-label", `Escuchar ${label || "audio"}`);
    button.addEventListener("click", async () => {
      if (window.ExpresateAudio?.play) {
        window.ExpresateAudio.play(String(path || ""), { trigger: button, fallbackText: label || "" });
        return;
      }
      const audio = new Audio(String(path || ""));
      audio.preload = "none";
      try {
        await audio.play();
        button.classList.add("is-playing");
        audio.addEventListener("ended", () => button.classList.remove("is-playing"), { once: true });
      } catch (_error) {
        button.textContent = "Audio no disponible";
      }
    });
    return button;
  }

  function renderVocabulary(block, context) {
    const card = baseCard(block);
    appendText(card, "h3", "Palabras de esta práctica");
    const items = vocabularyByIds(block.selectedVocabularyIds, context.vocabularyItems);
    const list = element("div", `student-preview-vocabulary is-${block.displayMode || "cards"}`);
    items.forEach((item) => {
      const word = element("section", "student-preview-word");
      if (item.imagePath) word.appendChild(imageNode(item.imagePath, item.english));
      const copy = element("div", "student-preview-word-copy");
      copy.append(element("strong", "", item.english), element("span", "", item.spanish));
      if (item.pronunciation) copy.appendChild(element("small", "", item.pronunciation));
      word.appendChild(copy);
      if (item.audioPath) word.appendChild(audioButton(item.audioPath, item.english));
      list.appendChild(word);
    });
    if (!items.length) list.appendChild(element("p", "student-preview-empty", "No hay vocabulario seleccionado para este bloque."));
    card.appendChild(list);
    return card;
  }

  function renderImage(block) {
    const card = baseCard(block);
    appendText(card, "h3", block.title);
    if (block.imagePath) card.appendChild(imageNode(block.imagePath, block.caption || block.title || "Imagen de la lección"));
    else card.appendChild(element("p", "student-preview-empty", "Añade una imagen para completar este bloque."));
    appendText(card, "p", block.caption, "student-preview-caption");
    return card;
  }

  function renderQuiz(block, context) {
    const card = baseCard(block);
    appendText(card, "h3", block.question || "Elige una respuesta");
    const options = element("div", "student-preview-quiz-options");
    const feedback = element("div", "student-preview-feedback");
    feedback.setAttribute("role", "status");
    const savedAnswer = contextAnswer(context, block.id);
    if (savedAnswer) {
      feedback.classList.add(savedAnswer.correct ? "is-correct" : "is-error");
      feedback.textContent = savedAnswer.correct ? "¡Correcto!" : "Inténtalo otra vez.";
      if (block.explanation) feedback.appendChild(element("small", "", block.explanation));
    }
    (Array.isArray(block.options) ? block.options : []).forEach((option) => {
      const button = element("button", "student-preview-option", option);
      button.type = "button";
      if (savedAnswer?.option === option) button.classList.add(savedAnswer.correct ? "is-correct" : "is-error");
      button.addEventListener("click", () => {
        const correct = String(option).trim().toLowerCase() === String(block.correctAnswer || "").trim().toLowerCase();
        options.querySelectorAll("button").forEach((entry) => entry.classList.remove("is-correct", "is-error"));
        button.classList.add(correct ? "is-correct" : "is-error");
        feedback.className = `student-preview-feedback ${correct ? "is-correct" : "is-error"}`;
        feedback.textContent = correct ? "¡Correcto!" : "Inténtalo otra vez.";
        if (block.explanation) feedback.appendChild(element("small", "", block.explanation));
        context?.onQuizAnswer?.({ blockId: block.id, option, correct });
      });
      options.appendChild(button);
    });
    if (!options.children.length) options.appendChild(element("p", "student-preview-empty", "Añade opciones para probar esta pregunta."));
    card.append(options, feedback);
    return card;
  }

  function contextAnswer(context, blockId) {
    if (!context?.quizAnswers) return null;
    if (context.quizAnswers instanceof Map) return context.quizAnswers.get(blockId) || null;
    return context.quizAnswers[blockId] || null;
  }

  function renderSpeech(block, context) {
    const card = baseCard(block);
    const prompt = element("div", "student-preview-speech-prompt");
    prompt.append(element("span", "student-preview-mic", "●"), element("h3", "", block.phrase || "Práctica de voz"));
    card.appendChild(prompt);
    appendText(card, "p", block.translation);
    if (block.expectedText) appendText(card, "div", `Texto esperado: ${block.expectedText}`, "student-preview-expected");
    if (block.hint) appendText(card, "small", block.hint, "student-preview-hint");
    if (context.environment === "live" && window.ExpresateSpeechPractice?.create) {
      const root = element("div", "student-preview-speech-live");
      card.appendChild(root);
      const practice = window.ExpresateSpeechPractice.create({
        root,
        expected: block.expectedText || block.phrase || "",
        formatTarget: (value) => `Di: “${value}”`
      });
      context.cleanups.push(() => practice.destroy());
    } else {
      const button = element("button", "student-preview-speech-button", "Hablar (vista previa)");
      button.type = "button";
      button.addEventListener("click", () => {
        button.textContent = "La voz no se guarda en Studio";
        window.setTimeout(() => { button.textContent = "Hablar (vista previa)"; }, 1800);
      });
      card.append(button, element("p", "student-preview-safety-note", "Esta vista previa no graba audio ni guarda progreso."));
    }
    return card;
  }

  function renderCompletion(block, context) {
    const card = baseCard(block);
    card.classList.add("is-celebration");
    card.append(element("span", "student-preview-celebration", "✦"), element("h3", "", block.message || "Lección completada"));
    card.appendChild(element("strong", "student-preview-xp", `+${Number(context.lesson?.xpReward || 0)} XP`));
    appendText(card, "p", block.nextLessonSlug ? `Siguiente lección: ${block.nextLessonSlug}` : "Has llegado al final de la vista previa.");
    if (context.environment !== "live") {
      card.appendChild(element("small", "student-preview-safety-note", "Vista previa: no se actualizan XP, racha ni progreso."));
    }
    return card;
  }

  function renderBlock(block, context) {
    if (block.type === "explanation") return renderExplanation(block, context);
    if (block.type === "vocabulary") return renderVocabulary(block, context);
    if (block.type === "image") return renderImage(block, context);
    if (block.type === "quiz") return renderQuiz(block, context);
    if (block.type === "speech") return renderSpeech(block, context);
    return renderCompletion(block, context);
  }

  function lessonHeader(lesson, compact, environment) {
    const header = element("header", compact ? "student-preview-header is-compact" : "student-preview-header");
    header.append(element("span", "student-preview-kicker", environment === "live" ? "Lección interactiva" : "Vista previa de estudiante"), element("h2", "", lesson.title || "Lección sin título"));
    if (!compact) appendText(header, "p", lesson.description || "Sin descripción todavía.");
    const badges = element("div", "student-preview-badges");
    badges.append(element("span", "", lesson.module || "Sin módulo"), element("span", "", lesson.level || "A1"));
    if (lesson.premium) badges.appendChild(element("span", "is-premium", "Premium"));
    header.appendChild(badges);
    return header;
  }

  function render(container, lesson, options) {
    if (!container) return;
    (cleanupByContainer.get(container) || []).forEach((cleanup) => {
      try { cleanup(); } catch (_error) {}
    });
    const cleanups = [];
    const context = {
      lesson: lesson || {},
      vocabularyItems: Array.isArray(options?.vocabularyItems) ? options.vocabularyItems : [],
      environment: options?.environment === "live" ? "live" : "preview",
      quizAnswers: options?.quizAnswers || null,
      onQuizAnswer: typeof options?.onQuizAnswer === "function" ? options.onQuizAnswer : null,
      cleanups
    };
    const mode = options?.mode === "step" ? "step" : "full";
    const blocks = Array.isArray(lesson?.blocks) ? lesson.blocks : [];
    const stepIndex = Math.max(0, Math.min(Number(options?.stepIndex || 0), Math.max(0, blocks.length - 1)));
    const shell = element("div", `student-preview-shell is-${mode}`);
    shell.appendChild(lessonHeader(context.lesson, mode === "step", context.environment));
    const content = element("div", "student-preview-content");
    const visibleBlocks = mode === "step" ? blocks.slice(stepIndex, stepIndex + 1) : blocks;
    visibleBlocks.forEach((block) => content.appendChild(renderBlock(block, context)));
    if (!visibleBlocks.length) content.appendChild(element("div", "student-preview-empty-state", "Añade bloques para ver la experiencia del estudiante."));
    shell.appendChild(content);
    container.replaceChildren(shell);
    cleanupByContainer.set(container, cleanups);
    return { blockCount: blocks.length, stepIndex };
  }

  window.ExpresateStudioLessonRenderer = Object.freeze({ render, renderBlock });
})();
