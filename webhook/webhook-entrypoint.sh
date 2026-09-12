#!/bin/sh
# webhook-entrypoint.sh — substitutes the real webhook secret into the hook
# definition, then starts the webhook daemon.
set -e

WEBHOOK_TOKEN="${WEBHOOK_TOKEN:?WEBHOOK_TOKEN is required}"

# The image ships hooks.json.template (mounted read-only from the host); the
# generated hooks.json lives in the container so the secret never touches disk
# on the host.
cp /etc/webhook/hooks.json.template /etc/webhook/hooks.json
sed -i "s|__WEBHOOK_TOKEN__|${WEBHOOK_TOKEN}|g" /etc/webhook/hooks.json

# Exec the webhook daemon with all passed arguments.
exec webhook "$@"
