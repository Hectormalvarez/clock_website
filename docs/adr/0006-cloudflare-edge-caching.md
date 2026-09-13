# 6. Cloudflare edge-caches the HTML document with a short TTL

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

- `web/nginx.conf` sends `Cloudflare-CDN-Cache-Control: max-age=600` on
  `location = /index.html`, in addition to the existing `Cache-Control:
  no-cache`.
- Cloudflare evaluates `Cloudflare-CDN-Cache-Control` for its own caching
  decisions and never sends it downstream; `Cache-Control` still governs the
  browser and is proxied as-is. Net effect: the edge serves the document
  without touching the origin for 10 minutes, while every browser still
  revalidates on each visit (answered by the edge with a 304, via the existing
  `ETag`/`Last-Modified`).
- The TTL is deliberately short (10 minutes) because **there is no deploy-time
  cache purge**. Purging would require storing Cloudflare API credentials on
  the server or as a repository secret; a bounded 10-minute staleness window
  after a deploy was judged the better trade-off.
- `/healthz` is served with `Cache-Control: no-store` in **both** nginx
  configs, so no intermediary can ever serve a cached `ok` from a stack that
  is actually down.

## Alternatives considered

- **Deploy-time purge via the Cloudflare API** — the textbook pattern (long
  TTL + purge on deploy). Rejected: requires `CLOUDFLARE_ZONE_ID` +
  `CLOUDFLARE_API_TOKEN` on the server or in repo secrets, and the deploy
  pipeline's only success signal is the webhook's HTTP 200, which does not
  reliably prove the swap finished.
- **`s-maxage` on `Cache-Control`** — Cloudflare honours it, but it implies
  `proxy-revalidate` semantics, which forecloses stale-serving behaviour and
  couples the edge TTL back into the browser-visible header.
- **A Cache Rule with an explicit Edge TTL** — works, but on the Free plan the
  minimum configurable Edge Cache TTL is 2 hours, and the policy would live in
  the dashboard instead of in version control.

## Consequences

- After a deploy, visitors can receive the previous HTML for at most 10
  minutes. Because nothing is purged, old hashed assets remain edge-resident,
  so even a stale HTML document still resolves its assets; the residual risk
  is limited to an old asset being evicted from a data center's cache.
- Origin load drops to roughly one HTML fetch per TTL expiry per data center,
  with Cloudflare's cache lock collapsing concurrent misses.
- **No Cloudflare credentials exist in this repository, on the server, or in
  CI.** Any future change that reintroduces purging must revisit this ADR.
- Verification after deploy: `curl -sI https://<site>/` should show
  `cf-cache-status: HIT` on a repeat request, while `/healthz` must always
  show `DYNAMIC`. If the HTML never leaves `DYNAMIC`, the header is not being
  honoured — fall back to a Cache Rule with a 2-hour Edge TTL.
