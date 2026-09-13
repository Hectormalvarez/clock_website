# User Story: Multiple Alarms

**Story ID:** US-001  
**Epic:** Alarms  
**Status:** Draft

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

- [ ] **AC-1:** Given the alarms panel is empty, When the user creates an alarm named "Standup" for 09:30, Then it appears in the list, enabled, with its name and time shown.
- [ ] **AC-2:** Given an enabled alarm set for 09:30, When the device clock reaches 09:30 with the page open, Then a visual and audible alert starts, and the alarm is automatically disabled afterward.
- [ ] **AC-3:** Given an alarm is ringing, When the user chooses Snooze, Then the alert stops and the alarm re-arms for 9 minutes later; When the user chooses Dismiss, Then the alert stops and the alarm stays disabled.
- [ ] **AC-4:** Given one or more alarms exist, When the page is reloaded, Then all alarms reappear with their names, times, and enabled/disabled states intact.
- [ ] **AC-5:** Given an alarm is disabled, When its time arrives, Then no alert occurs.
- [ ] **AC-6 (edge case):** Given the user enables an alarm whose time is earlier than the current time, Then it does not ring today and is scheduled for the next occurrence of that time (tomorrow).
- [ ] **AC-7:** Given an alarm is deleted, Then it disappears from the list, no longer rings, and no longer reappears after a reload.
- [ ] **AC-8 (validation):** Given the user creates an alarm, Then an invalid or empty time is rejected with a clear message; a blank name defaults to "Alarm".

---

## 4. Technical Guidance & Architectural Constraints

(Filled in by Architect)

- **Target Files / Boundaries:** TBD
- **Constraints:** TBD

---

## 5. Definition of Done Checklist

- [ ] Code implemented strictly according to ACs.

- [ ] Unit/Integration tests written and passing.
- [ ] QA assessment passed.
- [ ] Code Review approved.
