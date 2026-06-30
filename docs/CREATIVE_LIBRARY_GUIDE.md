# Creative Library Guide

## Purpose

This guide is for the founder. Use it to turn raw ideas into structured library entries that Codex can implement consistently later.

## What to store

Store future ideas in one of these buckets:

### Experiences

Use when the idea is a reusable learning flow.

Examples:

- alphabet explorer
- pronunciation lab
- story mode

### Activities

Use when the idea is a smaller reusable task pattern.

Examples:

- flashcards
- picture match
- sentence builder

### Styles and Themes

Use when the idea is about look and feel.

Examples:

- workbook paper lesson look
- dark premium shell
- playful purple practice mode

### Animations

Use when the idea is specifically motion.

Examples:

- soft card pop
- correct answer confetti
- wrong answer shake

### Character and UX references

Use when the idea is about:

- guide characters
- onboarding scenes
- modal composition
- navigation patterns

## How to turn a raw idea into a structured entry

Start with the raw idea:

- screenshot from Canva or Figma
- written note
- animation reference
- lesson/game concept

Then write:

1. Name
2. Purpose
3. Student goal
4. Interaction type
5. Inputs required
6. Output/feedback
7. Visual tone
8. Theme pairing
9. Animation pairing
10. Where it should be used
11. Where it should not be used

## Example conversion

Raw idea:

"I want a workbook-style phonics activity where the student taps letters and hears examples."

Structured result:

- Experience: Alphabet Explorer
- Activity: tap-to-hear letter exploration
- Theme: workbook-blue
- Animation: soft-pop
- Inputs: letter dataset, example words, images, audio
- Student goal: connect letters to sounds and examples

## Good founder note example

Good:

```text
Experience idea: Story Mode
Purpose: Guided mini-story where the learner taps through a scene and hears target vocabulary.
Student goal: Understand vocabulary in context.
Use for: early reading, beginner comprehension.
Theme: playful-purple.
Animations: slide-fade, soft-pop.
Avoid for: dense grammar explanations.
Reference: Figma screenshot + Duolingo story pacing.
```

## Bad founder note example

Bad:

```text
Make it fun and maybe animated.
```

Why it is bad:

- no goal
- no interaction model
- no constraints
- no implementation direction

## How Codex should use these libraries later

When you give Codex a request, Codex should:

1. look up matching experience/activity/theme/animation entries
2. preserve existing contracts
3. implement the new feature in that shared vocabulary
4. avoid inventing a fresh pattern when an existing library entry already fits

## Recommended next habit

Whenever you collect:

- a screenshot
- a Canva mockup
- a game idea
- a lesson flow note
- a motion reference

turn it into a structured entry before asking for implementation.

That will make Studio more consistent and reduce rework.
