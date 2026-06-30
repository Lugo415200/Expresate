# Theme System

## Purpose

The Theme System explains how Expresate separates:

- content
- activities
- presentation

This prevents lesson content from becoming tightly coupled to a single visual treatment.

## Architecture

### Content

Content is the educational material:

- vocabulary
- lesson copy
- examples
- translations
- media references

### Activity

Activity is the interaction pattern:

- flashcards
- alphabet explorer
- pronunciation lab
- quiz
- picture match
- sentence builder
- story mode

### Presentation

Presentation is how the content and activity are styled:

- themes
- surface systems
- textures
- animations
- characters
- sound feedback

## Rule

Do not hard-code presentation into content when the same content may be reused by another activity or theme later.

## Required theme fields

Each theme entry should describe:

- shell background model
- card surface model
- texture policy
- accent palette
- motion tone
- recommended activity pairings

## How this connects to Studio

Studio should eventually let a creator choose:

1. a lesson structure
2. one or more activities
3. a theme
4. optional animation presets

The stored lesson data should stay mostly content-first, with explicit references to activity and presentation layers.

The Creative Libraries Studio view is the current read-only foundation for browsing these theme, activity, experience, and animation registries before they become editable authoring tools.

## How this connects to Preview Renderer

The Preview Renderer should be able to apply:

- content data
- activity renderer
- theme metadata
- animation metadata

without changing the underlying lesson meaning.

## How this connects to Live Lesson Renderer

The Live Lesson Renderer should use the same contracts so preview and student playback remain close.
