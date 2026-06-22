#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY_PATH = path.join(ROOT, "assets", "audio", "audio-inventory.json");
const MANIFEST_PATH = path.join(ROOT, "assets", "audio", "audio-manifest.json");
const API_BASE = "https://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_MODEL = "eleven_multilingual_v2";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";
const MAX_RETRIES = 4;

function loadEnvFile() {
  const candidates = [path.join(ROOT, ".env"), path.join(ROOT, ".env", "keys.txt")];
  const envPath = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!envPath) return;

  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[name]) process.env[name] = value;
  }
}

function parseArgs(argv) {
  const options = { force: false, manifestOnly: false, ids: [], limit: Infinity };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--force") options.force = true;
    else if (arg === "--manifest-only") options.manifestOnly = true;
    else if (arg === "--id") options.ids.push(argv[++index]);
    else if (arg === "--limit") options.limit = Number(argv[++index]);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(options.limit) || options.limit < 1) options.limit = Infinity;
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/generate-elevenlabs-audio.js [options]

Options:
  --id <inventory-id>  Generate one inventory item (repeatable)
  --limit <number>     Limit selected items for a controlled batch
  --force              Regenerate files that already exist
  --manifest-only      Rebuild audio-manifest.json without API calls
  --help               Show this help`);
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function safeDestination(relativePath) {
  const normalized = String(relativePath || "").replace(/\\/g, "/");
  if (!/^assets\/audio\/(letters|words|phrases|lesson-intros)\/[a-z0-9]+(?:-[a-z0-9]+)*\.mp3$/.test(normalized)) {
    throw new Error(`Unsafe inventory destination: ${relativePath}`);
  }
  const absolute = path.resolve(ROOT, normalized);
  const audioRoot = path.resolve(ROOT, "assets", "audio") + path.sep;
  if (!absolute.startsWith(audioRoot)) throw new Error(`Destination escapes audio directory: ${relativePath}`);
  return absolute;
}

function loadInventory() {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf8"));
  if (!Array.isArray(inventory.items)) throw new Error("Audio inventory has no items array.");
  for (const item of inventory.items) {
    safeDestination(item.destination);
    if (item.generationText !== undefined && (typeof item.generationText !== "string" || !item.generationText.trim())) {
      throw new Error(`Invalid generationText for inventory item: ${item.id}`);
    }
  }
  return inventory;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  return Math.min(12000, 750 * (2 ** attempt)) + Math.floor(Math.random() * 250);
}

function looksLikeMp3(buffer) {
  if (!buffer || buffer.length < 128) return false;
  return buffer.subarray(0, 3).toString("ascii") === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
}

async function requestAudio(item, credentials) {
  const url = `${API_BASE}/${encodeURIComponent(credentials.voiceId)}?output_format=${encodeURIComponent(credentials.outputFormat)}`;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": credentials.apiKey
        },
        body: JSON.stringify({
          // generationText may add silent punctuation or other pronunciation
          // safeguards. Display text and manifest lookup remain unchanged.
          text: item.generationText || item.text,
          model_id: credentials.modelId,
          language_code: String(item.language || "en-US").split("-")[0].toLowerCase(),
          voice_settings: {
            stability: 0.56,
            similarity_boost: 0.78,
            style: 0.12,
            use_speaker_boost: true
          }
        })
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        if (!looksLikeMp3(buffer)) throw new Error("ElevenLabs returned data that is not a valid MP3 stream.");
        return buffer;
      }

      const retryable = response.status === 429 || response.status >= 500;
      const detail = (await response.text()).slice(0, 300).replace(/\s+/g, " ");
      lastError = new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
      if (!retryable || attempt === MAX_RETRIES) break;
      await sleep(retryDelay(response, attempt));
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) break;
      await sleep(retryDelay(null, attempt));
    }
  }

  throw lastError || new Error("Unknown ElevenLabs request failure.");
}

function buildManifest(inventory) {
  const entries = {};
  const byText = {};
  const preservedCategories = new Set(inventory.preserveOriginalCategories || []);

  for (const item of inventory.items) {
    if (preservedCategories.has(item.category)) continue;
    const absolute = safeDestination(item.destination);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).size < 128) continue;
    entries[item.id] = {
      text: item.text,
      language: item.language,
      path: item.destination
    };
    byText[normalizeText(item.text)] = item.destination;
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    entryCount: Object.keys(entries).length,
    entries,
    byText
  };
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

async function main() {
  loadEnvFile();
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();

  const inventory = loadInventory();
  if (options.manifestOnly) {
    const manifest = buildManifest(inventory);
    console.log(`Audio manifest rebuilt with ${manifest.entryCount} existing MP3 files.`);
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    throw new Error("ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set in the environment or local .env file.");
  }

  const requestedIds = new Set(options.ids.filter(Boolean));
  const unknownIds = [...requestedIds].filter((id) => !inventory.items.some((item) => item.id === id));
  if (unknownIds.length) throw new Error(`Unknown inventory ID(s): ${unknownIds.join(", ")}`);

  let selected = requestedIds.size
    ? inventory.items.filter((item) => requestedIds.has(item.id))
    : inventory.items.slice();
  const preservedCategories = new Set(inventory.preserveOriginalCategories || []);
  const preservedItems = selected.filter((item) => preservedCategories.has(item.category));
  if (preservedItems.length) {
    console.log(`Preserving ${preservedItems.length} original audio item(s): ${preservedItems.map((item) => item.id).join(", ")}`);
  }
  selected = selected.filter((item) => !preservedCategories.has(item.category));
  selected = selected.slice(0, options.limit);

  const credentials = {
    apiKey,
    voiceId,
    modelId: process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL,
    outputFormat: process.env.ELEVENLABS_OUTPUT_FORMAT || DEFAULT_OUTPUT_FORMAT
  };
  const summary = { generated: 0, skipped: 0, failed: 0, failures: [] };

  for (let index = 0; index < selected.length; index += 1) {
    const item = selected[index];
    const destination = safeDestination(item.destination);
    const label = `[${index + 1}/${selected.length}] ${item.id}`;

    if (!options.force && fs.existsSync(destination) && fs.statSync(destination).size >= 128) {
      summary.skipped += 1;
      console.log(`${label} skipped`);
      continue;
    }

    try {
      const audio = await requestAudio(item, credentials);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      const temporary = `${destination}.part`;
      fs.writeFileSync(temporary, audio);
      fs.renameSync(temporary, destination);
      summary.generated += 1;
      console.log(`${label} generated`);
    } catch (error) {
      summary.failed += 1;
      summary.failures.push({ id: item.id, error: error.message });
      console.error(`${label} failed: ${error.message}`);
    }
  }

  const manifest = buildManifest(inventory);
  console.log("\nGeneration summary");
  console.log(`Generated: ${summary.generated}`);
  console.log(`Skipped:   ${summary.skipped}`);
  console.log(`Failed:    ${summary.failed}`);
  console.log(`Manifest:  ${manifest.entryCount} entries`);
  if (summary.failures.length) {
    console.log("Failed IDs:");
    for (const failure of summary.failures) console.log(`- ${failure.id}: ${failure.error}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Audio generation stopped: ${error.message}`);
  process.exitCode = 1;
});
