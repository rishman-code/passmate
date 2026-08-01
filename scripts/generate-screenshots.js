/**
 * Captures App Store screenshots at 1290×2796 px (iPhone 6.7" @ 3×).
 * The dev server must be running: npx expo start --web
 *
 * Output: assets/store-screenshots/
 *   01-home.png
 *   02-practice.png
 *   03-question.png
 *   04-result.png
 *   05-progress.png
 *
 * Usage: node scripts/generate-screenshots.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../assets/store-screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const shot = (name) => path.join(OUT_DIR, name);

// 430×932 logical × 3 dpr = 1290×2796 px
const VIEWPORT = { width: 430, height: 932 };
const DPR = 3;

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--force-device-scale-factor=' + DPR],
  });

  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DPR,
  });
  const page = await ctx.newPage();

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(5000);

  // Skip onboarding if shown
  const skip = page.locator('text=Skip');
  if (await skip.isVisible()) {
    await skip.click();
    await page.waitForTimeout(2000);
  }

  // ── 01 Home ────────────────────────────────────────────────────────────────
  await page.screenshot({ path: shot('01-home.png') });
  console.log('✓ 01-home.png');

  // ── 02 Practice (category list) ───────────────────────────────────────────
  await page.locator('text=Practice').last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: shot('02-practice.png') });
  console.log('✓ 02-practice.png');

  // ── 03 & 04  Practice session ─────────────────────────────────────────────
  // Navigate back home then click the CTA so the session starts cleanly
  await page.locator('text=Home').last().click();
  await page.waitForTimeout(2000);
  await page.locator('text=Start Adaptive Practice').first().click();
  await page.waitForTimeout(7000); // wait for Supabase fetch + session render

  // Before answering
  const optionA = page.getByTestId('option-button-a');
  if (await optionA.isVisible({ timeout: 8000 }).catch(() => false)) {
    await page.screenshot({ path: shot('03-question.png') });
    console.log('✓ 03-question.png');

    // Answer and wait for AI explanation
    await optionA.click();
    await page.waitForTimeout(6000);
    await page.screenshot({ path: shot('04-result.png') });
    console.log('✓ 04-result.png');

    // Close session
    const closeBtn = page.getByTestId('practice-session-close-button');
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(2000);
    }
  } else {
    console.log('⚠ Session options not visible — skipping 03 & 04');
  }

  // ── 05 Progress ───────────────────────────────────────────────────────────
  await page.locator('text=Progress').last().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: shot('05-progress.png') });
  console.log('✓ 05-progress.png');

  await browser.close();
  console.log(`\nScreenshots saved to ${OUT_DIR}`);
  console.log('Pixel size: ' + VIEWPORT.width * DPR + '×' + VIEWPORT.height * DPR);
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
