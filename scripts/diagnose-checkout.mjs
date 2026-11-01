import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://localhost:3000/demo/bug-01?variant=fixed", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
console.log("MAIN", await page.evaluate(() => {
  const m = document.querySelector("main");
  return m ? { cls: m.className, display: getComputedStyle(m).display, cols: getComputedStyle(m).gridTemplateColumns, gap: getComputedStyle(m).gap } : null;
}));
console.log("ORDER SUMMARY", await page.evaluate(() => {
  const a = document.querySelector("aside");
  return a ? { cls: a.className, display: getComputedStyle(a).display, order: getComputedStyle(a).order } : null;
}));
console.log("CHECKOUT FORM", await page.evaluate(() => {
  const f = document.querySelector("[data-testid='checkout-form']");
  return f ? { display: getComputedStyle(f).display, parentDisplay: getComputedStyle(f.parentElement).display } : null;
}));
console.log("BODY font", await page.evaluate(() => getComputedStyle(document.body).fontFamily));
console.log("BODY bg", await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
console.log("INV LIST", await page.evaluate(() => {
  const h = document.querySelector("h1");
  return h ? { fs: getComputedStyle(h).fontSize, ff: getComputedStyle(h).fontFamily } : null;
}));
await page.screenshot({ path: "test-results/diag-checkout-1280.png", fullPage: false });
console.log("screenshot 1280 saved, viewport", await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight })));
// Mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:3000/demo/bug-01?variant=fixed", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
console.log("MOBILE MAIN", await page.evaluate(() => {
  const m = document.querySelector("main");
  return m ? { display: getComputedStyle(m).display, cols: getComputedStyle(m).gridTemplateColumns } : null;
}));
await page.screenshot({ path: "test-results/diag-checkout-mobile.png", fullPage: true });
console.log("mobile screenshot saved");
await browser.close();
