# ReplaySpec — Design Direction

Status: Implementation-ready direction for M2.2+. Preserves BUG-01 working implementation; does not replace `src/app/demo/bug-01` visual. No generic SaaS dashboard template.

## 1. Product Identity

**Name:** ReplaySpec  
**Tagline:** Evidence-grounded browser bug investigation  
**Metaphor:** Forensic timeline + lab notebook, not ticket tracker. Every claim must point to a frame, every frame has a timestamp. The UI makes the gap between *what was seen* and *what was inferred* impossible to ignore.

**Distinct from:** Jam, Replay QA, mabl, Bug0, Stagehand. Those emphasize recording *or* generation. ReplaySpec emphasizes *traceability*: OBSERVED vs EXPECTED vs HYPOTHESIS vs AMBIGUITY as first-class, visually distinct categories with persistent references.

**Voice:** Clinical, precise. No "AI magic" copy. Buttons say "Validate observations" not "Generate test". Verdicts are `DEFECT_CONFIRMED` / `REGRESSION_VERIFIED` / `HARNESS_ERROR` / `INCONCLUSIVE` — exactly as `docs/PRODUCT_SPEC.md` defines, never paraphrased.

**Logo direction (future):** Monospaced bracket + timestamp glyph: `⟦00:01.9⟧` — evokes frame reference. Wordmark in Geist Sans Medium, glyph in Geist Mono. No mascot.

## 2. Colour Direction — Not Generic Blue

Uses project’s existing zinc/amber palette (already in BUG-01) elevated to forensic theme. Avoids SaaS blue/purple.

**Core palette:**
- `ink` `zinc-950` (#09090b) — background for evidence-dense views (timeline, frame viewer). Feels lab-like.
- `paper` `white` / `zinc-50` — reading surfaces for specs.
- `evidence` `amber-500` (#f59e0b) — only for EXPECTED behaviour blocks. Warm, draws eye to human intent. Never for errors.
- `defect` `red-600` (#dc2626) — only for visible validation feedback that *failed* (error visible, or missing when expected). Not for generic errors.
- `harness` `violet-600` — only for `HARNESS_ERROR` verdicts (distinguish from defect per PRODUCT_SPEC.md).
- `observation` `zinc-700` on `zinc-100` chip — grounded facts.
- `hypothesis` `amber-900` on `amber-50` with dashed border — explicitly tentative.
- `ambiguity` `zinc-500` on `zinc-50` with dotted border — missing info.

**Rule:** Colour never carries meaning alone; label + icon + border style redundant. Passes WCAG AA.

## 3. Typography

**Display / headings:** `Geist Sans` (already in `src/app/layout.tsx`) — tight tracking, semibold for frame labels. Never 2xl+ hero; max `text-lg` for evidence density.

**Evidence / timestamps / selectors:** `Geist Mono` — all `data-testid`, timestamps `00:01.9`, verdict codes, frameIds in mono. This is a *selector contract*; mono signals copy-paste reliability. Size `12–13px`.

**Scale:**
- `11px` mono — timestamps on timeline ticks
- `12px` mono — `data-testid="postal-error"` chips
- `13px` sans — observation statements
- `14px` sans — hypothesis/ambiguity
- `16px` sans — Expected block (most important human input)

**Rule:** Mono never for marketing copy, sans never for selectors/timestamps. Immediate visual discrimination.

## 4. Investigation Workspace Information Architecture

Single investigation = one bug recording. Workspace layout is **four-pane forensic**, not dashboard cards:

```
┌─ Top Bar: breadcrumb Investigation #12 > BUG-01 + variant switcher (buggy/fixed) + Verdict badge ─┐
├─ Left Rail (240px): Navigation ────────────────────────────────────────────────────────────┤
│  • Recording + Frames (with timestamp list)                                              │
│  • Evidence (Observations grouped by frame, Hypotheses, Ambiguities)                     │
│  • Specification (Expected verbatim + compiled assertions preview)                        │
│  • Execution (Run history, screenshots, trace, verdict timeline)                         │
├─ Center (flex-1): Frame Viewer + Evidence Timeline ──────────────────────────────────────┤
├─ Right Inspector (360px): Observation / Hypothesis / Ambiguity detail + Spec Editor ─────┤
└─ Bottom: Execution drawer (collapsible) — Run button, progress, logs ────────────────────┘
```

**Why this IA:** Follows `docs/ARCHITECTURE.md` data flow: Recording → Model analysis → Observation/Hypothesis extraction → Spec validation → Compilation → Execution → Verdict. Order is vertical rail, not horizontal tabs, so user cannot skip validation.

**Current route preservation:** Existing `/demo/bug-01?variant=...` stays as *demo fixture*, not workspace. New workspace lives at `/investigations/[id]` — separate concern, per PRODUCT_SPEC workflow steps 4–9.

## 5. Recording and Frame Viewer Layout

Reuses extracted frames (`test-results/frames-bug01-*/manifest.json` structure: timestamp, timestampSeconds, file, width, height, bytes).

**Viewer design:**
- Central canvas 800×450 (native, no upscale beyond 100%, checkerboard bg for letterboxing). No browser chrome — page-only, as probe screenshots are.
- **Filmstrip below canvas:** 6 thumbnails (80×45) in chronological order, each labelled `00:00.8` in mono 11px. Active frame has amber ring. Click scrubs. Keyboard `← →` steps. Duplicate frames (visually identical like 00:01.2→00:00.8) shown but dimmed 50% with “No visual change” badge — honest deduplication.
- **Timestamp scrubber:** Horizontal rule with ticks at each `timestampSeconds` (0.8, 1.2, etc.), not linear time. Because frames are sparse (0.5s granularity), ticks are unevenly spaced to reflect actual sample points — avoids implying continuous video when we have discrete frames.
- **Dimensions badge:** `800×450 PNG 157KB` mono in top-right of canvas — proves provenance, not decorative.

**Interaction:** Hover frame → shows `frameId` `frame-00-00-8`. Click → Right Inspector opens Observation detail (see §7). No autoplay; user controls time.

## 6. Evidence Timeline

Horizontal timeline directly under filmstrip, **one lane per evidence type**, aligned to same timestamp ticks:

- **Lane 1 — OBSERVED (solid zinc dot)**: Facts visible at that timestamp, e.g. “00:01.9 — ‘Order placed successfully’ appears”.
- **Lane 2 — EXPECTED (amber bar)**: Spans entire timeline — expected behaviour is global, not per-frame. Shows verbatim: `Submitting without postal code must display "Postal code is required."`
- **Lane 3 — HYPOTHESIS (dashed amber dot)**: Inferred click between 00:01.2→00:01.9, display:none hypothesis.
- **Lane 4 — AMBIGUITY (dotted zinc)**: “Cannot verify DOM display:none from screenshots” at timeline end.

Dots are clickable → inspector. Hover shows statement truncated. Timeline uses same `timestamp` labels as viewer — same source of truth.

**Rule:** No observation appears without a dot on timeline; no dot without backing frame — traceability is visual.

## 7. Observation and Hypothesis Inspector (Right Pane)

**Observation card:**
- Header: `OBSERVED` zinc chip + `confidence: high` + `frame 00:01.9` amber link (click scrolls viewer)
- Body: statement 13px sans
- Footer: `Source: frame-00-01-9.png 800×450` mono link to manifest, `evidenceId: obs-3`
- No edit — observations are immutable (model output, then human validates).

**Hypothesis card:**
- Header: `HYPOTHESIS` amber dashed chip + `confidence: medium`
- Body: inferred statement, e.g. “Buggy variant hides [data-testid='postal-error'] via display:none”
- Footer: `inferredFrom: obs-2, obs-3` (clickable pills), `Delete` + `Promote to Observation` (requires explicit user confirmation modal: “You are promoting a hypothesis to observed fact. Provide frame evidence.” — never silent).

**Ambiguity card:**
- Header: `AMBIGUITY` dotted chip
- Body: missing info, e.g. “Whether postal code was cleared cannot be determined; all frames show 94105”
- Footer: `affects: obs-3` pill, `Resolve` button (links to spec editor).

**Separation enforced visually:** Observation cards have solid border, hypothesis dashed, ambiguity dotted — matches src/lib/evidence.ts `kind` discriminator. Never mix in same list without header.

## 8. Regression Specification Editor

Located in right pane when “Specification” rail active. Not a code editor — a **constrained assertion builder** per `ARCHITECTURE.md` compilation boundary and `QUALITY_GATES.md` compilation gate.

**Structure:**
- Expected block (amber left border, 16px): editable textarea with verbatim expectation, preserved exactly as user typed. Shows “Preserved verbatim from user input” helper.
- Assertions list (generated, not typed):
  - Each row: `expect(page.getByTestId("postal-error")).toBeVisible()` in mono, with `Source: obs-3 @ 00:01.9` pill, checkbox `Include`.
  - Only allowlisted actions: `toBeVisible`, `toHaveText`, `toHaveAttribute`, `toBeHidden` with allowlisted selectors (`data-testid` only, regex `^[\w-]+$`). Reject `evaluate`, `exec`, `goto` external.
  - Add assertion → dropdown of allowlisted assertions, not free text.

**Preview:** Read-only compiled Playwright snippet with syntax highlight (Geist Mono). No “Run” here — execution is separate drawer to prevent bypassing validation.

## 9. Execution and Verification Experience

**Run drawer (bottom):**
- Button `Run regression (Chromium)` — only enabled when at least one assertion checked and `src/lib/allowlist.ts` confirms target `http://localhost:3000/demo/bug-01` is allowed.
- Progress: spinner + log lines `Navigating to /demo/bug-01?variant=fixed...` streaming.
- Verdict badge appears after run: `REGRESSION_VERIFIED` green, `DEFECT_CONFIRMED` red, `HARNESS_ERROR` violet, `INCONCLUSIVE` zinc — each with supporting evidence chips.
- **Evidence attachments:** Screenshots, trace.zip, video.webm (links, not embeds, stored outside public), each with `View` (opens new tab) and `Download`. Distinguish harness vs defect: `HARNESS_ERROR` shows `x-baseten-*` headers and Playwright error, not “test failed”.

**Verdict must never be “AI says”** — it is derived from Playwright assertions plus evidence links.

## 10. Motion and Interaction Principles

- **No generic dashboard animations.** Motion only for evidence continuity:
  - Frame scrub: 150ms crossfade on canvas, not slide — indicates same page, different time.
  - Timeline dot to inspector: 200ms ease-out highlight pulse on referenced observation card.
  - Hypothesis promotion confirmation: 300ms modal scale-in with amber flash — emphasizes irreversibility.
- **Respect reduced motion:** All animations gated by `prefers-reduced-motion`.
- **Loading:** Skeleton shimmer only for frame thumbnails; never for model response (show “Analyzing 6 frames…” with actual token usage after, not fake typing).

## 11. Responsive Behaviour

- **Desktop (≥1024px):** Four-pane as above. Center viewer flexes, rails fixed.
- **Tablet (768–1023px):** Left rail collapses to icons, right inspector becomes drawer overlay (tap observation chip to open). Frame viewer remains central.
- **Mobile (<768px):** Not primary for investigation (evidence-dense), but must not break. Shows single-column: Frame viewer full-width, timeline below, evidence cards stacked. Spec editor collapses to “View compiled test” link. Execution drawer becomes full-screen modal.
- **Rule:** No responsive hiding of timestamps or selectors — they are contract, always visible even if truncated with `…` and copy-on-tap.

## 12. Implementation Notes (Preserve Stack)

- Next.js App Router, existing `src/app/layout.tsx` Geist fonts (no new font download), Tailwind v4 (zinc/amber already used in BUG-01, no new palette dependency).
- Uses current `src/lib/evidence.ts` Zod schemas as single source of truth for inspector forms — no duplicate types.
- API keys server-side only (`src/app/api/*` reads `.env.local`, never client bundle).
- Never executes model-generated source code; assertions are constructed via allowlisted templates in `src/lib/allowlist.ts`.
- BUG-01 demo at `/demo/bug-01` untouched; new UI lives under `/investigations` to avoid rewrite.

---
*This direction is implementation-ready: each screen in SCREEN_SPEC.md maps to a file path, component, and data contract (EvidenceBundle, FrameEvidence). No fake AI results; all states show actual probe outputs or loading/empty states with honest limitations.*
