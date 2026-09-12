# Runbook: Cloudflare Tunnel

The host has no public IP and opens no inbound ports. All traffic arrives
through `cloudflared`, which dials out to Cloudflare and forwards requests to
the edge container.

```
visitor → Cloudflare edge → (outbound tunnel) → cloudflared → nginx:8080 (edge) → web:8080
```

## Create the tunnels

Use **two** tunnels — one for development, one for production.

1. In the Cloudflare dashboard, go to **Zero Trust → Networks → Tunnels** and
   create a tunnel.
2. Copy the connector token.
3. Add a **public hostname** and point its service at the edge container by
   name:

   ```
   Service: http://nginx:8080
   ```

   Point it at the edge, never at `web:8080`, or the security headers and the
   edge health endpoint are bypassed.

Do not reuse one token for both environments. Two connectors on the same
tunnel register as replicas and Cloudflare will load-balance visitors across
the dev and prod stacks.

## Configure the tokens

`.env` (development) and `.env.prod` (production) are both gitignored:

```bash
# .env — the dev connector, started by `make dev-tunnel-up`
CLOUDFLARE_TUNNEL_TOKEN=<dev tunnel token>

# .env.prod — the production connector, started by `make prod-deploy`
CLOUDFLARE_TUNNEL_TOKEN=<prod tunnel token>
```

## Run the development tunnel

The dev connector is behind the compose `tunnel` profile, so `make dev-up`
never starts it:

```bash
make dev-up            # web + nginx only
make dev-tunnel-up     # opt-in: adds cloudflared
make dev-tunnel-logs
make dev-tunnel-down
```

`dev-tunnel-up` refuses to run if `CLOUDFLARE_TUNNEL_TOKEN` is empty in `.env`.

## Run the production tunnel

`cloudflared` is a regular service in `docker-compose.prod.yml`, so it comes up
with the stack:

```bash
make prod-deploy
make prod-status
docker compose -p clock-prod logs -f cloudflared
```

If the token is missing, the stack refuses to start — the compose file uses
`${CLOUDFLARE_TUNNEL_TOKEN:?...}` for production, precisely so a
half-configured stack cannot come up silently.

## Expose the deploy webhook

`release.yml` needs to reach the `webhook` container. Add a **second public
hostname** on the production tunnel pointing at it:

```
Service: http://webhook:9000
Path:    ^/hooks/deploy$      (or restrict the hostname to this exact path)
```

Then set the repository secrets:

| Secret          | Value                                            |
| --------------- | ------------------------------------------------ |
| `WEBHOOK_URL`   | `https://<webhook hostname>/hooks/deploy`        |
| `WEBHOOK_TOKEN` | The same value as `WEBHOOK_TOKEN` in `.env.prod` |

Keep this hostname as narrow as possible. The webhook container mounts the
Docker socket and is therefore effectively root-equivalent on the host; the
token check in `webhook/hooks.json` is the only gate in front of it.

## Rotate a token

1. Generate a new token in the Cloudflare dashboard for that tunnel.
2. Update `.env` / `.env.prod`.
3. Restart just the connector:

   ```bash
   # production
   docker compose -p clock-prod --env-file .env.prod up -d cloudflared

   # development
   make dev-tunnel-down && make dev-tunnel-up
   ```

## Verify

```bash
# The connector should report a registered connection
docker compose -p clock-prod logs cloudflared | grep -i 'Registered tunnel connection'

# The stack behind it should be healthy
make prod-verify
```

If `prod-verify` passes but the public hostname fails, the fault is in
Cloudflare — the tunnel, DNS record, or public hostname service target — not in
the containers.
