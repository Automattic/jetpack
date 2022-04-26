# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.7] - 2022-04-26
### Changed
- Updated package dependencies.

## [1.7.6] - 2022-04-19
### Changed
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`

## [1.7.5] - 2022-04-12
### Changed
- Updated package dependencies.

## [1.7.4] - 2022-04-06
### Changed
- Updated package dependencies.

## [1.7.3] - 2022-03-29
### Changed
- Microperformance: Use === null instead of is_null

## [1.7.2] - 2022-03-02
### Changed
- Updated package dependencies.

## [1.7.1] - 2022-02-22
### Changed
- Updated package dependencies.

## [1.7.0] - 2022-02-16
### Added
- Added the ability to specify a partner logo for each supported partner
- Remotely check if partner coupon looks valid

## [1.6.4] - 2022-01-25
### Changed
- Updated package dependencies.

## [1.6.3] - 2022-01-18
### Changed
- Updated package dependencies.

## [1.6.2] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## [1.6.1] - 2021-12-14
### Changed
- Updated package dependencies.

## [1.6.0] - 2021-11-30
### Added
- Addde partner coupon logic

## [1.5.7] - 2021-11-23
### Changed
- Updated package dependencies

## [1.5.6] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [1.5.5] - 2021-10-19
### Changed
- Updated package dependencies.

## [1.5.4] - 2021-10-12
### Changed
- Updated package dependencies

## [1.5.3] - 2021-09-28
### Changed
- Updated package dependencies.

## [1.5.2] - 2021-08-31
### Changed
- Run composer update on test-php command instead of phpunit.
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- update annotations versions.

## [1.5.1] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.5.0] - 2021-04-27
### Added
- Adds segmentation "from" parameter to the registration flow

## [1.4.3] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.4.2] - 2021-02-05

- CI: Make tests more generic

## [1.4.1] - 2021-01-20

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.4.0] - 2020-12-14

- Update dependency brain/monkey to v2.6.0
- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.3.1] - 2020-10-29

- Update dependency brain/monkey to v2.5.0
- Updated PHPCS: Packages and Debugger

## [1.3.0] - 2020-08-25

- Update Authorize URL iframe to include affiliate code
- Packages: Update filenames after #16810
- CI: Try collect js coverage
- Docker: Add package testing shortcut

## [1.2.0] - 2020-07-01

- Package Unit tests: update test file names to make sure they runs in Travis

## [1.1.0] - 2020-06-22

- PHPCS: Clean up the packages
- PHPCS Updates after WPCS 2.3
- Update README.md on partner package

## [1.0.1] - 2020-01-27

- Pin dependency brain/monkey to 2.4.0

## 1.0.0 - 2019-12-16

- Add partner subsidiary id to upgrade URLs.

[1.7.7]: https://github.com/Automattic/jetpack-partner/compare/v1.7.6...v1.7.7
[1.7.6]: https://github.com/Automattic/jetpack-partner/compare/v1.7.5...v1.7.6
[1.7.5]: https://github.com/Automattic/jetpack-partner/compare/v1.7.4...v1.7.5
[1.7.4]: https://github.com/Automattic/jetpack-partner/compare/v1.7.3...v1.7.4
[1.7.3]: https://github.com/Automattic/jetpack-partner/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/Automattic/jetpack-partner/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/Automattic/jetpack-partner/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/Automattic/jetpack-partner/compare/v1.6.4...v1.7.0
[1.6.4]: https://github.com/Automattic/jetpack-partner/compare/v1.6.3...v1.6.4
[1.6.3]: https://github.com/Automattic/jetpack-partner/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/Automattic/jetpack-partner/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/Automattic/jetpack-partner/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/Automattic/jetpack-partner/compare/v1.5.7...v1.6.0
[1.5.7]: https://github.com/Automattic/jetpack-partner/compare/v1.5.6...v1.5.7
[1.5.6]: https://github.com/Automattic/jetpack-partner/compare/v1.5.5...v1.5.6
[1.5.5]: https://github.com/Automattic/jetpack-partner/compare/v1.5.4...v1.5.5
[1.5.4]: https://github.com/Automattic/jetpack-partner/compare/v1.5.3...v1.5.4
[1.5.3]: https://github.com/Automattic/jetpack-partner/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/Automattic/jetpack-partner/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/Automattic/jetpack-partner/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-partner/compare/v1.4.3...v1.5.0
[1.4.3]: https://github.com/Automattic/jetpack-partner/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/Automattic/jetpack-partner/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/Automattic/jetpack-partner/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-partner/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Automattic/jetpack-partner/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-partner/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-partner/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-partner/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/Automattic/jetpack-partner/compare/v1.0.0...v1.0.1
