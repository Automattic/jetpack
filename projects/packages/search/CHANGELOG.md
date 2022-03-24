# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.3] - 2022-03-24
### Added
- Search: adds a record count above the record meter chart.

### Fixed
- Deactivation: Do not attempt to redirect on a behind-the-scene deactivation.

## [0.11.2] - 2022-03-23
### Added
- adds basic structure for record meter with dummy data

### Changed
- Centralized all intializing logic
- Search dashboard: changed condition to always show dashboard submenu
- Updated package dependencies
- Use Migrated GlotPress locale classes from compat pkg.

### Fixed
- Search: fixed cli and package version reporting broken in #23435

## [0.11.1] - 2022-03-15
### Changed
- Fixed minor product defects
- Search: moved globals to a class for sake of autoloading correctly
- Search package: Updated Gridicon dependancy to use local version
- Updated package dependencies.

## [0.11.0] - 2022-03-08
### Changed
- Components: update attributes used within the Button component to match recent deprecations and changes.
- Move customizer integration into search package
- search: move record meter location on dashboard

### Fixed
- Ensure that WP CLI is present before extending the class.
- Ensure the Customizer classes are loaded.

## [0.10.0] - 2022-03-02
### Added
- Search: add chart.js package to dependencies
- Search: fetch search stats endpoint in wp-admin dashboard

### Changed
- Search: Renamed Customberg class file name
- Updated package dependencies.

### Fixed
- Fix various notices shown for Customberg
- Search package: i18n support for auto added search block label and button

## [0.9.1] - 2022-02-25
### Fixed
- Search: Fixed a regression that prevented modal from being spawned by link clicks

## [0.9.0] - 2022-02-22
### Added
- Bump package versions.
- Search: add stats endpoint to REST controller

### Changed
- Search package: refactor `auto_config_search` and run it from activation API

### Fixed
- Search package: fix auto config doesn't add search input for block themes

## [0.8.0] - 2022-02-16
### Added
- Add babel/runtime to dev dependencies
- Add tier maximum records for Record Meter
- Clicking outside overlay now closes overlay

### Changed
- Change `instance` function for improved compatibility
- Updated package dependencies.

### Fixed
- Form: avoid React warning.
- Improve display of colorpicker in Customberg
- Fixed undefined index features
- Should not exclude widget js in package distribution

## [0.7.0] - 2022-02-09
### Added
- Search Dashboard: add scaffolding for new record meter
- Search package: added auto config CLI

### Changed
- Search: move search widgets to package
- Updated package dependencies

## [0.6.0] - 2022-02-02
### Added
- Add `@use "sass:math"` in base styles scss for upcoming `@wordpress/block-editor` 8.1.0 requirement.
- Search package: added package version number and others

### Changed
- Build: remove unneeded files from production build.
- Instant Search: add image alt text from API
- Updated package dependencies.

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

[0.11.3]: https://github.com/Automattic/jetpack-search/compare/v0.11.2...v0.11.3
[0.11.2]: https://github.com/Automattic/jetpack-search/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/Automattic/jetpack-search/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-search/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/Automattic/jetpack-search/compare/v0.9.1...v0.10.0
[0.9.1]: https://github.com/Automattic/jetpack-search/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/Automattic/jetpack-search/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/Automattic/jetpack-search/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Automattic/jetpack-search/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/jetpack-search/compare/v0.5.4...v0.6.0
[0.5.4]: https://github.com/Automattic/jetpack-search/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/Automattic/jetpack-search/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-search/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-search/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-search/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-search/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-search/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/jetpack-search/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-search/compare/v0.1.0...v0.2.0
