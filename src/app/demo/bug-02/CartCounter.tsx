"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "buggy" | "fixed";
type Props = { variant: Variant };

export function CartCounter({ variant }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const isFixed = variant === "fixed";
  const unitPrice = 248.0;
  const subtotal = (quantity * unitPrice).toFixed(2);

  useEffect(() => {
    cardRef.current?.setAttribute("data-interactive", "true");
  }, []);

  function handleIncrement() {
    setClickCount((c) => c + 1);
    setIsUpdating(true);

    if (isFixed) {
      // Fixed: functional updater atomically preserves all consecutive rapid clicks
      setQuantity((prev) => prev + 1);
      setTimeout(() => setIsUpdating(false), 80);
    } else {
      // Buggy: reads stale closure `quantity` during async debounce/network window
      // Rapid consecutive clicks both evaluate with the original closure value, losing one increment
      setTimeout(() => {
        setQuantity(quantity + 1);
        setIsUpdating(false);
      }, 700);
    }
  }

  function handleDecrement() {
    if (quantity <= 1) return;
    setQuantity((prev) => prev - 1);
  }

  function handleReset() {
    setQuantity(1);
    setClickCount(0);
    setIsUpdating(false);
  }

  return (
    <div
      ref={cardRef}
      data-testid="cart-counter-card"
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-muted)" }}>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
            Bag contents
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Modify quantity before proceeding to shipping details
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="control-precise px-2.5 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-muted)]"
        >
          Reset to 1
        </button>
      </div>

      {/* Item Row */}
      <div className="flex items-center gap-4 rounded-[20px] border bg-[var(--surface-elevated)] p-4" style={{ borderColor: "var(--border-muted)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/products/overcoat-camel.jpg"
          alt="Wool Overcoat — Camel"
          width={64}
          height={64}
          decoding="async"
          className="h-16 w-16 shrink-0 rounded-[14px] object-cover border bg-[var(--surface)]"
          style={{ borderColor: "var(--border-muted)" }}
        />
        <div className="flex flex-1 flex-col justify-center min-w-0">
          <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
            Wool Overcoat — Camel
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Italian Virgin Wool • Size M</p>
          <p className="mt-1 font-mono text-xs font-semibold text-[var(--text-primary)]">
            ${unitPrice.toFixed(2)} each
          </p>
        </div>

        {/* Counter Control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="cart-decrement"
            onClick={handleDecrement}
            disabled={quantity <= 1 || isUpdating}
            aria-label="Decrease quantity"
            className="control-precise flex h-8 w-8 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
          >
            −
          </button>

          <span
            data-testid="cart-quantity"
            className="flex h-8 min-w-[36px] items-center justify-center font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums px-2 rounded-[6px] border bg-[var(--surface)]"
            style={{ borderColor: "var(--border)" }}
          >
            {quantity}
          </span>

          <button
            type="button"
            data-testid="cart-increment"
            onClick={handleIncrement}
            aria-label="Increase quantity"
            className="control-precise flex h-8 w-8 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Telemetry and State Status */}
      <div
        data-testid="cart-sync-status"
        className="rounded-[16px] border p-3.5 flex items-center justify-between"
        style={{
          borderColor: isUpdating ? "var(--amber-muted)" : "var(--border-muted)",
          backgroundColor: isUpdating ? "var(--amber-muted)" : "var(--surface-elevated)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isUpdating ? "bg-[var(--amber)] animate-ping" : isFixed && quantity === 3 ? "bg-[var(--green)]" : "bg-[var(--text-tertiary)]"
            }`}
          />
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            {isUpdating ? "Syncing rapid inputs..." : clickCount > 0 ? `${clickCount} increment clicks registered` : "Ready for interaction"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--text-tertiary)]">Subtotal:</span>
          <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
            ${subtotal}
          </span>
        </div>
      </div>

      {/* Verdict Demonstration Alert */}
      {clickCount >= 2 && (
        <div
          data-testid={isFixed && quantity === 3 ? "order-success" : "cart-race-detected"}
          className={`rounded-[16px] border p-3 font-mono text-xs ${
            isFixed && quantity === 3
            ? "border-[var(--success-border)] text-[var(--success-text)]"
              : "border-red-200 bg-red-50/60 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          }`}
          style={isFixed && quantity === 3 ? { backgroundColor: "var(--success-surface)" } : undefined}
        >
          {isFixed && quantity === 3 ? (
            <div className="flex items-center gap-2">
              <span className="font-bold">✓ REGRESSION_VERIFIED:</span>
              <span>2 consecutive clicks successfully incremented quantity from 1 to 3.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold">⚠ DEFECT_CONFIRMED:</span>
              <span>Stale state race dropped a click. Quantity is {quantity} instead of 3.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
