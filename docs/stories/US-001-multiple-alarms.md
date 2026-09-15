# User Story: Multiple Alarms

**Story ID:** US-001  
**Epic:** Alarms  
**Status:** Done — deployed to production (PR #13, 2026-09-13); audible
tone owner-verified on prod 2026-09-15

---

## 1. Description

**As a** visitor who keeps the clock site open at their desk,  
**I want to** create and manage several named alarms,  
**So that** I get reminded of time-sensitive moments (breaks, meetings, cooking) without needing a phone app or an account.

---

## 2. Context & Scope

- **In Scope:**
  - Create alarms with an optional name (defaults to "Alarm") and a time of day (HH:MM)
  - A list showing all alarms, each with an enable/disable toggle and a delete action
  - One-shot behavior: an alarm rings once, then automatically turns itself off
  - While ringing: a clear visual alert and an audible tone, with **Dismiss** and **Snooze (+9 minutes)** actions
  - Alarms are saved in the browser on the user's device and survive a page reload
  - Known limitation, stated in the UI: an alarm only rings while the page is open
- **Out of Scope:**
  - Daily-repeat / recurring alarms — v2 story if users ask
  - Configurable snooze duration or snooze intervals
  - Custom alarm sounds or sound picker
  - Ringing when the tab is closed or the device is asleep; OS/browser notifications
  - Accounts, cross-device sync, or any backend

---

## 3. Acceptance Criteria

_These criteria define "Done." Every criterion must be verified by QA._

- [x] **AC-1:** Given the alarms panel is empty, When the user creates an alarm named "Standup" for 09:30, Then it appears in the list, enabled, with its name and time shown.
- [x] **AC-2:** Given an enabled alarm set for 09:30, When the device clock reaches 09:30 with the page open, Then a visual and audible alert starts, and the alarm is automatically disabled afterward.
- [x] **AC-3:** Given an alarm is ringing, When the user chooses Snooze, Then the alert stops and the alarm re-arms for 9 minutes later; When the user chooses Dismiss, Then the alert stops and the alarm stays disabled.
- [x] **AC-4:** Given one or more alarms exist, When the page is reloaded, Then all alarms reappear with their names, times, and enabled/disabled states intact.
- [x] **AC-5:** Given an alarm is disabled, When its time arrives, Then no alert occurs.
- [x] **AC-6 (edge case):** Given the user enables an alarm whose time is earlier than the current time, Then it does not ring today and is scheduled for the next occurrence of that time (tomorrow).
- [x] **AC-7:** Given an alarm is deleted, Then it disappears from the list, no longer rings, and no longer reappears after a reload.
- [x] **AC-8 (validation):** Given the user creates an alarm, Then an invalid or empty time is rejected with a clear message; a blank name defaults to "Alarm".

---

## 4. Technical Guidance & Architectural Constraints

(Filled in by Architect. Verdict: **Yes** — the existing stack covers this fully; no new dependency, service, or framework is approved, and no ADR is required because the feature follows the established feature-module pattern without any new architectural decision.)

### Target Files / Boundaries

- New feature module `web/src/features/alarm/`, mirroring the timer feature's structure exactly:
  - `alarm.core.ts` — pure state machine: alarm data shape, add / remove / enable / disable, next-occurrence computation, the per-tick check (e.g. `checkAlarms(state, now)`), and snooze. **Zero DOM, zero storage.**
  - `alarm.storage.ts` — localStorage adapter, mirroring `timer.storage.ts`.
  - `alarm.ui.ts` — DOM wiring, the 1-second scheduler interval, the alarm list rendering, and the ringing overlay. Exposes `initAlarm(rootElement, config)` returning a handle with `destroy()` (same contract as `initTimer`), and degrades gracefully when the container is absent.
  - `index.ts` — barrel; other modules may only import via `@/features/alarm`.

- `web/src/app/config.ts` — add an `ALARM_STORAGE_KEY` constant.
- `web/src/app/app.ts` — wire `initAlarm` (composition root is the only place that resolves the container; `main.ts` stays a one-liner).
- `web/src/index.html` — alarm toggle button + panel markup inside `#clock-container`, mirroring the timer wrapper pattern; every interactive element gets an `aria-label`.
- `web/src/styles/alarm.css` (new) imported from `main.css`; reuse the design tokens in `variables.css`; any media-query rules go in `responsive.css`.
- Tests mirror the source one-to-one under `web/tests/unit/features/alarm/` (core, storage parsing; optional UI tests via jsdom as the existing suite does).

### Constraints

- **No new dependencies.** The alert tone reuses `playBeep()` from `@/shared/audio/beep` (inject an `AudioContext` in tests); a repeating beep while ringing follows the timer's existing beep-interval pattern.
- **Purity boundary:** `alarm.core.ts` must not import the DOM, `localStorage`, or `import.meta.env`; current time is always passed in as a parameter so ticks are deterministic in tests.
- **Persistence:** a single JSON document under `ALARM_STORAGE_KEY`, read/written only through `alarm.storage.ts`; malformed stored data is discarded safely (fall back to empty list), matching the timer's parser.
- **IDs:** follow the existing `clock-registry` convention (`alarm-<timestamp>-<rand>`). Do **not** wire `clock-registry.ts` into this story — it belongs to the separate multi-clock epic.
- **Scheduling:** the alarm feature owns its own 1-second interval, independent of the clock's tick; it must be cleared in `destroy()`. The tick check must be idempotent — an alarm may not ring twice for the same occurrence (including the minute it fires in and after page reload).
- **One-shot semantics:** firing disables the alarm (persisted immediately); snooze is modeled as a future `snoozedUntil` timestamp on the alarm, never as an edit to the alarm's target time. Snooze duration is the fixed constant 9 minutes.
- **Next occurrence (AC-6):** today if HH:MM is still ahead of `now`, otherwise tomorrow; computed in the pure core.
- **CSP:** inline styles and scripts are forbidden — all ringing visuals and dynamically rendered list items are styled via classes in `alarm.css` / `animations.css`.
- **Accessibility:** toggles are real labeled inputs/buttons; the ringing overlay is keyboard-reachable, and pressing Escape (or Enter) dismisses.
- The panel must display the "alarms ring only while the page is open" limitation (story In-Scope note).
- **Forbidden moves:** no Service Workers, Notification API, background timers beyond the page interval, new npm packages, changes to `nginx/`, compose files, cache policies, or the timer/clock features' behavior.
- **Verification gate:** `npm run typecheck`, `npm run lint`, `npx prettier --check .`, and `npm test` must pass locally before commit; CI additionally validates Docker/compose, which this story must not touch.

### Risks for QA

- Background-tab throttling may delay a ring by up to a minute — acceptable, and the panel copy must communicate the limitation.
- The double-fire guard across page reloads (reload at 09:30:30 must not re-ring a 09:30 alarm) is the trickiest acceptance criterion and needs explicit QA coverage.

---

## 5. Definition of Done Checklist

- [x] Code implemented strictly according to ACs.

- [x] Unit/Integration tests written and passing (135 total, incl. 40 alarm tests
      plus adversarial reload/snooze/boundary checks run during QA assessment).
- [x] QA assessment passed.
- [x] Code Review approved.
