# Memory Bank

I am Cline. My memory resets completely between sessions, so I rely entirely on my Memory Bank to understand this project and continue work effectively. At the start of EVERY task, read ALL memory bank files listed below — this is not optional.

## Memory Bank Structure

All files live in `memory-bank/` and build on each other:

1. `projectbrief.md` — foundation document: core requirements and goals. Source of truth for project scope. Created at project start if missing.
2. `productContext.md` — why the project exists, the problems it solves, how it should work.
3. `activeContext.md` — current work focus, recent changes, next steps, active decisions. Updated most frequently.
4. `systemPatterns.md` — system architecture, key technical decisions, design patterns, component relationships.
5. `techContext.md` — technologies, development setup, constraints, dependencies.
6. `progress.md` — what works, what is left, current status, known issues.

Additional files may be added under `memory-bank/` for complex features, integrations, API documentation, or deployment procedures.

## Workflow

- **"initialize memory bank"** — create the structure (starting from `projectbrief.md`) by analyzing the codebase.
- **"follow your custom instructions"** — read all memory bank files and continue where the last session left off.
- **"update memory bank"** — review ALL files and update them. Trigger after significant changes or milestones.

## Update Triggers

1. Discovering a new project pattern
2. After implementing significant changes
3. On explicit "update memory bank" request (review ALL files)
4. When context needs clarification to proceed

## Maintenance

The memory bank is a cache, not a journal. On every update:

- Prune `activeContext.md` aggressively — completed items are deleted, not archived. It must stay readable in seconds.
- Graduate stable, lasting knowledge into `systemPatterns.md` / `techContext.md`; session noise dies in `activeContext.md`.
- Treat edits to `projectbrief.md` as exceptional — it changes rarely.
- Delete entries that no longer hold; stale context is worse than no context.

The Memory Bank is the only link to previous work. Maintain it with precision — effectiveness depends entirely on its accuracy.