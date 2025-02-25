# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.2] - 2025-02-24
### Changed
- Internal updates.

## [5.0.1] - 2025-01-20
### Changed
- Code: Use function-style exit() and die() with a default status code of 0. [#41167]

## [5.0.0] - 2024-11-25
### Removed
- Drop support for Composer <2.2. [#40297]
- Remove support for WordPress 6.5 and earlier. [#40200]

## [4.0.0] - 2024-11-14
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [3.1.3] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [3.1.2] - 2024-10-15
### Changed
- Internal updates.

## [3.1.1] - 2024-10-10
### Changed
- Internal updates.

## [3.1.0] - 2024-09-06
### Added
- Add logic for debugging issues caused by conflicting Composer autoloaders, enabled by setting the `JETPACK_AUTOLOAD_DEBUG_CONFLICTING_LOADERS` constant. [#38995]
- Add logic for debugging issues caused by early class loads, enabled by setting the `JETPACK_AUTOLOAD_DEBUG_EARLY_LOADS` constant. [#38995]

## [3.0.10] - 2024-08-26
### Changed
- Updated package dependencies. [#39004]

## [3.0.9] - 2024-07-10
### Fixed
- Avoid a deprecation notice in `Autoloader_Locator::find_latest_autoloader()`. [#38245]

## [3.0.8] - 2024-05-29
### Fixed
- `AutoloadGenerator::__construct` no longer pretends `$io` is nullable. That never worked. [#37608]

## [3.0.7] - 2024-05-06
### Fixed
- Avoid deprecation notices when plugin path is null. [#37174]

## [3.0.6] - 2024-04-22
### Changed
- Internal updates.

## [3.0.5] - 2024-04-11
### Changed
- Internal updates.

## [3.0.4] - 2024-03-18
### Changed
- Internal updates.

## [3.0.3] - 2024-03-14
### Changed
- Internal updates.

## [3.0.2] - 2023-11-21

## [3.0.1] - 2023-11-21

## [3.0.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [2.12.0] - 2023-09-28
### Added
- Add an `AutoloadGenerator::VERSION` constant, and use that for the autoloader's version in preference to whatever Composer has. [#33156]

## [2.11.23] - 2023-09-19

- Minor internal updates.

## [2.11.22] - 2023-08-23
### Changed
- Updated package dependencies. [#32605]

## [2.11.21] - 2023-05-22
### Added
- Set keywords in `composer.json`. [#30756]

## [2.11.20] - 2023-05-11

- Updated package dependencies

## [2.11.19] - 2023-04-25
### Fixed
- Fix example in README [#30225]

## [2.11.18] - 2023-03-28
### Changed
- Minor internal updates.

## [2.11.17] - 2023-03-27
### Fixed
- Don't error when processing packages specifying missing PSR paths. [#29669]

## [2.11.16] - 2023-02-20
### Changed
- Minor internal updates.

## [2.11.15] - 2023-01-11
### Changed
- Updated package dependencies.

## [2.11.14] - 2022-12-19
### Changed
- Use `Composer\ClassMapGenerator\ClassMapGenerator` when available (i.e. with composer 2.4). [#27812]

### Fixed
- Declare fields for PHP 8.2 compatibility. [#27949]

## [2.11.13] - 2022-12-02
### Changed
- Updated package dependencies. [#27688]

## [2.11.12] - 2022-11-22
### Changed
- Updated package dependencies. [#27043]

## [2.11.11] - 2022-10-25
### Changed
- Sort data in generated `vendor/composer/jetpack_autoload_classmap.php` to avoid spurious diffs. [#26929]

## [2.11.10] - 2022-10-05

- Tests: Clear `COMPOSER_AUTH` environment variable when running Composer for tests. [#26404]

## [2.11.9] - 2022-09-27
### Fixed
- Tests: Clear `COMPOSER_AUTH` environment variable when running Composer for tests. [#26404]

## [2.11.8] - 2022-09-20
### Fixed
- Tests: skip test if it requires a version of Composer not compatible with the running version of PHP. [#26143]

## [2.11.7] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [2.11.6] - 2022-06-21
### Changed
- Renaming `master` to `trunk`.

## [2.11.5] - 2022-05-18
### Fixed
- Fix new PHPCS sniffs. [#24366]

## [2.11.4] - 2022-04-26
### Changed
- Updated package dependencies.

## [2.11.3] - 2022-04-19
### Changed
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`

## [2.11.2] - 2022-03-29
### Changed
- Microperformance: Use === null instead of is_null

## [2.11.1] - 2022-03-08
### Removed
- Removed the Upgrade Handler.

## [2.11.0] - 2022-03-08
### Added
- On plugin update, pre-load all (non-PSR-4) classes from the plugin to avoid mid-upgrade fatals.

## [2.10.13] - 2022-03-01
### Fixed
- Fix tests for upstream phpunit change.

## [2.10.12] - 2022-01-25
### Changed
- Updated package dependencies.

## [2.10.11] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## [2.10.10] - 2021-11-16
### Added
- Soft return if autoloader chain is not available.

## [2.10.9] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.

## [2.10.8] - 2021-10-13
### Changed
- Updated package dependencies.

## [2.10.7] - 2021-10-07
### Changed
- Updated package dependencies

## [2.10.6] - 2021-09-28
### Changed
- Updated package dependencies.

## [2.10.5] - 2021-08-31
### Changed
- Run composer update on test-php command instead of phpunit
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).

## [2.10.4] - 2021-08-10
### Changed
- Updated package dependencies.

## [2.10.3] - 2021-05-25
### Changed
- Updated package dependencies.

## [2.10.2] - 2021-04-27
### Changed
- Updated package dependencies.

## [2.10.1] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies
- Tests: Added code coverage transformation

### Changed
- Update package dependencies.

### Fixed
- Fix coverage test
- Fix uninstallation fatal
- Update tests for changed composer 2.0.9 hash.
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [2.10.0] - 2021-02-09

- Autoloader: test suite refactor

## [2.9.1] - 2021-02-05

- CI: Make tests more generic
- Autoloader: stricter type-checking on WP functions
- Autoloader: prevent transitive plugin execution

## [2.9.0] - 2021-01-25

- Autoloader: revised latest autoloader inclusion semantics
- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects
- Autoloader: Don't cache deactivating plugins

## [2.8.0] - 2020-12-18

## [2.7.1] - 2020-12-18

- Autoloader: Added realpath resolution to plugin paths

## [2.7.0] - 2020-12-08

- Autoloader: Preemptively load unknown plugins from cache
- Removed unwanted dot
- Pin dependencies
- Packages: Update for PHP 8 testing

## [2.6.0] - 2020-11-19

- Autoloader: AutoloadGenerator no longer extends Composer's AutoloadGenerator class
- Autoloader: Reuse an existing autoloader suffix if available
- Updated PHPCS: Packages and Debugger

## [2.5.0] - 2020-10-08

- Autoloader: remove the defined('JETPACK_AUTOLOAD_DEV') checks from the tests

## [2.4.0] - 2020-09-28

- Autoloader: remove the plugins_loaded bullet point from the README
- Packages: avoid PHPCS warnings
- Autoloader: add PSR-0 support
- Autoloader: Detect filtering of active_plugins
- Autoloader: Support unoptimized PSR-4

## [2.3.0] - 2020-08-21

- Autoloader: remove the plugin update hook

## [2.2.0] - 2020-08-14

- Autoloader: don't reset the autoloader version during plugin update
- CI: Try collect js coverage

## [2.1.0] - 2020-07-27

- Autoloader: convert '\' directory separators to '/' in plugin paths
- Autoloader: Avoid a PHP warning when an empty string is passed to `is_directory_plugin()`.
- Autoloader: Tests: Use a string with define

## [2.0.2] - 2020-07-09

- Autoloader: Avoid a PHP warning when an empty string is passed to `is_directory_plugin()`.

## [2.0.1] - 2020-07-02

- Autoloader: Tests: Use a string with define

## [2.0.0] - 2020-06-29

## [2.0.0-beta] - 2020-06-29

- Autoloader: Support Composer v2.0
- Autoloader: use paths to identify plugins instead of the directories
- Autoloader: fix the fatal that occurs during plugin update
- Autoloader: add fallback check for plugin path in mu-plugins
- Autoloader: use JETPACK__PLUGIN_DIR when looking for the jetpack plugin directory.
- Feature Branch: Update the Autoloader
- PHPCS: Clean up the packages
- PHPCS Updates after WPCS 2.3

## [1.7.0] - 2020-04-23

- Jetpack: Move comment notification override back to the constructor

## [1.6.0] - 2020-03-26

- Autoloader: Remove file check to improve performance.

## [1.5.0] - 2020-02-25

- Jetpack: instantiate manager object if it's null

## [1.4.1] - 2020-02-14

- Autoloader: Load only latest version of autoload files to avoid conflicts.

## [1.4.0] - 2020-01-23

- Autoloader: Remove the ignored classes

## [1.3.8] - 2020-01-14

- Trying to add deterministic initialization.
- Autoloader: Remove Manager_Interface and Plugin\Tracking from ignored list
- Autoloader: Remove Jetpack_IXR_Client from ignore list

## [1.3.7] - 2019-12-10

## [1.3.6] - 2019-12-09

- Autoloader: Use long-form sytax for array

## [1.3.5] - 2019-11-26

- Fix/php notice status

## [1.3.4] - 2019-11-08

- Deprecate Jetpack::is_development_mode() in favor of the packaged Status()-&gt;is_development_mode()

## [1.3.3] - 2019-10-28

- Packages: Add gitattributes files to all packages that need th…

## [1.3.2] - 2019-09-24

- Autoloader: Cover scenarios where composer/autoload_files.php…

## [1.3.1] - 2019-09-20

- Docs: Unify usage of @package phpdoc tags

## [1.3.0] - 2019-09-14

- Fix for empty namespaces. #13459
- Connection: Move the Jetpack IXR client to the package
- Adds full connection cycle capability to the Connection package.
- Jetpack 7.5: Back compatibility package

## [1.2.0] - 2019-06-24

- Jetpack DNA: Add full classmap support to Autoloader
- Move Jetpack_Sync_Main from legacy to PSR-4

## [1.1.0] - 2019-06-19

- Packages: Move autoloader tests to the package
- DNA: Move Jetpack Usage tracking to its own file
- Jetpack DNA: More isolation of Tracks Package
- Autoloader: Ignore XMLRPC_Connector if called too early
- Autoloader: Ignore Jetpack_Signature if called too early

## 1.0.0 - 2019-06-11

- Add Custom Autoloader

[5.0.2]: https://github.com/Automattic/jetpack-autoloader/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/Automattic/jetpack-autoloader/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/Automattic/jetpack-autoloader/compare/v4.0.0...v5.0.0
[4.0.0]: https://github.com/Automattic/jetpack-autoloader/compare/v3.1.3...v4.0.0
[3.1.3]: https://github.com/Automattic/jetpack-autoloader/compare/v3.1.2...v3.1.3
[3.1.2]: https://github.com/Automattic/jetpack-autoloader/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/Automattic/jetpack-autoloader/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.10...v3.1.0
[3.0.10]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.9...v3.0.10
[3.0.9]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.8...v3.0.9
[3.0.8]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.7...v3.0.8
[3.0.7]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.6...v3.0.7
[3.0.6]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.5...v3.0.6
[3.0.5]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.4...v3.0.5
[3.0.4]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.3...v3.0.4
[3.0.3]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/Automattic/jetpack-autoloader/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.12.0...v3.0.0
[2.12.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.23...v2.12.0
[2.11.23]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.22...v2.11.23
[2.11.22]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.21...v2.11.22
[2.11.21]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.20...v2.11.21
[2.11.20]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.19...v2.11.20
[2.11.19]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.18...v2.11.19
[2.11.18]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.17...v2.11.18
[2.11.17]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.16...v2.11.17
[2.11.16]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.15...v2.11.16
[2.11.15]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.14...v2.11.15
[2.11.14]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.13...v2.11.14
[2.11.13]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.12...v2.11.13
[2.11.12]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.11...v2.11.12
[2.11.11]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.10...v2.11.11
[2.11.10]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.9...v2.11.10
[2.11.9]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.8...v2.11.9
[2.11.8]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.7...v2.11.8
[2.11.7]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.6...v2.11.7
[2.11.6]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.5...v2.11.6
[2.11.5]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.4...v2.11.5
[2.11.4]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.3...v2.11.4
[2.11.3]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.2...v2.11.3
[2.11.2]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.1...v2.11.2
[2.11.1]: https://github.com/Automattic/jetpack-autoloader/compare/v2.11.0...v2.11.1
[2.11.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.13...v2.11.0
[2.10.13]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.12...v2.10.13
[2.10.12]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.11...v2.10.12
[2.10.11]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.10...v2.10.11
[2.10.10]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.9...v2.10.10
[2.10.9]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.8...v2.10.9
[2.10.8]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.7...v2.10.8
[2.10.7]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.6...v2.10.7
[2.10.6]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.5...v2.10.6
[2.10.5]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.4...v2.10.5
[2.10.4]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.3...v2.10.4
[2.10.3]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.2...v2.10.3
[2.10.2]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.1...v2.10.2
[2.10.1]: https://github.com/Automattic/jetpack-autoloader/compare/v2.10.0...v2.10.1
[2.10.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.9.1...v2.10.0
[2.9.1]: https://github.com/Automattic/jetpack-autoloader/compare/v2.9.0...v2.9.1
[2.9.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.8.0...v2.9.0
[2.8.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.7.1...v2.8.0
[2.7.1]: https://github.com/Automattic/jetpack-autoloader/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/Automattic/jetpack-autoloader/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Automattic/jetpack-autoloader/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Automattic/jetpack-autoloader/compare/v2.0.0-beta...v2.0.0
[2.0.0-beta]: https://github.com/Automattic/jetpack-autoloader/compare/v1.7.0...v2.0.0-beta
[1.7.0]: https://github.com/Automattic/jetpack-autoloader/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Automattic/jetpack-autoloader/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Automattic/jetpack-autoloader/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/Automattic/jetpack-autoloader/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.8...v1.4.0
[1.3.8]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.7...v1.3.8
[1.3.7]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.6...v1.3.7
[1.3.6]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/Automattic/jetpack-autoloader/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-autoloader/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-autoloader/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-autoloader/compare/v1.0.0...v1.1.0
