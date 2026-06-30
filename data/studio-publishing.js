/* Exprésate Studio Supabase publishing adapter. No secrets live here. */
(function () {
  "use strict";

  const lessonStore = window.ExpresateStudioLessons;
  const sb = window.supabaseClient;
  const SYNC_KEY = "expresate_studio_publish_state_v1";

  function assertReady() {
    if (!sb?.from || !lessonStore) throw new Error("Supabase publishing is not available.");
  }

  function cloudRowToLesson(row) {
    const orderedBlocks = [...(row?.studio_lesson_blocks || [])]
      .sort((a, b) => Number(a.block_order) - Number(b.block_order))
      .map((entry) => ({ ...(entry.block_data || {}), type: entry.block_type }));
    return lessonStore.normalizeLesson({
      id: row.id,
      title: row.title,
      slug: row.slug,
      module: row.module,
      level: row.level,
      premium: row.premium,
      xpReward: row.xp_reward,
      description: row.description,
      status: row.status,
      tags: row.tags,
      blocks: orderedBlocks,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  function resolvedVocabulary(block, vocabularyItems) {
    if (block.type !== "vocabulary") return block;
    const ids = new Set(block.selectedVocabularyIds || []);
    return {
      ...block,
      resolvedVocabularyItems: (vocabularyItems || [])
        .filter((item) => ids.has(item.id))
        .map((item) => ({
          id: String(item.id || ""),
          english: String(item.english || ""),
          spanish: String(item.spanish || ""),
          pronunciation: String(item.pronunciation || ""),
          imagePath: String(item.imagePath || ""),
          audioPath: String(item.audioPath || "")
        }))
    };
  }

  function publishingPayload(lesson, vocabularyItems, status) {
    const normalized = lessonStore.normalizeLesson({ ...lesson, status: status || lesson.status });
    return {
      lesson: {
        slug: normalized.slug,
        title: normalized.title,
        module: normalized.module,
        level: normalized.level,
        premium: normalized.premium,
        xp_reward: normalized.xpReward,
        description: normalized.description,
        status: status || normalized.status,
        tags: normalized.tags
      },
      blocks: normalized.blocks.map((block, index) => ({
        block_order: index,
        block_type: block.type,
        block_data: resolvedVocabulary(block, vocabularyItems)
      }))
    };
  }

  async function fetchRows(query) {
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(cloudRowToLesson);
  }

  async function listPublishedLessons() {
    assertReady();
    return fetchRows(sb
      .from("studio_lessons")
      .select("*, studio_lesson_blocks(*)")
      .eq("status", "published")
      .order("updated_at", { ascending: false }));
  }

  async function getPublishedLesson(slug) {
    assertReady();
    const { data, error } = await sb
      .from("studio_lessons")
      .select("*, studio_lesson_blocks(*)")
      .eq("slug", lessonStore.cleanSlug(slug, ""))
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return data ? cloudRowToLesson(data) : null;
  }

  async function listAdminLessons() {
    assertReady();
    return fetchRows(sb
      .from("studio_lessons")
      .select("*, studio_lesson_blocks(*)")
      .order("updated_at", { ascending: false }));
  }

  async function publishLesson(lesson, vocabularyItems, status) {
    assertReady();
    const payload = publishingPayload(lesson, vocabularyItems, status || "published");
    const { data, error } = await sb.rpc("publish_studio_lesson", {
      p_lesson: payload.lesson,
      p_blocks: payload.blocks
    });
    if (error) throw error;
    return data;
  }

  async function unpublishLesson(slug) {
    assertReady();
    const { data, error } = await sb
      .from("studio_lessons")
      .update({ status: "draft" })
      .eq("slug", lessonStore.cleanSlug(slug, ""))
      .select("id, slug, status, updated_at")
      .single();
    if (error) throw error;
    return data;
  }

  function loadSyncState() {
    try { return JSON.parse(localStorage.getItem(SYNC_KEY) || "{}"); }
    catch { return {}; }
  }

  function saveSyncRecord(localId, record) {
    const state = loadSyncState();
    state[localId] = { ...record, syncedAt: new Date().toISOString() };
    localStorage.setItem(SYNC_KEY, JSON.stringify(state));
    return state[localId];
  }

  function statusFor(lesson, cloudLesson) {
    if (!cloudLesson) return "local-only";
    const state = loadSyncState()[lesson.id];
    const localChanged = state?.localUpdatedAt
      && new Date(lesson.updatedAt).getTime() > new Date(state.localUpdatedAt).getTime();
    if (localChanged) return "local-newer";
    return cloudLesson.status === "published" ? "published" : "cloud-draft";
  }

  window.ExpresateStudioPublishing = Object.freeze({
    SYNC_KEY,
    available: Boolean(sb?.from && lessonStore),
    cloudRowToLesson,
    publishingPayload,
    listPublishedLessons,
    getPublishedLesson,
    listAdminLessons,
    publishLesson,
    unpublishLesson,
    loadSyncState,
    saveSyncRecord,
    statusFor
  });
})();
