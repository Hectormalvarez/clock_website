# 1. One directory per buildable artifact

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

The project started as a single flat application: `src/`, `tests/`, a root
`Dockerfile`, a root `nginx.conf`, and a root `package.json`.

Adding an edge reverse proxy, a deployer, and host-side bootstrap scripts to
that layout made ownership ambiguous. `Dockerfile` and `nginx.conf` no longer
had a single obvious meaning, package-manager commands had to guess which
manifest they belonged to, and CI had to special-case paths.

## Decision

Lay the repository out as one directory per independently buildable artifact:

| Directory  | Owns                                                      |
| ---------- | --------------------------------------------------------- |
| `web/`     | The npm project, the Vite app, and both app images        |
| `nginx/`   | The edge reverse proxy image and its config               |
| `webhook/` | The deploy webhook image, hooks, and entrypoint           |
| `scripts/` | Host-side helpers (deploy, tunnel bridge, host bootstrap) |

Each container directory owns its own `Dockerfile`, runtime config, and
`.dockerignore`. Compose build contexts map one-to-one onto these directories
(`build: ./web`, `build: ./nginx`, `build: ./webhook`).

## Consequences

- Compose build contexts and CI scoping (`defaults.run.working-directory: web`)
  follow directly from the layout instead of being configured per command.
- `web/` is the npm project root, so every Node tool — `npm`, `husky`,
  `lint-staged`, `prettier` — must run from inside it. The root `.husky`
  hook does `cd web` before invoking `lint-staged`.
- Because the npm project is nested, generated output (`web/dist`,
  `web/coverage`) is not covered by the repository-root `.gitignore` as far as
  tools that run from `web/` are concerned. `web/.prettierignore` and
  `web/eslint.config.js` each declare those paths explicitly.
