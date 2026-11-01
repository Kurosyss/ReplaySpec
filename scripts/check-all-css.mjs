import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/investigations", { waitUntil: "networkidle" });
const sheets = await page.evaluate(() => [...document.styleSheets].map(s => ({ href: s.href, rules: s.cssRules?.length || 0 })));
console.log(sheets);
for (const s of sheets) {
  if (s.href) {
    const r = await fetch(s.href);
    const t = await r.text();
    console.log(`--- ${s.href} len ${t.length} hasGrid ${t.includes(".grid")} hasVarCanvas ${t.includes("--canvas")}`);
    console.log(t.slice(0,500));
  } else {
    console.log("inline sheet", s);
    const rules = await page.evaluate(() => [...document.styleSheets[1]?.cssRules || []].map(r => r.cssText?.slice(0,200)).join("\n").slice(0,1000));
    console.log(rules);
  }
}
await browser.close();
