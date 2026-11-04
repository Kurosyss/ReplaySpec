import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { isAllowedUrl } from "../allowlist";
import type { BugId, RunResult, Verdict } from "./types";
import { mapBug01ToVerdict } from "./verdict";
import { extractFramesFromVideoAsync } from "../frames/extractor";

const RUNS_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), "test-results", "runs");

function ensureRunsRoot() {
  fs.mkdirSync(RUNS_ROOT, { recursive: true });
}

function generateRunId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 7);
  return `${ts}-${rnd}`;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Server-only execution for predetermined BUG-01 scenario.
 * Validates variant and target against allowlist, runs Playwright with controlled setup,
 * persists screenshot, trace.zip, video.webm outside public/, returns typed result.
 * Does NOT accept arbitrary URLs, shell commands, or user-supplied scripts.
 */
export function createPendingRun(opts: { bugId: BugId; variant: "buggy" | "fixed"; target: string }): RunResult {
  ensureRunsRoot();
  const runId = generateRunId();
  const runDir = path.join(RUNS_ROOT, runId);
  fs.mkdirSync(runDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const pending: RunResult = {
    runId,
    bugId: opts.bugId,
    variant: opts.variant,
    target: opts.target,
    status: "running",
    verdict: null,
    startedAt,
    completedAt: null,
    durationMs: null,
    error: null,
    artifacts: [],
    logs: [`[${startedAt}] Run ${runId} queued variant=${opts.variant} target=${opts.target}`],
  };
  fs.writeFileSync(path.join(runDir, "result.json"), JSON.stringify(pending, null, 2), "utf8");
  return pending;
}

export async function runScenario(opts: { bugId: BugId; variant: "buggy" | "fixed"; target: string; runId?: string }): Promise<RunResult> {
  ensureRunsRoot();
  const runId = opts.runId ?? generateRunId();
  const runDir = path.join(RUNS_ROOT, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const logs: string[] = [];
  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    logs.push(line);
    // also append to file for debugging
    try {
      fs.appendFileSync(path.join(runDir, "run.log"), line + "\n");
    } catch {}
  };

  log(`Run ${runId} started variant=${opts.variant} target=${opts.target}`);

  // Validate target against allowlist (server-side)
  if (!isAllowedUrl(opts.target)) {
    const err = `Target not allowlisted: ${opts.target}`;
    log(`HARNESS_ERROR: ${err}`);
    return {
      runId,
      bugId: opts.bugId,
      variant: opts.variant,
      target: opts.target,
      status: "failed",
      verdict: "HARNESS_ERROR",
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - new Date(startedAt).getTime(),
      error: err,
      artifacts: [],
      logs,
    };
  }

  const expectedPath = `/demo/${opts.bugId.toLowerCase()}`;
  const targetUrl = new URL(opts.target);
  if (targetUrl.pathname !== expectedPath || targetUrl.searchParams.get("variant") !== opts.variant) {
    const err = "Target does not match the selected bundled scenario and variant";
    log(`HARNESS_ERROR: ${err}`);
    return {
      runId,
      bugId: opts.bugId,
      variant: opts.variant,
      target: opts.target,
      status: "failed",
      verdict: "HARNESS_ERROR",
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - new Date(startedAt).getTime(),
      error: err,
      artifacts: [],
      logs,
    };
  }

  const startMs = Date.now();
  let verdict: Verdict | null = null;
  let harnessError: string | null = null;
  let errorVisible: boolean | null = null;
  let errorHidden: boolean | null = null;
  let errorTextCorrect: boolean | null = null;
  let successVisibleAfterFill: boolean | null = null;
  let observedDefect = false;
  let fixedBehaviourVerified = false;

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  let context: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newContext"]>> | null = null;
  let result: RunResult | null = null;

  try {
    browser = await chromium.launch();
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: runDir, size: { width: 960, height: 540 } },
    });

    await context.tracing.start({ screenshots: false, snapshots: false, sources: false });

    const page = await context.newPage();

    // Navigate to allowlisted target
    log(`Navigating to ${opts.target}`);
    await page.goto(opts.target, { waitUntil: "networkidle", timeout: 45000 });
    const readySelector = opts.bugId === "BUG-01"
      ? "checkout-form"
      : opts.bugId === "BUG-02"
        ? "cart-counter-card"
        : "modal-container";
    await page.getByTestId(readySelector).waitFor({ state: "visible", timeout: 8000 });
    if (opts.bugId === "BUG-02") {
      await page.locator('[data-testid="cart-counter-card"][data-interactive="true"]').waitFor({ state: "visible", timeout: 8000 });
    }
    log(`Navigated, URL: ${page.url()}`);

    // Verify we are still on allowlisted origin (no redirect to external)
    if (!isAllowedUrl(page.url())) {
      throw new Error(`Post-navigation URL not allowlisted: ${page.url()}`);
    }

    if (opts.bugId === "BUG-01") {
      // Fill fields, explicitly clear postal, and assert the empty precondition.
      await page.getByTestId("checkout-name-input").fill("Jane Doe");
      await page.getByTestId("checkout-address-input").fill("123 Market St");
      await page.getByTestId("checkout-city-input").fill("San Francisco");
      await page.getByTestId("postal-code-input").fill("");
      const isEmpty = await page.getByTestId("postal-code-input").inputValue().then((v: string) => v === "");
      log(`Postal empty precondition: ${isEmpty}`);
      if (!isEmpty) throw new Error("Postal precondition failed: field not empty after fill('')");

      await page.getByTestId("checkout-submit").click();
      log("Clicked submit with empty postal");

      if (opts.variant === "fixed") {
      // Fixed should show visible error
      await page.getByTestId("postal-error").waitFor({ state: "visible", timeout: 8000 });
      errorVisible = await page.getByTestId("postal-error").isVisible();
      errorTextCorrect = (await page.getByTestId("postal-error").textContent())?.trim() === "Postal code is required.";
      log(`Fixed: errorVisible=${errorVisible} errorTextCorrect=${errorTextCorrect}`);
      // Hold for video capture
      await page.getByTestId("postal-error").waitFor({ state: "visible", timeout: 500 });

      // Then correct and verify success
      await page.getByTestId("postal-code-input").fill("94105");
      await page.getByTestId("checkout-submit").click();
      await page.getByTestId("order-success").waitFor({ state: "visible", timeout: 8000 });
      successVisibleAfterFill = await page.getByTestId("order-success").isVisible();
      log(`Fixed: successVisibleAfterFill=${successVisibleAfterFill}`);
        fixedBehaviourVerified = errorVisible === true && errorTextCorrect === true && successVisibleAfterFill === true;
      } else {
      // Buggy: the required feedback may be hidden or omitted entirely. Either way,
      // the user cannot see the expected error; record whether the node existed.
      const postalError = page.getByTestId("postal-error");
      const errorCount = await postalError.count();
      if (errorCount === 0) {
        errorHidden = true;
        errorTextCorrect = false;
        errorVisible = false;
        log("Buggy: required postal error is absent from the DOM after empty submission");
      } else {
        await postalError.waitFor({ state: "hidden", timeout: 8000 });
        errorHidden = await postalError.isHidden();
        const txt = await postalError.textContent();
        errorTextCorrect = txt?.trim() === "Postal code is required.";
        errorVisible = await postalError.isVisible();
        log(`Buggy: errorHidden=${errorHidden} errorVisible=${errorVisible} errorTextCorrect=${errorTextCorrect}`);
        await postalError.waitFor({ state: "hidden", timeout: 500 });
      }
        observedDefect = errorHidden === true;
      }
    } else if (opts.bugId === "BUG-02") {
      const quantity = page.getByTestId("cart-quantity");
      if ((await quantity.textContent())?.trim() !== "1") {
        throw new Error("Cart quantity precondition failed: expected 1");
      }

      const increment = page.getByTestId("cart-increment");
      await increment.scrollIntoViewIfNeeded();
      const box = await increment.boundingBox();
      if (!box) throw new Error("Cart increment control is not available");
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.locator('[data-testid="order-success"], [data-testid="cart-race-detected"]').waitFor({ state: "visible", timeout: 5000 });
      await page.getByTestId("cart-sync-status").getByText("2 increment clicks registered").waitFor({ state: "visible", timeout: 3000 });

      const finalQuantity = Number((await quantity.textContent())?.trim());
      log(`Cart invariant: initial=1 final=${finalQuantity} after two rapid clicks`);
      observedDefect = finalQuantity !== 3;
      fixedBehaviourVerified = finalQuantity === 3;
    } else {
      const cancel = page.getByTestId("modal-cancel-btn");
      await cancel.scrollIntoViewIfNeeded();
      const box = await cancel.boundingBox();
      if (!box) throw new Error("Modal Cancel control is not available");
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      if (opts.variant === "buggy") {
        await page.getByTestId("modal-click-blocked-alert").waitFor({ state: "visible", timeout: 3000 });
      } else {
        await page.getByTestId("modal-dismissed-alert").waitFor({ state: "visible", timeout: 3000 });
      }

      const dialogRemainsOpen = await page.getByTestId("modal-container").isVisible();
      const dismissed = await page.getByTestId("modal-dismissed-alert").isVisible().catch(() => false);
      log(`Modal cancel invariant: dialogOpen=${dialogRemainsOpen} dismissed=${dismissed}`);
      observedDefect = dialogRemainsOpen;
      fixedBehaviourVerified = !dialogRemainsOpen && dismissed;
    }

    // Screenshot
    const screenshotPath = path.join(runDir, "screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    log(`Screenshot saved`);

    // Trace
    const tracePath = path.join(runDir, "trace.zip");
    await context.tracing.stop({ path: tracePath });
    log(`Trace saved`);

    verdict = opts.bugId === "BUG-01"
      ? mapBug01ToVerdict({
          variant: opts.variant,
          errorVisible,
          errorHidden,
          errorTextCorrect,
          successVisibleAfterFill,
          harnessError: null,
        })
      : opts.variant === "buggy" && observedDefect
        ? "DEFECT_CONFIRMED"
        : opts.variant === "fixed" && fixedBehaviourVerified
          ? "REGRESSION_VERIFIED"
          : "INCONCLUSIVE";
    log(`Verdict: ${verdict}`);

    // Keep result.json running until browser shutdown and all artifacts are finalized.
    // Otherwise the client stops polling before the recorded video is available.

    // Video will be saved on page/context close
    try {
      await page.close();
    } catch {}
    try {
      await context.close();
      context = null;
    } catch {}
    try {
      await browser.close();
      browser = null;
    } catch {}

    // Find video file (playwright names it with page id)
    const videoFiles = fs.readdirSync(runDir).filter((f) => f.endsWith(".webm") || f.endsWith(".mp4"));
    if (videoFiles.length === 0) {
      // Fallback: video may be in subdir
      const sub = fs.readdirSync(runDir, { withFileTypes: true });
      for (const d of sub) {
        if (d.isDirectory()) {
          const inner = fs.readdirSync(path.join(runDir, d.name)).filter((f) => f.endsWith(".webm"));
          if (inner.length) {
            for (const f of inner) {
              fs.renameSync(path.join(runDir, d.name, f), path.join(runDir, f));
            }
          }
        }
      }
    }

    // BUG-01 run captures can seed a new investigation, so keep their timestamped frames.
    // BUG-02/03 run frames are not consumed by the investigation import flow; skip six
    // redundant FFmpeg launches there so judges see the verdict without long post-run delay.
    if (opts.bugId === "BUG-01") {
      try {
        const videoFile = fs.readdirSync(runDir).find((f) => f.endsWith(".webm") || f.endsWith(".mp4"));
        if (videoFile) {
          const videoPath = path.join(runDir, videoFile);
          const framesDir = path.join(runDir, "frames");
          const extraction = await extractFramesFromVideoAsync(videoPath, framesDir, runId);
      if (extraction.ok) {
            log(`Frame extraction: ${extraction.frames.length} frames from ${videoFile} (${extraction.duration.toFixed(2)}s)`);
            fs.writeFileSync(path.join(framesDir, "manifest.json"), JSON.stringify({ sourceVideo: videoFile, frames: extraction.frames, duration: extraction.duration, extractedAt: new Date().toISOString() }, null, 2), "utf8");
          } else {
            log(`Frame extraction failed: ${extraction.error}`);
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log(`Frame extraction error: ${msg}`);
      }
    } else {
      log(`Frame extraction skipped for ${opts.bugId}; screenshot, trace, and video are retained.`);
    }

    // Collect all artifacts
    const allArtifacts = [];
    try {
      const files = fs.readdirSync(runDir);
      for (const f of files) {
        if (f === "run.log" || f === "result.json") continue;
        const fp = path.join(runDir, f);
        const stat = fs.statSync(fp);
        if (stat.isFile()) {
          const ext = path.extname(f);
          let mime = "application/octet-stream";
          if (ext === ".png") mime = "image/png";
          else if (ext === ".webm") mime = "video/webm";
          else if (ext === ".zip") mime = "application/zip";
          else if (ext === ".mp4") mime = "video/mp4";
          allArtifacts.push({ name: f, path: f, mimeType: mime, bytes: stat.size });
        }
      }
    } catch {}

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;
    result = {
      runId,
      bugId: opts.bugId,
      variant: opts.variant,
      target: opts.target,
      status: "completed",
      verdict,
      startedAt,
      completedAt,
      durationMs,
      error: null,
      artifacts: allArtifacts,
      logs,
    };
    fs.writeFileSync(path.join(runDir, "result.json"), JSON.stringify(result, null, 2), "utf8");

  } catch (e: unknown) {
    harnessError = e instanceof Error ? e.message : String(e);
    log(`HARNESS_ERROR: ${harnessError}`);
    verdict = "HARNESS_ERROR";
    try {
      if (context) {
        const tracePath = path.join(runDir, "trace.zip");
        try {
          await context.tracing.stop({ path: tracePath });
        } catch {}
        await context.close();
      }
    } catch {}
    try {
      if (browser) await browser.close();
    } catch {}

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;
    const errorArtifacts = [];
    try {
      const files = fs.readdirSync(runDir);
      for (const f of files) {
        if (f === "run.log" || f === "result.json") continue;
        const fp = path.join(runDir, f);
        const stat = fs.statSync(fp);
        if (stat.isFile()) {
          const ext = path.extname(f);
          let mime = "application/octet-stream";
          if (ext === ".png") mime = "image/png";
          else if (ext === ".webm") mime = "video/webm";
          else if (ext === ".zip") mime = "application/zip";
          errorArtifacts.push({ name: f, path: f, mimeType: mime, bytes: stat.size });
        }
      }
    } catch {}

    const errorResult: RunResult = {
      runId,
      bugId: opts.bugId,
      variant: opts.variant,
      target: opts.target,
      status: "failed",
      verdict,
      startedAt,
      completedAt,
      durationMs,
      error: harnessError,
      artifacts: errorArtifacts,
      logs,
    };
    fs.writeFileSync(path.join(runDir, "result.json"), JSON.stringify(errorResult, null, 2), "utf8");
    return errorResult;
  }

  log(`Run completed ${runId} verdict=${verdict} artifacts=${result?.artifacts.length ?? 0}`);
  return result!;
}

export function getRunResult(runId: string): RunResult | null {
  const safeId = safeFileName(runId);
  if (safeId !== runId) return null; // path traversal rejection
  const runDir = path.join(RUNS_ROOT, safeId);
  const resultPath = path.join(runDir, "result.json");
  if (!fs.existsSync(resultPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(resultPath, "utf8"));
  } catch {
    return null;
  }
}

export function getArtifactPath(runId: string, fileName: string): string | null {
  const safeRunId = safeFileName(runId);
  const safeFile = safeFileName(fileName);
  if (safeRunId !== runId || safeFile !== fileName) return null; // reject traversal like ../
  // Also reject path traversal attempts with slashes
  if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) return null;
  const full = path.join(RUNS_ROOT, safeRunId, safeFile);
  if (!fs.existsSync(full)) return null;
  // Ensure resolved path is inside RUNS_ROOT
  const resolved = path.resolve(full);
  const rootResolved = path.resolve(RUNS_ROOT);
  if (!resolved.startsWith(rootResolved)) return null;
  return resolved;
}
