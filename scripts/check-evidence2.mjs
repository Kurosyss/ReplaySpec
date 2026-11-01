import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/investigations/bug-01", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
console.log("Initial", await page.evaluate(() => document.body.innerHTML.slice(0, 2000)));
const btn = page.locator('[data-testid="detail-tab-evidence"]:visible').first();
console.log("Btn count", await btn.count(), "visible", await btn.isVisible().catch(()=>false));
console.log("Btn text", await btn.textContent().catch(()=> "no"));
await btn.click();
await page.waitForTimeout(800);
console.log("After click", await page.evaluate(() => {
  const active = document.querySelector('[data-testid="detail-tab-evidence"][aria-current="page"]');
  return {
    activeFound: !!active,
    activeText: active?.textContent?.slice(0,20),
    allTabs: [...document.querySelectorAll('[data-testid^="detail-tab-"]')].map(el => ({ testId: el.getAttribute("data-testid"), visible: el.offsetParent !== null, aria: el.getAttribute("aria-current"), text: el.textContent?.slice(0,15) })),
    evidenceTimelineVisible: !!document.querySelector('[data-testid="evidence-timeline"]') && getComputedStyle(document.querySelector('[data-testid="evidence-timeline"]')).display !== "none",
    bodyHTMLSnippet: document.body.innerHTML.slice(0, 3000),
  };
}));
await browser.close();
