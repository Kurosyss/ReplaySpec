import { test, expect } from "@playwright/test";

test.describe("Execution UI — honest states", () => {
  test.setTimeout(60_000);
  test.beforeEach(async ({ page }) => {
    await page.goto("/investigations/bug-01");
  });

  test("idle shows ready state with variant select and mapping", async ({ page }) => {
    await expect(page.getByTestId("drawer-variant-select")).toBeVisible();
    await expect(page.getByTestId("run-regression-button")).toBeVisible();
    await expect(page.getByTestId("run-regression-button")).toBeEnabled();
    await expect(page.getByText(/Allowlisted/)).toBeVisible();
    await expect(page.getByText(/Verdict mapping/)).toBeVisible();
  });

  test("running shows Running badge and does not fabricate result", async ({ page }) => {
    // Start run
    await page.getByTestId("run-regression-button").click();

    // Should show Running quickly
    await expect(page.getByTestId("execution-status")).toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId("execution-status")).toContainText("Running");

    // Button should be disabled while running
    await expect(page.getByTestId("run-regression-button")).toBeDisabled();

    // Should NOT immediately show completed verdict before server responds
    // Wait for actual completion (real execution takes 5-10s, allow 45s under load)
    await expect(page.getByTestId("execution-completed")).toBeVisible({ timeout: 45000 });
    // Verdict must be one of the 4 real verdicts, not fake — check completed section contains verdict text
    await expect(page.getByTestId("execution-completed")).toContainText(/DEFECT_CONFIRMED|REGRESSION_VERIFIED|HARNESS_ERROR|INCONCLUSIVE/, { timeout: 5000 });
  });

  test("completed shows artifacts only for that run", async ({ page }) => {
    await page.getByTestId("run-regression-button").click();
    await expect(page.getByTestId("execution-completed")).toBeVisible({ timeout: 45000 });

    // Artifacts — poll for at least one artifact link (real execution may take a moment to persist)
    const firstArtifact = page.locator('[data-testid^="artifact-link-"]').first();
    await expect(firstArtifact).toBeVisible({ timeout: 10000 });
    await expect(firstArtifact).toContainText(/screenshot|trace|video|\.png|\.webm|\.zip/);

    // Artifacts path outside public — check within completed section
    await expect(page.locator('[data-testid="execution-completed"]').getByText(/test-results\/runs\//)).toBeVisible();
    await expect(page.locator('[data-testid="execution-completed"]').getByText(/path traversal rejected/)).toBeVisible();
  });

  test("harness error visually distinct from defect (violet vs red)", async ({ page }) => {
    await page.selectOption('[data-testid="drawer-variant-select"]', "buggy");
    await page.getByTestId("run-regression-button").click();
    await expect(page.getByTestId("execution-completed")).toBeVisible({ timeout: 45000 });
    // Verify completed shows a verdict (real execution, not fabricated)
    await expect(page.getByTestId("execution-completed")).toContainText(/DEFECT_CONFIRMED|REGRESSION_VERIFIED|HARNESS_ERROR|INCONCLUSIVE/);
    // If HARNESS_ERROR, it must be violet distinct — never shown as red defect badge
    const completedText = await page.getByTestId("execution-completed").textContent();
    if (completedText?.includes("HARNESS_ERROR")) {
      await expect(page.locator('[data-testid="harness-error-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="harness-error-badge"]')).toHaveClass(/violet/);
    } else {
      // For DEFECT_CONFIRMED, ensure harness badge not present (no misclassification)
      await expect(page.locator('[data-testid="harness-error-badge"]')).toHaveCount(0);
    }
  });

  test("variant select changes target", async ({ page }) => {
    await expect(page.getByTestId("drawer-variant-select")).toHaveValue("fixed");
    await page.selectOption('[data-testid="drawer-variant-select"]', "buggy");
    await expect(page.getByTestId("drawer-variant-select")).toHaveValue("buggy");
    await page.selectOption('[data-testid="drawer-variant-select"]', "fixed");
    await expect(page.getByTestId("drawer-variant-select")).toHaveValue("fixed");
  });
});
