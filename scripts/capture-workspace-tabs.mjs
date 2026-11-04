import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/demo/bug-01?variant=fixed`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerRunning()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

let serverProcess = null;
const runningAlready = await isServerRunning();

if (!runningAlready) {
  console.log("Starting Next.js production server on port 3000...");
  serverProcess = spawn("npm.cmd", ["run", "start"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
  });
  const ok = await waitForServer();
  if (!ok) {
    console.error("Failed to start server within timeout.");
    process.exit(1);
  }
  console.log("Server ready.");
}

const viewports = [
  { name: "desktop", w: 1280, h: 800 },
  { name: "mobile", w: 390, h: 844 },
];

const themes = ["dark", "light"];
const tabs = ["evidence", "spec", "execution"];

const outDir = path.join(process.cwd(), "test-results", "screenshots-verify", "supplementary");
fs.mkdirSync(outDir, { recursive: true });

const results = [];

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
    await page.goto(`${BASE_URL}/investigations/bug-01`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    for (const tab of tabs) {
      const tabButton = page.locator(`[data-testid="detail-tab-${tab}"]`);
      if (await tabButton.isVisible()) {
        await tabButton.click();
      } else {
        const navButton = page.locator(`[data-testid="nav-${tab === "spec" ? "specification" : tab}"]`);
        if (await navButton.isVisible()) {
          await navButton.click();
        }
      }
      await page.waitForTimeout(600);

      const themeDir = path.join(outDir, theme);
      fs.mkdirSync(themeDir, { recursive: true });
      const filename = `${vp.name}_investigations_bug-01_tab-${tab}.png`;
      const filePath = path.join(themeDir, filename);

      await page.screenshot({ path: filePath, fullPage: false });
      const stat = fs.statSync(filePath);
      console.log(`Saved [${theme} ${vp.name} tab:${tab}]: ${filePath} (${stat.size} bytes)`);
      results.push({
        theme,
        viewport: vp.name,
        tab,
        width: vp.w,
        height: vp.h,
        path: filePath,
        bytes: stat.size,
      });
    }

    await browser.close();
  }
}

if (serverProcess) {
  console.log("Shutting down local server...");
  serverProcess.kill();
}

console.log("\nSupplementary Capture Summary:");
console.table(results);
