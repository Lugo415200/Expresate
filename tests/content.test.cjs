const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const content = require("../shared/lesson000");
test("all 26 shared alphabet examples and audio resolve locally", () => {
  assert.equal(Object.keys(content.letters).length, 26);
  for (const [letter, item] of Object.entries(content.letters)) {
    assert.ok(fs.statSync(item.imagePath).size > 0);
    assert.ok(fs.statSync(`audio/alphabet/${letter}.mp3`).size > 0);
  }
});
test("web Studio adapter keeps the original shared alphabet contract", () => {
  const context = {
    window: { ExpresateLesson000: content },
    localStorage: { getItem: () => null },
  };
  vm.runInNewContext(
    fs.readFileSync("data/lesson000-letters.js", "utf8"),
    context,
  );
  assert.equal(
    context.window.ExpresateLesson000Letters.getEffectiveLetters().a.word,
    "Apple",
  );
  assert.equal(
    context.window.ExpresateLesson000Letters.getEffectiveLetters().z.word,
    "Zebra",
  );
});
test("every web route loads shared dependencies before consumers", () => {
  for (const file of fs.readdirSync(".").filter((x) => x.endsWith(".html"))) {
    const text = fs.readFileSync(file, "utf8");
    for (const [consumer, dependency] of [
      ["progress.js", "shared/progress-core.js"],
      ["data/lesson000-letters.js", "shared/lesson000.js"],
    ]) {
      const index = text.indexOf(`src="${consumer}"`);
      if (index < 0) continue;
      assert.ok(
        text.indexOf(`src="${dependency}"`) >= 0 &&
          text.indexOf(`src="${dependency}"`) < index,
        file,
      );
    }
  }
});
