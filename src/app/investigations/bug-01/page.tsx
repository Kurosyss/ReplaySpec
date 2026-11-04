"use client";

import { useState, useCallback, useMemo } from "react";
import { bug01Investigation } from "@/lib/fixtures/bug01-investigation";
import { TopBar } from "@/components/investigation/TopBar";
import { DetailLeftRail, LeftRailMobile } from "@/components/investigation/LeftRail";
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

  const activeFrame = useMemo(
    () => frames.find((f) => f.frameId === activeFrameId) ?? frames[0],
    [frames, activeFrameId]
  );
  const activeIndex = useMemo(
    () => frames.findIndex((f) => f.frameId === activeFrameId),
    [frames, activeFrameId]
  );

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
      <TopBar
        investigationId="bug-01"
        bugLabel="BUG-01 — Checkout postal-code validation"
        verdict="REGRESSION_VERIFIED"
        variant="fixed"
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Navigation Rail */}
        <DetailLeftRail
          activeTab={activeTab}
          onSelect={setActiveTab}
          title="BUG-01 — Checkout postal-code validation"
          bugId="BUG-01"
        />

        {/* Main Workspace Canvas */}
        <main className="flex flex-1 flex-col gap-3.5 bg-[var(--canvas)] p-4 lg:min-w-0">
          {/* Header Summary */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="text-[20px] font-semibold leading-tight tracking-tight text-[var(--text-primary)]"
                style={{ letterSpacing: "-0.02em" }}
              >
                Recording — bug-01 fixed
              </h1>
              <span className="rounded-full bg-[var(--text-primary)] px-2.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-[var(--canvas)]">
                5.8s · 6 frames
              </span>
              <span
                className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold leading-none"
                style={{
                  borderColor: "transparent",
                  background: "var(--green-muted)",
                  color: "var(--green)",
                }}
              >
                REGRESSION_VERIFIED
              </span>
            </div>

            <p className="max-w-3xl font-mono text-[11px] leading-relaxed text-[var(--text-tertiary)]">
              Genuine empty-postal evidence: <span className="font-medium text-[var(--text-primary)]">00:01.8 error IS visible</span> for fixed, hidden for buggy.
            </p>
          </div>

          {/* Main Tab Bar */}
          <div
            className="flex gap-1 rounded-[6px] border bg-[var(--surface-elevated)] p-1"
            style={{ borderColor: "var(--border-muted)" }}
          >
            {([
              { id: "recording", label: "Recording" },
              { id: "evidence", label: "Evidence" },
              { id: "spec", label: "Specification" },
              { id: "execution", label: "Execution" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`detail-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                style={{
                  border: activeTab === tab.id ? "1px solid var(--border-muted)" : "1px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Workspace Content based on activeTab */}
          {activeTab === "recording" && activeFrame && (
            <>
              <FrameViewer
                frame={activeFrame}
                onPrev={handlePrev}
                onNext={handleNext}
                canPrev={activeIndex > 0}
                canNext={activeIndex < frames.length - 1}
              />

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
                <Filmstrip
                  frames={frames}
                  activeFrameId={activeFrameId}
                  onSelect={handleSelectFrame}
                />
              </div>

              <EvidenceTimeline
                bundle={bundle}
                activeFrameId={activeFrameId}
                activeEvidenceId={activeEvidenceId}
                onSelectEvidence={handleSelectEvidence}
              />
            </>
          )}

          {activeTab === "evidence" && activeFrame && (
            <>
              <FrameViewer
                frame={activeFrame}
                onPrev={handlePrev}
                onNext={handleNext}
                canPrev={activeIndex > 0}
                canNext={activeIndex < frames.length - 1}
              />

              <EvidenceTimeline
                bundle={bundle}
                activeFrameId={activeFrameId}
                activeEvidenceId={activeEvidenceId}
                onSelectEvidence={handleSelectEvidence}
              />
            </>
          )}

          {activeTab === "spec" && (
            <div className="rounded-[10px] border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border-muted)" }}>
              <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-muted)" }}>
                <div>
                  <h2 className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
                    Specification Generator
                  </h2>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    Compiled Playwright assertions derived from validated evidence. Configure assertions using the inspector panel.
                  </p>
                </div>
                {activeFrame ? (
                  <div className="flex items-center gap-2 rounded-full border bg-[var(--surface-elevated)] px-3 py-1 font-mono text-[11px] text-[var(--text-secondary)]" style={{ borderColor: "var(--border-muted)" }}>
                    <span>Target Frame:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{activeFrame.timestamp}</span>
                  </div>
                ) : null}
              </div>
              <div className="rounded-[8px] border bg-[var(--surface-elevated)] p-4 font-mono text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-muted)" }}>
                <p className="text-[var(--text-tertiary)]">{"// Specifications and assertions configured via the Inspector panel (aside) on the right."}</p>
                <p className="mt-2 text-[var(--text-primary)]">Target: <span className="text-[var(--accent)]">/demo/bug-01?variant=fixed</span></p>
                <p className="mt-1">Assertions are compiled into Playwright test specs and persisted to disk atomically.</p>
              </div>
            </div>
          )}

          {activeTab === "execution" && (
            <div className="rounded-[10px] border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border-muted)" }}>
              <h2 className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
                Regression Execution & Target Invariants
              </h2>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                Execute headless Playwright runs against allowlisted endpoints to verify defect reproduction and regression protection.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[8px] border bg-[var(--surface-elevated)] p-4" style={{ borderColor: "var(--border-muted)" }}>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Target Endpoint</p>
                  <p className="mt-1 font-mono text-[12px] font-medium text-[var(--text-primary)]">/demo/bug-01?variant=fixed</p>
                  <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">Allowlisted in <span className="font-mono">src/lib/allowlist.ts</span></p>
                </div>
                <div className="rounded-[8px] border bg-[var(--surface-elevated)] p-4" style={{ borderColor: "var(--border-muted)" }}>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Oracle Invariant</p>
                  <p className="mt-1 font-mono text-[12px] font-medium text-[var(--text-primary)]">postal-error visible</p>
                  <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">Empty postal code must reveal error message</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Flow for Evidence and Spec */}
          <div className="lg:hidden mt-2">
            {activeTab === "spec" ? (
              <SpecBuilder investigationId="bug-01" bundle={bundle} />
            ) : (
              <EvidenceInspector
                bundle={bundle}
                activeEvidenceId={activeEvidenceId}
                onSelectFrame={handleSelectFrame}
                onClearActiveEvidence={() => setActiveEvidenceId(null)}
              />
            )}
          </div>

          <LeftRailMobile activeTab={activeTab} onSelect={setActiveTab} />
        </main>

        {/* Desktop Right Inspector Sidebar */}
        <aside
          className="hidden w-[380px] shrink-0 flex-col border-l bg-[var(--surface)] lg:flex"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center justify-between border-b px-3.5 py-2.5"
              style={{ borderColor: "var(--border-muted)", background: "var(--surface-elevated)" }}
            >
              <h3
                className="text-[12px] font-semibold tracking-tight text-[var(--text-primary)]"
                style={{ letterSpacing: "-0.012em" }}
              >
                {activeTab === "spec"
                  ? "Specification Reference"
                  : activeTab === "execution"
                    ? "Execution History"
                    : "Evidence Inspector"}
              </h3>
              <span
                className="rounded-[4px] bg-[var(--surface)] px-2 py-0.5 font-mono text-[9px] font-medium text-[var(--text-tertiary)] border border-[var(--border-muted)]"
              >
                {activeTab}
              </span>
            </div>

            <div className="flex-1 overflow-auto p-3">
              {activeTab === "spec" ? (
                <SpecBuilder investigationId="bug-01" bundle={bundle} />
              ) : activeTab === "execution" ? (
                <div
                  className="rounded-[6px] border bg-[var(--surface-elevated)] p-3.5"
                  style={{ borderColor: "var(--border-muted)" }}
                >
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                    Execution Status
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    Use the bottom execution drawer to run regression tests against the target application.
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t pt-2 font-mono text-[11px]" style={{ borderColor: "var(--border-muted)" }}>
                    <span className="text-[var(--text-tertiary)]">Target:</span>
                    <span className="text-[var(--text-primary)]">/demo/bug-01</span>
                  </div>
                </div>
              ) : (
                <EvidenceInspector
                  bundle={bundle}
                  activeEvidenceId={activeEvidenceId}
                  onSelectFrame={handleSelectFrame}
                  onClearActiveEvidence={() => setActiveEvidenceId(null)}
                />
              )}
            </div>
          </div>
        </aside>
      </div>

      <ExecutionDrawer initialVerdict="REGRESSION_VERIFIED" variant="fixed" />
    </div>
  );
}
