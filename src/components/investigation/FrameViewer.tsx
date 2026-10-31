"use client";
import type { FrameEvidence } from "@/lib/evidence";
type Props = { frame: FrameEvidence; onPrev?: () => void; onNext?: () => void; canPrev: boolean; canNext: boolean };
export function FrameViewer({ frame, onPrev, onNext, canPrev, canNext }: Props) {
  return (
    <div className="flex flex-col rounded-[8px] border bg-[var(--surface)]" style={{ borderColor: "var(--border-muted)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded-[6px] bg-[var(--text-primary)] px-2 py-1 font-mono text-[11px] font-semibold leading-none text-[var(--canvas)]" data-testid="active-timestamp">⟦{frame.timestamp}⟧</span>
          <span className="hidden font-mono text-[11px] leading-4 text-[var(--text-tertiary)] sm:inline" data-testid="active-frame-id">{frame.frameId} · {frame.timestampSeconds}s</span>
        </div>
        <span data-testid="active-frame-meta" className="rounded-full border px-2 py-1 font-mono text-[11px] leading-none text-[var(--text-tertiary)]" style={{ borderColor: "var(--border-muted)", background: "var(--surface-elevated)" }}>{frame.width}×{frame.height} · {frame.format.toUpperCase()} · {(frame.bytes / 1024).toFixed(0)}KB</span>
      </div>
      <div className="relative mx-3 mb-3 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-[8px] border bg-[var(--canvas)]" style={{ borderColor: "var(--border-muted)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={frame.file} src={frame.file} alt={`Frame at ${frame.timestamp}`} width={frame.width} height={frame.height} className="max-h-full max-w-full object-contain transition-opacity duration-150 motion-reduce:transition-none" data-testid="frame-viewer-image" />
        <div className="absolute bottom-2 right-2 rounded-[6px] bg-black/70 px-1.5 py-0.5 font-mono text-[10px] leading-4 text-white backdrop-blur">{frame.file.split("/").pop()}</div>
        {canPrev ? <button type="button" aria-label="Previous frame" data-testid="frame-prev" onClick={onPrev} className="absolute left-2 rounded-full bg-[var(--surface)] p-2 text-[var(--text-primary)] shadow-sm hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" style={{ border: "1px solid var(--border-muted)" }}>‹</button> : null}
        {canNext ? <button type="button" aria-label="Next frame" data-testid="frame-next" onClick={onNext} className="absolute right-2 rounded-full bg-[var(--text-primary)] p-2 text-[var(--canvas)] shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">›</button> : null}
      </div>
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Source: {frame.sourceVideo ?? "bug-01"} </span>
        <span className="hidden font-mono text-[11px] leading-4 text-[var(--text-tertiary)] sm:inline">← → scrub · No autoplay</span>
      </div>
    </div>
  );
}
