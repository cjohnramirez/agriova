# End-to-end flows

[Maestro](https://maestro.mobile.dev) drives the installed app on an emulator
or phone. Install it once (a Java CLI, about 100 MB, into `~/.maestro`):

```sh
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

A debug build (`npx expo run:android`) loads its code from Metro, so start
Metro and forward the port first:

```sh
npx expo start --port 8081
adb reverse tcp:8081 tcp:8081
maestro test .maestro/
```

A release or preview build carries its own bundle and needs neither.

| Flow | Checks |
| --- | --- |
| `record-season.yaml` | Onboarding, then planting, expense, harvest and sale; Home shows ₱300.00 profit. |
