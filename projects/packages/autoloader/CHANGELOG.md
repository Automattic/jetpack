# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
