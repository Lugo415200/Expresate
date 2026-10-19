# Welcome, orientation and Lesson 000 tester milestone

The native welcome and orientation use the approved purple, ivory, navy and
yellow design. Lesson 000 applies the same palette to exploration, recognition,
listening, spelling, answer feedback, the final challenge and completion.
Typography, dialogue content, audio recordings, typing blips, replay, progression
and completion protections are preserved. Sofía V2 and professor V2 are now the
shared default portraits; V1 and original assets remain for rollback.
The existing shared `data/lessons.js` release policy and its declaration are
included because CourseMap imports them; unreleased lessons remain unavailable.

## Validation

- Final TypeScript check passed.
- Final focused Node checks: 15 passed (answer shuffle, typing-sound lifecycle,
  progress merging, concurrent saves, account switches and duplicate rewards).
- Final asset checks: both V2 portraits are transparent RGBA 1024 × 1536 PNGs;
  all 69 static media references resolve and V1 rollback assets remain.
- Earlier verification, reused for unchanged layout/mechanics: complete Lesson
  000, orientation/replay, real bundled audio, answer states and 10-XP one-time
  completion with a fixture account; four phone viewport sizes with normal and
  160% browser text. Browser verification is not physical-device certification.
- Expo's current dependency checker recommends newer SDK 57 patch versions for
  expo, expo-asset and expo-audio. This milestone retains the locked versions
  already used by the installed build; no native dependencies were changed.

## Internal iPhone distribution

Project: `@expresate/expresate`, ID `720c9c7c-e3bd-407a-b183-2f874e35eb3d`.
Bundle ID: `co.expresate.mobile`. Existing `preview` profile uses internal
distribution and physical iPhones. The user confirmed installed build
`a5f035b7-17aa-4f57-922c-e181285711b9`, version 0.1.0 (1).
That build has no EAS Update runtime/channel, and expo-updates is not installed.
Use a replacement internal build, not a guessed update channel or App Store
submission. Build from a clean checkout of the milestone commit so unrelated
working-tree changes and local outputs are not uploaded.

No environment file is required: the existing shared Supabase URL and anon key
are public configuration; authenticated progress remains protected by the
existing server policies. Do not put service-role keys or signing files in git.

On the phone, install the new internal build from its EAS installation page and
open Exprésate directly (no Metro or Expo Go required). Keep the existing app
installed when replacing it to retain local state. Review the welcome, enter
Lesson 000, and check both classroom portraits, panel overlap, audio/replay and
completion. Returning users keep their saved orientation status.

Still requires physical iPhone QA: pixel resampling, real safe areas/Dynamic
Type/VoiceOver, recording permissions, and real authenticated cross-device sync.
