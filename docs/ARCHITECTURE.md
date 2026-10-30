# ReplaySpec — Architecture

Status: Proposed architecture. Verify provider capabilities and implementation constraints before locking details.

## Main components

1. Web application
2. Recording intake
3. Model provider adapter
4. Video analysis service
5. Evidence and observation normalizer
6. Specification validation layer
7. Test specification compiler
8. Playwright execution runner
9. Evidence collector
10. Verdict classifier
11. Investigation workspace

## Proposed data flow

Recording + expected behaviour
    -> Input validation
    -> Muse model analysis through Baseten
    -> Structured observation and hypothesis extraction
    -> Schema validation
    -> Evidence/expectation consistency checks
    -> Test specification
    -> Constrained Playwright compiler
    -> Controlled browser execution
    -> Evidence collection
    -> Verdict classification

## Model boundary

Model output is untrusted input.

All output must be parsed and validated against explicit schemas before use.

The model must not directly supply arbitrary executable source code or unrestricted shell commands.

## Evidence model

Important observations should retain:
- Stable evidence identifier
- Source recording identifier
- Timestamp or frame reference when available
- Observation description
- Confidence or uncertainty information
- Related test specification references

## Execution boundary

Initial execution targets only the bundled demo application.

The allowed origin and route list must be explicitly checked server-side.

The initial implementation must not permit arbitrary external URLs or model-controlled shell execution.

## Provider abstraction

Use a provider adapter so the model provider can be changed without rewriting the domain and test compilation layers.

Initial intended provider:
Baseten OpenAI-compatible inference API.

Hackathon model:
meta-models/muse-spark-open-1026

Base URL:
https://inference.baseten.co/v1

Credential:
BASETEN_API_KEY

Never hardcode credentials.

## Storage

Begin with a simple, controlled local artifact-storage strategy for the MVP.

Store uploads, normalized analysis, generated specifications and execution evidence outside publicly served directories.

Introduce a database only when actual persistence or concurrent workflow requirements justify it.

## Open architectural questions

- Supported recording formats and size limits
- Baseten video request format and sampling limits
- Whether video preprocessing is required
- How evidence references map to assertions
- Safe Playwright runner process isolation
- Run lifecycle and artifact retention
- Persistence strategy for multiple investigations

Resolve these through implementation research and small technical spikes.
