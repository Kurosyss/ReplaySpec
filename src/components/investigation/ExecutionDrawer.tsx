"use client";

import { useState } from "react";
import type { RunResult, Verdict } from "@/lib/runs/types";

type Props = {
  initialVerdict?: string | null;
  variant?: "buggy" | "fixed";
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const cls =
    verdict === "REGRESSION_VERIFIED"
      ? "border-green-200 bg-green-50 text-green-700"
      : verdict === "DEFECT_CONFIRMED"
        ? "border-red-200 bg-red-50 text-red-700"
        : verdict === "HARNESS_ERROR"
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-zinc-300 bg-zinc-100 text-zinc-600";
  return (
    <span
      data-testid="drawer-verdict"
      className={`rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest ${cls}`}
    >
      {verdict}
    </span>
  );
}

export function ExecutionDrawer({ initialVerdict = "INCONCLUSIVE", variant = "fixed" }: Props) {
  const [run, setRun] = useState<RunResult | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<"buggy" | "fixed">(variant);

  const verdict: Verdict | null = run?.verdict ?? (initialVerdict as Verdict | null);

  async function handleRun() {
    setStatus("running");
    setError(null);
    setRun(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: selectedVariant }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }

      // POST returns pending run (202) with runId — poll GET until completed
      let current: RunResult = data as RunResult;
      if (data.status === "running" && data.runId) {
        const runId = data.runId as string;
        const start = Date.now();
        const timeout = 45000;
        while (Date.now() - start < timeout) {
          await new Promise((r) => setTimeout(r, 900));
          const pollRes = await fetch(`/api/runs/${runId}`);
          if (!pollRes.ok) continue;
          const polled: RunResult = await pollRes.json();
          current = polled;
          if (polled.status !== "running" && polled.verdict) break;
        }
      }

      setRun(current);
      setStatus(current.status === "failed" ? "error" : "completed");
      if (current.error) setError(current.error);
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" role="complementary" aria-label="Execution">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="drawer-variant" className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Variant
            </label>
            <select
              id="drawer-variant"
              data-testid="drawer-variant-select"
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value as "buggy" | "fixed")}
              className="rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
              disabled={status === "running"}
            >
              <option value="fixed">fixed</option>
              <option value="buggy">buggy</option>
            </select>
          </div>

          <button
            type="button"
            data-testid="run-regression-button"
            onClick={handleRun}
            disabled={status === "running"}
            className="rounded-md bg-amber-500 px-4 py-2 font-mono text-xs font-semibold text-zinc-950 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "running" ? "Running…" : "Run regression (Chromium)"}
          </button>

          <span className="hidden font-mono text-[11px] text-zinc-500 sm:inline">Allowlisted: http://localhost:3000/demo/bug-01 • Chromium only</span>
        </div>

        <div className="flex items-center gap-2">
          {status === "running" ? (
            <span data-testid="execution-status" className="rounded-full bg-zinc-900 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-white">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden="true" /> Running
            </span>
          ) : null}
          {status === "error" && run?.verdict === "HARNESS_ERROR" ? (
            <span data-testid="harness-error-badge" className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-violet-700">
              HARNESS_ERROR
            </span>
          ) : null}
          {verdict ? <VerdictBadge verdict={verdict} /> : null}
        </div>
      </div>

      {/* Idle */}
      {status === "idle" ? (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Ready to run</p>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            Select variant and run — executes <span className="font-mono">http://localhost:3000/demo/bug-01?variant={selectedVariant}</span> with empty-postal precondition. No arbitrary URLs or scripts. Artifacts persist in <span className="font-mono">test-results/runs/&lt;runId&gt;</span> outside <span className="font-mono">public/</span>.
          </p>
          <p className="mt-1 font-mono text-[11px] text-zinc-500">
            Verdict mapping: buggy hidden → <span className="font-semibold">DEFECT_CONFIRMED</span>, fixed visible + success → <span className="font-semibold">REGRESSION_VERIFIED</span>, browser failure → <span className="font-semibold text-violet-700">HARNESS_ERROR</span> (distinct from defect), otherwise <span className="font-semibold">INCONCLUSIVE</span>.
          </p>
        </div>
      ) : null}

      {/* Running */}
      {status === "running" ? (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50" data-testid="execution-running">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Running — Chromium via Playwright</p>
          <div className="mt-2 max-h-32 overflow-auto rounded bg-zinc-900 p-2 font-mono text-[11px] leading-4 text-zinc-300">
            <p>Navigating to http://localhost:3000/demo/bug-01?variant={selectedVariant}…</p>
            <p>Checking allowlist via src/lib/allowlist.ts…</p>
            <p>Filling checkout fields, asserting empty postal precondition…</p>
            <p>Clicking Place order, checking error visibility via DOM…</p>
          </div>
        </div>
      ) : null}

      {/* Completed */}
      {status === "completed" && run ? (
        <div className="border-t border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900" data-testid="execution-completed">
          <div className="flex flex-wrap items-center gap-3">
            <VerdictBadge verdict={run.verdict!} />
            <span className="font-mono text-[11px] text-zinc-500">
              run {run.runId} • {run.durationMs}ms • {new Date(run.completedAt!).toLocaleTimeString()}
            </span>
            <span className="font-mono text-[11px] text-zinc-500">{run.target}</span>
          </div>

          {run.verdict === "HARNESS_ERROR" ? (
            <div className="mt-3 rounded border border-violet-200 bg-violet-50 p-3" data-testid="harness-error-details">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-violet-700">Harness failure — not an application defect</p>
              <p className="mt-1 font-mono text-xs text-violet-900">{run.error ?? error ?? "Unknown harness error"}</p>
              <p className="mt-1 font-mono text-[11px] text-zinc-600">Check allowlist, target availability, and browser logs. Artifacts below contain trace for debugging.</p>
            </div>
          ) : null}

          <div className="mt-3">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Artifacts — only this run</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {run.artifacts.map((a) => (
                <li key={a.name}>
                  <a
                    href={`/api/runs/${run.runId}/artifacts/${a.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`artifact-link-${a.name}`}
                    className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11px] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {a.name} <span className="text-zinc-500">({(a.bytes / 1024).toFixed(0)}KB)</span>
                  </a>
                </li>
              ))}
              {run.artifacts.length === 0 ? <li className="font-mono text-[11px] text-zinc-500">No artifacts — check harness logs</li> : null}
            </ul>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">
              Stored outside public/ — test-results/runs/{run.runId}/ • Access via /api/runs/{run.runId}/artifacts/:file (path traversal rejected)
            </p>
          </div>

          {run.logs.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-widest text-zinc-500">Logs</summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-zinc-900 p-2 font-mono text-[11px] leading-4 text-zinc-300">{run.logs.join("\n")}</pre>
            </details>
          ) : null}
        </div>
      ) : null}

      {/* Error (non-harness) */}
      {status === "error" && !run ? (
        <div className="border-t border-red-100 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950" data-testid="execution-error">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-red-700">Error</p>
          <p className="mt-1 font-mono text-xs text-red-900">{error ?? "Unknown error"}</p>
        </div>
      ) : null}

      {/* Footer — always visible when idle/running to explain mapping */}
      {status !== "completed" ? (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950/50">
          <p className="font-mono text-[10px] leading-4 text-zinc-500">
            Do not report success before server returns verified result. Harness failures are distinct from defects — never claim HARNESS_ERROR as DEFECT_CONFIRMED.
          </p>
        </div>
      ) : null}
    </div>
  );
}
