/* Exprésate Experience Library foundation.
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

  function getLetterDataset() {
    const provider = window.ExpresateLesson000Letters;
    if (!provider?.getEffectiveLetters) return {};
    return provider.getEffectiveLetters();
  }

  function getDataset(datasetKey) {
    if (!datasetKey || datasetKey === "lesson000-alphabet") return getLetterDataset();
    return getLetterDataset();
  }

  function safeLetters(dataset) {
    const source = dataset && typeof dataset === "object" ? dataset : {};
    return LETTER_KEYS.map((key) => {
      const fallback = source[key] || {};
      return {
        key,
        letter: String(fallback.letter || key.toUpperCase()).slice(0, 1).toUpperCase(),
        sound: String(fallback.sound || "").trim(),
        word: String(fallback.word || key.toUpperCase()).trim(),
        pronunciation: String(fallback.pronunciation || fallback.word || key.toUpperCase()).trim(),
        spanish: String(fallback.spanish || "").trim(),
        imagePath: String(fallback.imagePath || "").trim(),
        examples: Array.isArray(fallback.examples) ? clone(fallback.examples).slice(0, 4) : [],
        tip: String(fallback.tip || "").trim()
      };
    });
  }

  function playLetter(letter, trigger) {
    const normalized = String(letter || "").trim().toLowerCase();
    if (!normalized || !window.ExpresateAudio?.play) return;
    window.ExpresateAudio.play(`audio/alphabet/${normalized}.mp3`, {
      trigger,
      fallbackText: String(letter || "").trim().toUpperCase()
    });
  }

  function playExample(item, trigger) {
    if (!window.ExpresateAudio?.play) return;
    const fallback = [item.word, item.pronunciation].filter(Boolean).join(". ");
    window.ExpresateAudio.play("", {
      trigger,
      fallbackText: fallback || item.word || item.letter
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
        active.tip || "Toca una letra para escucharla y abrir su mini lección."
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
            <span class="alphabet-experience-eyebrow">Explora la letra</span>
            <h3 id="alphabet-experience-modal-title" data-exp-letter-title></h3>
            <div class="alphabet-experience-facts">
              <article><span>Nombre de la letra</span><strong data-exp-letter-name></strong></article>
              <article><span>Sonido</span><strong data-exp-letter-sound></strong></article>
              <article><span>Palabra ejemplo</span><strong data-exp-letter-word></strong><small data-exp-letter-spanish></small></article>
              <article><span>Pronunciación</span><strong data-exp-letter-pronunciation></strong></article>
            </div>
            <p class="alphabet-experience-tip" data-exp-tip></p>
            <div class="alphabet-experience-extra texture-workbook-green">
              <span>Más palabras</span>
              <strong data-exp-examples></strong>
            </div>
            <div class="alphabet-experience-actions">
              <button type="button" class="btn" data-exp-prev>← Anterior</button>
              <button type="button" class="btn" data-exp-audio>Escuchar</button>
              <button type="button" class="btn primary" data-exp-next>Siguiente →</button>
            </div>
          </div>
        </div>
      </section>
    `;
    return host;
  }

  function renderVisual(container, item) {
    container.replaceChildren();
    container.appendChild(element("span", "alphabet-experience-visual-letter", item.letter));

    if (item.imagePath) {
      const image = document.createElement("img");
      image.className = "alphabet-experience-visual-image";
      image.src = item.imagePath;
      image.alt = `${item.word || item.letter} illustration`;
      image.addEventListener("error", () => image.remove(), { once: true });
      container.appendChild(image);
    }

    container.appendChild(element("span", "alphabet-experience-visual-word", item.word || item.letter));

    const tags = element("div", "alphabet-experience-visual-tags");
    (Array.isArray(item.examples) ? item.examples : []).slice(0, 4).forEach((entry) => {
      tags.appendChild(element("span", "", entry));
    });
    if (!tags.children.length) tags.appendChild(element("span", "", item.word || item.letter));
    container.appendChild(tags);
  }

  function updateModal(host, items, index) {
    const item = items[index] || items[0];
    host.dataset.openIndex = String(index);
    host.querySelector("[data-exp-bubble]").textContent = `Letra ${item.letter}: escucha el nombre y luego la palabra ${item.word || item.letter}.`;
    host.querySelector("[data-exp-letter-title]").textContent = item.letter;
    host.querySelector("[data-exp-letter-name]").textContent = item.letter;
    host.querySelector("[data-exp-letter-sound]").textContent = item.sound || "Escucha";
    host.querySelector("[data-exp-letter-word]").textContent = item.word || item.letter;
    host.querySelector("[data-exp-letter-spanish]").textContent = item.spanish || "";
    host.querySelector("[data-exp-letter-pronunciation]").textContent = item.pronunciation || item.word || item.letter;
    host.querySelector("[data-exp-tip]").textContent = item.tip || "En inglés una misma letra puede cambiar de sonido según la palabra.";
    host.querySelector("[data-exp-examples]").textContent = (item.examples || []).join(" · ") || item.word || item.letter;
    host.querySelector("[data-exp-prev]").disabled = index <= 0;
    host.querySelector("[data-exp-next]").textContent = index >= items.length - 1 ? "Cerrar →" : "Siguiente →";
    renderVisual(host.querySelector("[data-exp-visual]"), item);
  }

  function createAlphabetExplorerCard(block, context) {
    const items = safeLetters(getDataset(block.dataset));
    const card = element("article", `student-preview-card student-preview-experience is-${block.theme || "default"}`);
    const header = element("div", "alphabet-experience-header");
    const copy = element("div", "alphabet-experience-copy-block");
    let previewPanel = createPreviewPanel(items[0]);
    let modalHost = null;
    let activeIndex = 0;

    copy.append(
      element("span", "student-preview-type", "Experiencia"),
      element("h3", "", block.title || "Alphabet Explorer"),
      element("p", "student-preview-body", block.subtitle || "Toca una letra para escucharla y explorarla.")
    );
    if (block.showVowels) {
      copy.appendChild(element("p", "alphabet-experience-vowel-note", "Estas letras marcadas son las vocales del inglés."));
    }
    header.append(copy, previewPanel);

    const grid = element("div", "alphabet-experience-grid");

    function setPreview(index) {
      activeIndex = index;
      const nextPreview = createPreviewPanel(items[index] || items[0]);
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
      modalHost.querySelector("[data-exp-prev]").addEventListener("click", () => {
        const nextIndex = Math.max(0, Number(modalHost.dataset.openIndex || 0) - 1);
        updateModal(modalHost, items, nextIndex);
        setPreview(nextIndex);
      });
      modalHost.querySelector("[data-exp-next]").addEventListener("click", () => {
        const currentIndex = Number(modalHost.dataset.openIndex || 0);
        if (currentIndex >= items.length - 1) {
          closeModal();
          return;
        }
        const nextIndex = Math.min(items.length - 1, currentIndex + 1);
        updateModal(modalHost, items, nextIndex);
        setPreview(nextIndex);
      });
      modalHost.querySelector("[data-exp-audio]").addEventListener("click", (event) => {
        const currentIndex = Number(modalHost.dataset.openIndex || 0);
        playExample(items[currentIndex] || items[0], event.currentTarget);
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
      updateModal(host, items, index);
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
      element("p", "student-preview-body", "Esta experiencia todavía no está disponible.")
    );
    return empty;
  }

  window.ExpresateStudioExperiences = Object.freeze({
    render,
    getDataset
  });
})();
