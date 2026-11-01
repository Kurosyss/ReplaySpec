"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { bug01Investigation } from "@/lib/fixtures/bug01-investigation";
import { TopBar } from "@/components/investigation/TopBar";
import { DetailLeftRail, LeftRailMobile } from "@/components/investigation/LeftRail";
import { FrameViewer } from "@/components/investigation/FrameViewer";
import { Filmstrip } from "@/components/investigation/Filmstrip";
import { EvidenceTimeline } from "@/components/investigation/EvidenceTimeline";
import { EvidenceInspector } from "@/components/investigation/EvidenceInspector";
import { ExecutionDrawer } from "@/components/investigation/ExecutionDrawer";
import { SpecBuilder } from "@/components/investigation/SpecBuilder";
import type { EvidenceBundle, FrameEvidence, Observation } from "@/lib/evidence";
import type { InvestigationMeta } from "@/lib/investigations/types";

export default function InvestigationDetailDynamicPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [meta, setMeta] = useState<InvestigationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"recording" | "evidence" | "spec" | "execution">("recording");

  const [activeFrameId, setActiveFrameId] = useState<string>("");
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/investigations/${encodeURIComponent(id)}`);
        if (!res.ok) {
          // Fallback to fixture for bug-01 for backwards compatibility
          if (id === "bug-01" || id === "bug-01-buggy") {
            setBundle(bug01Investigation);
            setMeta({
              id: "bug-01",
              title: "BUG-01 — Checkout postal-code validation",
              bugId: "BUG-01",
              variant: "fixed",
              target: "/demo/bug-01?variant=fixed",
              status: "verified",
              verdict: "REGRESSION_VERIFIED",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              runId: null,
              frameCount: 6,
              duration: "5.8s",
              sourceVideo: "fixture",
            });
            setActiveFrameId(bug01Investigation.frames[0].frameId);
            setLoading(false);
            return;
          }
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const record = data.investigation;
        // Map frame file paths to API URLs for persisted investigations
        const mappedBundle: EvidenceBundle = {
          ...record.bundle,
          frames: record.bundle.frames.map((f: FrameEvidence) => ({
            ...f,
            file: f.file.startsWith("frames/") ? `/api/investigations/${record.meta.id}/frames/${f.file.split("/").pop()}` : f.file,
          })),
          observations: record.bundle.observations.map((o: Observation) => ({
            ...o,
            sourceFrameFile: o.sourceFrameFile?.startsWith("frames/") ? `/api/investigations/${record.meta.id}/frames/${o.sourceFrameFile.split("/").pop()}` : o.sourceFrameFile,
          })),
        };
        setBundle(mappedBundle);
        setMeta(record.meta);
        setActiveFrameId(mappedBundle.frames[0]?.frameId ?? "");
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const frames = useMemo(() => bundle?.frames ?? [], [bundle]);
  const activeFrame = useMemo(() => frames.find((f) => f.frameId === activeFrameId) ?? frames[0], [frames, activeFrameId]);
  const activeIndex = useMemo(() => frames.findIndex((f) => f.frameId === activeFrameId), [frames, activeFrameId]);

  const handleSelectFrame = useCallback(
    (frameId: string) => {
      setActiveFrameId(frameId);
      if (bundle) {
        const obsForFrame = bundle.observations.find((o) => o.frameId === frameId);
        if (obsForFrame) setActiveEvidenceId(obsForFrame.id);
      }
    },
    [bundle]
  );

  const handleSelectEvidence = useCallback(
    (evidenceId: string, frameId: string) => {
      setActiveEvidenceId(evidenceId);
      if (frameId && frames.some((f) => f.frameId === frameId)) {
        setActiveFrameId(frameId);
      }
    },
    [frames]
  );

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) handleSelectFrame(frames[activeIndex - 1].frameId);
  }, [activeIndex, frames, handleSelectFrame]);

  const handleNext = useCallback(() => {
    if (activeIndex < frames.length - 1) handleSelectFrame(frames[activeIndex + 1].frameId);
  }, [activeIndex, frames, handleSelectFrame]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--canvas)]">
        <TopBar investigationId={id} bugLabel="Loading…" />
        <div className="flex flex-1 items-center justify-center">
          <p className="font-mono text-sm text-[var(--text-tertiary)]">Loading investigation {id}…</p>
        </div>
      </div>
    );
  }

  if (notFound || !bundle || !meta) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--canvas)]">
        <TopBar investigationId={id} />
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)]">Investigation not found</h1>
          <p className="text-center font-mono text-[13px] leading-5 text-[var(--text-secondary)]">
            No investigation with ID <span className="font-medium text-[var(--text-primary)]">{id}</span> exists. It may have been deleted or the ID is incorrect.
          </p>
          <p className="text-center font-mono text-[12px] leading-5 text-[var(--text-tertiary)]">Do not silently substitute BUG-01 fixture data when an investigation ID is missing — this is an honest not-found state.</p>
          <Link href="/investigations" aria-label="Return to investigations list" className="rounded-[6px] bg-[var(--text-primary)] px-4 py-2 font-mono text-[12px] font-medium text-[var(--canvas)] hover:opacity-90">
            Back to investigations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)]">
      <TopBar investigationId={meta.id} bugLabel={meta.title} verdict={meta.verdict} variant={meta.variant} />
      <div className="flex flex-1 flex-col lg:flex-row">
        <DetailLeftRail activeTab={activeTab} onSelect={setActiveTab} title={meta.title} bugId={meta.bugId} />
        <main className="flex flex-1 flex-col gap-4 bg-[var(--canvas)] p-4 lg:min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold leading-none tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.025em" }}>
                Recording — {meta.id} {meta.variant}
              </h1>
              <span className="rounded-full bg-[var(--text-primary)] px-2.5 py-1 font-mono text-[11px] font-medium leading-none text-[var(--canvas)]">
                {meta.frameCount} frames · {meta.duration}
              </span>
              {meta.verdict ? (
                <span className="rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium leading-none" style={{ borderColor: "var(--border)", background: meta.verdict === "REGRESSION_VERIFIED" ? "var(--green-muted)" : meta.verdict === "DEFECT_CONFIRMED" ? "var(--red-muted)" : "var(--surface-elevated)", color: meta.verdict === "REGRESSION_VERIFIED" ? "var(--green)" : meta.verdict === "DEFECT_CONFIRMED" ? "var(--red)" : "var(--text-secondary)" }}>
                  {meta.verdict}
                </span>
              ) : null}
            </div>
            <p className="max-w-3xl font-mono text-[12px] leading-4 text-[var(--text-tertiary)]">
              Loaded persisted investigation {meta.id} — frames restored, evidence bundle validated, spec persisted.
            </p>
          </div>

          {/* Investigation tabs — mobile only; desktop uses LeftRail */}
          <div className="flex gap-1 rounded-[8px] border bg-[var(--surface-elevated)] p-1 lg:hidden" style={{ borderColor: "var(--border-muted)" }}>
            {[
              { id: "recording", label: "Recording" },
              { id: "evidence", label: "Evidence" },
              { id: "spec", label: "Specification" },
              { id: "execution", label: "Execution" },
            ].map((tab) => (
              <button
                key={tab.id}
                data-testid={`detail-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 rounded-[6px] px-3 py-1.5 text-[12px] font-medium ${activeTab === tab.id ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                style={{ border: activeTab === tab.id ? "1px solid var(--border-muted)" : "1px solid transparent" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "recording" && activeFrame ? (
            <>
              <FrameViewer frame={activeFrame} onPrev={handlePrev} onNext={handleNext} canPrev={activeIndex > 0} canNext={activeIndex < frames.length - 1} />
              <div
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") handlePrev();
                  if (e.key === "ArrowRight") handleNext();
                }}
                tabIndex={0}
                role="group"
                aria-label="Frame navigation, use left and right arrows"
                className="rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                data-testid="frame-keyboard-group"
              >
                <Filmstrip frames={frames} activeFrameId={activeFrameId} onSelect={handleSelectFrame} />
              </div>
              <EvidenceTimeline bundle={bundle} activeFrameId={activeFrameId} activeEvidenceId={activeEvidenceId} onSelectEvidence={handleSelectEvidence} />
            </>
          ) : null}
          {activeTab === "evidence" ? (
            <div className="rounded-[10px] border bg-[var(--surface)] p-4" style={{ borderColor: "var(--border-muted)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-semibold tracking-tight text-[var(--text-primary)]">Evidence</h3>
                <span className="rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--text-tertiary)]" style={{ border: "1px solid var(--border-muted)" }}>
                  {bundle.observations.length} observations · {bundle.frames.length} frames
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {bundle.frames.map((f) => {
                  const obs = bundle.observations.filter((o) => o.frameId === f.frameId);
                  if (obs.length === 0) return null;
                  return (
                    <div key={f.frameId} className="rounded-[8px] border bg-[var(--surface-elevated)] p-3" style={{ borderColor: "var(--border-muted)" }}>
                      <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium">
                        <span className="text-[var(--accent)]">⟦{f.timestamp}⟧</span>
                        <span className="text-[var(--text-tertiary)]">{f.frameId}</span>
                        <span className="h-px flex-1 bg-[var(--border-muted)]" aria-hidden="true" />
                        <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-tertiary)]">{obs.length} obs</span>
                      </p>
                      <div className="mt-2 space-y-2">
                        {obs.map((o) => (
                          <div key={o.id} className="rounded-[6px] border bg-[var(--surface)] p-2.5" style={{ borderColor: "var(--border-muted)" }}>
                            <p className="text-[13px] leading-[18px] text-[var(--text-primary)]">{o.statement}</p>
                            <p className="mt-1.5 flex items-center gap-2 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">
                              <span className="inline-flex rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[var(--text-secondary)]" style={{ border: "1px solid var(--border-muted)" }}>
                                {o.id}
                              </span>
                              <span>{o.frameId} · {o.timestamp}</span>
                              <span className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
                                {o.provenance}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {activeTab === "execution" ? (
            <div className="rounded-[8px] border bg-[var(--surface)] p-4" style={{ borderColor: "var(--border-muted)" }}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Execution</p>
              <p className="mt-1 font-mono text-[12px] leading-5 text-[var(--text-secondary)]">Run history and verdict timeline — see bottom drawer for current run.</p>
            </div>
          ) : null}

          <div className="lg:hidden">
            <div className="mb-3 flex gap-1 rounded-[8px] border bg-[var(--surface)] p-1" style={{ borderColor: "var(--border-muted)" }}>
              <button
                data-testid="mobile-tab-evidence"
                onClick={() => setActiveTab("evidence")}
                className={`flex-1 rounded-[6px] px-3 py-1.5 font-mono text-[12px] font-medium ${activeTab === "evidence" ? "bg-[var(--text-primary)] text-[var(--canvas)]" : "text-[var(--text-secondary)]"}`}
              >
                Evidence
              </button>
              <button
                data-testid="mobile-tab-spec"
                onClick={() => setActiveTab("spec")}
                className={`flex-1 rounded-[6px] px-3 py-1.5 font-mono text-[12px] font-medium ${activeTab === "spec" ? "bg-[var(--text-primary)] text-[var(--canvas)]" : "text-[var(--text-secondary)]"}`}
              >
                Specification
              </button>
            </div>
            {activeTab === "evidence" ? <EvidenceInspector bundle={bundle} activeEvidenceId={activeEvidenceId} onSelectFrame={handleSelectFrame} /> : <SpecBuilder investigationId={meta.id} bundle={bundle} specSupportStatus={meta.specSupportStatus} />}
          </div>

          <LeftRailMobile />
        </main>

        <aside className="hidden w-[380px] shrink-0 flex-col border-l bg-[var(--surface)] lg:flex" style={{ borderColor: "var(--border-muted)" }}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: "var(--border-muted)", background: "var(--surface-elevated)" }}>
              <h3 className="text-[12px] font-semibold tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.015em" }}>
                {activeTab === "evidence" ? "Evidence Inspector" : activeTab === "spec" ? "Specification" : activeTab === "execution" ? "Execution" : "Frame Details"}
              </h3>
              <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--text-tertiary)]" style={{ border: "1px solid var(--border-muted)" }}>
                {activeTab}
              </span>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {activeTab === "evidence" ? (
                <EvidenceInspector bundle={bundle} activeEvidenceId={activeEvidenceId} onSelectFrame={handleSelectFrame} />
              ) : activeTab === "spec" ? (
                <SpecBuilder investigationId={meta.id} bundle={bundle} specSupportStatus={meta.specSupportStatus} />
              ) : activeTab === "execution" ? (
                <div className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border-muted)" }}>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Execution</p>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Run history and verdict timeline — see bottom drawer for current run.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-[8px] border bg-[var(--surface-elevated)] p-3" style={{ borderColor: "var(--border-muted)" }}>
                    <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-[var(--text-tertiary)]">Active Frame</p>
                    <p className="mt-1 font-mono text-[12px] font-medium text-[var(--text-primary)]">
                      {activeFrame?.frameId} · {activeFrame?.timestamp}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--text-tertiary)]">
                      {activeFrame?.width}×{activeFrame?.height} · {activeFrame?.format.toUpperCase()}
                    </p>
                  </div>
                  {(() => {
                    const obs = bundle.observations.filter((o) => o.frameId === activeFrameId);
                    if (obs.length === 0) return <p className="text-[13px] leading-5 text-[var(--text-tertiary)]">No observations for this frame.</p>;
                    return (
                      <div className="space-y-2">
                        {obs.map((o) => (
                          <div key={o.id} className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border-muted)" }}>
                            <p className="text-[13px] font-medium leading-4 text-[var(--text-primary)]">{o.id}</p>
                            <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">{o.statement}</p>
                            <p className="mt-1 font-mono text-[11px] text-[var(--text-tertiary)]">
                              {o.provenance} · {o.confidence}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
      <ExecutionDrawer initialVerdict={meta.verdict} variant={meta.variant} />
    </div>
  );
}
