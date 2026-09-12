#!/bin/sh
# deploy.sh — production deployment orchestrator with automatic rollback.
#
# Sequences: capture tags → sync checkout → pull images → swap containers →
# health-check → (rollback | prune).
#
# Runs on the host (via `make deploy-remote`) or inside the webhook container
# (via scripts/webhook-bridge.sh); both reach Docker through the same socket.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# ── Configuration (override via environment) ──────────────────────
COMPOSE_PROJECT="${COMPOSE_PROJECT:-clock-prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
# Checked from inside the edge container, so this works whether deploy.sh runs
# on the host or inside the webhook container.
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/healthz}"
HEALTH_RETRIES="${HEALTH_RETRIES:-15}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-4}"
IMAGE_SERVICES="${IMAGE_SERVICES:-web nginx}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# ── Helpers ────────────────────────────────────────────────────────
info()  { printf '\033[0;36m▶ %s\033[0m\n' "$1"; }
ok()    { printf '\033[0;32m✓ %s\033[0m\n' "$1"; }
err()   { printf '\033[0;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

COMPOSE="docker compose -p $COMPOSE_PROJECT -f $COMPOSE_FILE --env-file .env.prod"

# ── Step 1: Snapshot current image tags (rollback target) ─────────
info "Capturing current image references..."
PREV_IMAGE_TAGS=""
for svc in $IMAGE_SERVICES; do
	CURRENT_TAG=$($COMPOSE images "$svc" --format json 2>/dev/null | jq -r '.[0].Tag // "latest"' 2>/dev/null || echo "latest")
	PREV_IMAGE_TAGS="$PREV_IMAGE_TAGS $svc:$CURRENT_TAG"
done
ok "Previous images captured:$PREV_IMAGE_TAGS"

# ── Step 2: Sync the checkout (compose file, nginx.conf, scripts) ─
info "Fetching latest changes..."
git fetch --all --prune
git pull --ff-only || err "Fast-forward failed. Resolve manually and re-run."
ok "Git up to date: $(git rev-parse --short HEAD)"

# ── Step 3: Pull the images published by release.yml ──────────────
info "Pulling images for tag: $IMAGE_TAG"
IMAGE_TAG="$IMAGE_TAG" $COMPOSE pull web nginx || err "Could not pull images for tag $IMAGE_TAG"
ok "Images pulled"

# ── Step 4: Swap containers ───────────────────────────────────────
info "Starting updated containers..."
IMAGE_TAG="$IMAGE_TAG" $COMPOSE up -d --remove-orphans
ok "Containers started"

# ── Step 5: Health check through the edge ─────────────────────────
info "Running health checks (max ${HEALTH_RETRIES} attempts)..."
HEALTHY=false
i=1
while [ "$i" -le "$HEALTH_RETRIES" ]; do
	if $COMPOSE exec -T nginx wget -q --spider "$HEALTH_URL" 2>/dev/null; then
		HEALTHY=true
		break
	fi
	info "  Attempt $i/$HEALTH_RETRIES — waiting ${HEALTH_INTERVAL}s..."
	sleep "$HEALTH_INTERVAL"
	i=$((i + 1))
done

# ── Step 6: Roll back on failure ──────────────────────────────────
if [ "$HEALTHY" = "false" ]; then
	info "Health check failed after $HEALTH_RETRIES attempts. Rolling back..."

	for entry in $PREV_IMAGE_TAGS; do
		svc="${entry%%:*}"
		tag="${entry##*:}"
		info "  Restoring $svc to tag: $tag"
		IMAGE_TAG="$tag" $COMPOSE pull "$svc" 2>/dev/null || true
		IMAGE_TAG="$tag" $COMPOSE up -d --no-deps "$svc" 2>/dev/null || true
	done

	err "Rollback complete. Investigate and re-deploy."
fi

ok "Health check passed"

# ── Step 7: Cleanup ───────────────────────────────────────────────
info "Pruning dangling images..."
docker image prune -f >/dev/null 2>&1
ok "Deploy complete: $(git rev-parse --short HEAD)"
