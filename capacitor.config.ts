import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for packaging JAI.AI as an Android APK / AAB.
 *
 * This file is inert for the web build — it is only read by the Capacitor CLI.
 * See CAPACITOR.md for the full packaging + signing steps.
 *
 * Two shipping modes:
 *  1) Remote shell (default below): the WebView loads the published PWA, so web
 *     releases go live instantly with no Play Store update.
 *  2) Bundled offline build: comment out the `server` block, run `npm run build`
 *     and point `webDir` at the built client output before `npx cap sync android`.
 */
const config: CapacitorConfig = {
  appId: "ai.jai.app",
  appName: "JAI.AI",
  // Used only when the `server` block is removed (fully bundled offline build).
  webDir: ".output/public",
  server: {
    url: "https://jai-ai-study-buddy.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0b0b16",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Release builds are signed via android/keystore.properties (see CAPACITOR.md).
    buildOptions: {
      keystorePath: "keystore.jks",
      keystoreAlias: "jaiai",
      releaseType: "AAB",
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0b0b16",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0b16",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "native",
      style: "DARK",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
