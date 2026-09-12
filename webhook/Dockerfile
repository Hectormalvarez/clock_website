# Webhook deployer image.
#
# Listens for the release workflow's deploy trigger and runs scripts/deploy.sh
# against the host repo through the mounted Docker socket.

# ── Build stage: compile the webhook daemon ───────────────────────
FROM golang:1.24-alpine@sha256:8bee1901f1e530bfb4a7850aa7a479d17ae3a18beb6e09064ed54cfd245b7191 AS builder

RUN apk add --no-cache git

# adnanh/webhook publishes no semver tags, so this is the module proxy's
# pseudo-version for the commit we tested. Bump deliberately — `@latest` would
# silently change the deployer on every rebuild.
RUN go install github.com/adnanh/webhook@v0.0.0-20260904180256-2bbdeb9f90b5

# ── Runtime stage ─────────────────────────────────────────────────
FROM alpine:3.21@sha256:48b0309ca019d89d40f670aa1bc06e426dc0931948452e8491e3d65087abc07d

# git, jq, curl and the Docker CLI (with the compose plugin) are all required
# by deploy.sh and webhook-bridge.sh.
RUN apk add --no-cache git jq curl docker-cli docker-cli-compose ca-certificates

COPY --from=builder /go/bin/webhook /usr/local/bin/webhook

COPY webhook-entrypoint.sh /usr/local/bin/webhook-entrypoint.sh
RUN chmod +x /usr/local/bin/webhook-entrypoint.sh

# /opt/clock_website is the IN-CONTAINER path only — it is not the host's
# working directory. docker-compose.prod.yml mounts the host repo at this exact
# path so that, when docker compose runs inside this container via the mounted
# Docker socket, relative bind-mount sources resolve to the same absolute paths
# on the host filesystem. Declaring it a safe directory also prevents git
# "dubious ownership" errors.
RUN git config --global --add safe.directory /opt/clock_website

WORKDIR /opt/clock_website

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/webhook-entrypoint.sh"]
