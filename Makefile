# Task runner for the clock_website monorepo.
#
# Layout
#   web/      application workspace (npm project)
#   nginx/    edge reverse proxy
#   webhook/  production deployer
#   scripts/  deploy and host-bootstrap helpers

-include .env

DEPLOY_HOST ?=
DEPLOY_USER ?= $(USER)
DEPLOY_DIR  ?= /opt/clock_website

.PHONY: .env install dev-up dev-down dev-reset dev-logs dev-health \
	dev-tunnel-up dev-tunnel-down dev-tunnel-logs \
	test lint format typecheck check \
	prod-deploy prod-status prod-logs prod-verify env-check \
	deploy-remote bootstrap-remote

# ─── Local setup ───────────────────────────────────────────────
.env:
	@cp .env.sample .env
	@echo "✓ Created .env from .env.sample"

install:
	cd web && npm ci

# ─── Development ───────────────────────────────────────────────
dev-up: .env
	docker compose --env-file .env up -d --build
	@docker compose ps

dev-down:
	# --profile tunnel so an opt-in dev tunnel is stopped too, not orphaned.
	docker compose --env-file .env --profile tunnel down

# Rebuild from scratch. Needed when package.json changes, because node_modules
# lives in an anonymous volume that is only seeded on first creation.
dev-reset:
	@echo "▶ Stopping dev containers and clearing anonymous volumes..."
	docker compose down -v
	@echo "▶ Rebuilding images and restarting the stack..."
	docker compose --env-file .env up -d --build
	@echo "✓ Dev stack reset. Run 'make dev-health' to verify."

dev-logs:
	docker compose logs -f

dev-health:
	@PORT=$${NGINX_HOST_PORT:-8100}; \
	echo "▶ Checking the dev stack on http://127.0.0.1:$$PORT..."; \
	curl -sf "http://127.0.0.1:$$PORT/healthz" > /dev/null && echo "✓ Edge: OK" || echo "✗ Edge: FAIL"; \
	curl -sf "http://127.0.0.1:$$PORT/" > /dev/null && echo "✓ App: OK" || echo "✗ App: FAIL"

# ─── Containerized Cloudflare Tunnel for the dev stack ────────────
# Opt-in: `make dev-up` does NOT start it. Lives in the clock-dev project,
# fully separate from the production connector.
dev-tunnel-up: .env
	@if ! grep -qE '^CLOUDFLARE_TUNNEL_TOKEN=.+' .env; then \
		echo "✗ CLOUDFLARE_TUNNEL_TOKEN is not set in .env"; \
		echo "  Create a tunnel, then add its token to .env (see README > Cloudflare Tunnel)."; \
		exit 1; \
	fi
	docker compose --env-file .env --profile tunnel up -d cloudflared
	@docker compose --env-file .env --profile tunnel ps cloudflared

dev-tunnel-down:
	docker compose --env-file .env --profile tunnel rm -sf cloudflared

dev-tunnel-logs:
	docker compose --env-file .env --profile tunnel logs -f cloudflared

# ─── Quality gates (run on the host, no Docker required) ──────────
test:
	cd web && npm test

lint:
	cd web && npm run lint

format:
	cd web && npm run format

typecheck:
	cd web && npm run typecheck

check: lint typecheck test
	@echo "✓ Full check passed (lint + types + tests)."

# ─── Production ────────────────────────────────────────────────
prod-deploy:
	@test -f .env.prod || { echo "✗ .env.prod is missing. Copy .env.sample and fill it in."; exit 1; }
	@echo "▶ Building/pulling and replacing production containers..."
	docker compose -p clock-prod -f docker-compose.prod.yml --env-file .env.prod up -d --build --remove-orphans
	@docker compose -p clock-prod -f docker-compose.prod.yml ps

prod-status:
	docker compose -p clock-prod -f docker-compose.prod.yml ps

prod-logs:
	docker compose -p clock-prod -f docker-compose.prod.yml logs -f

# Verify through the loopback-only published port, exactly as the tunnel sees it.
prod-verify:
	@PORT=$${PROD_VERIFY_PORT:-9418}; \
	echo "▶ Verifying the production stack on http://127.0.0.1:$$PORT..."; \
	curl -sf "http://127.0.0.1:$$PORT/healthz" > /dev/null && echo "✓ Edge: OK" || { echo "✗ Edge: FAIL"; exit 1; }; \
	curl -sf "http://127.0.0.1:$$PORT/" > /dev/null && echo "✓ App: OK" || { echo "✗ App: FAIL"; exit 1; }

# Catches an unset secret before Docker starts a half-configured stack.
env-check:
	@test -f .env.prod || { echo "✗ .env.prod is missing."; exit 1; }
	@grep -qE '^WEBHOOK_TOKEN=.+' .env.prod && echo "✓ WEBHOOK_TOKEN is set" || { echo "✗ WEBHOOK_TOKEN is empty"; exit 1; }
	@grep -qE '^CLOUDFLARE_TUNNEL_TOKEN=.+' .env.prod && echo "✓ CLOUDFLARE_TUNNEL_TOKEN is set" || { echo "✗ CLOUDFLARE_TUNNEL_TOKEN is empty"; exit 1; }
	@echo "✓ Environment check complete."

# ─── Remote host helpers ───────────────────────────────────────
deploy-remote:
	@test -n "$(DEPLOY_HOST)" || { echo "Error: DEPLOY_HOST is not set. Run with DEPLOY_HOST=your-host make deploy-remote"; exit 1; }
	@echo "▶ Deploying on $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_DIR)..."
	ssh -t $(DEPLOY_USER)@$(DEPLOY_HOST) "cd $(DEPLOY_DIR) && ./scripts/deploy.sh"

bootstrap-remote:
	@test -n "$(DEPLOY_HOST)" || { echo "Error: DEPLOY_HOST is not set. Run with DEPLOY_HOST=your-host make bootstrap-remote"; exit 1; }
	@echo "▶ Bootstrapping $(DEPLOY_USER)@$(DEPLOY_HOST)..."
	ssh -t $(DEPLOY_USER)@$(DEPLOY_HOST) "sudo ./scripts/bootstrap-host.sh"
