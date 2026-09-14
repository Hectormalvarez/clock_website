# 6. Cloudflare edge-caches the HTML document via a zone Cache Rule

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

The app is three requests: the HTML document, one CSS bundle and one JS bundle.
The bundles carry content-hashed filenames and `Cache-Control: public,
immutable`, so Cloudflare's edge already caches them. The HTML document,
however, is served `Cache-Control: no-cache` — and Cloudflare's documented
default is **not** to cache a resource whose origin sends `no-cache`.

That means every page view traverses the tunnel to the origin, even though the
two files the HTML references are served from the edge. The most expensive hop
(a home server behind a tunnel) is paid on every request.

The `no-cache` policy itself is correct for browsers: the HTML references
`index-<hash>.js`, and a stale HTML file would point at hashes that no longer
exist. The tension is that browsers and the Cloudflare edge need *different*
instructions, and `Cache-Control` alone gives both caches the same one.

## Decision

- The **origin** keeps `Cache-Control: no-cache` on `location = /index.html`
  (`web/nginx.conf`), so every browser revalidates on each visit (answered at
  the edge with a 304, via the existing `ETag`/`Last-Modified`).
- The **edge** caches the document via a zone **Cache Rule**: hostname
  `clock.taylormadetech.net`, URI path in `{/, /index.html}`, cache
  eligibility *Eligible for cache*, **Edge TTL 2 hours** (the Free-plan
  floor). The rule lives in the dashboard because origin headers cannot
  express it on this plan (see Alternatives); `/healthz` is deliberately not
  matched, so health checks can never be served from cache.
- **There is no deploy-time cache purge.** Purging would require storing
  Cloudflare API credentials on the server or as a repository secret; a
  bounded 2-hour staleness window after a deploy was judged the better
  trade-off.
- `/healthz` is served with `Cache-Control: no-store` in **both** nginx
  configs, so no intermediary can ever serve a cached `ok` from a stack that
  is actually down.

## Alternatives considered

- **`Cloudflare-CDN-Cache-Control` from the origin** — the first attempt
  (`max-age=600` in `web/nginx.conf`). Documented as edge-only and
  browser-invisible, but **empirically ignored on the Free plan**: the header
  left the origin correctly and `cf-cache-status` stayed `DYNAMIC` on repeated
  requests. The header was removed; if the plan is ever upgraded, revisit
  this ADR and move the policy back into version control.
- **Deploy-time purge via the Cloudflare API** — the textbook pattern (long
  TTL + purge on deploy). Rejected: requires `CLOUDFLARE_ZONE_ID` +
  `CLOUDFLARE_API_TOKEN` on the server or in repo secrets, and the deploy
  pipeline's only success signal is the webhook's HTTP 200, which does not
  reliably prove the swap finished.
- **`s-maxage` on `Cache-Control`** — Cloudflare honours it, but it implies
  `proxy-revalidate` semantics, which forecloses stale-serving behaviour and
  couples the edge TTL back into the browser-visible header.

## Consequences

- After a deploy, visitors can receive the previous HTML for at most **2
  hours** (the Free-plan Edge TTL floor). ~~Because nothing is purged, old
  hashed assets remain edge-resident, so even a stale HTML document still
  resolves its assets; the residual risk is limited to an old asset being
  evicted from a data center's cache.~~
  **Amended 2026-09-14 (ADR-0007):** this assumption failed in practice —
  old hashes were evicted on origin at every container swap and Cloudflare
  cached the resulting 404s, breaking the homepage for up to 2 h per
  deploy. ADR-0007 keeps the previous release's assets servable on origin,
  closing the window.
- Origin load drops to roughly one HTML fetch per TTL expiry per data center,
  with Cloudflare's cache lock collapsing concurrent misses.
- **No Cloudflare credentials exist in this repository, on the server, or in
  CI.** Any future change that reintroduces purging must revisit this ADR.
- The cache policy is split between this repo (browser behaviour, in
  `web/nginx.conf`) and the dashboard (edge behaviour, the Cache Rule). If
  the zone is ever migrated, recreate the rule per the Decision section.
- Verification after deploy: `curl -sI https://<site>/` should show
  `cf-cache-status: HIT` on a repeat request, while `/healthz` must always
  show `DYNAMIC`.
