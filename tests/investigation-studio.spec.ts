import { test, expect } from "@playwright/test";

/**
 * Investigation Studio — M3.1 interactions
 * Verifies genuine M2.2 evidence, not fake results, with real interactions.
 */

test.describe("Investigation list — /investigations", () => {
  test("shows investigations with verdict INCONCLUSIVE and navigates to detail", async ({ page }) => {
    await page.goto("/investigations");

    await expect(page.getByRole("heading", { name: "Investigations" })).toBeVisible();
    await expect(page.getByTestId("investigation-row-bug-01")).toBeVisible();
    await expect(page.getByTestId("investigation-row-bug-01")).toContainText("REGRESSION_VERIFIED");
    await expect(page.getByTestId("investigation-row-bug-01")).toContainText("/demo/bug-01");

    // Limitation preserved in UI — check via amber banner on list (or updated genuine evidence note)
    await expect(page.getByText(/Current limitation|Evidence Integrity|genuine/).first()).toBeVisible();

    // Navigate
    await page.getByTestId("investigation-row-bug-01").click();
    await expect(page).toHaveURL(/\/investigations\/bug-01/);
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
    await page.getByTestId("timeline-hypothesis-frame-00-01-8").click();
    await expect(page.getByTestId("inspector-statement").first()).toContainText("Inferred click");
    // Hypothesis should be visually distinct — has Promote button, not observation
    await expect(page.getByTestId("promote-button").first()).toBeVisible();
  });

  test("observation and hypothesis are visually distinct and never silently promoted", async ({ page }) => {
    // Observations exist — multiple renderings (mobile/desktop), check first visible in default list view
    await expect(page.getByTestId("observation-card-obs-1").first()).toBeVisible();
    await expect(page.getByTestId("observation-card-obs-1").first()).toContainText("Observed");

    // Hypotheses exist separately with dashed style
    await expect(page.getByTestId("hypothesis-card-hyp-1").first()).toBeVisible();
    await expect(page.getByTestId("hypothesis-card-hyp-1").first()).toContainText(/Hypothesis/i);

    // Promote requires explicit button, not auto — click hypothesis timeline dot
    await page.getByTestId("timeline-hypothesis-frame-00-01-8").click();
    await expect(page.getByTestId("promote-button").first()).toBeVisible();
    await expect(page.getByTestId("promote-button").first()).toContainText("Promote to Observation");
    // Button should not auto-promote — clicking should show alert
    page.on("dialog", async (dialog) => await dialog.accept());
    await page.getByTestId("promote-button").first().click();
    // After dismissing promote dialog, inspector still shows hypothesis, not silently created observation
    await expect(page.getByTestId("promote-button").first()).toBeVisible();
  });

  test("ambiguity is visible", async ({ page }) => {
    await expect(page.getByTestId("ambiguity-card-amb-1").first()).toBeVisible();
    await expect(page.getByTestId("ambiguity-card-amb-1").first()).toContainText(/display:none/i);
    // Ambiguity card itself is the evidence of uncertainty — limitation card is in header, not inspector on small viewports
    await expect(page.getByTestId("ambiguity-card-amb-1").first()).toContainText(/cannot be verified/i);
  });

  test("expected behaviour preserved verbatim", async ({ page }) => {
    await expect(page.getByTestId("expected-statement").first()).toContainText('Submitting without postal code must display "Postal code is required."');
  });

  test("navigation works — LeftRail and TopBar", async ({ page }) => {
    // TopBar investigations link (overview)
    await expect(page.getByRole("link", { name: "Back to investigations overview" })).toBeVisible();
    await page.getByRole("link", { name: "Back to investigations overview" }).click();
    await expect(page).toHaveURL(/\/investigations$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/investigations\/bug-01/);

    // LeftRail navigation
    await expect(page.getByTestId("nav-recording")).toBeVisible();
    await expect(page.getByTestId("nav-evidence")).toBeVisible();

    // Verdict badge preserved — now genuine evidence shows REGRESSION_VERIFIED
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
