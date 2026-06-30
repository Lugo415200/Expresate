# Style Library

## Purpose

The Style Library describes reusable presentation styles for Expresate experiences and interfaces.

This is not the same as raw CSS tokens. It is the creator-facing description of how a surface should feel.

Examples:

- workbook blue
- playful purple
- minimal clean

## What belongs here

Use the Style Library for:

- visual personality
- surface treatment
- texture usage
- border radius profile
- shadow depth
- card hierarchy
- contrast guidance

## What does NOT belong here

Do not store:

- lesson text
- activity behavior
- animation timing details only
- media assets as standalone records

Those belong in other libraries.

## Required fields

Each style entry should include:

- `id`
- `title`
- `summary`
- `tone`
- `surfaceModel`
- `textureUsage`
- `contrastModel`
- `recommendedFor`
- `avoidFor`
- `notes`

## Good entry example

```json
{
  "id": "workbook-blue",
  "title": "Workbook Blue",
  "summary": "Readable workbook cards with soft blue paper surfaces.",
  "tone": "calm, instructional, friendly",
  "surfaceModel": "light paper cards on a dark or neutral shell",
  "textureUsage": "visible but controlled on cards and learning panels",
  "contrastModel": "high text contrast on light surfaces",
  "recommendedFor": ["lessons", "modals", "guided practice"],
  "avoidFor": ["checkout flows", "dense admin tables"],
  "notes": "Default for early learning content."
}
```

## Bad entry example

Bad:

```json
{
  "id": "pretty-theme",
  "summary": "looks nice"
}
```

Why it is bad:

- not descriptive enough
- no usage guidance
- no contrast rules

## How Codex should interpret entries

Codex should use style entries as a design contract.

When implementing a feature, Codex should:

- match the style summary
- respect contrast requirements
- use the recommended surfaces
- avoid applying the style to blocked contexts

If runtime CSS already exists, Codex should extend it instead of replacing working styling arbitrarily.
