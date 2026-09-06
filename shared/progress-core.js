/* Browser + native progress contract. No storage or UI dependencies. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ExpresateProgressCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const empty = () => ({
    schemaVersion: 2,
    lessons: {},
    quizzes: {},
    activities: {},
  });
  function dayKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  // Existing server completions win conflicts. A device can add a completion,
  // never downgrade one or re-date its reward by replaying an old snapshot.
  function merge(cloud, incoming) {
    const result = { ...empty(), ...cloud };
    for (const kind of ["lessons", "quizzes", "activities"]) {
      result[kind] = { ...(cloud?.[kind] || {}) };
      for (const [id, entry] of Object.entries(incoming?.[kind] || {})) {
        if (!entry || typeof entry !== "object") continue;
        const old = result[kind][id];
        const key = kind === "quizzes" ? "passed" : "done";
        if (kind === "activities") {
          if (!old || Number(entry.ts) > Number(old.ts))
            result[kind][id] = entry;
        } else if (!old || (old[key] !== true && entry[key] === true))
          result[kind][id] = entry;
      }
    }
    return result;
  }
  function complete(state, id, xpReward = 10, now = Date.now()) {
    const delta = empty();
    delta.lessons[id] = { done: true, ts: now, xpReward };
    delta.activities[dayKey(now)] = { source: "lesson", id, ts: now };
    return merge(state, delta);
  }
  function stats(state, now = Date.now()) {
    let xp = 0,
      completed = 0;
    const days = new Set();
    for (const entry of Object.values(state?.lessons || {})) {
      if (!entry?.done) continue;
      completed++;
      xp += Number.isFinite(entry.xpReward)
        ? Math.max(0, Math.min(1000, entry.xpReward))
        : 10;
      if (entry.ts) days.add(dayKey(entry.ts));
    }
    for (const entry of Object.values(state?.quizzes || {})) {
      if (entry?.passed) {
        xp += 50;
        if (entry.ts) days.add(dayKey(entry.ts));
      }
    }
    for (const entry of Object.values(state?.activities || {}))
      if (entry?.ts) days.add(dayKey(entry.ts));
    const cursor = new Date(now);
    if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (days.has(dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { xp, completed, streak };
  }
  // Compare-and-swap prevents simultaneous devices from overwriting each other.
  // Uses the existing user_progress table + RLS, without a database migration.
  async function sync(client, userId, incoming, isCurrent = () => true) {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (!isCurrent())
        throw new Error("Account changed during synchronization");
      const { data: row, error } = await client
        .from("user_progress")
        .select("progress, updated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!isCurrent())
        throw new Error("Account changed during synchronization");
      const next = merge(row?.progress, incoming);
      if (row && JSON.stringify(next) === JSON.stringify(row.progress))
        return next;
      const timestamp = Math.max(
        Date.now(),
        (Date.parse(row?.updated_at) || 0) + 1,
      );
      const payload = {
        user_id: userId,
        progress: next,
        updated_at: new Date(timestamp).toISOString(),
      };
      if (!row) {
        const result = await client
          .from("user_progress")
          .insert(payload)
          .select("user_id");
        if (result.error?.code === "23505") continue;
        if (result.error) throw result.error;
        if (!result.data?.length)
          throw new Error("Progress insert was not confirmed");
        return next;
      }
      // A server timestamp is the optimistic concurrency token.
      let query = client
        .from("user_progress")
        .update(payload)
        .eq("user_id", userId);
      query =
        row.updated_at == null
          ? query.is("updated_at", null)
          : query.eq("updated_at", row.updated_at);
      const result = await query.select("user_id");
      if (result.error) throw result.error;
      if (result.data?.length) return next;
    }
    throw new Error("Progress changed on another device. Please retry.");
  }
  return { empty, dayKey, merge, complete, stats, sync };
});
