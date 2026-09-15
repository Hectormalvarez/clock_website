# Active Context

Updated: 2026-09-15

## Current focus

**US-002 — merged (PR #18, rebase-merged into `main`).** Daily-repeat
alarms: persisted `repeat` + `lastRungDay` on `Alarm` (schema-additive —
legacy JSON normalizes to one-shot, no migration). Ring consumes the local
calendar day (`lastRungDay`), fixing a design hole found during planning:
without it, a dismiss mid-grace-window or a reload would re-ring a repeat
alarm. Toggling clears both markers (re-arms from the configured time).
UI: "Daily" checkbox in the create form, monochrome ↻ row indicator
(`role="img"` + aria-label). Weekday scheduling is recorded as future work
in the story (§6) — `repeat: true` reads as "all days" for that future
widening.

- Verified: 152/152 unit tests (12 new), `make check` green, 7/7 Playwright
  assertions, 2 screenshots in the story folder.

## Repo cleanup & workflow change (2026-09-15)

- All merged feature branches and `dev` deleted (local + origin) once PR
  #18 merged; only `main` remains.
- **`dev` is retired.** Since PR #14 practice has been feature branch →
  `main` via PR (rebase-merge, linear history). Work now branches from
  `main` and PRs into `main`; merging to `main` fires the automatic
  release deploy (GHCR → webhook).

## Environment state

- Single long-lived branch: `main`; no open PRs.
- Playwright tooling still in `/tmp/ux-shots/` (not a repo dependency).

## Next steps

- Owner: verify the repeat alarm rings live after this deploy (`/healthz`,
  then a cache-busted homepage).
- Owner: audible alarm-tone check (US-001) and visual pass on prod (US-005)
  — both still open.
- Then: US-004 multi-clock epic, run individually per owner decision —
  needs a PO story defining "a clock" + likely an ADR before starting.

