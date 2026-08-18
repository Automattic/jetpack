=== Automattic For Agencies Client ===
Contributors: automattic, jeherve, njweller, rcanepa
Tags: agency, dashboard, management, sites, monitoring
Requires at least: 7.0
Requires PHP: 7.2
Tested up to: 7.0
Stable tag: 0.9.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Securely connect your clients’ sites to the Automattic for Agencies Sites Dashboard. Manage your sites from one place and see what needs attention.

== Description ==

Automattic for Agencies is a new agency program that combines the best of Woo, WordPress.com, Jetpack, and Pressable under one roof. [Learn more about Automattic for Agencies](https://automattic.com/for-agencies/).

This lightweight plugin securely connects your clients’ sites to the Automattic for Agencies Sites Dashboard, enabling you to manage them from one place and to be notified immediately if any site is experiencing security or performance issues.

This plugin will also enhance the overall Automattic for Agencies portal experience:


- With plugin updates across the sites you manage in just a few clicks.
- Downtime monitoring so you’ll instantly know if a client’s site needs attention.
- And more to come.

Like other Automattic products, this plugin connects to WordPress.com’s servers to provide the best end-user experience. We only sync what’s absolutely necessary to provide our program experience. When connecting your site to the Automattic for Agencies Sites Dashboard, you agree to [our Terms of Service](https://wordpress.com/tos/).

== Installation ==

Install & activate this plugin on all your WordPress sites that you want to manage directly from the Sites Dashboard within Automattic for Agencies.

Once the plugin is activated, you will be brought through the site connection process, which utilizes a WordPress.com account to form a bridge between your site and Automattic for Agencies. Ensure you connect this plugin using the primary account you used when you signed up for Automattic for Agencies.

Once connected, your site will display within Automattic for Agencies.

**To remove a site from Automattic for Agencies:**

- To remove a site from Automattic for Agencies, simply navigate to Plugins > Installed Plugins, within wp-admin for the site you want to remove.
- Find the Automattic for Agencies plugin and click “Deactivate.”
- You’ll be prompted to confirm. Once deactivated, your site will be removed from Automattic for Agencies.

== Screenshots ==

1. Manage your connection to the agency dashboard from the Settings screen in your WordPress dashboard.

== Changelog ==
### 0.9.0 - 2026-08-14
#### Changed
- Components: Use Link from `@wordpress/ui` instead of ExternalLink.
- General: Update minimum WordPress version to 6.9.
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency.
- Remove unneeded development and documentation files from the published plugin.
- Replace deprecated jetpack-components Spinner with WordPress Core Spinner.
- Tested up to WordPress 7.0.
- Updated package dependencies.

