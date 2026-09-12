# Simple Clock

A clean, dark-themed digital clock with a built-in countdown timer. Built with TypeScript and Vite.

## Tech Stack

- **TypeScript** — Application logic and DOM manipulation
- **Vite** — Build tool and dev server
- **Vitest** — Unit testing with jsdom

## Project Structure

```
web/                                    # Application workspace
├── src/
│   ├── main.ts                         # Entry point (bootstrap only)
│   ├── index.html                      # HTML shell
│   ├── vite-env.d.ts                   # Vite client types
│   ├── app/
│   │   ├── app.ts                      # Composition root — wires features into the page
│   │   └── config.ts                   # Build-time config (mode, storage keys)
│   ├── features/
│   │   ├── clock/
│   │   │   ├── clock.core.ts           # Pure tick logic — computeClockTick(), msToNextSecond()
│   │   │   ├── clock.ui.ts             # Clock DOM wiring — initClock()
│   │   │   ├── clock-registry.ts       # Multi-clock scaffold (not wired up yet)
│   │   │   └── index.ts                # Feature public surface
│   │   └── timer/
│   │       ├── timer.core.ts           # Pure state machine (no DOM)
│   │       ├── timer.presets.ts        # Preset helpers (pure)
│   │       ├── timer.storage.ts        # localStorage adapter
│   │       ├── timer.ui.ts             # Timer DOM wiring — initTimer()
│   │       └── index.ts                # Feature public surface
│   ├── shared/
│   │   ├── time/format.ts              # Time formatting (pure functions)
│   │   ├── audio/beep.ts               # Web Audio beep (injectable AudioContext)
│   │   └── dom/query.ts                # Typed querySelector helpers
│   ├── assets/
│   │   └── favicon.svg
│   └── styles/
│       ├── main.css                    # Import hub
│       ├── variables.css               # Design tokens
│       ├── base.css                    # Reset / body
│       ├── clock.css                   # Clock styles
│       ├── timer.css                   # Timer styles
│       ├── animations.css              # Keyframes
│       └── responsive.css              # Media queries
├── tests/
│   └── unit/                           # Mirrors src/ one-to-one
│       ├── features/clock/clock.core.test.ts
│       ├── features/timer/timer.core.test.ts
│       └── shared/time/format.test.ts
├── package.json
└── vite.config.ts
```

## Architecture

The codebase is organized **by feature**, with a shared primitives layer:

- **Pure cores** (`clock.core.ts`, `timer.core.ts`, `shared/time/format.ts`) hold all business logic with zero DOM dependencies — fully unit-testable.
- **UI layers** (`clock.ui.ts`, `timer.ui.ts`) query the DOM, bind events, and render from the pure core.
- **Adapters** (`timer.storage.ts`) isolate side-effecting platform APIs (`localStorage`).
- **Composition root** (`app/app.ts`) is the only place that knows about page element IDs; `main.ts` just calls `bootstrap()`.
- **Dependency injection** — `playBeep()` accepts an optional `AudioContext`, enabling test mocking.
- Features are consumed through their barrel (`@/features/clock`, `@/features/timer`), never by reaching into internal modules.

## Scripts

Run all commands from the `web/` workspace:

```bash
cd web
npm install          # Install dependencies
npm run dev          # Start dev server (auto-opens browser)
npm run build        # Production build → web/dist/
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run typecheck    # Type-check without emitting
npm run lint         # Lint with ESLint
npm run format       # Format with Prettier
```

## Testing

```bash
cd web
npm test
```

Tests cover:

- Time formatting (12h, AM/PM, midnight, noon, duration)
- Clock tick logic (title updates, timezone display, dev marker, timer-active guard)
- Timer state machine (start/pause/reset/tick transitions, input validation, presets)
