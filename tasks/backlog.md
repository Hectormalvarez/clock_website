# Backlog

Prioritized candidate work. Items here are NOT committed to a sprint until moved
to `tasks/sprint.md`. New items enter via the Product Owner (user story) and are
sized/sequenced by the SDM.

## Epic: Multi-clock

### US-004 — Wire up the multi-clock registry

- Status: Candidate — **owner will schedule and run this individually**;
  deliberately deferred from the 2026-09-14 cleanup sprint as too heavy to
  batch.
- Source: README ("Multi-clock scaffold — not wired up yet"); recommended as
  a major epic after the Alarms epic.
- Dependencies: the shared FLIP helper (formerly US-003 item 1) is DONE via
  US-005 (`shared/dom/flip.ts`) — the sequencing blocker is cleared.
- Note: likely requires an ADR if the page layout/composition root changes
  meaningfully, plus a Product Owner story defining what a "clock" is.
