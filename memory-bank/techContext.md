# Tech Context

## Stack

- **TypeScript** + **Vite 6** (vanilla DOM — no framework), Node ≥22
  (`web/.nvmrc`: 22).
- **Vitest 4 + jsdom** for tests; `@vitest/coverage-v8` for coverage.
- ESLint (flat config, `web/eslint.config.js`), Prettier, husky + lint-staged.
- Containers: `node:22-alpine`, `nginxinc/nginx-unprivileged:1.27-alpine`
  (EOL mainline branch — see backlog HK-5), `golang:1.24-alpine`, `alpine:3.21`
  — all digest-pinned (ADR 0005). Deployer: `github.com/adnanh/webhook`
  pseudo-version pin.

## Commands

All npm commands run inside `web/`; make targets from the repo root.

| Purpose | Command |
| :--- | :--- |
| Full quality gate (before declaring done) | `make check` (lint + typecheck + test) |
| Dev stack up/down/health | `make dev-up` / `make dev-down` / `make dev-health` |
| Fast host-only dev loop | `cd web && npm run dev` |
| Format check (CI-enforced) | `cd web && npm run format:check` |
| Coverage | `cd web && npm test -- --coverage` |
| Production build | `cd web && npm run build` → `web/dist/` |

CI-relevant changes (compose, Dockerfiles, `nginx.conf`) must be validated
locally with the same checks CI runs (hadolint via `hadolint/hadolint` image,
`nginx -t` via the nginx image, `docker compose config -q`).

## Setup facts

- Dev edge at `http://localhost:8100` (compose); opt-in dev tunnel with its
  own token. Prod stack uses GHCR images + prod tunnel + webhook.
- `VITE_SITE_URL` is the single source for canonical/OG URLs and the generated
  `sitemap.xml` / `robots.txt` (see `web/vite.config.ts`). Unset → falls back
  to `http://localhost:8100`.
- Env files: `.env` (dev), `.env.prod` (prod secrets) — gitignored, never
  edit/echo. `.env.sample` documents the variables.

## Constraints

- Both containers listen on 8080; host mappings must target 8080.
- No `unsafe-inline` CSP (ADR 0002): no inline `<style>` or style attributes
  anywhere, including generated pages.
- Base images digest-pinned; update tag + digest together, deliberately.
- Prod deploys are automatic on `main` — never trigger prod targets unasked.
