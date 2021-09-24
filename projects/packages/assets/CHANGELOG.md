# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
