# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.8] - 2025-09-17
### Fixed
- Code: Resolve PhanImpossibleCondition violations. [#44869]

## [0.6.7] - 2025-08-05
### Changed
- Internal updates.

## [0.6.6] - 2025-07-08
### Changed
- Internal updates.

## [0.6.5] - 2025-05-15
### Changed
- Remove documentation references to deprecated svelte-data-sync-client package. [#43449]

## [0.6.4] - 2025-03-26
### Changed
- Internal updates.

## [0.6.3] - 2025-03-18
### Changed
- Internal updates.

## [0.6.2] - 2025-03-05
### Added
- Add new helper function for registering read only entries [#41673]

## [0.6.1] - 2025-01-23
### Changed
- Internal updates.

## [0.6.0] - 2024-11-28
### Changed
- Updated dependencies. [#40286]

### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.5.2] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [0.5.1] - 2024-10-10
### Fixed
- Fix missing types in phpdoc comments. [#39648]

## [0.5.0] - 2024-08-29
### Changed
- Updated package dependencies. [#39004]

### Removed
- Schema: Remove built in schema and use the dedicated package for schema instead. [#39025]

## [0.4.5] - 2024-05-08
### Fixed
- Fix phpcs config, and phpdoc comments that were easy to fix. [#37122]

## [0.4.4] - 2024-03-15
### Changed
- Internal updates.

## [0.4.3] - 2024-03-01
### Fixed
- Improved error handling and response formatting in DataSync client and PHP classes. [#35962]

## [0.4.2] - 2024-02-22
### Changed
- WP JS DataSync: Added new debugging features and improvements to existing functionality. [#35537]
- WP JS DataSync: Try to prevent fatal errors in production as much as possible. [#35361]

### Fixed
- WP JS Data Sync: Added tests for fallback values and fixed `Type_Literal` value handling in the schema parser. [#35366]

## [0.4.1] - 2024-01-30
### Changed
- DataSync: Improve error logging [#35114]

## [0.4.0] - 2024-01-22
### Added
- Added schema validation to datasync actions [#34910]

### Changed
- Add DataSync Actions [#34755]
- DataSync: Improved exception handling and JSON decoding consistency across multiple classe [#35062]
- Improved error handling in DataSync. [#34599]
- The package now requires PHP >= 7.0. [#34192]

## [0.3.0] - 2023-10-26
### Fixed
- Use fallback value while merging an entry [#33133]

## [0.2.2] - 2023-09-01
### Changed
- Updated package dependencies. [#32605]

## [0.2.1] - 2023-06-23
### Added
- Fetch reports from IG back-end [#31234]

## 0.2.0 - 2023-05-11
### Added
- Added action hooks to fire during store value update [#29451]
- Added Jetpack Autoloader package suggestion. [#29988]

### Changed
- Added lazy entry loading [#30508]
- Changed the Data Sync Entry terminology and updated inline documentation [#30508]
- Ensured most up-to-date package version is in use. [#29973]
- No longer auto-loading DataSync Options [#30435]

### Fixed
- Fixed errors on GET requests [#29972]
- Fixed PHP 8.2 Warnings [#30150]

## 0.1.0 - 2023-04-06
### Added
- Added Schema class to help parsing data. [#29564]
- First release. [#28787]
- More flexible storage driver, built in boolean data handler.[#29122]

### Changed
- Refactored WP JS Data Sync to a more flexible approach and use schemas for ensuring the data is the correct shape. [#29899]

### Fixed
- Jetpack Boost: Fix assoc_array schema validation. [#29611]

[0.6.8]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.6.7...v0.6.8
[0.6.7]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.4.5...v0.5.0
[0.4.5]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.2.0...v0.2.1
