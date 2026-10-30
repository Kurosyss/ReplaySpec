"use client";

import { useState } from "react";

type Variant = "buggy" | "fixed";

type Props = {
  variant: Variant;
};

export function CheckoutForm({ variant }: Props) {
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const postalMissing = postalCode.trim() === "";
  const showValidationAttempt = submitted && postalMissing;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    if (postalMissing) {
      // In both variants the form does NOT place the order.
      // Buggy hides the error; fixed shows it.
      setOrderPlaced(false);
      return;
    }

    setOrderPlaced(true);
  }

  const isFixed = variant === "fixed";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="checkout-form"
      className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      aria-describedby="form-hint"
    >
      <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Checkout
      </h2>
      <p
        id="form-hint"
        className="mb-6 text-sm text-zinc-500 dark:text-zinc-400"
      >
        Enter shipping details to complete your order.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-name"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Full name
          </label>
          <input
            id="checkout-name"
            data-testid="checkout-name-input"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-address"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Street address
          </label>
          <input
            id="checkout-address"
            data-testid="checkout-address-input"
            type="text"
            autoComplete="street-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Market St"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-city"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            City
          </label>
          <input
            id="checkout-city"
            data-testid="checkout-city-input"
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="San Francisco"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-postal"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
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
            placeholder="94105"
            aria-required="true"
            aria-invalid={showValidationAttempt ? "true" : "false"}
            aria-describedby={showValidationAttempt ? "postal-error" : undefined}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500"
          />
          {/* Error is always present in DOM after submit, but hidden in buggy variant via display:none */}
          {showValidationAttempt ? (
            <p
              id="postal-error"
              data-testid="postal-error"
              role="alert"
              className={
                isFixed
                  ? "text-sm font-medium text-red-600 dark:text-red-400"
                  : "hidden text-sm font-medium text-red-600 dark:text-red-400"
              }
              style={isFixed ? undefined : { display: "none" }}
            >
              Postal code is required.
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          data-testid="checkout-submit"
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Place order
        </button>

        {orderPlaced ? (
          <p
            data-testid="order-success"
            role="status"
            className="rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
          >
            Order placed successfully.
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
        Variant: <span data-testid="variant-badge">{variant}</span> —{" "}
        {isFixed
          ? "Fixed: validation error is visible."
          : "Buggy: validation error is hidden (display:none defect)."}
      </p>
    </form>
  );
}
