import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedUrl } from "@/lib/allowlist";
import { runBug01Scenario, createPendingRun } from "@/lib/runs/runner";

const RequestSchema = z.object({
  variant: z.enum(["buggy", "fixed"]),
  target: z.string().url().optional(),
});

/**
 * POST /api/runs — server-only execution for predetermined BUG-01 scenario
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

  const { variant } = parsed.data;
  const target = parsed.data.target ?? `http://localhost:3000/demo/bug-01?variant=${variant}`;

  if (!isAllowedUrl(target)) {
    return NextResponse.json({ error: `Target not allowlisted: ${target}` }, { status: 422 });
  }

  const url = new URL(target);
  if (!url.pathname.startsWith("/demo/bug-01")) {
    return NextResponse.json({ error: "Only BUG-01 scenario is supported in M3.2" }, { status: 422 });
  }

  // Create pending run and start background execution (avoids deadlock where
  // Playwright page.goto would need the same Next.js dev server that's handling this request)
  const pending = createPendingRun({ variant, target });

  // Run in background — do not await, so POST returns quickly and server is free to serve page.goto
  runBug01Scenario({ variant, target, runId: pending.runId }).catch((e) => {
    // runner already logs harness error to result.json
    console.error(`Background run ${pending.runId} failed:`, e);
  });

  return NextResponse.json(pending, { status: 202 });
}

export async function GET() {
  return NextResponse.json({ message: "Use POST with { variant: 'buggy'|'fixed' } to create a run. GET /api/runs/[id] for result, /api/runs/[id]/artifacts/[file] for artifacts." });
}
