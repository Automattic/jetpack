# Reports route (`/reports/$report`)

One dynamic route serves every report. The `$report` path segment selects a
report from the registry in `registry.ts`; the stage (`stage.tsx`) looks up the
definition and renders that report's page component. Adding a report does
**not** require a new route — you register it here.

## How to add a report

1. **Create the report module.** Add a `<id>/` folder under `routes/reports/`
   whose entry (e.g. `page.tsx`) default-exports the report's page component.
   The component owns all of the page chrome (header, tabs, widget grid) — the
   stage renders it as-is.

2. **Register one entry** in `REPORTS` in `registry.ts`. Names are getters so translations resolve after the i18n locale data has loaded:

   ```ts
   import { __ } from '@wordpress/i18n';

   export const REPORTS: Record< string, ReportDefinition > = {
   	posts: {
   		id: 'posts',
   		getLabel: () => __( 'All pages', 'jetpack-premium-analytics-pkg' ),
   		// Optional — only for reports that own sections:
   		// resolveSection: value => resolveSectionId( value ),
   		// Optional, for a paid Stats feature: a plan without it gets the locked page.
   		// feature: 'utm',
   	},
   };
   ```

3. **Add its component** to `REPORT_PAGES` in `report-pages.ts`, keyed by the same id:

   ```ts
   import PostsPage from './posts/page';

   posts: PostsPage,
   ```

   The component registry stays out of `registry.ts` because route guards import that metadata and must remain React-free. A registry test fails when a report has no page.

That's it. The report is reachable at `/reports/<id>`. An unknown or missing
`$report` redirects to the dashboard (`route.ts`).

## Naming a report

`getLabel` is the report's one name: its own trailing breadcrumb, the crumb
back to it from a detail page, and the heading over its records (`All pages`).
Pages read it from `REPORTS` and declare no strings of their own.

A tabbed report heads each section with its open tab's label instead, through
the tab set's `getTabLabel( activeTab )`.

## Providers the stage mounts for every report

The stage wraps every report page in `AnalyticsQueryClientProvider` (React
Query) and `GlobalChartsProvider` with the shared chart theme. Report pages therefore call data hooks and compose chart components
directly (`useSeriesStyles` + `ComparativeLineChart`, exactly like widgets do)
without mounting any providers of their own.

## URL contract a report inherits

`route.ts` seeds and normalizes the shared report-window params, so every report
page can read them from the URL search without re-implementing the seed:

- `from`, `to`, `interval` — the current period and chart granularity.
- `comp`, `compare_from`, `compare_to`, `compare_preset` — comparison state.
- `preset`, `period` — the resolved date-range preset and period.
- `step` — how the date arrows step the window, set by a step and cleared by any other range change.
- `section` — resolved through the report's `resolveSection` when the report
  defines one, so a shared URL never persists a section the report can't render.

A report may add its own report-specific params on top of these (e.g. a view
selector or filters); those live alongside the shared params in the URL and are
owned by the report's page component.

## Loading boundary

`@wordpress/build` lazy-loads this route's `content.js`; that route bundle is the
loading boundary for every report page. The route build uses esbuild with
`outfile` and no code splitting, so an additional dynamic `import()` inside the
stage would still inline every report into `content.js` while adding an
unnecessary asynchronous render boundary.

True report-level lazy-loading would require each report to ship as its own
registered `@wordpress/build` module and be imported by module id through the
page import map. Dashboard widget render modules already use that mechanism; see
`src/widget-modules.php`.
