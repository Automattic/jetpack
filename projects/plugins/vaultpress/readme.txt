=== Jetpack VaultPress ===
Contributors: automattic, annezazu, apokalyptik, bjorsch, briancolinger, dsmart, georgestephanis, initsogar, jeherve, josephscott, miguelxavierpenha, rachelsquirrel, rdcoll, sdixon194, shaunandrews, thingalon, viper007bond, williamvianas, xknown
Tags: security, malware, virus, archive, back up, back ups, backup, backups, scanning, restore, wordpress backup, site backup, website backup
Requires at least: 5.2
Tested up to: 7.1
Stable tag: 5.0.0
Requires PHP: 7.4
License: GPLv2

(DEPRECATED: Please install "Jetpack VaultPress Backup" instead) Jetpack VaultPress offers real-time backups, one-click restores, and premium support from WordPress experts.

== Description ==

**Please note:** This plugin is no longer actively supported for new customers.

For the next generation of VaultPress technology, **we recommend** [Jetpack Pro or Complete](https://jetpack.com/pricing/). Both include real-time backups, malware scanning, anti-spam comment protection, and a new Web Application Firewall (WAF) for ultimate WordPress site security.

== Installation ==

1. [Visit our plans page](http://vaultpress.com/plans) and choose the subscription best suited to your needs.
2. Follow the on-screen instructions to check-out and pay.
3. We will automatically install and configure VaultPress for you.

If you run into any difficulties please [contact us](https://vaultpress.com/contact/)

== Frequently Asked Questions ==

View our full list of FAQs at [http://help.vaultpress.com/faq/](http://help.vaultpress.com/faq/?utm_source=plugin-readme&utm_medium=faq&utm_campaign=1.0)

= How many sites can I protect with VaultPress? =

A Jetpack VaultPress subscription is for a single WordPress site.

== Changelog ==
### 5.0.0 - 2026-10-14
#### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency.
- Remove unneeded development and documentation files from the published plugin.
- Sidebar: Register the VaultPress menu item through Jetpack's admin menu API so it sorts with the other Jetpack pages.
- Tested up to WordPress 7.1.
- Update package dependencies.

#### Removed
- Updated PHP version requirements to PHP 7.4 or newer.

#### Fixed
- Phan: Address PhanPluginDuplicateConditionalNullCoalescing violations.

--------

[See the previous changelogs here](https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/vaultpress/CHANGELOG.md#changelog)
