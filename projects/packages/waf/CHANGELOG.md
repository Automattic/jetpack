# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.14] - 2023-10-30

## [0.11.13] - 2023-10-10
### Fixed
- Escape email address when output in HTML. [#33536]

## [0.11.12] - 2023-09-28
### Changed
- Minor internal updates.

## [0.11.11] - 2023-09-19

- Minor internal updates.

## [0.11.10] - 2023-09-11
### Changed
- General: remove backwards-compatible functions now that package relies on WordPress 6.2. [#32772]

## [0.11.9] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [0.11.8] - 2023-07-18
### Changed
- Add support for running brute force protection in environments that otherwise do not support the WAF. [#31761]
- Minor performance improvements. [#31684]

## [0.11.7] - 2023-07-17
### Changed
- Add support for non-empty server https values. [#31688]

## [0.11.6] - 2023-05-22
### Added
- Add integration tests for unsupported environments [#30544]

### Fixed
- Fix Brute force protection activation when WAF unset [#30544]
- Fix unavailable endpoint when WAF module is disabled [#30487]
- Multisite: avoid errors when the package is used in the Protect plugin instead of the Jetpack plugin. [#30767]

## [0.11.5] - 2023-05-15
### Changed
- Internal updates.

## [0.11.4] - 2023-04-27
### Added
- Fix hardblock issue if user only has Protect installed [#30278]

## [0.11.3] - 2023-04-17
### Fixed
- Fix brute force protection not initializing on atomic. [#30113]

## [0.11.2] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [0.11.1] - 2023-04-03
### Fixed
- Return early if we detect the older BFP implementation from the main plugin [#29794]

## [0.11.0] - 2023-03-28
### Added
- Added brute force protection to the WAF configuration REST API endpoints [#28401]
- Move the brute force protection module into the package. [#28401]

### Changed
- Change "whitelist" to "allow list". [#28401]
- Move the brute force protection transient cleanup and shared functions to dedicated namespaced classes. [#28401]
- Use WAF IP allow list option in brute force protection feature. [#28401]

## [0.10.2] - 2023-03-20
### Changed
- Updated package dependencies. [#29480]

## [0.10.1] - 2023-03-08
### Changed
- Minor internal updates.

## [0.10.0] - 2023-02-28
### Added
- Added support for IP ranges in allow and block lists. [#29131]

## [0.9.3] - 2023-02-20
### Changed
- Minor internal updates.

## [0.9.2] - 2023-02-15
### Changed
- Minor internal updates.

## [0.9.1] - 2023-02-13
### Fixed
- Fix an update error that impacted sites using the WAF in standalone mode. [#28844]

## [0.9.0] - 2023-01-25
### Changed
- Change the web application firewall to run automatic and manual rules independently. [#27726]

## [0.8.3] - 2023-01-11
### Fixed
- Fixed the WAF package's PHP tests and Composer requirements [#28185]

## [0.8.2] - 2023-01-09
### Fixed
- Fix firewall activation hooks on first option updates. [#28234]

## [0.8.1] - 2023-01-07
### Changed
- Change directory location that stores firewall rules. [#28049]

## [0.8.0] - 2022-12-27
### Added
- Add file existance checks before requiring rule files in the WAF. [#28050]
- Disable Jetpack Firewall on unsupported environments. [#27939]

## [0.7.2] - 2022-12-19
### Fixed
- Fix the initialization of the firewall. [#27846]

## [0.7.1] - 2022-12-06
### Changed
- html_entity_decode filter now decodes single-quotes too, and uses a Unicode Replacement Character instead of returning empty string on invalid characters. [#27753]

## [0.7.0] - 2022-12-05
### Added
- Prepare package for use in the Jetpack Protect standalone plugin. [#27528]

### Changed
- Updated package dependencies. [#27688]

### Removed
- Remove has_rules_access plan check in favor of external alternatives [#27600]

## [0.6.10] - 2022-11-28
### Changed
- Updated package dependencies. [#27043]

## [0.6.9] - 2022-11-01
### Fixed
- Fix bug for cron event not generating IP rules. [#27215]

## [0.6.8] - 2022-10-27
### Fixed
- Fixes several invalid action callbacks. [#27106]

## [0.6.7] - 2022-09-20
### Changed
- Changing how we load and run the package to avoid actions.php [#24730]

## [0.6.6] - 2022-09-08
### Fixed
- Fixed exception namespace. [#25663]

## [0.6.5] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [0.6.4] - 2022-07-12
### Fixed
- Correct namespacing error. [#24993]

## [0.6.3] - 2022-06-21
### Changed
- Renaming master to trunk. [#24661]

## [0.6.2] - 2022-06-06
### Fixed
- Fix the hook we're using for run.php.

## [0.6.1] - 2022-06-02
### Removed
- Disable the WAF module on Atomic

## [0.6.0] - 2022-05-18
### Added
- Add checks for a killswitch define [#24247]
- Added endpoint to update rules on demand [#24327]
- handle share data option to decide if we should write to log file [#24218]

### Fixed
- Allow the rules API to return 401 responses without throwing an exception. [#24153]
- fix bootstrap generation in cases file.php is not required yet [#24153]

## [0.5.1] - 2022-05-04
### Added
- Added a check to only run the firewall when the Jetpack module is enabled, a method to provide the bootstrap.php path, and a REST API endpoint to provide the firewall settings. [#23769]
- Connected the WAF UI to actually updating the IP block and allow lists when saving the settings. [#24124]

### Fixed
- Fixed database logging [#24070]
- Fixed issue where code for the waf package was executed if the module was disabled [#24217]
- Fixed writing rules php files if the API request for getting up-to-date rules failes so that the internal functionality is kept in tact. [#24181]
- We now sanitize the output generated by blocked requests, and only report the rule ID in the header response. [#24058]

## [0.5.0] - 2022-04-26
### Added
- added cron to update rules
- Added WAF IP allow list and block list functionality.

### Changed
- Added comment to ignore failing phpcs check
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`
- Updated package dependencies.

## [0.4.0] - 2022-04-19
### Added
- added logs when a request is blocked
- Generating rules now fetches them from the API. Also adds a few CLI commands.

## [0.3.0] - 2022-04-12
### Added
- Added hooks for generating the rules.php file, and improved functionality and class names.

## [0.2.0] - 2022-04-06
### Added
- Added Jetpack WAF standalone mode.

### Fixed
- Fix normalizing nested array targets, like with query strings.

## [0.1.1] - 2022-03-29
### Fixed
- Fixed instance of normalizeHeaderName that wasn't renamed; fixed header parsing; removed unused compiler file.

## 0.1.0 - 2022-02-16
### Added
- Added executing the WAF as part of the Jetpack plugin.
- Added Initial version

### Changed
- Core: do not ship .phpcs.dir.xml in production builds.

[0.11.14]: https://github.com/Automattic/jetpack-waf/compare/v0.11.13...v0.11.14
[0.11.13]: https://github.com/Automattic/jetpack-waf/compare/v0.11.12...v0.11.13
[0.11.12]: https://github.com/Automattic/jetpack-waf/compare/v0.11.11...v0.11.12
[0.11.11]: https://github.com/Automattic/jetpack-waf/compare/v0.11.10...v0.11.11
[0.11.10]: https://github.com/Automattic/jetpack-waf/compare/v0.11.9...v0.11.10
[0.11.9]: https://github.com/Automattic/jetpack-waf/compare/v0.11.8...v0.11.9
[0.11.8]: https://github.com/Automattic/jetpack-waf/compare/v0.11.7...v0.11.8
[0.11.7]: https://github.com/Automattic/jetpack-waf/compare/v0.11.6...v0.11.7
[0.11.6]: https://github.com/Automattic/jetpack-waf/compare/v0.11.5...v0.11.6
[0.11.5]: https://github.com/Automattic/jetpack-waf/compare/v0.11.4...v0.11.5
[0.11.4]: https://github.com/Automattic/jetpack-waf/compare/v0.11.3...v0.11.4
[0.11.3]: https://github.com/Automattic/jetpack-waf/compare/v0.11.2...v0.11.3
[0.11.2]: https://github.com/Automattic/jetpack-waf/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/Automattic/jetpack-waf/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-waf/compare/v0.10.2...v0.11.0
[0.10.2]: https://github.com/Automattic/jetpack-waf/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/Automattic/jetpack-waf/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-waf/compare/v0.9.3...v0.10.0
[0.9.3]: https://github.com/Automattic/jetpack-waf/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/Automattic/jetpack-waf/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/Automattic/jetpack-waf/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/Automattic/jetpack-waf/compare/v0.8.3...v0.9.0
[0.8.3]: https://github.com/Automattic/jetpack-waf/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/Automattic/jetpack-waf/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-waf/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-waf/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/Automattic/jetpack-waf/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/jetpack-waf/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-waf/compare/v0.6.10...v0.7.0
[0.6.10]: https://github.com/Automattic/jetpack-waf/compare/v0.6.9...v0.6.10
[0.6.9]: https://github.com/Automattic/jetpack-waf/compare/v0.6.8...v0.6.9
[0.6.8]: https://github.com/Automattic/jetpack-waf/compare/v0.6.7...v0.6.8
[0.6.7]: https://github.com/Automattic/jetpack-waf/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/Automattic/jetpack-waf/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/Automattic/jetpack-waf/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/Automattic/jetpack-waf/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/Automattic/jetpack-waf/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/Automattic/jetpack-waf/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-waf/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-waf/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/Automattic/jetpack-waf/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-waf/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-waf/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-waf/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-waf/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-waf/compare/v0.1.0...v0.1.1
