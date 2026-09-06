const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const core = require("../shared/progress-core");

function fakeClient(initial, conflict) {
  let row = initial,
    writes = 0;
  return {
    get row() {
      return row;
    },
    get writes() {
      return writes;
    },
    from() {
      let method = "read",
        payload,
        filters = {};
      const query = {
        select() {
          return query;
        },
        eq(k, v) {
          filters[k] = v;
          return query;
        },
        is(k, v) {
          filters[k] = v;
          return query;
        },
        update(v) {
          method = "update";
          payload = v;
          return query;
        },
        insert(v) {
          method = "insert";
          payload = v;
          return query;
        },
        maybeSingle: async () => ({ data: row ? structuredClone(row) : null }),
        then(resolve, reject) {
          return Promise.resolve()
            .then(() => {
              if (conflict) {
                row = conflict(row);
                conflict = null;
              }
              if (method === "insert" && row)
                return { error: { code: "23505" } };
              if (method === "update" && filters.updated_at !== row.updated_at)
                return { data: [] };
              row = structuredClone(payload);
              writes++;
              return { data: [{ user_id: payload.user_id }] };
            })
            .then(resolve, reject);
        },
      };
      return query;
    },
  };
}
test("mobile completions produce exactly the same XP and streak as the web", () => {
  const state = core.complete(core.empty(), "lesson-000-alphabet", 10);
  const storage = new Map();
  const context = {
    window: { addEventListener() {}, ExpresateProgressCore: core },
    localStorage: {
      getItem: (k) => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, v),
    },
    console,
  };
  vm.runInNewContext(fs.readFileSync("progress.js", "utf8"), context);
  context.window.Progress.replace(state);
  assert.equal(context.window.Progress.getXP(), 10);
  assert.equal(context.window.Progress.getStreak(), 1);
  assert.equal(context.window.Progress.isLessonDone("lesson-000"), true);
});
test("replaying or stale device data cannot change a server reward or remove a completion", () => {
  const cloud = core.complete(core.empty(), "lesson-000-alphabet", 10, 1000);
  const replay = core.complete(core.empty(), "lesson-000-alphabet", 200, 2000);
  assert.deepEqual(core.merge(cloud, replay).lessons, cloud.lessons);
  assert.equal(core.stats(core.merge(cloud, core.empty())).xp, 10);
});
test("concurrent update retries against the new cloud state", async () => {
  const initial = {
    progress: core.complete(core.empty(), "existing"),
    updated_at: "2026-09-01T00:00:00Z",
  };
  const client = fakeClient(initial, (row) => ({
    ...row,
    progress: core.complete(row.progress, "other-device"),
    updated_at: "2026-09-02T00:00:00Z",
  }));
  const result = await core.sync(
    client,
    "user",
    core.complete(core.empty(), "mobile"),
  );
  assert.deepEqual(Object.keys(result.lessons).sort(), [
    "existing",
    "mobile",
    "other-device",
  ]);
  assert.equal(client.writes, 1);
});
test("concurrent creation retries without replacing another device", async () => {
  const client = fakeClient(null, () => ({
    progress: core.complete(core.empty(), "web"),
    updated_at: "2026-09-01T00:00:00Z",
  }));
  const result = await core.sync(
    client,
    "user",
    core.complete(core.empty(), "mobile"),
  );
  assert.equal(core.stats(result).xp, 20);
});
test("account switches prevent progress writes", async () => {
  const client = fakeClient(null);
  await assert.rejects(
    core.sync(client, "old-user", core.empty(), () => false),
    /Account changed/,
  );
  assert.equal(client.writes, 0);
});
test("failed reads never become overwriting writes", async () => {
  const client = {
    from: () => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({ error: new Error("offline") }),
    }),
  };
  await assert.rejects(core.sync(client, "user", core.empty()), /offline/);
});
test("repeated completed lesson adds no XP and today maintains the streak", () => {
  let state = core.complete(
    core.empty(),
    "lesson-000-alphabet",
    10,
    new Date(2026, 8, 5, 12).getTime(),
  );
  state = core.complete(
    state,
    "lesson-000-alphabet",
    10,
    new Date(2026, 8, 6, 12).getTime(),
  );
  assert.deepEqual(core.stats(state, new Date(2026, 8, 6, 12).getTime()), {
    xp: 10,
    completed: 1,
    streak: 2,
  });
});
