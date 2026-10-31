import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "test-results/screenshots-studio";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

// Start dev server manually if not running — we assume user has run npm run dev or use webServer via playwright
// For this script, we expect http://localhost:3000 to be available. If not, start via npx next dev in background
// We'll just try to goto and screenshot.

async function shot(url, filename) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800); // allow fonts/images
  await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
  console.log(`Saved ${filename}`);
}

try {
  await shot("http://localhost:3000/investigations", "01-investigations-list.png");
  await shot("http://localhost:3000/investigations/bug-01", "02-investigation-detail.png");

  // Also capture interaction: click timeline
  await page.goto("http://localhost:3000/investigations/bug-01", { waitUntil: "networkidle" });
  await page.getByTestId("timeline-observed-frame-00-01-8").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "03-detail-timeline-selected.png"), fullPage: true });
  console.log("Saved 03-detail-timeline-selected.png");

  // Click filmstrip
  await page.getByTestId("filmstrip-thumb-frame-00-04-0").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "04-detail-frame-selected.png"), fullPage: true });
  console.log("Saved 04-detail-frame-selected.png");

  // Responsive mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/investigations/bug-01", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "05-mobile.png"), fullPage: true });
  console.log("Saved 05-mobile.png");

} catch (e) {
  console.error(e);
  console.log("Hints: ensure dev server running: npm run dev in separate terminal");
} finally {
  await browser.close();
}
