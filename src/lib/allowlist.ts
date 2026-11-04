/**
 * Browser execution allowlist for ReplaySpec.
 * Per AGENTS.md and docs/ARCHITECTURE.md Execution boundary:
 * initial execution targets only the bundled demo application.
 * This module is the single source of truth for what Playwright
 * may navigate to — checked server-side.
 */

export const ALLOWED_ORIGINS = [
  "http://localhost:3000",
] as const;

export const ALLOWED_ROUTE_PATTERN = /^\/demo\/bug-0[123](\/.*)?$/;

export function isAllowedOrigin(url: string): boolean {
  try {
    const parsed = new URL(url);
    if ((ALLOWED_ORIGINS as readonly string[]).includes(parsed.origin)) return true;

    // The isolated Playwright server may use a separate local port so it never
    // collides with a developer's active app. Keep that exception test-only.
    const testPort = process.env.REPLAYSPEC_TEST_PORT;
    return process.env.PLAYWRIGHT_TEST === "1" && Boolean(testPort) && parsed.origin === `http://localhost:${testPort}`;
  } catch {
    return false;
  }
}

export function isAllowedRoute(pathname: string): boolean {
  return ALLOWED_ROUTE_PATTERN.test(pathname);
}

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      isAllowedOrigin(url) && isAllowedRoute(parsed.pathname)
    );
  } catch {
    return false;
  }
}
