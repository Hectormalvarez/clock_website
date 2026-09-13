# Active Context

Updated: 2026-09-13 (post-merge)

## Current focus

**Housekeeping: MERGED.** PR #14 rebase-merged into `main` (7 commits,
`16dbbdd`); all four CI checks passed _on the bumped actions_; Release run #6
succeeded 21:47Z (images rebuilt, webhook deploy fired, `healthz` 200).

**Production verification (2026-09-13 ~22:05Z):**

- Fresh homepage (cache-busted via query string) serves the US-001 alarm
  build (`index-XH8wPmEB.js`, 200, alarm code present, 20 alarm refs in HTML).
- **Remaining manual DoD: audible alarm-tone check (needs a human ear).**

## Open finding: stale-HTML → dead-asset window (→ HK-6)

ADR 0006's assumption ("old hashed assets remain edge-resident so stale HTML
still resolves its assets") does NOT hold in practice:

- A rebuild changed asset hashes even though app code was unchanged; the
  edge-cached homepage (2 h TTL) referenced `index-CpV5GK4V.js`, which now
  404s on origin — and the 404 response itself got edge-cached (HIT).
- Until the HTML cache entry expires (~23:28Z), the cached homepage is
  broken. Query strings DO vary the cache key (cache-busting works).
- Fix candidates: CF API purge after deploy (needs API token), retain previous
  build's assets on origin in `deploy.sh`, or shorter HTML TTL. Logged as
  backlog HK-6.

## Environment state

- `dev` = `origin/dev` (223d41f + this doc commit); `main` = `origin/main`
  (16dbbdd). Housekeeping branch merged and deletable.
- Local `chore/repo-housekeeping` rebased onto main pre-merge; may be deleted.

## Next steps

- Owner: audible alarm-tone check → US-001 fully Done.
- Pick next epic: US-002 (recurring alarms) vs US-004 (multi-clock).
- Schedule HK-5 (nginx 1.27 EOL re-pin) and HK-6 (post-deploy cache purge or
  asset retention).
