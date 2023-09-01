# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.2]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-wp-js-data-sync/compare/v0.2.0...v0.2.1
