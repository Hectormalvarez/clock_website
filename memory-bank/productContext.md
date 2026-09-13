# Product Context

## Why

A personal productivity site: a clean, dark, always-visible clock for a wall
screen or a spare tab, growing into timer and alarms so one page replaces
several utilities. Hosted under the taylormadetech.net domain.

## Problems it solves

- No-install clock/timer/alarm with persistence (localStorage, no accounts).
- Distraction-free: no ads, no login, no tracking; single static page.
- Self-hosted learning vehicle for a production-grade deploy pipeline
  (GHCR images, webhook deploys, Cloudflare Tunnel, edge caching).

## How it should work

- **Clock** — always ticking, 12-hour format with AM/PM, seconds shown,
  timezone-aware, dev marker only in dev builds. Tab title mirrors the time.
- **Timer** — manual duration entry + presets, start/pause/reset, survives
  reload via `localStorage`, beep + visual overlay on completion.
- **Alarms (US-001)** — create/name/enable/disable/delete multiple alarms,
  one-shot firing with 9-minute snooze, ring overlay with Snooze/Dismiss,
  keyboard dismissal (Esc/Enter), persisted across reloads.
- **Limitation (documented in-panel)** — alarms/timer ring only while the tab
  is open; background-tab throttling can delay rings up to ~1 minute. No
  OS/browser notifications (out of scope per US-001).
- **404 page** — served by the edge with a real 404 status; separate CSS file
  because the CSP forbids inline styles.

## UX notes

- Dark theme, large digits, responsive; keyboard-friendly controls.
- Persistence is per-browser; no server state at all (static app).
