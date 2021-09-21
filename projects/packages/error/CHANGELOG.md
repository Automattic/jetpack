# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.6] - 2021-08-31
### Changed
- Run composer update on test-php command instead of phpunit.
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).

## [1.3.5] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.3.4] - 2021-04-27
### Changed
- Updated package dependencies.

## [1.3.3] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.3.2] - 2021-02-05

- CI: Make tests more generic

## [1.3.1] - 2021-01-19

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.3.0] - 2020-12-07

- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.2.0] - 2020-08-13

- CI: Try collect js coverage

## [1.1.0] - 2020-06-22

- PHPCS: Clean up the packages

## [1.0.4] - 2019-11-08

- Packages: Use classmap instead of PSR-4

## [1.0.2] - 2019-10-28

- Packages: Add gitattributes files to all packages that need th…

## [1.0.1] - 2019-09-20

- Docs: Unify usage of @package phpdoc tags

## 1.0.0 - 2019-09-14

- Packages: Introduce a jetpack-error package

[1.3.6]: https://github.com/Automattic/jetpack-error/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/Automattic/jetpack-error/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/Automattic/jetpack-error/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/Automattic/jetpack-error/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/Automattic/jetpack-error/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/Automattic/jetpack-error/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-error/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-error/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-error/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/Automattic/jetpack-error/compare/v1.0.2...v1.0.4
[1.0.2]: https://github.com/Automattic/jetpack-error/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-error/compare/v1.0.0...v1.0.1
