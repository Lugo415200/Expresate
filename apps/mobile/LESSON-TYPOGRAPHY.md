# Native lesson readability

Reuse `src/lessonTypography.ts` for future native lessons, including Lesson 001.
Sizes are React Native logical units; let system text scaling remain enabled.

| Role | Size / line height |
| --- | --- |
| Learning word or letter | 36 / 44 |
| Single focal letter | 64 / 76 |
| Question | 28 / 36 |
| Instruction | 22 / 31 |
| Dialogue | 24 / 33 |
| Answer | 36 / 44 |
| Primary button | 22 / 29 |
| Helper | 18 / 26 |
| Section label | 17 / 24 |

Use shared `Button` with `readable` for lesson navigation. This opts into
the lesson hierarchy without changing account or other application buttons.

## Layout rules

- Keep the same text sizes on small phones. Wrap, stack, scroll or split content.
- Present one learning objective per beat. Keep instructions concise in Spanish.
- Use minimum heights rather than fixed text container heights. Lesson buttons
  have at least 64 units of height and can grow with their labels.
- Pin navigation and answer feedback outside the content scroll area. Keep
  dialogue advancement outside the independently scrollable dialogue body.
- Use the measured dialogue area to reserve space for character artwork. Keep
  existing contain framing; do not compensate for text with arbitrary image offsets.
- Explorer letters use a spacious three-column grid, 36-unit centered letters
  and tiles at least 88 units high. Scrolling is intentional. Visited is neutral;
  selected is distinct; neither implies a correct answer.
- Preserve action labels, written feedback, reduced-motion support, randomization,
  playback gates, rapid-tap protection and completion guards.

## Lesson 000 coverage

Intro, all orientation beats, four story beats, lesson map, upper/lowercase,
letter-name explanation, Apple/Airplane/Dog individually, recognition, explorer,
three hearing rounds, CAT/MAP spelling, Sofía and completion follow these rules.
The long Professor greeting is split locally; shared website content is unchanged.
All artwork and alphabet recordings remain unchanged.

## Local verification

From the repository root:

```powershell
node apps/mobile/node_modules/typescript/bin/tsc --noEmit -p apps/mobile
node --test tests/*.test.cjs
```

Export locally from `apps/mobile` before running the browser checks:

```powershell
node node_modules/expo/bin/cli export --platform all --output-dir ../../_tmp_lesson000-followup/export
```

Run `tests/mobile-lesson000.cjs`, `tests/mobile-layout.cjs` and
`tests/mobile-typography.cjs` with Playwright available. Do not regenerate the
export during a walkthrough. The typography test covers 320x568, 375x667,
390x844 and 430x932 at normal and 160% browser text sizing, including screenshots.
These are React Native Web layout proxies, not iOS simulator or device tests.

Before release, check actual iPhone Dynamic Type, safe-area insets, VoiceOver,
normal-motion typewriter/bounce, audio and touch behavior. Existing installed
builds do not acquire these local source changes automatically.
