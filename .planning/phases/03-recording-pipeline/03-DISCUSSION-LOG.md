# Phase 3: Recording Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 3-Recording Pipeline
**Areas discussed:** capture architecture, stop signals, resilience, transcoding boundary

---

## Outcome

- Keep roadmap order as defined.
- Use offscreen-driven recording and transcoding from day one.
- Treat `gsd:done` as contractual primary signal with timeout fallback.
- Prioritize stable MP4 output contract over optimization.

## Explicit Non-Goals

- No publishing automation in this phase.
- No platform selector work in this phase.
- No expanded aspect-ratio support in this phase.

## Rationale

Phase 3 is the highest technical risk for the product loop. Shipping a robust recording pipeline first de-risks Phase 4 and keeps the architecture aligned with MV3 constraints.