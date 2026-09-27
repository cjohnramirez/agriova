---
name: run-android
description: Use when building, launching, screenshotting, or visually checking the app on the Android emulator on this Windows machine, or when an Android native build fails with prefab, CMake, or undefined C++ symbol errors.
---

# Run Agriova on the Android emulator

This machine has two traps that break React Native Android builds. Both are
already solved; follow the recipe exactly rather than rediscovering them.

## The two traps

**1. JDK 25 fails prefab.** Android Studio's bundled JDK (`jbr`) is 25. The
Android Gradle Plugin runs a `prefab` helper in a child `java` process, and JDK
24+ prints a "restricted method" warning to stderr, which AGP treats as a
failure. Symptom: `configureCMakeDebug ... > WARNING: A restricted method in
java.lang.System has been called`. Use the Temurin 17 that Gradle provisioned.
Java 1.8 on PATH is too old for anything.

**2. Spaces in the SDK path break linking.** The user folder is
`C:\Users\JOHN CARL RAMIREZ`. CMake calls the NDK compiler through its 8.3 short
name `CLANG_~1.EXE`. Clang picks C or C++ mode from its own filename, so it runs
as C and never links libc++. Symptom: hundreds of `ld.lld: undefined symbol:
operator new`, `__cxa_throw`, `std::__ndk1::basic_string`. The fix is the
directory junction `C:\Android\Sdk` pointing at
`%LOCALAPPDATA%\Android\Sdk`. Always build with `ANDROID_HOME=C:\Android\Sdk`.
If you ever build once with the spaced path, delete
`node_modules/<module>/android/.cxx` before rebuilding, because CMake caches
the compiler path.

## Environment (PowerShell, per session)

```powershell
$env:JAVA_HOME = "$env:USERPROFILE\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2"
$env:ANDROID_HOME = "C:\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

## Boot, build, launch

0. The emulator resets to its saved snapshot, so the app may be gone after a
   reboot; check with `adb shell pm list packages | findstr farmerp`.
   Boot with `-memory 2048` on this machine: Metro plus the emulator need
   about 4 GB free.
1. Boot the AVD named `agriova` (Pixel 6, API 35, 1080x2400 at 420 dpi = 411dp):
   `Start-Process "$env:ANDROID_HOME\emulator\emulator.exe" -ArgumentList "-avd","agriova","-no-snapshot-save"`
   then wait until `adb shell getprop sys.boot_completed` returns `1`.
2. Start Metro in the background: `npx expo start --port 8081`.
3. Build and install (first build about 15 min, later about 5):
   `npx expo run:android --no-bundler` (run in background, log to a file).
4. This is a plain debug build, not an Expo dev client: it loads its code from
   Metro at localhost:8081, so forward the port and start the activity by name.
   Do not use `agriova://expo-development-client/...` links; nothing handles
   them. Expo Go (`host.exp.exponent`) is also on the emulator with an old
   project cached, and a stray launch shows its screens, not this app.
   ```powershell
   adb reverse tcp:8081 tcp:8081
   adb shell am force-stop host.exp.exponent
   adb shell am start -n com.jcrrrr.farmerp/.MainActivity
   ```
5. Wait for `Android Bundled` in the Metro log. In dev mode the first real UI
   appears about 15 s after launch; a blank screen before then is normal.

## Screenshots and driving the UI

- Capture: `adb shell screencap -p /sdcard/s.png; adb pull /sdcard/s.png <file>`,
  then Read the PNG to look at it. Save into the scratchpad, not the repo.
- Find tap targets from the view tree instead of guessing coordinates:
  `adb shell uiautomator dump /sdcard/ui.xml; adb shell cat /sdcard/ui.xml`
  and read the `text=` / `content-desc=` with its `bounds=`.
- Type with `adb shell input text <digits>`, dismiss the keyboard with
  `adb shell input keyevent 111`, tap with `adb shell input tap X Y`.
- The login accepts any valid PH mobile (`9XXXXXXXXX`) and any 6-digit code
  until real auth lands.

## Viewport and accessibility matrix

Check every new screen at these settings before calling it done:

| Setting | Command | Result |
| --- | --- | --- |
| Default | `adb shell wm density reset` | 411dp wide |
| Standard | `adb shell wm density 480` | 360dp, the Figma frame width |
| Small phone | `adb shell wm density 540` | 320dp |
| Large text | `adb shell settings put system font_scale 1.3` | older-user setting |

Changing density restarts the activity, which drops the in-memory session and
returns to login. Always reset afterwards:
`adb shell wm density reset; adb shell settings put system font_scale 1.0`.

## Diagnostics

- JS errors: `adb logcat -d -t 400 ReactNativeJS:V ReactNative:V *:S`
- Native crash: `adb logcat -d AndroidRuntime:E *:S`
- Project health: `npx expo-doctor` (should report all checks passed)
- Native C++ build failures: read
  `node_modules/<module>/android/build/intermediates/cxx/Debug/<hash>/logs/<abi>/prefab_stderr.txt`
  and the ninja output in the Gradle log; Gradle's own summary only shows the
  first stderr line.
