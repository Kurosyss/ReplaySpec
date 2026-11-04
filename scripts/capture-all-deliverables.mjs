import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.join(process.cwd(), "test-results", "screenshots-deliverables");
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: "desktop", w: 1280, h: 800 },
  { name: "mobile", w: 390, h: 844 },
];

const themes = ["dark", "light"];

const mainRoutes = [
  { id: "investigations-listing", path: "/investigations" },
  { id: "new-investigation", path: "/investigations/new" },
  { id: "demo-buggy", path: "/demo/bug-01?variant=buggy" },
  { id: "demo-fixed", path: "/demo/bug-01?variant=fixed" },
  { id: "logo-concepts", path: "/logo-concepts" },
];

const workspaceNav = [
  { id: "recording", testId: "nav-recording" },
  { id: "evidence", testId: "nav-evidence" },
  { id: "spec", testId: "nav-specification" },
  { id: "execution", testId: "nav-execution" },
];

const captured = [];

for (const theme of themes) {
  for (const vp of viewports) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    await ctx.addInitScript((t) => {
      localStorage.setItem("replayspec-theme", t);
      document.documentElement.setAttribute("data-theme", t);
      if (t === "dark") document.documentElement.classList.add("dark");
    }, theme);

    const page = await ctx.newPage();

    // 1. Capture main routes
    for (const r of mainRoutes) {
      const filename = `${r.id}_${theme}_${vp.name}.png`;
      const targetPath = path.join(outDir, filename);
      await page.goto(`http://localhost:3000${r.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      await page.screenshot({ path: targetPath, fullPage: false });
      const stat = fs.statSync(targetPath);
      captured.push({ route: r.path, theme, viewport: vp.name, file: targetPath, size: stat.size });
      console.log(`[captured] ${filename} (${stat.size} bytes)`);
    }

    // 2. Capture workspace tabs on /investigations/bug-01
    await page.goto("http://localhost:3000/investigations/bug-01", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    for (const tab of workspaceNav) {
      if (vp.name === "mobile") {
        const mobBtn = page.locator(`[data-testid="mobile-nav-${tab.id}"]`);
        if (await mobBtn.count() > 0) {
          await mobBtn.first().click().catch(() => {});
          await page.waitForTimeout(200);
        }
      } else {
        const deskBtn = page.locator(`[data-testid="${tab.testId}"]`);
        if (await deskBtn.count() > 0) {
          await deskBtn.first().click().catch(() => {});
          await page.waitForTimeout(200);
        }
      }
      const filename = `workspace-${tab.id}_${theme}_${vp.name}.png`;
      const targetPath = path.join(outDir, filename);
      await page.screenshot({ path: targetPath, fullPage: false });
      const stat = fs.statSync(targetPath);
      captured.push({ route: `/investigations/bug-01#${tab.id}`, theme, viewport: vp.name, file: targetPath, size: stat.size });
      console.log(`[captured] ${filename} (${stat.size} bytes)`);
    }

    await browser.close();
  }
}

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(captured, null, 2), "utf8");
console.log(`Successfully captured ${captured.length} screenshots to ${outDir}`);
