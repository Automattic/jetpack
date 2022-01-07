# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.16.1] - 2022-01-05
### Fixed
- Don't issue a "doing it wrong" warning for registering aliases during plugin activation.

## [1.16.0] - 2022-01-04
### Added
- Document use of jetpack-assets, jetpack-composer-plugin, and i18n-loader-webpack-plugin together.

### Changed
- Switch to pcov for code coverage.
- Updated package dependencies
- Updated package textdomain from `jetpack` to `jetpack-assets`.

## [1.15.0] - 2021-12-20
### Added
- Add `alias_textdomain()`.

## [1.14.0] - 2021-12-14
### Added
- Generate `wp-jp-i18n-state` script.

## [1.13.1] - 2021-11-22
### Fixed
- Call `_doing_it_wrong` correctly.

## [1.13.0] - 2021-11-22
### Added
- Have `Assets::register_script()` accept a textdomain for `wp_set_script_translations` (and complain if no textdomain is passed when `wp-i18n` is depended on).

### Changed
- Updated package dependencies

### Fixed
- Added missing option doc for `Assets::register_script()`.

## [1.12.0] - 2021-11-15
### Added
- Add `Assets::register_script()` for easier loading of Webpack-built scripts.

## [1.11.10] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [1.11.9] - 2021-10-13
### Changed
- Updated package dependencies.

## [1.11.8] - 2021-10-06
### Changed
- Updated package dependencies

## [1.11.7] - 2021-09-28
### Changed
- Updated package dependencies.

## [1.11.6] - 2021-08-30
### Changed
- Run composer update on test-php command instead of phpunit
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- update annotations versions

## [1.11.5] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.11.4] - 2021-04-08
### Changed
- Packaging and build changes, no change to the package itself.

## [1.11.3] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.11.2] - 2021-02-23

- CI: Make tests more generic

## [1.11.1] - 2021-01-26

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.11.0] - 2021-01-05

- Update dependency brain/monkey to v2.6.0

## [1.10.0] - 2020-12-08

- Assets: introduce new method to process static resources
- Assets: Use defer for script tags
- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.9.1] - 2020-11-24

- Update dependency brain/monkey to v2.5.0
- Updated PHPCS: Packages and Debugger

## [1.9.0] - 2020-10-27

- Instagram oEmbed: Simplify

## [1.8.0] - 2020-09-29

- Consolidate the Lazy Images package to rely on the Assets package

## [1.7.0] - 2020-08-25

- Packages: Update filenames after #16810
- CI: Try collect js coverage
- Docker: Add package testing shortcut

## [1.6.0] - 2020-07-28

- Various: Use wp_resource_hints

## [1.5.0] - 2020-06-30

- PHPCS: Clean up the packages
- WooCommerce Analytics: avoid 404 error when enqueuing script

## [1.4.0] - 2020-05-26

- Add Jetpack Scan threat notifications

## [1.3.0] - 2020-04-28

- Update dependencies to latest stable

## [1.2.0] - 2020-03-31

- Update dependencies to latest stable

## [1.1.1] - 2020-01-27

- Pin dependency brain/monkey to 2.4.0

## [1.1.0] - 2020-01-14

- Packages: Various improvements for wp.com or self-contained consumers

## [1.0.3] - 2019-11-08

- Packages: Use classmap instead of PSR-4

## [1.0.1] - 2019-10-28

- PHPCS: JITM and Assets packages
- Packages: Add gitattributes files to all packages that need th…

## 1.0.0 - 2019-09-14

- Statically access asset tools

[1.16.1]: https://github.com/Automattic/jetpack-assets/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/Automattic/jetpack-assets/compare/v1.15.0...v1.16.0
[1.15.0]: https://github.com/Automattic/jetpack-assets/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/Automattic/jetpack-assets/compare/v1.13.1...v1.14.0
[1.13.1]: https://github.com/Automattic/jetpack-assets/compare/v1.13.0...v1.13.1
[1.13.0]: https://github.com/Automattic/jetpack-assets/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/Automattic/jetpack-assets/compare/v1.11.10...v1.12.0
[1.11.10]: https://github.com/Automattic/jetpack-assets/compare/v1.11.9...v1.11.10
[1.11.9]: https://github.com/Automattic/jetpack-assets/compare/v1.11.8...v1.11.9
[1.11.8]: https://github.com/Automattic/jetpack-assets/compare/v1.11.7...v1.11.8
[1.11.7]: https://github.com/Automattic/jetpack-assets/compare/v1.11.6...v1.11.7
[1.11.6]: https://github.com/Automattic/jetpack-assets/compare/v1.11.5...v1.11.6
[1.11.5]: https://github.com/Automattic/jetpack-assets/compare/v1.11.4...v1.11.5
[1.11.4]: https://github.com/Automattic/jetpack-assets/compare/v1.11.3...v1.11.4
[1.11.3]: https://github.com/Automattic/jetpack-assets/compare/v1.11.2...v1.11.3
[1.11.2]: https://github.com/Automattic/jetpack-assets/compare/v1.11.1...v1.11.2
[1.11.1]: https://github.com/Automattic/jetpack-assets/compare/v1.11.0...v1.11.1
[1.11.0]: https://github.com/Automattic/jetpack-assets/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/Automattic/jetpack-assets/compare/v1.9.1...v1.10.0
[1.9.1]: https://github.com/Automattic/jetpack-assets/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/Automattic/jetpack-assets/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/Automattic/jetpack-assets/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/Automattic/jetpack-assets/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Automattic/jetpack-assets/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Automattic/jetpack-assets/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-assets/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-assets/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-assets/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-assets/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-assets/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/Automattic/jetpack-assets/compare/v1.0.1...v1.0.3
[1.0.1]: https://github.com/Automattic/jetpack-assets/compare/v1.0.0...v1.0.1
