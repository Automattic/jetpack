# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
