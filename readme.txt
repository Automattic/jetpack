=== VaultPress ===
Contributors: automattic, apokalyptik, briancolinger, josephscott, shaunandrews, xknown, thingalon
Tags: security, malware, virus, backups, scanning
Requires at least: 2.9.2
Tested up to: 3.5.2
Stable tag: 1.4.9
License: GPLv2

VaultPress is a subscription service offering realtime backup, automated security scanning, and support from WordPress experts.

== Description ==

[VaultPress](http://vaultpress.com/?utm_source=plugin-readme&utm_medium=description&utm_campaign=1.0) is a real-time backup and security scanning service designed and built by [Automattic](http://automattic.com/), the same company that operates 25+ million sites on WordPress.com.

The VaultPress plugin provides the required functionality to backup and synchronize every post, comment, media file, revision and dashboard settings on our servers. To start safeguarding your site, you need to sign up for a VaultPress subscription.

[wpvideo TxdSIdpO]

For more information, check out [VaultPress.com](http://vaultpress.com/).

== Installation ==

1. Search for VaultPress in the WordPress.org plugin directory and click install. Or, upload the files to your `wp-content/vaultpress/` folder.
2. Visit `wp-admin/plugins.php` and activate the VaultPress plugin.
3. Head to `wp-admin/admin.php?page=vaultpress` and enter your site&rsquo;s registration key. You can purchase your registration key at [VaultPress.com](http://vaultpress.com/plugin/?utm_source=plugin-readme&utm_medium=installation&utm_campaign=1.0)

You can find more detailed instructions at [http://vaultpress.com/](http://help.vaultpress.com/install-vaultpress/?utm_source=plugin-readme&utm_medium=description&utm_campaign=1.0)

== Frequently Asked Questions ==

View our full list of FAQs at [http://help.vaultpress.com/faq/](http://help.vaultpress.com/faq/?utm_source=plugin-readme&utm_medium=faq&utm_campaign=1.0)

= What’s included in each VaultPress plan? =

All plans include Daily or Realtime Backups, Downloadable Archives for Restoring, Vitality Statistics, and the Activity Log.

The Lite plan provides Daily Backups, a 30-day backup archive and automated restores.

The Basic plan provides Realtime Backups to protect your changes as they happen and support services.

The Premium plan provides priority recovery and support services, along with site migration assistance. The Premium plan provides automated security scanning of Core, Theme, and Plugin files.

Update-to-date pricing and features can always be found on the [Plans &amp; Pricing](http://vaultpress.com/plugin/?utm_source=plugin-readme&utm_medium=installation&utm_campaign=1.0) page.

= How many sites can I protect with VaultPress? =

A VaultPress subscription is for a single WordPress site. You can purchase additional subscriptions for each of your WordPress sites, and manage them all with in one place.

= Does VaultPress work with WordPress 3.0 Multisite installs? =

Yes, VaultPress supports Multisite installs. Each site will require its own subscription.

== Changelog ==
= 1.4.9 =
* Bugfix: Clean up PHP5 strict warnings.

= 1.4.8 =
* Feature: Include styles and images with the plugin instead of loading them externally.

= 1.4.7 =
* Bugfix: Some servers have SSL configuration problems, which breaks the plugin when SSL verification is enforced.

= 1.4.6 =
* Bugfix: PHP 5.4 notices
* Feature: Add the possibility to ignore frequent updates on some postmeta keys.

= 1.3.9 =
* Feature: Request decoding (base64/rot13)
* Feature: Response encoding (base64/rot13)

= 1.3.8 =
* Bugfix: Validate IPv4-mapped IPv6 addresses in the internal firewall.
* Bugfix: Fix hooks not being properly added under certain circumstances.

= 1.3.7 =
* Bugfix: Protect against infinite loop due to a PHP bug.
* Bugfix: Encode remote ping requests.

= 1.0 =
* First public release!
