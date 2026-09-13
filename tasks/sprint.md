# Sprint — Current

Sprint window: active (no fixed calendar sprint; pipeline-driven).

## In flight

### US-001 — Multiple Alarms (Epic: Alarms)
- Status: **COMPLETE — awaiting release approval.**
- PR #13 (`dev` → `main`): OPEN, MERGEABLE, all 8 CI checks SUCCESS.
- Story DoD: implementation ✅, tests ✅ (135 passing), QA ✅, code review ✅.
- Blocker: none technical. **Merge of PR #13 deploys to production
  automatically** (Release workflow → webhook) — human approval gate, owned by
  the project owner.
- Post-merge tasks:
  1. Verify `https://clock.taylormadetech.net/healthz` (live, `DYNAMIC` — do
     not judge freshness by the cached homepage; up to 2h edge cache).
  2. Manual browser check: alarm tone plays (visual overlay is verified;
     audio cannot be verified in jsdom).
  3. Story status → Done after production verification.

## Ready (not started)

Nothing yet — next sprint content comes from the backlog once US-001 closes
and the owner picks the next epic (Alarms follow-ups vs. Multi-clock).

## Dependencies & sequencing

- US-002 (recurring alarms) depends only on US-001 merge — can start any time
  after, even against `dev` before `main` moves.
- US-003 (review follow-ups) is independent; best bundled with US-002 or US-004.
- US-004 (multi-clock) should wait for US-003 item 1 (shared FLIP helper) and
  needs PO + possibly an ADR.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PR #13 merge forgotten; work silently stalls | Medium | High (pipeline blocked) | This sprint file; owner decides merge timing explicitly |
| Two unrelated `chore(cline)` commits ride in PR #13 | Low | Low (cosmetic history) | Owner may strip before merge if desired |
| Background-tab throttling delays rings up to ~1 min | By design | Low | Documented in-panel; matches story's stated limitation |
| CI action-runtime deprecation warnings accumulate | Low | Medium later | HK-2 on backlog |
