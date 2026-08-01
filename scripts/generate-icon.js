/**
 * Generates the PassMate app icon as a 1024x1024 PNG.
 * Uses Playwright to render HTML with the Ionicons font (base64-embedded).
 *
 * Output: assets/images/icon.png  (replaces Expo starter template)
 * Also writes: assets/images/splash-icon.png (for the splash screen)
 *
 * Usage: node scripts/generate-icon.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const fontPath = path.resolve(
  __dirname,
  '../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf',
);
const fontB64 = fs.readFileSync(fontPath).toString('base64');
const fontDataUri = `data:font/truetype;base64,${fontB64}`;

// car-sport glyph is U+F1E4 (decimal 61924)
const CAR_SPORT_CHAR = String.fromCodePoint(0xf1e4);

const iconHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @font-face {
    font-family: 'Ionicons';
    src: url('${fontDataUri}') format('truetype');
  }

  body {
    width: 1024px;
    height: 1024px;
    overflow: hidden;
    background: #FF4500;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Subtle radial gradient for depth */
    background: radial-gradient(ellipse at 38% 30%, #FF6A33 0%, #FF4500 55%, #D93C00 100%);
  }

  .icon {
    font-family: 'Ionicons';
    font-size: 540px;
    color: #FFFFFF;
    line-height: 1;
    /* Slight lift shadow for legibility at small sizes */
    filter: drop-shadow(0 12px 32px rgba(0,0,0,0.18));
    /* nudge upward slightly so the car sits visually centered */
    margin-top: -40px;
  }
</style>
</head>
<body>
  <span class="icon">${CAR_SPORT_CHAR}</span>
</body>
</html>`;

// Smaller version for the splash screen centre mark (keep it minimal)
const splashHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @font-face {
    font-family: 'Ionicons';
    src: url('${fontDataUri}') format('truetype');
  }

  body {
    width: 200px;
    height: 200px;
    overflow: hidden;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon {
    font-family: 'Ionicons';
    font-size: 160px;
    color: #FFFFFF;
    line-height: 1;
    margin-top: -10px;
  }
</style>
</head>
<body>
  <span class="icon">${CAR_SPORT_CHAR}</span>
</body>
</html>`;

async function generate() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });

  // ── App icon 1024×1024 ──────────────────────────────────────────────────────
  const iconPage = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await iconPage.setContent(iconHtml, { waitUntil: 'networkidle' });
  await iconPage.waitForTimeout(500); // let font render
  await iconPage.screenshot({
    path: path.resolve(__dirname, '../assets/images/icon.png'),
    omitBackground: false,
  });
  console.log('✓ assets/images/icon.png');

  // ── Splash centre mark 200×200 ──────────────────────────────────────────────
  const splashPage = await browser.newPage({ viewport: { width: 200, height: 200 } });
  await splashPage.setContent(splashHtml, { waitUntil: 'networkidle' });
  await splashPage.waitForTimeout(500);
  await splashPage.screenshot({
    path: path.resolve(__dirname, '../assets/images/splash-icon.png'),
    omitBackground: true,
  });
  console.log('✓ assets/images/splash-icon.png');

  await browser.close();
  console.log('\nDone. Run "npx expo start --web" to verify the icon.');
}

generate().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
