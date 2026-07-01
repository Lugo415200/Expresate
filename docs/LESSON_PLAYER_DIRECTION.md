# Lesson Player Direction

## Decision

The handcrafted Exprésate lesson experience is now the gold-standard lesson player.

This means pages like:

- `lesson-000-alphabet.html`
- `lesson-001-sounds.html`
- other handcrafted lesson pages

are no longer treated as legacy UI that should eventually be replaced by a different runtime feel.

Instead:

- the polished handcrafted lesson shell becomes the target learner experience
- Studio becomes the content factory
- story, characters, experiences, themes, and activities must eventually feed into that same player standard

`lesson.html?slug=...` remains useful as a Studio runtime and proving ground, but it should not become a permanently separate-feeling learner experience.

## Current Problem

The learner experience is currently split.

### Split 1: Course routing

Most course links still open handcrafted lesson pages directly.

Examples:

- `curso.html` mostly links to handcrafted lesson files
- current learner flow depends on those pages for the best polish and lesson-specific interactions

### Split 2: Story support

Story intros and some newer structured lesson behaviors currently appear only in:

- `lesson.html?slug=...`

That means:

- Studio-published lessons can benefit from newer story/runtime ideas
- handcrafted lessons can feel richer visually
- but the overall product experience is inconsistent

### Split 3: Runtime feel

Right now, the product has two lesson identities:

1. the handcrafted Exprésate lesson shell
2. the Studio runtime shell

If those keep diverging, the learner experience will feel fragmented.

## New Direction

### Course -> polished Exprésate Lesson Player

The course should ultimately lead learners into one coherent lesson experience:

- focused
- polished
- workbook-aware
- story-capable
- character-capable
- Spanish-first
- motion-aware
- audio/speech-enabled

That experience is currently best represented by the handcrafted lesson shell.

### Studio -> content factory

Studio should increasingly author:

- lesson structure
- story scenes
- experiences
- activities
- vocabulary
- media
- themes
- animations

But the output should eventually render inside the same Exprésate player style, not inside a second unrelated shell.

### Story/Characters -> optional layer inside the player

Story should become a reusable enhancement layer inside the player.

It should:

- support openings, transitions, partner moments, and checkpoint framing
- enrich the lesson
- remain optional
- never break access if story data is missing

Story is not the player itself.

## Short-Term Plan

### 1. Add optional story intro support to handcrafted Lesson 000 first

Lesson 000 is the safest prototype for the convergence.

Use:

- registry-based story scene lookup
- current story character system
- current pose-aware asset system

But keep the current Lesson 000 UI intact.

### 2. Do not migrate all lessons yet

Do not mass-convert all handcrafted lesson pages to the Studio runtime.

Do not reroute all course links into `lesson.html?slug=...` yet.

### 3. Keep current lesson UI intact

The handcrafted pages already contain:

- better bespoke interaction design
- stronger educational pacing
- more specific UX choices

Those should be preserved.

### 4. Avoid duplicate story rendering

If a lesson already includes a story intro through one safe mechanism, do not render it twice.

That matters especially during the convergence period, where:

- handcrafted lesson intros
- Studio story scene blocks
- auto-intro rendering

may coexist.

## Long-Term Plan

### 1. Unify handcrafted and Studio-rendered lessons under one player style

The future system should support:

- handcrafted-origin lesson patterns
- Studio-authored content
- shared renderer primitives
- shared shells and transitions

without making the learner feel they are jumping between two products.

### 2. Studio lessons should render with the same visual language

That means:

- same lesson shell hierarchy
- same navigation logic
- same workbook surfaces
- same story treatment
- same audio/speech affordances
- same reward and completion logic

### 3. Eventually retire separate-feeling runtime differences

`lesson.html?slug=...` can remain as a technical route or runtime entry point,
but the learner should not perceive it as a different lesson system.

## Rules

### Rule 1

Do not hard-code story content directly into lesson pages if registry lookup can be used safely.

### Rule 2

Do not break:

- lesson progress
- XP
- streaks
- speech practice
- audio
- premium gating
- course unlock behavior

### Rule 3

Do not force story on lessons without story data.

Lessons without story should continue working normally.

### Rule 4

Do not make `lesson.html` the only lesson path until the player experience is visually unified.

That would push the product into a mixed-standard experience too early.

## Practical Interpretation for Future Work

When building future lesson/player features:

- prefer reusable renderer/data architecture
- but measure decisions against the handcrafted lesson experience
- if Studio runtime and handcrafted runtime diverge, the handcrafted player sets the UX bar

When building story features:

- prototype first in Lesson 000 or another handcrafted lesson
- keep them optional
- move only when the player remains coherent

When building Studio:

- Studio should not only create content
- it should gradually learn how to target the real Exprésate lesson player

## What Should Happen Next

1. Add safe optional story intro support to handcrafted `lesson-000-alphabet.html`
2. Reuse the existing story registry and pose-aware character system
3. Keep Lesson 000 visually unchanged except for the added story layer
4. Confirm no duplicate story intro appears when explicit story content already exists
5. Use that as the convergence prototype before touching more lessons

## What Should Not Happen Yet

- do not mass-migrate all handcrafted lessons into `lesson.html`
- do not replace handcrafted shells with generic Studio cards
- do not force story intros on every lesson
- do not add branching logic yet
- do not make Studio runtime the only supported learner path yet
