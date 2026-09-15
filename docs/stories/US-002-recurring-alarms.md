# User Story: Recurring (Daily-Repeat) Alarms

**Story ID:** US-002  
**Epic:** Alarms  
**Status:** Done — deployed to production (PR #18, rebase-merged
2026-09-15); live ring owner-verified on prod 2026-09-15

---

## 1. Description

**As a** visitor who keeps the clock site open at their desk,  
**I want to** set an alarm that rings every day at the same time,  
**So that** I don't have to re-create my daily alarms (break start, lunch, wrap-up) every morning.

---

## 2. Context & Scope

- **Source:** the MVP cut recorded in US-001 ("Out of Scope: daily-repeat
  alarms — v2 story if users ask"). Owner prioritised this ahead of US-004
  and deferred US-004 to individual follow-up work (2026-09-14).
- **In Scope:**
  - A **Repeat daily** option on alarm creation (checkbox in the create form)
  - A repeat alarm rings at its configured time **every day** while enabled,
    including across page reloads — it is never consumed by ringing
  - Dismissing or snoozing a repeat alarm never turns it off; the only way
    to stop it is the enable/disable toggle
  - A visible daily-repeat indicator on the alarm list rows
  - One-shot alarms (US-001 behaviour) remain available and unchanged
  - Legacy persisted alarms (created before this story) load unchanged as
    one-shot alarms — no data loss, no manual migration
- **Out of Scope:**
  - **Weekday scheduling** (e.g. "weekdays only", custom day-of-week sets) —
    deliberately deferred. The core stores `repeat` as a simple daily flag
    today; a future story can widen it to a day-set without a breaking
    schema change (see §6)
  - Interval-based recurrence (e.g. "every 2 hours"), calendar-date alarms
  - Configurable snooze duration; custom sounds
  - Ringing when the tab is closed; notifications; sync/backends

---

## 3. Acceptance Criteria

_These criteria define "Done." Every criterion must be verified by QA._

- [x] **AC-1:** Given the create form, When the user checks "Repeat daily" and adds a 09:30 alarm, Then the alarm appears in the list enabled, marked with the daily-repeat indicator.
- [x] **AC-2:** Given an enabled daily-repeat alarm for 09:30, When the clock reaches 09:30, Then the alarm rings, and afterwards it remains enabled — the next day at 09:30 it rings again.
- [x] **AC-3:** Given a daily-repeat alarm that just rang, When the user dismisses it, Then the alarm stays enabled and rings again the following day (including across a page reload).
- [x] **AC-4:** Given a daily-repeat alarm, When the user disables its toggle, Then it never rings again until re-enabled (toggling also clears any pending snooze).
- [x] **AC-5:** Given an alarm created before this story (persisted without a repeat flag), When the page loads, Then it behaves exactly as a one-shot alarm (rings once, auto-disables).
- [x] **AC-6:** Snooze works identically for daily-repeat alarms: the snoozed ring fires at the snooze time, and afterwards the alarm is still armed for the next day.
- [x] **AC-7:** One-shot alarms created after this story keep US-001 semantics exactly: ring once, auto-disable.
- [x] **AC-8:** While a daily-repeat alarm is ringing and a second one becomes due, the second stays armed and rings on a later tick (one overlay at a time, as in US-001).

---

## 4. Design Notes

- The `Alarm` record gains a persisted `repeat: boolean` flag (default
  `false`). Persistence stays schema-additive: `parseAlarms` treats a
  missing flag as `false`, so old saved JSON needs no migration step.
- The core's ring action branches: one-shot alarms set `enabled: false`
  (US-001); repeat alarms only clear a pending snooze, so `todayAt()` re-arms
  them naturally on the next day's tick window.
- The create form follows US-005's control language (label + checkbox on the
  shared control scale); the row indicator is a monochrome inline SVG in
  `currentColor`, matching the existing icon set.
- Pure-core changes live entirely in `alarm.core.ts`; the DOM layer only
  reads/writes the new flag.

## 5. Verification Plan

- Unit tests mirrored under `tests/unit/features/alarm/`: ring-stays-armed,
  next-day re-ring (tick with a next-day `Date`), dismiss/reload survival,
  disable clears snooze, legacy-JSON default, snooze interplay, second-due
  queuing.
- Full `make check` + `format:check`; Playwright screenshot pass of the
  create form and list rows (before/after) using the existing `/tmp/ux-shots`
  tooling.

## 6. Future Work

- **Weekday scheduling:** widen the persisted `repeat: boolean` to a day
  set (e.g. `repeatDays: number[]` or a bitmask). Because this story's flag
  is schema-additive and normalised at parse time, that change is backward
  compatible: `repeat: true` can be read as "all seven days" by the future
  implementation, and old one-shot records (flag absent) keep working.

## 7. Verification Record (2026-09-15)

- 12 new unit tests (ring-stays-armed, next-day re-ring, dismiss/reload
  survival, disable-clears-snooze, legacy JSON, snooze interplay,
  second-due queuing); full suite 152/152; `make check` green; 7/7
  Playwright assertions; screenshots in the story folder.
- Deployed via PR #18 (rebase-merged into `main`); Release workflow and
  webhook deploy succeeded; `/healthz` 200.
- Owner-verified on prod: repeat alarm rings live and behaves as specified.
