# Active Context

Updated: 2026-09-14

## Current focus

**US-002 — implemented on `feat/us-002-recurring-alarms`** (off `main`):
daily-repeat alarms. Persisted `repeat` + `lastRungDay` on `Alarm`
(schema-additive — legacy JSON normalizes to one-shot, no migration). Ring
consumes the local calendar day (`lastRungDay`), fixing a design hole found
during planning: without it, a dismiss mid-grace-window or a reload would
re-ring a repeat alarm. Toggling clears both markers (re-arms from the
configured time). UI: "Daily" checkbox in the create form, monochrome ↻
row indicator (`role="img"` + aria-label). Weekday scheduling is recorded
as future work in the story (§6) — `repeat: true` reads as "all days" for
that future widening.

- Verified: 152/152 unit tests (12 new), `make check` green, 7/7 Playwright
  assertions, 2 screenshots in the story folder.
- Same session: HK-6 (PR #16) and HK-5 (PR #17, nginx → 1.30-alpine stable)
  merged and deployed.

## Environment state

- Branch `feat/us-002-recurring-alarms` = main + 4 commits (story, core,
  UI, close-out). All housekeeping HK-1…HK-6 done; US-003 absorbed.
- Playwright tooling still in `/tmp/ux-shots/` (not a repo dependency).

## Next steps

- Owner: review + merge the US-002 PR → `main` (rebase; ruleset requires
  PRs), then verify the repeat alarm rings live.
- Owner: audible alarm-tone check (US-001) and visual pass on prod (US-005)
  — both still open.
- Then: US-004 multi-clock epic, run individually per owner decision —
  needs a PO story defining "a clock" + likely an ADR before starting.
