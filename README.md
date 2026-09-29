# Agriova

A farm ledger for Filipino smallholders. Record what you plant, spend, harvest
and sell, and see what the season is earning. Works offline, in Bisaya and
English. Pilot: Cagayan de Oro.

Expo SDK 57 · React Native 0.86 · expo-router · SQLite (Drizzle) · Jest · Maestro

## Run it

Needs Node 22+, and for Android a JDK 17 and the Android SDK.

```sh
npm install          # also points git at .githooks
npx expo run:android # first build ~15 min; later just `npx expo start`
```

Windows specifics (JDK 17 not 25, the spaceless SDK junction) are in
`.claude/skills/run-android/SKILL.md`.

In a development build, **Settings → Load a sample farm** fills every screen
with realistic data.

## Check it

| Command | What it does |
| --- | --- |
| `npm run verify` | Typecheck, lint, format check, all tests. The pre-push hook runs this. |
| `npm test` | Jest: `logic` (node, real SQLite via `node:sqlite`) and `ui` (jest-expo). |
| `npm run bundle:check` | Production bundle builds. |
| `npm run gen:routes` | Refresh typed routes after adding a screen, without Metro. |
| `maestro test .maestro/` | End-to-end on a device; see `.maestro/README.md`. |

CI (`.github/workflows/ci.yml`) runs the same checks plus `expo-doctor` on
every push and pull request.

## Layout

```
app/            Screens (expo-router). Tabs, record forms, settings.
src/db/         Schema, migrations, read.ts (queries), write.ts (writes + outbox), units
src/ui/         Design system primitives; screens only use these
src/features/   Pieces shared by screens (finance card, record forms)
src/i18n/       Strings in Bisaya and English, dates, labels
src/rules/      On-device rules (spoilage countdown)
drizzle/        Generated SQL migrations (`npm run db:generate`)
.maestro/       End-to-end flows
```

## Rules the code keeps

- **Money is integer centavos, quantities integer thousandths.** Never floats.
  Conversions live in `src/db/units.ts`.
- **Every write goes through `src/db/write.ts`**, which inserts the row and its
  sync outbox entry in one transaction.
- **Every string comes from `src/i18n/strings.ts`**, in both languages.
- **Screens are built from `src/ui`.** Compact type (15 body) on a 56dp touch
  grid, so wet or calloused fingers still hit targets. See `.claude/skills/agriova-ui`.

## Status

Done: design system, onboarding, all tabs on local data, record forms,
Supabase schema with row level security, email sign-in, sync, and the farm
assistant: weather and spoilage advice worked out on the phone, plus a chat
(Gemini, through the `ai-chat` Edge Function in `supabase/functions/`).
Next: store release.

Sign-in is by a 6-digit code sent to an email address (Supabase Auth, sent
through Mailjet). Without Supabase keys in `.env.local` (see `.env.example`)
the app signs in locally with any code and keeps everything on the phone.

Branching and commit conventions: `docs/branching.md`.
