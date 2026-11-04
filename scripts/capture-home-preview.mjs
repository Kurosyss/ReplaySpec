import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.REPLAYSPEC_BASE_URL ?? "http://localhost:3000";
const outputPath = path.resolve("public/demo/bug-02/frames/bug02-home.png");
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 800, height: 580 }, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/demo/bug-02?variant=buggy`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="cart-counter-card"] img').waitFor({ state: "visible" });
  const row = await page.locator('[data-testid="cart-counter-card"] img').evaluate((image) => {
    const imageRect = image.getBoundingClientRect();
    const rowRect = image.parentElement.getBoundingClientRect();
    return { imageBottom: imageRect.bottom, rowBottom: rowRect.bottom };
  });
  if (row.rowBottom > 580) {
    throw new Error(`Cart product row is clipped by the capture viewport (row ends at ${row.rowBottom}px).`);
  }
  await page.screenshot({ path: outputPath, animations: "disabled" });
  console.log(`Saved 800×580 homepage preview to ${outputPath}`);
} finally {
  await browser.close();
}
