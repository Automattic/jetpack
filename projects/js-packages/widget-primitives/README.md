# @automattic/jetpack-widget-primitives

Internal, **private** port of WordPress core's `@wordpress/widget-primitives`: the host-agnostic
toolkit for dashboard widgets. It owns the widget contract types (`WidgetType`, `WidgetName`,
`WidgetRenderProps`, `ResolveWidgetModule`), discovery (`useWidgetTypes()`), and render resolution
(`<WidgetRender>`). It is not tied to any host; `@automattic/jetpack-widget-dashboard` consumes it.

Consumed as **source** (`exports` → `./src/index.ts`); the host build (`wp-build`) compiles the
TypeScript. This package ships no build output.

## Provenance

Ported verbatim from [`WordPress/gutenberg`](https://github.com/WordPress/gutenberg)
`routes/dashboard/widget-primitives` @ commit `8a40c807e86` (branch `refactor/wp-build-name-as-module-id`).

When core publishes `@wordpress/widget-primitives`, replace this package with the published
dependency and update import names in consumers. Keep this commit reference updated when syncing.

## Privacy

`"private": true` in `package.json` + `composer.json` without `npmjs-autopublish`/`mirror-repo`
guarantees this package is never published to npm or mirrored to a standalone repo.
