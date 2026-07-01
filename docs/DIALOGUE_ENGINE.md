# Dialogue Engine

## Purpose

`dialogue-engine.js` and `dialogue-engine.css` provide a reusable, student-facing dialogue scene renderer for Exprésate.

Use this engine for:

- story intros
- guided scene openers
- conversation setup
- future dialogue-based activities

This phase is intentionally linear. It does not include branching or scoring.

## Public API

```js
window.ExpresateDialogueEngine.start({
  mount: document.querySelector("[data-dialogue-mount]"),
  scene,
  onComplete() {
    console.log("Scene finished");
  }
});
```

## Required options

- `mount`: DOM element where the engine should render
- `scene`: scene data object or array of lines
- `onComplete`: callback fired after the last line advances

## Supported scene shapes

### Object form

```js
const scene = {
  location: "English Classroom",
  dialogue: [
    {
      speaker: "sofia",
      pose: "happy",
      text: "Hola, soy Sofía."
    }
  ]
};
```

### Array form

```js
const scene = [
  {
    speaker: "sofia",
    pose: "happy",
    location: "English Classroom",
    text: "Hola, soy Sofía."
  }
];
```

## Supported line fields

- `speaker`: character id or object compatible with the character registry
- `pose`: pose name
- `location`: optional per-line location label
- `text`: dialogue content
- `speakerLabel`: optional display label override
- `posePath`: optional direct asset path override
- `fallback`: optional fallback avatar initial override

## Character pose lookup

The engine uses the existing character registry when available:

- `window.ExpresateStudioCharacters.normalizeRef(...)`
- `window.ExpresateStudioCharacters.getPosePath(id, pose)`

If a pose image exists, it is shown.

If not, the engine falls back to a circular initial avatar.

## Interaction behavior

- one line visible at a time
- typewriter animation for current line
- click while typing: finish current line immediately
- click after typing: advance to next line
- `Enter` / `Space`: advance
- final advance triggers `onComplete`

## Accessibility

- reduced-motion users do not get stuck with hidden content
- the dialogue box is keyboard focusable
- the advance control remains a real button

## Not included yet

- audio playback
- branching logic
- answer choices
- dialogue history
- lesson progress integration

## Sandbox

`dialogue-test.html` is the current sandbox demo for the engine.

Use it for:

- layout iteration
- motion tuning
- pose fallback checks
- typing behavior checks

## Next safe phase

The next safe step is optional integration into:

- Studio story-scene preview
- handcrafted story intro cards
- live `lesson.html` scene moments

That should happen only after the shared engine presentation and lifecycle are approved.
