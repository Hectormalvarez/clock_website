# Progress

## Status

US-001 (Multiple Alarms) is **deployed to production** (PR #13 merged
2026-09-13 21:17Z; Release run #5 succeeded; `healthz` verified 200).
Site is live at `clock.taylormadetech.net`.

## What works

- Clock (tick, title mirror, timezone), timer (presets, persistence, beep),
  alarms (multi, snooze, persistence, ring overlay) — 135 unit tests green.
- Full CI gate: prettier, eslint, typecheck, vitest+coverage, build,
  `nginx -t` × 2, compose config × 2, hadolint × 4.
- Automated deploys: `main` → GHCR → webhook → swap with auto-rollback.
- Cloudflare edge caching of `index.html` (2 h Cache Rule; `/healthz`
  uncacheable) per ADR 0006.

## Remaining / known issues

- Production audio QA: alarm tone not yet verified by a human (jsdom can't
  test audio) — last open US-001 DoD item.
- **Stale-HTML → dead-asset window after every deploy** (HK-6): a rebuild can
  change asset hashes; the 2 h edge-cached homepage then references assets
  that 404 on origin, and the 404 gets edge-cached too (observed 2026-09-13).
  Fix candidates: CF API purge post-deploy, retain old assets in `deploy.sh`,
  or shorter HTML TTL.
- Edge-cached homepage can lag up to 2 h behind a deploy (expected; judge
  freshness via `/healthz` or a query-string cache-bust, which works).
- CI actions pinned to Node-20-runtime majors (HK-2 — fix in progress).
- `nginxinc/nginx-unprivileged:1.27-alpine` is an EOL mainline branch
  (HK-5 candidate: re-pin to current stable + digest).
- npm minor drift: eslint/prettier/lint-staged/TS patch bumps available;
  vite 7+/vitest 5 majors deliberately deferred (not housekeeping).
- Multi-clock scaffold (`clock-registry.ts`) unwired (backlog US-004).
- FLIP helper duplicated in timer/alarm UI (backlog US-003).

## Next epic decision (owner)

US-002 recurring alarms vs US-004 multi-clock (US-004 wants US-003 item 1
first). See `tasks/backlog.md` + `tasks/sprint.md`.
