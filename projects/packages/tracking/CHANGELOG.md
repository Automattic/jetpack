# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.13.17] - 2021-11-22
### Changed
- Updated package dependencies

## [1.13.16] - 2021-11-16
### Changed
- Updated package dependencies.

## [1.13.15] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [1.13.14] - 2021-10-26
### Changed
- Updated package dependencies.

## [1.13.13] - 2021-10-13
### Changed
- Updated package dependencies.

## [1.13.12] - 2021-10-12
### Changed
- Updated package dependencies

## [1.13.11] - 2021-09-30
### Added
- Set up the ajax hook in the Tracking class.

## [1.13.10] - 2021-09-28
### Changed
- Updated package dependencies.

## [1.13.9] - 2021-08-30
### Changed
- Run composer update on test-php command instead of phpunit
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- update annotations versions

## [1.13.8] - 2021-08-10
### Added
- adding Readme to the tracking package

## [1.13.7] - 2021-06-15
### Changed
- Updated package dependencies.

## [1.13.6] - 2021-05-25
### Added
- Adding the tracks-callables.js file to the Tracking package.

## [1.13.5] - 2021-04-27
### Changed
- Updated package dependencies.

## [1.13.4] - 2021-04-08
### Changed
- Packaging and build changes, no change to the package itself.

## [1.13.3] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.13.2] - 2021-02-23

- CI: Make tests more generic
- Jetpack: Normalize package names

## [1.13.1] - 2021-01-28

- Update dependencies to latest stable

## [1.13.0] - 2021-01-26

- Tracking: remove dependency to the Jetpack plugin
- Add mirror-repo information to all current composer packages
- Tracking: get connected user data from Connection package
- Monorepo: Reorganize all projects

## [1.12.0] - 2021-01-05

- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.11.1] - 2020-11-24

- Version packages for release

## [1.11.0] - 2020-10-27

- Updated dependencies to latest stable

## [1.10.0] - 2020-09-29

- Packages: update list of files distributed in production packages
- Tracking: fix the logic for determining when to enable tracking.

## [1.9.1] - 2020-09-09

- Tracking: fix the logic for determining when to enable tracking.

## [1.9.0] - 2020-08-26

- Tracking: Add the connection check.

## [1.8.2] - 2020-08-10

- Update dependencies to latest stable

## [1.8.1] - 2020-08-10

- Update dependencies to latest stable

## [1.8.0] - 2020-07-28

- Update dependencies to latest stable

## [1.7.2] - 2020-07-06

- Update dependencies to latest stable

## [1.7.1] - 2020-07-01

- Update dependencies to latest stable

## [1.7.0] - 2020-06-30

- Various: Update use of whitelist/blacklist

## [1.6.1] - 2020-06-01

- Update dependencies to latest stable

## [1.6.0] - 2020-05-26

- Update dependencies to latest stable

## [1.5.0] - 2020-04-28

- Update dependencies to latest stable

## [1.4.0] - 2020-03-31

- Update dependencies to latest stable

## [1.3.0] - 2020-03-31

- Update dependencies to latest stable

## [1.2.2] - 2019-11-08

- Packages: Use classmap instead of PSR-4

## [1.2.1] - 2019-10-29

- PHPCS: Rest of the packages

## [1.2.0] - 2019-10-25

- Update/Use the new Terms of Service package in Jetpack

## [1.1.1] - 2019-10-16

- Tracks: use filter instead of relying on Jetpack class

## [1.1.0] - 2019-10-11

- Tracks: Don't track users in dev mode or when opted out

## [1.0.2] - 2019-10-07

- Update dependency phpcompatibility/phpcompatibility-wp to v2.1.0

## [1.0.1] - 2019-09-20

- Docs: Unify usage of @package phpdoc tags

## 1.0.0 - 2019-09-14

- Create package for Jetpack Tracking

[1.13.17]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.16...v1.13.17
[1.13.16]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.15...v1.13.16
[1.13.15]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.14...v1.13.15
[1.13.14]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.13...v1.13.14
[1.13.13]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.12...v1.13.13
[1.13.12]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.11...v1.13.12
[1.13.11]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.10...v1.13.11
[1.13.10]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.9...v1.13.10
[1.13.9]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.8...v1.13.9
[1.13.8]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.7...v1.13.8
[1.13.7]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.6...v1.13.7
[1.13.6]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.5...v1.13.6
[1.13.5]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.4...v1.13.5
[1.13.4]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.3...v1.13.4
[1.13.3]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.2...v1.13.3
[1.13.2]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.1...v1.13.2
[1.13.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.13.0...v1.13.1
[1.13.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.11.1...v1.12.0
[1.11.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.11.0...v1.11.1
[1.11.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.9.1...v1.10.0
[1.9.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.8.2...v1.9.0
[1.8.2]: https://github.com/Automattic/jetpack-tracking/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.7.2...v1.8.0
[1.7.2]: https://github.com/Automattic/jetpack-tracking/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Automattic/jetpack-tracking/compare/1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.3.0...1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/Automattic/jetpack-tracking/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-tracking/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/Automattic/jetpack-tracking/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-tracking/compare/v1.0.0...v1.0.1
