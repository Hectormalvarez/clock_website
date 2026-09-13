# Project Brief — Simple Clock

A single-page digital clock website (clock + countdown timer + alarms) built
with TypeScript and Vite, served from a hardened container stack behind
Cloudflare Tunnel. Live at `clock.taylormadetech.net`.

## Goals

- Always-accurate time display, zero-friction UX (no accounts, no tracking).
- Countdown timer with presets; multiple named alarms with snooze and
  persistence (US-001, deployed 2026-09-13).
- Fully automated, unattended production deploys (`main` → GHCR → webhook).
- Small attack surface: unprivileged containers, no inbound ports, CSP without
  `unsafe-inline`.

## Structure (folder-per-artifact monorepo)

- `web/` — Vite app, tests, both app container images
- `nginx/` — edge reverse-proxy image (security headers, real client IP, `/healthz`)
- `webhook/` — deploy webhook image (listens for release trigger, runs deploy)
- `scripts/` — host-side helpers (deploy, tunnel bridge, bootstrap)
- `tasks/` — backlog + sprint tracking
- `docs/` — ADRs, runbooks, user stories

## Constraints (see ADRs 0001–0006)

- Both containers listen on 8080; host port mappings must target 8080.
- Base images pinned by digest; bump tag + digest together, deliberately.
- Production ingress is Cloudflare Tunnel only — dev and prod tunnels use
  different tokens.
- `sitemap.xml` / `robots.txt` are build-time generated from `VITE_SITE_URL`.
- Edge caching: `index.html` cached via Cloudflare Cache Rule (origin
  `cdn-cache-control` is ignored on the free plan); `/healthz` never cached.

## Success criteria

- `make check` green (lint + typecheck + tests) before any merge.
- Deploys require no manual host work; rollback is automatic on failed health
  check.
- Alarms ring while the page is open (documented limitation: no background-tab
  rings, no OS notifications).
