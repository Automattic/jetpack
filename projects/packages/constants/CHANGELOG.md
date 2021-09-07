# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.6] - 2021-08-30
### Changed
- Run composer update on test-php command instead of phpunit
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- Updated versions in annotations

## [1.6.5] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.6.4] - 2021-04-08
### Changed
- Packaging and build changes, no change to the package itself.

## [1.6.3] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.6.2] - 2021-02-05

- CI: Make tests more generic

## [1.6.1] - 2021-01-19

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.6.0] - 2020-12-14

- Update dependency brain/monkey to v2.6.0
- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.5.1] - 2020-10-28

- Updated PHPCS: Packages and Debugger

## [1.5.0] - 2020-08-13

- CI: Try collect js coverage
- Docker: Add package testing shortcut

## [1.4.0] - 2020-07-01

- Package Unit tests: update test file names to make sure they runs in Travis

## [1.3.0] - 2020-06-22

- PHPCS: Clean up the packages

## [1.2.0] - 2020-04-15

- Use jp.com redirect in all links
- Connection: add a filter for setting Jetpack api constants

## [1.1.3] - 2019-11-08

- Packages: Use classmap instead of PSR-4

## [1.1.2] - 2019-10-28

- Packages: Add gitattributes files to all packages that need th…

## [1.1.1] - 2019-09-20

- Docs: Unify usage of @package phpdoc tags

## [1.1.0] - 2019-09-14

## 1.0.0 - 2019-07-09

- Packages: Finish the constants package

[1.6.6]: https://github.com/Automattic/jetpack-constants/compare/v1.6.5...v1.6.6
[1.6.5]: https://github.com/Automattic/jetpack-constants/compare/v1.6.4...v1.6.5
[1.6.4]: https://github.com/Automattic/jetpack-constants/compare/v1.6.3...v1.6.4
[1.6.3]: https://github.com/Automattic/jetpack-constants/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/Automattic/jetpack-constants/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/Automattic/jetpack-constants/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/Automattic/jetpack-constants/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/Automattic/jetpack-constants/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-constants/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-constants/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-constants/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-constants/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/Automattic/jetpack-constants/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Automattic/jetpack-constants/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Automattic/jetpack-constants/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-constants/compare/v1.0.0...v1.1.0
