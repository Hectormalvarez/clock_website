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

### Housekeeping branch `chore/repo-housekeeping` (→ PR into `dev`)

- HK-1 README corrections, HK-2 Actions bump to Node-24 majors
  (checkout@v7, setup-node@v7, buildx@v4, login@v4, build-push@v7,
  hadolint-action@v3.5.0), HK-3 husky lint-staged guard, HK-4 memory bank
  init, plus US-001 sprint close-out (this file).
- All committed on the branch; local `main` reset to `origin/main` after the
  rebase-merge rewrote SHAs.

## Ready (not started)

Nothing. Next sprint content comes from the backlog once the owner picks the
next epic: US-002 (recurring alarms) vs US-004 (multi-clock).

## Dependencies & sequencing

- US-002 can start any time — builds directly on the alarm core.
- US-003 (review follow-ups) is independent; best bundled with US-002 or
  US-004.
- US-004 should wait for US-003 item 1 (shared FLIP helper) and needs a PO
  story + possibly an ADR.
- HK-5 (nginx 1.27 re-pin, see backlog) is independent of the epics.

## Risks

| Risk                                                    | Likelihood | Impact                  | Mitigation                        |
| ------------------------------------------------------- | ---------- | ----------------------- | --------------------------------- |
| Production alarm audio unverified                       | Medium     | Medium (US-001 DoD gap) | Owner manual check; tracked above |
| nginx 1.27 base gets no security updates (EOL mainline) | High       | Medium                  | HK-5: re-pin to current stable    |
| Edge cache hides new deploys for up to 2 h              | By design  | Low                     | Judge freshness via `/healthz`    |
