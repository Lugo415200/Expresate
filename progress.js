/* ============================================================
   progress.js — Exprésate
   Single source of truth for user progress (lessons + quizzes).

   Public API (exposed on window.Progress):
     Progress.isLessonDone(id)
     Progress.setLessonDone(id, done = true)
     Progress.isQuizPassed(id)
     Progress.setQuizPassed(id, passed, score, total)
     Progress.getLesson(id)         -> { done, ts } | null
     Progress.getQuiz(id)           -> { passed, score, total, ts } | null
     Progress.reset(id)             -> remove one entry (lesson or quiz)
     Progress.resetAll()            -> wipe everything (current key only)
     Progress.snapshot()            -> the whole stored object (read-only copy)
     Progress.on('change', cb)      -> subscribe to changes (cross-tab too)

   Load this script BEFORE app.js / curso.js on every page.
   It is plain global JS so it works with GitHub Pages + no build step.
   ============================================================ */
(function () {
  "use strict";

  // --- XP rules ---------------------------------------------------------
  // Tweak here once. Lesson + quiz completions translate to XP totals.
  const XP_PER_LESSON = 10;
  const XP_PER_QUIZ = 50;

  // Local-date key (YYYY-MM-DD) for streak math. Local time on purpose
  // so "did I do my lesson today?" matches the user's wall clock.
  function dayKey(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // --- Storage keys ------------------------------------------------------
  const KEY = "expresate_progress_v1";
  const MIGRATION_FLAG = "expresate_migration_v1_done";
  const OLD_LESSON_KEY = "ynoel_english_progress_v1"; // used by old app.js
  const OLD_COURSE_KEY = "ynoel_course_progress_v1"; // used by old curso.js

  // Map legacy IDs to canonical IDs during migration.
  // (Keep this minimal — only IDs that actually changed.)
  const ID_ALIASES = {
    "lesson-000": "lesson-000-alphabet",
    "template-001": "lesson-001-pronombres",
    "template-002": "lesson-002-preguntas",
    "template-003": "lesson-003-negaciones"
  };
  const canonId = (id) => ID_ALIASES[id] || id;

  // --- Internal helpers --------------------------------------------------
  function readRaw() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY));
      if (parsed && typeof parsed === "object") return parsed;
    } catch (_) {}
    return null;
  }

  function emptyState() {
    return { schemaVersion: 1, lessons: {}, quizzes: {} };
  }

  function writeRaw(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.error("[Progress] write failed:", err);
    }
    emit("change", state);
  }

  function ensureShape(state) {
    if (!state || typeof state !== "object") return emptyState();
    state.schemaVersion = 1;
    state.lessons = state.lessons && typeof state.lessons === "object" ? state.lessons : {};
    state.quizzes = state.quizzes && typeof state.quizzes === "object" ? state.quizzes : {};
    return state;
  }

  function load() {
    return ensureShape(readRaw());
  }

  // Move any stray top-level keys (legacy "flat" writes by old inline
  // scripts that did things like state["lesson-000-alphabet"] = true)
  // into the proper `lessons` / `quizzes` buckets. Mutates `state`.
  function normalizeStrayKeys(state) {
    Object.keys(state).forEach((k) => {
      if (k === "schemaVersion" || k === "lessons" || k === "quizzes") return;
      const v = state[k];
      const cid = canonId(k);
      const ts = (v && typeof v === "object" && v.ts) || Date.now();

      if (cid.startsWith("quiz-")) {
        const passed = v === true || (v && (v.passed === true));
        if (passed && (!state.quizzes[cid] || !state.quizzes[cid].passed)) {
          state.quizzes[cid] = { passed: true, score: null, total: null, ts };
        }
      } else {
        const done = v === true || (v && (v.done === true || v.completed === true));
        if (done && (!state.lessons[cid] || !state.lessons[cid].done)) {
          state.lessons[cid] = { done: true, ts };
        }
      }
      delete state[k];
    });
  }

  // --- Migration (runs at most once) -------------------------------------
  function migrateOnce() {
    if (localStorage.getItem(MIGRATION_FLAG) === "1") return;

    const merged = load();

    // 0) Clean up any stray top-level keys that earlier inline scripts
    //    wrote directly into the new storage key with a flat shape.
    normalizeStrayKeys(merged);

    // 1) Pull lesson completions from the old "ynoel_english_progress_v1".
    try {
      const oldLessons = JSON.parse(localStorage.getItem(OLD_LESSON_KEY)) || {};
      Object.keys(oldLessons).forEach((rawId) => {
        const entry = oldLessons[rawId];
        if (!entry) return;
        const id = canonId(rawId);
        const wasDone = !!entry.completed;
        if (!wasDone) return;
        const existing = merged.lessons[id];
        if (!existing || !existing.done) {
          merged.lessons[id] = { done: true, ts: entry.ts || Date.now() };
        }
      });
    } catch (_) {}

    // 2) Pull lesson + quiz data from the old "ynoel_course_progress_v1".
    try {
      const oldCourse = JSON.parse(localStorage.getItem(OLD_COURSE_KEY)) || {};
      Object.keys(oldCourse).forEach((rawId) => {
        const entry = oldCourse[rawId];
        if (!entry) return;
        const id = canonId(rawId);
        if (id.startsWith("quiz-")) {
          if (entry.passed) {
            const existing = merged.quizzes[id];
            if (!existing || !existing.passed) {
              merged.quizzes[id] = {
                passed: true,
                score: entry.score ?? null,
                total: entry.total ?? null,
                ts: entry.ts || Date.now()
              };
            }
          }
        } else {
          if (entry.done) {
            const existing = merged.lessons[id];
            if (!existing || !existing.done) {
              merged.lessons[id] = { done: true, ts: entry.ts || Date.now() };
            }
          }
        }
      });
    } catch (_) {}

    writeRaw(merged);
    try {
      localStorage.setItem(MIGRATION_FLAG, "1");
    } catch (_) {}
  }

  // --- Event hub ---------------------------------------------------------
  const listeners = { change: new Set() };
  function on(event, cb) {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(cb);
    return () => listeners[event].delete(cb);
  }
  function emit(event, payload) {
    const subs = listeners[event];
    if (!subs) return;
    subs.forEach((cb) => {
      try { cb(payload); } catch (err) { console.error("[Progress] listener error:", err); }
    });
  }

  // Reflect changes from other tabs as 'change' events too.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) emit("change", load());
  });

  // --- Public API --------------------------------------------------------
  const Progress = {
    // Lessons
    isLessonDone(id) {
      const state = load();
      return !!state.lessons[canonId(id)]?.done;
    },
    setLessonDone(id, done = true) {
      const state = load();
      const cid = canonId(id);
      if (done) {
        state.lessons[cid] = { done: true, ts: Date.now() };
      } else {
        delete state.lessons[cid];
      }
      writeRaw(state);
    },
    getLesson(id) {
      const state = load();
      return state.lessons[canonId(id)] || null;
    },

    // Quizzes
    isQuizPassed(id) {
      const state = load();
      return !!state.quizzes[canonId(id)]?.passed;
    },
    setQuizPassed(id, passed, score, total) {
      const state = load();
      const cid = canonId(id);
      if (passed) {
        state.quizzes[cid] = {
          passed: true,
          score: typeof score === "number" ? score : null,
          total: typeof total === "number" ? total : null,
          ts: Date.now()
        };
      } else {
        // Record the failed attempt so the UI can show a retry hint,
        // but keep `passed: false` so isQuizPassed stays false.
        state.quizzes[cid] = {
          passed: false,
          score: typeof score === "number" ? score : null,
          total: typeof total === "number" ? total : null,
          ts: Date.now()
        };
      }
      writeRaw(state);
    },
    getQuiz(id) {
      const state = load();
      return state.quizzes[canonId(id)] || null;
    },

    // Generic
    reset(id) {
      const state = load();
      const cid = canonId(id);
      delete state.lessons[cid];
      delete state.quizzes[cid];
      writeRaw(state);
    },
    resetAll() {
      writeRaw(emptyState());
    },
    snapshot() {
      // Return a deep-ish copy so callers can't mutate internal state.
      return JSON.parse(JSON.stringify(load()));
    },

    // ---- Gamification helpers ----
    // XP is derived from completions (not stored separately) so the
    // numbers stay in lock-step with the source of truth.
    getXP() {
      const state = load();
      let xp = 0;
      Object.values(state.lessons || {}).forEach((e) => {
        if (e && e.done) xp += XP_PER_LESSON;
      });
      Object.values(state.quizzes || {}).forEach((e) => {
        if (e && e.passed) xp += XP_PER_QUIZ;
      });
      return xp;
    },
    getXPToday() {
      const today = dayKey(Date.now());
      const state = load();
      let xp = 0;
      Object.values(state.lessons || {}).forEach((e) => {
        if (e && e.done && e.ts && dayKey(e.ts) === today) xp += XP_PER_LESSON;
      });
      Object.values(state.quizzes || {}).forEach((e) => {
        if (e && e.passed && e.ts && dayKey(e.ts) === today) xp += XP_PER_QUIZ;
      });
      return xp;
    },
    // Returns a Set<string> of "YYYY-MM-DD" days the user did at least
    // one lesson or quiz. Used for streak math.
    getActiveDays() {
      const state = load();
      const days = new Set();
      const addIf = (entry) => {
        if (entry && entry.ts && (entry.done || entry.passed)) {
          days.add(dayKey(entry.ts));
        }
      };
      Object.values(state.lessons || {}).forEach(addIf);
      Object.values(state.quizzes || {}).forEach(addIf);
      return days;
    },
    isTodayActive() {
      return this.getActiveDays().has(dayKey(Date.now()));
    },
    // Consecutive days ending today. If today is empty but yesterday
    // counted, we still report yesterday's streak (the "grace day"
    // gives users until end of today to maintain it).
    getStreak() {
      const days = this.getActiveDays();
      if (days.size === 0) return 0;
      const DAY_MS = 86400000;
      let cursorTs;
      if (days.has(dayKey(Date.now()))) {
        cursorTs = Date.now();
      } else if (days.has(dayKey(Date.now() - DAY_MS))) {
        cursorTs = Date.now() - DAY_MS;
      } else {
        return 0;
      }
      let streak = 0;
      while (days.has(dayKey(cursorTs))) {
        streak++;
        cursorTs -= DAY_MS;
      }
      return streak;
    },

    // Subscriptions
    on,

    // Useful for debugging in the console
    _canonId: canonId,
    _KEY: KEY
  };

  // Run migration before exposing the API so first reads see the merged state.
  migrateOnce();

  // Expose globally.
  window.Progress = Progress;
})();
