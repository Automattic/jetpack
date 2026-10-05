# WooCommerce stats

The WooCommerce section of the Premium Analytics dashboard, and the client for its `analytics/reports` endpoints. This package registers the section. It does not place widgets.

The package decides nothing about who gets the section. The Jetpack plugin calls `Analytics_Dashboard::init()` outside the WordPress.com platform; `jetpack-mu-wpcom` calls the registrant on Simple and Atomic. Availability — WooCommerce active, the store-reports capability, and the store-section flag — stays on the section itself.

Report hooks (`useReportOrders` and the rest) live here. They call Premium Analytics' stats proxy and its comparison hook; neither is re-exported.

## Using this package in your WordPress plugin

Require it with Composer and call `\Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard::init()` before `init`. The registration happens when the dashboard's section registry hydrates, so the call is inert on a site without the dashboard.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-woocommerce-stats is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
