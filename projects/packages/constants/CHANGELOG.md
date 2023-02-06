# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.20] - 2022-12-02
### Changed
- Updated package dependencies. [#27688]

## [1.6.19] - 2022-11-22
### Changed
- Updated package dependencies. [#27043]

## [1.6.18] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [1.6.17] - 2022-06-21
### Changed
- Renaming master to trunk.

## [1.6.16] - 2022-04-26
### Changed
- Updated package dependencies.

## [1.6.15] - 2022-01-25
### Changed
- Updated package dependencies.

## [1.6.14] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## [1.6.13] - 2021-12-14
### Changed
- Updated package dependencies.

## [1.6.12] - 2021-11-22
### Changed
- Updated package dependencies

## [1.6.11] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [1.6.10] - 2021-10-26
### Fixed
- Updated is_true docblock to be more accurate.

## [1.6.9] - 2021-10-13
### Changed
- Updated package dependencies.

## [1.6.8] - 2021-10-06
### Changed
- Updated package dependencies

## [1.6.7] - 2021-09-28
### Changed
- Updated package dependencies.

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

[1.6.20]: https://github.com/Automattic/jetpack-constants/compare/v1.6.19...v1.6.20
[1.6.19]: https://github.com/Automattic/jetpack-constants/compare/v1.6.18...v1.6.19
[1.6.18]: https://github.com/Automattic/jetpack-constants/compare/v1.6.17...v1.6.18
[1.6.17]: https://github.com/Automattic/jetpack-constants/compare/v1.6.16...v1.6.17
[1.6.16]: https://github.com/Automattic/jetpack-constants/compare/v1.6.15...v1.6.16
[1.6.15]: https://github.com/Automattic/jetpack-constants/compare/v1.6.14...v1.6.15
[1.6.14]: https://github.com/Automattic/jetpack-constants/compare/v1.6.13...v1.6.14
[1.6.13]: https://github.com/Automattic/jetpack-constants/compare/v1.6.12...v1.6.13
[1.6.12]: https://github.com/Automattic/jetpack-constants/compare/v1.6.11...v1.6.12
[1.6.11]: https://github.com/Automattic/jetpack-constants/compare/v1.6.10...v1.6.11
[1.6.10]: https://github.com/Automattic/jetpack-constants/compare/v1.6.9...v1.6.10
[1.6.9]: https://github.com/Automattic/jetpack-constants/compare/v1.6.8...v1.6.9
[1.6.8]: https://github.com/Automattic/jetpack-constants/compare/v1.6.7...v1.6.8
[1.6.7]: https://github.com/Automattic/jetpack-constants/compare/v1.6.6...v1.6.7
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
