# ReplaySpec — Screen Specifications

Implementation-ready screen layouts for Investigation Workspace. Each screen maps to a route, file path, components, data contracts, and states. No fake AI results — empty/loading/error states show honest limitations from `docs/VIDEO_RESEARCH.md` §9. Preserves BUG-01 at `/demo/bug-01`.

## Global Shell

**Route:** `src/app/(workspace)/layout.tsx` (group route, not affecting `/demo`)
**Components:** `TopBar`, `LeftRail`, `RightInspectorHost`, `ExecutionDrawer`
**Data:** `EvidenceBundle` from `src/lib/evidence.ts` (frames, observations, expectedBehaviours, hypotheses, ambiguities)

**Layout for ≥1024px:**
```
┌─ TopBar (56px, border-b, sticky) ──────────────────────────────────────────┐
│ [ReplaySpec ⟦00:01.9⟧]  Investigation #12 > BUG-01  |  Buggy ○ Fixed ●  |  Verdict: INCONCLUSIVE zinc pill │
├─ LeftRail 240px ─┬─ Center flex-1 ─────────────────────┬─ RightInspector 360px ─┤
│ Recording        │ FrameViewer (800×450 canvas)         │ Inspector (contextual) │
│ Evidence         │ Filmstrip (6 thumbs, timestamps)      │                        │
│ Specification    │ EvidenceTimeline (4 lanes)            │                        │
│ Execution        │                                       │                        │
├──────────────────┴───────────────────────────────────────┴────────────────────────┤
│ ExecutionDrawer (80px collapsed, 320px expanded) — Run button, logs, verdict      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Responsive:** 768–1023px: LeftRail collapses to 56px icons, RightInspector becomes drawer overlay. <768px: Single column, FrameViewer full-width, timeline below, evidence cards stacked, inspector as bottom sheet. All timestamps/selectors always visible (copy-on-tap).

---

## Screen 1: Investigation List (Entry)

**Route:** `src/app/investigations/page.tsx`
**Purpose:** PRODUCT_SPEC workflow step 1–3 entry — not BUG-01 demo.

**Layout:**
- Header: `Investigations` + `New investigation` button (amber, solid).
- List: Table with columns `ID`, `Source recording` (filename, duration, 800×450), `Target` (`/demo/bug-01`), `Status` (Draft / Analyzed / Verified), `Verdict` badge, `Updated` (relative time). Empty state: “No investigations yet — create one from a recording” with illustration of filmstrip → timeline.
- Each row click → Screen 2.

**States:**
- Empty: CTA + help text linking to BUG01_REPRO.md
- Loading: Skeleton rows (shimmer only for list, not for AI)
- Error: `HARNESS_ERROR` banner with `View logs` if previous ingestion failed

**Data contract:** Array of `{ id, recording: { filename, duration, frames: FrameEvidence[] }, target: string, verdict: Verdict | null }`. No AI data here.

---

## Screen 2: Investigation Detail — Recording + Frames

**Route:** `src/app/investigations/[id]/page.tsx` (default tab: Recording)
**Components:** `FrameViewer`, `Filmstrip`, `FrameMeta`, `EvidenceTimeline`

**FrameViewer:**
- Canvas: `800×450` native, checkerboard bg, centered image. Top-right badge: `800×450 PNG 157KB` mono 12px (from `FrameEvidence.bytes`). Bottom-right: `frame-00-00-8.png` mono link to manifest.
- Filmstrip: 6 thumbnails (80×45) with `00:00.8` label mono 11px below each. Active has amber `ring-2 ring-amber-500`. Duplicate frames (e.g. 00:01.2 identical to 00:00.8) appear dimmed 50% with `No visual change` chip — honest deduplication from probe results.
- Scrubber: Uneven ticks at `timestampSeconds` (0.8, 1.2, 1.9, 2.0, 2.4, 2.8/2.6) — not linear time, reflects sparse sampling. Active tick amber, others zinc.
- Controls: `←` `→` keyboard, click scrub, no autoplay. Hover shows `frameId`.

**Timeline lanes under viewer (4 lanes, shared ticks):**
- `OBSERVED` (solid zinc dot): One dot per observation, e.g. `00:00.8 — Checkout form visible...`
- `EXPECTED` (amber bar spanning all): `Submitting without postal code must display "Postal code is required."` (verbatim from `ExpectedBehaviour`)
- `HYPOTHESIS` (dashed amber): e.g. `Between 00:01.2→00:01.9 Place order click inferred`
- `AMBIGUITY` (dotted zinc): e.g. `Cannot verify display:none from screenshots`

**Right Inspector (contextual):**
- When frame selected: Shows `FrameEvidence` detail (timestamp, dimensions, sourceVideo) + linked `Observation` cards for that frame.
- When timeline dot clicked: Scrolls to observation card, pulses 200ms amber highlight.

**Data contract:** `frames: FrameEvidence[]` from `test-results/frames-bug01-fixed/manifest.json` shape. All 6 frames verified in §9 probe.

---

## Screen 3: Evidence — Observations / Hypotheses / Ambiguities

**Route:** `src/app/investigations/[id]/evidence/page.tsx` (or tab within [id])
**Components:** `ObservationList`, `HypothesisList`, `AmbiguityList`, `EvidenceInspector`

**ObservationList:**
- Grouped by frame timestamp (00:00.8, 00:01.2, etc.), each group header `00:01.9` mono amber link to viewer.
- Card per `Observation`: Header `OBSERVED` zinc pill + `high/medium/low` confidence + `frame 00:01.9` link. Body statement 13px sans: “At 00:01.9 difference: text ‘Order placed successfully.’ now visible... Postal code still 94105. Still no ‘Postal code is required.’ error visible.” Footer: `Source: frame-00-01-9.png` mono + `evidenceId: obs-3`. Cards ordered by `timestampSeconds` — Zod enforces strictly increasing.

**HypothesisList:**
- Card per `Hypothesis`: Header `HYPOTHESIS` dashed amber + confidence. Body: “Inferred click between 00:01.2 and 00:01.9 causing success” Footer: `inferredFrom: obs-2, obs-3` pills clickable + `Promote to Observation` button (opens confirmation modal). Never auto-promoted.

**AmbiguityList:**
- Card per `Ambiguity`: Header `AMBIGUITY` dotted zinc. Body: “Whether postal code was ever cleared cannot be determined; all frames show 94105” Footer: `affects: obs-3` + `Resolve` (links to Specification).

**States:**
- Empty before model probe: “No evidence yet — run analysis on recording” with `Analyze` button (triggers probe).
- Loading: `Analyzing 6 frames...` with real token usage after (e.g. `3,387 prompt tokens`) — no fake typing.
- Error: Malformed model JSON shows `Validation failed` with Zod issues list, not silent fallback.

---

## Screen 4: Specification — Expected + Assertions

**Route:** `src/app/investigations/[id]/spec/page.tsx`
**Components:** `ExpectedEditor`, `AssertionBuilder`, `CompiledPreview`

**ExpectedEditor:**
- Amber left-border block, 16px sans, textarea prefilled verbatim: `Submitting without postal code must display "Postal code is required."` Helper: “Preserved verbatim from user input — editing will create new expected version.”
- Shows `rawUserInput` vs `statement` diff if edited — explicit traceability.

**AssertionBuilder:**
- List of allowlisted Playwright assertions (from `src/lib/allowlist.ts` + `evidence.ts` observations):
  - Row: `[x] expect(page.getByTestId("postal-error")).toBeVisible()` mono 12px + `Source: obs-3 @ 00:01.9` pill + `confidence: high`
  - Only allowlisted selectors: `/^[\w-]+$/` for `data-testid`, actions `toBeVisible`/`toHaveText`/`toBeHidden` etc. Free-text input rejected with `Invalid selector` inline error.
  - Add assertion → dropdown of allowlisted templates, not free text area — prevents arbitrary code execution per AGENTS.md.
- Empty state: “No assertions — select observations to generate from” with disabled Run.

**CompiledPreview:**
- Read-only mono block showing actual Playwright test that will run (syntax highlighted, copy button). Example:
  ```
  test('regression', async ({ page }) => {
    await page.goto('/demo/bug-01?variant=fixed');
    // from obs-3 @ 00:01.9
    await expect(page.getByTestId("postal-error")).toBeVisible();
    await expect(page.getByTestId("postal-error")).toHaveText("Postal code is required.");
  });
  ```
- No “Run” here — deliberate separation per IA.

---

## Screen 5: Execution — Run, Evidence, Verdict

**Route:** `src/app/investigations/[id]/execution/page.tsx` + Bottom Drawer on all detail screens
**Components:** `RunButton`, `ProgressLog`, `VerdictBadge`, `EvidenceAttachments`, `TraceViewerLink`

**RunButton:**
- `Run regression (Chromium)` amber solid, enabled only if assertions selected and `isAllowedUrl(target)` passes (checks `http://localhost:3000` and `/demo/bug-01` regex). Otherwise disabled with tooltip “Target not allowlisted”.

**ProgressLog:**
- Streaming log lines: `Navigating to /demo/bug-01?variant=fixed…`, `Clicking [data-testid="checkout-submit"]…`, `Expect toBeVisible post-code error…`. No fake progress bar.

**VerdictBadge (after run):**
- Large pill: `REGRESSION_VERIFIED` green, `DEFECT_CONFIRMED` red, `HARNESS_ERROR` violet, `INCONCLUSIVE` zinc — exactly `docs/PRODUCT_SPEC.md` verdicts, never paraphrased.
- Below: supporting evidence chips: `obs-3 @ 00:01.9 — error visible` (fixed) vs `no error visible` (buggy) — compare view side-by-side for buggy/fixed runs.
- `HARNESS_ERROR` shows violet + `View harness logs` (Playwright error, headers) — not “test failed”.

**EvidenceAttachments:**
- Screenshots, `trace.zip`, `video.webm` (links, not embeds) — stored outside `public` (`test-results/artifacts`), each `View` / `Download`. Link to `npx playwright show-trace` instruction from `BUG01_REPRO.md`.
- Video player for WebM (if present) with timestamp scrub aligned to original frames — reuses FrameViewer.

**States:**
- Before run: Empty with “Run to generate verdict” + last run history list.
- Running: Spinner + logs, Run button disabled.
- After run: Verdict + attachments + `Compare with buggy` side-by-side toggle (shows fixed vs buggy observations from §9 probe — honest comparative evidence, not claiming unseen events).
- Harness failure: Violet banner, `HARNESS_ERROR`, logs expanded, no verdict.

---

## Reused Components (Across Screens)

**TopBar:** `ReplaySpec ⟦00:01.9⟧` logo (mono bracket + timestamp glyph) + breadcrumb + variant switcher (Buggy ○ Fixed ●, same as BUG-01 demo) + Verdict pill.

**LeftRail:** Icons + labels: Recording (filmstrip icon), Evidence (list-check), Specification (code-brackets), Execution (play). Active has amber left border.

**EvidenceTimeline:** Reused on Recording and Evidence screens — 4 lanes with shared ticks, clickable dots.

**FrameViewer:** Reused on Recording and Execution (video playback mode).

**ObservationCard / HypothesisCard / AmbiguityCard:** As specified in DESIGN_DIRECTION.md §7 — solid/dashed/dotted borders, mono selectors, confidence chips.

All components props typed from `src/lib/evidence.ts` schemas (`EvidenceBundle`, `FrameEvidence`, etc.) — single source of truth.

## Non-Goals (Explicit)

- Do not redesign `src/app/demo/bug-01` — it stays as fixture, not workspace. This spec builds *around* it at `/investigations`.
- No fake AI analysis or fake test results — every observation shows `frameId` + `timestamp` link; empty states show honest “No evidence yet”.
- No BUG-02/03, no full upload UI, no enterprise test-management features (per PRODUCT_SPEC explicit exclusions).
- No arbitrary code execution — compiled test preview is read-only, built from allowlisted templates only.

---

*Each screen above maps to one file, one data contract, and one Zod validation gate. Implementation can proceed milestone by milestone: M3.1 Investigation List + Frame Viewer, M3.2 Evidence Inspector + Spec Editor, M3.3 Execution Drawer + Verdict.*
