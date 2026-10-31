import { chromium } from "playwright";
import fs from "node:fs";
const outDirBase = "test-results/screenshots-final";
fs.mkdirSync(outDirBase, { recursive: true });
const routes = [
  { path: "/investigations", name: "01-investigations" },
  { path: "/investigations/bug-01", name: "02-investigation-detail" },
  { path: "/demo/bug-01?variant=buggy", name: "03-demo-buggy" },
  { path: "/demo/bug-01?variant=fixed", name: "04-demo-fixed" },
];
const themes = ["light", "dark"];
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];
const browser = await chromium.launch();
for (const theme of themes) {
  for (const vp of viewports) {
    const themeDir = `${outDirBase}/${theme}/${vp.name}`;
    fs.mkdirSync(themeDir, { recursive: true });
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    // Set theme before any navigation to prevent flash
    await context.addInitScript(
      ({ theme }) => {
        try {
          localStorage.setItem("replayspec-theme", theme);
        } catch {}
      },
      { theme }
    );
    const page = await context.newPage();
    for (const route of routes) {
      const file = `${themeDir}/${route.name}.png`;
      await page.goto(`http://localhost:3000${route.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      // Ensure theme is correct after navigation (in case hydration overwrote)
      const detected = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
      if (detected !== theme) {
        console.warn(`Theme mismatch on ${route.path} ${vp.name} ${theme}: got ${detected}`);
      }
      await page.screenshot({ path: file, fullPage: true });
      console.log(`Saved ${theme}/${vp.name}/${route.name}.png (theme=${detected})`);
    }
    await context.close();
  }
}
await browser.close();
console.log("All screenshots generated");
