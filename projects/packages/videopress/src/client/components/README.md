# Shared client components

Components in this directory are the package's **shared UI tier**: they may be
imported by any VideoPress surface — the block editor (`src/client/block-editor`),
and the dashboard app (`src/dashboard`,
`routes/`).

Dependency direction:

- `src/client/components` and `src/client/lib` may not import from
  `src/client/block-editor` or `src/dashboard` (type-only
  imports excepted).
- Modules here must be side-effect free at import time (no `window` reads, no
  block or store registration at module scope), since they load in non-editor
  bundles.

Editor- or dashboard-specific components belong in their surface's own
component tree, not here.
