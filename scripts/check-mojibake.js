#!/usr/bin/env node
"use strict";

const { execFileSync } = require("child_process");
const { TextDecoder } = require("util");

const UTF8 = new TextDecoder("utf-8", { fatal: true });
const MOJIBAKE_MARKERS = [
  [/\uFFFD/u, "Unicode replacement character"],
  [/\u00C2(?:[\u0080-\u00BF])?/u, "mis-decoded UTF-8 lead byte (A-circumflex)"],
  [/\u00C3[\u0080-\u00BF]/u, "mis-decoded UTF-8 sequence (A-tilde)"],
  [/\u00E2[\u0080-\u00BF\u2000-\u206F]/u, "mis-decoded UTF-8 sequence"],
];

function stagedFiles() {
  return execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"])
    .toString()
    .split("\0")
    .filter(Boolean);
}

function stagedContent(file) {
  return execFileSync("git", ["show", `:${file}`], { maxBuffer: 16 * 1024 * 1024 });
}

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

let failed = false;

for (const file of stagedFiles()) {
  const bytes = stagedContent(file);
  if (bytes.includes(0)) continue;

  let text;
  try {
    text = UTF8.decode(bytes);
  } catch {
    console.error(`Encoding check failed: ${file} is not valid UTF-8.`);
    failed = true;
    continue;
  }

  for (const [pattern, description] of MOJIBAKE_MARKERS) {
    const match = pattern.exec(text);
    if (!match) continue;
    console.error(`Encoding check failed: ${file}:${lineNumber(text, match.index)} contains ${description}.`);
    failed = true;
  }
}

if (failed) {
  console.error("Commit blocked. Correct the source text as UTF-8 before committing.");
  process.exit(1);
}
