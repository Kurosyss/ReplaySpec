"use client";
import type { EvidenceBundle } from "@/lib/evidence";
type Props = { bundle: EvidenceBundle; activeFrameId?: string; activeEvidenceId?: string | null; onSelectEvidence: (id: string, frameId: string) => void };
export function EvidenceTimeline({ bundle, activeFrameId, activeEvidenceId, onSelectEvidence }: Props) {
  const frames = bundle.frames;
  return (
    <div className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border-muted)", boxShadow: "var(--shadow-sm)" }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-medium tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.01em" }}>Evidence Timeline</h3>
        <span className="rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">4 lanes</span>
      </div>
      <div className="mb-2 flex">
        <div className="w-24 shrink-0" />
        <div className="flex flex-1 justify-between px-3">
          {frames.map((f) => (
            <span key={f.frameId} data-testid={`timeline-tick-${f.frameId}`} className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] leading-4 ${f.frameId === activeFrameId ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-elevated)] text-[var(--text-tertiary)]"}`}>{f.timestamp}</span>
          ))}
        </div>
      </div>
      <div className="relative flex flex-col gap-3">
        <div className="pointer-events-none absolute left-24 right-3 top-2 bottom-2 hidden border-l border-dashed lg:block" style={{ borderColor: "var(--border-muted)" }} aria-hidden="true" />
        {[
          { label: "Observed", color: "var(--text-primary)", lane: "observed" },
          { label: "Expected", color: "var(--amber)", lane: "expected" },
          { label: "Hypothesis", color: "var(--violet)", lane: "hypothesis" },
          { label: "Ambiguity", color: "var(--text-tertiary)", lane: "ambiguity" },
        ].map((row) => (
          <div key={row.lane} className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider" style={{ color: row.color }}>
              <span className="h-2 w-2 rounded-full" style={{ background: row.color }} /> {row.label}
            </span>
            {row.lane === "expected" ? (
              <div className="flex-1 rounded-full bg-[var(--amber-muted)] px-3 py-1.5" style={{ border: "1px solid transparent" }}>
                <p className="truncate font-mono text-[12px] leading-4 text-[var(--text-primary)]" title={bundle.expectedBehaviours[0]?.statement}>{bundle.expectedBehaviours[0]?.statement}</p>
              </div>
            ) : (
              <div className="flex flex-1 justify-between px-3">
                {frames.map((f) => {
                  const isActive = row.lane === "observed" ? bundle.observations.some((o) => o.frameId === f.frameId && o.id === activeEvidenceId) : row.lane === "hypothesis" ? f.timestamp === "00:01.8" && bundle.hypotheses[0]?.id === activeEvidenceId : f.timestamp === frames[frames.length - 1].timestamp && bundle.ambiguities[0]?.id === activeEvidenceId;
                  const has = row.lane === "observed" ? !!bundle.observations.find((o) => o.frameId === f.frameId) : row.lane === "hypothesis" ? f.timestamp === "00:01.8" : row.lane === "ambiguity" ? f.timestamp === frames[frames.length - 1].timestamp : false;
                  const item = row.lane === "observed" ? bundle.observations.find((o) => o.frameId === f.frameId) : row.lane === "hypothesis" ? bundle.hypotheses[0] : bundle.ambiguities[0];
                  return (
                    <button
                      key={f.frameId}
                      type="button"
                      data-testid={`timeline-${row.lane}-${f.frameId}`}
                      aria-label={`${row.label} at ${f.timestamp}`}
                      onClick={() => item && onSelectEvidence(item.id, f.frameId)}
                      className={`h-3 w-3 rounded-full border bg-[var(--surface)] shadow-sm transition-transform duration-150 hover:scale-110 ${has ? "" : "opacity-40"} ${isActive ? "scale-110 ring-2 ring-[var(--accent)] ring-offset-1" : ""}`}
                      style={{ borderColor: has ? row.color : "var(--border)", background: has ? (row.lane === "observed" ? "var(--text-primary)" : row.lane === "hypothesis" ? "var(--violet-muted)" : "var(--surface)") : "var(--surface)", borderStyle: row.lane === "hypothesis" ? "dashed" : row.lane === "ambiguity" ? "dotted" : "solid" }}
                      title={has ? String((item as unknown as { statement: string })?.statement ?? "").slice(0, 80) : "—"}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-[6px] bg-[var(--surface-elevated)] px-2 py-1.5 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">No observation without a frame — click dots to inspect.</p>
    </div>
  );
}
