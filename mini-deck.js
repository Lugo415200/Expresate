function createMiniDeck(containerId, cards, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;

  let i = 0;
  let revealed = false;

  const title = opts.title || "Para esta lección necesitas conocer:";
  const showAudio = opts.showAudio !== false;

  // Optional: base folder for short audio keys like "a"
  // Default for alphabet module:
  const audioBasePath = opts.audioBasePath || "audio/alphabet/";

  // Reuse one audio player (prevents overlapping + improves performance)
  const player = new Audio();
  player.preload = "auto";

  function resolveAudioSrc(card) {
    if (!card || !card.audio) return "";

    const raw = String(card.audio).trim();

    // If it's already a path (contains "/" or ends with an extension), use it as-is
    const looksLikePath =
      raw.includes("/") || raw.endsWith(".mp3") || raw.endsWith(".wav") || raw.endsWith(".ogg");

    if (looksLikePath) return raw;

    // Otherwise treat it like a key (e.g. "a") and build the path
    // -> audio/alphabet/a.mp3
    const key = raw.toLowerCase();
    return `${audioBasePath}${key}.mp3`;
  }

  function playAudioForCurrentCard() {
    const src = resolveAudioSrc(cards[i]);
    if (!src) return;

    try {
      player.pause();
      player.currentTime = 0;
      player.src = src;

      player.play().catch((err) => {
        console.error("Audio play failed:", src, err);
      });
    } catch (err) {
      console.error("Audio error:", src, err);
    }
  }

  function render() {
    const c = cards[i];
    const total = cards.length;

    const audioSrc = resolveAudioSrc(c);
    const audioDisabled = !audioSrc;

    el.innerHTML = `
      <div class="block">
        <h2 style="margin-top:0;">${title}</h2>
        <p class="small" style="margin-top:-6px;">Haz esto en 1–2 minutos antes de la lección.</p>

        <div class="block" style="display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
          <div class="letter-tile">
            <div style="letter-glyph">
              ${c.letter || c.emoji || "?"}
            </div>
          </div>

          <div style="flex:1; min-width:220px;">
            <div class="actions">
              ${showAudio ? `
                <button class="btn" type="button" data-md-action="audio" ${audioDisabled ? "disabled" : ""}>
                  ▶️ Audio
                </button>
              ` : ""}

              <button class="btn" type="button" data-md-action="prev" ${i === 0 ? "disabled" : ""}>←</button>
              <button class="btn" type="button" data-md-action="next" ${i === total - 1 ? "disabled" : ""}>→</button>
            </div>

            <p class="small" style="margin-top:10px;">Tarjeta ${i + 1} de ${total}</p>
          </div>
        </div>
      </div>
    `;

    el.querySelectorAll("[data-md-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-md-action");

        if (action === "reveal") {
          revealed = !revealed;
          render();
          return;
        }

        if (action === "audio") {
          playAudioForCurrentCard();
          return;
        }

        if (action === "prev" && i > 0) {
          i--;
          revealed = false;
          render();
          return;
        }

        if (action === "next" && i < total - 1) {
          i++;
          revealed = false;
          render();
          return;
        }
      });
    });
  }

  render();
}
