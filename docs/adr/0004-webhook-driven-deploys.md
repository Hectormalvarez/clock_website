# 4. Deploys are webhook-driven, not SSH-from-CI

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

CI publishes images to GHCR. Something then has to make the production host pull
the new tag and replace its containers. The candidates were:

1. SSH from a GitHub-hosted runner into the host.
2. A self-hosted runner on the host.
3. A small HTTP listener on the host that CI calls after publishing.

Options 1 and 2 put long-lived credentials (an SSH key, or a runner token) in
GitHub and require the host to accept inbound SSH from the internet. Since the
host is already reachable through the Cloudflare Tunnel, it can be told to
deploy over that existing path instead.

## Decision

- The `webhook` container runs `adnanh/webhook` with `webhook/hooks.json`.
- The `deploy` hook requires the literal `X-Webhook-Token` header to match
  `__WEBHOOK_TOKEN__`, which `webhook/webhook-entrypoint.sh` substitutes from the
  environment at startup. The token never lands on disk in cleartext form in
  the image.
- The hook executes `scripts/webhook-bridge.sh`, which forwards the request
  payload's `image_tag` and `ref` into `scripts/deploy.sh`.
- `scripts/deploy.sh` is the single deployment path. It is also what
  `make deploy-remote` runs over SSH for manual deploys, so CI and humans take
  the same code path.
- `deploy.sh` snapshots the currently running tags **before** touching
  anything, and restores them if the post-swap health check fails.
- `.github/workflows/release.yml` publishes images first, then POSTs to the
  webhook with the `sha-<commit>` tag. It is written but inert until the
  `WEBHOOK_URL` and `WEBHOOK_TOKEN` repository secrets exist.

## Consequences

- The webhook container needs `/var/run/docker.sock` and a mount of the host
  repository at the identical absolute path `/opt/clock_website`. The identical
  path matters: `deploy.sh` runs docker compose _inside_ this container, and
  relative bind-mount sources in the prod compose file must resolve to the same
  absolute paths on the host filesystem.
- Mounting the Docker socket is close to root-equivalent. The container is
  therefore kept off the public hostname except for the single hook path, and
  the token is the only thing standing in front of it.
- A deploy can be re-triggered by hand at any time (see the deployment runbook)
  without a new CI run, which is what makes rollback practical.
