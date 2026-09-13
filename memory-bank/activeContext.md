# Active Context

Updated: 2026-09-13

## Current focus

**Repo housekeeping — DONE on branch `chore/repo-housekeeping`**
(5 commits off `dev`, awaiting PR into `dev` + review):

1. ✅ Memory bank initialized (HK-4).
2. ✅ README corrections (HK-1): `robots.txt` removed from `src/public/` tree,
   build-time generation note added, alarm storage test added to tests tree,
   `tasks/` added to the repo-layout table.
3. ✅ Actions bump (HK-2): checkout@v7, setup-node@v7, setup-buildx@v4,
   login@v4, build-push@v7, hadolint-action@v3.5.0. All four Dockerfiles
   pre-validated locally with hadolint 2.15.1 (repo config: only info-level
   DL3059 in the webhook image).
4. ✅ Husky guard (HK-3): hook skips lint-staged unless staged files match
   `^web/.*\.(ts|js|json|css|md)$`; verified silent on yml- and md-only
   commits (noise previously confirmed on both).
5. ✅ `tasks/` close-out: US-001 marked merged+deployed (Release #5,
   healthz 200); HK-1..4 removed; HK-5 (nginx 1.27 EOL re-pin) added as a
   backlog candidate.

## Environment state

- `chore/repo-housekeeping` = dev + 5 commits; `dev` = `origin/dev` = `223d41f`.
- Local `main` = `origin/main` = `c7ecdca` (post-rebase-merge sync).
- US-001 deployed; homepage edge cache may lag up to 2 h.

## Next steps

- Open PR `chore/repo-housekeeping` → `dev`; merge (no production risk —
  workflow changes ride CI on next dev push).
- Owner: production audio check (alarm tone) → US-001 fully Done.
- Pick next epic: US-002 (recurring alarms) vs US-004 (multi-clock).
- Schedule HK-5 (nginx 1.27 → current stable, tag + digest together).
