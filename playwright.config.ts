import { defineConfig, devices } from "@playwright/test";

/**
 * ReplaySpec Playwright config for BUG-01 vertical slice.
 * - Chromium only for MVP (fast, deterministic).
 * - Video + screenshot + trace saved outside public/ (test-results/ is gitignored).
 * - webServer enforces controlled origin http://localhost:3000 per AGENTS.md.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  outputDir: "test-results/artifacts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/demo/bug-01?variant=fixed",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
