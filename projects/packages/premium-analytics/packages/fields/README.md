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

## Field types

`src/field-types.ts` registers the controls with widget-primitives'
`registerFieldType`, under `jpa/*` names. A widget attribute references one by
`type` and carries data alone:

```ts
{
	id: 'contentView',
	label: __( 'View', 'jetpack-premium-analytics-pkg' ),
	type: 'jpa/select',
	elements: [ { label: __( 'Posts & pages', 'jetpack-premium-analytics-pkg' ), value: 'posts' } ],
	relevance: 'high',
}
```

`registerFieldTypes()` runs from `@jetpack-premium-analytics/init`, before any
route renders; `useWidgetTypes` then resolves each name into the control and
its DataViews base type. A name nothing registered passes through and the form
skips it, so a typo hides a control rather than breaking the widget.

Storybook and tests hand widget types to the dashboard without going through
`useWidgetTypes`; `resolveFieldTypes()` gives them the same resolution.

| Name                 | Control              | Base type |
| -------------------- | -------------------- | --------- |
| `jpa/select`         | `SelectField`        | `text`    |
| `jpa/toggle-group`   | `ToggleGroupField`   | `text`    |
| `jpa/array-checkbox` | `ArrayCheckboxField` | `array`   |

## Adding a field

Controls implement dataviews' `DataFormControlProps< Item >`. Add the control
to `FIELD_TYPES` so widgets can name it; the name is the only public route to it.

A control that needs per-widget options cannot be named: a field type is one
control for every attribute that references it, and dataviews rebuilds a
normalized field from a fixed set of keys, dropping anything else a descriptor
carries. Such a control is built by a factory called once at module scope, so
the component identity is stable across renders, and the options travel
through the factory:

```ts
attributes: [ reportParamsAttributeField( { withIntervalControl: true, grain: MY_GRAIN } ) ]
```

`grain` is how fine the widget's report is. `presetIds` narrows the quick
presets on offer, as the WordAds chart does for "Last 24 hours"; an instance
already saved on a window the widget stops offering is migrated to an offered
one. `periods` is the bucket sizes its chart draws, so the interval menu never
lists one the chart would clamp away.
