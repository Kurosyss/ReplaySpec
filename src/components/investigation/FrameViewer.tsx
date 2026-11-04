"use client";

import type { FrameEvidence } from "@/lib/evidence";

type Props = {
  frame: FrameEvidence;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev: boolean;
  canNext: boolean;
};

export function FrameViewer({ frame, onPrev, onNext, canPrev, canNext }: Props) {
  return (
    <div
      className="flex flex-col rounded-[18px] border bg-[var(--surface)] shadow-xl shadow-black/20"
      style={{ borderColor: "var(--border-muted)" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between border-b px-3.5 py-2.5"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-[4px] bg-[var(--text-primary)] px-2 py-0.5 font-mono text-[11px] font-semibold leading-none text-[var(--canvas)] tracking-tight"
            data-testid="active-timestamp"
          >
            ⟦{frame.timestamp}⟧
          </span>
          <span
            className="hidden font-mono text-[11px] leading-none text-[var(--text-secondary)] sm:inline"
            data-testid="active-frame-id"
          >
            {frame.frameId} · {frame.timestampSeconds}s
          </span>
        </div>
        <span
          data-testid="active-frame-meta"
          className="rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-medium leading-none text-[var(--text-tertiary)]"
          style={{ borderColor: "var(--border-muted)", background: "var(--surface-elevated)" }}
        >
          {frame.width}×{frame.height} · {frame.format.toUpperCase()} · {(frame.bytes / 1024).toFixed(0)}KB
        </span>
      </div>

      {/* Main Viewport Container */}
      <div
        className="relative mx-3.5 my-3 flex items-center justify-center overflow-hidden rounded-[16px] border bg-[var(--canvas)]"
        style={{
          borderColor: "var(--border-muted)",
          aspectRatio: `${frame.width} / ${frame.height}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={frame.file}
          src={frame.file}
          alt={`Frame at ${frame.timestamp}`}
          width={frame.width}
          height={frame.height}
          className="h-full w-full object-contain transition-opacity duration-150 motion-reduce:transition-none select-none ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.08]"
          data-testid="frame-viewer-image"
        />

        {/* Floating filename badge */}
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-[4px] bg-black/80 px-2 py-0.5 font-mono text-[10px] leading-tight text-white/90 backdrop-blur-xs border border-white/10 shadow-xs">
          {frame.file.split("/").pop()}
        </div>

        {/* Previous button */}
        {canPrev ? (
          <button
            type="button"
            aria-label="Previous frame"
            data-testid="frame-prev"
            onClick={onPrev}
            className="absolute left-2.5 flex h-8 w-8 items-center justify-center rounded-full border bg-[var(--surface)] text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            style={{ borderColor: "var(--border-muted)" }}
          >
            <span aria-hidden="true" className="text-base leading-none">‹</span>
          </button>
        ) : null}

        {/* Next button */}
        {canNext ? (
          <button
            type="button"
            aria-label="Next frame"
            data-testid="frame-next"
            onClick={onNext}
            className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--canvas)] shadow-sm transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span aria-hidden="true" className="text-base leading-none">›</span>
          </button>
        ) : null}
      </div>

      {/* Footer information */}
      <div
        className="flex items-center justify-between border-t px-3.5 py-2 font-mono text-[10px] text-[var(--text-tertiary)]"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <span>Source: {frame.sourceVideo ?? "bug-01"}</span>
        <span className="hidden sm:inline">Use ← → arrow keys to scrub frames · Deterministic</span>
      </div>
    </div>
  );
}
