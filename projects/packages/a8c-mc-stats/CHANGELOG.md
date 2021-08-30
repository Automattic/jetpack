# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.5] - 2021-08-30
### Changed
- Run composer update on test-php command instead of phpunit
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- updated annotations versions

## [1.4.4] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.4.3] - 2021-04-08
### Changed
- Packaging and build changes, no change to the package itself.

## [1.4.2] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.4.1] - 2021-02-05

- CI: Make tests more generic

## [1.4.0] - 2021-01-20

- Add mirror-repo information to all current composer packages

## [1.3.0] - 2020-12-17

- Coverage Update whitelist for backend tests
- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.2.0] - 2020-09-17

## [1.1.1] - 2020-09-17

- a8c-mc-stats: Do not distribute test files

## [1.1.0] - 2020-08-13

- CI: Try collect js coverage

## 1.0.0 - 2020-07-27

- Creates the MC Stats package

[1.4.5]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-a8c-mc-stats/compare/v1.0.0...v1.1.0
