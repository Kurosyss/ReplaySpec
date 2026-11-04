import { CheckoutForm } from "./CheckoutForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

type SearchParams = { variant?: string };

export const metadata = {
  title: "Checkout — Maison | BUG-01 Postal Code Validation",
  description:
    "Professional checkout demo for postal-code validation defect. Buggy hides error via display:none; fixed shows 'Postal code is required.'",
};

export default async function Bug01Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const raw = params.variant ?? "buggy";
  const variant: "buggy" | "fixed" = raw === "fixed" ? "fixed" : "buggy";

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)]">
      {/* Top Header — Institutional Minimalist E-Commerce */}
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
            <nav className="hidden items-center gap-2 sm:flex" aria-label="Demo checkout progress">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-[10px] font-medium text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>
                ✓
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)]">Cart</span>
              <span className="mx-1 text-[var(--text-tertiary)]">—</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--text-primary)] text-[10px] font-semibold text-[var(--canvas)]">
                2
              </span>
              <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">Details</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span
              className="hidden items-center gap-1.5 rounded-full border bg-[var(--surface-elevated)] px-3 py-1 font-mono text-[11px] text-[var(--text-secondary)] sm:inline-flex"
              style={{ borderColor: "var(--border-muted)" }}
            >
              Demo · no payment
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-elevated)] border text-xs"
              style={{ borderColor: "var(--border-muted)" }}
            >
              🛒
            </span>
          </div>
        </div>
      </header>

      {/* Subheader: Demonstration Scenario Context */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <Link href="/investigations" className="mb-2 inline-flex text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ← Back to ReplaySpec
          </Link>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            EVIDENCE BENCHMARK • BUG-01
          </p>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Checkout postal-code validation
          </h1>
        </div>
        <nav
          aria-label="Variant switcher"
          className="flex gap-1 rounded-full border bg-[var(--surface-elevated)] p-1"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <a
            href="/demo/bug-01?variant=buggy"
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
            href="/demo/bug-01?variant=fixed"
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

      {/* Main Two-Column E-Commerce Layout */}
      <main className="mx-auto grid max-w-[1120px] gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Left Column: Form & Invariant */}
        <div className="order-2 lg:order-1 flex flex-col gap-6">
          <div
            className="surface-geodesic-primary p-6 sm:p-7"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Restrained Expected Behaviour Banner */}
            <div
              className="mb-6 flex items-start gap-3 rounded-[16px] border p-3.5"
              style={{
                borderColor: "var(--border-muted)",
                backgroundColor: "var(--surface-elevated)",
              }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold"
                style={{
                  backgroundColor: "var(--accent-muted)",
                  color: "var(--accent)",
                }}
              >
                ✓
              </span>
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-primary)] tracking-tight">
                  Expected behaviour
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
                  Submitting without postal code must display{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    &ldquo;Postal code is required.&rdquo;
                  </span>{" "}
                  Buggy variant reproduces the{" "}
                  <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[11px] border border-[var(--border-muted)]">
                    display:none
                  </code>{" "}
                  defect.
                </p>
              </div>
            </div>

            <CheckoutForm variant={variant} />
          </div>

          <p className="text-center font-mono text-[11px] text-[var(--text-tertiary)]">
            MAISON is a fictional storefront used for the BUG-01 checkout benchmark.
          </p>
        </div>

        {/* Right Column: 380px Architectural Order Summary & Evidence Hints Stack */}
        <aside className="order-1 lg:order-2 flex flex-col gap-5">
          {/* Order Summary with Authentic Product Photography */}
          <div
            className="surface-geodesic-primary p-5"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-muted)" }}>
              <h2 className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
                Order summary
              </h2>
              <span className="badge-technical px-2 py-0.5 bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-muted)]">
                2 items
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {/* Product 1: Camel Wool Overcoat */}
              <div className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/products/overcoat-camel.jpg"
                  alt="Wool Overcoat — Camel"
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-[12px] object-cover border bg-[var(--surface-elevated)]"
                  style={{ borderColor: "var(--border-muted)" }}
                />
                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <p className="truncate text-[13px] font-medium leading-4 text-[var(--text-primary)]">
                    Wool Overcoat — Camel
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--text-tertiary)]">Size M · Qty 1</p>
                  <p className="mt-1 font-mono text-[12px] font-medium text-[var(--text-primary)]">
                    $248.00
                  </p>
                </div>
              </div>

              {/* Product 2: Black Leather Tote */}
              <div className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/products/tote-black.jpg"
                  alt="Leather Tote — Black"
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-[12px] object-cover border bg-[var(--surface-elevated)]"
                  style={{ borderColor: "var(--border-muted)" }}
                />
                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <p className="truncate text-[13px] font-medium leading-4 text-[var(--text-primary)]">
                    Leather Tote — Black
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--text-tertiary)]">Qty 1</p>
                  <p className="mt-1 font-mono text-[12px] font-medium text-[var(--text-primary)]">
                    $168.00
                  </p>
                </div>
              </div>
            </div>

            <div className="my-4 h-px" style={{ backgroundColor: "var(--border-muted)" }} aria-hidden="true" />

            {/* Financial Ledger Breakdown */}
            <dl className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <dt>Subtotal</dt>
                <dd className="font-medium text-[var(--text-primary)]">$416.00</dd>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <dt>Shipping</dt>
                <dd className="font-medium text-[var(--green)]">Free</dd>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <dt>Tax</dt>
                <dd className="font-medium text-[var(--text-primary)]">$33.28</dd>
              </div>
              <div
                className="flex justify-between border-t pt-3 text-sm font-semibold text-[var(--text-primary)]"
                style={{ borderColor: "var(--border-muted)" }}
              >
                <dt>Total</dt>
                <dd>$449.28</dd>
              </div>
            </dl>

            <div
              className="mt-4 flex items-center gap-2 rounded-[16px] border bg-[var(--surface-elevated)] px-3 py-2 text-[var(--text-secondary)]"
              style={{ borderColor: "var(--border-muted)" }}
            >
              <span className="text-xs">🔒</span>
              <p className="font-mono text-[11px] leading-4 text-[var(--text-secondary)]">
                Demo product summary · no payment processing
              </p>
            </div>
          </div>

          {/* Integrated Evidence Hints & Stable Hooks */}
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
                <dt className="text-[var(--text-secondary)]">Buggy selector</dt>
                <dd className="font-mono text-[11px] font-medium text-[var(--red)] bg-[var(--red-muted)] px-2 py-0.5 rounded-[4px] border border-red-200/50 dark:border-red-900/40">
                  [postal-error] — hidden
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--text-secondary)]">Fixed behaviour</dt>
                <dd className="font-mono text-[11px] font-medium text-[var(--green)] bg-[var(--green-muted)] px-2 py-0.5 rounded-[4px] border border-green-200/50 dark:border-green-900/40">
                  Visible error + aria-invalid
                </dd>
              </div>
              <div className="border-t pt-3 mt-3" style={{ borderColor: "var(--border-muted)" }}>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                  STABLE HOOKS
                </dt>
                <dd className="mt-1 font-mono text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                  checkout-form · postal-code-input · checkout-submit · postal-error
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-center font-mono text-[11px] text-[var(--text-tertiary)]">
          MAISON demo storefront · No order, payment, shipment, or customer account is created.
        </p>
      </footer>
    </div>
  );
}
