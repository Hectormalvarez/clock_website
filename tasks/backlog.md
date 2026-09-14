# Backlog

Prioritized candidate work. Items here are NOT committed to a sprint until moved
to `tasks/sprint.md`. New items enter via the Product Owner (user story) and are
sized/sequenced by the SDM.

## Epic: Alarms

### US-002 — Recurring (daily-repeat) alarms

- Status: Candidate — needs a user story from the Product Owner before work.
- Source: MVP cut recorded in US-001 ("Out of Scope": daily-repeat alarms).
- Priority: **Deprioritized behind US-005** (owner decision 2026-09-13) —
  still the most requested natural follow-up to US-001.
- Dependencies: none (builds directly on the US-001 alarm core).

## Epic: Multi-clock

### US-004 — Wire up the multi-clock registry

- Status: Candidate — `clock-registry.ts` scaffold exists but is not wired.
- Source: README ("Multi-clock scaffold — not wired up yet"); recommended as
  a major epic after the Alarms epic.
- Dependencies: the shared FLIP helper (formerly US-003 item 1) is DONE via
  US-005 (`shared/dom/flip.ts`) — the sequencing blocker is cleared.
- Note: likely requires an ADR if the page layout/composition root changes
  meaningfully, plus a Product Owner story defining what a "clock" is.

## Housekeeping (backlog, non-story)

### HK-5 — Re-pin the nginx base image off the EOL 1.27 branch

- Status: Candidate (found 2026-09-13 during the repo date/staleness audit).
- Finding: `nginxinc/nginx-unprivileged:1.27-alpine` was last built
  2025-06-23; the 1.27 mainline stopped shipping when 1.29 released, so the
  edge and prod images run an unmaintained branch. The digest pin itself is
  current for the tag — the staleness is at the version level.
- Requires: choose the current nginx stable branch, bump tag + digest
  together (ADR 0005) in `web/Dockerfile.prod` and `nginx/Dockerfile`, update
  the image tag in `.github/workflows/ci.yml` (nginx-config-check), and run
  `nginx -t` locally on both configs.
- Priority: Medium — security updates are accruing on the EOL branch.
