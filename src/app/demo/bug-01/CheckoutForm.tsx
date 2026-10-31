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
      className="flex flex-col gap-6"
    >
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100" style={{ letterSpacing: "-0.01em" }}>
            Checkout
          </h2>
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 font-mono text-[11px] font-medium text-white dark:bg-white dark:text-zinc-900">
            Step 2 of 3
          </span>
        </div>
        <p id="form-hint" className="mb-6 flex items-center gap-2 font-mono text-xs text-zinc-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] text-white">✓</span>
          Enter shipping details to complete your order
        </p>
        <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-600">Shipping address</h3>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="checkout-name" className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
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
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="checkout-address" className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
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
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="checkout-city" className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
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
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="checkout-postal" className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
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
              className="rounded-xl border bg-white px-4 py-3.5 text-sm font-medium text-zinc-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-zinc-400 focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:bg-red-50/50 aria-[invalid=true]:ring-red-500/20 dark:aria-[invalid=true]:bg-red-950/20 border-zinc-200 focus:border-amber-500 focus:ring-amber-500/20 dark:border-zinc-700"
            />
            {showValidationAttempt ? (
              <p
                id="postal-error"
                data-testid="postal-error"
                role="alert"
                className={
                  isFixed
                    ? "flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 font-mono text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                    : "hidden border border-red-200 bg-red-50 px-3 py-2.5 font-mono text-xs font-medium text-red-700"
                }
                style={isFixed ? undefined : { display: "none" }}
              >
                <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#dc2626" />
                  <path d="M10 7v5M10 14h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Postal code is required.</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow-sm dark:bg-zinc-800">◈</span>
          <div>
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Express shipping — free</p>
            <p className="font-mono text-[11px] text-zinc-500">Delivers Wed, Nov 6 • 2-day</p>
          </div>
          <span className="ml-auto font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">Free</span>
        </div>

        <button
          type="submit"
          data-testid="checkout-submit"
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
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
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-mono text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span>
            Order placed successfully — confirmation sent to email.
          </p>
        ) : null}
      </div>

      <p className="flex items-center justify-center gap-2 pt-2 font-mono text-[11px] text-zinc-500">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Secure checkout • 256-bit SSL
      </p>

      <p className="text-center font-mono text-[11px] text-zinc-400">
        Variant: <span data-testid="variant-badge">{variant}</span> — {isFixed ? "Fixed: validation error is visible." : "Buggy: validation error is hidden (display:none defect)."}
      </p>
    </form>
  );
}
