# Privacy forms (draft answers)

Answers for Google Play's **Data safety** form and Apple's **App Privacy**
details. They must match `docs/privacy-policy.md` and `ios.privacyManifests`
in `app.json`; change all three together.

## Google Play: Data safety

- **Does the app collect or share user data?** Yes, collects. Not shared
  (service providers acting for us do not count as sharing).
- **Encrypted in transit?** Yes (HTTPS only).
- **Can users request deletion?** Yes, in the app (Settings → Delete my
  account), plus by email.

| Data type | Collected | Optional | Purpose |
| --- | --- | --- | --- |
| Personal info → Email address | Yes | No | Account management |
| Personal info → Name | Yes | No | App functionality |
| Personal info → Address (barangay only) | Yes | No | App functionality |
| Financial info → Other financial info (farm expenses and sales) | Yes | No | App functionality |
| App activity → Other user-generated content (assistant questions) | Yes | Yes | App functionality |

Not collected: location, contacts, photos, files, audio, health, device IDs,
crash logs, analytics.

**Account deletion URL** (Play requires one reachable outside the app): the
privacy policy's "Removing it" section, until a web form exists.

## Apple: App Privacy

- **Tracking:** No.
- **Data linked to the user**, all for **App Functionality**:
  - Contact Info → Email Address
  - Contact Info → Name
  - Contact Info → Physical Address (barangay only)
  - Financial Info → Other Financial Info (farm expenses and sales)
  - User Content → Other User Content (plots, plantings, harvests, assistant
    questions)
- **Not collected:** everything else.

These five are declared in `ios.privacyManifests.NSPrivacyCollectedDataTypes`.
The required-reason APIs declared there (user defaults, file timestamps,
system boot time, disk space) are the ones React Native and Expo modules use.
