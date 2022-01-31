# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.4] - 2022-01-31
### Fixed
- Search: Fetch plan info as blog, not as user, to allow nonconnected admins to use dashboard

## [0.5.3] - 2022-01-27
### Fixed
- Search package: fixed compatibility issue with plan activation

## [0.5.2] - 2022-01-25
### Added
- Added a watch command for building assets
- Search E2E: added class names for some form components for easier E2E tests

### Changed
- Search: Improve accessibility via headings hierarchy and aria roles
- Updated package dependencies.

### Fixed
- Search widget: changed fetching search result to just before rendering jp search widget

## [0.5.1] - 2022-01-18
### Changed
- General: update required node version to v16.13.2

## [0.5.0] - 2022-01-11
### Added
- Search: Migrated Classic and Instant Search code from Jetpack plugin.
- Search API: activation and deactivation API.

### Changed
- Search: moved search dashboard to the package.
- Updated package dependencies.

## [0.4.0] - 2022-01-04
### Changed
- Do not escape widget title value
- Switch to pcov for code coverage.
- Updated package dependencies.
- Updated package textdomain from `jetpack` to `jetpack-search-pkg`.

### Fixed
- Add missing textdomains in JS code.

## [0.3.0] - 2021-12-14
### Changed
- Search package: add new methods and update timing for `Plan` class.
- Search package: refactored Module_Control class.

## [0.2.1] - 2021-12-07
### Changed
- Updated package dependencies.

## [0.2.0] - 2021-11-30
### Added
- Added essential scaffolding for package.
- Migrate additional helper classes to package
- Search: added new state store for search dashboard
- Search package: duplicated search dashboard dependencies to the package

### Changed
- Search: migrate/create necessary APIs for the frontend
- Search: removed other dependencies from copied code

## 0.1.0 - 2021-11-09
### Added
- Add a new Search package with Helper and Options classes.
- Search: Migrate helper classes from Jetpack plugin

### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Updated package dependencies.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

[0.5.4]: https://github.com/Automattic/jetpack-search/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/Automattic/jetpack-search/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-search/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-search/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-search/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-search/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-search/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/jetpack-search/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-search/compare/v0.1.0...v0.2.0
