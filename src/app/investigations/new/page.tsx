"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  const handleFile = useCallback((f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    // Client-side validation: extension and MIME
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "mp4" && ext !== "webm") {
      setError("Unsupported file type. Only MP4 and WebM are allowed.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError(`File too large: ${(f.size / 1024 / 1024).toFixed(1)}MB > 50MB`);
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
      setError("Please select a recording file");
      return;
    }
    if (!title.trim()) {
      setError("Investigation title is required");
      return;
    }
    if (!expectedBehaviour.trim()) {
      setError("Expected behaviour is required");
      return;
    }

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("expectedBehaviour", expectedBehaviour.trim());
      if (context.trim()) formData.append("context", context.trim());

      setProgress(30);
      const uploadRes = await fetch("/api/recordings", {
        method: "POST",
        body: formData,
      });

      setProgress(60);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Upload failed");
        setUploading(false);
        setProgress(0);
        return;
      }

      const recordingId = uploadData.id;
      setProgress(70);

      // Now trigger frame extraction and Muse analysis
      // For M3.4, we will create the investigation directly from the recording
      // The analysis is done server-side via POST /api/recordings/[id]/analyze
      const analyzeRes = await fetch(`/api/recordings/${recordingId}/analyze`, {
        method: "POST",
      });
      setProgress(90);
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) {
        setError(analyzeData.error ?? "Analysis failed");
        setUploading(false);
        setProgress(0);
        return;
      }

      setProgress(100);
      // Navigate to the new investigation
      router.push(`/investigations/${analyzeData.investigationId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed: ${msg}`);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-[calc(100vh-40px)] bg-[var(--canvas)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link href="/investigations" className="font-mono text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            ← Back to investigations
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--text-primary)]" style={{ letterSpacing: "-0.025em" }}>
            New investigation
          </h1>
          <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">Upload a browser recording and describe what should have happened.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-[8px] border bg-[var(--surface)] p-6" style={{ borderColor: "var(--border-muted)", boxShadow: "var(--shadow-sm)" }}>
          {/* Privacy notice */}
          <div className="rounded-[8px] border bg-[var(--amber-muted)] p-3" style={{ borderColor: "var(--amber)" }}>
            <p className="font-mono text-[11px] font-medium leading-4 text-[var(--text-primary)]">Privacy notice</p>
            <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-secondary)]">
              Selected video frames will be sent to the configured Muse AI model for analysis. Do not upload recordings containing credentials or sensitive personal information.
            </p>
          </div>

          {/* Recording file */}
          <div>
            <label className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Recording file *</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mt-1 flex flex-col items-center justify-center rounded-[8px] border-2 border-dashed p-6 text-center ${dragOver ? "border-[var(--accent)] bg-[var(--accent-muted)]" : "border-[var(--border)] bg-[var(--surface-elevated)]"}`}
              style={{ borderColor: dragOver ? "var(--accent)" : "var(--border)" }}
            >
              <p className="font-mono text-[12px] font-medium text-[var(--text-primary)]">Drag and drop MP4 or WebM here</p>
              <p className="font-mono text-[11px] text-[var(--text-tertiary)]">or</p>
              <label className="mt-2 cursor-pointer rounded-[6px] border bg-[var(--surface)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>
                Choose file
                <input
                  type="file"
                  accept=".mp4,.webm,video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  data-testid="recording-file-input"
                />
              </label>
              {file ? (
                <div className="mt-3 rounded-[6px] border bg-[var(--surface)] px-3 py-2 text-left" style={{ borderColor: "var(--border-muted)" }}>
                  <p className="font-mono text-[11px] font-medium text-[var(--text-primary)]" data-testid="recording-file-name">{file.name}</p>
                  <p className="font-mono text-[11px] text-[var(--text-tertiary)]" data-testid="recording-file-size">{(file.size / 1024 / 1024).toFixed(1)} MB • {file.type || "unknown type"}</p>
                </div>
              ) : null}
            </div>
            <p className="mt-1 font-mono text-[11px] text-[var(--text-tertiary)]">MP4 or WebM, up to 50MB, max 120 seconds. File signature and duration will be validated server-side.</p>
          </div>

          {/* Investigation title */}
          <div>
            <label htmlFor="investigation-title" className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Investigation title *</label>
            <input
              id="investigation-title"
              data-testid="investigation-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Checkout postal-code validation failure"
              className="mt-1 w-full rounded-[6px] border bg-[var(--surface)] px-3 py-2 font-mono text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
              required
            />
          </div>

          {/* Expected behaviour */}
          <div>
            <label htmlFor="expected-behaviour" className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Expected behaviour *</label>
            <p className="font-mono text-[11px] text-[var(--text-tertiary)]">Describe what should have happened — preserved verbatim, distinct from AI observations.</p>
            <textarea
              id="expected-behaviour"
              data-testid="expected-behaviour-input"
              value={expectedBehaviour}
              onChange={(e) => setExpectedBehaviour(e.target.value)}
              placeholder='e.g., Submitting without postal code must display "Postal code is required."'
              rows={3}
              className="mt-1 w-full rounded-[6px] border bg-[var(--surface)] px-3 py-2 font-mono text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
              required
            />
          </div>

          {/* Optional context */}
          <div>
            <label htmlFor="investigation-context" className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Investigation context (optional)</label>
            <textarea
              id="investigation-context"
              data-testid="investigation-context-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Short description, steps to reproduce, etc. (optional)"
              rows={2}
              className="mt-1 w-full rounded-[6px] border bg-[var(--surface)] px-3 py-2 font-mono text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          {uploading ? (
            <div className="rounded-[6px] border bg-[var(--surface-elevated)] p-3" style={{ borderColor: "var(--border-muted)" }}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] font-medium text-[var(--text-primary)]">Uploading and analyzing…</p>
                <p className="font-mono text-[11px] text-[var(--text-tertiary)]">{progress}%</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border-muted)]">
                <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 font-mono text-[11px] text-[var(--text-tertiary)]">Do not close — frames are being extracted and sent to Muse for analysis.</p>
            </div>
          ) : null}

          {error ? (
            <p data-testid="upload-error" className="rounded-[6px] bg-[var(--red-muted)] px-3 py-2 font-mono text-[12px] leading-4 text-[var(--red)]" style={{ border: "1px solid var(--red)" }}>
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              data-testid="create-investigation-button"
              className="flex-1 rounded-[6px] bg-[var(--accent)] px-4 py-2 font-mono text-[13px] font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              {uploading ? "Analyzing…" : "Create investigation"}
            </button>
            <Link href="/investigations" className="rounded-[6px] border bg-[var(--surface)] px-4 py-2 font-mono text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border)" }}>
              Cancel
            </Link>
          </div>

          <p className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Analysis is not started until you click Create investigation. No images are sent before then.</p>
        </form>
      </div>
    </div>
  );
}
