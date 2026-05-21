/* sync.js — Supabase ↔ localStorage progress bridge for Exprésate
   Load after: progress.js and access.js
   Responsibilities:
   1. On login: download cloud progress, merge with local (newest ts wins), save locally.
   2. Guest migration: if local progress exists when user logs in, upload it.
   3. On progress change (when logged in): push snapshot to Supabase (debounced 2s).
   All failures are silent — localStorage is always the UI source of truth.
*/
(function () {
  "use strict";

  const SYNC_DEBOUNCE_MS = 2000;
  let _syncTimer = null;
  let _lastSyncedUserId = null;

  async function downloadAndMerge(userId) {
    const sb = window.supabaseClient;
    if (!sb || !userId) return;
    try {
      const { data, error } = await sb
        .from("user_progress")
        .select("progress")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows
        console.warn("[Sync] download error:", error.message);
        return;
      }

      const cloud = data?.progress;
      if (!cloud) return; // nothing in cloud yet

      const local = Progress.snapshot();

      // Merge: for each lesson/quiz, keep whichever has the newer timestamp
      const merged = {
        schemaVersion: 1,
        lessons: { ...cloud.lessons },
        quizzes: { ...cloud.quizzes }
      };

      Object.entries(local.lessons || {}).forEach(([id, entry]) => {
        const cloudEntry = merged.lessons[id];
        if (!cloudEntry || (entry.ts && cloudEntry.ts && entry.ts > cloudEntry.ts)) {
          merged.lessons[id] = entry;
        }
      });

      Object.entries(local.quizzes || {}).forEach(([id, entry]) => {
        const cloudEntry = merged.quizzes[id];
        if (!cloudEntry || (entry.ts && cloudEntry.ts && entry.ts > cloudEntry.ts)) {
          merged.quizzes[id] = entry;
        }
      });

      // Write merged result to localStorage (Progress will re-read it)
      try {
        localStorage.setItem("expresate_progress_v1", JSON.stringify(merged));
      } catch (e) {}

    } catch (e) {
      console.warn("[Sync] merge failed:", e);
    }
  }

  async function uploadProgress(userId) {
    const sb = window.supabaseClient;
    if (!sb || !userId) return;
    try {
      const snapshot = Progress.snapshot();
      await sb.from("user_progress").upsert({
        user_id: userId,
        progress: snapshot,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    } catch (e) {
      console.warn("[Sync] upload error:", e);
    }
  }

  function scheduleUpload(userId) {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => uploadProgress(userId), SYNC_DEBOUNCE_MS);
  }

  async function onLogin(userId) {
    if (_lastSyncedUserId === userId) return;
    _lastSyncedUserId = userId;

    // 1. Download + merge cloud progress into local
    await downloadAndMerge(userId);

    // 2. Upload the merged result back (handles guest migration too)
    await uploadProgress(userId);

    // 3. Watch for future local changes and push them
    Progress.on("change", () => {
      if (Access.isLoggedIn()) scheduleUpload(userId);
    });
  }

  function onLogout() {
    _lastSyncedUserId = null;
    clearTimeout(_syncTimer);
  }

  // Wire up to auth state
  if (window.Access) {
    Access.onAuthChange((session) => {
      if (session?.user) {
        onLogin(session.user.id);
      } else {
        onLogout();
      }
    });

    // Handle already-logged-in state on page load
    const user = Access.getUser();
    if (user) onLogin(user.id);
  }
})();
