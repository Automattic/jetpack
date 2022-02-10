# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.10.0] - 2022-01-25
### Added
- Added Visitor class for status regarding the site visitor.

## [1.9.5] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## [1.9.4] - 2021-12-14
### Changed
- Updated package dependencies.

## [1.9.3] - 2021-11-22
### Changed
- Updated package dependencies

## [1.9.2] - 2021-11-16
### Changed
- Add a function_exists check before calling wp_get_environment_type

## [1.9.1] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [1.9.0] - 2021-10-26
### Added
- Added Host class for reporting known hosting environment information.

## [1.8.4] - 2021-10-13
### Changed
- Updated package dependencies.

## [1.8.3] - 2021-10-12
### Changed
- Updated package dependencies

## [1.8.2] - 2021-09-28
### Changed
- Updated package dependencies.

## [1.8.1] - 2021-08-30
### Changed
- Run composer update on test-php command instead of phpunit
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- update annotations versions

## [1.8.0] - 2021-06-15
### Changed
- Update callback to Jetpack to new Identity_Crisis class.

## [1.7.6] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.7.5] - 2021-04-27
### Deprecated
- Deprecates is_no_user_testing_mode

## [1.7.4] - 2021-04-08
### Changed
- Packaging and build changes, no change to the package itself.

## [1.7.3] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.7.2] - 2021-02-05

- CI: Make tests more generic

## [1.7.1] - 2021-01-20

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.7.0] - 2020-12-14

- Update dependency brain/monkey to v2.6.0
- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.6.0] - 2020-11-23

- Status: Introduce get_site_suffix method
- Status: Fix test failure
- Status: Improve the staging site detection
- General: update minimum required version to WordPress 5.5
- Add the no_user_testing mode
- Status: Add a couple of test cases for staging site detection
- Update dependency brain/monkey to v2.5.0
- Updated PHPCS: Packages and Debugger

## [1.5.0] - 2020-10-13

- Also use Core `wp_get_environment_type` for local

## [1.4.0] - 2020-08-13

- CI: Try collect js coverage

## [1.3.0] - 2020-07-28

- Core Compat: Site Environment

## [1.2.0] - 2020-06-22

- PHPCS: Clean up the packages
- Staging Sites: add newspack staging to the list of known providers

## [1.1.1] - 2020-01-27

- Pin dependency brain/monkey to 2.4.0

## [1.1.0] - 2020-01-14

- Packages: Various improvements for wp.com or self-contained consumers

## [1.0.4] - 2019-11-08

- Packages: Use classmap instead of PSR-4

## [1.0.3] - 2019-10-28

- Packages: Add gitattributes files to all packages that need th…

## [1.0.2] - 2019-10-23

- Use spread operator instead of func_get_args

## [1.0.1] - 2019-09-20

- Docs: Unify usage of @package phpdoc tags

## 1.0.0 - 2019-09-14

- Packages: Introduce a status package

[1.10.0]: https://github.com/Automattic/jetpack-status/compare/v1.9.5...v1.10.0
[1.9.5]: https://github.com/Automattic/jetpack-status/compare/v1.9.4...v1.9.5
[1.9.4]: https://github.com/Automattic/jetpack-status/compare/v1.9.3...v1.9.4
[1.9.3]: https://github.com/Automattic/jetpack-status/compare/v1.9.2...v1.9.3
[1.9.2]: https://github.com/Automattic/jetpack-status/compare/v1.9.1...v1.9.2
[1.9.1]: https://github.com/Automattic/jetpack-status/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/Automattic/jetpack-status/compare/v1.8.4...v1.9.0
[1.8.4]: https://github.com/Automattic/jetpack-status/compare/v1.8.3...v1.8.4
[1.8.3]: https://github.com/Automattic/jetpack-status/compare/v1.8.2...v1.8.3
[1.8.2]: https://github.com/Automattic/jetpack-status/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/Automattic/jetpack-status/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/Automattic/jetpack-status/compare/v1.7.6...v1.8.0
[1.7.6]: https://github.com/Automattic/jetpack-status/compare/v1.7.5...v1.7.6
[1.7.5]: https://github.com/Automattic/jetpack-status/compare/v1.7.4...v1.7.5
[1.7.4]: https://github.com/Automattic/jetpack-status/compare/v1.7.3...v1.7.4
[1.7.3]: https://github.com/Automattic/jetpack-status/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/Automattic/jetpack-status/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/Automattic/jetpack-status/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/Automattic/jetpack-status/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Automattic/jetpack-status/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Automattic/jetpack-status/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-status/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-status/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-status/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-status/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-status/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/Automattic/jetpack-status/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Automattic/jetpack-status/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Automattic/jetpack-status/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-status/compare/v1.0.0...v1.0.1
