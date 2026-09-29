---
name: release-checklist
description: Use before building or submitting Agriova for the App Store or Google Play, publishing an over-the-air update, or bumping the version - covers EAS profiles, environment variables, privacy forms, account deletion and store assets.
---

# Releasing Agriova

Builds run on EAS (`eas.json`); iOS cannot be built on this Windows machine.
John runs every EAS command that uploads, builds, submits or publishes, as he
does with git. Hand him the commands. Installing `eas-cli` globally is a
download: announce it first.

## Profiles

| Profile | Installs as | Update channel | Use |
| --- | --- | --- | --- |
| `development` | dev client, internal | `development` | day-to-day work on a real phone |
| `preview` | APK / iOS ad hoc, internal | `preview` | testers and the pilot farmers |
| `production` | store bundle | `production` | App Store and Play |

Build numbers come from EAS (`appVersionSource: remote`, `autoIncrement`).
`version` in `app.json` is the one people see; raise it for each store release.

## Over-the-air updates or a new build?

`runtimeVersion` uses the `fingerprint` policy: an update only reaches builds
with the same native code. JS, strings, screens and assets can go out as an
update (`eas update --channel preview --message "..."`). A new or upgraded
package with native code, an Expo SDK bump, or a change to `app.json` plugins,
permissions or icons needs a new build. When unsure, run
`npx expo-updates fingerprint:generate` before and after the change and compare.

Test an update on `preview` before sending it to `production`.

## Environment variables

`.env.local` never leaves this machine, so EAS builds do not see it. Each EAS
environment (`development`, `preview`, `production`) needs:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

set with `eas env:create --environment <env> --name <NAME> --value <value>
--visibility plaintext` (they are public by design; the publishable key is
protected by row level security). Never add the service role or secret key,
the Gemini key, or the database password: those live only in Supabase
secrets. A build without the two variables signs in locally and syncs nothing,
so check Settings shows the account email after signing in.

## Before every store submission

1. `npm run verify`, `npm run bundle:check` and `npx expo-doctor` pass; CI is
   green on `dev`.
2. The Supabase migrations and both Edge Functions (`ai-chat`,
   `delete-account`) are deployed to the project the build points at.
3. On a `preview` build on a real phone: sign up with a new email, record an
   expense, harvest and sale, see Home update, ask the assistant a question,
   sign out and back in (records return), then **Settings → Delete my
   account** and confirm the account is gone in the Supabase dashboard.
4. Privacy: `docs/privacy-policy.md`, `docs/store/data-safety.md` and
   `ios.privacyManifests` in `app.json` agree. Any new data the app collects,
   new third party it sends data to, or new permission changes all three.
5. `PRIVACY_POLICY_URL` opens without signing in, and a test message to
   `SUPPORT_EMAIL` (`src/links.ts`) arrives: both stores reject listings whose
   contact address bounces.
6. Store text and screenshots in `docs/store/listing.md` match the build, in
   both languages.

## Before the first public release

These are open and block a public listing:

- **Hero photo licence.** `assets/images/hero-field.jpg` came from the Figma
  file with no known licence (`assets/images/CREDITS.md`). Confirm or replace.
- **Weather licence.** Open-Meteo's free API is non-commercial. A paid tier or
  a commercial plan is needed once the app earns money (premium tier, shop).
- **Assistant provider.** Move `ai-chat` from the AI Studio free tier to Vertex
  AI; the free tier may use prompts to improve Google's models, which the
  privacy policy does not allow for.
- **Bisaya review** by a native speaker, strings and store text.
- **Accounts:** Apple Developer Program ($99/year) and Google Play Console
  ($25 once), both in the name the listing will show.
- **Play testing track:** a new personal Play account must run a closed test
  with at least 12 testers for 14 days before production access.
- **Maestro flows** pass on a release build (`.maestro/`).
