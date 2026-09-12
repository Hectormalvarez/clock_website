# Runbook: deploy and roll back production

The production stack (`clock-prod`) is defined by `docker-compose.prod.yml` and
runs three long-lived containers:

| Service       | Role                                                             |
| ------------- | ---------------------------------------------------------------- |
| `web`         | Static app bundle served by unprivileged nginx on 8080           |
| `nginx`       | Edge proxy — security headers, `/healthz`, published on loopback |
| `cloudflared` | Cloudflare Tunnel connector (see the tunnel runbook)             |
| `webhook`     | Token-guarded deploy listener                                    |

## One-time setup

1. **Prepare the host** — run `scripts/bootstrap-host.sh` as root on a fresh
   Ubuntu host (installs Docker, adds swap on small instances, creates
   `/opt/clock_website`):

   ```bash
   sudo ./scripts/bootstrap-host.sh
   ```

2. **Clone the repository** into `/opt/clock_website`. The path matters: the
   webhook container mounts the repository at this identical absolute path.

3. **Create `.env.prod`** from `.env.sample` and fill in `WEBHOOK_TOKEN`
   (`openssl rand -hex 32`) and `CLOUDFLARE_TUNNEL_TOKEN`.

4. **Log in to GHCR** so the host can pull the images:

   ```bash
   echo "<PAT>" | docker login ghcr.io -u <github-user> --password-stdin
   ```

5. **Validate and start**:

   ```bash
   cd /opt/clock_website
   make env-check      # fails fast on an unset secret
   make prod-deploy
   make prod-verify
   ```

6. **Add the GitHub secrets** `WEBHOOK_URL` and `WEBHOOK_TOKEN` and add a
   production environment in the repository settings. Until both exist,
   `.github/workflows/release.yml` still publishes images but the `deploy` job
   cannot authenticate.

## Automated deploy

`.github/workflows/release.yml` triggers after CI succeeds on `main`:

1. Build and push `clock_website-web` and `clock_website-nginx` to GHCR, tagged
   both `latest` and `sha-<commit>` (with provenance and SBOM attestations).
2. POST to the webhook with `X-Webhook-Token: <token>` and
   `{"image_tag":"sha-<commit>","ref":"main"}`.
3. `webhook-bridge.sh` rejects any `ref` other than `main`, then calls
   `deploy.sh` with the requested tag.

`deploy.sh` sequence: snapshot current tags → `git pull --ff-only` → pull the
images → `up -d --remove-orphans` → health-check through the edge → prune (or
roll back and exit non-zero).

## Manual deploy

Useful when CI is unavailable, or to re-deploy without a new commit:

```bash
# from a workstation, over SSH
DEPLOY_HOST=clock.example.net make deploy-remote

# on the host
cd /opt/clock_website && IMAGE_TAG=sha-<commit> ./scripts/deploy.sh
```

`IMAGE_TAG` defaults to `latest`; pinning a `sha-` tag is what makes a deploy
reproducible.

## Verify

```bash
make prod-status     # container state
make prod-verify     # /healthz and / through the loopback port the tunnel uses
```

`prod-verify` checks `http://127.0.0.1:${PROD_VERIFY_PORT:-9418}`, which is the
same path Cloudflare uses. If it passes but the public hostname does not, the
problem is the tunnel, not the stack.

## Roll back

Every published image keeps its `sha-<commit>` tag, so rollback is a normal
deploy of an older tag — no rebuild required:

```bash
cd /opt/clock_website
IMAGE_TAG=sha-<previous-commit> ./scripts/deploy.sh
```

`deploy.sh` also rolls back **automatically** if the health check fails: it
re-pulls and restarts each service at the tag that was running before the
deploy, then exits non-zero so the failure is visible in the webhook response.

## Troubleshooting

| Symptom                                             | Check                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| Webhook returns 403                                 | `WEBHOOK_TOKEN` in `.env.prod` must equal the GitHub secret            |
| Webhook returns 500, log says `ref`                 | Payload must carry `"ref": "main"`                                     |
| `git pull --ff-only` fails                          | The host checkout diverged; reset it to `main` and re-run              |
| Containers healthy, public URL 404s                 | Tunnel public hostname must target `http://nginx:8080` (edge, not web) |
| `make env-check` fails                              | `.env.prod` is missing or a secret is empty                            |
| Rollback restored containers but CI reports failure | Expected — the run is marked failed on purpose; fix forward            |
