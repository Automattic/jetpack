=== VaultPress ===
Contributors: automattic, apokalyptik, briancolinger, josephscott, shaunandrews, xknown, thingalon, annezazu, rachelsquirrel
Tags: security, malware, virus, archive, back up, back ups, backup, backups, scanning, restore, wordpress backup, site backup, website backup
Requires at least: 3.2
Tested up to: 4.9
Stable tag: 1.9.3
License: GPLv2

VaultPress is a subscription service offering real-time backup, automated security scanning, and support from WordPress experts.

== Description ==

[VaultPress](http://vaultpress.com/plans) is a real-time backup and security scanning service designed and built by [Automattic](http://automattic.com/), the same company that operates (and backs up!) millions of sites on WordPress.com.

VaultPress is now powered by Jetpack and effortlessly backs up every post, comment, media file, revision, and dashboard setting on your site to our servers. With VaultPress you're protected against hackers, malware, accidental damage, and host outages.

To subscribe visit [VaultPress.com](http://vaultpress.com/plans).

== Installation ==

1. [Visit our plans page](http://vaultpress.com/plans) and choose the subscription best suited to your needs.
2. Follow the on-screen instructions to check-out and pay.
3. We will automatically install and configure VaultPress for you.

If you run into any difficulties please [contact us](https://vaultpress.com/contact/)

== Frequently Asked Questions ==

View our full list of FAQs at [http://help.vaultpress.com/faq/](http://help.vaultpress.com/faq/?utm_source=plugin-readme&utm_medium=faq&utm_campaign=1.0)

= What’s included in each plan? =

All plans include automated daily backups (unlimited storage space) of your entire site, 1-click restores, stats, priority support, brute force attack protection, uptime monitoring, spam protection, site migration, and an activity log. 

The Personal and Premium plans are limited to a 30-day backup archive while Professional is unlimited.

The Premium and Professional plans also offer automated security scanning against malware and infiltrations with the Professional plan also offering automated threat resolution. 

[Visit our site](https://vaultpress.com/contact/) for more detail and up-to-date information.

= How many sites can I protect with VaultPress? =

A VaultPress subscription is for a single WordPress site. You can purchase additional subscriptions for each of your WordPress sites, and manage them all with in one place.

= Does VaultPress work with WordPress 3.0 Multisite installs? =

Yes, VaultPress supports Multisite installs. Each site will require its own subscription.

== Changelog ==
= 1.9.3 - 9 November 2017
* Compatibility update
* Send a better user-agent string to VaultPress servers

= 1.9.2 - 6 July 2017 =
* Compatibility update

= 1.9.1 - 29 June 2017 =
* Security improvement: use hash_equals to compare signatures

= 1.9.0 - 5 June 2017 =
* Bugfix: Check return value from openssl_verify()

= 1.8.9 - 8 May 2017 =
* Remove outdated free trial link

= 1.8.7 - 6 March 2017 =
* Security fix for https://wpvulndb.com/vulnerabilities/8745

= 1.8.6 - 26 January 2016 =
* Compatibility updates
* Security hotfixes
* Improved performance for security scanner
* Misc small bugfixes

= 1.8.5 - 7 August 2016 =
* Delete plugin option when plugin is deleted via admin area.
* Fix horizontal scroll bar on the fresh installation settings page at high resolutions.

= 1.8.4 - 21 July 2016 =
* Compatibility updates for Jetpack 4.1

= 1.8.3 - 26 May 2016 =
* Security: Hotfix for certain versions of Jetpack

= 1.8.2 - 11 May 2016 =
* Workaround for some versions of mod_security.

= 1.8.1 - 29 Mar 2016 =
* Improved support for WooCommerce live backups.
* Bugfix: Avoid cloning the 'vaultpress' option between Multisite instances.

= 1.8.0 - 7 Mar 2016 =
* Add support for an upcoming ability to have the Jetpack plugin manage registering the VaultPress plugin and entering the required API key. Gone will be the days of needing to copy/paste it!

= 1.7.9 - 24 Feb 2016 =
* PHP 7 support. Drop support for PHP 4 and versions of WordPress older than 3.2.
* Silence PHP errors when attempting to change the execution time limit when PHP is running in safe mode.
* Prevent database update pings from being stored when not connected to a paid VaultPress account. 

= 1.7.8 - 15 Oct 2015 =
* Security: Hotfix for Akismet < 3.1.5.

= 1.7.7 - 15 Sep 2015 =
* Security: Add a new security hotfix.

= 1.7.6 - 14 Aug 2015 =
* Improved support for multisite installs with custom domains
* Improved live-backup support for WooCommerce
* Tested against WordPress 4.3

= 1.7.5 - 11 Jun 2015 =
* Security: Add a new security hotfix.

= 1.7.4 - 28 Apr 2015 =
* Bugfix: Don't allow openssl signing unless the public key exists.

= 1.7.3 - 27 Apr 2015 =
* Security: Add a new security hotfix.

= 1.7.2 - 20 Apr 2015 =
* Hotfix: Protect against a core security issue.
* Bugfix: Don't allow direct access to plugin files
* Bugfix: Ensure that the firewall rule option is not autoloaded.
* Bugfix: More careful path tidy-up when inspecting directory contents. Fixes an edge case where some sites were having backup problems.

= 1.7.1 - 25 Mar 2015 =
* Added support for openssl signing.

= 1.7.0 - 9 Jan 2015 =
* Added an option to disable calls to php_uname, as some hosts don't allow them.

= 1.6.9 - 24 Dec 2014 =
* Tested against WordPress 4.1

= 1.6.8 - 12 Dec 2014 =
* Bugfix: Fall back on HTTP when updating firewall via HTTPS fails. Still warn the user about the security implications.

= 1.6.7 - 1 Dec 2014 =
* Security: More efficient format for internal firewall IPs.

= 1.6.6 - 14 Nov 2014 =
* Security: Fetch service IP updates via HTTPS.
* Feature: Don't send backup notifications while mass-deleting spam.

= 1.6.5 - 4 Sep 2014 =
* Security: Hotfix for the Slider Revolution plugin.

= 1.6.4 - 3 Sep 2014 =
* Bumping the "Tested up to" tag to 4.0

= 1.6.3 - 30 Jul 2014 =
* Bugfix: Make sure existing empty key and secret options are always strings.  This fixes an error when run with HHVM.
* Bugfix: Detect if the plugin has been installed on localhost and show an error.
* CSS Fix: Stop the "Register" button from bouncing around when clicked.

= 1.6.2 - 10 Jul 2014 =
* Feature: Instantly register for a VaultPress trial via Jetpack.
* Bugfix: Make sure the key and secret options are always strings.  This fixes an error when run with HHVM.

= 1.6.1 - 1 Jul 2014 =
* Security: Add a new security hotfix.

= 1.6 - 27 Jun 2014 =
* Bugfix: Better handling for Multisite table prefixes.
* Bugfix: Do not use the deprecated wpdb::escape() method.

= 1.5.9 - 16 Jun 2014 =
* Feature: If available, use command line md5sum and sha1sum to get checksums for large files.

= 1.5.8 - 3 Jun 2014 =
* Security: Add a new security hotfix.

= 1.5.7 - 11 Apr 2014 =
* Bugfix: Avoid PHP 5.4 warnings due to invalid constructor names.
* Security: Add a new security hotfix.

= 1.5.6 - 1 Apr 2014 =
* Bugfix: Avoid PHP 5.4 warnings.
* Bugfix: Some servers with restrictive security filters make database restores fail.
* Feature: Add a new restore method to VaultPress_Database.

= 1.5.2 - 26 Dec 2013 =
* Bugfix: Adding less greedy patterns for cache directories.

= 1.5.1 - 16 Dec 2013 =
* Feature: Adding file exclusion patterns to avoid backing up cache and backup directories.

= 1.5 - 11 Dec 2013 =
* Bugfix: Don't show admin notices on the about page.

= 1.4.9 - 10 Oct 2013 =
* Bugfix: Clean up PHP5 strict warnings.

= 1.4.8 - 15 Jul 2013 =
* Feature: Include styles and images with the plugin instead of loading them externally.

= 1.4.7 - 2 Jul 2013 =
* Bugfix: Some servers have SSL configuration problems, which breaks the plugin when SSL verification is enforced.

= 1.4.6 - 26 Jun 2013 =
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
