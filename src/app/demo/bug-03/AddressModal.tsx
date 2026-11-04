"use client";

import { useState } from "react";

type Variant = "buggy" | "fixed";
type Props = { variant: Variant };

export function AddressModal({ variant }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [wasDismissed, setWasDismissed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [cancelWasBlocked, setCancelWasBlocked] = useState(false);

  const isFixed = variant === "fixed";

  function handleCancel() {
    setIsOpen(false);
    setWasDismissed(true);
    setIsConfirmed(false);
  }

  function handleConfirm() {
    setIsOpen(false);
    setIsConfirmed(true);
  }

  function handleReopen() {
    setIsOpen(true);
    setWasDismissed(false);
    setIsConfirmed(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Background Page Status */}
      <div className="rounded-[12px] border bg-[var(--surface-elevated)] p-6" style={{ borderColor: "var(--border-muted)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">
              Shipping Destination
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              584 Valencia St, San Francisco, CA 94110
            </p>
          </div>
          <button
            type="button"
            data-testid="modal-open-trigger"
            onClick={handleReopen}
            className="control-precise px-3 py-1.5 text-xs font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
          >
            Review address
          </button>
        </div>

        {wasDismissed && (
          <div
            data-testid="modal-dismissed-alert"
            className="mt-4 rounded-[8px] border border-green-200 bg-green-50/70 p-3 font-mono text-xs text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300 flex items-center gap-2"
          >
            <span>✓</span>
            <span>Modal dismissed successfully. Changes discarded.</span>
          </div>
        )}

        {isConfirmed && (
          <div
            data-testid="modal-confirmed-alert"
            className="mt-4 rounded-[8px] border border-blue-200 bg-blue-50/70 p-3 font-mono text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
          >
            Address verified and confirmed.
          </div>
        )}
      </div>

      {/* Modal Dialog and Overlay */}
      {isOpen && (
        <div
          data-testid="modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="relative rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md"
        >
          {/* Header */}
          <div className="border-b pb-3" style={{ borderColor: "var(--border-muted)" }}>
            <h2 id="modal-title" className="text-base font-semibold text-[var(--text-primary)]">
              Confirm shipping address
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Please verify the courier destination before dispatch
            </p>
          </div>

          {/* Body */}
          <div className="py-4 text-xs space-y-2 text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Jane Doe</p>
            <p>584 Valencia Street, Apt 3B</p>
            <p>San Francisco, CA 94110 • United States</p>
          </div>

          {/* Defect Reproduction: Stacking Context & Pointer Interception */}
          <div className="relative pt-2">
            {!isFixed && (
              /* Buggy variant: overlay sits at z-50 with pointer-events: all, intercepting clicks over actions (z-40) */
              <div
                className="absolute inset-0 z-50 bg-transparent cursor-not-allowed"
                style={{ pointerEvents: "all" }}
                title="Overlay layer trapping clicks (defect)"
                onPointerDown={() => setCancelWasBlocked(true)}
              />
            )}

            {/* Actions Bar */}
            <div
              className={`flex items-center justify-end gap-3 ${
                isFixed ? "relative z-60" : "relative z-40"
              }`}
            >
              <button
                type="button"
                data-testid="modal-cancel-btn"
                onClick={handleCancel}
                className="control-precise px-4 py-2 text-xs font-semibold border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                data-testid="modal-confirm-btn"
                onClick={handleConfirm}
                className="control-precise px-4 py-2 text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Confirm address
              </button>
            </div>
            {cancelWasBlocked && !isFixed && (
              <p
                data-testid="modal-click-blocked-alert"
                role="status"
                className="mt-3 rounded-[8px] border border-red-200 bg-red-50/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                Cancel click was intercepted by the overlay. The dialog remains open.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
