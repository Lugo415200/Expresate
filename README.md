# Exprésate

Spanish-first English learning platform for hispanohablantes.

Production URL: https://expresate.co

## Native mobile

The Expo iOS/Android app lives in [apps/mobile](apps/mobile/README.md).
That guide includes the Windows physical-phone launcher, Expo Go setup,
shared account/progress architecture, verification, and remaining device tests.
The existing static website continues to run from this directory.

## Text Encoding

Learner-facing and source text must be valid UTF-8 and free of mojibake. Run
`node scripts/check-mojibake.js` before committing; the repository pre-commit
hook runs the same check against staged text files.
