import { test, expect } from "@playwright/test";

test.describe("Theme toggle — Linear-inspired dual theme", () => {
  test("toggle switches between light and dark and persists across reloads", async ({ page }) => {
    await page.goto("/investigations");
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-label", /Switch to (light|dark) mode/);

    const initial = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(["light", "dark"]).toContain(initial);

    // Toggle
    await toggle.click();
    const afterFirst = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(afterFirst).not.toBe(initial);
    expect(afterFirst).toBe(initial === "dark" ? "light" : "dark");
    expect(await page.evaluate(() => localStorage.getItem("replayspec-theme"))).toBe(afterFirst);
    await expect(toggle).toHaveAttribute("aria-label", `Switch to ${afterFirst === "dark" ? "light" : "dark"} mode`);

    // Persist across reload
    await page.reload();
    const afterReload = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(afterReload).toBe(afterFirst);

    // Toggle back
    await page.getByTestId("theme-toggle").click();
    const afterSecond = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(afterSecond).toBe(initial);
  });

  test("respects system preference when no stored preference", async ({ browser }) => {
    const contextDark = await browser.newContext({ colorScheme: "dark" });
    const pageDark = await contextDark.newPage();
    // Clear storage to test system preference fallback
    await pageDark.goto("/investigations");
    await pageDark.evaluate(() => localStorage.removeItem("replayspec-theme"));
    await pageDark.reload();
    await expect.poll(async () => pageDark.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
    await contextDark.close();

    const contextLight = await browser.newContext({ colorScheme: "light" });
    const pageLight = await contextLight.newPage();
    await pageLight.goto("/investigations");
    await pageLight.evaluate(() => localStorage.removeItem("replayspec-theme"));
    await pageLight.reload();
    await expect.poll(async () => pageLight.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
    await contextLight.close();
  });

  test("theme persists consistently across navigation (all routes)", async ({ page }) => {
    await page.goto("/investigations");
    const toggle = page.getByTestId("theme-toggle");
    // Force to dark
    const current = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    if (current !== "dark") await toggle.click();
    await expect.poll(async () => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    // Navigate to detail — should stay dark
    await page.getByTestId("investigation-row-bug-01").click();
    await expect(page).toHaveURL(/\/investigations\/bug-01/);
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
    expect(await page.evaluate(() => localStorage.getItem("replayspec-theme"))).toBe("dark");

    // Navigate to demo buggy — should stay dark
    await page.goto("/demo/bug-01?variant=buggy");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    // Navigate to demo fixed — should stay dark
    await page.goto("/demo/bug-01?variant=fixed");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    // Back to investigations — still dark
    await page.goto("/investigations");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");
  });

  test("prevents flash — inline script sets data-theme before hydration", async ({ page }) => {
    await page.goto("/investigations");
    const hasScript = await page.evaluate(() => {
      return document.documentElement.hasAttribute("data-theme");
    });
    expect(hasScript).toBeTruthy();
    // No FOUC: canvas background should be either #08090A (dark) or #ffffff (light), not unstyled
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("theme works on mobile viewport", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/investigations");
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toBeVisible();
    const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await toggle.click();
    const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(after).not.toBe(before);

    await page.goto("/investigations/bug-01");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(after);

    await page.goto("/demo/bug-01?variant=buggy");
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(after);
    await context.close();
  });

  test("visual regression — dark theme uses Linear dark tokens, light uses light tokens", async ({ page }) => {
    // Verify that CSS variables correctly apply per theme (not just inverted)
    await page.goto("/investigations");
    // Force light
    await page.evaluate(() => {
      localStorage.setItem("replayspec-theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
    });
    await page.reload();
    const lightCanvas = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--canvas").trim());
    expect(["#ffffff", "#fff"].includes(lightCanvas.toLowerCase())).toBeTruthy();

    // Force dark
    await page.evaluate(() => {
      localStorage.setItem("replayspec-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.reload();
    const darkCanvas = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--canvas").trim());
    expect(darkCanvas.toLowerCase()).toBe("#08090a");
    expect(darkCanvas).not.toBe(lightCanvas);
  });

  test("BUG-01 functionality preserved in both themes", async ({ page }) => {
    for (const theme of ["light", "dark"] as const) {
      await page.goto("/investigations");
      await page.evaluate((t) => {
        localStorage.setItem("replayspec-theme", t);
        document.documentElement.setAttribute("data-theme", t);
        document.documentElement.classList.toggle("dark", t === "dark");
      }, theme);
      await page.goto("/demo/bug-01?variant=fixed");
      await expect(page.getByTestId("checkout-form")).toBeVisible();
      await page.getByTestId("postal-code-input").fill("");
      await expect(page.getByTestId("postal-code-input")).toBeEmpty();
      await page.getByTestId("checkout-submit").click();
      await expect(page.getByTestId("postal-error")).toBeVisible();
      await expect(page.getByTestId("postal-error")).toHaveText("Postal code is required.");

      await page.goto("/demo/bug-01?variant=buggy");
      await page.getByTestId("postal-code-input").fill("");
      await page.getByTestId("checkout-submit").click();
      await expect(page.getByTestId("postal-error")).toBeHidden();
      const display = await page.getByTestId("postal-error").evaluate((el) => getComputedStyle(el).display);
      expect(display).toBe("none");
    }
  });
});
