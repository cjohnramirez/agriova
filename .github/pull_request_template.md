## What this changes

<!-- One or two sentences. What does the app do now that it did not before? -->

## Why

<!-- Link the goal this serves. If it comes from docs/context.md or the plan,
     say which part. "Farmers asked for automatic net profit" beats "added a view". -->

## How to check it

<!-- Steps a reviewer can actually follow on a device or simulator. -->

- [ ] `npm run verify` passes (typecheck, lint, format, tests); CI is green
- [ ] New logic has tests; schema changes come with a regenerated migration
- [ ] Checked on the emulator at 320dp and font scale 1.3 (see the `run-android` skill)
- [ ] Tested on a physical Android device

## Accessibility floor

<!-- Delete if this PR touches no UI. -->

- [ ] No text below 18sp except `fontSize.caption` on non-essential labels
- [ ] Every tappable control is at least 56dp on both axes
- [ ] All new user-facing strings are in `src/i18n/strings.ts` in both languages
- [ ] Spacing uses the `space` scale, no raw pixel values

## Notes for the reviewer

<!-- Anything you are unsure about, or chose deliberately and want challenged. -->
