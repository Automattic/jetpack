# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies.
- Updated package textdomain from `jetpack` to `jetpack-lazy-images`.

## [2.0.10] - 2021-12-14

## [2.0.9] - 2021-11-30
### Changed
- Remove `.min` from built JS.
- Updated package dependencies.

## [2.0.8] - 2021-11-22
### Changed
- Updated package dependencies

## [2.0.7] - 2021-11-17
### Changed
- Updated package dependencies.

## [2.0.6] - 2021-11-16
### Added
- Use monorepo `validate-es` script to validate Webpack builds.

### Changed
- Updated package dependencies.

## [2.0.5] - 2021-11-09
### Changed
- Update webpack build config.

## [2.0.4] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [2.0.3] - 2021-10-19
### Changed
- Updated package dependencies.

### Deprecated
- General: remove numerous long-deprecated functions.

## [2.0.2] - 2021-10-12
### Changed
- Updated package dependencies

## [2.0.1] - 2021-09-28
### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- Updated package dependencies.

## [2.0.0] - 2021-08-31
### Changed
- Run composer update on test-php command instead of phpunit.
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- Update annotations versions.
- Update to latest webpack, webpack-cli and calypso-build.
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.

### Removed
- Removed IE11 support.

## [1.5.1] - 2021-08-10
### Changed
- Updated package dependencies

## [1.5.0] - 2021-06-29
### Changed
- Build using calypso-build, and use the intersection-observer npm module instead of bundling a copy.
- Update docs to replace yarn with pnpm.
- Update node version requirement to 14.16.1

## [1.4.4] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.4.3] - 2021-04-27
### Changed
- Updated package dependencies

## [1.4.2] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

### Fixed
- Update icon file used for tests, WP 5.7 no longer silences exif errors.
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.4.1] - 2021-02-23

- Update dependency webpack to v4.46.0
- Update dependency webpack-cli to v4.5.0
- CI: Make tests more generic
- CLI: Add install command

## [1.4.0] - 2021-01-26

- Mirroring: Move build command into composer
- Mirroring: Fix vendor copy of lazy-images in jetpack-production
- Add mirror-repo information to all current composer packages
- Lazy Images: do not include js linting config in production
- Monorepo: Reorganize all projects
- Various PHPCS and Cleanup

## [1.3.0] - 2021-01-05

- Lazy-Images: Downgrade to ES5
- Pin dependencies
- Packages: Update for PHP 8 testing
- Reorganize composer scripts
- General: update minimum required version to WordPress 5.5
- Codecoverage: fix reports
- Updated PHPCS: Packages and Debugger

## [1.2.2] - 2020-12-09

- Update dependencies to latest stable
- Updated dependencies to latest stable

## [1.2.1] - 2020-11-24

- General: update minimum required version to WordPress 5.5
- Codecoverage: fix reports
- Updated PHPCS: Packages and Debugger

## [1.2.0] - 2020-10-27

- Lazy Images: Use a better name for wp_localize_script's l10n object
- Lazy Images: Start linting lazy-images.js

## [1.1.3] - 2020-12-09

- Update dependencies to latest stable

## [1.1.2] - 2020-11-24

- Version packages for release

## [1.1.1] - 2020-11-10

- Update dependencies to latest stable

## [1.1.0] - 2020-09-29

- Consolidate the Lazy Images package to rely on the Assets package

## 1.0.0 - 2020-08-25

- Lazy Images: Move into a package

[2.1.0]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.10...v2.1.0
[2.0.10]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.9...v2.0.10
[2.0.9]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.8...v2.0.9
[2.0.8]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.7...v2.0.8
[2.0.7]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.6...v2.0.7
[2.0.6]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.5...v2.0.6
[2.0.5]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Automattic/jetpack-lazy-images/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.5.1...v2.0.0
[1.5.1]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.4.4...v1.5.0
[1.4.4]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-lazy-images/compare/v1.0.0...v1.1.0
