import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("http://localhost:3000/demo/bug-01?variant=fixed");
await page.getByTestId("checkout-name-input").fill("Jane Doe");
await page.getByTestId("checkout-address-input").fill("123 Market St");
await page.getByTestId("checkout-city-input").fill("San Francisco");
await page.getByTestId("postal-code-input").fill("");
await page.getByTestId("checkout-submit").click();
await page.getByTestId("postal-error").waitFor({ state: "visible", timeout: 2000 });
await page.screenshot({ path: "test-results/error-visible-fixed.png", fullPage: false });
console.log("saved fixed error visible");

await page.goto("http://localhost:3000/demo/bug-01?variant=buggy");
await page.getByTestId("checkout-name-input").fill("Jane Doe");
await page.getByTestId("checkout-address-input").fill("123 Market St");
await page.getByTestId("checkout-city-input").fill("San Francisco");
await page.getByTestId("postal-code-input").fill("");
await page.getByTestId("checkout-submit").click();
await page.getByTestId("postal-error").waitFor({ state: "hidden", timeout: 2000 });
const hidden = await page.getByTestId("postal-error").isVisible();
console.log("buggy error visible?", hidden);
await page.screenshot({ path: "test-results/buggy-hidden.png", fullPage: false });
console.log("saved buggy");

await browser.close();
