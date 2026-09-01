/**
 * Generates the car mascot icon shown on the Welcome to GreenLight screen,
 * as a transparent-background PNG (the green circle + black outline are
 * baked into the artwork; the app wraps it in its own tactileShadow).
 *
 * Rendered at 3x (312x312 for a 104x104 display size) for retina clarity,
 * using the exact SVG from the supplied design mockup.
 *
 * Output: assets/images/welcome-mascot.png
 * Usage: node scripts/generate-welcome-mascot.js
 */

const { chromium } = require('playwright');
const path = require('path');

const DISPLAY_SIZE = 104;
const SCALE = 3;
const SIZE = DISPLAY_SIZE * SCALE;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${SIZE}px;
    height: ${SIZE}px;
    overflow: hidden;
    background: transparent;
  }
  .circle {
    width: ${SIZE}px;
    height: ${SIZE}px;
    border-radius: 50%;
    background: #7ED9A6;
    border: ${3 * SCALE}px solid #000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
</style>
</head>
<body>
  <div class="circle">
    <svg width="${68 * SCALE}" height="${68 * SCALE}" viewBox="0 0 100 100">
      <rect x="18" y="46" width="64" height="26" rx="10" fill="#E8642C" stroke="#000" stroke-width="3"/>
      <path d="M28 46 L36 28 Q40 22 48 22 L60 22 Q68 22 71 30 L76 46 Z" fill="#E8642C" stroke="#000" stroke-width="3"/>
      <rect x="42" y="30" width="20" height="14" rx="3" fill="#FBEAF0" stroke="#000" stroke-width="2"/>
      <circle cx="34" cy="74" r="9" fill="#2C2C2A" stroke="#000" stroke-width="2"/>
      <circle cx="66" cy="74" r="9" fill="#2C2C2A" stroke="#000" stroke-width="2"/>
      <circle cx="40" cy="55" r="6" fill="#fff" stroke="#000" stroke-width="2"/>
      <circle cx="58" cy="55" r="6" fill="#fff" stroke="#000" stroke-width="2"/>
      <circle cx="41" cy="55" r="2.4" fill="#000"/>
      <circle cx="59" cy="55" r="2.4" fill="#000"/>
      <path d="M46 63 Q50 66 54 63" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>
  </div>
</body>
</html>`;

async function generate() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: path.resolve(__dirname, '../assets/images/welcome-mascot.png'),
    omitBackground: true,
  });
  await browser.close();
  console.log('✓ assets/images/welcome-mascot.png');
}

generate().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
