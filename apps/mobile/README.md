# Exprésate native mobile

Expo / React Native application for iOS and Android. The static website stays
at the repository root. Mobile uses the existing Supabase account and
`user_progress` record; there is no second learner database.

## Run on your physical phone from this Windows computer

Install/update **Expo Go compatible with SDK 57** on your phone. The App Store
now offers Expo Go 57: https://apps.apple.com/us/app/expo-go/id982107779.
On Android, if the Play Store build reports an SDK mismatch, choose SDK 57 at
https://expo.dev/go and install the official Android build. SDK 57 requires
iOS 16.4 or newer. Stop any older Metro terminal with Ctrl+C before restarting.

Expo Go 57 requires an Expo account signed in on both the computer and phone.
In Expo Go, tap the avatar on its home screen and sign in. For the first launch,
add `-Login` to the command below to sign in interactively in the terminal too.
This is separate from your Exprésate learner account. See
https://expo.dev/changelog/expo-go-57-login.

In PowerShell:

```powershell
cd C:\Users\user\Desktop\Ynoel-english-site\apps\mobile
powershell -ExecutionPolicy Bypass -File .\start.ps1 -Clear
```

The process-level execution-policy flag applies only to this launcher; it does
not change the machine's policy. The launcher uses installed Node or the existing
Codex runtime and starts Metro on port 8081. `-Clear` rebuilds Metro's cache after
the SDK upgrade; it does not clear your account or progress. Dependencies are installed
on this computer. On another computer install Node 22 LTS or newer and pnpm 11
(`npm install --global pnpm@11`), then run `pnpm install --frozen-lockfile` here.

Keep this terminal open. Connect the computer and phone to the same private
Wi-Fi network. If Windows asks, allow Node on **Private networks**. Scan the QR
code with the iPhone Camera or Expo Go's Android scanner. If LAN discovery fails,
disable VPN/client isolation or use a shared phone hotspot; check port 8081 is
reachable. Use `start.ps1 -Port 8082` if 8081 is occupied.

Expect the blue Exprésate course screen, Sofía, account statistics, and the
Lesson 000 card. You can explore the complete lesson as a guest. Sign in with
your existing account to save completion. Signup uses the same Supabase email
confirmation flow: confirm in your email, then return and sign in in the app.
No Xcode, simulator, Apple Developer membership, or native development build is
required for this milestone. Keep the app foregrounded during the first load.

No environment variables are required. `shared/backend.json` contains the
website's **public** Supabase URL and anon key. `.env.example` documents optional
project overrides. Never place private credentials in `EXPO_PUBLIC_*` variables.

## What is implemented

- Native course and account screens, startup state, email/password login/signup,
  persisted sessions, token refresh on foreground, local logout, loading/retry UI.
- Lesson 000: story introduction, orientation, 26-letter explorer and images,
  recorded audio, recognition, CAT/MAP/BOOK sequences, WALK spelling, practical
  context, optional voice recording/playback, and the Sofía listening challenge.
- Canonical `lesson-000-alphabet` completion, 10 XP, duplicate reward prevention,
  account-specific pending completion queue, server confirmation and retry.
- XP and streak use shared browser/native helpers. Profile reads the web's
  `subscription_status` and `current_period_end` rule. Premium is read-only;
  no purchases or Premium lesson access are enabled.
- Reusable content contract, dialogue/choice/spelling/instruction/speech blocks,
  shared alphabet content and bundled references to existing assets.

## Synchronization and safety

Authenticated progress comes from Supabase. Mobile never uploads a general
device cache. Only explicit completion actions enter a queue keyed by user ID.
Failed writes remain pending; unconfirmed rewards are not shown as synced XP.
Guest exploration is intentionally not silently imported into an account.
Signing in at the final lesson screen retains that flow, so you can explicitly
save your result. Exit before saving does not award completion.

Both the modified web bridge and mobile use read/merge/compare-and-swap writes
against the existing `updated_at` column, with retries on conflicts. Confirmed
server completions win over stale entries. Opening/foregrounding mobile refreshes
state; focusing the local website refreshes its bridge. Replays add a practice
day without adding more XP. Streak calculations use local calendar days.

No database changes were executed or are required by this foundation, provided
the existing RLS permits a user to select/insert/update their own `user_progress`
row and read their `profiles` row. Live authenticated RLS/write behavior still
requires the physical account test below. Older deployed web clients still have
the older upload behavior until these web changes are deployed. Nothing was
pushed or deployed in this pass.

The shared completion merge is additive. Cross-device deletion/reset semantics
still need explicit tombstones or a server revision contract. Private Studio
localStorage overrides are not treated as published course content. CMS publishing
and Premium device enforcement remain web-only. The shared JSON progress system
retains the web's client-derived reward model; server-validated rewards are future
backend work.

## Checks

From this directory, with Node/pnpm on PATH:

```powershell
pnpm typecheck
pnpm exec expo install --check
pnpm export
```

From the repository root:

```powershell
node --test tests/*.test.cjs
node tests/browser-smoke.cjs
```

The browser smoke test needs Playwright on NODE_PATH and Chrome (or
`PLAYWRIGHT_CHANNEL=msedge`). It runs the exported React Native web preview,
including real audio and the complete guest lesson flow, then five original web
routes. It also tests rejected login, signup confirmation, login, persistent
session reload, failed-write queue/retry, Premium reads, logout, and both
directions of web/mobile progress exchange
against an explicitly mocked Supabase response layer. This is **not** a
native-device test or proof of live authenticated database permissions.

## Required account/device acceptance test

1. Open the app on a physical phone and sign in with an existing account.
2. Complete Lesson 000; tap **Guardar progreso**. Confirm there is no pending or
   error state. Expect +10 XP only if the lesson was not already complete.
3. Open this **local** website as the same account; refresh/focus the course.
   Confirm `lesson-000-alphabet` completion, XP, and streak.
4. Complete a different lesson on web, foreground mobile, and verify the increase.
5. Force-close/reopen the app; confirm session persistence. Sign out and into a
   different account; confirm no learner state leaks between accounts.
6. Finish the lesson offline, tap save, then reconnect and tap retry/refresh.
   Confirm pending progress clears and replay never duplicates XP.
7. Check iPhone and Android audio, recording permission denial, backgrounding,
   keyboard layouts, and hardware Back. Recordings are local cache only and have
   no automated pronunciation score.

No authenticated test user or physical phone was available to the automated
development session. Do not interpret compilation or mocked concurrency tests
as proof that the above acceptance test passed.

## Next migration

Lesson 001 sounds is the next target after physical account acceptance: extend
the shared block renderer with recorded word/minimal-pair audio, then adapt
published Studio block data. Remaining work includes native course coverage,
full CMS content delivery, pronunciation assessment, premium entitlement/device
enforcement, account recovery/deep links, robust offline downloads, store builds,
and accessibility/device QA.
