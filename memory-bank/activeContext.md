# Active Context

Updated: 2026-09-13

## Current focus

**Repo housekeeping** on branch `chore/repo-housekeeping` (off `dev`):

1. ✅ Initialize memory bank (this directory) — commit 1.
2. README corrections (HK-1): drop `robots.txt` from `src/public/` tree (it's
   build-time generated), note sitemap/robots generation, add alarm tests to
   the tests tree, add `tasks/` to the repo-layout table.
3. CI actions bump (HK-2): checkout@v7, setup-node@v7, setup-buildx@v4,
   login@v4, build-push@v7, hadolint-action@v3.5.0 (majors verified 2026-09-13).
4. Husky guard (HK-3): skip lint-staged when no staged file matches its globs
   (silences "could not find staged files" on workflow/env-only commits).
5. `tasks/` close-out: sprint.md reflects US-001 merged + deployed;
   backlog HK items resolved.

## Environment state

- `dev` = `origin/dev` = `223d41f`; local `main` reset to `origin/main`
  (`c7ecdca`, post-rebase-merge). Working tree clean.
- US-001 deployed (Release #5 success); homepage may serve up to 2 h of edge
  cache; `healthz` verified 200.

## Next steps after housekeeping

- Owner: production audio check (alarm tone) → US-001 fully Done.
- Pick next epic: US-002 (recurring alarms) vs US-004 (multi-clock).
- Decide HK-5 (nginx 1.27 re-pin) timing — Dockerfile + digest bump + local
  `nginx -t`.
