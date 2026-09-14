# Active Context

Updated: 2026-09-13 (evening)

## Current focus

**US-005 — UX polish & a11y hardening: implemented on `feat/us-005-ux-polish`**
(off `dev`), awaiting owner QA/review → PR into `dev`. Commits: story +
baseline shots → token layer → alarm redesign → timer normalization → a11y
wiring/FLIP → AA placeholder fix → focus-restore fix → verification record.

- Verify with the story's §6 record
  (`docs/stories/US-005-ux-polish-accessibility.md`): contrast table (all
  AA), 20/20 Playwright a11y assertions, 140 unit tests, before/after
  screenshots.
- Design decisions worth knowing: green/dark aesthetic kept; emoji glyphs
  replaced by inline SVG (`currentColor`); text-tier tokens replace the
  opacity soup (never use raw opacity for text); `panelHadFocus` pattern in
  both UI files because mousedown blurs before outside-click close runs;
  timer toggle renders icon + text span (never replace button content).
- Screenshot tooling lives in `/tmp/ux-shots/` (Playwright 1.63 — NOT a repo
  dependency): shoot.mjs (14-shot matrix), a11y.mjs (20 assertions),
  contrast.mjs (WCAG math). Vite dev server on :5173.

## Environment state

- Branch `feat/us-005-ux-polish` = dev + 8 commits; `dev`/`main` synced.
- `make check` green (140 tests). Vite dev server may still be running on
  :5173 (started for screenshots).

## Next steps

- Owner: review US-005 (screenshots + behavior), then PR into `dev` →
  `main` (rebase-merge; the ruleset requires PRs for `main`).
- Owner: audible alarm-tone check → US-001 fully Done.
- Pick next epic: US-002 (deprioritized) vs US-004 (blocker cleared by
  US-005's shared FLIP helper).
- Schedule HK-5 (nginx re-pin) / HK-6 (cache purge or asset retention).
