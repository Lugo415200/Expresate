# Animation Library

## Purpose

The Animation Library defines approved motion patterns for Expresate.

This library exists so future animations stay consistent and do not become random one-off effects.

## What belongs here

Store:

- motion name
- purpose
- trigger
- duration range
- easing
- reduced-motion fallback
- usage guidance

## What does NOT belong here

Do not store:

- raw asset files
- lesson copy
- unrelated CSS snippets without context

## Required fields

Each animation entry should include:

- `id`
- `title`
- `summary`
- `trigger`
- `motionType`
- `duration`
- `reducedMotion`
- `recommendedFor`
- `avoidFor`
- `notes`

## Good entry example

```json
{
  "id": "soft-pop",
  "title": "Soft Pop",
  "summary": "Small scale-up and settle motion for newly active elements.",
  "trigger": "on reveal or selection",
  "motionType": "scale and opacity",
  "duration": "160ms-240ms",
  "reducedMotion": "replace with opacity only",
  "recommendedFor": ["chips", "cards", "success feedback"],
  "avoidFor": ["paragraph text", "full-page transitions"],
  "notes": "Keep it subtle."
}
```

## How Codex should interpret entries

Codex should use the Animation Library to:

- select motion intentionally
- keep timing consistent
- respect reduced-motion
- avoid decorative motion that harms readability
