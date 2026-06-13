# @jetpack-premium-analytics/fields

Custom DataForm field controls for Premium Analytics widgets.

## Why this is a separate package (and a script module)

Widget *metadata* modules (`widgets/<name>/widget.ts`) are built by wp-build's
widget metadata pipeline, which has **no style plugins** — nothing in a metadata
module's bundled import graph may touch `.scss`/`.module.scss`. Styled field
editors (date pickers, etc.) therefore cannot be bundled into metadata modules.

This package declares `wpScriptModuleExports`, which changes everything:

1. **Phase 1 (transpile)** compiles this package's sources — including any
   CSS-module imports in its dependency chain — into scss-free `build-module/`
   output via the style runtime.
2. **Phase 2 (bundle)** builds that output into a registered script module
   (`@jetpack-premium-analytics/fields`).
3. When a widget's `widget.ts` imports from this package, the import is
   **externalized** (same mechanism as `@wordpress/*` script modules): the
   metadata bundle carries only a module dependency, resolved at runtime via
   the page import map. The metadata build never sees a stylesheet.

A single shared copy of the field controls is loaded per page, regardless of
how many widgets reference them.

## Adding a field

Export the control from `src/index.ts`. Controls implement dataviews'
`DataFormControlProps< Item >` and are referenced from widget metadata as:

```ts
attributes: [ { id: 'reportParams', label: 'Range', Edit: ReportParamsField } ]
```
