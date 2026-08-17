# Report page

The shared framework for second-level "view all" report pages (Posts & Pages,
Referrers, Locations, …). A module report page is assembled by composing these
pieces with the module's data hook and DataViews field config — composition,
not a bespoke page per module.

```tsx
const label = __( 'All pages' );

<ReportPageShell
	visual={ <StatsPageIcon /> }
	breadcrumbs={ <StatsBreadcrumbs items={ [ { label } ] } /> }
	subTitle={ __( 'All your posts and archive pages.' ) }
	actions={ downloadButton }
>
	<ReportPageLayout title={ getTabTitle( activeTab ) } dateFilters={ dateFilters }>
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
  the section header, and stacked sections.
  `ReportPageSection` is the bordered card each section renders in.

## The section header

`ReportPageLayout` renders `SectionHeader` from `@jetpack-premium-analytics/ui`
— the same component the dashboard's sections use — so a report and the section
it was reached from describe their date configuration identically: the report's
title on the left with the applied window spelled out under it, the date picker
on the right.

Pass the report's title as `title` and the `useReportDateFilters` controller as
`dateFilters`; the layout composes `DateFiltersPanel` and derives the subtitle
with `getSectionSubtitle` itself. Every report mounts the same instance of the
picker, which is one decision here rather than one per report.

That instance is the range alone: no interval control, because a records table
is not bucketed by one, and no period-over-period comparison. The subtitle names
neither, since a header must not describe a configuration its reader cannot
reach.

Hiding them is presentational. The controller still carries the comparison and
the interval, nothing here writes to the URL, and `buildRangePatch` keeps
`compare_from`/`compare_to` in step with a range edited on a report page. A
comparison set on the dashboard therefore survives a trip through a report, and
comes back pointing at the right period rather than at stale dates. Making this
server-driven per report, the way sections already declare
`date_filter_options.with_date_comparison`, is WOOA7S-1952.

A report page carries three names, and they are not interchangeable:

| name | where it shows | example |
| --- | --- | --- |
| report label | the trailing breadcrumb | `All pages` |
| tab label | the tab strip | `Posts & Pages`, `Archives` |
| section title | the header's `h2` | `Posts & pages report` |

`title` is the third one. On a tabbed report it belongs to the open tab, so take
it from the tab set's `getTabTitle()` (`defineReportTabs` in
`@jetpack-premium-analytics/routing`), which falls back to that tab's own label
where no title is declared. A report with no tabs passes its own name.

The breadcrumb takes the report label instead, and the two differ on purpose:
one names the report, the other names the records currently on screen.

A report with no date window (Annual insights, Emails, Tags & categories, …)
passes `title` alone. Its header is the title, with no subtitle and no controls.

Not pinned, unlike the dashboard's: on a report page the header scrolls away
with the content. The pin and its condense-on-scroll live in the surface's own
CSS, not in `SectionHeader` (see `routes/dashboard/stage.module.scss`).
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
and renders as the page's `h1`, so the shell takes no separate title prop.
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
