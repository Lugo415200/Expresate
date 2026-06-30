# STORY_BIBLE.md

## Purpose

This file defines the narrative foundation for Exprésate. It is not a script dump and it is not a replacement for the curriculum. Its purpose is to keep story, character behavior, and learning goals aligned as the platform grows.

The core rule is simple:

- the curriculum drives the story
- the story gives the curriculum purpose

Story should make learners care about why a phrase matters. It should never slow the lesson down or bury the learning objective under decorative dialogue.

## Story role inside Exprésate

Exprésate is still a Spanish-first English learning product. Story is there to:

- give repeated characters and situations to the learner
- create believable communication mistakes
- make vocabulary and grammar feel useful
- help lessons flow from context -> explanation -> practice

Story is not there to:

- replace direct teaching
- become a long visual novel
- force every lesson into a dramatic plot
- distract from beginner clarity

## Core cast

### 1. Sofía — The Learner

- Role: learner point-of-view character
- Native language: Spanish
- English level: beginner
- Function: makes realistic mistakes, asks natural questions, improves over time
- Tone: curious, a little unsure, but proactive

### 2. Alex — The Bilingual Guide

- Role: guide / explainer
- Languages: Spanish + English
- Function: gives Spanish-first support and bridges confusion into understanding
- Tone: patient, clear, supportive, direct

### 3. Emma — The Native Speaker

- Role: natural English input
- Function: introduces real phrasing, pronunciation, and listening challenge
- Tone: warm, natural, not too fast, supportive

### 4. Community Characters

Examples:

- cashier
- teacher
- coworker
- neighbor
- waiter
- receptionist

Function:

- create real-world situations
- expose useful English in context
- vary setting without expanding the core cast too much

## Story design rules

### Short moments, not long scenes

Each story beat should feel like:

1. situation
2. communication challenge
3. explanation
4. activity
5. quick resolution

### Mistakes must teach something

Good:

- "I hungry" -> "I am hungry"
- incorrect spelling of a name
- misunderstanding a question

Bad:

- random mistakes with no teaching point
- errors too advanced for the module
- drama unrelated to the lesson

### Spanish-first remains central

Even in story mode:

- explanations stay understandable in Spanish
- key teaching points are clarified in Spanish
- the learner should not feel lost inside English-only dialogue

## Sample scene anchors

### Lesson 000 — Alphabet / spelling your name

- Situation: Sofía needs to give her name clearly.
- Challenge: another person cannot write it correctly unless she spells it.
- Teaching point: the alphabet helps give exact information.

### Greetings

- Situation: Sofía meets someone for the first time.
- Challenge: she can greet, but needs a full introduction.
- Teaching point: hello, my name is..., nice to meet you.

### "I hungry" correction

- Situation: Sofía wants to say how she feels.
- Challenge: she says "I hungry."
- Teaching point: English needs "I am hungry."

### Ordering food

- Situation: Sofía orders something simple.
- Challenge: she needs useful food phrases and polite request structure.
- Teaching point: I want..., can I have..., please.

## What not to do

Do not:

- hard-code giant stories into lesson HTML
- make every lesson depend on a scene
- write long theatrical dialogue blocks
- create story beats with no activity payoff
- force humor into moments that need clarity

## How Codex should use this file

When asked to build future story features, Codex should:

1. start from the lesson objective
2. choose the smallest useful scene that supports that objective
3. use existing characters when possible
4. keep scenes brief and teachable
5. preserve Spanish-first clarity
6. connect scene -> explanation -> activity -> resolution

## Relationship to Studio

This story bible feeds:

- `data/studio-characters.js`
- `data/studio-story-scenes.js`
- future Studio Story tools
- future story-aware lesson blocks
- future lesson preview and live rendering

It does not yet make story required for lessons.
