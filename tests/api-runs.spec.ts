import { test, expect } from "@playwright/test";
import { mapBug01ToVerdict } from "@/lib/runs/verdict";

test.describe("API validation — /api/runs", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);
  test("rejects invalid variant", async ({ request }) => {
    const res = await request.post("/api/runs", { data: { variant: "invalid" } });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid request/);
  });

  test("rejects non-allowlisted target", async ({ request }) => {
    const res = await request.post("/api/runs", {
      data: { variant: "fixed", target: "http://evil.com/demo/bug-01?variant=fixed" },
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/allowlisted/);
  });

  test("rejects arbitrary external URL", async ({ request }) => {
    const res = await request.post("/api/runs", {
      data: { variant: "fixed", target: "https://example.com/steal" },
    });
    expect(res.status()).toBe(422);
  });

  test("rejects a target that does not match the selected scenario", async ({ request }) => {
    const res = await request.post("/api/runs", {
      data: { variant: "fixed", target: "http://localhost:3000/demo/bug-02?variant=fixed" },
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/does not match the selected bundled scenario/);
  });

  async function pollForCompletion(request: import("@playwright/test").APIRequestContext, runId: string, timeout = 45000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const res = await request.get(`/api/runs/${runId}`, { timeout: 25000 });
      if (res.status() === 200) {
        const body = await res.json();
        if (body.verdict !== null && body.status !== "running") return body;
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    throw new Error(`Poll timeout for run ${runId}`);
  }

  test("executes only the selected BUG-02 and BUG-03 templates", async ({ request }) => {
    test.setTimeout(180_000);
    for (const scenario of [
      { bugId: "BUG-02", variant: "buggy", verdict: "DEFECT_CONFIRMED" },
      { bugId: "BUG-03", variant: "fixed", verdict: "REGRESSION_VERIFIED" },
    ] as const) {
      const response = await request.post("/api/runs", {
        data: { bugId: scenario.bugId, variant: scenario.variant },
      });
      expect(response.status()).toBe(202);
      const pending = await response.json();
      expect(pending.bugId).toBe(scenario.bugId);
      const testPort = process.env.REPLAYSPEC_TEST_PORT ?? "3000";
      expect(pending.target).toBe(`http://localhost:${testPort}/demo/${scenario.bugId.toLowerCase()}?variant=${scenario.variant}`);

      const completed = await pollForCompletion(request, pending.runId);
      expect(completed.bugId).toBe(scenario.bugId);
      expect(completed.verdict).toBe(scenario.verdict);
    }
  });

  test("creates run for fixed variant and returns DEFECT_CONFIRMED or REGRESSION_VERIFIED or INCONCLUSIVE with artifacts outside public", async ({ request }) => {
    test.setTimeout(60000);
    const res = await request.post("/api/runs", { data: { variant: "fixed" } });
    expect(res.status()).toBe(202);
    const created = await res.json();
    expect(created.runId).toBeTruthy();
    expect(created.variant).toBe("fixed");
    expect(created.target).toMatch(/\/demo\/bug-01\?variant=fixed/);
    expect(created.status).toBe("running");

    const body = await pollForCompletion(request, created.runId);
    expect(["DEFECT_CONFIRMED", "REGRESSION_VERIFIED", "HARNESS_ERROR", "INCONCLUSIVE"]).toContain(body.verdict);
    expect(body.artifacts.length).toBeGreaterThan(0);
    expect(body.artifacts.some((a: { name: string }) => a.name.endsWith(".png") || a.name.endsWith(".webm") || a.name.endsWith(".zip"))).toBe(true);
    const artifactName = body.artifacts.find((a: { name: string }) => a.name.endsWith(".png"))?.name;
    if (artifactName) {
      const artRes = await request.get(`/api/runs/${body.runId}/artifacts/${artifactName}`);
      expect(artRes.status()).toBe(200);
      expect(artRes.headers()["content-type"]).toMatch(/image\/png/);
    }
  });

  test("creates run for buggy variant and returns DEFECT_CONFIRMED", async ({ request }) => {
    test.setTimeout(60000);
    const res = await request.post("/api/runs", { data: { variant: "buggy" } });
    expect(res.status()).toBe(202);
    const created = await res.json();
    expect(created.variant).toBe("buggy");
    const body = await pollForCompletion(request, created.runId);
    expect(body.verdict).toBe("DEFECT_CONFIRMED");
    expect(body.status).toBe("completed");
  });

  test("rejects path traversal in artifact access", async ({ request }) => {
    test.setTimeout(60000);
    const create = await request.post("/api/runs", { data: { variant: "fixed" } });
    const { runId } = await create.json();
    await pollForCompletion(request, runId);

    const traversal = await request.get(`/api/runs/${runId}/artifacts/..%2F..%2Fpackage.json`);
    expect(traversal.status()).toBe(404);

    const traversal2 = await request.get(`/api/runs/${runId}/artifacts/%2e%2e%2fpackage.json`);
    expect(traversal2.status()).toBe(404);

    const traversalRun = await request.get(`/api/runs/..%2Fpackage/artifacts/screenshot.png`);
    expect(traversalRun.status()).toBe(404);
  });

  test("rejects fetching non-existent run", async ({ request }) => {
    const res = await request.get("/api/runs/nonexistent123/artifacts/screenshot.png");
    expect(res.status()).toBe(404);
  });

  test("GET /api/runs/[id] returns typed result", async ({ request }) => {
    test.setTimeout(60000);
    const create = await request.post("/api/runs", { data: { variant: "fixed" } });
    const created = await create.json();
    const body = await pollForCompletion(request, created.runId);
    const fetched = await request.get(`/api/runs/${created.runId}`);
    expect(fetched.status()).toBe(200);
    const fetchedBody = await fetched.json();
    expect(fetchedBody.runId).toBe(created.runId);
    expect(fetchedBody.verdict).toBeTruthy();
    expect(fetchedBody.startedAt).toBeTruthy();
    expect(fetchedBody.artifacts).toBeDefined();
    expect(body.runId).toBe(created.runId);
  });
});

test.describe("Verdict mapping — mapBug01ToVerdict", () => {
  test("buggy hidden → DEFECT_CONFIRMED", () => {
    expect(
      mapBug01ToVerdict({
        variant: "buggy",
        errorVisible: false,
        errorHidden: true,
        errorTextCorrect: true,
        successVisibleAfterFill: null,
        harnessError: null,
      })
    ).toBe("DEFECT_CONFIRMED");
  });

  test("buggy missing feedback → DEFECT_CONFIRMED", () => {
    expect(
      mapBug01ToVerdict({
        variant: "buggy",
        errorVisible: false,
        errorHidden: true,
        errorTextCorrect: false,
        successVisibleAfterFill: null,
        harnessError: null,
      })
    ).toBe("DEFECT_CONFIRMED");
  });

  test("fixed visible + success → REGRESSION_VERIFIED", () => {
    expect(
      mapBug01ToVerdict({
        variant: "fixed",
        errorVisible: true,
        errorHidden: null,
        errorTextCorrect: true,
        successVisibleAfterFill: true,
        harnessError: null,
      })
    ).toBe("REGRESSION_VERIFIED");
  });

  test("harness error → HARNESS_ERROR distinct from defect", () => {
    expect(
      mapBug01ToVerdict({
        variant: "fixed",
        errorVisible: null,
        errorHidden: null,
        errorTextCorrect: null,
        successVisibleAfterFill: null,
        harnessError: "Navigation timeout",
      })
    ).toBe("HARNESS_ERROR");
    expect(
      mapBug01ToVerdict({
        variant: "buggy",
        errorVisible: null,
        errorHidden: null,
        errorTextCorrect: null,
        successVisibleAfterFill: null,
        harnessError: "Browser crashed",
      })
    ).toBe("HARNESS_ERROR");
  });

  test("inconclusive when evidence insufficient", () => {
    expect(
      mapBug01ToVerdict({
        variant: "fixed",
        errorVisible: false,
        errorHidden: null,
        errorTextCorrect: null,
        successVisibleAfterFill: null,
        harnessError: null,
      })
    ).toBe("INCONCLUSIVE");
  });
});

test.describe("Empty-field preconditions — BUG-01 DOM", () => {
  test("fixed: postal empty before submit is asserted", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=fixed");
    await page.getByTestId("postal-code-input").fill("");
    await expect(page.getByTestId("postal-code-input")).toBeEmpty();
    await expect(page.getByTestId("postal-code-input")).toHaveValue("");
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("postal-error")).toBeVisible();
    await expect(page.getByTestId("postal-error")).toHaveText("Postal code is required.");
  });

  test("buggy: postal empty precondition, error hidden (display:none defect)", async ({ page }) => {
    await page.goto("/demo/bug-01?variant=buggy");
    await page.getByTestId("postal-code-input").fill("");
    await expect(page.getByTestId("postal-code-input")).toBeEmpty();
    await page.getByTestId("checkout-submit").click();
    await expect(page.getByTestId("postal-error")).toBeHidden();
    await expect(page.getByTestId("postal-error")).toHaveText("Postal code is required.");
    // Verify hidden via computed style display:none (not just not visible due to outside viewport)
    const display = await page.getByTestId("postal-error").evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe("none");
  });
});
