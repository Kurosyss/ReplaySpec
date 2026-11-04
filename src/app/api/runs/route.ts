import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedUrl } from "@/lib/allowlist";
import { runScenario, createPendingRun } from "@/lib/runs/runner";
import type { BugId } from "@/lib/runs/types";

const RequestSchema = z.object({
  bugId: z.enum(["BUG-01", "BUG-02", "BUG-03"]).default("BUG-01"),
  variant: z.enum(["buggy", "fixed"]),
  target: z.string().url().optional(),
});

const SCENARIO_ROUTES: Record<BugId, string> = {
  "BUG-01": "/demo/bug-01",
  "BUG-02": "/demo/bug-02",
  "BUG-03": "/demo/bug-03",
};

/**
 * POST /api/runs — server-only execution for predetermined bundled scenarios
 * Validates variant and target against allowlist, starts Playwright run in background,
 * persists screenshot, trace.zip, video.webm outside public/, returns runId immediately.
 * Does NOT accept arbitrary URLs, shell commands, or user-supplied scripts.
 * Client polls GET /api/runs/[id] for completion.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { bugId, variant } = parsed.data;
  const expectedPath = SCENARIO_ROUTES[bugId];
  const testPort = process.env.PLAYWRIGHT_TEST === "1" ? process.env.REPLAYSPEC_TEST_PORT : undefined;
  const targetOrigin = `http://localhost:${testPort ?? "3000"}`;
  const target = parsed.data.target ?? `${targetOrigin}${expectedPath}?variant=${variant}`;

  if (!isAllowedUrl(target)) {
    return NextResponse.json({ error: `Target not allowlisted: ${target}` }, { status: 422 });
  }

  const url = new URL(target);
  if (url.pathname !== expectedPath || url.searchParams.get("variant") !== variant) {
    return NextResponse.json({ error: "Target does not match the selected bundled scenario and variant" }, { status: 422 });
  }

  // Create pending run and start background execution (avoids deadlock where
  // Playwright page.goto would need the same Next.js dev server that's handling this request)
  const pending = createPendingRun({ bugId, variant, target });

  // Run in background — do not await, so POST returns quickly and server is free to serve page.goto
  runScenario({ bugId, variant, target, runId: pending.runId }).catch((e) => {
    // runner already logs harness error to result.json
    console.error(`Background run ${pending.runId} failed:`, e);
  });

  return NextResponse.json(pending, { status: 202 });
}

export async function GET() {
  return NextResponse.json({ message: "Use POST with { variant: 'buggy'|'fixed' } to create a run. GET /api/runs/[id] for result, /api/runs/[id]/artifacts/[file] for artifacts." });
}
