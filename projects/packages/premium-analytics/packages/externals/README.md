# `@jetpack-premium-analytics/externals`

A passthrough script module for the heavy third-party libraries the dashboard shares:
`@automattic/charts`, `@wordpress/ui`, and `@wordpress/dataviews`.

## Why this exists

Every package under `packages/` that declares `wpScriptModuleExports` is compiled into its own
script module, and wp-build externalises imports between those modules. Anything a module imports
from npm, however, is bundled *into* that module — so a library used by both `ui` and
`widgets-toolkit` was compiled into both.

That is a build-output problem, not a runtime one. Premium Analytics is vendored into both
`plugins/jetpack` and `jetpack-mu-wpcom`, so each module's `index.min.js` and `index.min.js.map`
ship twice. Because minified bundles are single-line, a one-character source change rewrites the
whole file, and the sun/moon deploy sees the full artifact as a diff. With ~950 KB of npm code
compiled into `widgets-toolkit`, an unrelated tweak to a helper produced megabytes of churn and
tripped the wpcom PR size limit (WOOA7S-1836).

Concentrating those libraries here means they are compiled once, into a module whose contents only
change when the libraries themselves are upgraded. Feature work no longer rewrites them.

## Rules

- **Re-export only.** No components, hooks, helpers, or types of our own — a change here
  invalidates the artifact for everyone, which is exactly what this package exists to avoid.
- **Import from here, never from the library directly.** `import { LineChart } from
  '@automattic/charts'` inside another module bundles charts into that module again and silently
  undoes the split.
- **Adding an export is cheap; adding a library is not.** A new library only belongs here if more
  than one module needs it, or if it is large enough that re-emitting it per module hurts.

Libraries WordPress already registers as script modules or globals (`@wordpress/components`,
`@wordpress/data`, `@wordpress/i18n`, `react`, …) are externalised by wp-build on their own and
must **not** be routed through here.
