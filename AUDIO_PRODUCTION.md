# Audio production policy

Use human recordings only for learner-facing spoken output. Do not generate or ship browser speech-synthesis fallback audio.

Keep the existing alphabet recordings in `audio/alphabet/` unchanged. Place future recorded lesson audio under `assets/audio/`, add its exact path to `assets/audio/audio-manifest.json`, and retain the established filenames in `assets/audio/human-recording-queue.json` where applicable.
