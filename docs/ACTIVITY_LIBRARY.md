# Activity Library

## Purpose

The Activity Library defines reusable learning activities.

Activities are smaller than full experiences. They can live inside lessons, experiences, or quizzes.

Examples:

- flashcards
- picture match
- sentence builder
- pronunciation lab

## What belongs here

Use this library for:

- learner task patterns
- input/output expectations
- scoring behavior
- feedback style
- completion behavior

## What does NOT belong here

Do not store:

- one specific lesson's copy
- vocabulary items themselves
- theme-only definitions
- admin workflow rules

## Required fields

Each activity entry should include:

- `id`
- `title`
- `summary`
- `interactionType`
- `studentGoal`
- `requiredInputs`
- `feedbackModel`
- `completionModel`
- `supportedThemes`
- `supportedAnimations`
- `notes`

## Good entry example

```json
{
  "id": "picture-match",
  "title": "Picture Match",
  "summary": "Match an image to the correct word or phrase.",
  "interactionType": "selection",
  "studentGoal": "Connect visual meaning to language quickly.",
  "requiredInputs": ["choices", "correct answer", "optional media"],
  "feedbackModel": "immediate correct or wrong feedback",
  "completionModel": "step completes after one correct selection",
  "supportedThemes": ["workbook-blue", "playful-purple"],
  "supportedAnimations": ["soft-pop", "wrong-shake", "correct-confetti"],
  "notes": "Useful for vocabulary-heavy lessons."
}
```

## How Codex should interpret entries

Codex should treat each activity as:

- a reusable interaction contract
- a building block for Studio
- a candidate for no-code lesson authoring later

If a feature is not implemented yet, Codex should still keep the data shape stable and document what is missing.
