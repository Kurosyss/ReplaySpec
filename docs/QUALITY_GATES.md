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
