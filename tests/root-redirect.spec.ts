import { test, expect } from "@playwright/test";

test.describe("Root homepage — ReplaySpec entry", () => {
  test("root URL shows the editorial product introduction, not starter content", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    // Should not be starter: no Next.js logo, no "To get started, edit the page.tsx"
    await expect(page.locator("text=To get started, edit the")).toHaveCount(0);
    await expect(page.locator('img[alt="Next.js logo"]')).toHaveCount(0);
    await expect(page.locator('text=Deploy Now')).toHaveCount(0);

    await expect(page).toHaveURL(/\/$/);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /From bug clip to proof/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Explore the investigations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Analyze a recording/i })).toBeVisible();
    await expect(page.getByTestId("theme-toggle")).toBeVisible();

    // No redirect loop: one navigation, no infinite
    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/\/investigations\/investigations/);

    // Theme is set on the home route.
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(["light", "dark"]).toContain(theme);
    await expect.poll(async () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("root uses the Geist Sans text stack and does not leave starter artifacts", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // The interface uses the local Geist Sans font stack.
    await expect(page.locator("text=To get started, edit the")).toHaveCount(0);
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fontFamily.toLowerCase()).toContain("geist");
  });

  test("homepage cart preview uses a complete 40:29 capture", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const preview = page.getByAltText("Captured BUG-02 cart state at quantity one");
    await expect(preview).toBeVisible();
    const dimensions = await preview.evaluate((image: HTMLImageElement) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    }));
    expect(dimensions.width / dimensions.height).toBeCloseTo(40 / 29, 2);
    expect(await preview.getAttribute("src")).toContain("bug02-home.png");
  });

  test("data-use and prototype terms disclose the demo boundaries", async ({ page }) => {
    await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /What happens to a recording/i })).toBeVisible();
    await expect(page.getByText(/configured vision-model provider/i)).toBeVisible();
    await page.goto("/terms", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /A research demonstration/i })).toBeVisible();
    await expect(page.getByText(/do not process a payment/i)).toBeVisible();
  });

  test("unknown paths show a useful recovery route", async ({ page }) => {
    await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /This page isn’t in the record/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Investigations" })).toBeVisible();
  });

  test("internal brand explorations are not exposed as a judge-facing page", async ({ page }) => {
    await page.goto("/logo-concepts", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /From bug clip to proof/i })).toBeVisible();
  });
});
