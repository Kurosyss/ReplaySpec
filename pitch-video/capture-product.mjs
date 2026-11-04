import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outputDir = path.join(process.cwd(), "pitch-video", "assets");
const baseUrl = process.env.REPLAYSPEC_BASE_URL ?? "http://localhost:3000";
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
await context.addInitScript(() => {
  localStorage.setItem("replayspec-theme", "light");
  document.documentElement.setAttribute("data-theme", "light");
});

const page = await context.newPage();
await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "networkidle" });
await page.screenshot({
  path: path.join(outputDir, "product-home.png"),
  clip: { x: 0, y: 0, width: 1600, height: 780 },
  animations: "disabled",
});
await page.goto(new URL("/investigations", baseUrl).toString(), { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "product-investigations.png"), animations: "disabled" });
await page.goto(new URL("/investigations/new", baseUrl).toString(), { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "product-new-investigation.png"), animations: "disabled" });

await page.goto(new URL("/investigations/bug-02", baseUrl).toString(), { waitUntil: "networkidle" });
await page.getByTestId("nav-recording").waitFor({ state: "visible" });
await page.screenshot({ path: path.join(outputDir, "product-recording.png"), animations: "disabled" });

for (const [name, testId] of [
  ["evidence", "nav-evidence"],
  ["specification", "nav-specification"],
  ["execution", "nav-execution"],
]) {
  await page.getByTestId(testId).click();
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(outputDir, `product-${name}.png`), animations: "disabled" });
}

const comparePage = await context.newPage();
await comparePage.setViewportSize({ width: 800, height: 650 });
await comparePage.goto(new URL("/demo/bug-02?variant=buggy", baseUrl).toString(), { waitUntil: "networkidle" });
await comparePage.getByTestId("cart-increment").click();
await comparePage.getByTestId("cart-increment").click();
await comparePage.waitForFunction(() => document.querySelector('[data-testid="cart-quantity"]')?.textContent === "2");
await comparePage.getByTestId("cart-sync-status").getByText("2 increment clicks registered").waitFor({ state: "visible" });
await comparePage.screenshot({ path: path.join(outputDir, "cart-buggy-2.png"), animations: "disabled" });

await comparePage.goto(new URL("/demo/bug-02?variant=fixed", baseUrl).toString(), { waitUntil: "networkidle" });
await comparePage.getByTestId("cart-increment").click();
await comparePage.getByTestId("cart-increment").click();
await comparePage.waitForFunction(() => document.querySelector('[data-testid="cart-quantity"]')?.textContent === "3");
await comparePage.getByTestId("cart-sync-status").getByText("2 increment clicks registered").waitFor({ state: "visible" });
await comparePage.screenshot({ path: path.join(outputDir, "cart-fixed-3.png"), animations: "disabled" });

await browser.close();
console.log("Captured uncropped 1600 × 900 ReplaySpec product screens.");
