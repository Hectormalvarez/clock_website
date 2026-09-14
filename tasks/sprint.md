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

- Status: **MERGED + DEPLOYED** (PR #16 rebase-merged 2026-09-14; Release
  succeeded, `/healthz` 200). Previous-release assets retained on origin
  per **ADR-0007**: deploy.sh step 3b streams the old container's `/assets`
  into `.prev-assets/` (accumulative), the web service bind-mounts it
  read-only, and `web/nginx.conf` falls back to it for hashes missing from
  the new build.
- Verified locally before merge: `sh -n`, both `docker compose config -q`
  runs, `nginx -t` on both configs, and a functional docker test — old-hash
  asset serves **200 with immutable headers** from the fallback.
- Note: this deploy itself ran the old in-memory deploy.sh; the fallback is
  fully populated from the second deploy onward (ADR-0007).

### HK-5 — Re-pin the nginx base image off the EOL 1.27 branch

- Status: **MERGED + DEPLOYED** (PR #17 rebase-merged 2026-09-14; Release
  run succeeded). Tag + manifest-list digest moved together (ADR-0005) to
  `nginxinc/nginx-unprivileged:1.30-alpine @ sha256:adf5042a…` — current
  stable **nginx 1.30.4**; both `ci.yml` `nginx -t` invocations re-pinned.
- Verified: local pull of the digest reports `nginx/1.30.4`; `nginx -t`
  passes on both configs against the new image; all four CI checks green.

## In flight

### US-002 — Recurring (daily-repeat) alarms

- Status: **IMPLEMENTED on `feat/us-002-recurring-alarms`** (off `main`) —
  story in `docs/stories/US-002-recurring-alarms.md` (MVP scope: daily
  repeat only; weekday scheduling recorded as future work in §6).
- Core: persisted `repeat` + `lastRungDay` flags; repeat alarms are never
  consumed by ringing (a rung occurrence is consumed per local calendar
  day, so a mid-grace-window dismiss or reload cannot re-ring); toggling
  re-arms from the configured time; legacy JSON loads as one-shot, no
  migration.
- UI: "Daily" checkbox in the create form; monochrome ↻ indicator
  (`role="img"`, aria-label "Repeats daily") on repeat rows only.
- Verified: **152/152 unit tests** (12 new), `make check` green, 7/7
  Playwright assertions (indicator on repeat rows only, flags persist,
  checkbox resets), 2 screenshots committed in the story folder.

## Ready (not started)

- **US-004** — wire up the multi-clock registry: the only remaining item.
  **Owner will run it individually** (deliberately deferred from this
  cleanup pass as too heavy to batch). Unblocked (FLIP helper done); needs
  a PO story + likely an ADR before work starts.

## Dependencies & sequencing

- Nothing queued behind US-002; US-004 is owner-scheduled.

## Risks

| Risk                                                                       | Likelihood | Impact                                       | Mitigation                                   |
| -------------------------------------------------------------------------- | ---------- | -------------------------------------------- | -------------------------------------------- |
| Production alarm audio unverified                                          | Medium     | Medium (US-001 DoD gap)                      | Owner manual check; tracked above            |
| US-005 sign-off without a human look at prod                               | Low        | Low (aesthetic regressions screenshots miss) | Owner visual pass; rollback via revert PR    |
| HK-6 fallback unproven on the real host until the second post-merge deploy | Low        | Low (old behaviour = broken window recurs)   | Owner: verify next deploy via old-hash asset |
