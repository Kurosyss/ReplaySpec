"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { InvestigationMeta } from "@/lib/investigations/types";

function VerdictPill({ verdict }: { verdict: string | null }) {
  const style: Record<string, React.CSSProperties> = {
    INCONCLUSIVE: { borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-secondary)" },
    DEFECT_CONFIRMED: { borderColor: "transparent", background: "var(--red-muted)", color: "var(--red)" },
    REGRESSION_VERIFIED: { borderColor: "transparent", background: "var(--green-muted)", color: "var(--green)" },
    HARNESS_ERROR: { borderColor: "transparent", background: "var(--violet-muted)", color: "var(--violet)" },
  };
  const s = (verdict && style[verdict]) || style.INCONCLUSIVE;
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-1 font-mono text-[10px] font-medium leading-none tracking-wide" style={s}>
      {verdict ?? "—"}
    </span>
  );
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<InvestigationMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const fetchInvestigations = async () => {
    try {
      const res = await fetch("/api/investigations");
      if (res.ok) {
        const data = await res.json();
        setInvestigations(data.investigations ?? []);
      } else {
        setInvestigations([]);
      }
    } catch {
      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const filtered = useMemo(() => {
    let list = investigations;
    if (filter !== "all") list = list.filter((i) => i.verdict === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.bugId.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    return list;
  }, [investigations, filter, query]);

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[var(--canvas)]">
      <div className="mx-auto w-full max-w-[1080px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header — tighter, more editorial */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold leading-none tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.028em" }}>
              Investigations
            </h1>
            <p className="mt-2 max-w-[520px] text-[13px] leading-[20px] text-[var(--text-secondary)]">
              Evidence-grounded workspace. Every verdict traces to a timestamped frame and a validated observation.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ThemeToggle />
            <Link
              href="/investigations/new"
              data-testid="new-investigation-button"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--text-primary)] px-4 py-2 text-[13px] font-medium leading-none text-[var(--canvas)] shadow-sm transition-opacity hover:opacity-90"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--canvas)] text-[11px] font-medium leading-none text-[var(--text-primary)]">+</span>
              New investigation
            </Link>
          </div>
        </div>

        {/* Controls — only when useful */}
        {!loading && investigations.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 rounded-full border bg-[var(--surface)] p-1" style={{ borderColor: "var(--border-muted)" }}>
              {[
                { k: "all", l: "All" },
                { k: "REGRESSION_VERIFIED", l: "Verified" },
                { k: "DEFECT_CONFIRMED", l: "Defect" },
                { k: "INCONCLUSIVE", l: "Inconclusive" },
              ].map((f) => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k)}
                  className={`rounded-full px-3 py-1 text-[12px] font-medium leading-none transition-colors ${filter === f.k ? "bg-[var(--text-primary)] text-[var(--canvas)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                >
                  {f.l}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-[260px]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by title or ID…"
                className="h-8 w-full rounded-full border bg-[var(--surface)] pl-8 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{ borderColor: "var(--border-muted)" }}
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--text-tertiary)]">⌕</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-2">
              <div className="h-12 animate-pulse rounded-[8px] bg-[var(--surface-elevated)]" />
              <div className="h-12 animate-pulse rounded-[8px] bg-[var(--surface-elevated)]" />
            </div>
          ) : investigations.length === 0 ? (
            <div className="rounded-[12px] border bg-[var(--surface)] px-6 py-12 text-center" style={{ borderColor: "var(--border-muted)", boxShadow: "var(--shadow-sm)" }}>
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[14px]">◧</div>
              <p className="mt-3 text-[14px] font-medium text-[var(--text-primary)]" style={{ letterSpacing: "-0.015em" }}>
                No investigations yet
              </p>
              <p className="mx-auto mt-1 max-w-[420px] text-[13px] leading-5 text-[var(--text-secondary)]">
                Create your first investigation from a recording. Upload a session, attach the expected behaviour, and generate a forensic timeline.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <Link
                  href="/investigations/new"
                  className="inline-flex rounded-full bg-[var(--text-primary)] px-4 py-2 text-[13px] font-medium text-[var(--canvas)]"
                >
                  New investigation
                </Link>
                <Link
                  href="/demo/bug-01?variant=fixed"
                  className="inline-flex rounded-full border bg-[var(--surface)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  style={{ borderColor: "var(--border-muted)" }}
                >
                  Open demo fixture
                </Link>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">No matches for “{query}”</p>
          ) : (
            <div className="overflow-hidden rounded-[10px] border bg-[var(--surface)]" style={{ borderColor: "var(--border-muted)", boxShadow: "var(--shadow-sm)" }}>
              <div
                className="hidden grid-cols-12 gap-4 border-b px-5 py-2.5 text-[10px] font-medium uppercase tracking-widest sm:grid"
                style={{ borderColor: "var(--border-muted)", background: "var(--surface-elevated)", color: "var(--text-tertiary)" }}
              >
                <span className="col-span-6">Investigation</span>
                <span className="col-span-3">Source</span>
                <span className="col-span-3 text-right">Result</span>
              </div>
              {filtered.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/investigations/${inv.id}`}
                  data-testid={`investigation-row-${inv.id}`}
                  className="group grid grid-cols-1 gap-3 border-t px-5 py-4 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:grid-cols-12 sm:gap-4 sm:py-3.5"
                  style={{ borderColor: "var(--border-muted)" }}
                >
                  <div className="col-span-6 min-w-0">
                    <p className="truncate text-[13px] font-medium leading-5 text-[var(--text-primary)]" style={{ letterSpacing: "-0.012em" }}>
                      {inv.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-4 text-[var(--text-tertiary)]">
                      <span className="inline-flex rounded-full bg-[var(--surface-elevated)] px-1.5 py-0.5 font-medium tracking-wide text-[10px] text-[var(--text-secondary)]">{inv.bugId}</span>
                      <span className="font-mono tracking-wide">{inv.id}</span>
                      <span>·</span>
                      <span className={inv.variant === "fixed" ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}>{inv.variant}</span>
                    </p>
                  </div>
                  <div className="col-span-3 flex flex-col justify-center">
                    <p className="text-[12px] leading-4 text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--text-primary)]">{inv.frameCount} frames</span>
                      <span className="text-[var(--text-tertiary)]"> · {inv.duration}</span>
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">{inv.target}</p>
                  </div>
                  <div className="col-span-3 flex items-center justify-between gap-3 sm:justify-end">
                    <span className="hidden text-[11px] leading-4 text-[var(--text-tertiary)] sm:inline">
                      {new Date(inv.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                    <VerdictPill verdict={inv.verdict} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Integrity footer — quieter, editorial */}
        <div className="mt-8 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border-muted)" }}>
          <p className="text-[11px] leading-4 text-[var(--text-tertiary)]">
            Evidence integrity · Fixed <span className="text-[var(--text-secondary)]">shows error at 00:01.8</span> · Buggy keeps it hidden · Traceable to frames
          </p>
          <Link href="/demo/bug-01?variant=fixed" className="hidden text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] sm:inline">
            Open target →
          </Link>
        </div>
      </div>
    </div>
  );
}
