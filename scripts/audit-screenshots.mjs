import { chromium } from "playwright";
import fs from "node:fs";
const outDir = "test-results/audit-m3.2.1-before";
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const contexts = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
];
for (const ctxDef of contexts) {
  const context = await browser.newContext({ viewport: ctxDef.viewport });
  const page = await context.newPage();
  const routes = [
    { path: "/investigations", file: `01-investigations-${ctxDef.name}.png` },
    { path: "/investigations/bug-01", file: `02-investigation-detail-${ctxDef.name}.png` },
    { path: "/demo/bug-01?variant=buggy", file: `03-demo-buggy-${ctxDef.name}.png` },
    { path: "/demo/bug-01?variant=fixed", file: `04-demo-fixed-${ctxDef.name}.png` },
  ];
  for (const r of routes) {
    await page.goto(`http://localhost:3000${r.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${outDir}/${r.file}`, fullPage: true });
    console.log(`Saved ${r.file}`);
  }
  await context.close();
}
await browser.close();
console.log("Done audit screenshots");
