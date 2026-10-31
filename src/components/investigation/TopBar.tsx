import Link from "next/link";

type TopBarProps = {
  investigationId?: string;
  bugLabel?: string;
  verdict?: string | null;
  variant?: "buggy" | "fixed";
};

import { ThemeToggle } from "@/components/ThemeToggle";

export function TopBar({ investigationId, bugLabel, verdict, variant }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-10 items-center justify-between border-b bg-[var(--surface)] px-3" style={{ borderColor: "var(--border-muted)" }}>
      <div className="flex items-center gap-2">
        <Link
          href="/investigations"
          className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Back to investigations overview"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[var(--text-primary)] text-[10px] font-semibold tracking-tighter text-[var(--canvas)]">
            R
          </span>
          <div className="hidden sm:block">
            <p className="text-[13px] font-medium leading-none tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.01em" }}>
              ReplaySpec
            </p>
          </div>
          <span className="hidden font-mono text-[11px] font-medium tracking-tight text-[var(--text-tertiary)] sm:inline">⟦00:01.8⟧</span>
        </Link>
        {investigationId ? (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-4 w-px" style={{ background: "var(--border-muted)" }} aria-hidden="true" />
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
              <span className="rounded-[6px] bg-[var(--surface-elevated)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--text-secondary)]">
                {investigationId}
              </span>
              {bugLabel ? (
                <>
                  <span className="text-[12px] text-[var(--text-tertiary)]">/</span>
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{bugLabel}</span>
                </>
              ) : null}
            </nav>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5">
        {variant ? (
          <div className="flex items-center gap-0.5 rounded-full border bg-[var(--surface-elevated)] p-0.5" style={{ borderColor: "var(--border-muted)" }} role="group" aria-label="Variant">
            <span
              data-testid="variant-pill-buggy"
              className={`rounded-full px-3 py-1 text-[12px] font-medium leading-none ${variant === "buggy" ? "bg-[var(--text-primary)] text-[var(--canvas)] shadow-sm" : "text-[var(--text-secondary)]"}`}
            >
              Buggy
            </span>
            <span
              data-testid="variant-pill-fixed"
              className={`rounded-full px-3 py-1 text-[12px] font-medium leading-none ${variant === "fixed" ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-secondary)]"}`}
            >
              Fixed
            </span>
          </div>
        ) : null}
        {verdict ? (
          <span
            data-testid="verdict-badge"
            className="hidden rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium leading-none sm:inline-flex"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-elevated)" }}
          >
            {verdict}
          </span>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
