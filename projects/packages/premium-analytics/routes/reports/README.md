# Reports route (`/reports/$report`)

One dynamic route serves every report. The `$report` path segment selects a
report from the registry in `registry.ts`; the stage (`stage.tsx`) looks up the
definition and lazily renders that report's page component. Adding a report does
**not** require a new route — you register it here.

## How to add a report

1. **Create the report module.** Add a `<id>/` folder under `routes/reports/`
   whose entry (e.g. `page.tsx`) default-exports the report's page component.
   The component owns all of the page chrome (header, tabs, widget grid) — the
   stage renders it as-is.

2. **Register one entry** in `REPORTS` in `registry.ts`. Labels are getters so
   translations resolve after the i18n locale data has loaded; `load` is a
   dynamic import of the page component:

   ```ts
   import { __ } from '@wordpress/i18n';

   export const REPORTS: Record< string, ReportDefinition > = {
   	posts: {
   		id: 'posts',
   		getTitle: () => __( 'Posts & pages', 'jetpack-premium-analytics' ),
   		// Optional — only for reports that own sections:
   		// resolveSection: value => resolveSectionId( value ),
   		load: () => import( './posts/page' ),
   	},
   };
   ```

That's it. The report is reachable at `/reports/<id>`. An unknown or missing
`$report` redirects to the dashboard (`route.ts`).

## Providers the stage mounts for every report

The stage wraps every report page in `AnalyticsQueryClientProvider` (React
Query), `GlobalErrorProvider`, and `GlobalChartsProvider` with the shared chart
theme. Report pages therefore call data hooks and compose chart components
directly (`useSeriesStyles` + `ComparativeLineChart`, exactly like widgets do)
without mounting any providers of their own.

## URL contract a report inherits

`route.ts` seeds and normalizes the shared report-window params, so every report
page can read them from the URL search without re-implementing the seed:

- `from`, `to`, `interval` — the current period and chart granularity.
- `comp`, `compare_from`, `compare_to`, `compare_preset` — comparison state.
- `preset`, `period` — the resolved date-range preset and period.
- `section` — resolved through the report's `resolveSection` when the report
  defines one, so a shared URL never persists a section the report can't render.

A report may add its own report-specific params on top of these (e.g. a view
selector or filters); those live alongside the shared params in the URL and are
owned by the report's page component.

## Note on lazy-loading

`load` is a dynamic `import()` behind a `React.lazy` + `Suspense` boundary in the
stage, which is the correct seam for lazy report modules. Today the route build
(`@wordpress/build`) bundles each route with esbuild using `outfile` and no code
splitting, so a `import()` of an in-route module is inlined into the route's
single `content.js` bundle rather than emitted as a separate network chunk — the
lazy interface works, but does not (yet) split at the network level. True
network-level lazy-loading would slot in if a report is instead shipped as its
own registered `@wordpress/build` module and imported by module id through the
page import map (the mechanism dashboard widget render modules already use — see
`src/widget-modules.php`).
