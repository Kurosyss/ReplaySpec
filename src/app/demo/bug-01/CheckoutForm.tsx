"use client";

import { useState } from "react";

type Variant = "buggy" | "fixed";
type Props = { variant: Variant };

export function CheckoutForm({ variant }: Props) {
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const postalMissing = postalCode.trim() === "";
  const showValidationAttempt = submitted && postalMissing;
  const isFixed = variant === "fixed";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (postalMissing) {
      setOrderPlaced(false);
      return;
    }
    setOrderPlaced(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="checkout-form"
      aria-describedby="form-hint"
      className="flex flex-col gap-5"
    >
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.015em" }}>
            Checkout
          </h2>
          <span className="rounded-full bg-[var(--text-primary)] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--canvas)]">
            Step 2 of 2
          </span>
        </div>
        <p id="form-hint" className="mb-4 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>
          Enter shipping details to complete your order
        </p>
        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Shipping address
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="checkout-name" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Full name <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="checkout-name"
            data-testid="checkout-name-input"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full rounded-[8px] border bg-[var(--surface-elevated)] px-3.5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="checkout-address" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Street address <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="checkout-address"
            data-testid="checkout-address-input"
            type="text"
            autoComplete="street-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Market Street, Apt 4B"
            className="w-full rounded-[8px] border bg-[var(--surface-elevated)] px-3.5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-city" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              City <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="checkout-city"
              data-testid="checkout-city-input"
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="San Francisco"
              className="w-full rounded-[8px] border bg-[var(--surface-elevated)] px-3.5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-postal" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Postal code <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="checkout-postal"
              data-testid="postal-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Enter postal code"
              aria-required="true"
              aria-invalid={showValidationAttempt ? "true" : "false"}
              aria-describedby={showValidationAttempt ? "postal-error" : undefined}
              className="w-full rounded-[8px] border bg-[var(--surface-elevated)] px-3.5 py-3 text-sm font-medium text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] outline-none transition-colors border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] aria-[invalid=true]:border-red-500 aria-[invalid=true]:bg-red-50/40 dark:aria-[invalid=true]:bg-red-950/20"
            />
            {showValidationAttempt ? (
              <p
                id="postal-error"
                data-testid="postal-error"
                role="alert"
                className={
                  isFixed
                    ? "flex items-center gap-2 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
                    : "hidden border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs font-medium text-red-700"
                }
                style={isFixed ? undefined : { display: "none" }}
              >
                <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#dc2626" />
                  <path d="M10 6v5M10 14h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Postal code is required.</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)] text-xs shadow-xs">
            ◈
          </span>
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)]">Express shipping — free</p>
            <p className="font-mono text-[11px] text-[var(--text-secondary)]">Delivers Wed, Nov 6 • 2-day</p>
          </div>
          <span className="ml-auto font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">Free</span>
        </div>

        <button
          type="submit"
          data-testid="checkout-submit"
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] px-6 text-sm font-semibold text-[var(--canvas)] shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Place order
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>

        {orderPlaced ? (
          <p
            data-testid="order-success"
            role="status"
            className="flex items-center gap-2 rounded-[14px] border px-3.5 py-2.5 font-mono text-xs font-semibold"
            style={{ borderColor: "var(--success-border)", backgroundColor: "var(--success-surface)", color: "var(--success-text)" }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-white text-[11px]" style={{ backgroundColor: "var(--success-icon)" }}>✓</span>
            Demo validation passed. No order was placed and no payment was collected.
          </p>
        ) : null}
      </div>

      <p className="flex items-center justify-center gap-2 pt-1 font-mono text-[11px] text-[var(--text-secondary)]">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Demo checkout · no payment is collected
      </p>

      <p className="text-center font-mono text-[11px] text-[var(--text-tertiary)]">
        Variant: <span data-testid="variant-badge" className="font-semibold text-[var(--text-primary)]">{variant}</span> — {isFixed ? "Fixed: validation error is visible." : "Buggy: validation error is hidden (display:none defect)."}
      </p>

      {/* Invariant for regression test panel */}
      <div
        className="mt-2 rounded-[8px] border bg-[var(--surface-elevated)] p-4 font-mono text-xs text-[var(--text-secondary)]"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <p className="font-semibold uppercase tracking-widest text-[var(--text-tertiary)] text-[10px] mb-2">
          INVARIANT FOR REGRESSION TEST
        </p>
        <ul className="space-y-1.5 leading-relaxed text-[11px]">
          <li className="flex items-start gap-1.5">
            <span className="text-[var(--text-tertiary)]">•</span>
            <span>
              After <span className="text-[var(--text-primary)] font-semibold">checkout-submit</span> with empty postal code,{" "}
              <span className="rounded bg-[var(--surface)] px-1 py-0.5 text-[var(--text-primary)] border border-[var(--border-muted)]">[data-testid=&quot;postal-error&quot;]</span>{" "}
              must be <span className="text-emerald-600 dark:text-emerald-400 font-semibold">visible</span> and contain{" "}
              <span className="text-[var(--text-primary)] font-medium">&ldquo;Postal code is required.&rdquo;</span>
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[var(--text-tertiary)]">•</span>
            <span>
              Element exists in DOM in both variants; buggy hides it via <span className="text-red-600 dark:text-red-400 font-semibold">display: none</span>.
            </span>
          </li>
        </ul>
      </div>
    </form>
  );
}
