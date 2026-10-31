"use client";

import { useState, useCallback } from "react";
import { bug01Investigation } from "@/lib/fixtures/bug01-investigation";
import { TopBar } from "@/components/investigation/TopBar";
import { LeftRail, LeftRailMobile } from "@/components/investigation/LeftRail";
import { FrameViewer } from "@/components/investigation/FrameViewer";
import { Filmstrip } from "@/components/investigation/Filmstrip";
import { EvidenceTimeline } from "@/components/investigation/EvidenceTimeline";
import { EvidenceInspector } from "@/components/investigation/EvidenceInspector";
import { ExecutionDrawer } from "@/components/investigation/ExecutionDrawer";
import { SpecBuilder } from "@/components/investigation/SpecBuilder";
import type { EvidenceBundle } from "@/lib/evidence";

export default function InvestigationDetailPage() {
  const bundle: EvidenceBundle = bug01Investigation;
  const frames = bundle.frames;

  const [activeTab, setActiveTab] = useState<"recording" | "evidence" | "spec" | "execution">("recording");
  const [activeFrameId, setActiveFrameId] = useState<string>(frames[0].frameId);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);

  const activeFrame = frames.find((f) => f.frameId === activeFrameId) ?? frames[0];
  const activeIndex = frames.findIndex((f) => f.frameId === activeFrameId);

  const handleSelectFrame = useCallback(
    (frameId: string) => {
      setActiveFrameId(frameId);
      const obsForFrame = bundle.observations.find((o) => o.frameId === frameId);
      if (obsForFrame) setActiveEvidenceId(obsForFrame.id);
    },
    [bundle.observations]
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

  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)]">
      <TopBar investigationId="bug-01" bugLabel="BUG-01 — Checkout postal-code validation" verdict="REGRESSION_VERIFIED" variant="fixed" />
      <div className="flex flex-1 flex-col lg:flex-row">
        <LeftRail />
        <main className="flex flex-1 flex-col gap-4 bg-[var(--canvas)] p-4 lg:min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold leading-none tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.025em" }}>
                Recording — bug-01 fixed
              </h1>
              <span className="rounded-full bg-[var(--text-primary)] px-2.5 py-1 font-mono text-[11px] font-medium leading-none text-[var(--canvas)]">5.8s · 6 frames</span>
              <span className="rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium leading-none" style={{ borderColor: "var(--border)", background: "var(--green-muted)", color: "var(--green)" }}>
                REGRESSION_VERIFIED
              </span>
            </div>
            <p className="max-w-3xl font-mono text-[12px] leading-4 text-[var(--text-tertiary)]">
              Genuine empty-postal evidence: <span className="font-medium text-[var(--text-primary)]">00:01.8 error IS visible</span> for fixed, hidden for buggy.
            </p>
          </div>

          <div className="flex gap-1 rounded-[8px] border bg-[var(--surface-elevated)] p-1" style={{ borderColor: "var(--border-muted)" }}>
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
                className={`flex-1 rounded-[6px] px-3 py-1.5 font-mono text-[12px] font-medium ${activeTab === tab.id ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"}`}
                style={{ border: activeTab === tab.id ? "1px solid var(--border-muted)" : "1px solid transparent" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "recording" ? (
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
            <div className="rounded-[8px] border bg-[var(--surface)] p-4" style={{ borderColor: "var(--border-muted)" }}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Evidence — Observations grouped by frame</p>
              <div className="mt-3 flex flex-col gap-2">
                {bundle.frames.map((f) => {
                  const obs = bundle.observations.filter((o) => o.frameId === f.frameId);
                  if (obs.length === 0) return null;
                  return (
                    <div key={f.frameId} className="rounded-[8px] border bg-[var(--surface-elevated)] p-2" style={{ borderColor: "var(--border-muted)" }}>
                      <p className="font-mono text-[11px] font-medium text-[var(--accent)]">⟦{f.timestamp}⟧ {f.frameId}</p>
                      {obs.map((o) => (
                        <div key={o.id} className="mt-1 rounded-[6px] border bg-[var(--surface)] p-2" style={{ borderColor: "var(--border-muted)" }}>
                          <p className="font-mono text-[11px] font-medium text-[var(--text-primary)]">{o.id} — {o.statement.slice(0, 80)}…</p>
                          <p className="font-mono text-[11px] text-[var(--text-tertiary)]">frame: {o.frameId} • {o.timestamp}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {activeTab === "spec" ? <SpecBuilder investigationId="bug-01" bundle={bundle} /> : null}
          {activeTab === "execution" ? (
            <div className="rounded-[8px] border bg-[var(--surface)] p-4" style={{ borderColor: "var(--border-muted)" }}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Execution</p>
              <p className="mt-1 font-mono text-[12px] leading-5 text-[var(--text-secondary)]">Run history and verdict timeline — see bottom drawer for current run.</p>
            </div>
          ) : null}

          <div className="lg:hidden">
            {activeTab === "spec" ? <SpecBuilder investigationId="bug-01" bundle={bundle} /> : <EvidenceInspector bundle={bundle} activeEvidenceId={activeEvidenceId} onSelectFrame={handleSelectFrame} />}
          </div>
          <LeftRailMobile />
        </main>
        <aside className="hidden w-[380px] shrink-0 flex-col border-l bg-[var(--surface)] lg:flex" style={{ borderColor: "var(--border-muted)" }}>
          <div className="flex h-full flex-col">
            <div className="flex gap-1 border-b bg-[var(--surface-elevated)] p-1" style={{ borderColor: "var(--border-muted)" }}>
              <button
                data-testid="inspector-tab-evidence"
                onClick={() => setActiveTab("evidence")}
                className={`flex-1 rounded-[6px] px-3 py-1.5 font-mono text-[11px] font-medium ${activeTab === "evidence" ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"}`}
                style={{ border: activeTab === "evidence" ? "1px solid var(--border-muted)" : "1px solid transparent" }}
              >
                Evidence
              </button>
              <button
                data-testid="inspector-tab-spec"
                onClick={() => setActiveTab("spec")}
                className={`flex-1 rounded-[6px] px-3 py-1.5 font-mono text-[11px] font-medium ${activeTab === "spec" ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"}`}
                style={{ border: activeTab === "spec" ? "1px solid var(--border-muted)" : "1px solid transparent" }}
              >
                Specification
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {activeTab === "spec" ? <SpecBuilder investigationId="bug-01" bundle={bundle} /> : <EvidenceInspector bundle={bundle} activeEvidenceId={activeEvidenceId} onSelectFrame={handleSelectFrame} />}
            </div>
          </div>
        </aside>
      </div>
      <ExecutionDrawer initialVerdict="REGRESSION_VERIFIED" variant="fixed" />
    </div>
  );
}
