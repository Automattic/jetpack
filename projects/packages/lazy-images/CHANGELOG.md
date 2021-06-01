# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
