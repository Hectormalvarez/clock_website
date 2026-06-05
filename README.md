# Simple Clock

A clean, dark-themed digital clock with a built-in countdown timer. Built with TypeScript and Vite.

## Tech Stack

- **TypeScript** — Application logic and DOM manipulation
- **Vite** — Build tool and dev server
- **Vitest** — Unit testing with jsdom

## Project Structure

```
src/
├── main.ts                    # Entry point (4 lines — thin glue)
├── index.html                 # HTML shell
├── vite-env.d.ts              # Vite client types
├── assets/
│   └── favicon.svg
├── components/
│   ├── clock.ts               # Clock UI — initClock(), pure computeClockTick()
│   └── timer.ts               # Timer UI — initTimer(), thin renderer for timer-core
├── styles/
│   ├── main.css               # Import hub
│   ├── variables.css          # Design tokens
│   ├── base.css               # Reset / body
│   ├── clock.css              # Clock styles
│   ├── timer.css              # Timer styles
│   ├── animations.css         # Keyframes
│   └── responsive.css         # Media queries
└── utils/
    ├── time.ts                # Time formatting (pure functions)
    ├── audio.ts               # Web Audio beep (injectable AudioContext)
    ├── timer-core.ts          # Pure timer state machine (no DOM)
    └── __tests__/
        ├── time.test.ts
        ├── clock.test.ts      # (in components/__tests__/)
        └── timer-core.test.ts
```

## Architecture

The codebase is structured for **testability**:

- **Pure functions** (`timer-core.ts`, `time.ts`, `computeClockTick`) contain all business logic with zero DOM dependencies — fully unit-testable.
- **UI layers** (`initClock`, `initTimer`) are thin wrappers that query the DOM, bind events, and render state from the pure core.
- **Dependency injection** — `playBeep()` accepts an optional `AudioContext`, enabling test mocking.

## Scripts

```bash
npm run dev          # Start dev server (auto-opens browser)
npm run build        # Production build → dist/
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
```

## Testing

```bash
npm test
```

Tests cover:

- Time formatting (12h, AM/PM, midnight, noon, duration)
- Clock tick logic (title updates, timezone display, dev marker, timer-active guard)
- Timer state machine (start/pause/reset/tick transitions, input validation, presets)
