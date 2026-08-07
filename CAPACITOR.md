# JAI.AI — Android packaging (Capacitor)

The app is a production PWA (manifest + service worker + offline cache + installable).
Everything the native shell needs is committed: `capacitor.config.ts`, source art in
`resources/`, and two scripts that generate and configure the Android project.
None of it affects the web build.

## 1. Prerequisites
Node 20+, JDK 17, Android Studio with Android SDK 34+ (and `keytool` from the JDK).

## 2. Generate the Android project (run locally, outside Lovable)
```bash
bash scripts/android-setup.sh
```
This runs `npx cap add android`, generates adaptive icons + splash screens from
`resources/`, applies permissions/versioning/signing config, then `npx cap sync android`.

## 3. Create the release keystore (once)
```bash
keytool -genkey -v -keystore android/keystore.jks -alias jaiai \
  -keyalg RSA -keysize 2048 -validity 10000
```
Then:
```bash
cp android/keystore.properties.example android/keystore.properties
# edit storePassword / keyPassword
```
`android/keystore.jks` and `android/keystore.properties` are git-ignored — keep
backups somewhere safe. Losing the keystore means you can never update the Play listing.

## 4. Build a signed release
```bash
cd android
./gradlew bundleRelease    # AAB  -> app/build/outputs/bundle/release/app-release.aab
./gradlew assembleRelease  # APK  -> app/build/outputs/apk/release/app-release.apk
```
Or open in Android Studio (`npx cap open android`) and use
**Build → Generate Signed Bundle / APK**.

## 5. Versioning
`scripts/android-configure.mjs` writes `versionName` from `package.json` `version`
and `versionCode` from the `APP_VERSION_CODE` env var:
```bash
APP_VERSION_CODE=2 APP_VERSION_NAME=1.1.0 node scripts/android-configure.mjs
```
Play Store requires a strictly increasing `versionCode` for every upload.

## 6. App identity
| Item | Value |
| --- | --- |
| Application ID | `ai.jai.app` |
| App name | JAI.AI |
| Orientation | Portrait |
| Theme / splash background | `#0b0b16` |

## 7. Icons & splash
Source art lives in `resources/`:
- `icon.png` (1024²) — legacy launcher icon
- `icon-foreground.png` / `icon-background.png` — Android adaptive icon layers
- `splash.png` / `splash-dark.png` (2732²) — splash screens

Re-run `npx capacitor-assets generate --android` after changing any of them.

## 8. Web content mode
By default `capacitor.config.ts → server.url` points at the published site, so web
releases ship instantly without a Play Store update. For a fully offline bundle,
delete the `server` block, run `npm run build`, confirm `webDir` matches the client
output, then `npx cap sync android`.

## 9. Permissions requested
`INTERNET`, `ACCESS_NETWORK_STATE`, `RECORD_AUDIO` (voice input), `CAMERA` and
`READ_MEDIA_IMAGES` (OCR / document capture), `POST_NOTIFICATIONS` (reminders).
Camera hardware is declared optional so the app installs on all devices.

## Security notes
- Auth tokens stay in the Supabase client's origin-scoped storage; the WebView is
  HTTPS-only (`androidScheme: "https"`, `allowMixedContent: false`).
- `webContentsDebuggingEnabled` is off for release.
- No secrets are bundled in the client; all privileged work runs server-side.
- Release builds run R8 (`minifyEnabled` + `shrinkResources`).
