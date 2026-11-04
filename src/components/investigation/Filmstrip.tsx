"use client";

import type { FrameEvidence } from "@/lib/evidence";

type Props = {
  frames: FrameEvidence[];
  activeFrameId: string;
  onSelect: (frameId: string) => void;
};

export function Filmstrip({ frames, activeFrameId, onSelect }: Props) {
  return (
    <div
      className="rounded-[8px] border bg-[var(--surface)] p-3 shadow-sm"
      style={{ borderColor: "var(--border-muted)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Filmstrip Sequence
        </h3>
        <span
          className="rounded-[4px] bg-[var(--surface-elevated)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)] border border-[var(--border-muted)]"
        >
          {frames.length} frames
        </span>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin"
        role="tablist"
        aria-label="Frames"
      >
        {frames.map((f) => {
          const isActive = f.frameId === activeFrameId;
          return (
            <button
              key={f.frameId}
              role="tab"
              type="button"
              aria-selected={isActive}
              data-testid={`filmstrip-thumb-${f.frameId}`}
              onClick={() => onSelect(f.frameId)}
              className={`group flex shrink-0 flex-col items-center gap-1.5 rounded-[6px] p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                isActive
                  ? "bg-[var(--surface-elevated)] ring-1 ring-[var(--accent)]"
                  : "hover:bg-[var(--surface-hover)]"
              }`}
            >
              <span
                className={`overflow-hidden rounded-[4px] border transition-colors ${
                  isActive ? "border-[var(--accent)] shadow-sm" : "border-[var(--border-muted)] group-hover:border-[var(--border-strong)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.file}
                  alt={`Frame ${f.timestamp}`}
                  width={96}
                  height={54}
                  className="h-[54px] w-[96px] object-cover"
                />
              </span>
              <span
                className={`rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none transition-colors ${
                  isActive
                    ? "bg-[var(--text-primary)] text-[var(--canvas)]"
                    : "bg-[var(--surface-elevated)] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
                }`}
              >
                {f.timestamp}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
