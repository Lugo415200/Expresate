# Production audio inventory

Exprésate production audio is human-recorded only.

- Active recordings: `audio/alphabet/a.mp3` through `audio/alphabet/z.mp3`.
- Removed generated recordings: `assets/audio/letters/`, `assets/audio/words/`, `assets/audio/phrases/`, and `assets/audio/lesson-intros/` MP3 files.
- Future Lesson 001 recordings: `assets/audio/human-recording-queue.json`.

`assets/audio/audio-manifest.json` is the runtime source of truth. A recording must exist and be listed there before learner controls can play it.
