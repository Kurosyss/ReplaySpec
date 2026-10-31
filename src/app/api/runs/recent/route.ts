import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const RUNS_ROOT = path.join(process.cwd(), "test-results", "runs");

export async function GET() {
  try {
    if (!fs.existsSync(RUNS_ROOT)) return NextResponse.json({ runs: [] });
    const entries = fs.readdirSync(RUNS_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory());
    const runs = [];
    for (const entry of entries) {
      const resultPath = path.join(RUNS_ROOT, entry.name, "result.json");
      if (!fs.existsSync(resultPath)) continue;
      try {
        const data = JSON.parse(fs.readFileSync(resultPath, "utf8"));
        // Only completed runs with verdict and frames
        if (data.status === "completed" && data.verdict && fs.existsSync(path.join(RUNS_ROOT, entry.name, "frames"))) {
          runs.push({ runId: data.runId, variant: data.variant, verdict: data.verdict, createdAt: data.completedAt ?? data.startedAt });
        } else if (data.status === "completed" && data.verdict) {
          // Include even if no frames manifest yet (older runs) — but check for video
          runs.push({ runId: data.runId, variant: data.variant, verdict: data.verdict, createdAt: data.completedAt ?? data.startedAt });
        }
      } catch {}
    }
    runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ runs: runs.slice(0, 10) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
