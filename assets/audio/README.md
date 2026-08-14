# Audio policy

Production learner audio is human-recorded only. The protected alphabet recordings live in `audio/alphabet/` and must not be moved, renamed, or re-encoded.

Add future human recordings under `assets/audio/`, register each existing file in `audio-manifest.json`, and use `human-recording-queue.json` for the Lesson 001 recording checklist. The manifest is refreshed network-first by the service worker, so lesson readiness updates after the recording and manifest files are deployed. The application does not use browser speech synthesis as a fallback.
