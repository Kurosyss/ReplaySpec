# AGENTS.md — ReplaySpec Engineering Rules

## Product identity
ReplaySpec is an evidence-grounded browser bug investigation and regression verification product.

Do not confuse it with Kuroish or other projects.

## Engineering approach
Use AI-Native Engineering, Test-Driven Development and Harness Engineering.

1. Inspect existing code and documentation before editing.
2. Understand the requested feature and its dependencies.
3. Plan small, independently verifiable implementation units.
4. Implement actual functionality, not placeholder interfaces.
5. Run relevant tests, lint and type checks.
6. Fix failures before declaring work complete.
7. Update relevant documentation when architecture or behaviour changes.

## Product principles
- Observations, user expectations and model hypotheses must remain separate.
- Important model claims must be traceable to evidence.
- Model output must be validated before entering the execution pipeline.
- Generated tests must use constrained, validated templates.
- Never execute arbitrary model-generated source code.
- Distinguish application defects from harness and infrastructure failures.
- Do not claim an integration works until it has been tested.

## Security
- Never commit API keys, tokens or credentials.
- Use server-side environment variables.
- Restrict initial browser execution to the bundled demo application.
- Do not execute arbitrary shell commands supplied by the model or user.
- Validate uploads, input schemas and target routes.
- Keep execution artifacts outside publicly served directories.

## Development standards
- Use TypeScript with strict typing.
- Prefer small, cohesive modules.
- Handle asynchronous failures and API errors explicitly.
- Avoid unnecessary dependencies.
- Preserve existing working functionality.
- Do not rewrite files wholesale without a reason.
- Add tests for important business logic.

## Verification
Before a feature is considered complete:
- Run relevant automated tests.
- Run TypeScript checks.
- Run ESLint.
- Run a production build when appropriate.
- Record any remaining limitations honestly.

## Project documentation
- docs/PRODUCT_SPEC.md defines product behaviour.
- docs/ARCHITECTURE.md defines system design.
- docs/QUALITY_GATES.md defines acceptance criteria.
- docs/RESEARCH_BRIEF.md records research questions and evidence requirements.
