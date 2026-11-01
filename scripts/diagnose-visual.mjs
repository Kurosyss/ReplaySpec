import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const logs = [];
page.on("console", m => logs.push(`console:${m.type()}:${m.text()}`));
page.on("requestfailed", r => logs.push(`failed:${r.url()}:${r.failure()?.errorText}`));
const responses = [];
page.on("response", async r => {
  if (r.url().includes("globals") || r.url().includes(".css")) {
    responses.push(`${r.status()} ${r.url()} ${r.headers()["content-type"]}`);
  }
});
await page.goto("http://localhost:3000/investigations", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
console.log("=== URL", page.url());
console.log("=== Responses CSS", responses.join("\n"));
console.log("=== Viewport", await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight })));
console.log("=== Body computed", await page.evaluate(() => {
  const b = document.body;
  const cs = getComputedStyle(b);
  return {
    fontFamily: cs.fontFamily,
    backgroundColor: cs.backgroundColor,
    color: cs.color,
    display: cs.display,
    fontSize: cs.fontSize,
    innerWidth: window.innerWidth,
    outerWidth: document.documentElement.clientWidth,
  };
}));
console.log("=== html class", await page.evaluate(() => document.documentElement.className));
console.log("=== html data-theme", await page.evaluate(() => document.documentElement.getAttribute("data-theme")));
console.log("=== --canvas var", await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--canvas")));
console.log("=== --font-inter var", await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--font-inter")));
console.log("=== body class", await page.evaluate(() => document.body.className));
console.log("=== All stylesheets", await page.evaluate(() => [...document.styleSheets].map(s => s.href || "inline").join("\n")));
console.log("=== Body innerHTML snippet", (await page.content()).slice(0, 3000));
console.log("=== Logs", logs.join("\n"));

// Check specific elements
console.log("=== Check .font-mono", await page.evaluate(() => {
  const el = document.querySelector(".font-mono");
  return el ? getComputedStyle(el).fontFamily : "none";
}));
console.log("=== Check header", await page.evaluate(() => {
  const h = document.querySelector("header");
  return h ? { h: h.offsetHeight, display: getComputedStyle(h).display, bg: getComputedStyle(h).backgroundColor } : null;
}));
console.log("=== Check investigations heading", await page.evaluate(() => {
  const h = document.querySelector("h1");
  return h ? { text: h.textContent?.slice(0,50), fontSize: getComputedStyle(h).fontSize, fontFamily: getComputedStyle(h).fontFamily, letterSpacing: getComputedStyle(h).letterSpacing } : null;
}));
await page.screenshot({ path: "test-results/diag-01-investigations.png", fullPage: false });
console.log("screenshot saved diag");

// Demo bug
await page.goto("http://localhost:3000/demo/bug-01?variant=fixed", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
console.log("=== DEMO body font", await page.evaluate(() => getComputedStyle(document.body).fontFamily));
console.log("=== DEMO grid check", await page.evaluate(() => {
  const grid = document.querySelector("[data-testid='checkout-form']")?.parentElement;
  return grid ? { display: getComputedStyle(grid).display, gridTemplate: getComputedStyle(grid).gridTemplateColumns } : "no grid";
}));
console.log("=== DEMO order summary", await page.evaluate(() => {
  const el = document.querySelector("[data-testid='order-summary']") || document.querySelector(".order-summary") || document.body;
  return document.body.innerHTML.slice(0,2000);
}));
await page.screenshot({ path: "test-results/diag-02-demo-fixed.png", fullPage: true });
console.log("demo screenshot saved");

// Detail
await page.goto("http://localhost:3000/investigations/bug-01", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
console.log("=== DETAIL body width", await page.evaluate(() => ({ w: document.body.offsetWidth, vw: window.innerWidth, docW: document.documentElement.scrollWidth })));
console.log("=== DETAIL LeftRail", await page.evaluate(() => {
  const lr = document.querySelector("nav[aria-label='Investigation sections']");
  return lr ? { w: lr.offsetWidth, display: getComputedStyle(lr).display } : "no leftrail";
}));
await page.screenshot({ path: "test-results/diag-03-detail.png", fullPage: true });
console.log("detail screenshot saved");
await browser.close();
