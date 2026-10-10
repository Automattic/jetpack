# WooCommerce stats

The WooCommerce section of the Premium Analytics dashboard. This package registers the section and its default layout, which is also what the inserter offers on the tab: the time series widgets for now, more as the widgets land here.

It also serves the reports the section's widgets will read. `GET /jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports/<report>` forwards to the same path under the connected site on WordPress.com, for users who can view store reports, and caches a successful answer for five minutes.

It hands the dashboard the store currency too: `premium_analytics.store_currency` in `JetpackScriptData` carries the code and symbol, so store money prints in it rather than US dollars.

The widgets read those reports with the client in `src/reports/`: one hook per report, built on `useReport` from the dashboard SDK, so every query runs in the dashboard's query client.

The widget types live in `widgets/`. wp-build builds them, and the package registers them from the build manifest when the dashboard's widget contract is 1.5 or newer. They draw with the kinds the dashboard SDK exports, so the charts are the dashboard's own. The time series family is here: net, total and gross sales, orders, average order value, average items per order, bookings and visitors over time. So are the breakdowns: new vs returning customer, payment status, orders fulfillment, coupon usage over time and bookings by status; the leaderboards: top performing products and bookings, and sales by UTM source, channel and campaign; and Store performance, every store metric as a tab over one chart.

The package decides nothing about who gets the section. The plugin that bundles it, Jetpack or the standalone Premium Analytics plugin, calls `Analytics_Dashboard::init()`. Availability stays on the section itself: WooCommerce active, the store-reports capability, and the `premium-analytics-store-section` flag, which this package registers.

The package also owns when store data syncs to WordPress.com. `Sync_Configuration` opts in to the shared `woocommerce_analytics` sync module only while the site offers the section, registers its name through `jetpack_premium_analytics_sync_modules`, and drops per-order changes until that module's first full sync has started. The dashboard package's `Sync_Status_Tracker` records starts separately for each registered module.

## Using this package in your WordPress plugin

Require it with Composer and call `\Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard::init()` before `plugins_loaded` completes, so the sync opt-in reaches this request's Sync setup. The registration happens when the dashboard's section registry hydrates, so the call is inert on a site without the dashboard.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-woocommerce-stats is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
