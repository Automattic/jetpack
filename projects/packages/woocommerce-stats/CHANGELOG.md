# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-10-28
### Fixed
- Compare each week, month or year in Store performance and the over time charts with the one covering the same days in the comparison period, instead of the one in the same position. [#53965]
- Store visitors by location: Show country names instead of country codes. [#54107]

## [0.3.0] - 2026-10-26
### Added
- Store performance: Switch between a line and a bar chart in the widget header. [#54018]
- Top performing products and bookings: Link each row to its product. [#54017]

### Changed
- Require widget contract 2.0.0 of the Premium Analytics dashboard. [#53885]
- Sync no order changes until the WooCommerce analytics module's first full sync starts. [#53282]

### Fixed
- Widget titles, descriptions, help notes and chart type labels declared in widget.json reach the translation catalog. [#53850]

## [0.2.0] - 2026-10-19
### Added
- Add the columns widgets: revenue by customer type, sales by device, total returns and sales by coupon, with the bookings variants of the first two; the store ones are placed on the WooCommerce tab by default. [#53477]
- Add the Store visitors by location widget, placed on the WooCommerce tab by default. [#53536]
- Offer the sales, orders and visitors over time widgets in the WooCommerce tab's inserter. [#53720]
- Store performance: Offer the Bookings metric on a store running the WooCommerce Bookings extension. [#53599]
- Store performance: Pick the metrics shown through a widget attribute, and let a plugin add metrics through the `jetpack.woocommerceStats.storePerformance.metrics` filter. [#53586]
- Tell the store owner on the WooCommerce tab when the store has no orders yet. [#53602]

### Changed
- Gate the WooCommerce tab and its widgets in the package: WooCommerce active, the reader's store reports capability, and the Bookings extension for the bookings widgets. [#53540]
- Rearrange the WooCommerce tab's default layout, which no longer includes the sales, orders and visitors over time widgets. [#53654]
- Show the WooCommerce tab on every site running WooCommerce, to readers of the store reports. [#53588]
- Store visitors by location: Remove the region toggle and list countries worldwide. [#53653]
- Top performing products and bookings: Show the rows as soon as the report answers; the thumbnails fill in behind. [#53589]
- Update package dependencies. [#53004]
- Update package dependencies. [#53806]
- Widgets: Use the dashboard's generic empty state for a period with no data, instead of a copy and icon per widget. [#53426]

### Fixed
- Name each widget chart after its widget, so screen readers can tell the charts on a dashboard apart. [#53333]
- Reports: Clear cached reports when the store's first sync finishes, so a newly connected store doesn't show zeros after its data arrives. [#53649]
- Show long store performance figures in short form, such as $277K, so they fit their cards. [#53708]
- Show no value, rather than 0 with a -100% change, for averages and the conversion rate over a period with no orders or sessions, and fix the comparison and total figures in attribution and Sessions by device. [#53707]
- Time series widgets: Hide metric labels that repeat the widget title. [#53719]
- Widgets: Show the empty state in the report charts when the period and its comparison are all zeros, instead of a flat line at zero. [#53590]

## [0.1.0] - 2026-10-12
### Added
- Add a proxy route for the WooCommerce analytics reports of WordPress.com. [#53222]
- Add the breakdown widgets: new vs returning customer, payment status, orders fulfillment, coupon usage over time and bookings by status, all placed on the WooCommerce tab by default. [#53311]
- Add the client that reads the WooCommerce analytics reports, for the widgets of the package. [#53236]
- Add the leaderboard widgets: top performing products and bookings, and sales by UTM source, channel and campaign, all placed on the WooCommerce tab by default. [#53319]
- Add the Net sales over time widget, the first one the package builds and registers. [#53248]
- Add the Sessions by device widget, placed on the WooCommerce tab by default. [#53454]
- Add the Store conversion rate widget and its bookings variant; the first is placed on the WooCommerce tab by default. [#53462]
- Add the Store performance widget. [#53427]
- Add the time series widgets: total and gross sales, orders, average order value, average items per order, bookings and visitors over time, all placed on the WooCommerce tab by default. [#53291]
- Place Net sales over time on the WooCommerce tab by default. [#53286]
- Register the WooCommerce section on the Premium Analytics dashboard. [#53157]
- Widgets: Add a line or bar chart type control to the report charts. [#53313]

### Changed
- Hold the bookings widgets back from the WooCommerce tab for now. [#53422]
- Open the dashboard on the WooCommerce tab when WooCommerce is active. [#53432]
- Rename the Visitors over time widget to Store visitors over time, so it isn't confused with Jetpack Stats visitors. [#53345]
- Sales by UTM: lay the label above the bar and draw the comparison period as a second bar under the period legend. [#53404]

### Fixed
- Pass the store currency to the dashboard, so store money shows in it instead of US dollars. [#53350]
- Reports: Follow the WooCommerce Analytics date type setting instead of always using the order creation date. [#53347]
- Use sentence case in the Store visitors chart tooltip, like the other count labels. [#53346]

## 0.1.0-alpha - unreleased

- Initial version.

[0.3.1]: https://github.com/Automattic/jetpack-woocommerce-stats/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-woocommerce-stats/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-woocommerce-stats/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Automattic/jetpack-woocommerce-stats/compare/v0.1.0-alpha...v0.1.0
