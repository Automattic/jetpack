# Jetpack components denylist

Curate discouraged `@automattic/jetpack-components` imports in
[`jetpack-components-denylist.json`](./jetpack-components-denylist.json).

The ESLint rule `@automattic/jetpack/use-recommended-jetpack-components` reads this
file and reports imports that match entries in `components` or `subpaths`.

## How to curate

1. Open `jetpack-components-denylist.json`.
2. **Allow a component:** delete its key from `components` (or `subpaths` for subpath imports).
3. **Change the lint message:** edit the string value or `{ "message": "..." }` object.
4. **Add a component:** add a key under `components` for named imports from the main
   package, or under `subpaths` for `@automattic/jetpack-components/<path>` imports.

When writing messages, prefer **`@wordpress/ui`** over **`@wordpress/components`**
when both packages ship the same primitive (e.g. `Button`, `Text`, `Popover`,
`Notice`, `Dialog`, `Badge`, `Card`). Use `@wordpress/components` only when there
is no `@wordpress/ui` equivalent yet (e.g. `Spinner`, `ToggleControl`).

Message placeholders:

- `{{ name }}` — imported component or subpath name
- `{{ source }}` — full import source (e.g. `@automattic/jetpack-components`)

## Suppressions

Existing violations are tracked in [`eslint-excludelist.json`](../eslint-excludelist.json).

## Scope

The rule is disabled inside `projects/js-packages/components/` so the package can
import its own modules.
