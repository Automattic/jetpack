# Report page

The shared framework for second-level "view all" report pages (Posts & Pages,
Referrers, Locations, …). A module report page is assembled by composing these
pieces with the module's data hook and DataViews field config — composition,
not a bespoke page per module.

```tsx
<ReportPageShell
	visual={ <StatsPageIcon /> }
	breadcrumbs={ <StatsBreadcrumbs items={ [ { label: __( 'Pages' ) } ] } /> }
	subTitle={ __( 'All your posts and archive pages.' ) }
	actions={ downloadButton }
>
	<ReportPageLayout filters={ <DateFiltersPanel /* … */ /> }>
		<ReportPerformanceChart
			primary={ visits.primary.data }
			comparison={ visits.hasComparison ? visits.comparison.data : undefined }
			isLoading={ visits.isLoading }
			interval={ interval }
			onIntervalChange={ setInterval }
		/>
		<ReportRecordsTable
			data={ rows }
			fields={ fields }
			getItemId={ item => String( item.id ) }
			isLoading={ report.isLoading }
			initialView={ { sort: { field: 'views', direction: 'desc' } } }
		/>
	</ReportPageLayout>
</ReportPageShell>
```

- **`ReportPageShell`** — the outer `Page` shell: the shared Jetpack visual,
  Stats breadcrumbs, subtitle, and page-level actions.
- **`ReportPageLayout`** — the report content scaffold: optional internal tabs,
  a filters row, and stacked sections.
  `ReportPageSection` is the bordered card each section renders in.
- **`ReportPerformanceChart`** — the multi-metric visits chart
  (Views/Visitors/Comments/Likes via `useStatsVisits` `stat_fields`), with a
  metric show/hide menu, the time-bucket selector (owned by the page — it
  changes the query), and a collapse toggle. With exactly one visible metric
  and comparison data, the previous period draws as a dashed overlay.
- **`ReportRecordsTable`** — a Core DataViews table over the module's
  summarized rows; search, sorting, column config, and pagination run
  client-side via `filterSortAndPaginate`.
- **`ReportPageTabs`** — the presentational tab bar for report pages with
  multiple views (the `tabs` slot above). It renders `{ id, label }` triggers
  and reports selection upward; panel children render inside the same `Tabs.Root`
  so the tablist and content share one tab/panel relationship. Generic over the
  tab-id string type; pair it with `defineReportTabs` / `useSectionTab` from
  `@jetpack-premium-analytics/routing` for the URL-backed tab state. Panels in
  the children MUST use `ReportPageTabPanel`, not `Tabs.Panel` from
  `@wordpress/ui`: routes and this toolkit each bundle their own `@wordpress/ui`
  copy, and Base UI's tabs context does not cross bundle copies — a route's
  `Tabs.Panel` throws `TabsRootContext is missing` at runtime even though the
  JSX nesting looks right.

Pass `StatsBreadcrumbs` from `@jetpack-premium-analytics/ui` to the shell's
`breadcrumbs` slot. It owns the leading `Stats` crumb and links it back to the
dashboard through `useDashboardLink()`, carrying the shared date range and
comparison so Back returns to the same view. The trailing item carries no `to`
and renders as the page's `h1`, so the report page has no separate title prop.
Pair it with `StatsPageIcon` in the shell's `visual` slot so every Stats page
uses the same header treatment.

`StatsBreadcrumbs` renders router links, so it needs a mounted router. That is
why the shell receives it as a plain `ReactNode` (as on Core's own `Page`) and
the route, not `ReportPageLayout`, builds it. The content layout can still render
outside a router, which is what lets its story compose it independently.

These components do not fetch: the page owns the data hooks and the
`reportParams` derived from the URL (`useReportDateFilters`), and passes
results in as props.

They also mount no providers. The `/reports/$report` stage provides the
surface's context once — React Query, global errors, and the chart theme
(`GlobalChartsProvider`). That is why a page can compose a chart the same way a
widget does: `useSeriesStyles` plus `ComparativeLineChart`, nothing else.
Outside the stage (Storybook), mount `GlobalChartsProvider` with
`useChartTheme()` yourself — see `stories/report-page.stories.tsx`.
