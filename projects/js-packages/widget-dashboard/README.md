# @automattic/jetpack-widget-dashboard

Internal, **private** port of WordPress core's dashboard widget engine (the future
`@wordpress/dashboard`): the stateless `WidgetDashboard` rendering engine plus the dashboard
preference hooks (`useDashboardLayout`, `useDashboardGridSettings`). The consumer owns layout
and edit-mode state; the engine renders and emits change events.

Depends on `@automattic/jetpack-widget-primitives` (widget contract + discovery) and
`@automattic/jetpack-grid` (grid surface). Consumed as **source** (`exports` → `./src/index.ts`);
the host build (`wp-build`) compiles the TypeScript and CSS modules. Ships no build output.

## Provenance

Ported from [`WordPress/gutenberg`](https://github.com/WordPress/gutenberg)
`routes/dashboard/{widget-dashboard, hooks, lock-unlock.ts}` @ commit `8a40c807e86`
(branch `refactor/wp-build-name-as-module-id`). Cross-package imports were rewritten:
`@wordpress/grid` → `@automattic/jetpack-grid`, `../widget-primitives` →
`@automattic/jetpack-widget-primitives`. Keep this commit reference updated when syncing.

### Local deviations from core

- `src/widget-dashboard/utils/normalize-grid-settings/normalize-grid-settings.ts`: the return
  spread casts `settings as WidgetGridLayoutSettings`. `tsgo` does not narrow the settings union
  after the `( settings.model ?? 'grid' ) === 'masonry'` guard, so the cast (mirroring the one
  already on the line above) is needed to add `rowHeight`. Semantically identical to core.
- `eslint.config.mjs` relaxes several rules that conflict with core's house style (see that file).

## Privacy

`"private": true` in `package.json` + `composer.json` without `npmjs-autopublish`/`mirror-repo`
guarantees this package is never published to npm or mirrored to a standalone repo.
