# 7. Retain the previous release's assets on origin as a fallback

- **Status:** Accepted
- **Date:** 2026-09-14
- **Amends:** ADR-0006 (invalidates one of its assumptions)

## Context

ADR-0006 accepted a bounded staleness window after each deploy on the
assumption that _"old hashed assets remain edge-resident, so even a stale
HTML document still resolves its assets"_. That assumption was **observed to
fail in practice on 2026-09-14**: after a deploy, Cloudflare served the
still-cached homepage (Edge TTL 2 h), but requests for the asset hashes the
old HTML referenced returned **404 — and Cloudflare cached the 404 itself**
(`cf-cache-status: HIT` on the 404 response). For up to 2 h after every
deploy, the homepage was broken for edge-cached visitors. This happened on
two consecutive deploys the same day.

The assets are baked into the `web` image (ADR-0001/0002), so when the
container is swapped, the old hashes stop existing **on origin** — the edge
cannot re-fetch them, and any miss becomes a permanent 404 for that hash.

## Decision

Keep the previous release's assets servable on origin:

1. **`scripts/deploy.sh` (step 3b, before the container swap):** stream the
   running web container's `/usr/share/nginx/html/assets` into
   `.prev-assets/assets/` on the checkout via
   `docker compose exec -T web tar … -cf - . | tar -xf -`. The `.` (contents)
   form can never nest a duplicate `assets/` level; re-runs accumulate
   hashes from earlier releases (~20 KB per deploy — negligible). The step
   is best-effort: with no previous web container (first deploy), it logs
   and continues.
2. **`docker-compose.prod.yml`:** the web service bind-mounts
   `./.prev-assets` read-only at `/usr/share/nginx/html-prev`. The
   relative-path source resolves identically on the host and inside the
   webhook container (same mechanism as the existing `nginx.conf` mount).
3. **`web/nginx.conf`:** `location /assets/` uses
   `try_files $uri @prev_assets`; the named location serves from
   `/usr/share/nginx/html-prev` with the same immutable cache headers.
   Hashes present in the new build always win; only hashes missing from it
   fall back.

The first deploy after this ADR merges still runs the _old_ in-memory
deploy.sh (the webhook executes the script before it re-pulls), so the
fallback becomes fully populated from the **second** deploy onward. From
then on, a deploy no longer requires a Cloudflare purge to keep the site
whole.

## Alternatives considered

- **Deploy-time purge via the Cloudflare API** — rejected, consistent with
  ADR-0006: requires `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_API_TOKEN` on the
  server or in repo secrets.
- **Shorter Edge TTL in the Cache Rule** — the 2 h TTL is already the
  Free-plan floor, and shortening it only shrinks (never closes) the window
  while raising origin load.
- **Deterministic content hashing** — helps only when the code didn't
  change; any real change still rewrites the hashes.

## Consequences

- A stale edge-cached homepage always resolves its assets; the HK-6
  breakage window is closed without Cloudflare credentials.
- The host accumulates `.prev-assets/` (~20 KB per deploy, gitignored).
- Untrusted/unknown paths under `/assets/` still 404 (through the fallback
  chain), keeping the honest-404 behaviour of ADR-0002's error page design.
- Rollbacks are unaffected: the restored old image serves its own assets
  natively; the fallback is simply dormant.
