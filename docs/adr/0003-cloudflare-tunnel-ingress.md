# 3. Cloudflare Tunnel is the only ingress

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

The production host sits behind NAT and has no stable public address. Opening
inbound ports to the internet would require either port forwarding or a
reverse proxy on the host, plus certificate management, and would expose the
host directly.

## Decision

- A `cloudflared` container is the only path in. It dials out to Cloudflare, so
  the host needs **no inbound firewall rules**.
- The production stack publishes the edge on **loopback only**
  (`127.0.0.1:${PROD_VERIFY_PORT:-9418}:8080`). Nothing is reachable from the
  LAN or the internet except through the tunnel.
- The tunnel's public hostname targets the edge by service name:
  `http://nginx:8080`. It must never target the app container directly, or the
  security headers and health endpoint would be bypassed.
- Development and production use **different tunnels with different tokens**.
  The dev connector lives behind the compose `tunnel` profile and is started
  only by `make dev-tunnel-up`.

## Consequences

- `make prod-verify` exercises the exact path the tunnel uses
  (`http://127.0.0.1:9418`), so ingress can be checked without a browser.
- Because Cloudflare terminates TLS, the visitor's scheme arrives in
  `X-Forwarded-Proto` and the visitor's address in `CF-Connecting-IP`. The edge
  maps both; without the `CF-Connecting-IP` map, `X-Real-IP` would be the
  tunnel connector's own container address.
- Sharing one tunnel token between environments registers two connectors on the
  same tunnel and Cloudflare will load-balance visitors across the dev and prod
  stacks. `.env.sample` calls this out.
- `TUNNEL_TOKEN` is defaulted to empty in the dev compose file rather than
  `${VAR:?}`, because compose interpolates every service even when its profile
  is disabled; a required-variable guard would break `make dev-up`. The
  non-empty check lives in the `dev-tunnel-up` target instead.
