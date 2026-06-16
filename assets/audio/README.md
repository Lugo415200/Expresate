# Exprésate audio assets

Existing alphabet audio currently lives in `audio/alphabet/` and should not be moved or renamed.

Use these folders for future local pronunciation files:

- `letters/` for new letter or spelling variations
- `words/` for single-word pronunciation, such as `name.mp3`
- `phrases/` for short lesson phrases
- `lesson-intros/` for optional intro narration

Clickable lesson elements can use `data-audio="assets/audio/words/example.mp3"`.
If a file is not available yet, add `data-audio-fallback="example"` to let the browser pronounce it without throwing errors.
