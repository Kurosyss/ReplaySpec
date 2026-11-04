"use client";

import { useState } from "react";
import type { EvidenceBundle } from "@/lib/evidence";
import { EvidenceBundleSchema, checkNoSilentPromotion } from "@/lib/evidence";

type Props = {
  bundle: EvidenceBundle;
  activeEvidenceId: string | null;
  onSelectFrame: (frameId: string) => void;
  onClearActiveEvidence?: () => void;
};

export function KindChip({ kind }: { kind: string }) {
  if (kind === "observation") {
    return (
      <span
        className="rounded-[3px] bg-[var(--surface-elevated)] px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-[var(--text-primary)] border border-[var(--border-muted)]"
      >
        OBSERVED
      </span>
    );
  }
  if (kind === "hypothesis") {
    return (
      <span
        className="rounded-[3px] border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-[var(--violet)]"
        style={{ borderColor: "var(--violet)", background: "var(--violet-muted)", borderStyle: "dashed" }}
      >
        HYPOTHESIS
      </span>
    );
  }
  if (kind === "expected") {
    return (
      <span
        className="rounded-full border border-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-[var(--accent)]"
      >
        EXPECTED
      </span>
    );
  }
  return (
    <span
      className="rounded-[3px] border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-[var(--text-tertiary)]"
      style={{ borderColor: "var(--border-strong)", background: "var(--surface)", borderStyle: "dotted" }}
    >
      AMBIGUITY
    </span>
  );
}

export function EvidenceInspector({ bundle, activeEvidenceId, onSelectFrame, onClearActiveEvidence }: Props) {
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteFrameId, setPromoteFrameId] = useState<string>(bundle.frames[0]?.frameId ?? "");
  const [promoteMsg, setPromoteMsg] = useState<string | null>(null);

  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [resolveFrameId, setResolveFrameId] = useState<string>(bundle.frames[0]?.frameId ?? "");
  const [resolveMsg, setResolveMsg] = useState<string | null>(null);

  const all = [
    ...bundle.expectedBehaviours.map((e) => ({ ...e, _type: "expected" as const })),
    ...bundle.observations.map((o) => ({ ...o, _type: "observation" as const })),
    ...bundle.hypotheses.map((h) => ({ ...h, _type: "hypothesis" as const })),
    ...bundle.ambiguities.map((a) => ({ ...a, _type: "ambiguity" as const })),
  ];

  const active = activeEvidenceId ? all.find((x) => x.id === activeEvidenceId) : null;
  const promoteCandidate =
    active && active._type === "hypothesis" ? (active as (typeof bundle.hypotheses)[number]) : null;
  const resolveCandidate =
    active && active._type === "ambiguity" ? (active as (typeof bundle.ambiguities)[number]) : null;

  function handlePromoteConfirm() {
    if (!promoteCandidate) return;
    const frame = bundle.frames.find((f) => f.frameId === promoteFrameId);
    if (!frame) {
      setPromoteMsg("Validation failed: frameId not found in bundle (path traversal rejected)");
      return;
    }
    const newObs = {
      kind: "observation" as const,
      id: `obs-promoted-${promoteCandidate.id}`,
      frameId: frame.frameId,
      timestamp: frame.timestamp,
      timestampSeconds: frame.timestampSeconds,
      statement: promoteCandidate.statement,
      confidence: promoteCandidate.confidence ?? ("medium" as const),
      sourceFrameFile: frame.file,
    };
    const testBundle = { ...bundle, observations: [...bundle.observations, newObs] };
    const result = EvidenceBundleSchema.safeParse(testBundle);
    if (!result.success) {
      setPromoteMsg(`Validation failed: ${result.error.issues.map((i) => i.message).join("; ")}`);
      return;
    }
    const silent = checkNoSilentPromotion(result.data);
    if (silent.length === 0) {
      setPromoteMsg(
        `Validated: would create ${newObs.id} from ${promoteCandidate.id} with frame ${frame.frameId} (${frame.timestamp}). No silent promotion — explicit frame reference provided. (Demo: not persisted)`
      );
    } else {
      setPromoteMsg(`Warning: ${silent.join("; ")}`);
    }
  }

  function handleResolveConfirm() {
    if (!resolveCandidate) return;
    const frame = bundle.frames.find((f) => f.frameId === resolveFrameId);
    if (!frame) {
      setResolveMsg("Validation failed: frameId not found or traversal rejected");
      return;
    }
    const newObs = {
      kind: "observation" as const,
      id: `obs-resolved-${resolveCandidate.id}`,
      frameId: frame.frameId,
      timestamp: frame.timestamp,
      timestampSeconds: frame.timestampSeconds,
      statement: `Resolved ${resolveCandidate.id}: observed at ${frame.timestamp} — ${resolveCandidate.statement.slice(0, 80)}`,
      confidence: "high" as const,
      sourceFrameFile: frame.file,
    };
    const testBundle = {
      ...bundle,
      observations: [...bundle.observations, newObs],
      ambiguities: bundle.ambiguities.filter((a) => a.id !== resolveCandidate.id),
    };
    const result = EvidenceBundleSchema.safeParse(testBundle);
    if (!result.success) {
      setResolveMsg(`Validation failed: ${result.error.issues.map((i) => i.message).join("; ")}`);
      return;
    }
    setResolveMsg(
      `Validated: would resolve ${resolveCandidate.id} with ${newObs.id} at ${frame.timestamp}. Ambiguity would be removed after verification. (Demo)`
    );
  }

  const obsByFrame = new Map<string, typeof bundle.observations>();
  for (const f of bundle.frames) {
    obsByFrame.set(
      f.frameId,
      bundle.observations.filter((o) => o.frameId === f.frameId)
    );
  }

  const typedActive = active ? (active as (typeof all)[number]) : null;
  const isObs = typedActive?._type === "observation";
  const obsData = isObs ? (typedActive as (typeof bundle.observations)[number]) : null;

  return (
    <div
      className="flex h-full flex-col rounded-[20px] border bg-[var(--surface)] shadow-2xl shadow-black/20"
      style={{ borderColor: "var(--border-muted)" }}
    >
      {/* Top Header */}
      <div
        className="flex items-center justify-between border-b px-3.5 py-2.5"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Evidence Inspector
          </h3>
          {typedActive ? (
            <span className="font-mono text-[10px] text-[var(--text-secondary)]">
              · {typedActive.id}
            </span>
          ) : null}
        </div>
        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
          {bundle.observations.length} obs · {bundle.hypotheses.length} hyp · {bundle.ambiguities.length} amb
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Active Item Detail Panel if selected */}
        {typedActive ? (
          <div
            className="rounded-[14px] border p-3.5 transition-colors"
            style={{
              borderColor:
                typedActive._type === "observation"
                  ? "var(--border-strong)"
                  : typedActive._type === "hypothesis"
                    ? "var(--violet)"
                    : typedActive._type === "expected"
                      ? "var(--accent)"
                      : "var(--border-muted)",
              background:
                typedActive._type === "expected"
                  ? "var(--accent-muted)"
                  : typedActive._type === "hypothesis"
                    ? "var(--violet-muted)"
                    : typedActive._type === "observation"
                      ? "var(--accent-muted)"
                    : "var(--surface-elevated)",
              borderStyle:
                typedActive._type === "hypothesis"
                  ? "dashed"
                  : typedActive._type === "ambiguity"
                    ? "dotted"
                    : "solid",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <KindChip kind={typedActive._type} />
              {"confidence" in typedActive && typedActive.confidence ? (
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                  confidence: {typedActive.confidence}
                </span>
              ) : null}
              {obsData ? (
                <button
                  type="button"
                  data-testid="inspector-frame-link"
                  onClick={() => onSelectFrame(obsData.frameId)}
                  className="ml-auto font-mono text-[10px] text-[var(--accent)] hover:underline"
                >
                  frame {obsData.timestamp} →
                </button>
              ) : null}
            </div>

            <p
              className={`${isObs ? "font-mono text-[11px] leading-5" : "text-[13px] leading-relaxed"} font-medium text-[var(--text-primary)]`}
              data-testid="inspector-statement"
            >
              {typedActive.statement}
            </p>

            {obsData ? (
              <div
                className="mt-2.5 flex flex-col gap-0.5 border-t pt-2 font-mono text-[10px] text-[var(--text-tertiary)]"
                style={{ borderColor: "var(--border-muted)" }}
              >
                <span>Source: {obsData.sourceFrameFile ?? obsData.frameId} · {obsData.timestamp} ({obsData.timestampSeconds}s)</span>
                <span>Frame identifier: {obsData.frameId}</span>
              </div>
            ) : null}

            {typedActive._type === "hypothesis" ? (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {typedActive.inferredFrom?.map((id: string) => (
                    <span
                      key={id}
                      className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)] border border-[var(--border-muted)]"
                    >
                      Inferred from: {id}
                    </span>
                  ))}
                </div>

                <div className="mt-1 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-testid="promote-button"
                      className="inline-flex items-center rounded-[5px] border bg-[var(--surface)] px-3 py-1 font-mono text-[11px] font-medium transition-colors hover:bg-[var(--surface-hover)]"
                      style={{ borderColor: "var(--violet)", color: "var(--violet)" }}
                      onClick={() => {
                        try {
                          alert("Hypothesis promotion requires explicit supporting frame evidence — never silent.");
                        } catch {}
                        setPromoteOpen(true);
                        setPromoteMsg(null);
                        setPromoteFrameId(bundle.frames[0]?.frameId ?? "");
                      }}
                    >
                      Promote to Observation
                    </button>
                    {onClearActiveEvidence ? (
                      <button
                        type="button"
                        onClick={onClearActiveEvidence}
                        className="rounded-[5px] border border-transparent px-2.5 py-1 font-mono text-[11px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]"
                      >
                        Deselect
                      </button>
                    ) : null}
                  </div>

                  {promoteOpen ? (
                    <div
                      className="mt-1 rounded-[6px] border bg-[var(--surface)] p-3"
                      style={{ borderColor: "var(--violet)" }}
                      data-testid="promote-modal"
                    >
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--violet)]">
                        Promote requires explicit frame evidence — never silent
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-[var(--text-secondary)]">
                        Select supporting frame for <span className="font-semibold text-[var(--text-primary)]">{promoteCandidate?.id}</span>
                      </p>
                      <select
                        data-testid="promote-frame-select"
                        value={promoteFrameId}
                        onChange={(e) => setPromoteFrameId(e.target.value)}
                        className="mt-2 w-full rounded-[5px] border bg-[var(--surface)] px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]"
                        style={{ borderColor: "var(--border-muted)" }}
                      >
                        {bundle.frames.map((f) => (
                          <option key={f.frameId} value={f.frameId}>
                            {f.timestamp} — {f.frameId} ({f.width}×{f.height})
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          data-testid="promote-confirm"
                          onClick={handlePromoteConfirm}
                          className="rounded-[5px] bg-[var(--accent)] px-3 py-1 font-mono text-[11px] font-medium text-white hover:opacity-90"
                        >
                          Validate & Promote
                        </button>
                        <button
                          type="button"
                          data-testid="promote-cancel"
                          onClick={() => setPromoteOpen(false)}
                          className="rounded-[5px] border px-3 py-1 font-mono text-[11px] text-[var(--text-secondary)]"
                          style={{ borderColor: "var(--border-muted)" }}
                        >
                          Cancel
                        </button>
                      </div>
                      {promoteMsg ? (
                        <p
                          data-testid="promote-result"
                          className="mt-2 rounded-[5px] bg-[var(--surface-elevated)] p-2 font-mono text-[10px] leading-relaxed text-[var(--text-primary)] border border-[var(--border-muted)]"
                        >
                          {promoteMsg}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {typedActive._type === "ambiguity" ? (
              <div className="mt-3 flex flex-col gap-2">
                {typedActive.missingInfo ? (
                  <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                    Missing: {typedActive.missingInfo}
                  </p>
                ) : null}
                {!resolveOpen ? (
                  <button
                    type="button"
                    data-testid="resolve-button"
                    onClick={() => {
                      setResolveOpen(typedActive.id);
                      setResolveMsg(null);
                      setResolveFrameId(bundle.frames[0]?.frameId ?? "");
                    }}
                    className="self-start rounded-[5px] bg-[var(--surface)] border border-[var(--border-muted)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  >
                    Resolve →
                  </button>
                ) : (
                  <div
                    className="mt-2 rounded-[6px] border bg-[var(--surface)] p-3"
                    style={{ borderColor: "var(--border-muted)" }}
                    data-testid="resolve-modal"
                  >
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Resolve requires supporting frame evidence
                    </p>
                    <select
                      data-testid="resolve-frame-select"
                      value={resolveFrameId}
                      onChange={(e) => setResolveFrameId(e.target.value)}
                      className="mt-2 w-full rounded-[5px] border bg-[var(--surface)] px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]"
                      style={{ borderColor: "var(--border-muted)" }}
                    >
                      {bundle.frames.map((f) => (
                        <option key={f.frameId} value={f.frameId}>
                          {f.timestamp} — {f.frameId}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        data-testid="resolve-confirm"
                        onClick={handleResolveConfirm}
                        className="rounded-[5px] bg-[var(--text-primary)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--canvas)] hover:opacity-90"
                      >
                        Validate & Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolveOpen(null)}
                        className="rounded-[5px] border px-3 py-1 font-mono text-[11px] text-[var(--text-secondary)]"
                        style={{ borderColor: "var(--border-muted)" }}
                      >
                        Cancel
                      </button>
                    </div>
                    {resolveMsg ? (
                      <p
                        data-testid="resolve-result"
                        className="mt-2 rounded-[5px] bg-[var(--surface-elevated)] p-2 font-mono text-[10px] text-[var(--text-primary)] border border-[var(--border-muted)]"
                      >
                        {resolveMsg}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

            {typedActive._type === "expected" ? (
              <p className="mt-2 font-mono text-[10px] text-[var(--text-tertiary)]">
                Preserved verbatim from user input · Ground-truth specification contract
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Expected Behavior block */}
        <div
          className="rounded-[14px] border-l-2 bg-[var(--surface-elevated)] p-3.5"
          style={{ borderColor: "var(--accent)", borderLeftWidth: "2px" }}
        >
          <div className="flex items-center justify-between">
            <KindChip kind="expected" />
            <span className="font-mono text-[10px] text-[var(--text-tertiary)]">ground truth</span>
          </div>
          <p
            className="mt-2 text-[13px] font-medium leading-relaxed text-[var(--text-primary)]"
            data-testid="expected-statement"
          >
            {bundle.expectedBehaviours[0]?.statement}
          </p>
          <p className="mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
            Preserved verbatim — modifications create versioned branch
          </p>
        </div>

        {/* Observations Grouped by Frame */}
        <div className="flex flex-col gap-2.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Observations (Frame Grounded)
          </p>
          {bundle.frames.map((f) => {
            const obs = obsByFrame.get(f.frameId) ?? [];
            if (obs.length === 0) return null;
            const hasActiveObservation = obs.some((item) => item.id === activeEvidenceId);
            return (
              <div
                key={f.frameId}
                className="rounded-[12px] border bg-[var(--surface-elevated)] p-3 transition-colors"
                style={{ borderColor: hasActiveObservation ? "var(--accent)" : "var(--border-muted)" }}
              >
                <button
                  type="button"
                  onClick={() => onSelectFrame(f.frameId)}
                  className="flex w-full items-center justify-between text-left transition-opacity hover:opacity-80"
                >
                  <span className={`font-mono text-[11px] font-semibold ${hasActiveObservation ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}>
                    ⟦{f.timestamp}⟧
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                    {f.frameId}
                  </span>
                </button>

                <ul className="mt-2 flex flex-col gap-1.5">
                  {obs.map((o) => (
                    <li
                      key={o.id}
                      data-testid={`observation-card-${o.id}`}
                      aria-current={o.id === activeEvidenceId ? "true" : undefined}
                      className={`rounded-[10px] border p-2.5 transition-colors ${o.id === activeEvidenceId ? "bg-[var(--accent-muted)]" : "bg-[var(--surface)] hover:bg-[var(--surface-hover)]"}`}
                      style={{ borderColor: o.id === activeEvidenceId ? "var(--accent)" : "var(--border-muted)" }}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-[var(--surface-elevated)] px-1 py-0.2 font-mono text-[9px] font-medium uppercase tracking-wider text-[var(--text-secondary)] border border-[var(--border-muted)]">
                          Observed
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                          {o.confidence ?? "high"}
                        </span>
                        <span className="ml-auto font-mono text-[9px] text-[var(--text-tertiary)]">
                          {o.id}
                        </span>
                      </div>
                      <p className={`font-mono text-[11px] leading-5 ${o.id === activeEvidenceId ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                        {o.statement}
                      </p>
                      <button
                        type="button"
                        data-testid={`open-observation-${o.id}`}
                        onClick={() => onSelectFrame(f.frameId)}
                        className="mt-1.5 font-mono text-[10px] text-[var(--accent)] hover:underline inline-block"
                      >
                        Inspect frame {o.timestamp} →
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Hypotheses Section */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--violet)]">
            Hypotheses — never silently promoted
          </p>
          {bundle.hypotheses.map((h) => (
            <div
              key={h.id}
              data-testid={`hypothesis-card-${h.id}`}
              className="rounded-[6px] border bg-[var(--violet-muted)] p-2.5"
              style={{ borderColor: "var(--violet)", borderStyle: "dashed" }}
            >
              <div className="flex items-center justify-between">
                <KindChip kind="hypothesis" />
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{h.confidence}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-[var(--text-primary)] font-medium">
                {h.statement}
              </p>
            </div>
          ))}
        </div>

        {/* Ambiguities Section */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Ambiguities & Uncertainties
          </p>
          {bundle.ambiguities.map((a) => (
            <div
              key={a.id}
              data-testid={`ambiguity-card-${a.id}`}
              className="rounded-[6px] border bg-[var(--surface)] p-2.5"
              style={{ borderColor: "var(--border-muted)", borderStyle: "dotted" }}
            >
              <div className="flex items-center justify-between">
                <KindChip kind="ambiguity" />
                <span className="font-mono text-[9px] text-[var(--text-tertiary)]">{a.id}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-[var(--text-secondary)]">
                {a.statement}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
