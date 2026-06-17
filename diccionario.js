/* diccionario.js — Verb search engine for Exprésate
   Depends on: verb.js (window.VERB_DB must be defined first)

   Search supports:
   - Exact English key          eat  →  eat
   - English conjugated forms   ate  →  eat   |  going  →  go
   - Spanish infinitive         comer  →  eat
   - Spanish conjugated forms   trabajo  →  work  |  comiendo  →  eat
   - Partial matches            "worki"  →  work
   - Simple typos (Levenshtein) "studie"  →  study
   - Accent-insensitive         "comi"  →  eat
*/
(function () {
  "use strict";

  // ── Text helpers ──────────────────────────────────────────────

  function normaliseText(s) {
    return (s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  // Levenshtein distance — rolling-row O(n) space
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = [];
    for (var j = 0; j <= b.length; j++) prev[j] = j;
    for (var i = 1; i <= a.length; i++) {
      var curr = [i];
      for (var jj = 1; jj <= b.length; jj++) {
        var cost = a[i - 1] === b[jj - 1] ? 0 : 1;
        curr[jj] = Math.min(prev[jj] + 1, curr[jj - 1] + 1, prev[jj - 1] + cost);
      }
      prev = curr;
    }
    return prev[b.length];
  }

  // Safe HTML escape
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Search index ──────────────────────────────────────────────

  function buildSearchIndex(db) {
    var index = new Map();

    function add(term, key) {
      var t = normaliseText(term);
      if (!t || t.length < 1) return;
      if (!index.has(t)) index.set(t, new Set());
      index.get(t).add(key);
    }

    function addAll(str, key) {
      (str || "").split(/[\/,;\s]+/).forEach(function (part) {
        var p = part.trim();
        if (p) add(p, key);
      });
    }

    for (var key in db) {
      if (!Object.prototype.hasOwnProperty.call(db, key)) continue;
      var v = db[key];
      add(key, key);
      addAll(v.base, key);
      addAll(v.present, key);
      addAll(v.past, key);
      addAll(v.pp, key);
      addAll(v.ing, key);
      addAll(v.es, key);
      (v.aliases || []).forEach(function (a) { add(a, key); });
    }
    return index;
  }

  // ── Search ────────────────────────────────────────────────────
  //
  // Returns one of:
  //   { type: "empty" }
  //   { type: "exact",       key: "work" }
  //   { type: "ambiguous",   keys: ["do","make"] }
  //   { type: "suggestions", keys: [...], query: "..." }
  //   { type: "none",        query: "..." }

  function search(rawQuery, db, index) {
    var q = normaliseText(rawQuery);
    if (!q) return { type: "empty" };

    // Exact match
    var exactSet = index.get(q);
    if (exactSet && exactSet.size > 0) {
      var exactKeys = Array.from(exactSet).sort();
      if (exactKeys.length === 1) return { type: "exact", key: exactKeys[0] };
      return { type: "ambiguous", keys: exactKeys };
    }

    if (q.length < 2) return { type: "none", query: q };

    // Partial + fuzzy pass
    var scores = new Map(); // verb key → best score (lower = better)
    var allTerms = Array.from(index.keys());
    var maxDist = Math.min(2, Math.max(1, Math.floor(q.length / 4)));

    for (var i = 0; i < allTerms.length; i++) {
      var term = allTerms[i];

      // Substring match
      var isPartial = term.indexOf(q) !== -1 || (q.length >= 4 && q.indexOf(term) !== -1);
      if (isPartial) {
        index.get(term).forEach(function (k) {
          if (!scores.has(k) || scores.get(k) > 0.4) scores.set(k, 0.4);
        });
        continue;
      }

      // Levenshtein (only for queries ≥ 3 chars to avoid noise)
      if (q.length >= 3) {
        var dist = levenshtein(q, term);
        if (dist <= maxDist) {
          var score = dist / Math.max(q.length, term.length);
          index.get(term).forEach(function (k) {
            if (!scores.has(k) || scores.get(k) > score) scores.set(k, score);
          });
        }
      }
    }

    if (scores.size === 0) return { type: "none", query: rawQuery };

    var sorted = Array.from(scores.entries())
      .sort(function (a, b) { return a[1] - b[1] || a[0].localeCompare(b[0]); })
      .map(function (e) { return e[0]; })
      .slice(0, 6);

    return { type: "suggestions", keys: sorted, query: rawQuery };
  }

  // ── Render: verb result card ──────────────────────────────────

  function renderResult(key, db) {
    var el = document.getElementById("result");
    if (!el) return;
    var entry = db[key];
    if (!entry) { el.style.display = "none"; el.innerHTML = ""; return; }

    var audioSrc = entry.audio || ("audio/verbs/" + key + ".mp3");
    var audioBtn = '<button class="btn verb-audio-btn" type="button" data-audio="'
      + esc(audioSrc) + '" data-audio-fallback="' + esc(entry.base || key)
      + '" title="Escuchar pronunciación" aria-label="Escuchar pronunciación">🔊</button>';

    // Forms grid
    var forms = [
      { label: "Base · I / You / We", value: entry.base },
      { label: "He / She / It",       value: entry.present },
      { label: "Pasado (Past)",        value: entry.past },
      { label: "Participio (PP)",      value: entry.pp },
      { label: "-ing form",            value: entry.ing }
    ];
    var formsHTML = forms.map(function (f) {
      return '<div class="verb-form-item">'
        + '<span class="verb-form-label">' + esc(f.label) + '</span>'
        + '<span class="verb-form-value">' + esc(f.value) + '</span>'
        + '</div>';
    }).join("");

    // Examples
    var examplesHTML = "";
    if (entry.examples && entry.examples.length) {
      examplesHTML = '<div class="verb-examples">'
        + '<span class="verb-section-label">Ejemplos reales</span>'
        + entry.examples.map(function (ex) {
            return '<div class="verb-example">'
              + '<span class="verb-example-en">' + esc(ex.en) + '</span>'
              + '<span class="verb-example-es">' + esc(ex.es) + '</span>'
              + '</div>';
          }).join("")
        + '</div>';
    }

    // Template
    var b  = esc(entry.base);
    var pr = esc(entry.present);
    var pa = esc(entry.past);
    var ig = esc(entry.ing);

    var templateHTML =
      '<div class="verb-template">'
      + '<span class="verb-section-label">Plantilla rápida</span>'
      + '<div class="verb-template-grid">'
      + row("Presente",  "I / You / We", "I <strong>" + b  + "</strong> every day.")
      + row("Presente",  "He / She / It","She <strong>" + pr + "</strong> now.")
      + row("Pasado",    "ayer",         "I <strong>" + pa + "</strong> yesterday.")
      + row("-ing",      "ahora mismo",  "I am <strong>" + ig + "</strong> right now.")
      + row("Futuro",    "ir a + inf.",  "I&rsquo;m going to <strong>" + b + "</strong>.")
      + '</div>'
      + '</div>';

    el.style.display = "block";
    el.className = "block verb-card";
    el.innerHTML =
        '<div class="verb-card-header">'
      +   '<h2 class="verb-card-title">Verbo: <span class="verb-base">' + b + '</span></h2>'
      +   audioBtn
      + '</div>'
      + '<p class="verb-card-subtitle">Español: <strong>' + esc(entry.es) + '</strong></p>'
      + '<div class="verb-forms-grid">' + formsHTML + '</div>'
      + examplesHTML
      + templateHTML;
  }

  function row(tense, context, english) {
    return '<div class="verb-template-row">'
      + '<span class="verb-template-note">' + esc(tense) + '</span>'
      + '<span class="verb-template-arrow">→</span>'
      + '<span class="verb-template-en">' + english + '</span>'
      + '</div>';
  }

  // ── Render: suggestion / ambiguous chips ──────────────────────

  function renderChips(keys, label, db, onPick) {
    var el = document.getElementById("result");
    if (!el) return;
    el.style.display = "block";
    el.className = "block";

    var chips = keys.map(function (k) {
      var v = db[k] || {};
      return '<button class="suggestion-chip" type="button" data-verb-key="' + esc(k) + '">'
        + '<strong>' + esc(k) + '</strong>'
        + (v.es ? ' <span style="font-weight:500;color:rgba(15,23,42,.45);">— ' + esc(v.es) + '</span>' : '')
        + '</button>';
    }).join("");

    el.innerHTML = '<div class="suggestions-box">'
      + '<p class="suggestions-label">' + label + '</p>'
      + '<div class="suggestion-chips">' + chips + '</div>'
      + '</div>';

    el.querySelectorAll(".suggestion-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        onPick(btn.getAttribute("data-verb-key"));
      });
    });
  }

  // ── Status line ───────────────────────────────────────────────

  function setStatus(msg) {
    var el = document.getElementById("searchStatus");
    if (el) el.textContent = msg || "";
  }

  // ── Boot ──────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    var db    = window.VERB_DB || {};
    var index = buildSearchIndex(db);

    // Verb count badge
    var countEl = document.getElementById("verbCount");
    if (countEl) countEl.textContent = Object.keys(db).length;

    // Footer year
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var input     = document.getElementById("verbInput");
    var searchBtn = document.getElementById("searchBtn");
    var clearBtn  = document.getElementById("clearBtn");
    var resultEl  = document.getElementById("result");

    // Core search dispatcher
    function runSearch(forceQuery) {
      var raw = forceQuery !== undefined ? forceQuery : (input ? input.value : "");
      if (input && forceQuery !== undefined) input.value = forceQuery;

      var res = search(raw, db, index);

      function onPick(key) {
        if (input) input.value = key;
        renderResult(key, db);
        setStatus("");
      }

      if (res.type === "empty") {
        if (resultEl) { resultEl.style.display = "none"; resultEl.innerHTML = ""; }
        setStatus("");

      } else if (res.type === "exact") {
        renderResult(res.key, db);
        setStatus("");

      } else if (res.type === "ambiguous") {
        renderChips(
          res.keys,
          "Esta palabra puede referirse a varios verbos. ¿Cuál buscas?",
          db, onPick
        );
        setStatus("");

      } else if (res.type === "suggestions") {
        renderChips(
          res.keys,
          "No encontramos una coincidencia exacta. ¿Quisiste decir…?",
          db, onPick
        );
        setStatus("");

      } else {
        // none
        if (resultEl) { resultEl.style.display = "none"; resultEl.innerHTML = ""; }
        setStatus('No encontramos "' + raw + '". Prueba en inglés o español (ej: eat, comer, trabajo).');
      }
    }

    // Wire controls
    if (searchBtn) {
      searchBtn.addEventListener("click", function () { runSearch(); });
    }
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") runSearch();
      });
      input.addEventListener("input", function () { setStatus(""); });
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (input) { input.value = ""; input.focus(); }
        if (resultEl) { resultEl.style.display = "none"; resultEl.innerHTML = ""; }
        setStatus("");
      });
    }

    // Starter chips
    var chipsContainer = document.getElementById("starterChips");
    if (chipsContainer) {
      var starters = ["work", "eat", "go", "have", "make", "take", "want", "need"];
      chipsContainer.innerHTML = starters.map(function (k) {
        return '<button class="chip" type="button" data-verb-key="' + esc(k) + '">' + esc(k) + '</button>';
      }).join("");

      chipsContainer.querySelectorAll(".chip").forEach(function (btn) {
        btn.addEventListener("click", function () {
          runSearch(btn.getAttribute("data-verb-key"));
        });
      });
    }
  });

})();
