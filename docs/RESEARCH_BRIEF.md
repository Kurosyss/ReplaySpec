# ReplaySpec — Research Brief

Status: Active research register.

## Research objectives

### Hackathon winners
Investigate relevant Meta hackathon and AI-agent hackathon winners.

For each:
- Product and problem
- What actually worked in the demo
- Use of Meta tooling
- Technical implementation
- Public repository or demo availability
- Judging strengths
- Lessons applicable to ReplaySpec

### Competitors
Investigate:
- Replay QA
- Jam
- Tester-Reporter-AI
- Bug0 QA Agent
- Stagehand
- mabl
- Other relevant browser-testing and bug-reproduction products

For every capability, distinguish verified functionality from marketing claims.

### Technical research
Verify current official documentation for:
- Baseten Muse Spark Open API
- Video input and limitations
- Structured response handling
- Playwright
- Next.js
- TypeScript
- Safe browser execution
- Evidence and trace collection

### Differentiation
ReplaySpec must establish a credible advantage beyond generic bug recording, AI summaries or Playwright generation.

Primary hypothesis:
External recording -> evidence-grounded observations -> validated regression specification -> deterministic execution -> verifiable outcome.

This hypothesis must be tested against current competitors before being described as unique.

## Decision record

Every major product or architecture decision should include:
- Decision
- Evidence
- Alternatives
- Trade-offs
- Implementation impact
- Whether it is final or provisional

## Meta Global AI Developer Hackathon — submission alignment (2026-11-03)

Official event page: https://dev.meta.ai/events/global-hackathon

- ReplaySpec appears to fit the **indie developer track** if submitted by an individual/student. The published criteria are creativity, technical ambition, and whether the project works. The event page names two themes: solving a problem from the builder's own domain and pushing the frontier with AI.
- The strongest fit is an evidence-grounded developer workflow: Muse analyses a real browser recording, claims stay tied to frames, and a constrained Playwright run verifies the expected behavior. More generic AI features would weaken this focus.
- The event page lists project submissions due **November 4, 2026 at 9:00 PM ET**, with judging November 4–8 and winners November 9; re-check the page before submission in case dates change.
- The event page says official participant rules are accepted by selected participants and links to an event waiver. These are participant requirements on the event portal; the page does not require adding copied hackathon rules or fabricated store legal links inside ReplaySpec. Keep product data-handling language accurate to the deployed environment before any public launch.
- Keep the Muse Spark Open integration. Meta's official Model API overview says Muse Spark Open can be called through a hosted inference provider, while the hosted Model API offers Muse Spark 1.3/1.2/1.1. Do not imply direct Meta Model API usage when the configured provider is Baseten; identify the provider accurately in the submission.
- Immediate acceptance bar: a short reliable demo, correct evidence for every benchmark, honest mock-product boundaries, clear judge-facing problem/solution, and reproducible verification. The public event page does not publish a more detailed judging scorecard.

Sources:

- Meta Global AI Developer Hackathon: https://dev.meta.ai/events/global-hackathon
- Meta Model API overview, Muse Spark and Muse Spark Open: https://dev.meta.ai/docs/overview
