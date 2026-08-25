# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-08-25
### Added
- Add an Ads dashboard section showing WordAds earnings and performance. [#51422]
- Charts: Name each legend item by metric, folding a metric's two periods into one item. Traffic summary: add the paired metric to the chart, hidden until revealed from the legend. [#51468]
- Insights: Add a Popular hours widget and show it instead of Most popular day by default. [#51239]
- Link the post list table's views column to the post detail page. [#51357]
- Locations: Name the regions behind each country total in the Regions map tooltip. [#51312]
- Page the calendar heatmaps through weeks that do not fit the tile with floating hover arrows, replacing the post detail header pager and the Insights heatmaps' silent clipping. [#51437]
- Referrers report: Add referrer groups that open folded and expand on demand. [#51465]

### Changed
- Chart widgets: Follow the page chart interval control instead of a per-widget Group by. [#51278]
- Latest emails sent: Drop the bar behind each row and show the subject and rate as a plain list. [#51425]
- Leaderboard: Replace the deprecated `--a8c--charts--leaderboard--bar--border-radius` variable with `--a8c-charts-border-radius-leaderboard-bar`. [#51308]
- Name comparison dates in the dashboard header, omit weekdays from ranges longer than a week, and omit the year when it matches the current range. [#51420]
- Traffic: Offer only the groupings the selected date range supports in the chart's Group by control. [#51446]

### Fixed
- Apply the first widget section flex-column workaround to the post and video detail routes too. [#51434]
- Charts: Label chart points by the bucket they name rather than by the viewer's time zone, and format axis ticks and tooltips at the series' declared bucket size. [#51445]
- Date comparison: End a sub-day previous period immediately before the reference window instead of one instant inside it. [#51374]
- Date filters: Compute day boundaries and daylight-saving wall times in the site's timezone instead of the visitor's browser timezone. [#51419]
- Fix charts getting stuck on their loading skeleton after switching a control that turns one of the underlying requests off. [#51443]
- Insights: Scope the calendar heatmaps to the selected period, so the card no longer draws and reports on years outside it. [#51385]
- Label Subscribers chart and email timeline points by the bucket they name rather than by the viewer's time zone. [#51499]
- Show only the rows that fit the tile for Latest subscribers, Latest likes, and Latest comments, while keeping the "N more" footer visible. [#51379]
- Show the dashboard right away instead of a sync screen, and flag the Store section's numbers as incomplete while store data is still syncing. [#51279]
- Stats: Compare a date range against a previous month or year of the same length, unless the range is whole calendar months. [#51469]
- Stats: Stamp bucket dates as timezone-naive site-local wall times, fixing report dates that could read a day off for sites away from UTC. [#51499]
- Traffic: Start the chart's Group by control from the dashboard's interval, and replace Auto with hourly grouping. [#51446]

## [0.3.0] - 2026-08-20
### Added
- Date controls: Let each dashboard section declare whether its header offers the period-over-period comparison control. [#51230]
- Date controls: Offer an hourly view for multi-day ranges under a week, keeping days as the default. [#51118]
- Date controls: Step the active window backward or forward by its length. [#51118]
- Detail pages: Give the post views, video views and email timeline charts the metric total headline and the chart-type control, sharing one chart-display attribute definition across the chart widgets. [#51198]
- Insights: Add a calendar heatmap of daily site views with centered loading and error states. [#51139]
- Insights: Add a Popular days widget showing the busiest day of the week and how views are distributed across the week. [#51140]
- Post detail: Give the email tabs an email header identity — envelope tile and the email sent date. [#51260]
- Top locations: Offer Regions in the widget's "View by" control. [#51267]

### Changed
- Charts: Derive series colors from the theme accent instead of a fixed palette, so neighbouring categories stay distinguishable. [#51356]
- Chart widgets: Pick the chart type from an icon toggle instead of a dropdown. [#51337]
- Chart widgets: Remove the Metrics selector from Traffic summary, Subscribers summary, WordAds, and Store performance — the metric tabs already choose what the chart plots. [#51163]
- Dashboard: Fade the section header subtitle out as the widgets scroll. [#51232]
- Dashboard: Give each section its own heading and description. [#51092]
- Dashboard: Hide the Subscribers tab on sites where the Jetpack subscriptions module is turned off. [#51242]
- Dashboard: Keep the section title and date controls in view while the widgets scroll. [#51232]
- Date controls: Clarify comparison and interval controls and shorten custom-range labels. [#51231]
- Date filters: Drop the "Last" prefix from the 7-day, 30-day, and 12-month preset labels. [#51340]
- Detail pages: Match the dashboard's tightened widget Card padding. [#51199]
- Detail pages: Stretch the post highlights row full-width and label video dates as upload dates. [#51257]
- Email clicks: Restore the country map beside the Locations leaderboard. [#51258]
- Highlights: Follow the section's all-time and yearly date selection instead of always showing the most recent year, and show every metric on a dashboard whose layout carries no metric selection. [#51084]
- Insights: Give the Traffic views activity heatmap two rows by default, so each day shows its view count. [#51240]
- Metric tabs: Improve card layout and render a single metric as a static headline. [#51142]
- Posting activity: Show more history, larger cells, and a count-first tooltip, and drop the Fewer/More posts legend. [#51161]
- Post traffic activity: Show more weeks per page in the views heatmap. [#51201]
- Reports: Name a report and the records it is showing separately, so the breadcrumb reads "All pages" where the heading reads "Posts & pages report". [#51309]
- Reports: Remove unsupported period-over-period comparison controls while preserving the dashboard selection. [#51309]
- Reports: Show the report title and the applied date range above the records, matching the dashboard's section header. [#51309]
- Section header: Truncate a long title with an ellipsis instead of wrapping it and compressing the date controls. [#51133]
- Serve the dashboard only from its registered, capability-gated admin page. [#51203]
- Shares: Hide the widget outside WPCOM Simple, where share counts are never recorded. [#51244]
- Show a skeleton placeholder instead of a spinner while widget content loads. [#51202]
- Show content-shaped skeleton placeholders while widget content loads. [#51207] [#51236] [#51237] [#51418]
- VideoPress: Hide video analytics on sites without VideoPress. [#51243]
- Widget copy: Use sentence case for the drill-down back links, and shorten the Popular post description to one sentence. [#51171]
- Widgets: Order the traffic metric tiles Views, Visitors, Comments, Likes, and name the Latest emails sent view selector "By open rate" and "By click rate". [#51206]
- Widgets: Restyle the footer actions to match the dashboard design — a "View all" link and an icon-only CSV download. [#51174]
- Widget settings: Drop the "Number of results" control and request a shared row limit instead; report pages own showing more rows. [#51378]

### Fixed
- Darken and enlarge chart axis labels, and show a tooltip when hovering a Devices chart segment. [#51165]
- Dashboard: Add spacing below the widget grid so the last row no longer sits flush against the end of the page. [#51159]
- Date controls: Reset the custom range when a preset is selected, so the picker no longer shows two different ranges at once. [#51269]
- Date controls: Stop applying hidden date comparisons in dashboard sections that do not offer the control while preserving them when returning to supported sections. [#51381]
- Date controls: Use hourly buckets for day-long ranges. [#51118]
- Date filters panel: Avoid a one-frame flash of mismatched labels while resizing. [#51133]
- Date filters panel: Recover the full preset labels when space returns in the dashboard section header, instead of staying abbreviated. [#51133]
- Fix report dates shifting by a day on sites west of UTC, and stop the date picker briefly using the visitor's timezone on load. [#51205]
- Keep widget numbers on screen while unchanged data is refreshed in the background. [#51384]
- Post traffic activity: Fit the heatmap cells to the tile height so the month labels are no longer clipped. [#51214]
- Remove the duplicate padding around the chart-tab widgets. [#51175]
- Reports: Hide unexplained period-over-period deltas while preserving the dashboard comparison selection. [#51341]
- Section header: Describe an hour-snapped window by its full length and name a rolling day window by its end day. [#51118]
- Show an error when dashboard components are unavailable. [#51141]
- Stats: Align the post activity heatmap with the design: draw the current week only through today, and lead the cell tooltip with the view count. [#51181]
- Subscribers: Fix the chart legend rendering its date range reversed. [#51277]

## [0.2.0] - 2026-08-10
### Added
- Add Total views and Total visitors dashboard widgets. [#51055]
- Add translated DateFiltersPanel stories (Russian, Dutch, German) that render the date bar at several container widths, so the layout is reviewed against real language packs rather than English only. [#50906]
- Date controls: Add a chart interval control that sets the bucket size for every chart on the page. [#51112]
- Detail pages: Show the report the visitor came from in the breadcrumb. [#50956]
- Insights: Add an all-time and yearly date selection, configurable per dashboard section. [#50930]
- Insights: Add a Popular post widget, and adapt the single-post highlight card to both the width and the height of its dashboard cell. [#50931]
- Publish the dashboard page slug, capability, and site timezone in Jetpack script data, so other Jetpack surfaces can link to the dashboard. [#50926]
- Summary charts: Add a Chart type control to switch between lines and bars. [#51089]
- Video detail: Restore the date filter presets now that the preset measurement rework has landed, and keep comparison params from reaching the page's widgets. [#51082]

### Changed
- Dashboard: Tighten widget Card padding to fit the screen better. [#51101]
- Date controls: Abbreviate the month on the custom-range trigger, e.g. "Aug 2 – 9, 2025", so a long range costs the row less width. [#51094]
- Date controls: Keep the date presets as a row of pills at every width, abbreviating their labels in a narrow row rather than collapsing the choice into a dropdown. [#51094]
- Date controls: Make comparison an additive control that shows as a + button until a period is picked, then collapses into a labelled trigger. [#51094]
- Date controls: Name the active comparison preset on the picker, e.g. "Prev. period", instead of the dates it resolves to. [#51094]
- Date filters panel: Allow measuring an external container with a reserved share, so the panel's responsive layout works in shrink-to-fit slots. [#51088]
- Date filters panel: Shorten preset labels before collapsing into a select, measuring from the active language's own labels and from the panel itself, so callers no longer pass a container element. [#50906]
- Highlights: Always show the most recent year, fit the full metrics at the minimum widget height, tighten metric tile spacing in wide short widgets, and show every metric when none is saved. [#51052]
- Insights: Reorder and resize the default widgets so each row fills the grid, and add Popular post, Total views, and Total visitors to the defaults. [#51024]
- Load the dashboard assets only on requests that render an admin screen, so front-end page views no longer parse them. [#50890]
- Name the dashboard "Stats" in its header and breadcrumbs, and mark the header with the Jetpack logo. [#51022]
- Post detail page: Apply the video-page parity fixes — inline date filters on the title row with row-width degradation and no comparison, long-title overflow and featured-image sizing fixes, and the post-views day-shift fix. [#50971]
- Rename the "Most commented posts" and "Most commented authors" widgets to "Top commented posts" and "Top commented authors". [#51090]
- Route the ui, fields, and icons packages through the externals script module so shared third-party libraries are no longer duplicated across their bundles. [#50964]
- Section header: Wrap the subtitle before shortening the date preset labels, and stack the title and the controls onto separate rows once the header is too narrow to hold them side by side. [#51094]
- Subscribers: Drop Subscriber highlights from the default widgets so the board opens on the chart. [#51025]
- Traffic: Reorder and resize the default widgets so each row fills the grid, rename Summary to Traffic summary, and drop Plan usage from the defaults. [#51023]
- Update package dependencies. [#50509]
- Video detail page: Align the composition with the design mock by adding range-scoped highlight metrics, a Views performance chart, a poster thumbnail, and the renamed "Used on posts & pages" card. [#50970]
- Widgets: Update dashboard widget icons to match the design reference. [#51087]

### Removed
- Date controls: Drop the "Previous week" comparison preset, leaving the previous period, month and year. [#51094]

### Fixed
- Dashboard: Fix the dashboard opening as an empty edit-mode canvas when a post or video detail page was loaded first. [#51033]
- Dashboard: Make the first widget section a flex column so stacked chrome content lays out correctly until the upstream Gutenberg fix lands. [#51070]
- Date controls: Shorten the preset labels before the comparison control runs out of room, rather than after it has already overflowed the header, and keep its label on one line. [#51094]
- Detail highlights: Scroll the stacked tiles at narrow widths instead of clipping the bottom tile out of reach. [#51108]
- Restore PHP 7.2 compatibility for the Premium Analytics admin page. [#51078]
- Stats: Keep the "Last 24 hours" range aligned to whole hours so identical widget requests share one cached fetch. [#50916]
- Stats: Send the full site-local date/time to Stats endpoints now that the API resolves it correctly, instead of trimming to a bare calendar day. [#50916]
- Stats breadcrumbs: Fix a long unbroken crumb widening the page into horizontal scrolling instead of truncating. [#51085]

## 0.1.0 - 2026-08-03
### Added
- Add a post and page detail view with its own traffic, email, and interaction widgets. [#50096] [#50457]
- Add connection-aware `/connect` and `/syncing` routes, and track the analytics initial full-sync milestone for the dashboard. [#49650] [#49211]
- Add CSV export across report pages and widgets, delivered as a download or by email. [#50329] [#50330] [#50716]
- Add report pages for posts and pages, clicks, referrers, UTM, locations, search terms, videos, downloads, top authors, emails, and insights. [#50305] [#50561]
- Add the internal `ui`, `data`, `datetime`, `formatters`, `icons`, `routing`, `fields`, and `widgets-toolkit` packages, ported from next-woocommerce-analytics. [#49263] [#49422]
- Add the WooCommerce Analytics front-end tracker and an interim port of the `woocommerce_analytics` Sync module. [#50202] [#49652]
- Allow users with the `view_stats` capability to open the Analytics dashboard, and shop managers to read the store reports. [#50889]
- Dashboard: Add a section-based layout of configurable widgets, with a date-range picker and period-over-period comparison shared by every widget. [#50167] [#49572]
- Email: Add opens and clicks totals, a breakdown by country, device, client and link, a performance time series, and an Emails report page. [#50307] [#50572]
- Enable Jetpack Stats page-view tracking when Premium Analytics is active. [#50524]
- Initial version. [#48085]
- Insights: Add widgets for posting activity, most popular day and time, annual highlights, tags and categories, comments, and UTM traffic breakdowns. [#50151] [#50034]
- Render report links only when their URL scheme is http(s). [#50610]
- REST: Add one endpoint-agnostic proxy to WordPress.com under `jetpack-premium-analytics/v1`, plus dashboard notices and cached responses. [#49571] [#49645]
- Stats data layer: Add proxy query definitions, report hooks, and response normalizers. [#49777] [#49778] [#49779]
- Store: Add a WooCommerce dashboard section with widgets for sales, orders, conversion rate, coupons, customer type, bookings, and visitors. [#49422] [#50364]
- Subscribers: Add highlights, latest subscribers, and a growth chart with a previous-period overlay. [#50299] [#50064]
- Traffic: Add widgets for site overview, all-time stats, top posts and pages, authors, referrers, locations, search terms, devices and platforms, clicks, file downloads, and shares. [#50302] [#49568]
- VideoPress: Add a video detail page with plays leaderboard, video highlights, and embed locations. [#50311] [#50536]
- WordAds: Add widgets for ads served, average CPM and revenue over time, all-time earnings highlights, and earnings, sponsored content and adjustments history. [#50314] [#50490]

[0.4.0]: https://github.com/Automattic/jetpack-premium-analytics/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-premium-analytics/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-premium-analytics/compare/0.1.0...0.2.0
