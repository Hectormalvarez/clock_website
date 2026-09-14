# User Story: UX Polish & Accessibility Hardening

**Story ID:** US-005
**Epic:** Platform Quality (cross-feature)
**Status:** In progress

---

## 1. Description

**As a** visitor using the clock, timer, or alarms,
**I want** the panels to be legible, proportional, and fully accessible,
**So that** the product feels deliberate and cohesive, and future features
build on a design system instead of fighting one.

Priority owner decision (2026-09-13): this story **takes priority over
US-002 (recurring alarms) and US-004 (multi-clock)**. It absorbs backlog
US-003 items 1–3.

---

## 2. Context & Scope

- **In Scope:**
  - Visible, persistent field labels for every input (placeholder alone is
    not a label — current placeholders are browser-default gray on `#111`)
  - One shared control scale across alarm and timer panels (the alarm create
    row currently mixes 1.2em inputs, an 0.8em/0.7-opacity Add button, and
    ~20px tap targets)
  - WCAG AA contrast for all text/background pairs, enforced by computed
    ratios (error `#f00` on `#1a1a1a` is ≈4.35:1 today; note text at opacity
    0.55 ≈4.5:1; disabled rows ≈3:1)
  - Semantic design tokens to replace the per-element "opacity soup"
    (0.3–0.75) — text tiers, placeholder, input surface, focus ring, danger
  - Keyboard + screen-reader behavior: focus moves into opened panels,
    returns to the toggle on close; ring overlay traps focus and is
    `aria-modal`; toggles expose `aria-expanded`/`aria-controls`; alarm list
    changes announced
  - `prefers-reduced-motion` support for pulses and panel/FLIP animations
  - Outside-click no longer closes the alarm panel while the ring overlay is
    up (absorbed US-003 item 2)
  - FLIP panel helper extracted to `shared/dom/` (absorbed US-003 item 1)
- **Out of Scope:**
  - Retheming (the green/dark terminal aesthetic stays — this story
    normalizes within it)
  - New features, behavior changes to the pure cores, storage format changes
  - Sound design (alarm tone is `playBeep()`, unchanged; audible verification
    stays a manual QA step)

---

## 3. Acceptance Criteria

- [ ] **AC-1:** Every input has a persistent visible label; placeholder text
      uses a themed token.
- [ ] **AC-2:** All text/background pairs pass WCAG AA (4.5:1 normal text,
      3:1 large text), verified by computed ratios recorded in this story.
- [ ] **AC-3:** Alarm and timer panels share one control scale; the alarm
      create section uses a labeled layout with comfortable spacing.
- [ ] **AC-4:** Keyboard-only pass: opening a panel moves focus into it,
      closing restores focus to the toggle, the ring overlay traps focus and
      is `aria-modal` (Esc/Enter dismiss), and no keyboard trap exists.
- [ ] **AC-5:** Panel toggles expose `aria-expanded`/`aria-controls`; alarm
      list changes are announced via a polite live region; all rendered row
      controls are labeled.
- [ ] **AC-6:** `prefers-reduced-motion` disables pulses, panel open/close,
      and FLIP animations.
- [ ] **AC-7:** Interactive targets are ≥24×24 px (WCAG 2.5.8), ~44 px where
      space allows.
- [ ] **AC-8:** Outside click does not close the alarm panel while ringing.

---

## 4. Technical Guidance & Architectural Constraints

- **Token layer first:** `variables.css` gains semantic tokens (text tiers,
  input surface, placeholder, focus ring, AA-safe danger, control sizes);
  component CSS consumes tokens — no raw opacities for text tiers.
- **Markup:** `index.html` gains `<label>` elements (or equivalent durable
  text) and a panel heading; row markup changes are limited to what ACs
  require.
- **UI wiring only:** `alarm.ui.ts` / `timer.ui.ts` handle focus management,
  live regions, and the ring guard; `clock.ui.ts` untouched.
- **New pure module:** `shared/dom/flip.ts` (the FLIP helper from both UI
  files) with mirrored unit tests; jsdom tests for focus/aria behavior.
- **Verification:** screenshots (desktop/mobile, before/after, error, ring,
  reduced-motion) stored under `docs/stories/US-005/screenshots/` and
  reviewed per phase; `make check` must pass; 135 existing tests must keep
  passing unchanged.
- No new npm dependencies; no ADR required (token pattern already exists).

---

## 5. Definition of Done Checklist

- [ ] All ACs verified (screenshots + computed contrast + jsdom tests).
- [ ] `make check` green; prettier clean.
- [ ] Backlog updated (US-003 absorbed; priorities adjusted).
- [ ] QA assessment passed; code review approved.
