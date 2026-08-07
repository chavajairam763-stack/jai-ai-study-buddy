#!/usr/bin/env bash
#
# JAI.AI — one-shot Android project generator.
#
# Creates (or refreshes) the native Android project, applies adaptive icons,
# splash screens, permissions, versioning and release signing configuration.
#
# Run locally (NOT inside Lovable) with Node 20+, JDK 17 and Android SDK 34+.
#
#   bash scripts/android-setup.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Installing dependencies"
npm install

echo "==> Building web assets (used only for fully bundled builds)"
npm run build || echo "   (build skipped/failed — remote-shell mode does not need it)"

if [ ! -d android ]; then
  echo "==> Adding Android platform"
  npx cap add android
else
  echo "==> Android platform already present"
fi

echo "==> Generating adaptive icons + splash screens from resources/"
npx capacitor-assets generate --android \
  --iconBackgroundColor '#0b0b16' \
  --iconBackgroundColorDark '#0b0b16' \
  --splashBackgroundColor '#0b0b16' \
  --splashBackgroundColorDark '#0b0b16'

echo "==> Applying manifest permissions, versioning and signing config"
node scripts/android-configure.mjs

echo "==> Syncing"
npx cap sync android

cat <<'EOF'

Done. Next steps:

  1. Create a release keystore (once):
       keytool -genkey -v -keystore android/keystore.jks -alias jaiai \
         -keyalg RSA -keysize 2048 -validity 10000

  2. Copy android/keystore.properties.example -> android/keystore.properties
     and fill in your passwords (the file is git-ignored).

  3. Build a signed release:
       cd android && ./gradlew bundleRelease   # AAB for Play Store
       cd android && ./gradlew assembleRelease # APK for direct install

     Outputs:
       android/app/build/outputs/bundle/release/app-release.aab
       android/app/build/outputs/apk/release/app-release.apk

  Or open in Android Studio:  npx cap open android
EOF
