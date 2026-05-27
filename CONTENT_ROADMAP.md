# Exprésate Content Roadmap

Exprésate is a Spanish-first English learning site for hispanohablantes. The lessons should feel guided, practical, and worth paying for: short explanations in Spanish, clear English examples, immediate practice, review, and optional speech practice where it naturally helps.

## Audit Summary

### Polished Already

- `lesson-000-alphabet.html`: strongest current lesson. It has a guided card flow, A-Z practice, vowels, name spelling, useful phrases, a mini challenge, and a summary. Keep this as the model for future foundation lessons.
- `curso.html` + `data/lessons.js`: course route and unlock structure are clear. Existing IDs should be preserved because progress, quizzes, and locks depend on them.
- `lesson.js`: reusable lesson controller is strong. It supports one-card-at-a-time lessons, progress HUD, mini retos, section completion gating, and summary flow.
- `speech-practice.js`: ready for optional pronunciation practice in vocabulary, phrase, and speaking drills.

### Functional But Needs More Educational Weight

- `lesson-001-sounds.html`: useful content, but it should become the pronunciation flagship for Spanish speakers. Needs clearer objectives, stronger “why this matters,” common Spanish-speaker mistakes, and optional speech practice.
- `Syllables.html`: good topic and examples, but it still feels more like a draft. It needs less inline styling, clearer objective/review cards, more guided listening, and speech practice for stress patterns.
- `lesson-001.html`: good grammar template, but needs more context, more real-life examples, common mistakes, and speaking output.
- `lesson-002.html`: functional Do/Does lesson. Needs more contrast between Spanish question order and English helper-verb structure, more short-answer practice, and speaking practice.
- `lesson-003.html`: functional negation lesson. Needs more natural contractions, common mistakes, and conversational examples.

### Weak Or Outdated

- `lessons.html`: outdated compared with the course route. It still shows old side panels and placeholder access actions. It should eventually become either a simple lesson index or redirect users toward `curso.html`.
- Premium grammar lessons are structurally consistent but still feel “template-like.” They need more learner guidance and more practice variety to feel premium.

## Recommended Lesson Roadmap

### Module 0: Foundation

Current:
- Alphabet
- Key English sounds
- Syllables and stress

Next:
- Basic pronunciation patterns: silent letters, final consonants, word endings, and “English is not read like Spanish.”
- Listening habits for beginners: slow audio, shadowing, repetition, and self-check.

### Module 1: Survival English

Add:
- Greetings and introductions
- Saying your name
- Where are you from?
- Numbers 1-20
- Days, months, and time
- Basic classroom questions

Current production lessons:
- `lesson-004-greetings.html`: greetings, names, introductions, and first speaking practice.
- `lesson-005-classroom-phrases.html`: classroom/app survival phrases.
- `lesson-006-identity-place.html`: origin, city, language, and learning status.
- `lesson-007-basic-questions.html`: basic questions and help phrases.
- `lesson-008-numbers-1-20.html`: numbers 1-20, age, quantity, and optional speech practice.

### Module 2: Everyday Words

Add:
- Food
- Home
- Clothes
- Places
- Family
- Work and school

### Module 3: Core Grammar

Current:
- Pronouns + present verbs
- Do/Does questions
- Don’t/Doesn’t negatives

Add:
- I am / You are
- I have / You have
- There is / There are
- Articles: a/an/the
- Plurals
- Simple present habits and routines

### Module 4: Speaking Practice

Add:
- Repeat words
- Short phrases
- Question/answer practice
- Listening and responding
- Roleplay cards for real situations

## Speech Practice Integration Plan

Use `speech-practice.js` where speaking is the task, not as decoration.

Best early targets:
- `lesson-001-sounds.html`: repeat key sounds and a short sentence.
- `Syllables.html`: say stress-pattern words such as `comfortable`, `family`, and `camera`.
- `lesson-001.html`: say simple present sentences like `I work here` and `She studies English`.
- `lesson-002.html`: say questions like `Do you work?` and `Does she live here?`.
- `lesson-003.html`: say contractions like `I don't work` and `She doesn't live here`.
- `juego-comida.html`: already integrated for vocabulary.

Rules:
- Speech practice must be optional.
- Unsupported browsers must show a friendly message and keep the lesson usable.
- Do not require speech for completion yet.

## First Safe Content Upgrade

Upgrade `lesson-001-sounds.html` because:
- It is already unlocked after Lesson 000.
- It is about pronunciation, so speech practice fits naturally.
- It can be improved without changing lesson IDs, quiz IDs, premium gates, or Supabase logic.

Scope:
- Add clearer objectives and Spanish-speaker pronunciation framing.
- Add a focused speech practice card.
- Keep all existing progress/unlock behavior.
- Preserve `data-lesson-id="lesson-001-sounds"`.
- Preserve the lesson card/progress structure used by `lesson.js`.
