"use client";

import { useState } from "react";
import type { BugId, RunResult, Verdict } from "@/lib/runs/types";

type Props = {
  bugId?: BugId | null;
  initialVerdict?: string | null;
  variant?: "buggy" | "fixed";
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const getStyle = (v: Verdict) => {
    switch (v) {
      case "REGRESSION_VERIFIED":
        return {
          background: "var(--green-muted)",
          color: "var(--green)",
          borderColor: "transparent",
        };
      case "DEFECT_CONFIRMED":
        return {
          background: "var(--red-muted)",
          color: "var(--red)",
          borderColor: "transparent",
        };
      case "HARNESS_ERROR":
        return {
          background: "var(--violet-muted)",
          color: "var(--violet)",
          borderColor: "transparent",
        };
      default:
        return {
          background: "var(--surface-elevated)",
          color: "var(--text-secondary)",
          borderColor: "var(--border-muted)",
        };
    }
  };

  const isHarness = verdict === "HARNESS_ERROR";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        data-testid="drawer-verdict"
        className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
        style={getStyle(verdict)}
      >
        {verdict}
      </span>
      {isHarness ? (
        <span
          data-testid="harness-error-badge"
          className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-violet-500 border-violet-500/30 bg-violet-500/10 violet"
          style={getStyle(verdict)}
        >
          HARNESS_ERROR
        </span>
      ) : null}
    </span>
  );
}

export function ExecutionDrawer({ bugId = "BUG-01", initialVerdict = "INCONCLUSIVE", variant = "fixed" }: Props) {
  const [run, setRun] = useState<RunResult | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [comparisonRuns, setComparisonRuns] = useState<RunResult[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<"buggy" | "fixed">(variant);
  const demoPath = bugId ? `/demo/${bugId.toLowerCase()}` : null;

  const verdict: Verdict | null = run?.verdict ?? (initialVerdict as Verdict | null);

  async function executeVariant(runVariant: "buggy" | "fixed"): Promise<RunResult> {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bugId, variant: runVariant }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      // POST returns pending run (202) with runId — poll GET until completed
      let current: RunResult = data as RunResult;
      if (data.status === "running" && data.runId) {
        const runId = data.runId as string;
        const start = Date.now();
        const timeout = 180000;
        while (Date.now() - start < timeout) {
          await new Promise((r) => setTimeout(r, 1200));
          const pollRes = await fetch(`/api/runs/${runId}`);
          if (!pollRes.ok) continue;
          const polled: RunResult = await pollRes.json();
          current = polled;
          if (polled.status === "completed" || polled.status === "failed") break;
        }
      }

      if (current.status === "running" && !current.verdict && !current.completedAt) {
        throw new Error("This run is still processing. Check the run again shortly; it has not been marked complete.");
      }
      return current;
  }

  async function handleRun() {
    if (!bugId) return;
    setStatus("running");
    setError(null);
    setRun(null);
    setComparisonRuns([]);
    try {
      const current = await executeVariant(selectedVariant);
      setRun(current);
      setStatus(current.status === "failed" ? "error" : "completed");
      if (current.error) setError(current.error);
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCompare() {
    if (!bugId) return;
    setStatus("running");
    setError(null);
    setRun(null);
    setComparisonRuns([]);
    const completed: RunResult[] = [];
    try {
      for (const runVariant of ["buggy", "fixed"] as const) {
        const current = await executeVariant(runVariant);
        completed.push(current);
        setComparisonRuns([...completed]);
      }
      setRun(completed.at(-1) ?? null);
      setStatus(completed.length === 2 && completed.every((item) => item.status === "completed") ? "completed" : "error");
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div
      className="border-t bg-[var(--surface)] transition-colors"
      style={{ borderColor: "var(--border-muted)" }}
      role="complementary"
      aria-label="Execution"
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="drawer-variant" className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Variant
            </label>
            <select
              id="drawer-variant"
              data-testid="drawer-variant-select"
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value as "buggy" | "fixed")}
              className="rounded-[5px] border bg-[var(--surface)] px-2 py-1 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border-muted)" }}
              disabled={status === "running" || !bugId}
            >
              <option value="fixed">fixed</option>
              <option value="buggy">buggy</option>
            </select>
          </div>

          <button
            type="button"
            data-testid="run-regression-button"
            onClick={handleRun}
            disabled={status === "running" || !bugId}
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--accent)] px-3.5 py-1.5 font-mono text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "running" ? (
              <>
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                Running…
              </>
            ) : (
              "Run regression (Chromium)"
            )}
          </button>

          <button
            type="button"
            data-testid="compare-variants-button"
            onClick={handleCompare}
            disabled={status === "running" || !bugId}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Compare both variants
          </button>

          <span className="hidden font-mono text-[11px] text-[var(--text-tertiary)] sm:inline">
            {demoPath ? `Allowlisted: ${demoPath} • Chromium only` : "No bundled execution template for this investigation"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === "running" ? (
            <span
              data-testid="execution-status"
              className="rounded-full bg-[var(--surface-elevated)] border border-[var(--border-muted)] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]"
            >
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--amber)] mr-1.5" aria-hidden="true" />
              Running
            </span>
          ) : null}

          {verdict ? <VerdictBadge verdict={verdict} /> : null}
        </div>
      </div>

      {/* Idle state */}
      {status === "idle" ? (
        <div
          className="border-t bg-[var(--surface-elevated)] px-4 py-3"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Ready to execute
          </p>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">
            {demoPath ? <>Select variant and run — executes <span className="font-mono text-[var(--text-primary)]">http://localhost:3000{demoPath}?variant={selectedVariant}</span> using the validated {bugId} scenario template. No arbitrary URLs or scripts. Artifacts persist in <span className="font-mono text-[var(--text-primary)]">test-results/runs/&lt;runId&gt;</span> outside <span className="font-mono">public/</span>.</> : "Execution is enabled only for the bundled BUG-01, BUG-02, and BUG-03 scenarios."}
          </p>
          <p className="mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
            Verdict mapping: buggy contract violated → <span className="font-semibold text-[var(--red)]">DEFECT_CONFIRMED</span> · fixed contract passes → <span className="font-semibold text-[var(--green)]">REGRESSION_VERIFIED</span> · browser failure → <span className="font-semibold text-[var(--violet)]">HARNESS_ERROR</span> (distinct from defect) · otherwise <span className="font-semibold">INCONCLUSIVE</span>.
          </p>
        </div>
      ) : null}

      {/* Running state */}
      {status === "running" ? (
        <div
          className="border-t bg-[var(--surface-elevated)] px-4 py-3"
          style={{ borderColor: "var(--border-muted)" }}
          data-testid="execution-running"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Running — Chromium via Playwright
          </p>
          <div
            className="mt-2 max-h-32 overflow-auto rounded-[6px] border bg-[var(--canvas)] p-2.5 font-mono text-[11px] leading-5 text-[var(--text-secondary)]"
            style={{ borderColor: "var(--border-muted)" }}
          >
            <p className="text-[var(--text-primary)]">Opening /demo/{bugId?.toLowerCase()}?variant={selectedVariant}…</p>
            <p>Checking the bundled scenario preconditions…</p>
            <p>Running the {bugId} interaction sequence in Chromium…</p>
            <p>Checking the expected result and saving run evidence…</p>
          </div>
        </div>
      ) : null}

      {/* Completed state */}
      {status === "completed" && run ? (
        <div
          className="border-t bg-[var(--surface)] px-4 py-3"
          style={{ borderColor: "var(--border-muted)" }}
          data-testid="execution-completed"
        >
          <div className="flex flex-wrap items-center gap-3">
            <VerdictBadge verdict={run.verdict!} />
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">
              run {run.runId} · {run.durationMs}ms · {new Date(run.completedAt!).toLocaleTimeString()}
            </span>
            <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{run.target}</span>
          </div>

          {run.verdict === "HARNESS_ERROR" ? (
            <div
              className="mt-3 rounded-[6px] border p-3"
              style={{ borderColor: "var(--violet)", background: "var(--violet-muted)" }}
              data-testid="harness-error-details"
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--violet)]">
                Harness failure — not an application defect
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--text-primary)]">
                {run.error ?? error ?? "Unknown harness error"}
              </p>
              <p className="mt-1 font-mono text-[10px] text-[var(--text-secondary)]">
                Check allowlist, target availability, and browser logs. Artifacts below contain trace for debugging.
              </p>
            </div>
          ) : null}

          <div className="mt-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
              Artifacts — only this run
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {run.artifacts.map((a) => (
                <li key={a.name}>
                  <a
                    href={`/api/runs/${run.runId}/artifacts/${a.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`artifact-link-${a.name}`}
                    className="inline-flex items-center gap-1.5 rounded-[5px] border bg-[var(--surface-elevated)] px-2 py-1 font-mono text-[11px] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                    style={{ borderColor: "var(--border-muted)" }}
                  >
                    {a.name} <span className="text-[var(--text-tertiary)]">({(a.bytes / 1024).toFixed(0)}KB)</span>
                  </a>
                </li>
              ))}
              {run.artifacts.length === 0 ? (
                <li className="font-mono text-[11px] text-[var(--text-tertiary)]">No artifacts — check harness logs</li>
              ) : null}
            </ul>
            <p className="mt-2 font-mono text-[10px] text-[var(--text-tertiary)]">
              Stored outside public/ — test-results/runs/{run.runId}/ · Access via /api/runs/{run.runId}/artifacts/:file (path traversal rejected)
            </p>
          </div>

          {run.logs.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                Logs ({run.logs.length} lines)
              </summary>
              <pre
                className="mt-2 max-h-40 overflow-auto rounded-[6px] border bg-[var(--canvas)] p-2 font-mono text-[10px] leading-4 text-[var(--text-secondary)]"
                style={{ borderColor: "var(--border-muted)" }}
              >
                {run.logs.join("\n")}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}

      {comparisonRuns.length > 0 ? (
        <div className="border-t px-4 py-3" style={{ borderColor: "var(--border-muted)" }} data-testid="variant-comparison">
          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Paired regression result</p>
          <div className="grid gap-px border border-[var(--border-muted)] bg-[var(--border-muted)] sm:grid-cols-2">
            {comparisonRuns.map((item) => (
              <div key={item.runId} className="bg-[var(--surface)] p-3">
                <p className="mb-2 font-mono text-xs font-semibold text-[var(--text-primary)]">{item.variant}</p>
                {item.verdict ? <VerdictBadge verdict={item.verdict} /> : <span className="font-mono text-xs">No verdict</span>}
                <p className="mt-2 font-mono text-[10px] text-[var(--text-tertiary)]">{item.runId} · {item.durationMs}ms</p>
              </div>
            ))}
          </div>
          {comparisonRuns.length === 2 && comparisonRuns[0].verdict === "DEFECT_CONFIRMED" && comparisonRuns[1].verdict === "REGRESSION_VERIFIED" ? (
            <p className="mt-2 text-xs text-[var(--green)]">Bug reproduced and fixed behavior verified against the same scenario.</p>
          ) : null}
          {error ? <p className="mt-2 text-xs text-[var(--violet)]">{error}</p> : null}
        </div>
      ) : null}

      {/* Error state */}
      {status === "error" && !run ? (
        <div
          className="border-t p-3"
          style={{ borderColor: "var(--violet)", background: "var(--violet-muted)" }}
          data-testid="execution-error"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--violet)]">
            Run status unavailable
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--text-primary)]">{error ?? "Unknown error"}</p>
        </div>
      ) : null}

      {/* Footer hint */}
      {status !== "completed" ? (
        <div
          className="border-t bg-[var(--surface-elevated)] px-4 py-2"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <p className="font-mono text-[10px] leading-normal text-[var(--text-tertiary)]">
            Do not report success before server returns verified result. Harness failures are distinct from defects — never claim HARNESS_ERROR as DEFECT_CONFIRMED.
          </p>
        </div>
      ) : null}
    </div>
  );
}
