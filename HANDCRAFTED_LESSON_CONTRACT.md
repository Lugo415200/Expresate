# HANDCRAFTED_LESSON_CONTRACT

## Purpose

This document defines the required structure for **handcrafted lesson pages** such as:

- `lesson-000-alphabet.html`
- `lesson-001-sounds.html`
- other HTML lessons that rely on `lesson.js`

This is a contract for authoring and maintaining handcrafted lessons without breaking:

- lesson step flow
- XP/progress completion
- shared navigation
- premium gating
- audio/speech practice
- story intro handoff

This document does **not** apply to:

- `lesson.html` Studio live runtime
- admin/Studio pages
- course page
- dictionary/game/auth/pricing pages

---

## 1. Core idea

A handcrafted lesson page is a **static HTML lesson shell** with:

1. shared app infrastructure
2. one or more `.flashcard` lesson steps
3. optional page-local logic for lesson-specific experiences
4. `lesson.js` as the shared handcrafted lesson controller

The page owns:

- lesson-specific markup
- lesson-specific inline experience logic
- lesson-specific modal/orientation/story orchestration

The shared engine owns:

- step-mode flashcard navigation
- progress bar rendering
- `Listo` completion handling
- lesson completion gating
- consejo side panel behavior

---

## 2. Required HTML markers

## Required page-level markers

### `<meta charset="UTF-8">`
Must exist near the top of `<head>`.

Reason:

- prevents mojibake corruption
- required because lessons contain Spanish copy with accents and punctuation

### `<body class="lesson-step-mode" data-lesson-id="...">`
Required body contract:

- `class="lesson-step-mode"`
- `data-lesson-id="<canonical lesson id>"`

Example:

```html
<body class="lesson-step-mode" data-lesson-id="lesson-000-alphabet" data-page="curso">
```

`data-lesson-id` must match the lesson route id used by progress/course systems.

### Shared nav anchors
Handcrafted lesson pages are expected to include:

```html
<div class="topbar"></div>
<aside class="panel sidebar"></aside>
```

Reason:

- `nav.js` injects shared primary navigation into these containers

---

## Required lesson shell markers

### Progress mount
The page must provide:

```html
<div data-lesson-progress></div>
```

Reason:

- `lesson.js` renders the top lesson progress UI into this mount

### Flashcard steps
Each lesson step must be a `.flashcard` section with a `data-fc-id`.

Minimum contract:

```html
<section class="flashcard block" data-fc-id="intro" data-fc-title="Bienvenida">
  ...
  <button class="btn fc-listo" type="button" data-fc-listo>Listo ✓</button>
</section>
```

Required attributes:

- `class="flashcard"`
- `data-fc-id`
- preferably `data-fc-title`

Optional but strongly expected:

- `data-fc-type`
- `data-fc-tip`
- `data-fc-summary="true"` for summary/transition cards

### Summary card marker
If a card is a summary/transition card rather than a normal required learning step:

```html
data-fc-summary="true"
```

Reason:

- `lesson.js` excludes summary cards from certain gating rules

---

## 3. Required script load order

Handcrafted lesson pages should load shared dependencies in this order:

1. Supabase CDN
2. `supabaseClient.js`
3. `access.js`
4. `progress.js`
5. `sync.js`
6. `alerts.js`
7. `nav.js`
8. lesson-specific data registries
9. optional lesson-specific engines (example: `dialogue-engine.js`, `speech-practice.js`)
10. page-local inline setup that depends on those registries/engines
11. `lesson.js`
12. `app.js`
13. final page-local inline logic that depends on `lesson.js` / `app.js`

## Example pattern

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabaseClient.js"></script>
<script src="access.js"></script>
<script src="progress.js"></script>
<script src="sync.js"></script>
<script src="alerts.js"></script>
<script src="nav.js"></script>

<script src="data/lessons.js"></script>
<script src="data/studio-characters.js"></script>
<script src="data/studio-story-scenes.js"></script>
<script src="data/lesson000-letters.js"></script>
<script src="dialogue-engine.js"></script>

<script>
  /* page-local story/orientation setup */
</script>

<script src="lesson.js"></script>
<script src="app.js"></script>

<script>
  /* page-local lesson interactions that depend on lesson.js/app.js */
</script>
```

## Why this order matters

- `access.js` expects Supabase client to exist
- `sync.js` expects `Progress` and `Access`
- `lesson.js` expects lesson markup and shared dependencies to already exist
- `app.js` binds audio/global helpers after DOM and base lesson systems are available
- page-local scripts often depend on registries and global helpers being present

---

## 4. What `lesson.js` assumes

`lesson.js` assumes handcrafted lesson pages provide:

### A. Step sections

- `.flashcard[data-fc-id]` sections exist
- there are one or more flashcards

### B. Per-card completion buttons

Most required flashcards have a button with:

- `[data-fc-listo]`

Without this, the card may not mark complete and the lesson may never advance/gate correctly.

### C. Progress mount exists

- `[data-lesson-progress]`

### D. Body is in step mode

- `body.lesson-step-mode`

This allows the shared controller to hide non-current cards and run one-card-at-a-time flow.

### E. `data-fc-tip` is the source of consejo text

If any card provides `data-fc-tip`, `lesson.js` may create the shared consejo side rail.

The active card’s `data-fc-tip` is treated as the **single source of tip copy**.

### F. Summary cards are explicitly marked

If a card is not a required content step, mark it with:

- `data-fc-summary="true"`

Otherwise `lesson.js` may count it as a required completion step.

### G. The page does not fight the shared step controller

`lesson.js` assumes it owns:

- active card visibility
- back/next card movement
- progress bar state
- completion gating

Page-local code must not create a second competing step controller for the same flashcards.

---

## 5. What page-local inline scripts are allowed to control

Page-local scripts are allowed to control **lesson-specific experiences** that are not generic enough for `lesson.js`.

Allowed responsibilities:

- story intro selection/orientation orchestration
- lesson-specific modals
- alphabet explorer
- personalization forms used only by that lesson
- exact-info examples
- letter example browsing
- page-specific audio triggers
- page-specific helper animations

Allowed rule:

- page script may control **inside a flashcard**
- page script may control a **pre-lesson intro phase**
- page script may control lesson-specific modal UI

Not allowed:

- replacing `lesson.js` step ownership
- inventing a second XP system
- inventing a second lesson completion system
- bypassing shared progress APIs
- mutating unrelated global nav/auth behavior from inside a lesson page

Safe mental model:

- `lesson.js` owns the lesson skeleton
- page-local scripts own custom organs attached to that skeleton

---

## 6. Story intro phases

Handcrafted lessons may optionally support these phases:

1. orientation
2. story scene
3. lesson
4. outro/transition later

## Required behavior

### Orientation phase
Optional.

If present, it should:

- introduce the learner to what is about to happen
- not mark lesson progress complete
- hand off explicitly into story or lesson phase

### Story phase
Optional.

If present, it should:

- load scene data from a registry, not hardcoded inline text if avoidable
- render before normal lesson cards
- use existing character registry for portrait/pose resolution
- not permanently block the lesson if data is missing

### Lesson phase
This is the normal handcrafted lesson flow controlled by `lesson.js`.

### Handoff rule
When story intro completes:

- intro state classes/attributes must be removed
- overlays must be removed or hidden
- lesson step mode must become the active visible mode
- shared lesson UI must be restored

### If story data is missing or engine fails
The page must fall back to normal lesson mode and remain fully usable.

---

## 7. How `data-fc-id` and `data-fc-listo` work

## `data-fc-id`

This is the **canonical flashcard id** within the lesson page.

Uses:

- step identity
- completion tracking
- active card control
- progress counting
- lesson-specific lookup hooks

Rules:

- must be unique per lesson page
- should be stable once used
- should not be reused for different semantic steps later

## `data-fc-listo`

This is the shared completion trigger for a flashcard.

Typical behavior:

1. user clicks button
2. `lesson.js` intercepts it
3. current card is marked done
4. progress bar updates
5. next step becomes available / visible in step mode

Rules:

- required for normal required flashcards
- must be an actual button
- must not be silently removed unless the card has another explicit completion path that still calls shared completion logic safely

---

## 8. How progress / completion is triggered

There are two layers:

### A. Page-local card completion
Handled by `lesson.js` through:

- `[data-fc-listo]`
- section done state
- final gating rules

### B. Durable progress / XP / streak
Handled by `progress.js` and optionally synced by `sync.js`

Expected contract:

- page-local lesson UI should not write arbitrary localStorage progress directly
- durable completion should go through shared progress APIs
- XP and streak must remain owned by the shared progress system

Normal completion flow:

1. all required flashcards are completed
2. final lesson completion CTA is allowed
3. shared progress system marks lesson done
4. XP reward is recorded
5. daily activity may update streak
6. authenticated users sync through `sync.js`

---

## 9. How consejo / right panel is expected to behave

Current handcrafted lessons use a shared Consejo system created by `lesson.js`.

## Expected behavior

- the lesson page supplies `data-fc-tip` per flashcard
- `lesson.js` creates the collapsible consejo rail/panel if tips exist
- the active card’s `data-fc-tip` becomes the displayed tip
- the rail should position relative to the active lesson card

## Contract for page authors

Do:

- provide short, useful `data-fc-tip` text per card
- allow the shared rail/panel to manage rendering and state

Do not:

- create a second competing consejo rail for the same card flow
- hard-pin fixed tip content unrelated to the active card unless the lesson intentionally requires a custom non-shared tip system

## Story intro rule

During story/orientation intro phases, shared consejo UI should be hidden unless that phase explicitly needs it.

Reason:

- story scene should feel immersive
- normal lesson assistance should not leak into intro mode

---

## 10. How page-specific modals should be structured

Page-specific modals are allowed for custom lesson experiences.

Examples:

- name/email/address example modal
- letter exploration modal
- future phonics example modals

## Required structure

Use:

- real button controls
- close button
- visible heading/label
- contained content area
- one clear primary action

Recommended shape:

```html
<div class="lesson-modal" hidden>
  <div class="lesson-modal-backdrop"></div>
  <div class="lesson-modal-panel" role="dialog" aria-modal="true" aria-labelledby="...">
    ...
    <button type="button">Cerrar</button>
  </div>
</div>
```

## Required behavior

- modal must not mark lesson complete merely by opening
- modal must cleanly open/close without leaving invisible overlays
- modal should not block lesson forever if data is missing
- modal should remain scoped to the current lesson page

## Audio inside modals

Audio buttons inside modals should use the existing shared audio system where possible:

- `data-audio`
- `data-audio-fallback`
- `window.ExpresateAudio`

## Story scene exception

Story dialogue scene is not just a modal.
It is a lesson phase wrapper and should be treated separately from page-specific educational popups.

---

## 11. What NOT to do inside lesson pages

Do not:

- create a second lesson progress system
- directly mutate XP or streak outside shared progress APIs
- let page-local code compete with `lesson.js` for flashcard visibility
- hard-code story copy directly into HTML if a registry lookup is available
- add duplicate top navigation rows
- create hidden overlays that stay mounted after scene/modal completion
- write premium access logic inside the lesson page when `access.js` already owns it
- invent page-specific auth state logic instead of using shared shell
- patch mojibake by duplicating strings; corrupted strings should be replaced in place
- rely on untracked asset filenames as runtime canon

---

## 12. Common bugs and causes

## Hidden overlays blocking clicks

Symptoms:

- buttons appear visible but do not click
- lesson seems frozen after story scene or modal

Common causes:

- overlay element still mounted with high z-index
- `pointer-events` still active on hidden scene/modal layer
- intro-active class removed visually but overlay DOM remains interactive

## Story UI leaking into lesson UI

Symptoms:

- progress bar visible during intro
- consejo visible during intro
- old lesson CTA visible under dialogue scene

Common causes:

- intro/body classes not removed consistently
- lesson UI hidden using incomplete selectors
- page-local script and shared lesson CSS disagree on intro-active state

## Wrong character IDs

Symptoms:

- portrait fallback initials instead of expected character image
- wrong display name

Common causes:

- scene references `teacher` while registry uses `professor`
- typo in `id`
- registry entry missing entirely

## Wrong pose paths

Symptoms:

- speaker shows fallback avatar instead of correct pose
- only some poses work

Common causes:

- pose name in scene data not present in registry
- registry path points to file that does not exist
- filename/case mismatch
- untracked replacement asset exists but registry still points to old path

## Missing `data-fc-listo` buttons

Symptoms:

- card never completes
- progress bar stalls
- final completion never unlocks

Common causes:

- required flashcard omitted `[data-fc-listo]`
- custom interaction finishes visually but never triggers shared completion path

## Mojibake / UTF-8 corruption

Symptoms:

- `Exprésate`
- `Lección`
- `práctica`
- broken `¿` / `¡` / `→`

Common causes:

- file saved with wrong encoding
- editor rewritten UTF-8 text through incorrect code page
- corrupted strings duplicated instead of replaced
- missing or displaced `<meta charset="UTF-8">`

## Duplicate state ownership between page scripts and `lesson.js`

Symptoms:

- step count wrong
- story complete button and lesson continue button both visible
- card advancement jumps unexpectedly
- page progress and lesson progress drift apart

Common causes:

- page-local script also tries to control flashcard visibility
- custom next/back logic bypasses `lesson.js`
- intro/lesson handoff not treated as a clean state boundary

---

## 13. Recommended authoring checklist for a handcrafted lesson page

Before considering a handcrafted lesson stable, verify:

1. `<meta charset="UTF-8">` exists
2. body has `class="lesson-step-mode"` and correct `data-lesson-id`
3. shared nav anchors exist
4. `[data-lesson-progress]` exists
5. every required flashcard has unique `data-fc-id`
6. every required flashcard has `[data-fc-listo]`
7. summary-only cards are marked `data-fc-summary="true"`
8. page-local modals close cleanly
9. story/orientation phases fully hand off to lesson mode
10. consejo does not leak into intro mode unless intentional
11. no overlay blocks clicks after transitions
12. visible Spanish text renders with proper accents

---

## 14. Current gold-standard example

At the moment, `lesson-000-alphabet.html` is the richest handcrafted lesson example because it combines:

- orientation
- story intro
- step-mode flashcards
- personalization
- modal interactions
- alphabet exploration
- shared audio/progress infrastructure

It should be treated as the reference case for debugging the handcrafted lesson contract, even though it is also the most complex page and therefore the easiest place for ownership bugs to appear.
