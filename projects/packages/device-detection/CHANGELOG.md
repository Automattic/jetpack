# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.4.1] - 2021-04-27
### Changed
- Updated package dependencies.

## [1.4.0] - 2021-03-30
### Added
- Added Opera Desktop detection
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

## [1.3.0] - 2020-12-09

- Codesniffer: Update mediawiki/mediawiki-codesniffer dependency
- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.2.1] - 2020-11-10

- Improve PHP 8 compatibility
- Updated PHPCS: Packages and Debugger

## [1.2.0] - 2020-10-19

- Replaced intval() with (int) as part of issue #17432.

## [1.1.0] - 2020-08-13

- CI: Try collect js coverage

## 1.0.0 - 2020-06-25

- Moving jetpack_is_mobile into a package

[1.4.2]: https://github.com/Automattic/jetpack-device-detection/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/Automattic/jetpack-device-detection/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-device-detection/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/Automattic/jetpack-device-detection/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/Automattic/jetpack-device-detection/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-device-detection/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/Automattic/jetpack-device-detection/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-device-detection/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-device-detection/compare/v1.0.0...v1.1.0
