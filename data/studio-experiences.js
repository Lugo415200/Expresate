/* Expresate Experience Library foundation.
   Phase 9 starts with one reusable experience: alphabet-explorer. */
(function () {
  "use strict";

  const VOWELS = new Set(["a", "e", "i", "o", "u"]);
  const LETTER_KEYS = "abcdefghijklmnopqrstuvwxyz".split("");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function slugifyWord(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getLetterDataset() {
    const provider = window.ExpresateLesson000Letters;
    if (!provider?.getEffectiveLetters) return {};
    return provider.getEffectiveLetters();
  }

  function getDataset(datasetKey) {
    if (!datasetKey || datasetKey === "lesson000-alphabet") return getLetterDataset();
    return getLetterDataset();
  }

  function normalizeExample(example, fallback) {
    const source = example && typeof example === "object" && !Array.isArray(example)
      ? example
      : { word: example };
    const base = fallback && typeof fallback === "object" ? fallback : {};
    const word = String(source.word || base.word || "").trim();
    return {
      word,
      spanish: String(source.spanish || base.spanish || "").trim(),
      pronunciation: String(source.pronunciation || base.pronunciation || word).trim(),
      imagePath: String(source.imagePath || source.image || base.imagePath || "").trim(),
      audioPath: String(source.audioPath || source.audio || base.audioPath || "").trim(),
      tip: String(source.tip || base.tip || "").trim()
    };
  }

  function buildExamples(item) {
    const sourceExamples = Array.isArray(item.examples) ? item.examples : [];
    const normalized = sourceExamples
      .map((entry, index) => normalizeExample(entry, index === 0 ? {
        word: item.word,
        spanish: item.spanish,
        pronunciation: item.pronunciation,
        imagePath: item.imagePath
      } : {}))
      .filter((entry) => entry.word);

    if (normalized.length) return normalized;

    return [normalizeExample({
      word: item.word || item.letter,
      spanish: item.spanish,
      pronunciation: item.pronunciation || item.word || item.letter,
      imagePath: item.imagePath
    }, {})];
  }

  function safeLetters(dataset) {
    const source = dataset && typeof dataset === "object" ? dataset : {};
    return LETTER_KEYS.map((key) => {
      const fallback = source[key] || {};
      const examples = buildExamples(fallback);
      const primaryExample = examples[0];
      return {
        key,
        letter: String(fallback.letter || key.toUpperCase()).slice(0, 1).toUpperCase(),
        sound: String(fallback.sound || "").trim(),
        word: String(fallback.word || primaryExample.word || key.toUpperCase()).trim(),
        pronunciation: String(fallback.pronunciation || primaryExample.pronunciation || fallback.word || key.toUpperCase()).trim(),
        spanish: String(fallback.spanish || primaryExample.spanish || "").trim(),
        imagePath: String(fallback.imagePath || primaryExample.imagePath || "").trim(),
        examples,
        tip: String(fallback.tip || "").trim()
      };
    });
  }

  function buildWordAudioPath(example) {
    const slug = slugifyWord(example.word);
    return slug ? `assets/audio/words/${slug}.mp3` : "";
  }

  function playLetter(letter, trigger) {
    const normalized = String(letter || "").trim().toLowerCase();
    if (!normalized || !window.ExpresateAudio?.play) return;
    window.ExpresateAudio.play(`audio/alphabet/${normalized}.mp3`, {
      trigger,
      fallbackText: String(letter || "").trim().toUpperCase(),
      speechType: "letter"
    });
  }

  function playExample(example, trigger) {
    if (!window.ExpresateAudio?.play) return;
    const fallback = [example.word, example.pronunciation].filter(Boolean).join(". ");
    window.ExpresateAudio.play(example.audioPath || buildWordAudioPath(example), {
      trigger,
      fallbackText: fallback || example.word,
      speechType: "word"
    });
  }

  function createPreviewPanel(active) {
    const panel = element("aside", "alphabet-experience-preview texture-learning-card");
    panel.append(
      element("span", "alphabet-experience-badge", "Letra actual"),
      element("strong", "alphabet-experience-preview-letter", active.letter),
      element("h4", "alphabet-experience-preview-word", active.word || active.letter),
      element(
        "p",
        "alphabet-experience-preview-meta",
        [active.sound || "sonido", active.spanish || ""].filter(Boolean).join(" · ")
      ),
      element(
        "p",
        "alphabet-experience-preview-tip",
        active.tip || "Toca una letra para escucharla y abrir su mini leccion."
      )
    );
    return panel;
  }

  function createModalHost() {
    const host = element("div", "alphabet-experience-modal-host");
    host.hidden = true;
    host.innerHTML = `
      <div class="alphabet-experience-modal-backdrop" data-exp-close></div>
      <section class="alphabet-experience-modal texture-workbook" role="dialog" aria-modal="true" aria-labelledby="alphabet-experience-modal-title">
        <button type="button" class="alphabet-experience-modal-close" data-exp-close aria-label="Cerrar detalles de la letra">×</button>
        <div class="alphabet-experience-modal-shell">
          <div class="alphabet-experience-visual texture-workbook-green" data-exp-visual></div>
          <div class="alphabet-experience-copy texture-learning-card">
            <div class="alphabet-experience-speech-bubble" data-exp-bubble></div>
            <div class="alphabet-experience-title-row">
              <span class="alphabet-experience-eyebrow">Explora la letra</span>
              <span class="alphabet-experience-example-count" data-exp-example-count>1 de 1</span>
            </div>
            <h3 id="alphabet-experience-modal-title" data-exp-letter-title></h3>
            <div class="alphabet-experience-example-browser">
              <button type="button" class="btn" data-exp-example-prev>← Ejemplo</button>
              <div class="alphabet-experience-example-chips" data-exp-example-chips></div>
              <button type="button" class="btn" data-exp-example-next>Ejemplo →</button>
            </div>
            <div class="alphabet-experience-facts">
              <article><span>Nombre de la letra</span><strong data-exp-letter-name></strong></article>
              <article><span>Sonido</span><strong data-exp-letter-sound></strong></article>
              <article><span>Palabra ejemplo</span><strong data-exp-letter-word></strong><small data-exp-letter-spanish></small></article>
              <article><span>Pronunciacion</span><strong data-exp-letter-pronunciation></strong></article>
            </div>
            <p class="alphabet-experience-tip" data-exp-tip></p>
            <div class="alphabet-experience-extra texture-workbook-green">
              <span>Mas palabras</span>
              <strong data-exp-examples></strong>
            </div>
            <div class="alphabet-experience-actions">
              <button type="button" class="btn" data-exp-close>← Volver</button>
              <button type="button" class="btn" data-exp-audio>Escuchar</button>
              <button type="button" class="btn primary" data-exp-next-letter>Siguiente letra →</button>
            </div>
          </div>
        </div>
      </section>
    `;
    return host;
  }

  function renderVisual(container, item, activeExample) {
    container.replaceChildren();
    container.appendChild(element("span", "alphabet-experience-visual-letter", item.letter));

    const imagePath = activeExample.imagePath || item.imagePath;
    if (imagePath) {
      const image = document.createElement("img");
      image.className = "alphabet-experience-visual-image";
      image.src = imagePath;
      image.alt = `${activeExample.word || item.word || item.letter} illustration`;
      image.addEventListener("error", () => image.remove(), { once: true });
      container.appendChild(image);
    }

    container.appendChild(element("span", "alphabet-experience-visual-word", activeExample.word || item.word || item.letter));

    const tags = element("div", "alphabet-experience-visual-tags");
    item.examples.forEach((entry) => {
      tags.appendChild(element("span", "", entry.word));
    });
    container.appendChild(tags);
  }

  function renderExampleChips(host, item, exampleIndex) {
    const chipWrap = host.querySelector("[data-exp-example-chips]");
    chipWrap.replaceChildren();
    item.examples.forEach((entry, index) => {
      const button = element("button", "alphabet-experience-example-chip", entry.word);
      button.type = "button";
      button.dataset.exampleIndex = String(index);
      button.classList.toggle("is-active", index === exampleIndex);
      button.setAttribute("aria-pressed", index === exampleIndex ? "true" : "false");
      chipWrap.appendChild(button);
    });
  }

  function updateModal(host, items, letterIndex, exampleIndex) {
    const item = items[letterIndex] || items[0];
    const boundedExampleIndex = Math.max(0, Math.min(exampleIndex, item.examples.length - 1));
    const activeExample = item.examples[boundedExampleIndex] || item.examples[0];

    host.dataset.openLetterIndex = String(letterIndex);
    host.dataset.openExampleIndex = String(boundedExampleIndex);
    host.querySelector("[data-exp-bubble]").textContent = `Letra ${item.letter}: escucha el nombre y luego la palabra ${activeExample.word || item.word || item.letter}.`;
    host.querySelector("[data-exp-letter-title]").textContent = item.letter;
    host.querySelector("[data-exp-letter-name]").textContent = item.letter;
    host.querySelector("[data-exp-letter-sound]").textContent = item.sound || "Escucha";
    host.querySelector("[data-exp-letter-word]").textContent = activeExample.word || item.word || item.letter;
    host.querySelector("[data-exp-letter-spanish]").textContent = activeExample.spanish || item.spanish || "";
    host.querySelector("[data-exp-letter-pronunciation]").textContent = activeExample.pronunciation || item.pronunciation || activeExample.word || item.letter;
    host.querySelector("[data-exp-tip]").textContent = activeExample.tip || item.tip || "En ingles una misma letra puede cambiar de sonido segun la palabra.";
    host.querySelector("[data-exp-examples]").textContent = item.examples.map((entry) => entry.word).join(" · ");
    host.querySelector("[data-exp-example-count]").textContent = `${boundedExampleIndex + 1} de ${item.examples.length}`;
    host.querySelector("[data-exp-example-prev]").disabled = boundedExampleIndex <= 0;
    host.querySelector("[data-exp-example-next]").disabled = boundedExampleIndex >= item.examples.length - 1;
    host.querySelector("[data-exp-next-letter]").textContent = letterIndex >= items.length - 1 ? "Cerrar →" : "Siguiente letra →";

    renderExampleChips(host, item, boundedExampleIndex);
    renderVisual(host.querySelector("[data-exp-visual]"), item, activeExample);
  }

  function createAlphabetExplorerCard(block, context) {
    const items = safeLetters(getDataset(block.dataset));
    const card = element("article", `student-preview-card student-preview-experience is-${block.theme || "default"}`);
    const header = element("div", "alphabet-experience-header");
    const copy = element("div", "alphabet-experience-copy-block");
    let previewPanel = createPreviewPanel(items[0]);
    let modalHost = null;

    copy.append(
      element("span", "student-preview-type", "Experiencia"),
      element("h3", "", block.title || "Alphabet Explorer"),
      element("p", "student-preview-body", block.subtitle || "Toca una letra para escucharla y explorarla.")
    );
    if (block.showVowels) {
      copy.appendChild(element("p", "alphabet-experience-vowel-note", "Estas letras marcadas son las vocales del ingles."));
    }
    header.append(copy, previewPanel);

    const grid = element("div", "alphabet-experience-grid");

    function setPreview(index) {
      const active = items[index] || items[0];
      const nextPreview = createPreviewPanel(active);
      header.replaceChild(nextPreview, previewPanel);
      previewPanel = nextPreview;
      grid.querySelectorAll("[data-letter-key]").forEach((button, buttonIndex) => {
        button.classList.toggle("is-active", buttonIndex === index);
      });
    }

    function closeModal() {
      if (!modalHost) return;
      modalHost.classList.remove("is-open");
      modalHost.hidden = true;
    }

    function ensureModal() {
      if (modalHost) return modalHost;
      modalHost = createModalHost();

      modalHost.addEventListener("click", (event) => {
        if (event.target.closest("[data-exp-close]")) closeModal();
      });

      modalHost.querySelector("[data-exp-example-prev]").addEventListener("click", () => {
        const letterIndex = Number(modalHost.dataset.openLetterIndex || 0);
        const exampleIndex = Math.max(0, Number(modalHost.dataset.openExampleIndex || 0) - 1);
        updateModal(modalHost, items, letterIndex, exampleIndex);
      });

      modalHost.querySelector("[data-exp-example-next]").addEventListener("click", () => {
        const letterIndex = Number(modalHost.dataset.openLetterIndex || 0);
        const item = items[letterIndex] || items[0];
        const exampleIndex = Math.min(item.examples.length - 1, Number(modalHost.dataset.openExampleIndex || 0) + 1);
        updateModal(modalHost, items, letterIndex, exampleIndex);
      });

      modalHost.querySelector("[data-exp-example-chips]").addEventListener("click", (event) => {
        const button = event.target.closest("[data-example-index]");
        if (!button) return;
        const letterIndex = Number(modalHost.dataset.openLetterIndex || 0);
        updateModal(modalHost, items, letterIndex, Number(button.dataset.exampleIndex || 0));
      });

      modalHost.querySelector("[data-exp-next-letter]").addEventListener("click", (event) => {
        const currentLetterIndex = Number(modalHost.dataset.openLetterIndex || 0);
        if (currentLetterIndex >= items.length - 1) {
          closeModal();
          return;
        }
        const nextLetterIndex = currentLetterIndex + 1;
        updateModal(modalHost, items, nextLetterIndex, 0);
        setPreview(nextLetterIndex);
        playLetter(items[nextLetterIndex].letter, event.currentTarget);
      });

      modalHost.querySelector("[data-exp-audio]").addEventListener("click", (event) => {
        const letterIndex = Number(modalHost.dataset.openLetterIndex || 0);
        const exampleIndex = Number(modalHost.dataset.openExampleIndex || 0);
        const example = (items[letterIndex] || items[0]).examples[exampleIndex];
        if (example) playExample(example, event.currentTarget);
      });

      modalHost._escapeHandler = (event) => {
        if (event.key === "Escape") closeModal();
      };
      document.addEventListener("keydown", modalHost._escapeHandler);
      document.body.appendChild(modalHost);
      return modalHost;
    }

    function openModal(index) {
      const host = ensureModal();
      updateModal(host, items, index, 0);
      host.hidden = false;
      requestAnimationFrame(() => host.classList.add("is-open"));
    }

    items.forEach((item, index) => {
      const button = element("button", "alphabet-experience-letter motion-pop");
      button.type = "button";
      button.dataset.letterKey = item.letter.toLowerCase();
      button.setAttribute("aria-label", `Explora la letra ${item.letter}`);

      if (block.showVowels && VOWELS.has(item.letter.toLowerCase())) {
        button.classList.add("is-vowel");
        button.appendChild(element("span", "alphabet-experience-vowel-dot", "Vocal"));
      }

      button.append(
        element("strong", "", item.letter),
        element("small", "", item.word || item.letter)
      );

      button.addEventListener("click", (event) => {
        playLetter(item.letter, event.currentTarget);
        setPreview(index);
        if (block.enableLetterModal) openModal(index);
      });

      grid.appendChild(button);
    });

    setPreview(0);
    card.append(header, grid);

    const cleanup = () => {
      if (modalHost?._escapeHandler) document.removeEventListener("keydown", modalHost._escapeHandler);
      if (modalHost?.isConnected) modalHost.remove();
    };
    if (Array.isArray(context.cleanups)) context.cleanups.push(cleanup);

    return card;
  }

  function render(block, context) {
    if (block.experienceType === "alphabet-explorer") {
      return createAlphabetExplorerCard(block, context);
    }

    const empty = element("article", "student-preview-card student-preview-experience");
    empty.append(
      element("span", "student-preview-type", "Experiencia"),
      element("h3", "", block.title || "Experiencia"),
      element("p", "student-preview-body", "Esta experiencia todavia no esta disponible.")
    );
    return empty;
  }

  window.ExpresateStudioExperiences = Object.freeze({
    render,
    getDataset
  });
})();
