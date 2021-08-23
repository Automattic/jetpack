# Changelog

All notable changes to this project will be documented in this file.

## 2.1.4 - 2020-08-07
### Bug fixes
- General: Revert autoloader version to prior 1.7.0 version, to resolve an intermittent issue during the upgrade process for some users.

## 2.1.3 - 2020-08-06

### Compatibility

- General: Handle new user meta actions.
- General: Implement the spread operator for our IXR class methods to match WordPress Core behavior in 5.5.
- General: Update some miscellaneous dependencies.

## 2.1.0 - 2019-12-10
### Compatibility

- General: the VaultPress plugin now requires PHP 5.6, just like WordPress.
- General: avoid using PHP short array syntax to load plugin files.

## 2.1.0 - 2019-12-09
### Compatibility

- General: avoid PHP deprecation notices when using a newer version of the Jetpack plugin.
- Admin Page: do not display a dashboard link if not registered.
- Admin Page: update reset settings card wording.
- Connect button: update link to current VaultPress page.
- Notices: only display notices in specific locations.
- Notices: update wording for the VaultPress connection notice

## 2.0.1 - 2019-07-12
### Bug fixes
- Security Scanner: ensure the Security Scanner can be triggered at all times.

## 2.0 - 2019-07-09
### Enhancements
- Dashboard: redesign the main VaultPress dashboard.

### Compatibility
- General: VaultPress now requires PHP 5.3.2, and will display a notice if your site uses an older version of PHP.


## 1.9.10 - 2019-04-04
### Bug fixes
- Fix a PHP fatal error caused by passing an object to the current() function.

## 1.9.9 - 2019-03-28
- PHP 7.2.0 compatibility fix.
- Adding button to delete all VaultPress settings

## 1.9.8 - 2019-02-07
- Limit the size of _vp_ai_ping_% entries when a site gets disconnected from VaultPress.com

## 1.9.7 - 2018-12-11
- Update firewall IP detection rules to autodetect various reverse proxy setups

## 1.9.6 - 2018-08-17
- Limit _vp_ai_ping_% entries to improve stability when a site gets disconnected from VaultPress.com

## 1.9.5 - 2018-02-02
- Removing activation notice

## 1.9.4 - 2017-11-15
- Error handling improvements in the scanner

## 1.9.3 - 2017-11-09
- Compatibility update
- Send a better user-agent string to VaultPress servers

## 1.9.2 - 2017-07-06
- Compatibility update

## 1.9.1 - 2017-06-29
- Security improvement: use hash_equals to compare signatures

## 1.9.0 - 2017-06-05
- Bugfix: Check return value from openssl_verify()

## 1.8.9 - 2017-05-08
- Remove outdated free trial link

## 1.8.7 - 2017-03-06
- Security fix for https://wpvulndb.com/vulnerabilities/8745

## 1.8.6 - 2016-01-26
- Compatibility updates
- Security hotfixes
- Improved performance for security scanner
- Misc small bugfixes

## 1.8.5 - 2016-08-07
- Delete plugin option when plugin is deleted via admin area.
- Fix horizontal scroll bar on the fresh installation settings page at high resolutions.

## 1.8.4 - 2016-07-21
- Compatibility updates for Jetpack 4.1

## 1.8.3 - 2016-05-26
- Security: Hotfix for certain versions of Jetpack

## 1.8.2 - 2016-05-11
- Workaround for some versions of mod_security.

## 1.8.1 - 2016-03-29
- Improved support for WooCommerce live backups.
- Bugfix: Avoid cloning the 'vaultpress' option between Multisite instances.

## 1.8.0 - 2016-03-07
- Add support for an upcoming ability to have the Jetpack plugin manage registering the VaultPress plugin and entering the required API key. Gone will be the days of needing to copy/paste it!

## 1.7.9 - 2016-02-24
- PHP 7 support. Drop support for PHP 4 and versions of WordPress older than 3.2.
- Silence PHP errors when attempting to change the execution time limit when PHP is running in safe mode.
- Prevent database update pings from being stored when not connected to a paid VaultPress account.

## 1.7.8 - 2015-10-15
- Security: Hotfix for Akismet < 3.1.5.

## 1.7.7 - 2015-09-15
- Security: Add a new security hotfix.

## 1.7.6 - 2015-08-14
- Improved support for multisite installs with custom domains
- Improved live-backup support for WooCommerce
- Tested against WordPress 4.3

## 1.7.5 - 2015-06-11
- Security: Add a new security hotfix.

## 1.7.4 - 2015-04-28
- Bugfix: Don't allow openssl signing unless the public key exists.

## 1.7.3 - 2015-04-27
- Security: Add a new security hotfix.

## 1.7.2 - 2015-04-20
- Hotfix: Protect against a core security issue.
- Bugfix: Don't allow direct access to plugin files
- Bugfix: Ensure that the firewall rule option is not autoloaded.
- Bugfix: More careful path tidy-up when inspecting directory contents. Fixes an edge case where some sites were having backup problems.

## 1.7.1 - 2015-03-25
- Added support for openssl signing.

## 1.7.0 - 2015-01-09
- Added an option to disable calls to php_uname, as some hosts don't allow them.

## 1.6.9 - 2014-12-24
- Tested against WordPress 4.1

## 1.6.8 - 2014-12-12
- Bugfix: Fall back on HTTP when updating firewall via HTTPS fails. Still warn the user about the security implications.

## 1.6.7 - 2014-12-01
- Security: More efficient format for internal firewall IPs.

## 1.6.6 - 2014-11-14
- Security: Fetch service IP updates via HTTPS.
- Feature: Don't send backup notifications while mass-deleting spam.

## 1.6.5 - 2014-09-04
- Security: Hotfix for the Slider Revolution plugin.

## 1.6.4 - 2014-09-03
- Bumping the "Tested up to" tag to 4.0

## 1.6.3 - 2014-07-30
- Bugfix: Make sure existing empty key and secret options are always strings.  This fixes an error when run with HHVM.
- Bugfix: Detect if the plugin has been installed on localhost and show an error.
- CSS Fix: Stop the "Register" button from bouncing around when clicked.

## 1.6.2 - 2014-07-10
- Feature: Instantly register for a VaultPress trial via Jetpack.
- Bugfix: Make sure the key and secret options are always strings.  This fixes an error when run with HHVM.

## 1.6.1 - 2014-07-01
- Security: Add a new security hotfix.

## 1.6 - 2014-06-27
- Bugfix: Better handling for Multisite table prefixes.
- Bugfix: Do not use the deprecated wpdb::escape() method.

## 1.5.9 - 2014-06-16
- Feature: If available, use command line md5sum and sha1sum to get checksums for large files.

## 1.5.8 - 2014-06-03
- Security: Add a new security hotfix.

## 1.5.7 - 2014-04-11
- Bugfix: Avoid PHP 5.4 warnings due to invalid constructor names.
- Security: Add a new security hotfix.

## 1.5.6 - 2014-04-01
- Bugfix: Avoid PHP 5.4 warnings.
- Bugfix: Some servers with restrictive security filters make database restores fail.
- Feature: Add a new restore method to VaultPress_Database.

## 1.5.2 - 2013-12-26
- Bugfix: Adding less greedy patterns for cache directories.

## 1.5.1 - 2013-12-16
- Feature: Adding file exclusion patterns to avoid backing up cache and backup directories.

## 1.5 - 2013-12-11
- Bugfix: Don't show admin notices on the about page.

## 1.4.9 - 2013-10-10
- Bugfix: Clean up PHP5 strict warnings.

## 1.4.8 - 2013-07-15
- Feature: Include styles and images with the plugin instead of loading them externally.

## 1.4.7 - 2013-07-02
- Bugfix: Some servers have SSL configuration problems, which breaks the plugin when SSL verification is enforced.

## 1.4.6 - 2013-06-26
- Bugfix: PHP 5.4 notices
- Feature: Add the possibility to ignore frequent updates on some postmeta keys.

## 1.3.9 - 2013-06-26
- Feature: Request decoding (base64/rot13)
- Feature: Response encoding (base64/rot13)

## 1.3.8 - 2013-06-26
- Bugfix: Validate IPv4-mapped IPv6 addresses in the internal firewall.
- Bugfix: Fix hooks not being properly added under certain circumstances.

## 1.3.7 - 2013-06-26
- Bugfix: Protect against infinite loop due to a PHP bug.
- Bugfix: Encode remote ping requests.

## 1.0 - 2013-06-25
- First public release!
