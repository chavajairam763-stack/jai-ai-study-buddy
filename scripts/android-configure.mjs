/**
 * JAI.AI — post-`cap add android` configuration.
 *
 * Idempotent. Applies:
 *  - AndroidManifest permissions (internet, network state, mic, camera, storage read)
 *  - versionCode / versionName sourced from package.json + APP_VERSION_CODE
 *  - release signing config read from android/keystore.properties
 *  - minify/shrink for release builds
 *
 * Run: node scripts/android-configure.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ANDROID = path.join(ROOT, "android");

if (!fs.existsSync(ANDROID)) {
  console.error("android/ not found — run `npx cap add android` first.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const versionName = process.env.APP_VERSION_NAME ?? pkg.version ?? "1.0.0";
const versionCode = process.env.APP_VERSION_CODE ?? "1";

/* ---------------------------------------------------------------- manifest */
const manifestPath = path.join(ANDROID, "app/src/main/AndroidManifest.xml");
let manifest = fs.readFileSync(manifestPath, "utf8");

const permissions = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.RECORD_AUDIO',
  'android.permission.CAMERA',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.POST_NOTIFICATIONS',
];

const permBlock = permissions
  .map((p) => `    <uses-permission android:name="${p}" />`)
  .join("\n");

// Strip previously injected block, then re-insert before </manifest>.
manifest = manifest.replace(
  /\n *<!-- JAI.AI permissions -->[\s\S]*?<!-- \/JAI.AI permissions -->/g,
  "",
);
manifest = manifest.replace(
  /<\/manifest>/,
  `\n    <!-- JAI.AI permissions -->\n${permBlock}\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <!-- /JAI.AI permissions -->\n</manifest>`,
);

// Full-screen, portrait, dark-friendly activity behaviour.
manifest = manifest.replace(
  /android:screenOrientation="[^"]*"/,
  'android:screenOrientation="portrait"',
);
if (!/android:screenOrientation=/.test(manifest)) {
  manifest = manifest.replace(
    /(<activity\b[^>]*?)(>)/,
    '$1\n            android:screenOrientation="portrait"$2',
  );
}
fs.writeFileSync(manifestPath, manifest);
console.log("✓ AndroidManifest.xml permissions applied");

/* ------------------------------------------------------------ build.gradle */
const gradlePath = path.join(ANDROID, "app/build.gradle");
let gradle = fs.readFileSync(gradlePath, "utf8");

// Load keystore.properties at the top of the file.
const loaderMarker = "// JAI.AI signing loader";
if (!gradle.includes(loaderMarker)) {
  gradle = `${loaderMarker}
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

${gradle}`;
}

// versionCode / versionName
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);

// signingConfigs
if (!gradle.includes("signingConfigs {")) {
  gradle = gradle.replace(
    /(\n\s*buildTypes\s*\{)/,
    `
    signingConfigs {
        release {
            if (keystoreProperties['storeFile']) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
$1`,
  );
}

// release build type: signing + shrinking
gradle = gradle.replace(
  /release\s*\{([\s\S]*?)\n(\s*)\}/,
  (match, body, indent) => {
    if (match.includes("signingConfig")) return match;
    return `release {${body}
${indent}    signingConfig keystoreProperties['storeFile'] ? signingConfigs.release : signingConfigs.debug
${indent}    minifyEnabled true
${indent}    shrinkResources true
${indent}}`;
  },
);

fs.writeFileSync(gradlePath, gradle);
console.log(`✓ build.gradle: versionName ${versionName}, versionCode ${versionCode}, release signing wired`);

/* ------------------------------------------------- keystore.properties docs */
const examplePath = path.join(ANDROID, "keystore.properties.example");
fs.writeFileSync(
  examplePath,
  `# Copy to android/keystore.properties and fill in. NEVER commit the real file.
storeFile=keystore.jks
storePassword=CHANGE_ME
keyAlias=jaiai
keyPassword=CHANGE_ME
`,
);
console.log("✓ android/keystore.properties.example written");
