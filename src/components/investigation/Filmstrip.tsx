"use client";
import type { FrameEvidence } from "@/lib/evidence";
type Props = { frames: FrameEvidence[]; activeFrameId: string; onSelect: (frameId: string) => void };
export function Filmstrip({ frames, activeFrameId, onSelect }: Props) {
  return (
    <div className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border-muted)", boxShadow: "var(--shadow-sm)" }}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Filmstrip</h3>
        <span className="rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">{frames.length} frames</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Frames">
        {frames.map((f) => {
          const isActive = f.frameId === activeFrameId;
          return (
            <button key={f.frameId} role="tab" aria-selected={isActive} data-testid={`filmstrip-thumb-${f.frameId}`} onClick={() => onSelect(f.frameId)} className={`group flex shrink-0 flex-col items-center gap-1 rounded-[6px] p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isActive ? "bg-[var(--accent-muted)] ring-1 ring-[var(--accent)]" : "hover:bg-[var(--surface-hover)]"}`}>
              <span className={`overflow-hidden rounded-[6px] border ${isActive ? "border-[var(--accent)]" : "border-transparent"}`} style={{ borderColor: isActive ? "var(--accent)" : "var(--border-muted)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.file} alt="" width={96} height={54} className="h-[54px] w-[96px] object-cover" />
              </span>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] leading-4 ${isActive ? "bg-[var(--text-primary)] text-[var(--canvas)]" : "bg-[var(--surface-elevated)] text-[var(--text-tertiary)]"}`}>{f.timestamp}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
