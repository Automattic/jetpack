# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.4] - 2022-05-18
### Changed
- Adjust translatable string [#24357]
- Record Meter: switch noticebox persistence storage from localStorage to sessionStorage [#24348]
- Record Meter design updates [#24225]
- Search package: search dashboard refactoring [#24266]
- Updated package dependencies. [#23795] [#24153] [#24306] [#24372]

## [0.13.3] - 2022-05-10
### Added
- Add missing JS dep on `core-js`. [#24288]

### Changed
- Search: refactored Settings to expose the settings array for sync [#24167]
- Updated package dependencies. [#24189]
- Updated package dependencies. [#24204]
- Updated package dependencies. [#24302]
- Updated package dependencies [#24276]
- Updated package dependencies [#24296]
- Updated package dependencies [#24301]

### Fixed
- Search: Fix left padding for upsell page [#24285]
- Search: handle tiers without a record limit in Record Meter [#24264]

## [0.13.2] - 2022-05-04
### Added
- Add missing JavaScript dependencies. [#24096]

### Changed
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Updated package dependencies. [#24095] [#24230] [#24198] [#24228]

### Deprecated
- Moved the options class into Connection. [#24095]

### Fixed
- Adapt Record Meter to change in API response format [#24107]
- Search: Bundle vendor assets within the main chunk [#24068]
- Search: Fix search for private WoA sites [#24099]
- Search: reset border-radius for search buttons [#24100]

## [0.13.1] - 2022-04-26
### Added
- Search: added upsell page

### Changed
- Updated package dependencies.
- Update package.json metadata.

## [0.13.0] - 2022-04-19
### Added
- Search: add class to retrieve search product information
- Search: Add count estimation function
- Search: added API support for search product tier pricing

### Changed
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`
- Record meter: updates noticeboxes to be dismissable & styled
- Search Record Meter updates formatting
- Use new shared Gridicons component and shared Modules library

## [0.12.3] - 2022-04-12
### Added
- Added deprecated methods as a safety.

### Changed
- Updated package dependencies.

### Fixed
- Search: auto config no longer overrides option if it exists.

## [0.12.2] - 2022-04-06
### Added
- Adds API data to record meter chart.

### Changed
- Janitorial: Refactor classes into shared package.
- Updated package dependencies.

### Removed
- Removed tracking dependency.

### Fixed
- Search: allow Search submenu to be added only once

## [0.12.1] - 2022-03-31
### Fixed
- Search: fixed search submenu is shown because compatibility file is loaded too late.

## [0.12.0] - 2022-03-29
### Added
- Add selector for retrieving last indexed date
- Adds notice box component to record meter
- Search: Migrated tests from Jetpack plugin

### Changed
- Microperformance: Use === null instead of is_null
- Search: connection states
- Updated package dependencies

### Fixed
- Fixed lints found after fixing ESLint config
- Search: address feeback for #23477
- Search: move Jetpack plugin compatibility to the package

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

[0.13.4]: https://github.com/Automattic/jetpack-search/compare/v0.13.3...v0.13.4
[0.13.3]: https://github.com/Automattic/jetpack-search/compare/v0.13.2...v0.13.3
[0.13.2]: https://github.com/Automattic/jetpack-search/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/Automattic/jetpack-search/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/Automattic/jetpack-search/compare/v0.12.3...v0.13.0
[0.12.3]: https://github.com/Automattic/jetpack-search/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/Automattic/jetpack-search/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/Automattic/jetpack-search/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/Automattic/jetpack-search/compare/v0.11.3...v0.12.0
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
