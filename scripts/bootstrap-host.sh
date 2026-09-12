#!/bin/sh
# bootstrap-host.sh — idempotent host preparation for the clock_website stack.
# Run as root on a fresh Ubuntu/Debian host. Safe to re-run.
set -eu

MIN_RAM_MB=1024
SWAP_SIZE_GB=2
SWAP_FILE=/swapfile
APP_DIR=/opt/clock_website
REPO_URL="${REPO_URL:-git@github.com:Hectormalvarez/clock_website.git}"

# ── Helpers ────────────────────────────────────────────────────────
info()  { printf '\033[0;36m▶ %s\033[0m\n' "$1"; }
ok()    { printf '\033[0;32m✓ %s\033[0m\n' "$1"; }

# ── Root check ─────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
	echo "Error: this script must be run as root." >&2
	exit 1
fi

# ── Swap safety net ───────────────────────────────────────────────
RAM_KB=$(awk '/^MemTotal/ {print $2}' /proc/meminfo)
RAM_MB=$((RAM_KB / 1024))
CURRENT_SWAP=$(awk '/^SwapTotal/ {print $2}' /proc/meminfo)

if [ "$CURRENT_SWAP" -gt 0 ]; then
	ok "Swap already active (${CURRENT_SWAP} kB) — skipping swap setup."
elif [ "$RAM_MB" -ge "$MIN_RAM_MB" ]; then
	ok "RAM is ${RAM_MB} MB (>= ${MIN_RAM_MB} MB) — swap not required."
else
	info "RAM is ${RAM_MB} MB (< ${MIN_RAM_MB} MB) — allocating ${SWAP_SIZE_GB} GB swapfile..."

	fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" 2>/dev/null \
		|| dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB * 1024)) status=none
	chmod 600 "$SWAP_FILE"
	mkswap "$SWAP_FILE"
	swapon "$SWAP_FILE"

	# Persist across reboots (idempotent — skip if already in fstab).
	if ! grep -q "$SWAP_FILE" /etc/fstab; then
		echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
	fi

	ok "Swap enabled: ${SWAP_SIZE_GB} GB"
fi

# ── Docker Engine ──────────────────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
	ok "Docker already installed: $(docker --version)"
else
	info "Installing Docker Engine..."

	apt-get update -qq
	apt-get install -y -qq ca-certificates curl gnupg

	install -m 0755 -d /etc/apt/keyrings
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
	chmod a+r /etc/apt/keyrings/docker.gpg

	echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
		> /etc/apt/sources.list.d/docker.list

	apt-get update -qq
	apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin

	ok "Docker installed: $(docker --version)"
fi

# ── Application directory ─────────────────────────────────────────
if [ ! -d "$APP_DIR" ]; then
	mkdir -p "$APP_DIR"
	ok "Created $APP_DIR"
else
	ok "$APP_DIR already exists"
fi

# ── Reminder ──────────────────────────────────────────────────────
cat <<EOF

Next steps on this host:
  1. Clone the repo into $APP_DIR:
       git clone $REPO_URL $APP_DIR
  2. Create $APP_DIR/.env.prod from .env.sample and fill in
     WEBHOOK_TOKEN and CLOUDFLARE_TUNNEL_TOKEN.
  3. Log in to GHCR so the host can pull private images:
       echo "<PAT>" | docker login ghcr.io -u <github-user> --password-stdin
  4. Bring the stack up:
       cd $APP_DIR && make env-check && make prod-deploy
EOF

ok "Host bootstrap complete."
