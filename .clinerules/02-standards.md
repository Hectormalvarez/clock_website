---
paths:
  - "web/src/**"
  - "web/tests/**"
---
# Code Standards (TypeScript / Vite)

## Architecture (feature-based, see README "Architecture")

- Business logic lives in **pure cores** (`features/*/*.core.ts`, `shared/`) with zero DOM dependencies — push decisions into pure modules and keep DOM wiring thin.
- **UI layers** (`*.ui.ts`) query the DOM, bind events, and render from the pure core. **Adapters** (`*.storage.ts`, `shared/audio/beep.ts`) isolate side-effecting platform APIs; make platform dependencies injectable (e.g. optional `AudioContext` parameter) so they can be mocked in tests.
- The composition root (`src/app/app.ts`) is the **only** place that knows page element IDs; `main.ts` only calls `bootstrap()`.
- Consume features through their barrel (`@/features/clock`, `@/features/timer`), never by reaching into internal modules. Path alias `@/` → `src/`.

## Structure

- `src/features/<feature>/` — one directory per feature with `index.ts` as its public surface; `src/shared/` — cross-feature primitives (time, audio, dom); `src/styles/` — one CSS file per concern imported via `main.css`; `src/public/` — copied verbatim to the build root.
- Tests mirror `src/` one-to-one under `web/tests/unit/` (`features/clock/clock.core.test.ts` ↔ `features/clock/clock.core.ts`).

## Hard Constraints

- The edge CSP has **no `unsafe-inline`** (ADR 0002): every page — including error pages — ships its CSS as a separate file linked via `<link>`, never inline `<style>` blocks or style attributes.
- Site-wide security headers belong in `nginx/nginx.conf` only. The app container is a plain static file server that knows nothing about the outside world.
- `sitemap.xml` and `robots.txt` are **generated** at build time from `VITE_SITE_URL` (see `vite.config.ts`) — never hand-add them to `src/public/`. All absolute URLs derive from that single env value; there is no second place to edit.
- Both containers listen on **8080**; host port mappings must target 8080.

## Testing

- Vitest + jsdom. Unit-test pure logic directly (timer state machine, clock tick, time formatting); DOM-facing code is testable with jsdom without a browser.
- New logic goes in a pure module with tests in the mirrored `web/tests/unit/` path — a behavior change without a matching test is incomplete.
- Prefer tests that document behavior over tests that re-query the DOM for every assertion.

## Style

- Prettier is authoritative: **tabs**, single quotes, semicolons, print width 80, trailing commas — run `npm run format` if lint-staged or `format:check` flags style.
- ESLint rules are strict: `consistent-type-imports` (use `import type`), no unused vars (prefix intentional ones with `_`), `no-console` (only `error`/`warn` allowed).