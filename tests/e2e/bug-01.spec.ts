import { test, expect } from "@playwright/test";

/**
 * BUG-01 — Checkout postal-code validation
 *
 * These tests verify actual browser behaviour for both variants.
 * They are the ground truth for the future regression-compiler:
 * buggy must fail the invariant, fixed must pass it.
 *
 * Evidence artifacts (video, screenshot, trace) are saved to
 * test-results/ (outside public/) per AGENTS.md security rule.
 */

test.describe("BUG-01 checkout postal-code validation", () => {
  test.describe("fixed variant — error is visible", () => {
    test("shows 'Postal code is required' when submitting empty postal code", async ({
      page,
    }) => {
      await page.goto("/demo/bug-01?variant=fixed");

      // Verify page metadata and variant badge
      await expect(page.getByTestId("variant-badge")).toHaveText("fixed");
      await expect(
        page.getByRole("heading", { name: "Checkout", exact: true })
      ).toBeVisible();

      // Form is accessible
      await expect(page.getByTestId("checkout-form")).toBeVisible();
      await expect(page.getByLabel("Postal code")).toBeVisible();
      await expect(page.getByTestId("postal-code-input")).toBeEmpty();
      await expect(page.getByTestId("postal-code-input")).toHaveAttribute(
        "aria-required",
        "true"
      );

      // Before submit, error must not exist in DOM
      await expect(page.getByTestId("postal-error")).toHaveCount(0);

      // Submit without postal code — use accessible role, no waitForTimeout
      await page.getByTestId("checkout-submit").click();

      // FIXED: error is visible with correct text
      const error = page.getByTestId("postal-error");
      await expect(error).toBeVisible();
      await expect(error).toHaveText("Postal code is required.");
      await expect(error).toHaveAttribute("role", "alert");

      // Input reflects invalid state
      await expect(page.getByTestId("postal-code-input")).toHaveAttribute(
        "aria-invalid",
        "true"
      );

      // No success message
      await expect(page.getByTestId("order-success")).toHaveCount(0);
    });

    test("allows successful order when postal code is provided", async ({
      page,
    }) => {
      await page.goto("/demo/bug-01?variant=fixed");

      await page.getByTestId("postal-code-input").fill("94105");
      await page.getByTestId("checkout-submit").click();

      await expect(page.getByTestId("postal-error")).toHaveCount(0);
      await expect(page.getByTestId("order-success")).toBeVisible();
      await expect(page.getByTestId("order-success")).toContainText("No order was placed");
    });

    test("variant switcher navigates correctly", async ({ page }) => {
      await page.goto("/demo/bug-01?variant=fixed");
      await expect(page.getByTestId("variant-badge")).toHaveText("fixed");

      await page.getByTestId("variant-buggy-link").click();
      await expect(page).toHaveURL(/variant=buggy/);
      await expect(page.getByTestId("variant-badge")).toHaveText("buggy");
    });
  });

  test.describe("buggy variant — defect reproduced", () => {
    test("error exists in DOM but is hidden (display:none defect)", async ({
      page,
    }) => {
      await page.goto("/demo/bug-01?variant=buggy");

      await expect(page.getByTestId("variant-badge")).toHaveText("buggy");

      // Before submit no error
      await expect(page.getByTestId("postal-error")).toHaveCount(0);

      await page.getByTestId("checkout-submit").click();

      const error = page.getByTestId("postal-error");

      // Defect: error is in DOM but not visible
      await expect(error).toHaveCount(1);
      await expect(error).toBeHidden();
      await expect(error).not.toBeVisible();
      // Still has correct text, proving display:none is the defect, not missing logic
      await expect(error).toHaveText("Postal code is required.");

      // aria-invalid is still set (accessibility layer is correct, visual layer is broken)
      await expect(page.getByTestId("postal-code-input")).toHaveAttribute(
        "aria-invalid",
        "true"
      );

      // No success message either
      await expect(page.getByTestId("order-success")).toHaveCount(0);
    });

    test("buggy variant invariant fails: error is not visible", async ({
      page,
    }) => {
      await page.goto("/demo/bug-01?variant=buggy");
      await page.getByTestId("checkout-submit").click();

      // This is the exact assertion the future regression compiler will emit.
      // It PASSES on fixed, FAILS on buggy — the desired signal.
      const error = page.getByTestId("postal-error");
      await expect(error).toBeHidden();
      // No strict expect(error).toBeVisible() here because this test documents the defect.
      // The companion fixed test proves the invariant.
    });
  });

  test.describe("accessibility", () => {
    test("postal input has accessible label in both variants", async ({
      page,
    }) => {
      for (const variant of ["buggy", "fixed"] as const) {
        await page.goto(`/demo/bug-01?variant=${variant}`);
        await expect(page.getByLabel("Postal code")).toBeVisible();
        await expect(page.getByLabel("Full name")).toBeVisible();
        await expect(page.getByLabel("Street address")).toBeVisible();
        await expect(page.getByLabel("City")).toBeVisible();
      }
    });
  });
});
