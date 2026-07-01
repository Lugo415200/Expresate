# Season 1

## Premise

Season 1 is the learner's first contact with English inside a guided class environment.

The season starts small:

- the learner enters class
- Sofia is also new and acts as the learner's in-world partner
- the teacher introduces the alphabet, key sounds, and early classroom confidence
- Alex explains difficult points in Spanish when the learner needs clarity

The curriculum stays in control.
The story gives lessons purpose, continuity, and emotional context.

## Episode 1

**Title:** Welcome to Class

Episode 1 covers the first classroom experience:

1. Sofia introduces herself in Spanish and admits this is also her first day learning English.
2. The learner is invited to identify themselves and join the class.
3. The teacher explains why the alphabet matters for exact information.
4. The class moves into letters, name spelling, and key sounds.
5. The teacher pairs the class.
6. Sofia becomes the learner's practice partner for active recall and review.
7. The episode closes with a Module 0 checkpoint.

## Episode 1 Learning Goals

- understand that the alphabet supports exact information
- spell a name clearly
- notice that English sounds differ from Spanish expectations
- begin listening for key sound contrasts
- move from recognition into guided recall
- finish Module 0 with enough confidence to enter early beginner English

## Mapping to Current Module 0

Episode 1 is mapped onto existing Module 0 content. No lesson rewrite is required.

| Story beat | Current lesson/step | Purpose |
| --- | --- | --- |
| Welcome to Class | `lesson-000-alphabet` | Sets up Sofia, the teacher, and the first-day classroom context |
| Alphabet Practice Together | `lesson-000-alphabet` | Connects alphabet tiles and name spelling to real classroom use |
| Key English Sounds | `lesson-001-sounds` | Introduces phonetics and why English sounds need special attention |
| Pair Up With Sofia | `lesson-000-syllables` | Shifts from teacher-led explanation to partner review and active recall |
| Module 0 Checkpoint | `quiz-000` | Confirms alphabet, sound awareness, and early listening recall |

## Scene-by-Scene Structure

### Scene 1 — Welcome to Class

- Setting: English class on the first day
- Characters: Sofia, teacher
- Sofia introduces herself in Spanish
- The learner is welcomed into the class
- The teacher frames the alphabet as the foundation

### Scene 2 — Alphabet Practice Together

- Setting: front board with alphabet tiles
- The teacher introduces letter practice
- Sofia practices spelling her name
- The learner is invited to spell their own name

### Scene 3 — Key English Sounds

- Setting: pronunciation practice at the front of class
- The teacher introduces SH, CH, TH, and the idea that English sounds can change
- Alex explains in Spanish why this feels different from Spanish reading patterns

### Scene 4 — Pair Up With Sofia

- Setting: partner practice after guided instruction
- The teacher pairs the class
- Sofia becomes the learner's partner
- Review moves into active recall

### Scene 5 — Module 0 Checkpoint

- Setting: short review before moving into Module 1
- The teacher asks review questions
- Sofia reflects on what has improved
- The learner confirms the foundations before advancing

## What Is Visible Now

At this phase, Episode 1 is mainly a structured story registry and planning layer.

Visible now:

- story scenes can be selected in Studio
- story metadata is available to previews/live rendering when a story scene block is used
- scenes now include Episode 1 ordering and lesson mapping

Not visible yet by default:

- automatic story injection into handcrafted lessons
- a dedicated episode shell on the course page
- mandatory story flow between existing lessons

## What Is Stored for Later

The story scene data now stores fields that support later expansion:

- `episodeId`
- `sceneOrder`
- `lessonSlug`
- `setting`
- `characters` with pose objects
- `dialogue`
- `userPrompt`
- `mistakeMoment`
- `teachingPoint`
- `activityPrompt`
- `quizPromptMetadata`
- `outro`
- `status`

This supports future:

- story-first lesson intros
- partner scenes with Sofia
- checkpoint framing
- scene-aware quizzes
- audio-driven review prompts

## What Should Wait Until Later

These should not be built in this phase:

- branching story logic
- persistent story state by learner choice
- mandatory story scenes in every lesson
- custom story UI on curso.html
- a new quiz engine just for story checkpoints
- large scripted dialogue scenes replacing lesson instruction

## Guidance for Future Implementation

- keep scenes short
- keep Spanish-first explanations central
- use Sofia as a learner mirror, not a mascot
- use Alex for clarification and transition
- use the teacher for structure and authority
- use Emma and community characters when authentic English input is needed
- let curriculum decide what the learner must master
- let story explain why the learner is practicing it now
