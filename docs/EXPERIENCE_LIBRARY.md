# Experience Library

## Purpose

The Experience Library defines reusable learning experiences that go beyond basic lesson blocks.

Examples:

- Alphabet Explorer
- Flashcards
- Pronunciation Lab
- Picture Match
- Sentence Builder
- Story Mode

An experience is not lesson copy. It is a structured interactive pattern that can be reused across many lessons.

## What belongs here

Use the Experience Library for entries that define:

- the experience name
- the learner goal
- the interaction model
- the renderer key
- the supported data inputs
- the supported themes and animations
- implementation notes for Studio Preview and the Live Lesson Engine

## What does NOT belong here

Do not store:

- raw lesson text
- vocabulary records
- media records
- one-off copy variations
- Stripe/auth/admin logic

Those belong in lesson content, vocabulary, or media storage instead.

## Required fields

Every experience entry should include:

- `id`
- `title`
- `summary`
- `category`
- `rendererKey`
- `studioBlockType`
- `status`
- `studentGoal`
- `contentInputs`
- `settingsSchema`
- `supportedThemes`
- `supportedAnimations`
- `notes`

## Good entry example

```json
{
  "id": "alphabet-explorer",
  "title": "Alphabet Explorer",
  "summary": "Interactive letter grid with audio and exploration modals.",
  "category": "foundation",
  "rendererKey": "alphabet-explorer",
  "studioBlockType": "experience",
  "status": "active",
  "studentGoal": "Recognize letters and connect them to sounds and examples.",
  "contentInputs": ["alphabet dataset", "image assets", "audio assets"],
  "settingsSchema": ["title", "subtitle", "showVowels", "enableLetterModal", "theme", "dataset"],
  "supportedThemes": ["workbook-blue", "playful-purple", "minimal-clean"],
  "supportedAnimations": ["slide-fade", "soft-pop"],
  "notes": "Used by Lesson 000 and the Studio experience block."
}
```

## Bad entry example

Bad:

```json
{
  "name": "cool thing",
  "stuff": "maybe cards and a game",
  "notes": "figure it out later"
}
```

Why it is bad:

- no renderer key
- no clear purpose
- no input contract
- impossible for Codex to implement consistently

## How Codex should interpret entries

Codex should treat each experience entry as:

1. a reusable UX pattern
2. a contract for required data
3. a source of implementation intent
4. a consistency guide for future Studio blocks and live lesson rendering

If an experience entry conflicts with live code, Codex should preserve working runtime behavior and extend the library entry to match the implementation.

## Studio connection

Studio uses experience entries to:

- populate visual block choices
- explain what an experience does
- define supported settings
- inform creator-facing preview behavior

## Preview Renderer connection

The Studio Preview Renderer should use the experience entry to decide:

- which renderer key to call
- which settings to expose
- which theme and animation combinations are valid

## Live Lesson Renderer connection

The Live Lesson Renderer should use the same renderer key and settings contract so Studio preview and student playback stay aligned.
