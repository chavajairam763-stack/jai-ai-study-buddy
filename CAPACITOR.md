# JAI.AI — Android packaging (Capacitor)

The app is a production PWA (manifest + service worker + offline cache + installable).
`capacitor.config.ts` is already committed; it is only read by the Capacitor CLI and
does not affect the web build.

## 1. Prerequisites
- Node 20+, Android Studio (with Android SDK 34+), JDK 17.

## 2. Add Capacitor (run locally, outside Lovable)
```bash
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android @capacitor/splash-screen @capacitor/status-bar
npx cap add android
```

## 3. Sync + open
```bash
npx cap sync android
npx cap open android
```
The shell loads the published site defined in `capacitor.config.ts → server.url`,
so web releases ship instantly without a Play Store update.

To ship a fully offline bundle instead, remove the `server` block, run
`npm run build`, set `webDir` to the built client output, then `npx cap sync android`.

## 4. Icons & splash
Source images live in `public/`:
- `icon-512.png` — app icon
- `icon-maskable-512.png` — adaptive/maskable icon
Generate Android densities with:
```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --android
```

## 5. Release build
In Android Studio: **Build → Generate Signed Bundle / APK** → create a keystore →
build an **AAB** for Play Store, or an **APK** for direct install.

Keep `versionCode` / `versionName` in `android/app/build.gradle` incremented per release.

## Security notes
- Auth tokens are kept by the Supabase client in origin-scoped storage; the WebView
  origin is HTTPS-only (`androidScheme: "https"`, `allowMixedContent: false`).
- No secrets are bundled in the client; all privileged work runs server-side.
