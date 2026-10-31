import { test, expect } from "@playwright/test";

/**
 * Browser video recording for BUG-01 — empty-postal validation.
 * Extends M3.1 to capture genuine empty-field evidence (Phase 1 M3.2).
 * - Explicitly clears postal field before submission.
 * - Asserts field is empty before clicking Submit (empty-field precondition).
 * - Verifies DOM: fixed shows visible error, buggy keeps error hidden.
 * - Video + trace persisted outside public/ (test-results/artifacts).
 * - Previous M2.2 recordings (postal 94105 populated) are NOT proof of this scenario.
 */

test.use({ video: "on" });

test.describe("BUG-01 video recording — empty postal", () => {
  test("fixed variant — empty postal shows validation error (with video)", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=fixed");

    await expect(page.getByTestId("checkout-form")).toBeVisible();

    // Fill realistic checkout, then explicitly ensure postal is empty (not just "left empty")
    await page.getByTestId("checkout-name-input").fill("Jane Doe");
    await page.getByTestId("checkout-address-input").fill("123 Market St");
    await page.getByTestId("checkout-city-input").fill("San Francisco");

    // Explicitly clear postal field and verify precondition
    await page.getByTestId("postal-code-input").fill("");
    await expect(page.getByTestId("postal-code-input")).toBeEmpty();
    await expect(page.getByTestId("postal-code-input")).toHaveValue("");

    await page.getByTestId("checkout-submit").click();

    // Fixed: error is visible and contains expected message
    await expect(page.getByTestId("postal-error")).toBeVisible();
    await expect(page.getByTestId("postal-error")).toHaveText("Postal code is required.");
    await expect(page.getByTestId("postal-code-input")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("order-success")).toHaveCount(0);

    // Hold error visible for video capture — polling keeps frame stable without waitForTimeout
    await expect.poll(() => page.getByTestId("postal-error").isVisible(), { timeout: 800, intervals: [100] }).toBe(true);

    // Correct and succeed — demonstrates fix allows submission when postal supplied
    await page.getByTestId("postal-code-input").fill("94105");
    await expect(page.getByTestId("postal-code-input")).toHaveValue("94105");
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("order-success")).toBeVisible();
    await expect(page.getByTestId("order-success")).toContainText("Order placed");
    await expect(page.getByTestId("postal-error")).toHaveCount(0);

    // Keep page alive for video tail via assertion polling
    await expect(page.getByTestId("order-success")).toContainText("Order placed");
  });

  test("buggy variant — empty postal error hidden (with video)", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=buggy");

    await expect(page.getByTestId("checkout-form")).toBeVisible();

    // Fill other fields, explicitly clear postal and verify empty precondition
    await page.getByTestId("checkout-name-input").fill("Jane Doe");
    await page.getByTestId("checkout-address-input").fill("123 Market St");
    await page.getByTestId("checkout-city-input").fill("San Francisco");
    await page.getByTestId("postal-code-input").fill("");
    await expect(page.getByTestId("postal-code-input")).toBeEmpty();
    await expect(page.getByTestId("postal-code-input")).toHaveValue("");

    await page.getByTestId("checkout-submit").click();

    // Buggy: error exists in DOM but hidden (display:none) — this is the defect
    await expect(page.getByTestId("postal-error")).toBeHidden();
    await expect(page.getByTestId("postal-error")).toHaveText("Postal code is required.");
    await expect(page.getByTestId("postal-code-input")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("order-success")).toHaveCount(0);

    // Hold hidden state for video capture — ensures video shows no visible feedback sustained
    await expect.poll(() => page.getByTestId("postal-error").isHidden(), { timeout: 800, intervals: [100] }).toBe(true);
  });

  // Preserve original valid-submission flow as non-empty control (not used as empty-postal proof)
  test("fixed variant — valid submission with postal filled (control, with video)", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=fixed");
    await expect(page.getByTestId("checkout-form")).toBeVisible();
    await page.getByTestId("checkout-name-input").fill("Jane Doe");
    await page.getByTestId("checkout-address-input").fill("123 Market St");
    await page.getByTestId("checkout-city-input").fill("San Francisco");
    await page.getByTestId("postal-code-input").fill("94105");
    await expect(page.getByTestId("postal-code-input")).toHaveValue("94105");
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("order-success")).toBeVisible();
    await expect(page.getByTestId("postal-error")).toHaveCount(0);
  });
});
