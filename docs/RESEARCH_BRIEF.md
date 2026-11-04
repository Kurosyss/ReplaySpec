# ReplaySpec — Research Brief

Status: Research register; product integration decisions updated 2026-11-05.

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
- OpenRouter Meta Llama 4 Maverick vision API
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
- The strongest fit is an evidence-grounded developer workflow: Meta Llama 4 Maverick analyses selected frames from a browser recording, observations stay tied to source frames, and a constrained Playwright run verifies the expected behavior. More generic AI features would weaken this focus.
- The event page lists project submissions due **November 4, 2026 at 9:00 PM ET**, with judging November 4–8 and winners November 9; re-check the page before submission in case dates change.
- The event page says official participant rules are accepted by selected participants and links to an event waiver. These are participant requirements on the event portal; the page does not require adding copied hackathon rules or fabricated store legal links inside ReplaySpec. Keep product data-handling language accurate to the deployed environment before any public launch.
- **Model decision (2026-11-05):** use OpenRouter's `meta-llama/llama-4-maverick` multimodal endpoint for the submission. The endpoint is paid; a real one-image request returned structured analysis at a measured cost of $0.00058023. This is a Meta Llama model served through OpenRouter, not Meta Muse Spark and not a direct Meta-hosted API. Keep this distinction explicit in the pitch.
- Judge-facing acceptance bar: demonstrate the three benchmark defects, show frame-linked observations separately from expectations and hypotheses, run the constrained regression check, and explain the four verdicts. Avoid claiming general remote-site coverage, hosted persistence, or production payment processing.
- Immediate acceptance bar: a short reliable demo, correct evidence for every benchmark, honest mock-product boundaries, clear judge-facing problem/solution, and reproducible verification. The public event page does not publish a more detailed judging scorecard.

Sources:

- Meta Global AI Developer Hackathon: https://dev.meta.ai/events/global-hackathon
- Meta Model API overview, Muse Spark and Muse Spark Open: https://dev.meta.ai/docs/overview
