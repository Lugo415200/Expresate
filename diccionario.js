function normalizeText(v) {
  return (v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function showError(msg) {
  const e = document.getElementById("errorMsg");
  if (!e) return alert(msg);
  e.textContent = msg;
  e.style.display = "block";
}

function clearError() {
  const e = document.getElementById("errorMsg");
  if (!e) return;
  e.textContent = "";
  e.style.display = "none";
}

function buildDatalist() {
  const dl = document.getElementById("verbList");
  const db = window.VERB_DB || {};
  const keys = Object.keys(db).sort();
  dl.innerHTML = keys.map(v => `<option value="${v}"></option>`).join("");
}

function buildSpanishIndex() {
  const db = window.VERB_DB || {};
  const index = new Map();

  for (const [key, entry] of Object.entries(db)) {
    const esRaw = entry.es || "";
    if (!esRaw) continue;

    const parts = esRaw
      .split(/[\/,;]+/g)
      .map(s => normalizeText(s))
      .filter(Boolean);

    for (const token of parts) {
      if (!index.has(token)) index.set(token, new Set());
      index.get(token).add(key);
    }
  }

  return index;
}

function resolveSpanishToEnglish(spanishInput, spanishIndex) {
  const s = normalizeText(spanishInput);
  if (!s) return { type: "none" };

  const set = spanishIndex.get(s);
  if (!set || set.size === 0) return { type: "none" };

  const keys = Array.from(set).sort();
  if (keys.length === 1) return { type: "single", key: keys[0] };
  return { type: "multi", keys };
}

function renderResult(verbKey) {
  const r = document.getElementById("result");
  const db = window.VERB_DB || {};
  const entry = db[verbKey];

  if (!entry) {
    r.style.display = "none";
    r.innerHTML = "";
    return;
  }

  r.style.display = "block";

  const esForms = entry.esForms || {};

  const yo      = esForms.yo      || "______";
  const elElla  = esForms.elElla  || "______";
  const ayerYo  = esForms.ayerYo  || "______";
  const yoEstoy = esForms.yoEstoy || "______";
  const yoVoyA  = esForms.yoVoyA  || "______";

  // 🔊 Pronunciation audio (based on English key)
  // Example file: audio/verbs/eat.mp3
  const audioSrc = `audio/verbs/${verbKey}.mp3`;

  r.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
      <h2 style="margin:0;">
        Verbo:
        <span style="color:var(--accent)">${entry.base}</span>
      </h2>

      <button
        class="btn"
        type="button"
        data-audio="${audioSrc}"
        title="Escuchar pronunciación"
        style="padding:8px 10px;"
      >
        🔊
      </button>
    </div>

    <p class="small">
      Español: <strong>${entry.es || "—"}</strong> • Resultado exacto ✅
    </p>

    <div class="block">
      <h3>Formas principales</h3>
      <pre>Base [ I | You | We | They ]: ${entry.base}
[ He  | She | It ]: ${entry.present}
Past (Pasado): ${entry.past}
Past Participle (Participio): ${entry.pp}
-ing: ${entry.ing}</pre>
      <p class="small">
        Estas formas vienen del diccionario del programa (sin suposiciones).
      </p>
    </div>

    <div class="block">
      <h3>Plantillas (uso real)</h3>
      <pre>Yo ${yo.padEnd(14, " ")} → I ${entry.base}
Él/Ella ${elElla.padEnd(10, " ")} → He/She ${entry.present}
Ayer yo ${ayerYo.padEnd(10, " ")} → I ${entry.past} yesterday
Yo ${yoEstoy.padEnd(14, " ")} → I am ${entry.ing}
Yo ${yoVoyA.padEnd(14, " ")} → I am going to ${entry.base}</pre>
      <p class="small">
        Las plantillas se completan automáticamente cuando el verbo tiene formas en español.
      </p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  buildDatalist();
  const spanishIndex = buildSpanishIndex();

  const input = document.getElementById("verbInput");
  const searchBtn = document.getElementById("searchBtn");
  const clearBtn = document.getElementById("clearBtn");

  function runSearch() {
    clearError();
    const raw = input.value;
    const v = normalizeText(raw);
    const db = window.VERB_DB || {};

    if (!v) {
      renderResult("");
      return;
    }

    if (db[v]) {
      renderResult(v);
      return;
    }

    const resolved = resolveSpanishToEnglish(v, spanishIndex);

    if (resolved.type === "single") {
      input.value = resolved.key;
      renderResult(resolved.key);
      return;
    }

    if (resolved.type === "multi") {
      renderResult("");
      showError(`⚠️ "${raw}" puede referirse a varios verbos: ${resolved.keys.join(", ")}`);
      return;
    }

    renderResult("");
    showError(
      "⚠️ No encontramos ese verbo en el programa. Prueba en inglés (eat, go, have) o en español (comer, ir, tener)."
    );
  }

  searchBtn.addEventListener("click", runSearch);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
  });

  input.addEventListener("input", clearError);

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearError();
    renderResult("");
    input.focus();
  });
});

