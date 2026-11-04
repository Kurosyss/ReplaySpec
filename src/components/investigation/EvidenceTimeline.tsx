"use client";

import type { EvidenceBundle } from "@/lib/evidence";

type Props = {
  bundle: EvidenceBundle;
  activeFrameId?: string;
  activeEvidenceId?: string | null;
  onSelectEvidence: (id: string, frameId: string) => void;
};

export function EvidenceTimeline({
  bundle,
  activeFrameId,
  activeEvidenceId,
  onSelectEvidence,
}: Props) {
  const frames = bundle.frames;

  return (
    <div
      data-testid="evidence-timeline"
      className="rounded-[8px] border bg-[var(--surface)] p-3.5 shadow-sm"
      style={{ borderColor: "var(--border-muted)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3
            className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]"
            style={{ letterSpacing: "-0.012em" }}
          >
            Evidence Timeline
          </h3>
          <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
            · 4 grounded lanes
          </span>
        </div>
        <span
          className="rounded-[4px] bg-[var(--surface-elevated)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--text-secondary)] border border-[var(--border-muted)]"
        >
          {bundle.observations.length} obs · {bundle.hypotheses.length} hyp · {bundle.ambiguities.length} amb
        </span>
      </div>

      {/* Frame Timestamp Ticks Header */}
      <div className="mb-2.5 flex items-center">
        <div className="w-24 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Timestamp
        </div>
        <div className="flex flex-1 justify-between px-3">
          {frames.map((f) => (
            <span
              key={f.frameId}
              data-testid={`timeline-tick-${f.frameId}`}
              className={`rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] leading-none transition-colors ${
                f.frameId === activeFrameId
                  ? "bg-[var(--accent)] font-semibold text-white shadow-sm"
                  : "bg-[var(--surface-elevated)] text-[var(--text-tertiary)]"
              }`}
            >
              {f.timestamp}
            </span>
          ))}
        </div>
      </div>

      {/* 4 Multi-lane rows */}
      <div className="relative flex flex-col gap-2.5">
        {[
          { label: "Observed", color: "var(--text-primary)", lane: "observed", borderStyle: "solid" },
          { label: "Expected", color: "var(--accent)", lane: "expected", borderStyle: "solid" },
          { label: "Hypothesis", color: "var(--violet)", lane: "hypothesis", borderStyle: "dashed" },
          { label: "Ambiguity", color: "var(--text-tertiary)", lane: "ambiguity", borderStyle: "dotted" },
        ].map((row) => (
          <div key={row.lane} className="flex items-center gap-3 py-0.5">
            <span
              className="flex w-24 shrink-0 items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: row.color }}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: row.color }}
              />
              {row.label}
            </span>

            {row.lane === "expected" ? (
              <div
                className="flex-1 rounded-[12px] bg-[var(--accent-muted)] px-3 py-1.5 border"
                style={{ borderColor: "var(--accent-muted)" }}
              >
                <p
                  className="truncate text-[12px] leading-tight text-[var(--text-primary)] font-medium"
                  title={bundle.expectedBehaviours[0]?.statement}
                >
                  {bundle.expectedBehaviours[0]?.statement}
                </p>
              </div>
            ) : (
              <div className="flex flex-1 justify-between px-3">
                {frames.map((f) => {
                  const isActive =
                    row.lane === "observed"
                      ? bundle.observations.some(
                          (o) => o.frameId === f.frameId && o.id === activeEvidenceId
                        )
                      : row.lane === "hypothesis"
                        ? f.timestamp === "00:01.8" &&
                          bundle.hypotheses[0]?.id === activeEvidenceId
                        : f.timestamp === frames[frames.length - 1].timestamp &&
                          bundle.ambiguities[0]?.id === activeEvidenceId;

                  const has =
                    row.lane === "observed"
                      ? !!bundle.observations.find((o) => o.frameId === f.frameId)
                      : row.lane === "hypothesis"
                        ? f.timestamp === "00:01.8"
                        : row.lane === "ambiguity"
                          ? f.timestamp === frames[frames.length - 1].timestamp
                          : false;

                  const item =
                    row.lane === "observed"
                      ? bundle.observations.find((o) => o.frameId === f.frameId)
                      : row.lane === "hypothesis"
                        ? bundle.hypotheses[0]
                        : bundle.ambiguities[0];

                  return (
                    <button
                      key={f.frameId}
                      type="button"
                      data-testid={`timeline-${row.lane}-${f.frameId}`}
                      aria-label={`${row.label} at ${f.timestamp}`}
                      onClick={() => item && onSelectEvidence(item.id, f.frameId)}
                      className={`h-3.5 w-3.5 rounded-full border bg-[var(--surface)] transition-all hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                        has ? "cursor-pointer" : "opacity-30 cursor-default"
                      } ${isActive ? "scale-125 ring-2 ring-[var(--accent)] ring-offset-1" : ""}`}
                      style={{
                        borderColor: has ? row.color : "var(--border)",
                        background: has
                          ? row.lane === "observed"
                            ? "var(--text-primary)"
                            : row.lane === "hypothesis"
                              ? "var(--violet)"
                              : "var(--surface-elevated)"
                          : "var(--surface)",
                        borderStyle: row.borderStyle,
                      }}
                      title={
                        has
                          ? String(
                              (item as unknown as { statement: string })?.statement ?? ""
                            ).slice(0, 80)
                          : "—"
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="mt-3 flex items-center justify-between border-t pt-2 font-mono text-[10px] text-[var(--text-tertiary)]"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <span>Solid = Observed · Dashed = Hypothesis · Dotted = Ambiguity</span>
        <span>Click markers to load evidence details</span>
      </div>
    </div>
  );
}
