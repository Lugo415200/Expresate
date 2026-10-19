# Native typewriter sound

`ImmersiveScene` calls the dialogue sound controller from its existing character
reveal callback. No independent sound timer or loop is used. `StoryScene` and
future lessons using this shell inherit the behavior automatically.

The unchanged `assets/sfx/dialogue.wav` is a 120 ms quiet UI cue (peak amplitude
about 7% of full scale). Playback volume defaults to 0.6. Pronunciation recordings
are not used or modified.

Optional `ImmersiveScene.typewriterSound` configuration:

```tsx
typewriterSound={{ enabled: true, cadence: 3, volume: 0.6 }}
```

The cadence counts letters and numbers, excluding spaces, line breaks and
punctuation. One blip is eligible per three visible characters. Busy or unloaded
players drop eligible blips; they never queue them or replay them later. Since the
sample lasts 120 ms, actual playback is sparser than eligibility during fast text.

One player is reused across lines. Normal completion cancels pending starts and
lets an already audible short cue end naturally. Skip, exit, line changes and
backgrounding pause playback and invalidate pending seeks. Unmount removes the
player, playback listener and AppState listener. Foregrounding permits future
reveal ticks without replaying background ticks. Reduced motion reveals text
instantly and allocates no dialogue player.

Native playback uses expo-audio with `keepAudioSessionActive` to avoid deactivating
other audio when a blip ends. The local web preview owns a single HTMLAudioElement
so its `play()` Promise is caught, including cancellation during disposal. No
global audio shutdown is used. The previous line-entry and skip cues were removed
from the story shell to avoid doubled or disposable audio during navigation.

Verification: TypeScript, `tests/mobile-dialogue-sound.test.cjs`,
`tests/mobile-dialogue-sound.cjs`, and the existing mobile walkthrough/layout/
typography/opening checks. Browser visibility changes exercise the AppState web
adapter; real iOS backgrounding, silent-mode behavior, timing and perceived volume
still require an iPhone check. No EAS build or update is part of this change.
