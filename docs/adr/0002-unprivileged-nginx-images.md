# 2. Unprivileged nginx on 8080 for both web images

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

The site is served by two containers: the app container (static files) and the
edge proxy (TLS-terminated traffic arriving from the Cloudflare Tunnel).

Conventional nginx images start as root so they can bind port 80 and write
their own PID file. Neither is required here, and running web-facing
containers as root enlarges the blast radius of any compromise.

Security headers, the real client IP, and the site-wide health endpoint also
need exactly one owner — otherwise two configs drift.

## Decision

- Both images are built on `nginxinc/nginx-unprivileged:1.27-alpine`, which
  runs as a non-root user and listens on **8080**.
- Production drops all Linux capabilities from both containers
  (`cap_drop: [ALL]`).
- The **edge** owns every site-wide concern: security headers (including the
  strict CSP), `CF-Connecting-IP` handling, and `/healthz`.
- The **app** container is a plain static file server. It sets only its own
  cache policy on `/assets/` and `/index.html` and serves its own `/healthz`
  for `HEALTHCHECK` and `depends_on: service_healthy`.

## Consequences

- A single upstream (`web:8080`) and a single published port (`8080`) are
  correct in every environment; there is no dev/prod divergence.
- New security headers belong in `nginx/nginx.conf` only. Adding one to
  `web/nginx.conf` would apply it inconsistently.
- The page ships no inline `<script>` or `<style>`, which is what makes the
  strict `script-src 'self'; style-src 'self'` CSP possible. Anything that
  introduces inline code — including a 404 page — must ship as a separate
  file (see `web/src/public/404.css`).
- Host port mappings must target container port 8080, not 80.
