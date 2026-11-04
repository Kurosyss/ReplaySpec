import { CartCounter } from "./CartCounter";
import { ThemeToggle } from "@/components/ThemeToggle";

type SearchParams = { variant?: string };

export const metadata = {
  title: "Cart Counter — Maison | BUG-02 Cart Counter Race",
  description:
    "E-commerce cart benchmark for concurrent increment race condition. Buggy drops a rapid click; fixed increments atomically to 3.",
};

export default async function Bug02Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const raw = params.variant ?? "buggy";
  const variant: "buggy" | "fixed" = raw === "fixed" ? "fixed" : "buggy";

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)]">
      {/* Top Header — Institutional Minimalist */}
      <header
        className="sticky top-0 z-10 border-b bg-[var(--surface)]/95 backdrop-blur-md"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <div className="mx-auto flex h-[62px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <span
              className="text-[17px] font-semibold tracking-tight text-[var(--text-primary)]"
              style={{ letterSpacing: "-0.03em" }}
            >
              MAISON
            </span>
            <span className="hidden h-4 w-px bg-[var(--border-strong)] sm:block" aria-hidden="true" />
            <nav className="hidden items-center gap-2 sm:flex" aria-label="Cart progress">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--text-primary)] text-[10px] font-semibold text-[var(--canvas)]">
                1
              </span>
              <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">Bag</span>
              <span className="mx-1 text-[var(--text-tertiary)]">—</span>
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium text-[var(--text-tertiary)]"
                style={{ borderColor: "var(--border-strong)" }}
              >
                2
              </span>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">Shipping</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span
              className="hidden items-center gap-1.5 rounded-full border bg-[var(--surface-elevated)] px-3 py-1 font-mono text-[11px] text-[var(--text-secondary)] sm:inline-flex"
              style={{ borderColor: "var(--border-muted)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)] animate-pulse" /> Live benchmark
            </span>
          </div>
        </div>
      </header>

      {/* Subheader: Scenario Context & Variant Switcher */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            EVIDENCE BENCHMARK • BUG-02
          </p>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Cart counter race
          </h1>
        </div>
        <nav
          aria-label="Variant switcher"
          className="flex gap-1 rounded-full border bg-[var(--surface-elevated)] p-1"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <a
            href="/demo/bug-02?variant=buggy"
            data-testid="variant-buggy-link"
            aria-current={variant === "buggy" ? "page" : undefined}
            className={
              variant === "buggy"
                ? "rounded-full bg-[var(--text-primary)] px-3.5 py-1 text-xs font-semibold text-[var(--canvas)] shadow-xs transition-colors"
                : "rounded-full px-3.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            }
          >
            Buggy
          </a>
          <a
            href="/demo/bug-02?variant=fixed"
            data-testid="variant-fixed-link"
            aria-current={variant === "fixed" ? "page" : undefined}
            className={
              variant === "fixed"
                ? "rounded-full bg-[var(--text-primary)] px-3.5 py-1 text-xs font-semibold text-[var(--canvas)] shadow-xs transition-colors flex items-center gap-1.5"
                : "rounded-full px-3.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            }
          >
            {variant === "fixed" && <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />}
            Fixed
          </a>
        </nav>
      </div>

      {/* Main Two-Column Layout */}
      <main className="mx-auto grid max-w-[1120px] gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Left Column: Interactive Cart Counter */}
        <div className="flex flex-col gap-6">
          <div
            className="surface-geodesic-primary p-6 sm:p-7"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Expected Behaviour Banner */}
            <div
              className="mb-6 flex items-start gap-3 rounded-[16px] border border-l-[3px] p-4"
              style={{
                borderColor: "var(--accent-muted)",
                borderLeftColor: "var(--accent)",
                backgroundColor: "var(--accent-muted)",
              }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                }}
              >
                ✓
              </span>
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-primary)] tracking-tight">
                  Expected invariant
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
                  Rapid cart interactions must preserve every click. Two consecutive clicks on{" "}
                  <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[11px] border border-[var(--border-muted)]">
                    +
                  </code>{" "}
                  must increase quantity from{" "}
                  <span className="font-semibold text-[var(--text-primary)]">1 to 3</span>.
                </p>
              </div>
            </div>

            <CartCounter variant={variant} />
          </div>
        </div>

        {/* Right Column: 380px Architectural Hints */}
        <aside className="flex flex-col gap-5">
          <div
            className="surface-geodesic-secondary p-5"
            style={{ borderColor: "var(--border)" }}
            data-testid="defect-invariant-note"
          >
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
              EVIDENCE HINTS
            </p>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-secondary)]">Buggy race</dt>
                <dd className="font-mono text-[11px] font-medium text-[var(--red)] bg-[var(--red-muted)] px-2 py-0.5 rounded-[4px] border border-red-200/50 dark:border-red-900/40">
                  Drops click (ends at 2)
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-secondary)]">Fixed atomic update</dt>
                <dd className="font-mono text-[11px] font-medium text-[var(--green)] bg-[var(--green-muted)] px-2 py-0.5 rounded-[4px] border border-green-200/50 dark:border-green-900/40">
                  Preserves both (reaches 3)
                </dd>
              </div>
              <div className="border-t pt-3 mt-3" style={{ borderColor: "var(--border-muted)" }}>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                  STABLE HOOKS
                </dt>
                <dd className="mt-1 font-mono text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                  cart-counter-card · cart-quantity · cart-increment · cart-sync-status
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </main>
    </div>
  );
}
