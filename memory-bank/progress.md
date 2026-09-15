# Progress

## Status

US-002 (recurring alarms) is **merged and deployed** (PR #18, rebase-merged
into `main` on 2026-09-15; merging fires the automatic release deploy).
Repo cleanup, same day: merged feature branches and `dev` deleted (local +
origin); `dev` is retired — work now branches from `main` and PRs into
`main` (rebase-merge, linear history). Site is live at
`clock.taylormadetech.net`. 152 unit tests green.

## What works

- Clock (tick, title mirror, timezone), timer (presets, persistence, beep),
  alarms (multi, snooze, persistence, ring overlay, **daily-repeat
  (US-002)**).
- **Design system (US-005):** semantic text-tier tokens (secondary 7.0:1,
  muted 5.2:1, placeholder 4.7:1 — never raw opacity for text), AA-safe
  danger `#ff6b6b`, global `:focus-visible` ring, monochrome inline-SVG
  icons, shared FLIP helper (`shared/dom/flip.ts`, reduced-motion aware),
  focus management + `aria-modal` ring overlay with Tab trap,
  `prefers-reduced-motion` global kill switch, `panelHadFocus` focus-restore
  pattern in both UI features.
- **Deploy resilience (HK-6, ADR-0007):** previous-release assets retained
  on origin (`.prev-assets/` bind mount + `@prev_assets` fallback), closing
  the stale-HTML/dead-asset window; no manual CF purges needed from the
  second post-merge deploy on.
- Full CI gate: prettier, eslint, typecheck, vitest+coverage, build,
  `nginx -t` × 2, compose config × 2, hadolint × 4; on modern action
  majors (HK-2).
- Automated deploys: `main` → GHCR → webhook → swap with auto-rollback.
- Cloudflare edge caching of `index.html` (2 h Cache Rule; `/healthz`
  uncacheable) per ADR 0006.

## Remaining / known issues

- Production audio QA: alarm tone not yet verified by a human (jsdom can't
  test audio) — last open US-001 DoD item.
- US-005 visual sign-off on prod still pending (owner eyeball).
- Edge-cached homepage can lag up to 2 h behind a deploy (expected; judge
  freshness via `/healthz` or a query-string cache-bust, which works).
- npm minor drift: eslint/prettier/lint-staged/TS patch bumps available;
  vite 7+/vitest 5 majors deliberately deferred (not housekeeping).
- Multi-clock scaffold (`clock-registry.ts`) unwired — **US-004, owner will
  run it individually**; needs a PO story defining "a clock" + likely an ADR.

## Next epic decision (owner)

US-004 multi-clock (deferred, owner-scheduled). See `tasks/backlog.md` +
`tasks/sprint.md`.
