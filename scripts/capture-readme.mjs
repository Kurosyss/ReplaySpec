import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.REPLAYSPEC_BASE_URL ?? "http://localhost:3000";
const outputDir = path.join(process.cwd(), "docs", "assets");
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light", deviceScaleFactor: 1 });
await context.addInitScript(() => {
  localStorage.setItem("replayspec-theme", "light");
  document.documentElement.setAttribute("data-theme", "light");
});
const page = await context.newPage();
const captures = [
  { name: "home-light.png", route: "/" },
  { name: "investigations-light.png", route: "/investigations" },
  { name: "new-investigation.png", route: "/investigations/new" },
  { name: "bug-01-evidence.png", route: "/investigations/bug-01" },
  { name: "bug-02-evidence.png", route: "/investigations/bug-02" },
  { name: "bug-03-evidence.png", route: "/investigations/bug-03" },
];

for (const capture of captures) {
  await page.goto(new URL(capture.route, baseUrl).toString(), { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outputDir, capture.name), fullPage: true, animations: "disabled" });
  console.log(`Captured ${capture.name}`);
}

await page.goto(new URL("/investigations/bug-02", baseUrl).toString(), { waitUntil: "networkidle" });
for (const tab of [
  { name: "recording", testId: "nav-recording" },
  { name: "evidence", testId: "nav-evidence" },
  { name: "specification", testId: "nav-specification" },
  { name: "execution", testId: "nav-execution" },
]) {
  const button = page.getByTestId(tab.testId);
  if (await button.count()) {
    await button.first().click();
    await page.waitForTimeout(250);
  }
  const filename = `workspace-${tab.name}.png`;
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: true, animations: "disabled" });
  console.log(`Captured ${filename}`);
}

await browser.close();
