"use client";

import { useState, useEffect, useCallback } from "react";
import type { EvidenceBundle } from "@/lib/evidence";
import type { SpecData, AssertionMatcher } from "@/lib/investigations/types";

type Props = {
  investigationId: string;
  bundle: EvidenceBundle;
  specSupportStatus?: "SUPPORTED" | "NEEDS_MAPPING" | "UNSUPPORTED";
};

export function SpecBuilder({ investigationId, bundle, specSupportStatus }: Props) {
  const [spec, setSpec] = useState<SpecData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedObsId, setSelectedObsId] = useState<string>("");
  const [selectedMatcher, setSelectedMatcher] = useState<AssertionMatcher>("toBeVisible");
  const [expectedText, setExpectedText] = useState("Postal code is required.");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSpec = useCallback(async () => {
    try {
      const res = await fetch(`/api/investigations/${investigationId}/spec`);
      if (res.ok) {
        const data: { spec: SpecData | null } = await res.json();
        setSpec(data.spec);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [investigationId]);

  useEffect(() => {
    fetchSpec();
  }, [fetchSpec]);

  const handleAdd = async () => {
    setError(null);
    if (!selectedObsId) {
      setError("Select an observation");
      return;
    }
    const obs = bundle.observations.find((o) => o.id === selectedObsId);
    if (!obs) {
      setError("Observation not found");
      return;
    }

    const payload: { observationId: string; matcher: AssertionMatcher; expectedText?: string } = {
      observationId: selectedObsId,
      matcher: selectedMatcher,
    };
    if (selectedMatcher === "toHaveText") {
      payload.expectedText = expectedText;
    }

    try {
      const res = await fetch(`/api/investigations/${investigationId}/spec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: { spec?: SpecData; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add assertion");
        return;
      }
      if (data.spec) setSpec(data.spec);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemove = async (assertionId: string) => {
    if (!confirm(`Remove assertion ${assertionId}?`)) return;
    try {
      const res = await fetch(`/api/investigations/${investigationId}/spec?assertionId=${encodeURIComponent(assertionId)}`, {
        method: "DELETE",
      });
      const data: { spec?: SpecData; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to remove");
        return;
      }
      if (data.spec) setSpec(data.spec);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCopy = async () => {
    if (!spec?.compiledSource) return;
    await navigator.clipboard.writeText(spec.compiledSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-[8px] border bg-[var(--surface)] p-4" style={{ borderColor: "var(--border-muted)" }}>
        <p className="font-mono text-[11px] text-[var(--text-tertiary)]">Loading specification…</p>
      </div>
    );
  }

  const selectedObs = selectedObsId ? bundle.observations.find((o) => o.id === selectedObsId) : null;
  const selectedFrame = selectedObs ? bundle.frames.find((f) => f.frameId === selectedObs.frameId) : null;

  // NEEDS_MAPPING: unsupported scenario — show honest state, no fabricated assertions
  if (specSupportStatus === "NEEDS_MAPPING" || specSupportStatus === "UNSUPPORTED") {
    return (
      <div className="flex flex-col gap-4" data-testid="spec-needs-mapping">
        <div className="rounded-[8px] border bg-[var(--surface-elevated)] p-3" style={{ borderColor: "var(--border-muted)" }}>
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Specification</p>
          <p className="mt-1 font-mono text-[13px] font-medium leading-5 text-[var(--text-primary)]">Specification not yet available for this scenario — evidence preserved, needs mapping</p>
          <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-secondary)]">This recording is not BUG-01. Evidence is preserved with {bundle.frames.length} frames and {bundle.observations.length} observations, but no BUG-01 spec template applies.</p>
        </div>
        <div className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border-muted)" }}>
          <p className="font-mono text-[11px] text-[var(--text-tertiary)]">No assertions — mapping required before generating a regression test.</p>
          <pre data-testid="spec-preview" className="mt-2 max-h-64 overflow-auto rounded-[6px] bg-[var(--surface-elevated)] p-3 font-mono text-[11px] leading-4 text-[var(--text-primary)]" style={{ border: "1px solid var(--border-muted)" }}>
            <code>{"// No assertions yet — needs mapping"}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[8px] border bg-[var(--surface-elevated)] p-3" style={{ borderColor: "var(--border-muted)" }}>
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Specification Provenance</p>
        <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-secondary)]">
          Each assertion references a validated observation and its frame. No hypothesis silently becomes an assertion.
        </p>
        <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">
          Allowlisted selectors: <span className="font-medium text-[var(--text-primary)]">postal-error</span> • Matchers: <span className="font-medium text-[var(--text-primary)]">toBeVisible, toBeHidden, toHaveText</span>
        </p>
      </div>

      {/* Builder */}
      <div className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border-muted)", boxShadow: "var(--shadow-sm)" }}>
        <h4 className="text-[13px] font-medium text-[var(--text-primary)]" style={{ letterSpacing: "-0.01em" }}>Add evidence-linked assertion</h4>

        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Observation</label>
            <select
              data-testid="spec-observation-select"
              value={selectedObsId}
              onChange={(e) => setSelectedObsId(e.target.value)}
              className="mt-1 w-full rounded-[6px] border bg-[var(--surface)] px-2 py-1.5 font-mono text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="">Select observation…</option>
              {bundle.observations.map((obs) => (
                <option key={obs.id} value={obs.id}>
                  {obs.id} — {obs.timestamp} — {obs.statement.slice(0, 60)}…
                </option>
              ))}
            </select>
            {selectedObs && selectedFrame ? (
              <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">
                Provenance: <span className="text-[var(--text-primary)]">{selectedObs.id}</span> • Frame <span className="text-[var(--accent)]">{selectedFrame.timestamp} {selectedFrame.frameId}</span> • Expected: <span className="text-[var(--text-primary)]">Submitting without postal code must display &quot;Postal code is required.&quot;</span>
              </p>
            ) : null}
          </div>

          <div>
            <label className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Matcher</label>
            <select
              data-testid="spec-matcher-select"
              value={selectedMatcher}
              onChange={(e) => setSelectedMatcher(e.target.value as AssertionMatcher)}
              className="mt-1 w-full rounded-[6px] border bg-[var(--surface)] px-2 py-1.5 font-mono text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="toBeVisible">toBeVisible</option>
              <option value="toBeHidden">toBeHidden</option>
              <option value="toHaveText">toHaveText</option>
            </select>
          </div>

          {selectedMatcher === "toHaveText" ? (
            <div>
              <label className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Expected text</label>
              <input
                data-testid="spec-expected-text-input"
                value={expectedText}
                onChange={(e) => setExpectedText(e.target.value)}
                placeholder="Postal code is required."
                className="mt-1 w-full rounded-[6px] border bg-[var(--surface)] px-2 py-1.5 font-mono text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{ borderColor: "var(--border)" }}
              />
              <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Must match expected behaviour verbatim.</p>
            </div>
          ) : null}

          {error ? (
            <p data-testid="spec-error" className="rounded-[6px] bg-[var(--red-muted)] px-2 py-1.5 font-mono text-[11px] leading-4 text-[var(--red)]" style={{ border: "1px solid var(--red)" }}>
              {error}
            </p>
          ) : null}

          <button
            type="button"
            data-testid="spec-add-button"
            onClick={handleAdd}
            disabled={!selectedObsId}
            className="inline-flex items-center justify-center rounded-[6px] bg-[var(--accent)] px-3 py-1.5 font-mono text-[12px] font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-40"
          >
            Add assertion
          </button>
        </div>
      </div>

      {/* Assertions list */}
      <div className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border-muted)" }}>
        <h4 className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Assertions ({spec?.assertions.length ?? 0})</h4>
        {!spec?.assertions.length ? (
          <p className="mt-2 font-mono text-[12px] leading-5 text-[var(--text-tertiary)]">No assertions yet — select an observation above to generate a spec.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {spec.assertions.map((a) => (
              <li key={a.id} data-testid={`spec-assertion-${a.id}`} className="flex items-center justify-between rounded-[6px] border bg-[var(--surface-elevated)] px-2 py-1.5" style={{ borderColor: "var(--border-muted)" }}>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] leading-4 text-[var(--text-primary)]">
                    {a.selector} · {a.matcher}
                    {a.expectedText ? ` · "${a.expectedText}"` : ""}
                  </p>
                  <p className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">
                    from {a.observationId} @ {a.timestamp} {a.frameId}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid={`spec-remove-${a.id}`}
                  onClick={() => handleRemove(a.id)}
                  className="ml-2 rounded-[6px] border bg-[var(--surface)] px-2 py-1 font-mono text-[11px] text-[var(--text-secondary)] hover:bg-[var(--red-muted)] hover:text-[var(--red)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Compiled preview */}
      <div className="rounded-[8px] border bg-[var(--surface)] p-3" style={{ borderColor: "var(--border-muted)" }}>
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Compiled preview</h4>
          <span className="rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Read-only</span>
        </div>
        <p className="mt-1 font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Preview only — generated specification is not executed by this runner.</p>
        <pre
          data-testid="spec-preview"
          className="mt-2 max-h-64 overflow-auto rounded-[6px] bg-[var(--surface-elevated)] p-3 font-mono text-[11px] leading-4 text-[var(--text-primary)]"
          style={{ border: "1px solid var(--border-muted)" }}
        >
          <code>{spec?.compiledSource ?? "// No assertions yet"}</code>
        </pre>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            data-testid="spec-copy-button"
            onClick={handleCopy}
            disabled={!spec?.compiledSource}
            className="rounded-[6px] border bg-[var(--surface)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
            style={{ borderColor: "var(--border)" }}
          >
            {copied ? "Copied!" : "Copy source"}
          </button>
          <span className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Saved to test-results/investigations/{investigationId}/spec-test.ts</span>
        </div>
      </div>
    </div>
  );
}
