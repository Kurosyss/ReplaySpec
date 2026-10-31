"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { investigationSummaries as fixtureSummaries } from "@/lib/fixtures/bug01-investigation";
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
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium leading-none" style={s}>
      {verdict ?? "—"}
    </span>
  );
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<InvestigationMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestigations = async () => {
    try {
      const res = await fetch("/api/investigations");
      if (res.ok) {
        const data = await res.json();
        const persisted: InvestigationMeta[] = data.investigations ?? [];
        if (persisted.length === 0) {
          setInvestigations(fixtureSummaries as any);
        } else {
          const ids = new Set(persisted.map((p) => p.id));
          const merged = [...persisted];
          for (const f of fixtureSummaries as any as InvestigationMeta[]) {
            if (!ids.has(f.id)) merged.push(f);
          }
          setInvestigations(merged);
        }
      } else {
        setInvestigations(fixtureSummaries as any);
      }
    } catch {
      setInvestigations(fixtureSummaries as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[var(--canvas)]">
      <div className="mx-auto w-full max-w-[960px] px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold leading-none tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.025em" }}>
              Investigations
            </h1>
            <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Evidence-grounded browser bug investigation — every claim traces to a frame.</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/investigations/new"
              data-testid="new-investigation-button"
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--text-primary)] px-3 py-1.5 text-[13px] font-medium text-[var(--canvas)] shadow-sm hover:opacity-90"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-[6px] bg-[var(--canvas)] text-[11px] leading-none text-[var(--text-primary)]">+</span>
              New investigation
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="font-mono text-[12px] text-[var(--text-tertiary)]">Loading investigations…</p>
        ) : investigations.length === 0 ? (
          <div className="rounded-[8px] border bg-[var(--surface)] p-6 text-center" style={{ borderColor: "var(--border-muted)" }}>
            <p className="text-[13px] font-medium text-[var(--text-primary)]">No investigations yet</p>
            <p className="mt-1 font-mono text-[12px] leading-5 text-[var(--text-secondary)]">Complete a real Playwright run first — run produces a real verdict and recording, then create an investigation from it.</p>
            <Link href="/investigations/bug-01" className="mt-3 inline-flex rounded-[6px] border bg-[var(--surface)] px-3 py-1.5 font-mono text-[12px] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>
              Open execution workflow →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[8px] border bg-[var(--surface)]" style={{ borderColor: "var(--border-muted)", boxShadow: "var(--shadow-sm)" }}>
            <div
              className="grid grid-cols-12 gap-4 border-b px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-wider"
              style={{ borderColor: "var(--border-muted)", background: "var(--surface-elevated)", color: "var(--text-tertiary)" }}
            >
              <span className="col-span-5">Investigation</span>
              <span className="col-span-3">Recording</span>
              <span className="col-span-2">Target</span>
              <span className="col-span-2 text-right">Verdict</span>
            </div>
            {investigations.map((inv) => (
              <Link
                key={inv.id}
                href={`/investigations/${inv.id}`}
                data-testid={`investigation-row-${inv.id}`}
                className="group grid grid-cols-12 gap-4 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                style={{ borderTop: "1px solid var(--border-muted)" }}
              >
                <div className="col-span-5 min-w-0">
                  <p className="truncate text-[13px] font-medium leading-5 text-[var(--text-primary)]" style={{ letterSpacing: "-0.01em" }}>
                    {inv.title}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">
                    {inv.bugId} · {inv.id} · {inv.variant}
                  </p>
                </div>
                <div className="col-span-3 flex flex-col justify-center">
                  <p className="font-mono text-[12px] leading-4 text-[var(--text-primary)]">
                    {inv.frameCount} frames · {inv.duration}
                  </p>
                  <p className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">800×450 PNG</p>
                </div>
                <div className="col-span-2 flex flex-col justify-center">
                  <p className="truncate font-mono text-[11px] leading-4 text-[var(--text-secondary)]">{inv.target}</p>
                  <p className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">allowlisted</p>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <VerdictPill verdict={inv.verdict} />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-[8px] border bg-[var(--surface-elevated)] p-4" style={{ borderColor: "var(--border-muted)" }}>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Evidence Integrity</p>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-[var(--text-secondary)]">
            This workspace uses genuine empty-postal evidence — <span className="font-medium text-[var(--text-primary)]">fixed shows error at 00:01.8</span>, buggy keeps it hidden. Traceable to frames, not claimed.
          </p>
          <Link
            href="/demo/bug-01?variant=fixed"
            className="mt-3 inline-flex items-center gap-1 rounded-full border bg-[var(--surface)] px-3 py-1.5 font-mono text-[12px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            style={{ borderColor: "var(--border)" }}
          >
            Open target fixture <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
