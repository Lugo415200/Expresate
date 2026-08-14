# PROJECT_CONTROL_MAP

## 1. Project Overview

Exprésate is a static HTML/CSS/JS learning application evolving into a Spanish-first English course with:

- handcrafted lesson pages
- a shared app shell (auth, progress, premium access, navigation, alerts)
- an experimental Studio authoring system
- a separate live runtime for Studio-built lessons
- a growing story/character layer

Current architecture is **multi-entry static pages + shared global controllers + data registries**.

The project is not a single SPA. Each HTML page is its own runtime entry point and selectively loads:

- global infrastructure
- page-specific controller(s)
- page-local inline logic where needed

Major systems currently present:

- **App shell**: `nav.js`, `alerts.js`, shared CSS, topbar/sidebar injection
- **Auth / session / Supabase**: `supabaseClient.js`, `auth.js`, `access.js`, `sync.js`
- **Progress / XP / streak**: `progress.js`
- **Handcrafted lesson engine**: `lesson.js`, `lesson-flashcard.css`, lesson HTML files
- **Story / dialogue layer**: `dialogue-engine.js`, `dialogue-engine.css`, story + character registries
- **Audio layer**: `app.js`, audio assets, speech fallback, speech practice integration
- **Studio / admin authoring**: `admin.html`, `admin.js`, `data/studio-*.js`
- **Studio live lesson runtime**: `lesson.html`, `lesson-live.js`, `data/studio-lesson-renderer.js`
- **Course route / locks**: `data/lessons.js`, `curso.js`, `access.js`

Architecturally, the biggest current split is:

1. **Gold-standard handcrafted lesson experience**
2. **Studio/local/cloud lesson runtime**

Those two paths overlap conceptually but do not yet share one unified learner-facing player.

---

## 2. Runtime Entry Points

### `index.html`
Appears to control:

- homepage / landing / quick-start hub
- shared topbar injection
- app-wide auth state visibility
- guest reminder and general audio/app helpers through `app.js`
- homepage-specific behavior through `home.js`

Loads:

- Supabase CDN
- `supabaseClient.js`
- `access.js`
- `progress.js`
- `sync.js`
- `alerts.js`
- `nav.js`
- `app.js`
- `home.js`

Notes:

- includes hidden sidebar markup only to satisfy shared nav injection patterns
- behaves like a content page, not a lesson runtime

### `curso.html`
Appears to control:

- main course route
- lesson/module unlock state
- premium row state
- quiz launch / route presentation
- published Studio lessons appended under handcrafted route content

Loads:

- Supabase/auth/progress shell
- `data/lessons.js`
- `data/studio-lessons.js`
- `data/studio-publishing.js`
- `data/quizzes.js`
- `curso.js`
- `app.js`

Notes:

- course behavior is route-driven, not lesson-driven
- this is the main integration point between handcrafted curriculum and Studio-published lessons

### `lesson-000-alphabet.html`
Appears to control:

- handcrafted Lesson 000 learner experience
- story intro/orientation for this lesson
- alphabet explorer
- exact information examples
- personalization step
- lesson card flow and completion

Loads:

- shared shell: Supabase, access, progress, sync, alerts, nav
- data: `data/lessons.js`, `data/studio-characters.js`, `data/studio-story-scenes.js`, `data/lesson000-letters.js`
- story runtime: `dialogue-engine.js`
- general lesson runtime: `lesson.js`
- general app helpers: `app.js`
- significant inline lesson-specific scripts

Notes:

- this page is the most complex handcrafted runtime
- contains both declarative flashcard markup and large inline controller logic
- currently the best detailed example of how handcrafted player + story + shared systems intersect

### `lesson-001-sounds.html`
Appears to control:

- handcrafted key-sounds lesson
- speech-practice integration
- shared lesson shell / step-mode flow

Loads:

- shared shell
- `data/lessons.js`
- `speech-practice.js`
- `lesson.js`
- `app.js`

Notes:

- simpler than Lesson 000
- no dedicated dialogue/story bootstrapping observed in entry scripts

### `admin.html`
Appears to control:

- Exprésate Studio admin workspace
- local authoring and preview
- optional Supabase-backed publishing controls

Loads:

- shared auth foundation through `supabaseClient.js` and `access.js`
- Studio registries:
  - `data/lesson000-letters.js`
  - `data/studio-media-library.js`
  - `data/studio-vocabulary.js`
  - `data/studio-lessons.js`
  - `data/studio-publishing.js`
  - `data/studio-experiences.js`
  - `data/studio-themes.js`
  - `data/studio-activities.js`
  - `data/studio-animations.js`
  - `data/studio-characters.js`
  - `data/studio-story-scenes.js`
  - `data/studio-lesson-renderer.js`
- `admin.js`

Notes:

- Studio is local-first and can optionally sync/publish
- admin gating is frontend-enforced through approved emails + session checks

### `auth.html`
Appears to control:

- login / signup
- redirect return flow
- signed-in account UI

Loads:

- shared shell
- `auth.js`
- `app.js`

Notes:

- this page is a dedicated auth controller, not a reused lesson/app subview

### `pricing.html`
Appears to control:

- premium plan presentation
- Stripe checkout entry from frontend
- plan/status messaging

Loads:

- shared shell
- `app.js`
- inline pricing behavior

Notes:

- payment secrets are not here
- secure Stripe actions are expected to route through Supabase Edge Functions

### `juego-comida.html`
Appears to control:

- focused food speech practice game
- speech practice interactions
- XP/reward flow inside the game

Loads:

- shared shell
- `speech-practice.js`
- `juego-comida.js`
- `app.js`

Notes:

- game runtime uses shared progress/audio infrastructure but its own UI/controller

### `diccionario.html`
Appears to control:

- dictionary / verb lookup / search-focused page
- shared app shell with content-specific controls inside page body

Loads:

- `verb.js`
- `diccionario.js`
- shared shell files
- `app.js`

Notes:

- dictionary controls should be treated as page content, not as another top navbar

### `lesson.html`
Appears to control:

- Studio-built published lesson playback
- reusable live lesson runtime
- optional story intro injection for published Studio lessons

Loads:

- shared shell
- `speech-practice.js`
- Studio data registries:
  - `data/lesson000-letters.js`
  - `data/studio-vocabulary.js`
  - `data/studio-lessons.js`
  - `data/studio-publishing.js`
  - `data/studio-experiences.js`
  - `data/studio-characters.js`
  - `data/studio-story-scenes.js`
  - `data/studio-lesson-renderer.js`
- `app.js`
- `lesson-live.js`

Notes:

- this is the proving-ground runtime for Studio-authored lessons
- long-term direction says this should eventually converge visually with handcrafted player quality

---

## 3. Lesson 000 Deep Trace

### Runtime chain

`lesson-000-alphabet.html`
→ `data/studio-story-scenes.js`
→ `data/studio-characters.js`
→ `data/lesson000-letters.js`
→ `dialogue-engine.js`
→ inline Lesson 000 story/orientation scripts
→ `lesson.js`
→ `app.js`
→ `progress.js` / `sync.js` / `access.js` integrations

### What renders the orientation screen

The orientation screen is rendered directly from **inline script inside** `lesson-000-alphabet.html`.

Observed controls include:

- `[data-story-orientation]`
- `[data-orientation-target-label]`
- `[data-orientation-title]`
- `[data-orientation-explanation]`
- `[data-orientation-required]`
- `[data-orientation-start]`

The page defines an `orientationSteps` array inline and writes those values into the orientation DOM.

This means:

- orientation is **lesson-specific**
- orientation is **not currently owned by `dialogue-engine.js`**
- orientation is **not currently a general lesson-engine feature**

### What starts the story scene

The inline Lesson 000 script:

- loads story scene data from `window.ExpresateStudioStoryScenes`
- filters scenes where lesson slug matches Lesson 000
- finds the first ready scene
- marks intro mode active via:
  - `data-story-intro-active`
  - `lesson-story-scene-active`
  - `lesson-story-scene-ready`
- mounts the dialogue scene into `[data-story-dialogue-mount]`
- starts the dialogue by calling `window.ExpresateDialogueEngine.start(...)`

### Where dialogue lines come from

Dialogue lines come from `data/studio-story-scenes.js`.

For Lesson 000, matching scenes are selected by:

- `scene.lessonSlug === "lesson-000-alphabet"`
- `scene.status === "ready"`

The scene registry stores:

- `episodeId`
- `sceneOrder`
- `setting`
- `characters`
- `dialogue`
- `userPrompt`
- `teachingPoint`
- `activityPrompt`
- `outro`
- `status`

### How character IDs resolve

Character IDs resolve through `window.ExpresateStudioCharacters`.

`dialogue-engine.js` uses:

- `normalizeCharacterRef(...)`
- `displayCharacterName(...)`
- `registry.get(id)`

The story scene line may specify:

- speaker as string id, or
- object with `id` and `pose`

### How pose paths resolve

Pose paths resolve through:

- `ExpresateStudioCharacters.getPosePath(id, pose)`

Current behavior:

- look up character record by exact `id`
- if requested pose exists, use that path
- otherwise fallback to `neutral`
- otherwise return `null`

### How portrait images are loaded

`dialogue-engine.js`:

1. resolves speaker / pose
2. asks registry for pose path
3. creates an `Image()` probe
4. if load succeeds, uses the resolved portrait path
5. if load fails, falls back to generated avatar initials

This keeps missing assets from breaking the scene.

### How fallback initials appear

If no pose path exists or image load fails:

- the portrait image is hidden
- the fallback node becomes visible
- fallback text is first initial from display name

This is owned by `dialogue-engine.js`, not by lesson-specific code.

### How story mode hands off to lesson mode

Lesson 000 inline script is responsible for the handoff boundary.

Observed behavior:

- intro mode sets `data-story-intro-active="true"` on `<body>`
- intro/story classes hide normal lesson chrome through CSS and selector logic
- after dialogue completes, inline script removes:
  - `data-story-intro-active`
  - `lesson-story-scene-active`
  - `lesson-story-scene-ready`
- then normal lesson step mode becomes visible/usable

This handoff is **not owned by `dialogue-engine.js`**.
The engine only runs the scene and calls `onComplete`.

### How lesson cards advance

After intro mode ends, `lesson.js` owns normal lesson navigation.

Core model:

- every flashcard is a `.flashcard[data-fc-id]`
- one-card-at-a-time step mode is applied under `body.lesson-step-mode`
- buttons marked with `[data-fc-listo]` mark a card done
- `lesson.js` injects `Atrás` buttons and step meta where needed
- `showCard(index, direction)` drives which card is visible

Lesson 000 flashcards include:

- welcome
- personalize
- alphabet-grid
- phonics-intro
- exact-info
- name-spelling
- transition/summary

### How XP / progress / completion are handled

`lesson.js` handles lesson card completion gating and page-level lesson completion flow.

`progress.js` owns the actual durable state calculations:

- scoped storage key
- lesson done state
- XP total
- streak
- activity recording

`sync.js` bridges the progress state to Supabase for authenticated users.

For streak math:

- one lesson, quiz, or explicit practice activity counts as daily activity
- guest progress stays guest-scoped
- user progress is user-scoped

Lesson 000 therefore depends on:

- `lesson.js` for card lifecycle
- `progress.js` for XP/streak/completion state
- `sync.js` for authenticated persistence

---

## 4. Story System

### `dialogue-engine.js`
Purpose:

- reusable dialogue runtime
- shows one line at a time
- typewriter effect
- click/keyboard advance
- speaker/portrait switching
- callback when complete

What belongs here:

- scene playback rules
- portrait loading and fallback handling
- dialogue typing and advancement
- generic scene-mode presentation hooks

What should not belong here:

- lesson-specific story selection
- lesson progress handoff rules
- hardcoded Episode 1 copy

### `dialogue-engine.css`
Purpose:

- visual shell for reusable dialogue experience
- scene mode layout
- portrait stage
- dialogue box
- next button / location pill styling

What belongs here:

- reusable dialogue UI styling
- scene-mode layout rules
- portrait/fallback/avatar styles

Risk:

- visual responsibility currently overlaps with `lesson-flashcard.css` because Lesson 000 scene is embedded inside handcrafted lesson shell

### `data/studio-story-scenes.js`
Purpose:

- story scene registry
- canonical story data store

What belongs here:

- story content metadata
- episode ordering
- scene-to-lesson mapping
- speaker/pose references
- optional future quiz/story prompts

What should not belong here:

- rendering logic
- DOM assumptions
- lesson-specific CSS

### `data/studio-characters.js`
Purpose:

- named character registry
- community character registry
- pose path lookup
- basic normalization helpers

### `assets/backgrounds/`
Purpose:

- scene/environment backgrounds
- classroom/day scene and future story settings

Current role:

- used as atmospheric scene backdrops for dialogue/story scenes

### `assets/characters/`
Purpose:

- pose assets
- letter art
- teacher guide / classroom persona art
- future reusable story character assets

Current issue:

- this folder mixes several asset classes:
  - story characters
  - alphabet letter visuals
  - one-off lesson assets
  - alternate/untracked variants

That makes ownership harder to trace.

---

## 5. Character System

### Current named / known IDs

Observed registry IDs:

- `sofia`
- `alex`
- `emma`
- `community-cashier`
- `community-teacher`
- `community-waiter`
- `community-neighbor`

### Display names

Display name comes from registry data, not from filename.

Dialogue/render systems should use registry display names rather than constructing labels from ids.

### Pose names

Observed named pose sets:

**Sofia**

- `neutral`
- `happy`
- `confused`
- `thinking`
- `celebrating`
- `speaking`

**Alex**

- `neutral`
- `explaining`
- `pointing`
- `listening`
- `celebrating`

**Emma**

- `neutral`
- `greeting`
- `listening`
- `speaking`
- `surprised`

**Community teacher / professor**

- `neutral`
- `speaking`
- `pointing`
- `celebrating`

### Asset paths

Current registry stores direct relative asset paths such as:

- `assets/characters/sofia/happy.webp`
- `assets/characters/alex/explaining.webp`
- `assets/characters/emma/greeting.webp`
- `assets/characters/professor/neutral.webp`

### How `getPosePath` works

`getPosePath(id, pose)`:

1. finds registry entry by exact `id`
2. if requested pose exists, returns that path
3. otherwise falls back to `neutral`
4. otherwise returns `null`

### How community characters differ from named characters

Named characters:

- are central to recurring story use
- have richer role identity
- are expected to carry more consistent poses and tone

Community characters:

- are situation/role driven
- may exist without final art
- may be broader placeholders like cashier / waiter / teacher

### Professor identity

`professor` is the canonical registry and scene ID. The registry accepts the legacy
`community-teacher` ID as an alias so existing saved Studio scenes remain compatible.

### Where bugs happen if IDs / poses / filenames do not match

Common failure modes:

- scene references `teacher` but registry expects `professor`
- scene references pose not present in registry
- registry points to file path that does not exist
- filename case differs from registry path
- untracked alternate pose files exist but runtime still points at old tracked paths
- fallback initials appear unexpectedly even though artwork exists locally but is not referenced correctly

---

## 6. Lesson Engine

### `lesson.js`
Role:

- main handcrafted lesson controller
- owns flashcard step mode
- owns lesson progress bar rendering
- owns lesson HUD / next-card recommendations
- owns `Consejo` side panel system
- owns completion gating for `[data-fc-listo]`
- owns mini challenge/reto card behavior

### `lesson-flashcard.css`
Role:

- presentation for handcrafted lesson shell
- step cards
- flashcard transitions
- progress bar and HUD visuals
- consejo rail/panel styling
- lesson-specific shell behavior

### `data/lessons.js`
Role:

- canonical route map for handcrafted curriculum
- module definitions
- lesson order
- premium flags
- prerequisite chain
- href targets for page routes

### `data/lesson000-letters.js`
Role:

- Lesson 000 alphabet/phonics content registry
- local override adapter
- fallback defaults
- examples array per letter
- image/audio/tip values

Important detail:

- storage key is `expresate_admin_lesson000_letters_v1`
- lets Lesson 000 read local Studio/admin overrides without changing shipped defaults

### Lesson pages

Handcrafted lesson pages currently combine:

- HTML structure for each flashcard
- page-specific inline scripts
- shared runtime from `lesson.js`
- shared app shell from auth/progress/nav/app

### Flashcard lifecycle

From `lesson.js`:

1. locate `.flashcard[data-fc-id]`
2. determine card type via `data-fc-type` or heuristics
3. render sticky lesson progress UI
4. initialize one-card-at-a-time step mode
5. inject meta row and back buttons where needed
6. mark done when `[data-fc-listo]` is pressed
7. update progress fill and summary HUD
8. unlock final completion action only when required content cards are done

### `data-fc-id`

`data-fc-id` is the canonical card identifier inside handcrafted lesson pages.

It is used for:

- per-card completion state
- step sequencing
- progress tracking within the page
- lesson-specific navigation logic

### `data-fc-listo`

`[data-fc-listo]` is the main card completion action.

`lesson.js` intercepts it and:

- marks current card done
- advances step mode when relevant
- updates progress UI

### Progress bar

`lesson.js` renders the lesson progress bar into `[data-lesson-progress]`.

This bar is based on:

- section count
- current card index
- completed card set

It is distinct from course XP/streak totals.

### Lesson completion

Lesson completion is gated by `lesson.js`, but persisted by `progress.js`.

Typical path:

- all required cards marked done
- final CTA becomes valid
- completion call writes lesson done state with XP reward

### Card focus mode

Step mode is effectively the handcrafted card focus mode:

- non-current cards hidden
- active card animated in
- back/next flow controlled by `showCard(...)`

### Right panel / consejo behavior

Current `Consejo` system is runtime-generated by `lesson.js`:

- creates `.consejo-rail`
- injects `.consejo-tab`, `.consejo-panel`, `.consejo-toggle`
- uses active card’s `data-fc-tip` as the single source of tip content
- repositions relative to active card
- resets / closes when card changes

Risk:

- lesson HTML only supplies tip text
- layout/visibility logic is in JS + CSS split across shared files

---

## 7. Audio System

### `app.js`
Role:

- global app helpers
- primary audio helper registration
- manifest-first audio resolution
- legacy path fallback
- speech synthesis fallback
- auto-binding for elements with `data-audio` / `data-audio-fallback`

### Audio asset folders

Observed folders:

- `assets/audio/letters/`
- `assets/audio/words/`
- `assets/audio/phrases/`
- `assets/audio/lesson-intros/`

And metadata:

- `assets/audio/audio-manifest.json`
- `assets/audio/audio-inventory.json`

### `data-audio`

If an element has `data-audio`, `app.js` treats it as a concrete local audio source.

### `data-audio-fallback`

If no local file succeeds, `data-audio-fallback` provides the text to speak through speech synthesis fallback.

### Speech synthesis fallback

`app.js` currently:

- loads manifest URL from site base
- ranks installed English voices
- prefers better English voices where available
- supports phrase/word/letter fallback tuning
- exposes debug helpers:
  - `debugManifest`
  - `testAudio`
  - `clearAudioCache`
  - `debugVoices`
  - `previewVoice`

### Word / letter / phrase audio flow

Typical flow:

1. UI interaction targets element with `data-audio` and/or `data-audio-fallback`
2. `ExpresateAudio` checks manifest match first
3. if manifest file exists, play MP3
4. else try legacy source path
5. else use speech synthesis fallback

This means real MP3 files remain first priority.

---

## 8. Admin Studio

### `admin.html`
Role:

- single-page Studio shell
- section containers for dashboard, alphabet, lessons, vocabulary, media, creative libraries

### `admin.js`
Role:

- top-level Studio controller
- section activation
- local data CRUD orchestration
- preview rendering
- publishing buttons and cloud sync wiring
- media/vocabulary pickers
- creative library browsing

### `data/studio-*.js` files

Current major Studio data sources:

- `data/studio-media-library.js`
- `data/studio-vocabulary.js`
- `data/studio-lessons.js`
- `data/studio-publishing.js`
- `data/studio-experiences.js`
- `data/studio-themes.js`
- `data/studio-activities.js`
- `data/studio-animations.js`
- `data/studio-characters.js`
- `data/studio-story-scenes.js`
- `data/studio-lesson-renderer.js`

### What Studio currently edits

Observed functional areas:

- **Alphabet editor**: Lesson 000 letters and examples
- **Media library**: local asset metadata
- **Vocabulary database**: structured vocab records
- **Lessons**: block-based Studio lesson builder
- **Creative libraries**: read-only registry browser

### What is local draft data

Local-first Studio data includes:

- alphabet overrides
- media library
- vocabulary database
- lesson documents
- publish sync metadata

All of this starts in localStorage-backed registries.

### What appears connected to future Supabase publishing

Publishing-related path:

- `data/studio-publishing.js`
- `supabase/studio_publishing.sql`
- lesson builder publish/unpublish/sync actions in `admin.js`
- `lesson.html` + `lesson-live.js` as runtime consumer

### Where alphabet / vocabulary / quiz / media / characters / story scenes are controlled

- alphabet: `data/lesson000-letters.js` + Studio alphabet section in `admin.js`
- vocabulary: `data/studio-vocabulary.js` + vocabulary editor/picker in `admin.js`
- media: `data/studio-media-library.js` + media editor/picker in `admin.js`
- quiz content: currently block-level fields in Studio lesson builder
- characters: `data/studio-characters.js`
- story scenes: `data/studio-story-scenes.js`

---

## 9. Progress / Auth / Premium

### `progress.js`
Responsibility:

- canonical local progress state
- guest vs user scoping
- XP calculation
- streak calculation
- completed lessons/quizzes/practice activity
- debug helpers

Notable keys:

- legacy key migration
- guest key
- user key prefix

### `sync.js`
Responsibility:

- bridge between `Progress` state and Supabase `user_progress`
- switch scopes on auth change
- download authenticated cloud progress
- upload current scoped state
- keep guest data separate from user data

### `supabaseClient.js`
Responsibility:

- instantiate `window.supabaseClient`
- provide base client dependency for auth, publishing, profile, progress sync, devices

### `auth.js`
Responsibility:

- auth page controller
- login/signup mode
- safe redirect handling after login
- logout on auth page
- signed-in UI on auth page

### `access.js`
Responsibility:

- current session / cached profile authority
- premium status resolution
- device id generation
- premium device-limit policy
- premium lesson access checks
- redirect-to-pricing / devices flow

Important policy:

- premium requires active subscription + non-expired period
- plan column alone is not treated as authority

### `nav.js`
Responsibility:

- shared topbar/sidebar rendering
- primary navigation source of truth
- auth button/profile menu rendering in topbar
- admin link visibility by allowed admin emails

### `alerts.js`
Responsibility:

- user-facing alert/toast helper layer
- used by other systems to report premium blocks, success messages, etc.

---

## 10. Responsibility Map

| File/folder | Type | Owns | Depends on | Used by | Notes / risks |
|---|---|---|---|---|---|
| `index.html` | View | homepage entry | shared JS shell | learner | not a lesson runtime |
| `curso.html` | View | course route page | shared shell, `curso.js` | learner | integrates handcrafted + Studio-published lesson rows |
| `lesson-000-alphabet.html` | View / Controller | handcrafted Lesson 000 structure + inline orchestration | shared shell, `dialogue-engine.js`, `lesson.js`, data registries | learner | high inline-script complexity |
| `lesson-001-sounds.html` | View | handcrafted sounds lesson | shared shell, `lesson.js`, `speech-practice.js` | learner | simpler lesson runtime |
| `lesson.html` | View | live runtime shell for Studio lessons | shared shell, `lesson-live.js` | learner | separate runtime path from handcrafted lessons |
| `lesson.js` | Engine / Controller | handcrafted lesson card lifecycle | `progress.js`, `data/lessons.js`, DOM contract | handcrafted lesson pages | big shared controller with UI + gating + tip behavior |
| `lesson-flashcard.css` | Styling | handcrafted lesson shell visuals | lesson DOM shape | handcrafted lessons | overlaps visually with story scene embedding |
| `dialogue-engine.js` | Engine | reusable line-by-line dialogue player | `data/studio-characters.js` | Lesson 000, `dialogue-test.html`, future lessons | should stay generic |
| `dialogue-engine.css` | Styling | reusable dialogue UI | dialogue DOM contract | dialogue engine consumers | overlap risk with lesson CSS |
| `data/studio-story-scenes.js` | Data | story scene registry | none | dialogue/story renderers, Studio | source of truth for story copy |
| `data/studio-characters.js` | Data / Utility | character registry + pose path resolver | asset files | dialogue engine, preview renderer | id/pose/path mismatches are easy failure points |
| `assets/characters/` | Asset | character art + letter art | filesystem only | dialogue/lesson renders | mixed asset categories and duplicate variants |
| `assets/backgrounds/` | Asset | scene backgrounds | filesystem only | story/dialogue renders | should remain separate from character art |
| `data/lesson000-letters.js` | Data / Utility | Lesson 000 alphabet content + local override adapter | localStorage | Lesson 000, Studio alphabet editor, experiences | hybrid default + override source |
| `app.js` | Utility / Engine | audio helper + global behaviors | audio manifest, browser APIs | most pages | broad responsibility footprint |
| `progress.js` | Engine | XP, streak, completion state | localStorage | lessons, course, game, app shell | must remain single progress authority |
| `sync.js` | Controller / Utility | Supabase progress sync | `progress.js`, Supabase session | authenticated flows | scope boundaries must stay clean |
| `access.js` | Controller / Utility | premium + device-limit + session access rules | Supabase profile/session | nav, course, lessons, pricing | fail-open/fail-safe boundaries matter |
| `auth.js` | Controller | auth page behavior | Supabase auth, `access.js` | `auth.html` | redirect handling is sensitive |
| `nav.js` | Controller / View | shared navigation rendering | auth/session state | most pages | duplicate nav bugs happen if page has extra local nav |
| `alerts.js` | Utility | user alert surface | none | access, lessons, app | should remain presentation-only |
| `curso.js` | Controller | course route rendering, lock state, Studio lesson append | `data/lessons.js`, `access.js`, progress | `curso.html` | route logic and premium lock logic converge here |
| `juego-comida.js` | Controller | food game flow | speech practice, progress, app shell | `juego-comida.html` | game-specific XP activity path |
| `diccionario.js` | Controller | dictionary interactions | dictionary data / helpers | `diccionario.html` | controls should remain content-level, not nav-like |
| `admin.html` | View | Studio shell | Studio JS/data files | admin users | large single-page admin surface |
| `admin.js` | Controller | Studio UI orchestration | all Studio registries | `admin.html` | very large controller; hard to reason about in one file |
| `data/studio-lessons.js` | Data / Utility | Studio lesson document CRUD/normalization | localStorage | admin, live runtime | core builder storage |
| `data/studio-lesson-renderer.js` | Engine | Studio preview/live block renderer | vocab/story/experience registries | Studio preview, `lesson-live.js` | must avoid drifting from polished handcrafted UX |
| `lesson-live.js` | Controller | published Studio lesson runtime | renderer, publishing adapter, access, progress | `lesson.html` | second learner player path |
| `data/studio-publishing.js` | Utility / Adapter | frontend Supabase publishing adapter | `data/studio-lessons.js`, Supabase | admin, live runtime | mojibake visible in comments/header; also cloud/local sync complexity |
| `supabase/studio_publishing.sql` | Data / Backend schema | Studio cloud lesson tables/policies/functions | Supabase | deployment/docs | currently supports only listed block types in DB check constraint |
| `data/lessons.js` | Data | handcrafted course route | none | `curso.js`, `lesson.js` | canonical handcrafted route map |
| `speech-practice.js` | Engine | browser speech-recognition practice | browser APIs | sounds lesson, food game, live speech block | separate from audio playback system |

---

## 11. Known Confusing Areas

### 1. Inline scripts inside lesson HTML files

Lesson 000 in particular mixes:

- HTML content
- story/orientation state
- alphabet explorer logic
- personalization logic
- exact-info modal logic

This makes the page self-contained, but it also makes control tracing harder because page behavior is split between:

- inline JS
- `lesson.js`
- `app.js`
- data registries

### 2. Story scene data vs lesson-specific story controller

The story content itself lives correctly in `data/studio-story-scenes.js`, but:

- selection logic is lesson-specific
- handoff to lesson mode is lesson-specific
- intro/orientation flow is page-specific

The registry is clean; the orchestration is not yet centralized.

### 3. Professor ID compatibility

New scenes must use `professor`. The registry retains `community-teacher` as a
legacy alias for previously saved Studio data.

### 4. Placeholder fallback portraits

Fallback avatar behavior is good for resilience, but it can hide content/registry mistakes.

A broken pose path and a truly missing asset can look identical from the learner side.

### 5. Studio data vs runtime lesson data

There are two parallel lesson worlds:

- handcrafted runtime pages
- Studio lesson documents + live renderer

And a third hybrid point:

- Lesson 000 content registry with local admin overrides

That means not all content changes come from the same source of truth.

### 6. Local draft content vs published content

Studio currently has:

- local draft document
- local sync metadata
- cloud published lesson rows

This is correct for staged authoring, but it increases cognitive load when debugging why a lesson appears or does not appear.

### 7. CSS split between `dialogue-engine.css` and `lesson-flashcard.css`

The dialogue engine owns generic scene visuals.

Lesson 000 embeds those visuals inside handcrafted lesson shell constraints.

That creates a split where:

- dialogue system wants generic scene styling
- lesson page wants page-specific scene/layout hiding rules

This is a likely source of UI leakage and z-index/visibility bugs.

### 8. Character asset folder mixing

`assets/characters/` currently contains:

- story character poses
- letter art
- teacher-guide art
- loose variant files

This makes it harder to know which assets are runtime-canonical vs concept/working files.

### 9. Handcrafted player vs live Studio runtime

This is the broader architectural split:

- most course links open handcrafted pages
- `lesson.html` is a second player
- both can render lesson content, but not with the same exact UX standard

This is documented directionally elsewhere, but still a practical source of confusion in the codebase.

---

## 12. Recommended Next Architecture Steps

These are recommendations only. No implementation is implied by this document.

### Document next

1. Document the **handcrafted lesson page contract**:
   - required DOM markers
   - what `lesson.js` assumes
   - what page-local scripts are allowed to own

2. Document the **Studio lesson block schema** in one place with renderer expectations.

3. Document the **asset naming conventions** for:
   - characters
   - backgrounds
   - letter art
   - audio

### Eventually extract

1. Extract Lesson 000 story/orientation orchestration out of inline HTML script into a dedicated file.
2. Extract alphabet explorer modal logic into a reusable experience controller.
3. Separate character story art from alphabet letter art in `assets/characters/`.
4. Consider extracting the `Consejo` runtime from `lesson.js` into its own focused helper once behavior stabilizes.
5. Split `admin.js` into per-domain controllers once Studio behavior is stable enough to justify it.

### Keep stable

1. `progress.js` should remain the single XP/streak/completion authority.
2. `access.js` should remain the single premium/device-limit authority.
3. `data/lessons.js` should remain the handcrafted course route authority until migration is explicit.
4. `data/studio-story-scenes.js` should remain pure data, not view logic.
5. `data/studio-characters.js` should remain the single pose-path lookup registry.

### Avoid

1. Avoid duplicating story content inline in lesson pages.
2. Avoid adding a third learner-facing lesson player path.
3. Avoid letting `app.js` absorb more unrelated responsibilities.
4. Avoid hiding character asset/path bugs behind silent fallback without at least debug logging.
5. Avoid mixing published Studio content assumptions into handcrafted lesson routes until migration rules are explicit.

---

## Appendix: Specific Lesson 000 Control Notes

- Story intro visibility is controlled by body attributes/classes set inline in `lesson-000-alphabet.html`.
- Normal lesson card progression is controlled by `lesson.js`, not by the dialogue engine.
- Alphabet data is sourced from `data/lesson000-letters.js`, which already supports local override injection through Studio/admin.
- `dialogue-engine.js` is generic enough to reuse elsewhere, but Lesson 000 still owns the transition boundary into actual lesson mode.
- `Consejo` is shared handcrafted lesson infrastructure, not Lesson 000-specific UI.
