# Lesson 000 follow-up audit

## Voice source

All spoken letters in Orientation, alphabet exploration, the hearing challenge, CAT/MAP spelling, and SOFIA spelling come from `audio/alphabet/a.mp3` through `audio/alphabet/z.mp3`, mapped statically by `apps/mobile/src/assets.ts` and played by `useLessonAudio.ts` using expo-audio. The voice/timbre is baked into those recordings: there is no runtime voice selector, pitch change, TTS engine, or ElevenLabs request in this flow. Story dialogue is text, with short decorative WAV cues from `apps/mobile/assets/sfx/`.

The repository's AUDIO_PRODUCTION.md, AUDIO_INVENTORY.md and assets/audio/README.md identify the alphabet set as protected human recordings. No alternative alphabet recordings were found. The speaker's identity is not documented. The unrelated generation script is not a runtime voice configuration and was not run.

To change only the native voice, supply an approved, consistently recorded set of the 26 English letter names. Add it under `apps/mobile/assets/audio/alphabet/a.mp3` through `z.mp3`, then change the 26 audio requires in `apps/mobile/src/assets.ts`. Preserve the shared original recordings so the website remains unchanged. Retest intelligibility (especially A/E/I, G/J, M/N, B/P/V) and concatenated spelling. No recordings or voices were replaced in this audit.

## Playback disposal

In the installed Expo SDK 57 source, `expo-audio/src/AudioPlayer.web.ts` calls HTMLMediaElement.play() without consuming its Promise. remove() pauses that media element. Creating a decorative tap player immediately before unmounting its scene can therefore produce a browser AbortError. ImmersiveScene no longer starts that disposable advance/exit cue; entering a new line retains its dialogue cue, and revealing a line retains its tap cue.

Lesson voice playback uses a cancellation/version token: exiting or backgrounding cancels playback, resolves the pending wait, and returns false without unlocking the exercise. Removing a player on departure is intentional; it must not award listening credit. Native iOS uses the native audio implementation, not HTMLMediaElement. The remaining immediate-exit cancellation edge case, if observed, is not evidence that a completed recording failed. Real iPhone audio interruption/resume still needs a device test.

## Structure and interaction

The A/E/I-only listening screen was still present. It is now removed; all letter-name practice remains available in the 26-letter explorer, with A/E practice in Orientation. Initial recognition now matches lowercase a to uppercase A visually; the later G/M/S challenge requires audio without a written answer cue. Redundant hearing/spelling result screens and their extra continuation taps were removed. Correct answers display feedback, lock the current question, and advance after 700 ms. Spelling checks a synchronous answer reference, allowing fast intentional consecutive letters without stale-state duplicates.

Fisher–Yates shuffling is shared by native choices, including Orientation, and remains stable during retries. Visited explorer tiles retain neutral blue borders, with purple for the selected tile. Completion locks in-flight submissions and disables saving after confirmed completion; the existing account-specific pending storage, Supabase sync, and idempotent XP merge are unchanged.

## Accessibility and artwork

The three cropped example PNGs are unchanged. Story subject centering and measured dialogue reservation are retained. The top controls also reserve their measured height when text grows. The orientation CTA has space beside its back button on small phones. Letter tiles can grow vertically with larger text; labels and announcements describe actions/results. Toca para escuchar is prominent and pulses gently; completion of playback reveals Siguiente. Reduced motion removes pulse, float, scene movement, and typewriter delay while preserving normal-mode typewriter dialogue and character bounce.

## Verification boundaries

The automated browser walkthrough uses the actual Expo web export and bundled audio, with an isolated Supabase HTTP fixture. This can verify one-tap progression, retry behavior, one completion write, 10 XP, and restoration in a newly opened browser context, but is not a real authenticated Supabase/RLS test or an iOS runtime test. Portrait layouts and increased text sizes in a browser are proxies. Physical iPhone safe areas, Dynamic Type, VoiceOver, interruptions, and authenticated reopen/sync remain device acceptance checks. No EAS build/update, deployment, or push is performed.


## Completed checks

- `node apps/mobile/node_modules/typescript/bin/tsc --noEmit -p apps/mobile`: passed.
- `node --test tests/*.test.cjs`: 16 passed, including exhaustive 3-choice shuffle permutations and existing XP/sync safeguards.
- Local `expo export --platform all`: web, iOS and Android bundles passed; bundled asset paths resolved.
- `node tests/mobile-lesson000.cjs` (Playwright/Chrome): passed fresh intro/orientation through completion, incorrect retries, automatic one-tap advancement, dialogue/answer tap bursts, real letter recordings, four portrait widths, exactly one save/10 XP, restoration after opening a new browser context with the same account storage, and reduced-motion stability. No browser page errors or audio-cancellation warnings in this run. Supabase requests use a local fixture, not production.
- `node tests/mobile-layout.cjs`: passed 160% browser text at 320×568, 375×667, 390×844 and 430×932; artwork remained within the viewport and above dialogue. Screenshots visually reviewed.
- SHA-256 checks: Apple/Airplane/Dog framed PNGs unchanged from task start.
- `git diff --check`: passed (existing CRLF normalization notices only).

Browser scripts expect the current mobile export in `_tmp_lesson000-followup/export` and Playwright with installed Chrome. All generated bundles/screenshots remain in that ignored folder. No website code, shared progress implementation, recordings, or authentication configuration was changed.
