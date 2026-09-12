# 5. Pin base images by digest and the toolchain by major

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

A tag like `node:22-alpine` is mutable: the same Dockerfile can build different
bytes on different days. For a project whose main output is a static bundle,
that makes an unexplained production change hard to attribute.

Conversely, pinning the Node version too tightly causes a different kind of
breakage: `lint-staged@17` declares `engines.node >= 22.22.1`, so a pin on Node
20 makes the pre-commit hook unrunnable even though the app itself builds fine.

## Decision

- **Base images are pinned by digest** in every Dockerfile, with the readable
  tag kept in the `FROM` line for humans (the tag is ignored when a digest is
  present).
- **The toolchain is pinned by major** in one place per ecosystem:
  `web/.nvmrc` and `web/package.json` → `engines.node >= 22`. CI resolves the
  version from `web/.nvmrc`, so local and CI runs match without a second
  definition.
- A stale digest is fixed by deliberately updating the `FROM` line rather
  than by removing the pin.

## Consequences

- Bumping a base image is an explicit, reviewable commit. Reproducible builds
  stop being an aspiration.
- Because base images are digest-pinned, `apk add` package pins (hadolint
  DL3018) are redundant; `.hadolint.yaml` ignores that rule with this reasoning
  recorded.
- `.nvmrc` must stay on Node ≥ 22 for as long as `lint-staged` requires it.
  `web/package.json`'s `engines` field is the machine-readable half of the same
  constraint.
