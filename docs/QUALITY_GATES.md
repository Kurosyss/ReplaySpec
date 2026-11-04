# ReplaySpec — Quality Gates

A feature is not complete merely because its code has been generated.

## Repository gate
- No accidental secrets in tracked files.
- TypeScript checks pass.
- ESLint passes.
- Production build passes.

## Model integration gate
- Correct hackathon model ID.
- API errors are handled clearly.
- Structured responses are validated.
- No false claim that an untested integration works.
- Usage and request size are controlled.

## Analysis gate
- Observations and hypotheses remain distinct.
- User expectations remain unchanged.
- Evidence references are retained.
- Uncertainty and ambiguity are surfaced.

## Compilation gate
- Only approved specification types are accepted.
- Invalid actions and selectors are rejected.
- Generated tests use controlled templates.
- Arbitrary model-generated code is never executed.

## Browser execution gate
- Execution targets only the approved local demo routes.
- Test outcomes distinguish application and harness errors.
- Screenshots and traces are retained for inspection.
- No fixed sleeps as a substitute for reliable conditions.

## Benchmark gate
For all three initial scenarios:
- Buggy version reproduces the intended defect.
- Fixed version passes the corresponding regression test.
- Repeated runs are checked for flaky behaviour.
- Every reported verdict has supporting execution evidence.

## Demo gate
- A fresh setup can reproduce the workflow.
- The complete input-to-verdict path works.
- Failure states are handled honestly.
- No mocked result is presented as an actual model or browser execution.

## Final visual and judge review
- Review every primary route, not only the home page: investigations list, each curated scenario, recording, evidence, specification, execution, new investigation, legal pages, loading, empty, and error states.
- Inspect every recording frame at its rendered size. Confirm the full source image is visible, aspect ratio is preserved, and no important UI is clipped by the viewer or its surrounding layout. Flag clipping already present in source captures separately from viewer cropping.
- Walk each scenario end-to-end in both buggy and fixed modes; confirm frame timestamps, observations, hypotheses, expected behaviour, and verdicts agree with the actual evidence.
- Check navigation back to the home page and between investigation sections at desktop and narrow viewport widths.
- Perform a judge-style pass for visual hierarchy, legibility, accessible contrast, responsive behaviour, product clarity, truthful AI/provider claims, and hackathon demo reliability. Fix material weaknesses before calling the submission ready.
- Capture final README screenshots and the hero banner only after this review passes.
