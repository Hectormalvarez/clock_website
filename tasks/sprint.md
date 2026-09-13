# Sprint — Current

Sprint window: active (no fixed calendar sprint; pipeline-driven).

## Completed (pending final QA)

### US-001 — Multiple Alarms (Epic: Alarms)

- Status: **MERGED + DEPLOYED.** PR #13 merged 2026-09-13 21:17Z (linear
  history, 9 commits).
- Release run #5 succeeded 21:18Z; webhook deploy fired; `/healthz` verified
  HTTP 200 post-deploy.
- Remaining DoD: manual browser check that the alarm tone plays (audio cannot
  be verified in jsdom) — owner task. Then story status → Done.
- Note: the homepage may serve up to 2 h of edge cache (ADR 0006); judge
  deploy freshness via `/healthz` or hashed assets, not the cached HTML.

## In flight

Nothing. Housekeeping (HK-1..HK-4 + US-001 close-out) merged via PR #14
(rebase, 2026-09-13 21:47Z; Release run #6 deployed; healthz 200).

## Ready (not started)

Next sprint content comes from the backlog once the owner picks the next
epic: US-002 (recurring alarms) vs US-004 (multi-clock). HK-5/HK-6 are
standalone housekeeping candidates.

## Dependencies & sequencing

- US-002 can start any time — builds directly on the alarm core.
- US-003 (review follow-ups) is independent; best bundled with US-002 or
  US-004.
- US-004 should wait for US-003 item 1 (shared FLIP helper) and needs a PO
  story + possibly an ADR.
- HK-5 (nginx 1.27 re-pin, see backlog) is independent of the epics.

## Risks

| Risk                                                                                      | Likelihood | Impact                                        | Mitigation                                   |
| ----------------------------------------------------------------------------------------- | ---------- | --------------------------------------------- | -------------------------------------------- |
| Production alarm audio unverified                                                         | Medium     | Medium (US-001 DoD gap)                       | Owner manual check; tracked above            |
| Stale edge HTML references dead assets after each deploy; cached 404s extend the breakage | High       | Medium (broken homepage up to 2 h per deploy) | HK-6: purge, asset retention, or shorter TTL |
| nginx 1.27 base gets no security updates (EOL mainline)                                   | High       | Medium                                        | HK-5: re-pin to current stable               |
