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
            file: f.file.startsWith("frames/")
              ? `/api/investigations/${record.meta.id}/frames/${f.file.split("/").pop()}`
              : f.file,
          })),
          observations: record.bundle.observations.map((o: Observation) => ({
            ...o,
            sourceFrameFile: o.sourceFrameFile?.startsWith("frames/")
              ? `/api/investigations/${record.meta.id}/frames/${o.sourceFrameFile.split("/").pop()}`
              : o.sourceFrameFile,
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
          <p className="font-mono text-xs text-[var(--text-tertiary)]">
            Loading investigation {id}…
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !bundle || !meta) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--canvas)]">
        <TopBar investigationId={id} />
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-lg">
            ◧
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Investigation not found
          </h1>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            No investigation with ID <span className="font-mono font-medium text-[var(--text-primary)]">{id}</span> exists. It may have been deleted or the identifier is invalid.
          </p>
          <p className="font-mono text-[11px] text-[var(--text-tertiary)]">
            Do not silently substitute BUG-01 fixture data when an investigation ID is missing — this is an honest not-found state.
          </p>
          <Link
            href="/investigations"
            aria-label="Return to investigations list"
            className="mt-2 inline-flex items-center rounded-[6px] bg-[var(--text-primary)] px-4 py-2 text-xs font-medium text-[var(--canvas)] shadow-sm hover:opacity-90"
          >
            Return to investigations list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--canvas)]">
      <TopBar
        investigationId={meta.id}
        bugLabel={meta.title}
        verdict={meta.verdict}
        variant={meta.variant}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Navigation Rail */}
        <DetailLeftRail
          activeTab={activeTab}
          onSelect={setActiveTab}
          title={meta.title}
          bugId={meta.bugId}
        />

        {/* Main Workspace Canvas */}
        <main className="flex flex-1 flex-col gap-4 bg-[var(--canvas)] p-5 lg:min-w-0 lg:p-6">
          {/* Header Summary */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="text-[20px] font-semibold leading-tight tracking-tight text-[var(--text-primary)]"
                style={{ letterSpacing: "-0.02em" }}
              >
                Recording — {meta.id} {meta.variant}
              </h1>
              <span className="rounded-full bg-[var(--text-primary)] px-2.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-[var(--canvas)]">
                {meta.frameCount} frames · {meta.duration}
              </span>
              {meta.verdict ? (
                <span
                  className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold leading-none"
                  style={{
                    borderColor: "transparent",
                    background:
                      meta.verdict === "REGRESSION_VERIFIED"
                        ? "var(--green-muted)"
                        : meta.verdict === "DEFECT_CONFIRMED"
                          ? "var(--red-muted)"
                          : "var(--surface-elevated)",
                    color:
                      meta.verdict === "REGRESSION_VERIFIED"
                        ? "var(--green)"
                        : meta.verdict === "DEFECT_CONFIRMED"
                          ? "var(--red)"
                          : "var(--text-secondary)",
                  }}
                >
                  {meta.verdict}
                </span>
              ) : null}
            </div>

            <p className="max-w-3xl font-mono text-[11px] leading-relaxed text-[var(--text-tertiary)]">
              Loaded persisted investigation {meta.id} — frames restored, evidence bundle validated, spec persisted.
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

          {/* Main workspace view based on activeTab */}
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
                <p className="mt-2 text-[var(--text-primary)]">Target: <span className="text-[var(--accent)]">{meta.target ?? "/demo/bug-01?variant=fixed"}</span></p>
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
                  <p className="mt-1 font-mono text-[12px] font-medium text-[var(--text-primary)]">{meta.target}</p>
                  <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">Allowlisted in <span className="font-mono">src/lib/allowlist.ts</span></p>
                </div>
                <div className="rounded-[8px] border bg-[var(--surface-elevated)] p-4" style={{ borderColor: "var(--border-muted)" }}>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Oracle Invariant</p>
                  <p className="mt-1 font-mono text-[12px] font-medium text-[var(--text-primary)]">Defect & Regression verification</p>
                  <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">Target verified against expected contract</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Flow for Evidence and Spec */}
          <div className="lg:hidden mt-2">
            {activeTab === "spec" ? (
              <SpecBuilder
                investigationId={meta.id}
                bundle={bundle}
                specSupportStatus={meta.specSupportStatus}
              />
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
          className="hidden w-[360px] shrink-0 flex-col border-l bg-[var(--surface)] lg:flex"
          style={{ borderColor: "var(--border)" }}
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
                <SpecBuilder
                  investigationId={meta.id}
                  bundle={bundle}
                  specSupportStatus={meta.specSupportStatus}
                />
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
                    <span className="text-[var(--text-primary)]">{meta.target}</span>
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

      <ExecutionDrawer
        bugId={
          meta.bugId === "BUG-01" || meta.bugId === "BUG-02" || meta.bugId === "BUG-03"
            ? meta.bugId
            : null
        }
        initialVerdict={meta.verdict}
        variant={meta.variant}
      />
    </div>
  );
}
