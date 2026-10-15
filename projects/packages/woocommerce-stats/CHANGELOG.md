# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/Automattic/jetpack-woocommerce-stats/compare/v0.1.0-alpha...v0.1.0
