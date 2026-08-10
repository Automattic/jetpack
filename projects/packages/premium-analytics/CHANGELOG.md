# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/Automattic/jetpack-premium-analytics/compare/0.1.0...0.2.0
