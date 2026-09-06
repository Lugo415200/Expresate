/* sync.js — Supabase ↔ scoped local progress bridge for Exprésate
   Load after: progress.js and access.js

   Guest progress and each authenticated user's progress use separate keys.
   On successful sign-in, meaningful guest progress is safely merged into the
   user's existing scoped state and then persisted through this same bridge.
*/
(function () {
  "use strict";

  const SYNC_DEBOUNCE_MS = 2000;
  let syncTimer = null;
  let activeUserId = null;
  let switchVersion = 0;
  let suppressUploads = false;
  const GUEST_MIGRATION_CLAIM_KEY = "expresate_progress_v2:guest-migration-claim";

  function emptyState() {
    return { schemaVersion: 2, lessons: {}, quizzes: {}, activities: {} };
  }

  function newerEntry(first, second) {
    return (Number(second?.ts) || 0) > (Number(first?.ts) || 0) ? second : first;
  }

  function mergeCompletionEntries(cloudEntries, localEntries, kind) {
    const merged = { ...(cloudEntries || {}) };
    Object.entries(localEntries || {}).forEach(([id, localEntry]) => {
      const cloudEntry = merged[id];
      const completionKey = kind === "quizzes" ? "passed" : "done";
      if (!cloudEntry || localEntry?.[completionKey] === true && cloudEntry?.[completionKey] !== true) {
        merged[id] = localEntry;
      } else if (cloudEntry?.[completionKey] === true && localEntry?.[completionKey] !== true) {
        merged[id] = cloudEntry;
      } else {
        merged[id] = newerEntry(cloudEntry, localEntry);
      }
    });
    return merged;
  }

  function mergeEntries(cloudEntries, localEntries) {
    const merged = { ...(cloudEntries || {}) };
    Object.entries(localEntries || {}).forEach(([id, localEntry]) => {
      merged[id] = merged[id] ? newerEntry(merged[id], localEntry) : localEntry;
    });
    return merged;
  }

  function mergeProgress(cloud, local) {
    if (window.ExpresateProgressCore) return window.ExpresateProgressCore.merge(cloud, local);
    return {
      schemaVersion: 2,
      lessons: mergeCompletionEntries(cloud?.lessons, local?.lessons, "lessons"),
      quizzes: mergeCompletionEntries(cloud?.quizzes, local?.quizzes, "quizzes"),
      activities: mergeEntries(cloud?.activities, local?.activities)
    };
  }

  function hasMeaningfulProgress(state) {
    return Object.values(state?.lessons || {}).some((entry) => entry?.done === true)
      || Object.values(state?.quizzes || {}).some((entry) => entry?.passed === true)
      || Object.keys(state?.activities || {}).length > 0;
  }

  function guestFingerprint(state) {
    try { return JSON.stringify(state); } catch (_) { return ""; }
  }

  function getGuestMigrationClaim() {
    try { return JSON.parse(localStorage.getItem(GUEST_MIGRATION_CLAIM_KEY) || "null"); } catch (_) { return null; }
  }

  function claimGuestMigration(userId, fingerprint) {
    const claim = getGuestMigrationClaim();
    if (claim && claim.userId !== userId) return false;
    try { localStorage.setItem(GUEST_MIGRATION_CLAIM_KEY, JSON.stringify({ userId, fingerprint })); } catch (_) {}
    return true;
  }

  function finishGuestMigration() {
    Progress.clearGuestState();
    try { localStorage.removeItem(GUEST_MIGRATION_CLAIM_KEY); } catch (_) {}
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
    if (!sb || !userId || userId !== activeUserId) return false;
    try {
      if (window.ExpresateProgressCore) {
        const version = switchVersion;
        const snapshot = Progress.snapshot();
        const next = await window.ExpresateProgressCore.sync(sb, userId, snapshot,
          () => activeUserId === userId && switchVersion === version);
        if (activeUserId !== userId || switchVersion !== version) return false;
        suppressUploads = true;
        // Keep completions made while this request was in flight.
        Progress.replace(mergeProgress(next, Progress.snapshot()));
        suppressUploads = false;
        return true;
      }
      const { error } = await sb.from("user_progress").upsert({
        user_id: userId,
        progress: Progress.snapshot(),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      if (error) {
        console.warn("[Sync] upload error:", error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.warn("[Sync] upload failed:", error?.message || error);
      return false;
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

    const guest = Progress.getGuestSnapshot();
    const guestHasProgress = hasMeaningfulProgress(guest);
    const guestFingerprintValue = guestHasProgress ? guestFingerprint(guest) : "";
    const canMigrateGuest = guestHasProgress && claimGuestMigration(userId, guestFingerprintValue);

    activeUserId = userId;
    Progress.useUserScope(userId);
    const hadUserCache = Progress.hasStoredState();
    const local = Progress.snapshot();
    const cloudResult = await downloadProgress(userId);

    if (version !== switchVersion || activeUserId !== userId) return;

    if (!cloudResult.ok) {
      // Preserve this user's own cache when Supabase is temporarily unavailable.
      // Guest data remains intact so it can be migrated after a verified sync.
      suppressUploads = false;
      return;
    }

    const accountState = cloudResult.found
      ? mergeProgress(cloudResult.state, local)
      : (hadUserCache ? local : emptyState());
    const nextState = canMigrateGuest ? mergeProgress(accountState, guest) : accountState;
    Progress.replace(nextState);
    suppressUploads = false;

    // Create a clean cloud row for new users or persist a same-user merge.
    const uploaded = await uploadProgress(userId);
    if (uploaded && canMigrateGuest && version === switchVersion && activeUserId === userId) {
      finishGuestMigration();
    }
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

  // Refresh a still-open website after completing a lesson on a phone.
  window.addEventListener("focus", () => {
    if (activeUserId && !syncTimer) useSession(Access.getSession());
  });

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
