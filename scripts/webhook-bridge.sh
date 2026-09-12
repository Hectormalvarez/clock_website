#!/bin/sh
# webhook-bridge.sh — validates the release webhook payload and hands off to
# deploy.sh. Invoked by the webhook daemon with positional arguments declared in
# webhook/hooks.json.
#
# Arguments: $1 = image_tag, $2 = ref
set -euo pipefail

IMAGE_TAG="${1:-latest}"
REF="${2:-}"

# Production deploys only ever come from main.
if [ "$REF" != "main" ]; then
	echo "{\"status\":\"error\",\"message\":\"ref must be main, got: $REF\"}" >&2
	exit 1
fi

if [ -z "$IMAGE_TAG" ] || [ "$IMAGE_TAG" = "null" ]; then
	echo "{\"status\":\"error\",\"message\":\"image_tag is required\"}" >&2
	exit 1
fi

echo "▶ Deploying image tag: $IMAGE_TAG (ref: $REF)" >&2

# /opt/clock_website is the IN-CONTAINER path — see the volume comment in
# docker-compose.prod.yml for why it differs from the host working directory.
cd /opt/clock_website
IMAGE_TAG="$IMAGE_TAG" ./scripts/deploy.sh

echo "{\"status\":\"ok\",\"image_tag\":\"$IMAGE_TAG\",\"ref\":\"$REF\"}"
