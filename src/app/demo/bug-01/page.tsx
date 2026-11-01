import { CheckoutForm } from "./CheckoutForm";
import { ThemeToggle } from "@/components/ThemeToggle";

type SearchParams = { variant?: string };

export const metadata = {
  title: "Checkout — Maison | BUG-01 Postal Code Validation",
  description: "Professional checkout demo for postal-code validation defect. Buggy hides error via display:none; fixed shows 'Postal code is required.'",
};

export default async function Bug01Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const raw = params.variant ?? "buggy";
  const variant: "buggy" | "fixed" = raw === "fixed" ? "fixed" : "buggy";

  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      {/* Top header — realistic e-commerce */}
      <header className="sticky top-0 z-10 border-b bg-[var(--surface)]/95 backdrop-blur" style={{ borderColor: "var(--border-muted)" }}>
        <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100" style={{ letterSpacing: "-0.02em" }}>
              MAISON
            </span>
            <span className="hidden h-4 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" aria-hidden="true" />
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Checkout progress">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-medium text-white">1</span>
              <span className="font-mono text-xs text-zinc-500">Cart</span>
              <span className="mx-1 text-zinc-300">—</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-zinc-900">2</span>
              <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">Shipping</span>
              <span className="mx-1 text-zinc-300">—</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-[11px] font-medium text-zinc-500">3</span>
              <span className="font-mono text-xs text-zinc-500">Payment</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden items-center gap-1.5 rounded-full border bg-[var(--surface)] px-3 py-1.5 font-mono text-[11px] text-[var(--text-secondary)] sm:inline-flex" style={{ borderColor: "var(--border-muted)" }}>
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Secure checkout
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--text-primary)] text-sm text-[var(--canvas)]">🛒</span>
          </div>
        </div>
      </header>

      {/* Variant switcher — preserved, now refined */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Demo • BUG-01</p>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Checkout postal-code validation</h1>
        </div>
        <nav aria-label="Variant switcher" className="flex gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <a
            href="/demo/bug-01?variant=buggy"
            data-testid="variant-buggy-link"
            aria-current={variant === "buggy" ? "page" : undefined}
            className={
              variant === "buggy"
                ? "rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm dark:bg-white dark:text-zinc-900"
                : "rounded-full px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400"
            }
          >
            Buggy
          </a>
          <a
            href="/demo/bug-01?variant=fixed"
            data-testid="variant-fixed-link"
            aria-current={variant === "fixed" ? "page" : undefined}
            className={
              variant === "fixed"
                ? "rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm"
                : "rounded-full px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400"
            }
          >
            Fixed
          </a>
        </nav>
      </div>

        {/* Main — two-column e-commerce */}
      <main className="mx-auto grid max-w-[1120px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        {/* Left — form */}
        <div className="order-2 lg:order-1">
          <div className="rounded-[12px] border bg-[var(--surface)] p-6 shadow-sm sm:p-7" style={{ borderColor: "var(--border-muted)" }}>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-mono text-xs font-bold text-white">!</span>
              <div>
                <p className="text-[13px] font-semibold leading-4 text-[var(--text-primary)]">Expected behaviour</p>
                <p className="text-[13px] leading-4 text-[var(--text-secondary)]">
                  Submitting without postal code must display <span className="font-medium text-[var(--text-primary)]">“Postal code is required.”</span>
                </p>
              </div>
            </div>

            <CheckoutForm variant={variant} />
          </div>

          <p className="mt-4 text-center font-mono text-[11px] text-zinc-500">Maison — 584 Valencia St, San Francisco • Support • Returns • Privacy</p>
        </div>

        {/* Right — order summary */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-[12px] border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border-muted)" }}>
            <h2 className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">Order summary</h2>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border bg-[var(--surface-elevated)] text-[11px] font-semibold tracking-wide text-[var(--text-tertiary)]" style={{ borderColor: "var(--border-muted)" }}>
                  WO
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-[13px] font-medium leading-4 text-[var(--text-primary)]">Wool Overcoat — Camel</p>
                  <p className="text-[12px] leading-4 text-[var(--text-tertiary)]">Size M · Qty 1</p>
                  <p className="mt-auto font-mono text-[11px] font-medium text-[var(--text-primary)]">$248.00</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border bg-[var(--surface-elevated)] text-[11px] font-semibold tracking-wide text-[var(--text-tertiary)]" style={{ borderColor: "var(--border-muted)" }}>
                  LT
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-[13px] font-medium leading-4 text-[var(--text-primary)]">Leather Tote — Black</p>
                  <p className="text-[12px] leading-4 text-[var(--text-tertiary)]">Qty 1</p>
                  <p className="mt-auto font-mono text-[11px] font-medium text-[var(--text-primary)]">$168.00</p>
                </div>
              </div>
            </div>

            <div className="my-5 h-px bg-zinc-100 dark:bg-zinc-800" aria-hidden="true" />

            <dl className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <dt>Subtotal</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">$416.00</dd>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <dt>Shipping</dt>
                <dd className="font-medium text-emerald-600">Free</dd>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <dt>Tax</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">$33.28</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                <dt>Total</dt>
                <dd>$449.28</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800">
              <span className="text-sm">🔒</span>
              <p className="font-mono text-[11px] leading-4 text-zinc-600 dark:text-zinc-400">
                Secure payment by Stripe • 256-bit SSL • 30-day returns
              </p>
            </div>
          </div>

          {process.env.NODE_ENV !== "production" && (
            <details className="mt-4 rounded-xl border bg-[var(--surface-elevated)] p-4 lg:block" style={{ borderColor: "var(--border-muted)" }}>
              <summary className="cursor-pointer list-none font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                Developer diagnostics
              </summary>
              <dl className="mt-3 space-y-2" data-testid="defect-invariant-note">
                <div className="flex justify-between">
                  <dt className="text-[12px] text-[var(--text-tertiary)]">Invariant</dt>
                  <dd className="font-mono text-[11px] font-medium text-[var(--text-primary)]">postal-error visible</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[12px] text-[var(--text-tertiary)]">Selector</dt>
                  <dd className="font-mono text-[11px] text-[var(--text-secondary)]">[postal-error]</dd>
                </div>
                <div className="border-t pt-2" style={{ borderColor: "var(--border-muted)" }}>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">Stable hooks</dt>
                  <dd className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">checkout-form · postal-code-input · checkout-submit · postal-error</dd>
                </div>
              </dl>
            </details>
          )}
        </aside>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-center font-mono text-[11px] text-zinc-400">© Maison — Investigated by ReplaySpec • Every claim traces to a frame</p>
      </footer>
    </div>
  );
}
