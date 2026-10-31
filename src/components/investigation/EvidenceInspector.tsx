"use client";
import { useState } from "react";
import type { EvidenceBundle } from "@/lib/evidence";
import { EvidenceBundleSchema, checkNoSilentPromotion } from "@/lib/evidence";
type Props = { bundle: EvidenceBundle; activeEvidenceId: string | null; onSelectFrame: (frameId: string) => void };
function KindChip({ kind }: { kind: string }) {
  if (kind === "observation") return <span className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-[var(--text-secondary)]">OBSERVED</span>;
  if (kind === "hypothesis") return <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-[var(--violet)]" style={{ borderColor: "var(--violet)", background: "var(--violet-muted)", borderStyle: "dashed" }}>HYPOTHESIS</span>;
  if (kind === "expected") return <span className="rounded bg-[var(--amber)] px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-white">EXPECTED</span>;
  return <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-[var(--text-tertiary)]" style={{ borderColor: "var(--border)", background: "var(--surface)", borderStyle: "dotted" }}>AMBIGUITY</span>;
}
export function EvidenceInspector({ bundle, activeEvidenceId, onSelectFrame }: Props) {
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteFrameId, setPromoteFrameId] = useState<string>(bundle.frames[0]?.frameId ?? "");
  const [promoteMsg, setPromoteMsg] = useState<string | null>(null);
  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [resolveFrameId, setResolveFrameId] = useState<string>(bundle.frames[0]?.frameId ?? "");
  const [resolveMsg, setResolveMsg] = useState<string | null>(null);
  const all = [...bundle.expectedBehaviours.map((e) => ({ ...e, _type: "expected" as const })), ...bundle.observations.map((o) => ({ ...o, _type: "observation" as const })), ...bundle.hypotheses.map((h) => ({ ...h, _type: "hypothesis" as const })), ...bundle.ambiguities.map((a) => ({ ...a, _type: "ambiguity" as const }))];
  const active = activeEvidenceId ? all.find((x) => x.id === activeEvidenceId) : null;
  const promoteCandidate = active && active._type === "hypothesis" ? (active as typeof bundle.hypotheses[number]) : null;
  const resolveCandidate = active && active._type === "ambiguity" ? (active as typeof bundle.ambiguities[number]) : null;
  function handlePromoteConfirm() {
    if (!promoteCandidate) return;
    const frame = bundle.frames.find((f) => f.frameId === promoteFrameId);
    if (!frame) { setPromoteMsg("Validation failed: frameId not found in bundle (path traversal rejected)"); return; }
    const newObs = { kind: "observation" as const, id: `obs-promoted-${promoteCandidate.id}`, frameId: frame.frameId, timestamp: frame.timestamp, timestampSeconds: frame.timestampSeconds, statement: promoteCandidate.statement, confidence: promoteCandidate.confidence ?? ("medium" as const), sourceFrameFile: frame.file };
    const testBundle = { ...bundle, observations: [...bundle.observations, newObs] };
    const result = EvidenceBundleSchema.safeParse(testBundle);
    if (!result.success) { setPromoteMsg(`Validation failed: ${result.error.issues.map((i) => i.message).join("; ")}`); return; }
    const silent = checkNoSilentPromotion(result.data);
    if (silent.length === 0) setPromoteMsg(`Validated: would create ${newObs.id} from ${promoteCandidate.id} with frame ${frame.frameId} (${frame.timestamp}). No silent promotion — explicit frame reference provided. (Demo: not persisted)`);
    else setPromoteMsg(`Warning: ${silent.join("; ")}`);
  }
  function handleResolveConfirm() {
    if (!resolveCandidate) return;
    const frame = bundle.frames.find((f) => f.frameId === resolveFrameId);
    if (!frame) { setResolveMsg("Validation failed: frameId not found or traversal rejected"); return; }
    const newObs = { kind: "observation" as const, id: `obs-resolved-${resolveCandidate.id}`, frameId: frame.frameId, timestamp: frame.timestamp, timestampSeconds: frame.timestampSeconds, statement: `Resolved ${resolveCandidate.id}: observed at ${frame.timestamp} — ${resolveCandidate.statement.slice(0, 80)}`, confidence: "high" as const, sourceFrameFile: frame.file };
    const testBundle = { ...bundle, observations: [...bundle.observations, newObs], ambiguities: bundle.ambiguities.filter((a) => a.id !== resolveCandidate.id) };
    const result = EvidenceBundleSchema.safeParse(testBundle);
    if (!result.success) { setResolveMsg(`Validation failed: ${result.error.issues.map((i) => i.message).join("; ")}`); return; }
    setResolveMsg(`Validated: would resolve ${resolveCandidate.id} with ${newObs.id} at ${frame.timestamp}. Ambiguity would be removed after verification. (Demo)`);
  }
  const obsByFrame = new Map<string, typeof bundle.observations>();
  for (const f of bundle.frames) obsByFrame.set(f.frameId, bundle.observations.filter((o) => o.frameId === f.frameId));
  if (active) {
    const typed = active as (typeof all)[number];
    const isObs = typed._type === "observation";
    const obsData = isObs ? (typed as (typeof bundle.observations)[number]) : null;
    return (
      <div className="flex h-full flex-col rounded-[8px] border bg-[var(--surface)]" style={{ borderColor: "var(--border-muted)" }}>
        <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--border-muted)" }}>
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Inspector</h3>
          <span className="font-mono text-[11px] text-[var(--text-tertiary)]">evidenceId: {typed.id}</span>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <div className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: typed._type === "observation" ? "var(--border)" : typed._type === "hypothesis" ? "var(--violet)" : typed._type === "expected" ? "var(--amber)" : "var(--border-muted)", background: typed._type === "expected" ? "var(--amber-muted)" : typed._type === "hypothesis" ? "var(--violet-muted)" : "var(--surface)", borderStyle: typed._type === "hypothesis" ? "dashed" : typed._type === "ambiguity" ? "dotted" : "solid", borderLeftWidth: typed._type === "expected" ? "3px" : "1px" }}>
            <div className="mb-2 flex items-center gap-2">
              <KindChip kind={typed._type} />
              {/* @ts-expect-error confidence may not exist on expected/ambiguity */}
              {typed.confidence ? <span className="font-mono text-[11px] text-[var(--text-tertiary)]">confidence: {typed.confidence}</span> : null}
              {obsData ? <button type="button" data-testid="inspector-frame-link" onClick={() => onSelectFrame(obsData.frameId)} className="ml-auto font-mono text-[11px] text-[var(--accent)] hover:underline">frame {obsData.timestamp} →</button> : null}
            </div>
            <p className="text-[13px] leading-5 text-[var(--text-primary)]" data-testid="inspector-statement">{typed.statement}</p>
            {obsData ? <div className="mt-3 flex flex-col gap-1 border-t pt-2" style={{ borderColor: "var(--border-muted)" }}><span className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Source: {obsData.sourceFrameFile ?? obsData.frameId} • {obsData.timestamp} • {obsData.timestampSeconds}s</span><span className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">frameId: {obsData.frameId}</span></div> : null}
            {typed._type === "hypothesis" ? (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">{typed.inferredFrom?.map((id: string) => <span key={id} className="rounded-full bg-[var(--surface-elevated)] px-2 py-1 font-mono text-[11px] leading-none text-[var(--text-secondary)]">{id}</span>)}</div>
                {!promoteOpen ? (
                  <div className="mt-2 flex gap-2">
                    <button type="button" data-testid="promote-button" className="rounded-[6px] border bg-[var(--surface)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--violet)", color: "var(--violet)" }} onClick={() => { setPromoteOpen(true); setPromoteMsg(null); setPromoteFrameId(bundle.frames[0]?.frameId ?? ""); }}>Promote to Observation</button>
                    <button type="button" className="rounded-[6px] px-3 py-1.5 font-mono text-[11px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]">Delete</button>
                  </div>
                ) : (
                  <div className="mt-2 rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--violet)" }} data-testid="promote-modal">
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--violet)]">Promote requires explicit frame evidence — never silent</p>
                    <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-secondary)]">Select supporting frame for <span className="font-semibold">{promoteCandidate?.id}</span></p>
                    <select data-testid="promote-frame-select" value={promoteFrameId} onChange={(e) => setPromoteFrameId(e.target.value)} className="mt-2 w-full rounded-[6px] border bg-[var(--surface)] px-2 py-1.5 font-mono text-[12px]" style={{ borderColor: "var(--border)" }}>
                      {bundle.frames.map((f) => <option key={f.frameId} value={f.frameId}>{f.timestamp} — {f.frameId} ({f.width}×{f.height})</option>)}
                    </select>
                    <div className="mt-2 flex gap-2">
                      <button type="button" data-testid="promote-confirm" onClick={handlePromoteConfirm} className="rounded-[6px] bg-[var(--accent)] px-3 py-1.5 font-mono text-[11px] font-medium text-white hover:opacity-90">Validate & Promote</button>
                      <button type="button" data-testid="promote-cancel" onClick={() => setPromoteOpen(false)} className="rounded-[6px] border px-3 py-1.5 font-mono text-[11px] text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>Cancel</button>
                    </div>
                    {promoteMsg ? <p data-testid="promote-result" className="mt-2 rounded-[6px] bg-[var(--surface-elevated)] p-2 font-mono text-[11px] leading-4 text-[var(--text-primary)]">{promoteMsg}</p> : null}
                  </div>
                )}
              </div>
            ) : null}
            {typed._type === "ambiguity" ? (
              <div className="mt-3 flex flex-col gap-2">
                {typed.missingInfo ? <p className="font-mono text-[11px] leading-4 text-[var(--text-secondary)]">Missing: {typed.missingInfo}</p> : null}
                {!resolveOpen ? (
                  <button type="button" data-testid="resolve-button" onClick={() => { setResolveOpen(typed.id); setResolveMsg(null); setResolveFrameId(bundle.frames[0]?.frameId ?? ""); }} className="rounded-[6px] bg-[var(--surface-elevated)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">Resolve →</button>
                ) : (
                  <div className="mt-2 rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border)" }} data-testid="resolve-modal">
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Resolve requires supporting frame evidence</p>
                    <select data-testid="resolve-frame-select" value={resolveFrameId} onChange={(e) => setResolveFrameId(e.target.value)} className="mt-2 w-full rounded-[6px] border bg-[var(--surface)] px-2 py-1.5 font-mono text-[12px]" style={{ borderColor: "var(--border)" }}>
                      {bundle.frames.map((f) => <option key={f.frameId} value={f.frameId}>{f.timestamp} — {f.frameId}</option>)}
                    </select>
                    <div className="mt-2 flex gap-2">
                      <button type="button" data-testid="resolve-confirm" onClick={handleResolveConfirm} className="rounded-[6px] bg-[var(--text-primary)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--canvas)] hover:opacity-90">Validate & Resolve</button>
                      <button type="button" onClick={() => setResolveOpen(null)} className="rounded-[6px] border px-3 py-1.5 font-mono text-[11px] text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>Cancel</button>
                    </div>
                    {resolveMsg ? <p data-testid="resolve-result" className="mt-2 rounded-[6px] bg-[var(--surface-elevated)] p-2 font-mono text-[11px] leading-4 text-[var(--text-primary)]">{resolveMsg}</p> : null}
                  </div>
                )}
              </div>
            ) : null}
            {typed._type === "expected" ? <p className="mt-2 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Preserved verbatim from user input</p> : null}
          </div>
          <button type="button" onClick={() => onSelectFrame(bundle.frames[0].frameId)} className="mt-3 font-mono text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">← Back to frame list</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col rounded-[8px] border bg-[var(--surface)]" style={{ borderColor: "var(--border-muted)" }}>
      <div className="border-b px-3 py-2" style={{ borderColor: "var(--border-muted)" }}>
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Evidence</h3>
        <p className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">{bundle.observations.length} observations • {bundle.hypotheses.length} hypotheses • {bundle.ambiguities.length} ambiguities</p>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="mb-4 rounded-[8px] border-l-2 bg-[var(--amber-muted)] p-3" style={{ borderColor: "var(--amber)", borderLeftWidth: "3px" }}>
          <KindChip kind="expected" />
          <p className="mt-2 text-[13px] font-medium leading-5 text-[var(--text-primary)]" data-testid="expected-statement">{bundle.expectedBehaviours[0]?.statement}</p>
          <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Preserved verbatim — editing creates new version</p>
        </div>
        <div className="flex flex-col gap-3">
          {bundle.frames.map((f) => {
            const obs = obsByFrame.get(f.frameId) ?? [];
            if (obs.length === 0) return null;
            return (
              <div key={f.frameId} className="rounded-[8px] border bg-[var(--surface-elevated)] p-2" style={{ borderColor: "var(--border-muted)" }}>
                <button type="button" onClick={() => onSelectFrame(f.frameId)} className="flex w-full items-center justify-between text-left hover:opacity-80">
                  <span className="font-mono text-[11px] font-medium text-[var(--accent)]">⟦{f.timestamp}⟧</span>
                  <span className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">{f.frameId}</span>
                </button>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {obs.map((o) => (
                    <li key={o.id} data-testid={`observation-card-${o.id}`} className="rounded-[6px] border bg-[var(--surface)] p-2 hover:border-[var(--accent)]" style={{ borderColor: "var(--border-muted)" }}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Observed</span>
                        <span className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">{o.confidence ?? "high"}</span>
                        <span className="ml-auto font-mono text-[10px] leading-4 text-[var(--text-tertiary)]">{o.id}</span>
                      </div>
                      <p className="text-[13px] leading-5 text-[var(--text-primary)]">{o.statement.slice(0, 180)}…</p>
                      <button type="button" data-testid={`open-observation-${o.id}`} onClick={() => onSelectFrame(f.frameId)} className="mt-1 font-mono text-[11px] leading-4 text-[var(--accent)] hover:underline">Inspect →</button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <h4 className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--violet)]">Hypotheses — never silently promoted</h4>
          {bundle.hypotheses.map((h) => (
            <div key={h.id} data-testid={`hypothesis-card-${h.id}`} className="rounded-[6px] border bg-[var(--violet-muted)] p-2" style={{ borderColor: "var(--violet)", borderStyle: "dashed" }}>
              <div className="flex items-center gap-2"><KindChip kind="hypothesis" /><span className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">{h.confidence}</span></div>
              <p className="mt-1 text-[13px] leading-5 text-[var(--text-primary)]">{h.statement.slice(0, 160)}…</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <h4 className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Ambiguities</h4>
          {bundle.ambiguities.map((a) => (
            <div key={a.id} data-testid={`ambiguity-card-${a.id}`} className="rounded-[6px] border bg-[var(--surface)] p-2" style={{ borderColor: "var(--border-muted)", borderStyle: "dotted" }}>
              <KindChip kind="ambiguity" />
              <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">{a.statement.slice(0, 160)}…</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
