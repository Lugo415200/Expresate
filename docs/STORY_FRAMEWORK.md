# STORY_FRAMEWORK.md

## Purpose

This file defines the implementation framework for story-guided learning in Exprésate.

It explains how story data should be structured, how it should connect to lessons, and how Codex should interpret story entries later in Studio, preview, and live rendering.

## Strategic goal

Exprésate is moving toward:

- lesson-driven story moments
- recurring characters
- reusable scenes
- short contextual dialogue
- meaningful mistakes that lead into instruction

This is not a branching RPG system yet.

## Story architecture

Each lesson may eventually support:

1. scene intro
2. dialogue
3. mistake or communication challenge
4. Spanish-first explanation
5. activity
6. practice
7. outro
8. completion

Not every lesson needs every part. The structure exists so future lesson builders have a shared pattern.

## Scene data contract

Each story scene should support:

- `id`
- `title`
- `lessonSlug`
- `chapter`
- `module`
- `characters`
- `setting`
- `studentGoal`
- `dialogue`
- `mistakeMoment`
- `teachingPoint`
- `activityPrompt`
- `outro`
- `suggestedActivity`
- `suggestedTheme`
- `suggestedAnimations`
- `status`

### Guidance

- `lessonSlug`: link to a lesson concept, not a file path.
- `characters`: use IDs from `data/studio-characters.js`.
- `dialogue`: short beats, not giant scripts.
- `mistakeMoment`: state the mistake and why it matters.
- `teachingPoint`: this is the curriculum anchor.
- `activityPrompt`: what practice should follow.
- `suggestedActivity`: point toward a reusable activity.
- `suggestedTheme`: point toward a registered theme.
- `suggestedAnimations`: point toward registered animations.

## Character data contract

Character entries should include:

- `id`
- `name`
- `role`
- `languages`
- `levelContext`
- `personality`
- `teachingFunction`
- `useFor`
- `avoidFor`
- `status`

## Connection to Studio

Short term:

- story data is read-only
- visible in Studio for planning/reference
- not required to publish lessons

Medium term:

- lesson builder can reference scenes
- story-aware blocks can be added
- Studio previews can render scene intros and dialogue beats

Long term:

- published lessons can include structured scene wrappers
- no-code authoring can pair activities with story moments

## Connection to Creative Libraries

Story should stay connected to:

- experiences
- activities
- themes
- animations

Examples:

- a scene can recommend `alphabet-explorer`
- a pronunciation moment can recommend `pronunciation-lab`
- a lighter scene can recommend `workbook-blue`
- a higher-energy reveal can recommend `soft-pop`

## Good story entry

```json
{
  "id": "story-iam-hungry-correction",
  "title": "Sofía tries to explain how she feels",
  "lessonSlug": "i-am-yo-estoy",
  "module": "survival-english",
  "characters": ["sofia", "alex"],
  "setting": "school break",
  "studentGoal": "Say how you feel with I am",
  "dialogue": [
    "Sofía: I hungry.",
    "Alex: Casi. En inglés decimos I am hungry."
  ],
  "mistakeMoment": "The learner drops the verb am.",
  "teachingPoint": "Use I am + feeling/state.",
  "activityPrompt": "Build and repeat I am hungry.",
  "suggestedActivity": "sentence-builder",
  "suggestedTheme": "workbook-blue",
  "suggestedAnimations": ["slide-fade", "soft-pop"],
  "status": "draft"
}
```

## What not to do

Do not:

- store giant novel-like scripts in one scene
- create scenes with no curriculum link
- invent a separate progress system for story
- require story for all lessons
- bypass the existing lesson rendering architecture

## Current status

This framework phase does **not** yet implement:

- branching choices
- story save states
- live lesson story renderer
- character dialogue UI
- story publishing workflow

It only establishes documentation and data foundations.
