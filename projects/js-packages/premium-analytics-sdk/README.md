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

## What belongs in it

A name enters the SDK when it is a widget kind, such as `Leaderboard`, or a host capability, such as `WidgetRoot`, `describeError`, `useReport` or the attribute fields. The parts a kind is built from stay inside the dashboard, and so does every dashboard policy value: `Leaderboard` caps the rows it shows, and a widget sizes its own request.

Product data hooks are the exception, and a provisional one: `useStatsVideoPlays` and the WordAds hooks stay here only until their packages own the data behind them.

## Stability

`src/index.d.ts` groups the names by what will happen to them. The widget shell, the kinds, the attribute fields, the report scope and `useReport` are the contract. The footer chrome goes when widgets declare their footer as actions the host renders. The chart pieces go when their kinds exist. The product data hooks go with their owners. `Badge` and `Stack` follow `@wordpress/ui`.

`WIDGET_API_VERSION` in the dashboard package records each addition: a consumer compares it before registering, and waits for the minor its imports need.

## Status

Private while the SDK is audited. The types are loose for now and become precise before the package is published to npm.
