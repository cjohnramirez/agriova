# End-to-end flows

[Maestro](https://maestro.mobile.dev) drives the installed app on an emulator
or phone. Install it once (a Java CLI, about 100 MB, into `~/.maestro`):

```sh
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

Against a development build, start Metro first and pass `DEV_CLIENT`, so the
flow points the dev client at the bundler:

```sh
npx expo start --port 8081
adb reverse tcp:8081 tcp:8081
maestro test -e DEV_CLIENT=true .maestro/
```

Against a release or preview build, which carries its own bundle:

```sh
maestro test .maestro/
```

| Flow | Checks |
| --- | --- |
| `record-season.yaml` | Onboarding, then planting, expense, harvest and sale; Home shows ₱300.00 profit. |
