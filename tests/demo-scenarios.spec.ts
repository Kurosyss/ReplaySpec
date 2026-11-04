import { test, expect } from "@playwright/test";

test.describe("Bundled benchmark scenarios", () => {
  test.setTimeout(120_000);

  test("BUG-02 buggy cart loses one of two rapid clicks", async ({ page }) => {
    await page.goto("/demo/bug-02?variant=buggy", { waitUntil: "networkidle" });
    const increment = page.getByTestId("cart-increment");
    await increment.click();
    await increment.click();

    await expect(page.getByTestId("cart-quantity")).toHaveText("2");
    await expect(page.getByTestId("cart-race-detected")).toBeVisible();
  });

  test("BUG-02 fixed cart preserves both rapid clicks", async ({ page }) => {
    await page.goto("/demo/bug-02?variant=fixed", { waitUntil: "networkidle" });
    const increment = page.getByTestId("cart-increment");
    await increment.click();
    await increment.click();

    await expect(page.getByTestId("cart-quantity")).toHaveText("3");
    await expect(page.getByTestId("order-success")).toBeVisible();
  });

  test("BUG-03 buggy overlay blocks Cancel", async ({ page }) => {
    await page.goto("/demo/bug-03?variant=buggy", { waitUntil: "networkidle" });
    const cancel = page.getByTestId("modal-cancel-btn");
    const box = await cancel.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(page.getByTestId("modal-container")).toBeVisible();
    await expect(page.getByTestId("modal-click-blocked-alert")).toBeVisible();
    await expect(page.getByTestId("modal-dismissed-alert")).toHaveCount(0);
  });

  test("BUG-03 fixed modal closes on Cancel", async ({ page }) => {
    await page.goto("/demo/bug-03?variant=fixed", { waitUntil: "networkidle" });
    await page.getByTestId("modal-cancel-btn").click();

    await expect(page.getByTestId("modal-container")).toHaveCount(0);
    await expect(page.getByTestId("modal-dismissed-alert")).toBeVisible();
  });

  test("paired run shows buggy failure and fixed verification", async ({ page }) => {
    test.setTimeout(360_000);
    await page.goto("/investigations/bug-02", { waitUntil: "networkidle" });
    await page.getByTestId("nav-execution").click();
    await page.getByTestId("compare-variants-button").click();

    const results = page.getByTestId("variant-comparison");
    await expect(results).toBeVisible({ timeout: 180_000 });
    await expect(results).toContainText("buggy");
    await expect(results).toContainText("DEFECT_CONFIRMED");
    await expect(results).toContainText("fixed", { timeout: 300_000 });
    await expect(results).toContainText("REGRESSION_VERIFIED", { timeout: 300_000 });
  });

  test("BUG-02 investigation runs the cart scenario", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto("/investigations/bug-02", { waitUntil: "networkidle" });
    await page.getByTestId("nav-execution").click();
    await expect(page.getByTestId("drawer-variant-select")).toHaveValue("buggy");
    await page.getByTestId("run-regression-button").click();

    const completed = page.getByTestId("execution-completed");
    await expect(completed).toBeVisible({ timeout: 180000 });
    await expect(completed).toContainText("/demo/bug-02?variant=buggy");
    await expect(completed).toContainText("DEFECT_CONFIRMED");
    const resultText = await completed.textContent();
    const runId = resultText?.match(/run\s+([a-z0-9-]+)/i)?.[1];
    expect(runId).toBeTruthy();
    const response = await page.request.get(`/api/runs/${runId}`);
    const result = await response.json();
    expect(result.verdict).toBe("DEFECT_CONFIRMED");
    expect(result.logs.join("\n")).toContain("initial=1 final=2 after two rapid clicks");
    expect(result.artifacts.some((artifact: { name: string }) => artifact.name.endsWith(".webm"))).toBe(true);
  });

  test("BUG-03 investigation runs the modal scenario", async ({ page }) => {
    await page.goto("/investigations/bug-03", { waitUntil: "networkidle" });
    await page.getByTestId("nav-execution").click();
    await expect(page.getByTestId("drawer-variant-select")).toHaveValue("buggy");
    await page.getByTestId("run-regression-button").click();

    const completed = page.getByTestId("execution-completed");
    await expect(completed).toBeVisible({ timeout: 180000 });
    await expect(completed).toContainText("/demo/bug-03?variant=buggy");
    await expect(completed).toContainText("DEFECT_CONFIRMED");
  });
});
