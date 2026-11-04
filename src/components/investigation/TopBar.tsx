import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";

type TopBarProps = {
  investigationId?: string;
  bugLabel?: string;
  verdict?: string | null;
  variant?: "buggy" | "fixed";
};

export function TopBar({ investigationId, bugLabel, verdict, variant }: TopBarProps) {
  const getVerdictStyle = (v: string | null | undefined) => {
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

  return (
    <header
      className="sticky top-0 z-20 flex h-10 items-center justify-between border-b bg-[var(--surface)] px-3"
      style={{ borderColor: "var(--border-muted)" }}
    >
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-[5px] px-1 py-0.5 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Back to ReplaySpec home"
        >
          <BrandLogo size="sm" showTimestamp={true} />
        </Link>

        {investigationId ? (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-3.5 w-px bg-[var(--border-muted)]" aria-hidden="true" />
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
              <span className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--text-secondary)] border border-[var(--border-muted)]">
                {investigationId}
              </span>
              {bugLabel ? (
                <>
                  <span className="text-[11px] text-[var(--text-tertiary)]">/</span>
                  <span className="truncate max-w-[280px] text-[12px] font-medium text-[var(--text-primary)]">
                    {bugLabel}
                  </span>
                </>
              ) : null}
            </nav>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {variant ? (
          <div
            className="flex items-center gap-0.5 rounded-full border bg-[var(--surface-elevated)] p-0.5"
            style={{ borderColor: "var(--border-muted)" }}
            role="group"
            aria-label="Variant"
          >
            <span
              data-testid="variant-pill-buggy"
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-none transition-colors ${
                variant === "buggy"
                  ? "bg-[var(--text-primary)] text-[var(--canvas)] shadow-sm"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Buggy
            </span>
            <span
              data-testid="variant-pill-fixed"
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-none transition-colors ${
                variant === "fixed"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Fixed
            </span>
          </div>
        ) : null}

        {verdict ? (
          <span
            data-testid="verdict-badge"
            className="hidden rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold leading-none sm:inline-flex"
            style={getVerdictStyle(verdict)}
          >
            {verdict}
          </span>
        ) : null}

        <ThemeToggle />
      </div>
    </header>
  );
}
