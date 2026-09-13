# System Patterns

## App architecture (feature-based, see README)

- **Pure cores** (`features/*/*.core.ts`, `shared/time`, `shared/audio`): all
  business logic, zero DOM deps, fully unit-tested. Pure functions over
  explicit state (`computeClockTick`, timer/alarm state machines).
- **UI layers** (`*.ui.ts`): query DOM, bind events, render from the core.
- **Adapters** (`*.storage.ts`, `shared/audio/beep.ts`): isolate side effects
  (`localStorage`, `AudioContext`); platform deps are injectable for mocking.
- **Composition root** (`app/app.ts`): the ONLY place that knows page element
  IDs; `main.ts` calls `bootstrap()`. `app/config.ts` holds build-time config
  (mode, storage keys).
- Features are consumed via barrels (`@/features/clock`), path alias `@/` →
  `src/`. `shared/dom/query.ts` provides typed querySelector helpers.
- Known duplication: FLIP panel-open helper duplicated between `timer.ui.ts`
  and `alarm.ui.ts` (backlog US-003 item 1 → `shared/dom/`).
- `features/clock/clock-registry.ts`: multi-clock scaffold, not wired (US-004).

## Container / pipeline architecture

- **web**: dev image (Vite HMR, source-mounted) and prod image (build →
  static serve on nginx-unprivileged). **nginx** edge: security headers,
  `/healthz`, real client IP. **webhook**: receives release POST, runs
  `scripts/deploy.sh` against the host through the Docker socket.
- CI (`.github/workflows/ci.yml`): prettier, eslint, typecheck, vitest with
  coverage, build, `nginx -t` on both configs, `docker compose config` on both
  stacks, hadolint on all four Dockerfiles.
- Release (`release.yml`): on CI success on `main` → build/push GHCR images
  (`latest` + `sha-<sha>`, provenance + SBOM) → POST to deploy webhook.
- Git history: linear, rebase-merge only; PRs `dev` → `main`.

## Conventions

- Tests mirror `src/` one-to-one under `web/tests/unit/` (Vitest + jsdom);
  behavior-documenting tests over DOM re-queries.
- Prettier: tabs, single quotes, semicolons, width 80, trailing commas.
  ESLint: `consistent-type-imports`, no unused vars (`_` prefix), `no-console`
  (error/warn only).
- Husky pre-commit: lint-staged on staged `web/` files. Never `--no-verify`.
- Conventional commits, scoped; each commit builds and passes checks alone.

## Security invariants

- Edge CSP has no `unsafe-inline`; every page (incl. 404) links a CSS file.
- Security headers live only in `nginx/nginx.conf`; the app container knows
  nothing of the outside world.
- `.env` / `.env.prod` are secrets — never edit, echo, or copy tokens between
  dev and prod tunnels.
- Prod deploys fire automatically on `main`; never run prod targets unasked.
