"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function NewInvestigationPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [expectedBehaviour, setExpectedBehaviour] = useState("");
  const [context, setContext] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedRecordingId, setSavedRecordingId] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<{
    provider: string | null;
    modelId?: string;
    configured: boolean;
    liveAnalysisEnabled: boolean;
    message: string;
    usageNote?: string;
    pricingUrl?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/model/status", { cache: "no-store" })
      .then((response) => response.json())
      .then(setModelStatus)
      .catch(() => setModelStatus({ provider: null, configured: false, liveAnalysisEnabled: false, message: "Model connection status could not be loaded." }));
  }, []);

  const handleFile = useCallback((f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "mp4" && ext !== "webm") {
      setError("Unsupported file format. Only MP4 and WebM recording containers are accepted.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError(`Recording exceeds maximum payload size: ${(f.size / 1024 / 1024).toFixed(1)}MB > 50MB`);
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select or drop a valid recording file");
      return;
    }
    if (!title.trim()) {
      setError("Investigation title is required");
      return;
    }
    if (!expectedBehaviour.trim()) {
      setError("Expected behaviour contract is required");
      return;
    }

    setUploading(true);
    setProgress(15);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("expectedBehaviour", expectedBehaviour.trim());
      if (context.trim()) formData.append("context", context.trim());

      setProgress(35);
      const uploadRes = await fetch("/api/recordings", {
        method: "POST",
        body: formData,
      });

      setProgress(60);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Recording upload failed");
        setUploading(false);
        setProgress(0);
        return;
      }

      const recordingId = uploadData.id as string;
      setSavedRecordingId(recordingId);
      setProgress(75);

      const analyzeRes = await fetch(`/api/recordings/${recordingId}/analyze`, {
        method: "POST",
      });
      setProgress(90);
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) {
        setError(analyzeData.error ?? "Multimodal evidence analysis failed");
        setUploading(false);
        setProgress(0);
        return;
      }

      setProgress(100);
      router.push(`/investigations/${analyzeData.investigationId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Pipeline exception: ${msg}`);
      setUploading(false);
      setProgress(0);
    }
  };

  const retryAnalysis = async () => {
    if (!savedRecordingId) return;
    setUploading(true);
    setProgress(20);
    setError(null);
    try {
      const response = await fetch(`/api/recordings/${savedRecordingId}/analyze`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Model analysis could not be completed.");
      setProgress(100);
      router.push(`/investigations/${data.investigationId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)]">
      {/* Top Bar Navigation */}
      <header
        className="sticky top-0 z-10 border-b bg-[var(--surface)]/95 backdrop-blur-md px-6 py-3.5"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/investigations"
              className="font-mono text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Investigations</span>
            </Link>
            <span className="text-[var(--border)]">/</span>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              New Intake
            </span>
          </div>

          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showTimestamp={false} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Two-Column Editorial Layout */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          {/* Left Column: Intake Form */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                INTAKE & EVIDENCE PIPELINE
              </p>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]"
                style={{ letterSpacing: "-0.03em" }}
              >
                New Investigation Intake
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                Provide a browser recording and define the expected behaviour contract. ReplaySpec will
                extract keyframe evidence, ground observations, and synthesize verifiable Playwright test
                specifications.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="surface-geodesic-primary p-6 sm:p-7 flex flex-col gap-5"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Recording Media Dropzone */}
              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  Recording Media <span className="text-[var(--accent)]">*</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4.5 transition-colors ${
                    dragOver
                      ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                      : "border-[var(--border)] bg-[var(--surface-elevated)]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-[var(--surface)] text-[16px] text-[var(--text-secondary)] shadow-xs"
                      style={{ borderColor: "var(--border-muted)" }}
                    >
                      🎥
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {file ? file.name : "Drag & drop recording (MP4 or WebM)"}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-[var(--text-tertiary)] truncate">
                        {file
                          ? `${(file.size / 1024 / 1024).toFixed(1)} MB • ${file.type || "video container"}`
                          : "Up to 50MB · Maximum 120 seconds duration"}
                      </p>
                    </div>
                  </div>

                  <label
                    className="shrink-0 cursor-pointer rounded-full border bg-[var(--surface)] px-4 py-1.5 text-[12px] font-medium text-[var(--text-primary)] shadow-xs transition-colors hover:bg-[var(--surface-hover)] focus-within:ring-2 focus-within:ring-[var(--accent)]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {file ? "Replace file" : "Browse file"}
                    <input
                      type="file"
                      accept=".mp4,.webm,video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                      data-testid="recording-file-input"
                    />
                  </label>
                </div>

                {file && (
                  <div className="hidden">
                    <span data-testid="recording-file-name">{file.name}</span>
                    <span data-testid="recording-file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                )}
              </div>

              {/* Investigation Title */}
              <div>
                <label
                  htmlFor="investigation-title"
                  className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Investigation Title <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="investigation-title"
                  data-testid="investigation-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., BUG-01 — Checkout postal-code validation failure"
                  className="w-full rounded-lg border bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-colors"
                  required
                />
              </div>

              {/* Expected Behaviour Oracle Contract */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label
                    htmlFor="expected-behaviour"
                    className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Expected Behaviour Contract <span className="text-[var(--accent)]">*</span>
                  </label>
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                    Deterministic Oracle
                  </span>
                </div>
                <textarea
                  id="expected-behaviour"
                  data-testid="expected-behaviour-input"
                  value={expectedBehaviour}
                  onChange={(e) => setExpectedBehaviour(e.target.value)}
                  placeholder='e.g., Submitting without postal code must display visible validation message "Postal code is required."'
                  rows={3}
                  className="w-full rounded-lg border bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-colors"
                  required
                />
              </div>

              {/* Technical Context (Optional) */}
              <div>
                <label
                  htmlFor="investigation-context"
                  className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Technical Context <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <textarea
                  id="investigation-context"
                  data-testid="investigation-context-input"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Target URL, DOM selectors, session tokens, or reproduction steps…"
                  rows={2}
                  className="w-full rounded-lg border bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] transition-colors"
                />
              </div>

              {/* Progress Indicator */}
              {uploading && (
                <div
                  className="rounded-xl border bg-[var(--surface-elevated)] p-4"
                  style={{ borderColor: "var(--border-muted)" }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--text-primary)]">
                      Analyzing frames and grounding evidence with the selected vision model…
                    </span>
                    <span className="font-mono font-semibold text-[var(--accent)]">{progress}%</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface)] border border-[var(--border-muted)]">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Callout */}
              {error && (
                <div
                  data-testid="upload-error"
                  className="rounded-lg bg-[var(--red-muted)] px-4 py-2.5 text-xs text-[var(--red)] border"
                  style={{ borderColor: "rgba(220, 38, 38, 0.3)" }}
                >
                  {error}
                  {savedRecordingId ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[var(--text-secondary)]">Recording saved; you can retry without uploading again.</span>
                      <button type="button" onClick={retryAnalysis} disabled={uploading} className="font-semibold underline underline-offset-2 disabled:opacity-50">
                        Retry model analysis
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  data-testid="create-investigation-button"
                  className="flex-1 rounded-full bg-[var(--text-primary)] px-6 py-2.5 text-[13px] font-semibold text-[var(--canvas)] shadow-xs transition hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {uploading ? "Processing Evidence…" : "Initialize Investigation"}
                </button>
                <Link
                  href="/investigations"
                  className="rounded-full border bg-[var(--surface)] px-5 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Right Column: Architectural Guidance & Lifecycle */}
          <aside className="flex flex-col gap-5">
            {/* Pipeline Stage Card */}
            <div
              className="surface-geodesic-secondary p-5"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                INVESTIGATION LIFECYCLE
              </h2>
              <ol className="mt-4 space-y-3.5 text-xs">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] border font-mono text-[10px] font-semibold text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Frame Extraction</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      Video is split into calibrated timestamped frames at key action deltas.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] border font-mono text-[10px] font-semibold text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Multimodal Grounding</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      The selected vision model reviews frames for visible states, text feedback, and defects.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] border font-mono text-[10px] font-semibold text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Invariant Synthesis</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      Observations are converted into deterministic Playwright assertions.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] border font-mono text-[10px] font-semibold text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Regression Execution</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      Run headless tests to verify fix or prove defect reproduction.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Privacy & Zero-Slop Security Policy */}
            <div
              className="surface-geodesic-secondary p-5"
              style={{ borderColor: "var(--border)" }}
            >
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                PRIVACY & SECURITY
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Recordings are stored on this server; extracted frames and your prompt are sent to the selected model provider for analysis. Avoid secrets and personal data.
              </p>
              <Link href="/privacy" className="mt-2 inline-flex text-[11px] font-medium text-[var(--accent)] hover:underline">Read data handling details →</Link>
              <div className="mt-3.5 border-t pt-3 font-mono text-[11px] text-[var(--text-tertiary)]" style={{ borderColor: "var(--border-muted)" }}>
                <span>Allowlist: </span>
                <span className="text-[var(--text-secondary)]">/demo/* · strict isolation</span>
              </div>
            </div>

            <div className="surface-geodesic-secondary p-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">VISION MODEL</h3>
                <span className="badge-technical border px-2 py-1 text-[9px]" style={{
                  borderColor: modelStatus?.configured && modelStatus.liveAnalysisEnabled ? "var(--success-border)" : "var(--border-strong)",
                  color: modelStatus?.configured && modelStatus.liveAnalysisEnabled ? "var(--success-text)" : "var(--text-secondary)",
                  backgroundColor: modelStatus?.configured && modelStatus.liveAnalysisEnabled ? "var(--success-surface)" : "var(--surface-elevated)",
                }}>
                  {modelStatus ? (modelStatus.configured && modelStatus.liveAnalysisEnabled ? "Live analysis ready" : modelStatus.configured ? "Explicit opt-in required" : "API key needed") : "Checking setup"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                {modelStatus?.provider ? `Provider: ${modelStatus.provider}${modelStatus.modelId ? ` · ${modelStatus.modelId}` : ""}. ` : ""}
                {modelStatus?.message ?? "Checking server-side provider configuration…"}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                {modelStatus?.usageNote ?? "Live analysis requires a server-side API key and an explicit opt-in. A configured key does not prove model access; a successful analysis does."}
              </p>
              {modelStatus?.pricingUrl ? <a href={modelStatus.pricingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[11px] font-medium text-[var(--accent)] hover:underline">Check provider pricing and access ↗</a> : null}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
