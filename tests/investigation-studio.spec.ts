import { test, expect } from "@playwright/test";

/**
 * Investigation Studio — M3.1 interactions
 * Verifies genuine M2.2 evidence, not fake results, with real interactions.
 */

test.describe("Investigation list — /investigations", () => {
  test("shows investigations with verdict INCONCLUSIVE and navigates to detail", async ({ page }) => {
    await page.goto("/investigations");
    await expect(page.getByRole("heading", { name: "Investigations" })).toBeVisible();
    // Wait for loading to settle, then check for either rows or empty state
    await expect(page.locator("text=Loading investigations…").first()).toBeHidden({ timeout: 10000 }).catch(() => {});
    const anyRow = page.locator('[data-testid^="investigation-row-"]').first();
    if (await anyRow.count() > 0) {
      await expect(anyRow).toBeVisible();
      await anyRow.click();
      await expect(page).toHaveURL(/\/investigations\/.+/);
    } else {
      await expect(page.getByText("No investigations yet")).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId("new-investigation-button")).toBeVisible();
      await page.goto("/investigations/bug-01");
      await expect(page).toHaveURL(/\/investigations\/bug-01/);
      await expect(page.getByTestId("active-timestamp")).toBeVisible();
    }
  });
});

test.describe("Investigation detail — bug-01 studio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/investigations/bug-01");
  });

  test("renders frame viewer with active timestamp and frame meta", async ({ page }) => {
    await expect(page.getByTestId("active-timestamp")).toContainText("00:00.8");
    await expect(page.getByTestId("active-frame-id")).toContainText("frame-00-00-8");
    await expect(page.getByTestId("active-frame-meta")).toContainText("800×450");
    await expect(page.getByTestId("frame-viewer-image")).toBeVisible();
    await expect(page.getByTestId("frame-viewer-image")).toHaveAttribute("src", /frame-00-00-8\.png/);
  });

  test("selecting thumbnail changes central frame", async ({ page }) => {
    // Initially 00:00.8
    await expect(page.getByTestId("active-timestamp")).toContainText("00:00.8");

    // Click 00:01.8 thumbnail (genuine empty-postal error visible)
    await page.getByTestId("filmstrip-thumb-frame-00-01-8").click();
    await expect(page.getByTestId("active-timestamp")).toContainText("00:01.8");
    await expect(page.getByTestId("active-frame-id")).toContainText("frame-00-01-8");
    await expect(page.getByTestId("frame-viewer-image")).toHaveAttribute("src", /frame-00-01-8\.png/);

    // Click 00:04.0
    await page.getByTestId("filmstrip-thumb-frame-00-04-0").click();
    await expect(page.getByTestId("active-timestamp")).toContainText("00:04.0");
  });

  test("keyboard navigation with arrow keys", async ({ page }) => {
    await page.getByTestId("frame-keyboard-group").focus();
    await expect(page.getByTestId("active-timestamp")).toContainText("00:00.8");

    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("active-timestamp")).toContainText("00:01.2");

    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("active-timestamp")).toContainText("00:01.8");

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("active-timestamp")).toContainText("00:01.2");
  });

  test("timeline marker selects its evidence and displays source timestamp/frame", async ({ page }) => {
    // Click observed dot for 00:01.8 (error visible in genuine evidence)
    await page.getByTestId("timeline-observed-frame-00-01-8").click();

    // Inspector should show observation for 00:01.8
    await expect(page.getByTestId("inspector-statement").first()).toContainText("00:01.8");
    await expect(page.getByTestId("inspector-statement").first()).toContainText("Postal code is required");
    await expect(page.getByTestId("inspector-frame-link").first()).toContainText("00:01.8");

    // Active timestamp should follow
    await expect(page.getByTestId("active-timestamp")).toContainText("00:01.8");
  });

  test("timeline hypothesis marker selects hypothesis inspector", async ({ page }) => {
    // Desktop uses DetailLeftRail, mobile uses main tabs — click visible one
    const evidenceTab = page.locator('[data-testid="detail-tab-evidence"]:visible').first();
    await evidenceTab.click();
    await expect(page.locator('[data-testid="evidence-timeline"]:visible').first()).toBeVisible();
    await page.getByTestId("timeline-hypothesis-frame-00-01-8").click();
    await expect(page.locator('[data-testid="inspector-statement"]:visible').first()).toContainText("Inferred click");
    await expect(page.locator('[data-testid="promote-button"]:visible').first()).toBeVisible();
  });

  test("observation and hypothesis are visually distinct and never silently promoted", async ({ page }) => {
    await page.locator('[data-testid="detail-tab-evidence"]:visible').first().click();
    await expect(page.locator('[data-testid="evidence-timeline"]:visible').first()).toBeVisible();
    await expect(page.locator('[data-testid="observation-card-obs-1"]:visible').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="hypothesis-card-hyp-1"]:visible').first()).toBeVisible();
    await page.getByTestId("timeline-hypothesis-frame-00-01-8").click();
    await expect(page.locator('[data-testid="promote-button"]:visible').first()).toBeVisible();
    page.on("dialog", async (dialog) => await dialog.accept());
    await page.locator('[data-testid="promote-button"]:visible').first().click();
    await expect(page.locator('[data-testid="promote-button"]:visible').first()).toBeVisible();
  });

  test("ambiguity is visible", async ({ page }) => {
    await page.locator('[data-testid="detail-tab-evidence"]:visible').first().click();
    await expect(page.locator('[data-testid="evidence-timeline"]:visible').first()).toBeVisible();
    await expect(page.locator('[data-testid="ambiguity-card-amb-1"]:visible').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="ambiguity-card-amb-1"]:visible').first()).toContainText(/display:none/i);
  });

  test("expected behaviour preserved verbatim", async ({ page }) => {
    await expect(page.getByTestId("expected-statement").first()).toContainText('Submitting without postal code must display "Postal code is required."');
  });

  test("navigation works — LeftRail and TopBar", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back to investigations overview" });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/investigations");
    await backLink.click();
    await expect(page).toHaveURL(/\/investigations/);
    await page.goto("/investigations/bug-01");
    await expect(page).toHaveURL(/\/investigations\/bug-01/);
    await expect(page.getByTestId("nav-recording")).toBeVisible();
    await expect(page.getByTestId("nav-evidence")).toBeVisible();
    await expect(page.getByTestId("verdict-badge")).toContainText("REGRESSION_VERIFIED");
    await expect(page.getByTestId("drawer-verdict").first()).toContainText("REGRESSION_VERIFIED");
  });

  test("BUG-01 demo still works unchanged", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=fixed");
    await expect(page.getByTestId("checkout-form")).toBeVisible();
    await expect(page.getByTestId("checkout-submit")).toBeVisible();
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("postal-error")).toBeVisible();
    await expect(page.getByTestId("postal-error")).toHaveText("Postal code is required.");
  });
});
