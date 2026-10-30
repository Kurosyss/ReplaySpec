# ReplaySpec — Product Specification

Status: Initial specification; subject to research and validation.

## Product thesis

ReplaySpec converts an existing browser bug recording and a user's expected behaviour into an evidence-linked, executable browser regression test.

It is designed to make the path from observed bug to reproducible verification explicit and inspectable.

## Target users

- Software developers
- QA engineers
- Engineering teams investigating browser bugs
- Teams that receive screen recordings from customers or testers

## Core user workflow

1. Upload an existing browser recording.
2. Describe the expected behaviour.
3. Select an approved target application.
4. Analyse the recording with the configured Meta model.
5. Review timestamped observations and model hypotheses.
6. Validate the proposed regression specification.
7. Compile a constrained Playwright test.
8. Execute it against the controlled demo application.
9. Review screenshots, traces, logs and verdict.

## Required information separation

OBSERVED:
Facts supported by the video or browser evidence.

EXPECTED:
Behaviour explicitly requested by the user.

HYPOTHESIS:
Potential defect causes, selectors or assertions inferred by the model.

AMBIGUITY:
Missing or uncertain information that affects reliable test generation.

The system must not silently turn a hypothesis into an observed fact.

## Initial benchmark scenarios

### BUG-01 — Checkout postal-code validation
The buggy implementation hides the required postal-code error.
Expected behaviour: the error is visible.

### BUG-02 — Cart counter race
Rapid cart interactions produce an incorrect quantity.
Expected behaviour: two additional clicks increase the counter from 1 to 3.

### BUG-03 — Modal Cancel blocked by overlay
A layering issue prevents the Cancel action.
Expected behaviour: the modal closes after cancellation.

Each scenario needs a buggy version and a corresponding fixed version.

## Product verdicts

- DEFECT_CONFIRMED
- REGRESSION_VERIFIED
- HARNESS_ERROR
- INCONCLUSIVE

A harness failure must never be reported as proof of an application defect.

## MVP scope

- Existing recording ingestion
- Structured AI video analysis
- Evidence-linked observations
- User expectation preservation
- Validated regression specifications
- Constrained Playwright test generation
- Actual browser execution
- Evidence collection
- Buggy/fixed comparison
- Investigation workspace

## Explicit initial exclusions

- Unrestricted external website execution
- Arbitrary model-generated code execution
- Full enterprise test-management platform
- Unverified autonomous self-healing
- Claims of universal browser compatibility

## Initial controlled demo origin

http://localhost:3000

Initial routes:

- /demo/bug-01
- /demo/bug-02
- /demo/bug-03

These routes are provisional until the demo application is implemented.
