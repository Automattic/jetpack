# WooCommerce stats

The WooCommerce section of the Premium Analytics dashboard. This package registers the section and its default layout, and declares the widgets the tab offers in the inserter without placing them by default: the sales, orders and visitors over time charts.

It also serves the reports the section's widgets will read. `GET /jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports/<report>` forwards to the same path under the connected site on WordPress.com, for users who can view store reports, and caches a successful answer for five minutes.

It hands the dashboard the store currency too: `premium_analytics.store_currency` in `JetpackScriptData` carries the code, symbol and price decimals (`precision`), so store money prints in it rather than US dollars, with the store's number of decimals.

The widgets read those reports with the client in `src/reports/`: one hook per report, built on `useReport` from the dashboard SDK, so every query runs in the dashboard's query client.

The widget types live in `widgets/`. wp-build builds them, and the package registers them from the build manifest when the dashboard's widget contract is 1.11 or newer. They draw with the kinds the dashboard SDK exports, so the charts are the dashboard's own. The time series family is here: net, total and gross sales, orders, average order value, average items per order, bookings and visitors over time. So are the breakdowns: new vs returning customer, payment status, orders fulfillment, coupon usage over time, bookings by status and sessions by device; the leaderboards: top performing products and bookings, and sales by UTM source, channel and campaign; Store performance, the store metrics as tabs over one chart, picked in the widget header, with the `jetpack.woocommerceStats.storePerformance.metrics` filter for a plugin to add its own (the package adds Bookings this way, from `packages/store-performance-bookings`, on a store running the extension); the conversion funnel, for every product and for bookings; the columns: revenue by customer type, sales by device, total returns and sales by coupon, with the bookings variants of the first two; and visitors by location, countries listed beside a map.

The plugin that bundles it, Jetpack or the standalone Premium Analytics plugin, calls `Analytics_Dashboard::init()`. The package gates the section and its widget types itself: WooCommerce active, the store-reports capability, and the Bookings extension for the bookings widgets and the Bookings metric.

The package also owns when store data syncs to WordPress.com. `Sync_Configuration` opts in to the shared `woocommerce_analytics` sync module on a store running WooCommerce, registers its name through `jetpack_premium_analytics_sync_modules`, and drops per-order changes until that module's first full sync has started. The dashboard package's `Sync_Status_Tracker` records starts separately for each registered module. `Lookup_Data_Backfill` resends, once, the order lookup data and product catalog that stores synced through the standalone WooCommerce Analytics plugin never sent.

## Using this package in your WordPress plugin

Require it with Composer and call `\Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard::init()` before `plugins_loaded` completes, so the sync opt-in reaches this request's Sync setup. The registration happens when the dashboard's section registry hydrates, so the call is inert on a site without the dashboard.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-woocommerce-stats is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
