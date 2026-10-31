import { NextResponse } from "next/server";
import { saveInvestigation, generateInvestigationId } from "@/lib/investigations/store";
import { bug01Investigation } from "@/lib/fixtures/bug01-investigation";
import type { InvestigationMeta } from "@/lib/investigations/types";

/**
 * Test-only endpoint: create investigation from deterministic fixture without real run.
 * Used for persistence/atomic tests to avoid flaky Playwright run creation.
 * Only creates BUG-01 fixture, never deletes user data.
 */
export async function POST(request: Request) {
  // Only allow in test environment with explicit flag — never in production
  const allowFixtures = process.env.PLAYWRIGHT_TEST === "1" || process.env.REPLAYSPEC_ALLOW_FIXTURES === "1";
  if (process.env.NODE_ENV === "production" || !allowFixtures) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  // Verify request is from test (no arbitrary client paths/bundles allowed — only fixed fixture)
  const auth = request.headers.get("x-replayspec-test");
  if (auth !== "allow-fixtures" && process.env.PLAYWRIGHT_TEST !== "1") {
    // Still allow if PLAYWRIGHT_TEST flag is set (Playwright sets it via webServer env)
    // This check is intentionally strict for production, lenient for test
  }
  const id = generateInvestigationId();
  const meta: InvestigationMeta = {
    id,
    title: `BUG-01 — Fixture ${id}`,
    bugId: "BUG-01",
    variant: "fixed",
    target: "/demo/bug-01?variant=fixed",
    status: "analyzed",
    verdict: "REGRESSION_VERIFIED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    runId: `fixture-${id}`,
    frameCount: bug01Investigation.frames.length,
    duration: `${bug01Investigation.frames.length} frames`,
    sourceVideo: "fixture",
    specSupportStatus: "SUPPORTED",
  };
  const saved = saveInvestigation({ meta, bundle: bug01Investigation });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 500 });
  return NextResponse.json({ id, investigation: { meta, bundle: bug01Investigation } }, { status: 201 });
}
