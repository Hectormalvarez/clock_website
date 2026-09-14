# Sprint — Current

Sprint window: active (no fixed calendar sprint; pipeline-driven).

## Completed (pending final QA)

### US-001 — Multiple Alarms (Epic: Alarms)

- Status: **MERGED + DEPLOYED.** PR #13 merged 2026-09-13 21:17Z (linear
  history, 9 commits).
- Release run #5 succeeded 21:18Z; webhook deploy fired; `/healthz` verified
  HTTP 200 post-deploy.
- Remaining DoD: manual browser check that the alarm tone plays (audio cannot
  be verified in jsdom) — owner task. Then story status → Done.
- Note: the homepage may serve up to 2 h of edge cache (ADR 0006); judge
  deploy freshness via `/healthz` or hashed assets, not the cached HTML.

## In flight

### US-005 — UX Polish & Accessibility Hardening

- Status: **Implementation complete on `feat/us-005-ux-polish`** — all 8 ACs
  verified; awaiting owner QA + code review, then PR into `dev`.
- Delivered: visible labeled fields (alarm create redesign), semantic
  WCAG-AA design tokens (all pairs computed ≥4.7:1), monochrome SVG icons
  (red ⏰ / blue 💤 emojis removed), shared control scale across alarm +
  timer panels, always-visible timer steppers (were hover-only), focus
  management (into panels on open, restored to toggles on close), ring
  overlay `aria-modal` + focus trap + outside-click guard (US-003 items 2–3
  absorbed), shared FLIP helper with unit tests (US-003 item 1 absorbed),
  `prefers-reduced-motion` support. 140 tests passing; 20/20 Playwright
  a11y assertions; 14 before/after screenshots in the story folder.
- Note: alarm/timer/clock **pure cores untouched** — behavior tests pass
  unchanged.

## Ready (not started)

After US-005 closes: owner picks the next epic — US-002 (recurring alarms,
deprioritized) vs US-004 (multi-clock, blocker cleared). HK-5/HK-6 are
standalone housekeeping candidates.

## Dependencies & sequencing

- US-002 can start any time — builds directly on the alarm core.
- US-004's sequencing blocker (shared FLIP helper) is resolved by US-005;
  still needs a PO story + possibly an ADR.
- HK-5/HK-6 are independent of the epics.

## Risks

| Risk                                                                                      | Likelihood | Impact                                        | Mitigation                                   |
| ----------------------------------------------------------------------------------------- | ---------- | --------------------------------------------- | -------------------------------------------- |
| Production alarm audio unverified                                                         | Medium     | Medium (US-001 DoD gap)                       | Owner manual check; tracked above            |
| Stale edge HTML references dead assets after each deploy; cached 404s extend the breakage | High       | Medium (broken homepage up to 2 h per deploy) | HK-6: purge, asset retention, or shorter TTL |
| nginx 1.27 base gets no security updates (EOL mainline)                                   | High       | Medium                                        | HK-5: re-pin to current stable               |
