# Clock Website — Project Rules

Folder-per-artifact monorepo: `web/` (TypeScript + Vite 6 app, vanilla DOM — no framework), `nginx/` (edge reverse proxy), `webhook/` (deploy webhook), `scripts/` (host helpers), `docs/` (ADRs, runbooks, stories). Production ingress is a Cloudflare Tunnel; `main` triggers release.yml → GHCR images → webhook auto-deploy on the host.

## Canonical Commands

`make` targets run from the repo root; `npm` commands **only work inside `web/`** (`cd web && ...`). Node ≥22, pinned in `web/.nvmrc`.

| Purpose | Command |
| :--- | :--- |
| Full quality gate — run before declaring done | `make check` (lint + typecheck + test) |
| Dev stack up/down/health | `make dev-up` / `make dev-down` / `make dev-health` |
| Fast host-only dev loop | `cd web && npm run dev` |
| Format check (CI enforces it) | `cd web && npm run format:check` |
| Coverage | `cd web && npm test -- --coverage` |

- CI (`.github/workflows/ci.yml`) also runs `npm run build`, `nginx -t` on both configs, `docker compose config -q` on both stacks, and hadolint on all four Dockerfiles. Any guard CI enforces must be reproducible locally — if you change pipeline-relevant files (compose, Dockerfiles, `nginx.conf`), run the equivalent local checks and say so.
- Git hooks: husky pre-commit runs lint-staged on staged `web/` files. **Never bypass with `--no-verify`** (merge commits/conflict resolutions excepted).

## Workflow

- Branch from `dev`, PR into `dev`; `main` is the release branch and only moves forward. Keep history **linear — rebase, don't merge**.
- Conventional commits, scoped where helpful (`feat(timer):`, `fix(web):`, `docs:`, `ci:`), small and self-contained — each commit must build and pass checks on its own (see global Commit Discipline rule).
- Any architecture change (container layout, ingress, deploy mechanism) requires adding or updating an ADR in `docs/adr/` in the same PR. New features get a user story in `docs/stories/` (see `US-001` for format).

## Safety

- Never edit `.env` or `.env.prod` (Cloudflare tunnel tokens, webhook token). Never echo or commit their contents. Dev and prod tunnels must use different tokens — never copy one into the other.
- Production deploys are automatic on `main` (webhook). Never run `make prod-deploy`, `make deploy-remote`, `make prod-*`, or `scripts/deploy.sh` unless explicitly asked.
- `make dev-reset` and `docker compose down -v` wipe volumes — confirm with the user first.
- Base images in all Dockerfiles are pinned by digest (ADR 0005). Never drop the pin; update it deliberately.