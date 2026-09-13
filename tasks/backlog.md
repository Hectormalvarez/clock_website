# Backlog

Prioritized candidate work. Items here are NOT committed to a sprint until moved
to `tasks/sprint.md`. New items enter via the Product Owner (user story) and are
sized/sequenced by the SDM.

## Epic: Alarms

### US-002 — Recurring (daily-repeat) alarms

- Status: Candidate — needs a user story from the Product Owner before work.
- Source: MVP cut recorded in US-001 ("Out of Scope": daily-repeat alarms).
- Priority: High — most requested natural follow-up to US-001.
- Dependencies: none (builds directly on the US-001 alarm core).

### US-003 — Alarm ergonomics follow-ups

- Status: Candidate — small items culled from the US-001 code review (non-blocking).
- Contents:
  1. Extract the FLIP panel-open helper duplicated between timer.ui.ts and
     alarm.ui.ts into `shared/dom/` (refactor; both features keep behavior).
  2. Guard the document-level outside-click handler so the alarm panel does
     not close while the ringing overlay is up.
  3. Overlay focus management: move keyboard focus into the ring overlay
     when ringing starts (a11y pass).
- Priority: Medium — bundle with the next alarm-adjacent story or the
  multi-clock epic to avoid a dedicated PR.

## Epic: Multi-clock

### US-004 — Wire up the multi-clock registry

- Status: Candidate — `clock-registry.ts` scaffold exists but is not wired.
- Source: README ("Multi-clock scaffold — not wired up yet"); recommended as
  the next major epic after the Alarms epic.
- Dependencies: US-003 (shared FLIP helper) would reduce duplicated wiring.
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
