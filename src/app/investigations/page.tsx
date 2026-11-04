"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import type { InvestigationMeta } from "@/lib/investigations/types";

function VerdictPill({ verdict }: { verdict: string | null }) {
  const style: Record<string, { bg: string; color: string; border: string }> = {
    INCONCLUSIVE: {
      border: "var(--border)",
      bg: "var(--surface-elevated)",
      color: "var(--text-secondary)",
    },
    DEFECT_CONFIRMED: {
      border: "rgba(220, 38, 38, 0.2)",
      bg: "var(--red-muted)",
      color: "var(--red)",
    },
    REGRESSION_VERIFIED: {
      border: "rgba(21, 128, 61, 0.2)",
      bg: "var(--green-muted)",
      color: "var(--green)",
    },
    HARNESS_ERROR: {
      border: "rgba(109, 40, 217, 0.2)",
      bg: "var(--violet-muted)",
      color: "var(--violet)",
    },
  };
  const s = (verdict && style[verdict]) || style.INCONCLUSIVE;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold leading-none tracking-wider uppercase"
      style={{ borderColor: s.border, background: s.bg, color: s.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: s.color,
          opacity: verdict === "REGRESSION_VERIFIED" ? 1 : 0.8,
        }}
      />
      {verdict ?? "—"}
    </span>
  );
}

function formatDisplayDate(iso: string) {
  try {
    const d = new Date(iso);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
  } catch {
    return "";
  }
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<InvestigationMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  // Show saved investigations on entry; keep the curated examples available as a separate view.
  const [viewScope, setViewScope] = useState<"benchmarks" | "all" | "runs">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/investigations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) {
          setInvestigations(data?.investigations ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setInvestigations([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Keep the shipped benchmark fixtures separate from persisted user investigations
  // and Playwright-created runs. Never infer a benchmark from a matching title.
  const { benchmarks, userRecords, testRuns } = useMemo(() => {
    const benchmarkIds = new Set(["bug-01", "bug-02", "bug-03"]);
    const bMarks: InvestigationMeta[] = [];
    const users: InvestigationMeta[] = [];
    const tRuns: InvestigationMeta[] = [];

    for (const inv of investigations) {
      const isTestFixture =
        inv.runId?.startsWith("fixture-") ||
        inv.title.includes("Fixture ") ||
        inv.sourceVideo === "fixture" ||
        /^page@[a-f\d]+\.webm$/i.test(inv.sourceVideo ?? "");

      if (benchmarkIds.has(inv.id)) {
        bMarks.push(inv);
      } else if (isTestFixture) {
        tRuns.push(inv);
      } else {
        users.push(inv);
      }
    }

    return { benchmarks: bMarks, userRecords: users, testRuns: tRuns };
  }, [investigations]);

  const displayedList = useMemo(() => {
    let list: InvestigationMeta[] = [];
    if (viewScope === "benchmarks") {
      list = benchmarks;
    } else if (viewScope === "runs") {
      list = testRuns;
    } else {
      list = [...benchmarks, ...userRecords];
    }

    if (filter !== "all") {
      list = list.filter((i) => i.verdict === filter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.bugId.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.target?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [benchmarks, userRecords, testRuns, viewScope, filter, query]);

  const savedInvestigationCount = benchmarks.length + userRecords.length;

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[var(--canvas)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header — Editorial Minimalism & Institutional Credibility */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between border-b pb-6" style={{ borderColor: "var(--border-muted)" }}>
          <div className="min-w-0">
            <div className="mb-3.5 flex items-center gap-3">
              <BrandLogo size="md" showTimestamp={false} />
              <span className="hidden h-3.5 w-px bg-[var(--border)] sm:block" />
            </div>
            <h1
              className="text-[28px] font-semibold leading-tight tracking-tight text-[var(--text-primary)]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Investigations
            </h1>
            <p className="mt-1.5 max-w-[620px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Forensic evidence and regression studio. Every verdict traces to a timestamped frame,
              an immutable observation, and a verified Playwright test invariant.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <ThemeToggle />
            <Link
              href="/investigations/new"
              data-testid="new-investigation-button"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] px-4 py-2 text-[13px] font-medium leading-none text-[var(--canvas)] shadow-xs transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--canvas)] text-[10px] font-bold text-[var(--text-primary)]">
                +
              </span>
              New investigation
            </Link>
          </div>
        </div>

        {/* Telemetry Bar: System Verification Status */}
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-[var(--surface-elevated)] px-5 py-3 text-xs"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <div>
              <span className="text-[var(--text-tertiary)]">SCENARIOS: </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {benchmarks.length} Curated
              </span>
            </div>
            <span className="text-[var(--border-strong)]">/</span>
            <div>
                <span className="text-[var(--text-tertiary)]">SAVED INVESTIGATIONS: </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {savedInvestigationCount}
              </span>
            </div>
            <span className="text-[var(--border-strong)]">/</span>
            <div>
                <span className="text-[var(--text-tertiary)]">EXECUTION SCOPE: </span>
              <span className="font-semibold text-[var(--text-primary)]">
                /demo/* · Chromium
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)] animate-pulse" />
            <span>Allowlisted browser targets</span>
          </div>
        </div>

        {/* Scope and Filter Controls */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Scope Segment: Curated Benchmarks vs Test Ledger vs All */}
          <div
            className="inline-flex items-center gap-1 rounded-full border bg-[var(--surface)] p-1 self-start"
            style={{ borderColor: "var(--border-muted)" }}
          >
            <button
              type="button"
              onClick={() => setViewScope("benchmarks")}
              className={`rounded-full px-3.5 py-1 text-[12px] font-medium leading-none transition-colors ${
                viewScope === "benchmarks"
                  ? "bg-[var(--text-primary)] text-[var(--canvas)] shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Curated Benchmarks ({benchmarks.length})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("all")}
              className={`rounded-full px-3.5 py-1 text-[12px] font-medium leading-none transition-colors ${
                viewScope === "all"
                  ? "bg-[var(--text-primary)] text-[var(--canvas)] shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All Investigations ({savedInvestigationCount})
            </button>
            <button
              type="button"
              onClick={() => setViewScope("runs")}
              className={`rounded-full px-3.5 py-1 text-[12px] font-medium leading-none transition-colors ${
                viewScope === "runs"
                  ? "bg-[var(--text-primary)] text-[var(--canvas)] shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Test Audit Ledger ({testRuns.length})
            </button>
          </div>

          {/* Status & Search Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div
              className="flex items-center gap-1 rounded-full border bg-[var(--surface)] p-1"
              style={{ borderColor: "var(--border-muted)" }}
            >
              {[
                { k: "all", l: "All" },
                { k: "REGRESSION_VERIFIED", l: "Verified" },
                { k: "DEFECT_CONFIRMED", l: "Defect" },
                { k: "INCONCLUSIVE", l: "Inconclusive" },
              ].map((f) => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k)}
                  className={`rounded-full px-3 py-1 text-[11.5px] font-medium leading-none transition-colors ${
                    filter === f.k
                      ? "bg-[var(--text-primary)] text-[var(--canvas)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {f.l}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-[240px]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, ID, target…"
                className="h-8 w-full rounded-full border bg-[var(--surface)] pl-8 pr-3 text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{ borderColor: "var(--border-muted)" }}
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--text-tertiary)]">
                ⌕
              </span>
            </div>
          </div>
        </div>

        {/* Content Listing */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3 py-6">
              <p className="font-mono text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] animate-ping" />
                Loading investigations…
              </p>
              <div className="h-16 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
              <div className="h-16 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
              <div className="h-16 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
            </div>
          ) : displayedList.length === 0 ? (
            <div
              className="surface-geodesic-primary px-6 py-12 text-center"
              style={{ borderColor: "var(--border-muted)" }}
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[14px]">
                ◧
              </div>
              <p className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">
                {query ? `No investigations match “${query}”` : "No investigations yet"}
              </p>
              <p className="mx-auto mt-1 max-w-[440px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Create an investigation from a recording or browse our verified evidence benchmarks.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Link
                  href="/investigations/new"
                  className="inline-flex rounded-full bg-[var(--text-primary)] px-4 py-2 text-[13px] font-medium text-[var(--canvas)]"
                >
                  New investigation
                </Link>
                <Link
                  href="/investigations/bug-01"
                  className="inline-flex rounded-full border bg-[var(--surface)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  Open BUG-01 benchmark
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="surface-geodesic-primary overflow-hidden"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Header row */}
              <div
                className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] sm:grid"
                style={{
                  borderColor: "var(--border-muted)",
                  background: "var(--surface-elevated)",
                }}
              >
                <span className="col-span-6">Investigation & Scenario</span>
                <span className="col-span-3">Telemetry & Target</span>
                <span className="col-span-3 text-right">Verdict & Status</span>
              </div>

              {/* Data rows */}
              {displayedList.map((inv, idx) => (
                <Link
                  key={inv.id}
                  href={`/investigations/${inv.id}`}
                  data-testid={`investigation-row-${inv.id}`}
                  className={`group grid grid-cols-1 gap-3 px-6 py-4 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:grid-cols-12 sm:gap-4 sm:py-3.5 ${
                    idx > 0 ? "border-t" : ""
                  }`}
                  style={{ borderColor: "var(--border-muted)" }}
                >
                  {/* Column 1: Title, Bug ID, Identifier */}
                  <div className="col-span-6 min-w-0 flex flex-col justify-center">
                    <p
                      className="truncate text-[13.5px] font-medium leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors"
                      style={{ letterSpacing: "-0.015em" }}
                    >
                      {inv.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] leading-4 text-[var(--text-tertiary)]">
                      <span className="badge-technical rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 font-semibold text-[var(--text-secondary)] border border-[var(--border-muted)]">
                        {inv.bugId}
                      </span>
                      <span className="font-mono text-[10.5px] text-[var(--text-secondary)]">
                        {inv.id}
                      </span>
                      <span>·</span>
                      <span
                        className={
                          inv.variant === "fixed"
                            ? "text-[var(--green)] font-medium"
                            : "text-[var(--text-secondary)]"
                        }
                      >
                        variant: {inv.variant}
                      </span>
                    </p>
                  </div>

                  {/* Column 2: Frames, Duration, Target */}
                  <div className="col-span-3 flex flex-col justify-center min-w-0">
                    <p className="text-[12px] leading-tight text-[var(--text-secondary)] font-mono">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {inv.frameCount} frames
                      </span>
                      <span className="text-[var(--text-tertiary)]"> · {inv.duration}</span>
                    </p>
                    <p className="mt-1 truncate font-mono text-[10.5px] text-[var(--text-tertiary)]">
                      {inv.target ?? "/demo/bug-01?variant=fixed"}
                    </p>
                  </div>

                  {/* Column 3: Verdict, Date, Action Indicator */}
                  <div className="col-span-3 flex items-center justify-between gap-3 sm:justify-end">
                    <span className="hidden text-[11px] font-mono text-[var(--text-tertiary)] sm:inline" suppressHydrationWarning>
                      {formatDisplayDate(inv.updatedAt)}
                    </span>
                    <VerdictPill verdict={inv.verdict} />
                    <span
                      aria-hidden="true"
                      className="text-[12px] text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hidden sm:inline"
                    >
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Institutional Integrity Statement */}
        <div
          className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4 text-[11px] text-[var(--text-tertiary)]"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <p>
            ReplaySpec Forensic Architecture · Every claim traces to an immutable frame · Strict
            deterministic assertion verification
          </p>
          <Link
            href="/demo/bug-01?variant=fixed"
            className="font-mono text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Open BUG-01 target demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
