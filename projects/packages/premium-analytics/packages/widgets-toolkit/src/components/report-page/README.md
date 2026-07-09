# Report page

Shared building blocks for the second-level report pages. This folder will grow
to host the full report-page framework; for now it ships the section-tab bar and
the header breadcrumbs.

- **`ReportPageTabs` / `ReportPageTabPanel`** — the presentational tab bar for
  report pages with multiple views. `ReportPageTabs` renders `{ id, label }`
  triggers and reports selection upward; `ReportPageTabPanel` renders each
  panel inside the same `Tabs.Root` so the tablist and content share one
  tab/panel relationship. Generic over the tab-id string type; pair it with
  `defineReportTabs` / `useSectionTab` from `@jetpack-premium-analytics/routing`
  for URL-backed tab state. Panels in the children MUST use `ReportPageTabPanel`,
  not `Tabs.Panel` from `@wordpress/ui`: routes and this toolkit each bundle
  their own `@wordpress/ui` copy, and Base UI's tabs context does not cross
  bundle copies — a route's `Tabs.Panel` throws `TabsRootContext is missing` at
  runtime even though the JSX nesting looks right.
- **`StatsBreadcrumbs`** — the `Stats / <title>` breadcrumb for a report page
  header. The leading crumb links back to the dashboard, carrying the shared
  date range and comparison so Back returns to the same view.
