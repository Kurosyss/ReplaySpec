# BUG-01 — Reproducing and Inspecting Artifacts

Status: Milestone 1 vertical slice — Checkout postal-code validation.

## Manual reproduction

```bash
npm run dev
# open
http://localhost:3000/demo/bug-01?variant=buggy
http://localhost:3000/demo/bug-01?variant=fixed
```

Steps:
1. Leave "Postal code" empty.
2. Click "Place order".
3. **Fixed** → red "Postal code is required." visible, `aria-invalid=true` on input.
4. **Buggy** → no visible error. Inspect DOM: `<p data-testid="postal-error" style="display:none">` exists but hidden. This is the intentional `display:none` defect.

Fill postal code `94105` and submit again → "Order placed successfully." in both variants.

## Automated verification

```bash
# all BUG-01 tests (includes accessibility smoke)
npm run test:bug01

# only Chromium, list reporter
npx playwright test bug-01 --reporter=list

# forced video capture (webm for future Muse analysis)
npx playwright test bug-01.video --reporter=list
```

## Artifacts (outside public/)

All outputs are under `test-results/` and `playwright-report/` — both gitignored and never served.

| Artifact | Location | When |
|----------|----------|------|
| Video (webm) | `test-results/artifacts/**/video.webm` | `retain-on-failure` globally; `on` for `bug-01.video.spec.ts` |
| Screenshot | `test-results/artifacts/**/test-failed-*.png` | `only-on-failure` |
| Trace | `test-results/artifacts/**/trace.zip` | `on-first-retry` |

Supplementary storage placeholder (gitignored):
- `storage/recordings/` — for future upload feature (not used in M1).

## Inspecting traces and videos

```bash
# view HTML report (screenshots + trace links)
npm run test:report
# or
npx playwright show-report

# open a specific trace (from test-results/artifacts/*/trace.zip)
npx playwright show-trace test-results/artifacts/<test-dir>/trace.zip

# video is standard webm, playable in any browser/player
start test-results/artifacts/<test-dir>/video.webm   # Windows
open test-results/artifacts/<test-dir>/video.webm     # macOS
```

## Selectors (stable contract for future compiler)

- `data-testid="checkout-form"`
- `data-testid="postal-code-input"` (+ `aria-required`, `aria-invalid`, `aria-describedby="postal-error"`)
- `data-testid="checkout-submit"`
- `data-testid="postal-error"` (role=alert, text "Postal code is required.")
- `data-testid="order-success"`
- `data-testid="variant-badge"` / `variant-buggy-link` / `variant-fixed-link`

Invariant the compiler will emit:
```ts
await expect(page.getByTestId("postal-error")).toBeVisible();
await expect(page.getByTestId("postal-error")).toHaveText("Postal code is required.");
```
Passes on `?variant=fixed`, fails on `?variant=buggy`.

## Verdict mapping (for future classifier)

- `DEFECT_CONFIRMED` — fixed test passes, buggy test fails as expected (current M1 state).
- `HARNESS_ERROR` — navigation/timeout failure (distinguish from assertion failure).
- Never claim `HARNESS_ERROR` is a defect.
