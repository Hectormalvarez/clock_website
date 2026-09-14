# Active Context

Updated: 2026-09-14

## Current focus

**HK-6 — implemented on `fix/hk6-asset-retention`** (off `main`): the
stale-HTML/dead-asset window after deploys is closed via previous-release
asset retention (ADR-0007). deploy.sh step 3b streams the old web
container's assets into `.prev-assets/` (tar contents-form — the `docker
cp src/. dst/` form NESTS, do not use); compose bind-mounts it ro at
`/usr/share/nginx/html-prev`; `web/nginx.conf` `try_files $uri
@prev_assets` fallback serves old hashes with immutable headers.

- Verified locally: `sh -n`, both `compose config -q`, `nginx -t` on both
  configs, functional docker test (old hash 200 via fallback, unknown 404).
- Sandbox gotcha: this environment's docker bind mounts can show STALE
  container views of host dirs (caused a long nesting-wild-goose-chase —
  the data was polluted by an earlier root-owned `docker cp`, and the
  container saw content the host didn't have). Trust host-side `find` over
  container `ls` here.
- First deploy after merge runs the old in-memory deploy.sh; fallback is
  fully populated from the second deploy onward (in ADR-0007).

## Environment state

- Branch `fix/hk6-asset-retention` = main + 3 commits (code, ADRs, tasks).
  `dev` has sprint-tracking commit `54edefa` that main lacks — this branch's
  sprint.md rewrite reconciles them on merge.
- `make check` green (140 tests); pure cores untouched by HK-6.

## Next steps

- Owner: review + merge HK-6 PR → `main`; next deploy needs NO manual CF
  purge from the second deploy on.
- Owner: audible alarm-tone check (US-001) and visual pass on prod (US-005)
  — both still open.
- Pick next epic: US-004 (needs PO story + likely ADR) vs US-002 (needs PO
  story). HK-5 (nginx re-pin) is the remaining housekeeping item.
