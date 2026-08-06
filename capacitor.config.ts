/**
 * Capacitor configuration for packaging JAI.AI as an Android APK / AAB.
 *
 * This file is inert for the web build — it is only read by the Capacitor CLI.
 * See CAPACITOR.md for the full packaging steps.
 */
const config = {
  appId: "ai.jai.app",
  appName: "JAI.AI",
  // Point Capacitor at the published PWA so the shell always serves the
  // latest deployment (no store update needed for web changes).
  server: {
    url: "https://jai-ai-study-buddy.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0b0b16",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0b0b16",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0b16",
      overlaysWebView: true,
    },
  },
};

export default config;
