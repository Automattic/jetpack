# Premium Analytics SDK

The SDK the Premium Analytics dashboard provides to plugins that extend it: today, everything a widget imports.

This package holds the contract only: the types of what a widget can import. The dashboard registers the implementation at runtime as the `@automattic/jetpack-premium-analytics-sdk` script module, so a widget never bundles it and every widget on the page shares the dashboard's copy.

## Using it

Depend on the package, `workspace:*` inside the Jetpack monorepo:

```json
"@automattic/jetpack-premium-analytics-sdk": "workspace:*"
```

Import from it in the widget's code:

```js
import { WidgetRoot, WidgetState } from '@automattic/jetpack-premium-analytics-sdk';
```

With wp-build, add the `automattic` scope to `wpPlugin.externalNamespaces`. wp-build finds the package installed, sees it declared as a script module (`wpScriptModuleExports`), and leaves the import external; the page import map resolves it to the dashboard's module.

## Field types

The dashboard registers field types for widget attributes under `jpa/`, the namespace its widget type names use. A name stands for a DataViews type plus the control that edits it, what `type` and `Edit` say on a DataViews field; the widget manifest keeps `type` and drops `Edit`, so the registered name is how a widget picks a control. The widget declares the rest of the field as data, `elements` included.

| Name                 | Type    | Control                                                                                    |
| -------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `jpa/select`         | `text`  | A dropdown over `elements`.                                                                |
| `jpa/toggle-group`   | `text`  | The `elements` as segments of one row; icon segments when every element carries an `icon`. |
| `jpa/array-checkbox` | `array` | One checkbox per element, writing the checked values as an array.                          |

The chart type of a time series widget, as the dashboard's own widgets declare it:

```ts
const CHART_TYPES = [
	{ value: 'line', label: __( 'Line chart', 'my-plugin' ), icon: chartLine },
	{ value: 'bar', label: __( 'Bar chart', 'my-plugin' ), icon: chartBar },
];

{
	id: 'chartType',
	label: __( 'Chart type', 'my-plugin' ),
	type: 'jpa/toggle-group',
	elements: CHART_TYPES,
	relevance: 'high',
}
```

`icon` is a React element for now, so a widget brings its own: `chartBar` is in `@wordpress/icons`, `chartLine` is not. Declaring icons by name, resolved by the host, is an open issue for the dashboard as a whole, not one the SDK settles.

## What belongs in it

A name enters the SDK when it is a widget kind, such as `Leaderboard`, or a host capability, such as `WidgetRoot`, `describeError`, `useReport` or the attribute fields. The parts a kind is built from stay inside the dashboard, and so does every dashboard policy value: `Leaderboard` caps the rows it shows, and a widget sizes its own request.

Product data hooks are the exception, and a provisional one: `useStatsVideoPlays` and the WordAds hooks stay here only until their packages own the data behind them.

## Stability

`src/index.d.ts` groups the names by what will happen to them. The widget shell, the kinds, the attribute fields, the report scope, `useReport` and `toBucketStamp` are the contract. The footer chrome goes when widgets declare their footer as actions the host renders. The chart pieces go when their kinds exist. The product data hooks go with their owners. `Badge` and `Stack` follow `@wordpress/ui`.

`WIDGET_API_VERSION` in the dashboard package records each addition: a consumer compares it before registering, and waits for the minor its imports need.

## Status

Private while the SDK is audited. The types are loose for now and become precise before the package is published to npm.
