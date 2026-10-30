import { test, expect } from "@playwright/test";

/**
 * Browser video recording for BUG-01 scenario.
 *
 * This spec forces video capture (normally retain-on-failure) so we
 * can produce a reproducible artifact outside public/:
 *   test-results/artifacts/bug-01-*.webm
 *
 * Run: npx playwright test bug-01.video --reporter=list
 * The webm can be inspected for the Muse video-analysis pipeline
 * (future: frame sampling for Baseten, see docs/VIDEO_RESEARCH.md).
 */

test.use({ video: "on" });

test.describe("BUG-01 video recording", () => {
  test("fixed variant — valid submission flow (with video)", async ({
    page,
  }) => {
    await page.goto("/demo/bug-01?variant=fixed");

    await expect(page.getByTestId("checkout-form")).toBeVisible();

    // Fill a realistic checkout flow
    await page.getByTestId("checkout-name-input").fill("Jane Doe");
    await page.getByTestId("checkout-address-input").fill("123 Market St");
    await page.getByTestId("checkout-city-input").fill("San Francisco");
    // Intentionally leave postal empty to trigger validation
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("postal-error")).toBeVisible();

    // Correct and succeed
    await page.getByTestId("postal-code-input").fill("94105");
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("order-success")).toBeVisible();

    // Keep page alive briefly for video tail — via assertion polling, not waitForTimeout
    await expect(page.getByTestId("order-success")).toContainText("Order placed");
  });

  test("buggy variant — defect demonstration (with video)", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=buggy");

    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("postal-error")).toBeHidden({ timeout: 2000 });

    // Video should show: click with no visible feedback — the defect.
  });
});
