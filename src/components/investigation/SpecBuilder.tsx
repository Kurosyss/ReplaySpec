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

  useEffect(() => {
    let active = true;
    fetch(`/api/investigations/${investigationId}/spec`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setSpec(data.spec);
      })
      .catch((err) => {
        if (active) console.error(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [investigationId]);

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
      const res = await fetch(
        `/api/investigations/${investigationId}/spec?assertionId=${encodeURIComponent(assertionId)}`,
        {
          method: "DELETE",
        }
      );
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
      <div
        className="rounded-[8px] border bg-[var(--surface)] p-4 shadow-sm"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <p className="font-mono text-xs text-[var(--text-tertiary)]">Loading specification…</p>
      </div>
    );
  }

  const selectedObs = selectedObsId ? bundle.observations.find((o) => o.id === selectedObsId) : null;
  const selectedFrame = selectedObs ? bundle.frames.find((f) => f.frameId === selectedObs.frameId) : null;

  // NEEDS_MAPPING: unsupported scenario — show honest state, no fabricated assertions
  if (specSupportStatus === "NEEDS_MAPPING" || specSupportStatus === "UNSUPPORTED") {
    return (
      <div className="flex flex-col gap-3" data-testid="spec-needs-mapping">
        <div
          className="rounded-[8px] border bg-[var(--surface-elevated)] p-3.5"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--amber)]">
              Specification Status
            </span>
            <span className="rounded bg-[var(--surface)] px-1.5 py-0.2 font-mono text-[9px] text-[var(--text-secondary)] border border-[var(--border-muted)]">
              NEEDS_MAPPING
            </span>
          </div>
          <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[var(--text-primary)]">
            Specification mapping required for this recording scenario.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            Evidence is preserved ({bundle.frames.length} frames, {bundle.observations.length} observations), but no automated spec template matches this route. Author custom assertions or map targets to compile a regression test.
          </p>
        </div>

        <div
          className="rounded-[8px] border bg-[var(--surface)] p-3.5"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <p className="font-mono text-[11px] text-[var(--text-tertiary)]">
            {"// No assertions yet — mapping required before generating executable test."}
          </p>
          <pre
            data-testid="spec-preview"
            className="mt-2.5 max-h-60 overflow-auto rounded-[6px] border bg-[var(--canvas)] p-3 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]"
            style={{ borderColor: "var(--border-muted)" }}
          >
            <code>{"// No assertions yet — needs mapping"}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Specification Provenance Card */}
      <div
        className="rounded-[8px] border bg-[var(--surface-elevated)] p-3.5"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Specification Provenance
          </p>
          <span className="rounded bg-[var(--surface)] px-1.5 py-0.2 font-mono text-[9px] text-[var(--text-secondary)] border border-[var(--border-muted)]">
            {spec?.assertions.length ?? 0} assertions
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
          Every assertion is strictly grounded in a validated observation and verified video frame. Hypotheses cannot become assertions without explicit promotion.
        </p>
        <p className="mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
          Allowlisted selector: <span className="text-[var(--text-primary)] font-medium">postal-error</span> · Matchers: <span className="text-[var(--text-primary)] font-medium">toBeVisible, toBeHidden, toHaveText</span>
        </p>
      </div>

      {/* Builder Form */}
      <div
        className="rounded-[8px] border bg-[var(--surface)] p-3.5 shadow-sm"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <h4 className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
          Add evidence-linked assertion
        </h4>

        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="block font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Observation source *
            </label>
            <select
              data-testid="spec-observation-select"
              value={selectedObsId}
              onChange={(e) => setSelectedObsId(e.target.value)}
              className="w-full rounded-[5px] border bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border-muted)" }}
            >
              <option value="">Select validated observation…</option>
              {bundle.observations.map((obs) => (
                <option key={obs.id} value={obs.id}>
                  {obs.id} · {obs.timestamp} · {obs.statement.slice(0, 50)}…
                </option>
              ))}
            </select>
            {selectedObs && selectedFrame ? (
              <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-[var(--text-tertiary)]">
                Provenance: <span className="text-[var(--text-primary)] font-medium">{selectedObs.id}</span> · Frame <span className="text-[var(--accent)] font-medium">{selectedFrame.timestamp} ({selectedFrame.frameId})</span>
              </p>
            ) : null}
          </div>

          <div>
            <label className="block font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Matcher *
            </label>
            <select
              data-testid="spec-matcher-select"
              value={selectedMatcher}
              onChange={(e) => setSelectedMatcher(e.target.value as AssertionMatcher)}
              className="w-full rounded-[5px] border bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border-muted)" }}
            >
              <option value="toBeVisible">toBeVisible</option>
              <option value="toBeHidden">toBeHidden</option>
              <option value="toHaveText">toHaveText</option>
            </select>
          </div>

          {selectedMatcher === "toHaveText" ? (
            <div>
              <label className="block font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                Expected text *
              </label>
              <input
                data-testid="spec-expected-text-input"
                value={expectedText}
                onChange={(e) => setExpectedText(e.target.value)}
                placeholder="Postal code is required."
                className="w-full rounded-[5px] border bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                style={{ borderColor: "var(--border-muted)" }}
              />
              <p className="mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
                Must match verbatim user expected behaviour statement.
              </p>
            </div>
          ) : null}

          {error ? (
            <p
              data-testid="spec-error"
              className="rounded-[5px] p-2 font-mono text-[11px] text-[var(--red)] border"
              style={{ borderColor: "var(--red)", background: "var(--red-muted)" }}
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            data-testid="spec-add-button"
            onClick={handleAdd}
            disabled={!selectedObsId}
            className="inline-flex items-center justify-center rounded-[5px] bg-[var(--accent)] px-3 py-1.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add Assertion
          </button>
        </div>
      </div>

      {/* Assertions List */}
      <div
        className="rounded-[8px] border bg-[var(--surface)] p-3.5 shadow-sm"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Authored Assertions ({spec?.assertions.length ?? 0})
          </h4>
          <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
            regression contract
          </span>
        </div>

        {!spec?.assertions.length ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-tertiary)]">
            No assertions authored yet. Select an observation above to link evidence and generate test assertions.
          </p>
        ) : (
          <ul className="mt-2.5 flex flex-col gap-2">
            {spec.assertions.map((a) => (
              <li
                key={a.id}
                data-testid={`spec-assertion-${a.id}`}
                className="flex items-center justify-between rounded-[5px] border bg-[var(--surface-elevated)] p-2.5"
                style={{ borderColor: "var(--border-muted)" }}
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate font-mono text-[11px] font-medium text-[var(--text-primary)]">
                    {a.selector} · {a.matcher}
                    {a.expectedText ? ` · "${a.expectedText}"` : ""}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
                    grounded in {a.observationId} @ {a.timestamp} ({a.frameId})
                  </p>
                </div>
                <button
                  type="button"
                  data-testid={`spec-remove-${a.id}`}
                  onClick={() => handleRemove(a.id)}
                  className="rounded-[4px] border bg-[var(--surface)] px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)] transition-colors hover:border-[var(--red)] hover:bg-[var(--red-muted)] hover:text-[var(--red)]"
                  style={{ borderColor: "var(--border-muted)" }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Compiled Playwright Preview */}
      <div
        className="rounded-[8px] border bg-[var(--surface)] p-3.5 shadow-sm"
        style={{ borderColor: "var(--border-muted)" }}
      >
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Compiled Test Preview
          </h4>
          <span className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] border border-[var(--border-muted)]">
            Read-only
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
          Constrained Playwright code generated from verified assertions.
        </p>

        <pre
          data-testid="spec-preview"
          className="mt-2.5 max-h-56 overflow-auto rounded-[6px] border bg-[var(--canvas)] p-3 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)]"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <code>{spec?.compiledSource ?? "// No assertions yet"}</code>
        </pre>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            data-testid="spec-copy-button"
            onClick={handleCopy}
            disabled={!spec?.compiledSource}
            className="rounded-[5px] border bg-[var(--surface-elevated)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40"
            style={{ borderColor: "var(--border-muted)" }}
          >
            {copied ? "Copied!" : "Copy test source"}
          </button>
          <span className="font-mono text-[10px] text-[var(--text-tertiary)] truncate">
            test-results/investigations/{investigationId}/spec-test.ts
          </span>
        </div>
      </div>
    </div>
  );
}
