# Sprint — Current

Sprint window: active (no fixed calendar sprint; pipeline-driven).

## Completed

### US-001 — Multiple Alarms (Epic: Alarms)

- Status: **MERGED + DEPLOYED** (PR #13, 2026-09-13 21:17Z). Release run #5 →
  webhook deploy → `/healthz` 200.
- Remaining DoD: manual browser check that the alarm tone plays (audio cannot
  be verified in jsdom) — owner task. Then this entry is deleted.

### US-005 — UX Polish & Accessibility Hardening

- Status: **MERGED + DEPLOYED** (PR #15 rebase-merged into `main`,
  2026-09-14; Release run succeeded → deploy verified on origin via fresh
  asset hashes + US-005 markers in the served bundle/CSS; `/healthz` 200).
- All 8 ACs verified pre-merge (140 unit tests, 20/20 Playwright a11y
  assertions, computed contrast table, 14 before/after screenshots in
  `docs/stories/US-005/screenshots/`).
- Absorbed US-003 items 1–3 (shared FLIP helper, ring-overlay outside-click
  guard, panel focus management) — **US-003 is closed**.
- Remaining DoD: owner visual pass on the live site — a human eyeball on
  prod is the last gate; rollback via revert PR if anything regressed.

### HK-6 — Eliminate the stale-HTML/dead-asset window after deploys

- Status: **IMPLEMENTED on `fix/hk6-asset-retention`** (off `main`) —
  previous-release assets retained on origin per **ADR-0007**: deploy.sh
  step 3b streams the old container's `/assets` into `.prev-assets/`
  (accumulative), the web service bind-mounts it read-only, and
  `web/nginx.conf` falls back to it for hashes missing from the new build.
- Verified locally: `sh -n`, both `docker compose config -q` runs, `nginx
-t` on both configs, and a functional docker test — old-hash asset serves
  **200 with immutable headers** from the fallback, new assets 200, unknown
  404, `/` and `/healthz` unaffected.
- Note: the first deploy after merge still runs the old in-memory deploy.sh;
  the fallback is fully populated from the second deploy onward (recorded in
  ADR-0007).

## In flight

Nothing — pipeline is empty pending owner decisions.

## Ready (not started) — needs owner pick

| #   | Item                                          | Type                    | Dependencies                                                                                                    | Notes                                                         |
| --- | --------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | **US-004** — wire up the multi-clock registry | Epic                    | FLIP blocker cleared by US-005; needs PO story defining "a clock" + likely ADR (layout/composition-root change) | Was deprioritized behind US-005; now unblocked.               |
| 2   | **US-002** — recurring (daily-repeat) alarms  | Story                   | none (builds on alarm core)                                                                                     | Needs a PO user story before work.                            |
| 3   | **HK-5** — re-pin nginx off EOL 1.27 branch   | Housekeeping (security) | none                                                                                                            | Medium; security updates accruing on the unmaintained branch. |

## Dependencies & sequencing

- US-002 and US-004 are independent of each other; either can be next.
- HK-5 is fully standalone; can slot into any gap.

## Risks

| Risk                                                                       | Likelihood | Impact                                       | Mitigation                                   |
| -------------------------------------------------------------------------- | ---------- | -------------------------------------------- | -------------------------------------------- |
| Production alarm audio unverified                                          | Medium     | Medium (US-001 DoD gap)                      | Owner manual check; tracked above            |
| nginx 1.27 base gets no security updates (EOL mainline)                    | High       | Medium                                       | HK-5: re-pin to current stable               |
| US-005 sign-off without a human look at prod                               | Low        | Low (aesthetic regressions screenshots miss) | Owner visual pass; rollback via revert PR    |
| HK-6 fallback unproven on the real host until the second post-merge deploy | Low        | Low (old behaviour = broken window recurs)   | Owner: verify next deploy via old-hash asset |
