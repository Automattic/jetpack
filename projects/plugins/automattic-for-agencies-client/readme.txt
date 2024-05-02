=== Automattic For Agencies Client ===
Contributors: automattic
Tags: agency, dashboard, management, sites, monitoring
Requires at least: 6.4
Requires PHP: 7.0
Tested up to: 6.5
Stable tag: 0.1.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Securely connect your clients’ sites to the Automattic for Agencies Sites Dashboard. Manage your sites from one place and see what needs attention.

== Description ==

[Automattic for Agencies](https://automattic.com/for/agencies/) is a new agency program that combines the best of Woo, WordPress.com, Jetpack, Pressable, and WordPress VIP under one roof.

This plugin securely connects your clients’ sites to the Automattic for Agencies Sites Dashboard, enabling you to manage them from one place and be notified immediately if any site is experiencing security or performance issues.

This plugin will also enhance the overall Automattic for Agencies portal experience:


- With plugin updates across the sites you manage in just a few clicks
- Downtime monitoring so you’ll instantly know if a client’s site needs attention
- Immediate installation and activation of purchased products and services.
- And more to come.

Like other Automattic products, this plugin connects to WordPress.com’s servers to provide the best end-user experience. We only sync what’s absolutely necessary to provide our program experience.

== Installation ==

Install & Activate this plugin on all your WordPress sites that you want to manage directly from the Sites Dashboard in Automattic for Agencies.

Once the plugin is activated, you will be brought through the site connection process.

If you would like to disconnect a site or check if the site is connected correctly from WP Admin, click on the "Settings" link under the plugin name in "Plugins > Installed Plugins."

== Screenshots ==

1. Manage your connection to the agency dashboard from the Settings screen in your WordPress dashboard.

== Changelog ==
### 0.1.0 - 2024-04-30
#### Added
- Added connected state content and site disconnection flow.
- Added connection card
- Added details about sharing information with Automattic to the connection card.
- Added reconnection flow to the A4A client plugin.
- Add Woocommerce event remove_order_items to Jetpack Sync
- General: add first version of the plugin's readme and assets.
- General: add modal displayed when deactivating the plugin.
- Initial commit for the plugin’s infrastructure.
- Packages: add version tracking for identity-crisis package.

#### Changed
- General: update WordPress version requirements to WordPress 6.4.
- General: use wp_admin_notice function introduced in WP 6.4 to display notices.
- Updated details about sharing data with WordPress.com
- Updated package dependencies.
- Updated package dependencies.
- Updated package dependencies.
- Updated package dependencies.

#### Removed
- Removed the Jetpack-branded header and footer from the plugin.

#### Fixed
- Fix post-connection redirect URL.
