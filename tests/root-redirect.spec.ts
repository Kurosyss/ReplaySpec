import { test, expect } from "@playwright/test";

test.describe("Root homepage — ReplaySpec entry", () => {
  test("root URL redirects to /investigations and shows ReplaySpec, not starter", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    // Should not be starter: no Next.js logo, no "To get started, edit the page.tsx"
    await expect(page.locator("text=To get started, edit the")).toHaveCount(0);
    await expect(page.locator('img[alt="Next.js logo"]')).toHaveCount(0);
    await expect(page.locator('text=Deploy Now')).toHaveCount(0);

    // Should be investigations: server redirect preserves 307/308 then 200, or client redirect
    // Playwright follows redirects, so final URL must be /investigations
    await expect(page).toHaveURL(/\/investigations\/?$/);
    expect(response?.status()).toBe(200);

    // Investigation list renders correctly
    await expect(page.getByRole("heading", { name: "Investigations" })).toBeVisible();
    await expect(page.getByTestId("investigation-row-bug-01")).toBeVisible();
    await expect(page.getByTestId("theme-toggle")).toBeVisible();

    // No redirect loop: one navigation, no infinite
    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/\/investigations\/investigations/);

    // Theme preserved across redirect
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(["light", "dark"]).toContain(theme);
    await expect.poll(async () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("root does not leave starter artifacts in DOM", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Starter has specific heading "To get started, edit the page.tsx" — already checked, but double-check font
    await expect(page.locator("text=To get started, edit the")).toHaveCount(0);
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fontFamily.toLowerCase()).toContain("inter");
  });
});
