# @automattic/jetpack-grid

Internal, **private** port of WordPress core's `@wordpress/grid` (the drag-and-drop / resize
grid powering dashboard layouts). Consumed by `@automattic/jetpack-widget-dashboard` and the
Jetpack Premium Analytics dashboard route.

Consumed as **source** (`exports` → `./src/index.ts`); the host build (`wp-build`) compiles the
TypeScript and CSS modules. This package ships no build output.

## Provenance

Ported verbatim from [`WordPress/gutenberg`](https://github.com/WordPress/gutenberg) `packages/grid/src`
@ commit `8a40c807e86` (branch `refactor/wp-build-name-as-module-id`).

When core publishes `@wordpress/grid`, replace this package with the published dependency and
update the import name in consumers. Keep this README's commit reference updated when syncing.

### Local deviations from core

- `src/shared/drag-overlay-drop-animation.ts`: the default-cleanup call uses a `typeof` guard
  instead of an optional call (`cleanupDefault?.()`). Jetpack type-checks with `tsgo`
  (`@typescript/native-preview`), which rejects optional-calling a `void | CleanupFunction`
  union; the guard is semantically identical and passes both `tsc` and `tsgo`.

## Privacy

`"private": true` in `package.json` + `composer.json` without `npmjs-autopublish`/`mirror-repo`
guarantees this package is never published to npm or mirrored to a standalone repo.
