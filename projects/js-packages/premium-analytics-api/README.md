# Premium Analytics API

The API the Premium Analytics dashboard provides to plugins that build widgets for it.

This package holds the contract only: the types of what a widget can import. The dashboard registers the implementation at runtime as the `@automattic/jetpack-premium-analytics-api` script module, so a widget never bundles it and every widget on the page shares the dashboard's copy.

## Using it

Depend on the package, `workspace:*` inside the Jetpack monorepo:

```json
"@automattic/jetpack-premium-analytics-api": "workspace:*"
```

Import from it in the widget's code:

```js
import { WidgetRoot, WidgetState } from '@automattic/jetpack-premium-analytics-api';
```

With wp-build, add the `automattic` scope to `wpPlugin.externalNamespaces`. wp-build finds the package installed, sees it declared as a script module (`wpScriptModuleExports`), and leaves the import external; the page import map resolves it to the dashboard's module.

## Status

Private while the API is audited. The types are loose for now and become precise before the package is published to npm.
