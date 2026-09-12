# Contributing

## Prerequisites

- **Node 22 or newer** — `lint-staged` requires ≥ 22.22.1, so the toolchain is
  pinned in `web/.nvmrc`. Use `nvm use` from the repository root.
- **Docker with Compose v2** — only needed to run the container stacks.
- **make** — optional convenience wrapper around the compose and npm commands.

## Layout

One directory per buildable artifact:

| Directory  | Contents                                             |
| ---------- | ---------------------------------------------------- |
| `web/`     | npm project, Vite app, and both app images           |
| `nginx/`   | Edge reverse proxy image and config                  |
| `webhook/` | Deploy webhook image, hooks, and entrypoint          |
| `scripts/` | Host-side helpers (deploy, tunnel bridge, bootstrap) |
| `docs/`    | Architecture decision records and runbooks           |

`npm` commands only work from inside `web/`. See
[ADR 0001](docs/adr/0001-folder-per-container-layout.md) for the reasoning.

## Local setup

```bash
make install          # npm ci inside web/
cd web && npx husky   # install git hooks (also runs on npm install)
```

## Development

```bash
# Fastest loop: Vite dev server on the host, no containers
cd web && npm run dev

# Full stack: source-mounted web container behind the edge proxy (http://localhost:8100)
make dev-up
make dev-health
make dev-down
```

Use the full stack when you are touching `nginx/`, the Dockerfiles, the
compose files, or anything that depends on how the bundle is served.

## Checks

Run everything before opening a pull request:

```bash
make check            # lint + typecheck + tests
```

Or individually:

```bash
cd web
npm run format:check
npm run lint
npm run typecheck
npm test
npm test -- --coverage
```

CI (`.github/workflows/ci.yml`) runs the same set, plus `nginx -t` on both
configs, `docker compose config -q` on both stacks, and hadolint on all four
Dockerfiles. Anything CI enforces must be reproducible locally — if you add a
guard, add the equivalent command to `make check` or document it here.

## Pre-commit hook

`.husky/pre-commit` runs `lint-staged` from `web/`, which formats and lints only
the staged files. It ignores staged files outside `web/` (compose files,
Dockerfiles, docs) rather than failing on them.

If the hook blocks a commit you believe is correct, fix the finding — do not
bypass it with `--no-verify`, except for merge commits and conflict
resolutions.

## Commit messages

Conventional Commits, scoped where it helps:

```
feat(timer): add preset reordering
fix(web): correct midnight formatting
docs: add deployment runbook
ci: validate nginx configurations
chore(web): ignore generated output in prettier
```

Keep commits small and self-contained; each one should build and pass the
checks on its own.

## Pull requests

1. Branch from `dev`.
2. Make sure `make check` passes.
3. Keep `dev` and `main` history linear — rebase rather than merge. `main` is
   what `release.yml` builds from, and it only ever moves forward.
4. If you change architecture — the container layout, the ingress model, the
   deploy mechanism — add or update an ADR in `docs/adr/` in the same pull
   request.

## Site URL and SEO output

`vite.config.ts` derives all absolute URLs from `VITE_SITE_URL` — there is no
second place to edit. It fills `<link rel="canonical">` and `og:url` in
`index.html`, and generates `sitemap.xml` plus the `Sitemap:` line in
`robots.txt` during the build. Both of those files are **generated**, so never
add them to `src/public/`.

```bash
cd web
npm run build                                        # → http://localhost:8100
VITE_SITE_URL=https://clock.example.net npm run build # → that origin
```

`VITE_SITE_URL` can also live in `web/.env.local` (gitignored) for a persistent
local override. The production image receives it as a build arg — see
`web/Dockerfile.prod` and the `SITE_URL` repository variable in
`release.yml`.

## Editing container configuration

- Base images are pinned by digest. Update the `FROM` line deliberately rather
  than dropping the pin (see [ADR 0005](docs/adr/0005-pinned-base-images-and-toolchain.md)).
- Site-wide security headers belong in `nginx/nginx.conf` only. The app
  container is a plain static file server (see
  [ADR 0002](docs/adr/0002-unprivileged-nginx-images.md)).
- The edge CSP has no `unsafe-inline`. Any new page — including an error page —
  must ship its CSS as a separate file, not an inline `<style>` block.
- Both images listen on **8080**. Host port mappings must target 8080.

## Tests

Tests live in `web/tests/unit/` and mirror the source tree:

```
web/tests/unit/
├── features/clock/clock.core.test.ts
├── features/timer/timer.core.test.ts
└── shared/time/format.test.ts
```

Pure logic is unit-tested directly: the timer state machine, the clock tick
computation, and time formatting. DOM-facing code is covered with jsdom, so a
component that touches `document` can still be tested without a browser.

Prefer pushing decisions into a pure module and keeping DOM wiring thin — it is
the difference between a test that documents behaviour and a test that
re-queries the DOM for every assertion.

## Reporting issues

Include the commands you ran, the full output, and whether `make dev-up` or
the host-only dev server reproduces it. For production problems, start with
the [deployment runbook](docs/runbooks/deployment.md) troubleshooting table.
