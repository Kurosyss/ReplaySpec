import fs from "node:fs";
import { chromium } from "playwright";
const routes = [
  "/investigations",
  "/investigations/new",
  "/investigations/bug-01",
  "/demo/bug-01?variant=buggy",
  "/demo/bug-01?variant=fixed",
];
const viewports = [
  { name: "desktop", w: 1280, h: 800 },
  { name: "mobile", w: 390, h: 844 },
];
const themes = ["light", "dark"];
for (const theme of themes) {
  for (const vp of viewports) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    await ctx.addInitScript(t => {
      localStorage.setItem("replayspec-theme", t);
      document.documentElement.setAttribute("data-theme", t);
      if (t === "dark") document.documentElement.classList.add("dark");
    }, theme);
    const page = await ctx.newPage();
    for (const route of routes) {
      const file = `test-results/screenshots-verify/${theme}/${vp.name}${route.replace(/\//g,"_").replace(/\?/g,"-")}.png`;
      fs.mkdirSync(`test-results/screenshots-verify/${theme}/${vp.name}`, { recursive: true });
      await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      const dims = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, docW: document.documentElement.clientWidth }));
      console.log(`${theme} ${vp.name} ${route} viewport ${dims.w}x${dims.h} docW ${dims.docW}`);
      if (dims.w !== vp.w) console.log(`  WARNING viewport mismatch expected ${vp.w} got ${dims.w}`);
      await page.screenshot({ path: file, fullPage: false });
      const stat = fs.statSync(file);
      console.log(`  saved ${file} ${stat.size} bytes ${dims.w}x${dims.h}`);
      // Verify not cropped: check body width
      const bodyW = await page.evaluate(() => document.body.scrollWidth);
      if (bodyW < vp.w * 0.9) console.log(`  WARNING body too narrow ${bodyW}`);
      // Verify font
      const ff = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
      if (!ff.toLowerCase().includes("inter")) console.log(`  WARNING font not Inter: ${ff}`);
    }
    await browser.close();
  }
}
console.log("done");
