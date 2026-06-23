/* sync.js — Supabase ↔ scoped local progress bridge for Exprésate
   Load after: progress.js and access.js

   Guest progress and each authenticated user's progress use separate keys.
   Guest data is never imported into an account automatically. Returning
   users merge only their own user-scoped cache with their Supabase row.
*/
(function () {
  "use strict";

  const SYNC_DEBOUNCE_MS = 2000;
  let syncTimer = null;
  let activeUserId = null;
  let switchVersion = 0;
  let suppressUploads = false;

  function emptyState() {
    return { schemaVersion: 2, lessons: {}, quizzes: {}, activities: {} };
  }

  function mergeEntries(cloudEntries, localEntries) {
    const merged = { ...(cloudEntries || {}) };
    Object.entries(localEntries || {}).forEach(([id, localEntry]) => {
      const cloudEntry = merged[id];
      const localTs = Number(localEntry?.ts) || 0;
      const cloudTs = Number(cloudEntry?.ts) || 0;
      if (!cloudEntry || localTs > cloudTs) merged[id] = localEntry;
    });
    return merged;
  }

  function mergeProgress(cloud, local) {
    return {
      schemaVersion: 2,
      lessons: mergeEntries(cloud?.lessons, local?.lessons),
      quizzes: mergeEntries(cloud?.quizzes, local?.quizzes),
      activities: mergeEntries(cloud?.activities, local?.activities)
    };
  }

  async function downloadProgress(userId) {
    const sb = window.supabaseClient;
    if (!sb || !userId) return { ok: false, found: false, state: null };
    try {
      const { data, error } = await sb
        .from("user_progress")
        .select("progress")
        .eq("user_id", userId)
        .single();

      if (error?.code === "PGRST116") return { ok: true, found: false, state: null };
      if (error) {
        console.warn("[Sync] download error:", error.message);
        return { ok: false, found: false, state: null };
      }
      return { ok: true, found: !!data?.progress, state: data?.progress || null };
    } catch (error) {
      console.warn("[Sync] download failed:", error?.message || error);
      return { ok: false, found: false, state: null };
    }
  }

  async function uploadProgress(userId) {
    const sb = window.supabaseClient;
    if (!sb || !userId || userId !== activeUserId) return;
    try {
      const { error } = await sb.from("user_progress").upsert({
        user_id: userId,
        progress: Progress.snapshot(),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      if (error) console.warn("[Sync] upload error:", error.message);
    } catch (error) {
      console.warn("[Sync] upload failed:", error?.message || error);
    }
  }

  function scheduleUpload(userId) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      uploadProgress(userId);
    }, SYNC_DEBOUNCE_MS);
  }

  async function useSession(session) {
    const version = ++switchVersion;
    clearTimeout(syncTimer);
    syncTimer = null;

    const userId = session?.user?.id || null;
    suppressUploads = true;

    if (!userId) {
      activeUserId = null;
      Progress.useGuestScope();
      suppressUploads = false;
      return;
    }

    activeUserId = userId;
    Progress.useUserScope(userId);
    const hadUserCache = Progress.hasStoredState();
    const local = Progress.snapshot();
    const cloudResult = await downloadProgress(userId);

    if (version !== switchVersion || activeUserId !== userId) return;

    if (!cloudResult.ok) {
      // Preserve this user's own cache when Supabase is temporarily unavailable.
      suppressUploads = false;
      return;
    }

    const nextState = cloudResult.found
      ? mergeProgress(cloudResult.state, local)
      : (hadUserCache ? local : emptyState());
    Progress.replace(nextState);
    suppressUploads = false;

    // Create a clean cloud row for new users or persist a same-user merge.
    await uploadProgress(userId);
  }

  Progress.on("change", () => {
    if (suppressUploads) return;
    const userId = window.Access?.getUser?.()?.id || null;
    if (userId && userId === activeUserId) scheduleUpload(userId);
  });

  if (window.Access) {
    Access.onAuthChange((session) => useSession(session));
    Access.ready().then(() => useSession(Access.getSession()));
  }

  window.ExpresateProgress = {
    debugState() {
      return {
        activeUserId,
        syncPending: !!syncTimer,
        progress: Progress.debugState()
      };
    }
  };
})();
