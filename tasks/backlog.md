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

### HK-6 — Eliminate the stale-HTML / dead-asset window after deploys

- Status: Candidate (observed live 2026-09-13 ~22:00Z).
- Finding: after a deploy that changes asset hashes, the edge-cached homepage
  (2 h Cache Rule TTL, per ADR 0006) references assets that no longer exist
  on origin; requests 404, and **Cloudflare caches the 404 itself**
  (`cf-cache-status: HIT` on a 404). Until the HTML entry expires, the
  homepage is broken. ADR 0006's assumption that old hashed assets remain
  edge-resident does not hold in practice.
- Fix candidates (pick one, or combine):
  1. Purge the CF cache after a successful deploy (needs a CF API token —
     scope decision + secret management).
  2. Retain the previous build's `assets/` on origin in `scripts/deploy.sh`
     so old hashes keep resolving (simplest, no CF dependency).
  3. Shorten the HTML Edge TTL (e.g. 5-10 min) to shrink the window.
  - Also consider making builds hash-deterministic for unchanged code.
- Priority: Medium-High — every deploy currently risks a broken homepage for
  up to 2 h.
