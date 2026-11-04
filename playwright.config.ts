import { defineConfig, devices } from "@playwright/test";

const useExistingServerOnly = process.env.REPLAYSPEC_USE_EXISTING_SERVER === "1";
const testPort = Number(process.env.REPLAYSPEC_TEST_PORT ?? 3000);
const testOrigin = `http://localhost:${testPort}`;

/**
 * ReplaySpec Playwright config for BUG-01 vertical slice.
 * - Chromium only for MVP (fast, deterministic).
 * - Video + screenshot + trace saved outside public/ (test-results/ is gitignored).
 * - webServer enforces controlled origin http://localhost:3000 per AGENTS.md.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  outputDir: "test-results/artifacts",
  use: {
    baseURL: testOrigin,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 25_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useExistingServerOnly ? undefined : {
    command: `npm run dev -- --port ${testPort}`,
    url: `${testOrigin}/demo/bug-01?variant=fixed`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      PLAYWRIGHT_TEST: "1",
      REPLAYSPEC_ALLOW_FIXTURES: "1",
      REPLAYSPEC_TEST_PORT: String(testPort),
      REPLAYSPEC_NEXT_DIST_DIR: ".next-playwright",
    },
  },
});
