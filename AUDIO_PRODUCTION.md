# Exprésate Audio Production

Exprésate generates ElevenLabs audio during development and serves the resulting MP3 files as static GitHub Pages assets. The browser never receives an ElevenLabs API key and never calls ElevenLabs directly.

## Credentials

Set these values in the terminal environment:

```powershell
$env:ELEVENLABS_API_KEY="your-key"
$env:ELEVENLABS_VOICE_ID="your-voice-id"
```

The generator also supports a local `.env` file or `.env/keys.txt`:

```dotenv
ELEVENLABS_API_KEY=your-key
ELEVENLABS_VOICE_ID=your-voice-id
```

Both forms are excluded by `.gitignore`. Never commit or paste production keys into source files, documentation, issues, or chat.

Optional settings:

```dotenv
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
```

## Inventory

- Human-readable catalog: `AUDIO_INVENTORY.md`
- Machine-readable catalog: `assets/audio/audio-inventory.json`

The inventory is the source of truth for text, IDs, destinations, language, and source pages.

## Generate Audio

Generate every missing inventory item:

```powershell
node scripts/generate-elevenlabs-audio.js
```

Existing MP3 files are skipped automatically. A complete run can make hundreds of paid API requests, so review the inventory and ElevenLabs quota first.

Generate one item:

```powershell
node scripts/generate-elevenlabs-audio.js --id phrases-i-am-learning-english
```

Generate a controlled test batch:

```powershell
node scripts/generate-elevenlabs-audio.js --limit 5
```

Force regeneration of one item:

```powershell
node scripts/generate-elevenlabs-audio.js --id words-apple --force
```

Force regeneration of every item:

```powershell
node scripts/generate-elevenlabs-audio.js --force
```

Rebuild the runtime manifest without calling ElevenLabs:

```powershell
node scripts/generate-elevenlabs-audio.js --manifest-only
```

## Output

Generated files are stored in:

- `assets/audio/letters/`
- `assets/audio/words/`
- `assets/audio/phrases/`
- `assets/audio/lesson-intros/`

The generator rebuilds `assets/audio/audio-manifest.json` after each batch. That manifest contains only MP3 files that exist locally.

## Runtime Playback Order

`window.ExpresateAudio` uses this order:

1. MP3 path found in `audio-manifest.json`.
2. Existing legacy/local audio path supplied by the page.
3. Browser speech synthesis fallback.

Real recorded audio remains first priority. Speech synthesis quality depends on the learner's browser and installed system voices.

## Failure Recovery

The generator retries rate limits and server failures with exponential backoff. Successful files remain on disk. Run the command again to skip successful files and retry only missing items.
