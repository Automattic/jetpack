# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies
- Updated package textdomain from `jetpack` to `jetpack-backup-pkg`.

## [1.1.11] - 2021-12-14
### Changed
- Updated package dependencies.

## [1.1.10] - 2021-11-30
### Changed
- Updated package dependencies.

## [1.1.9] - 2021-11-23
### Changed
- Updated package dependencies.

## [1.1.8] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [1.1.7] - 2021-10-26
### Changed
- Updated package dependencies.

## [1.1.6] - 2021-10-13
### Changed
- Updated package dependencies.

## [1.1.5] - 2021-10-12
### Changed
- Updated package dependencies

## [1.1.4] - 2021-09-28
### Fixed
- Register WP hooks even if WP isn't loaded yet.

## [1.1.3] - 2021-08-31
### Changed
- Bump changelogger version
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- Updated package dependencies.

## [1.1.2] - 2021-08-12
### Added
- Add package version tracking.

## [1.1.1] - 2021-07-27
### Added
- Add a package version constant.

### Changed
- Updated package dependencies.

## [1.1.0] - 2021-06-29
### Added
- Add backup-helper-script endpoints under the jetpack/v4 namespace.
- Add backup real time endpoints.

## [1.0.6] - 2021-05-25
### Changed
- Updated package dependencies.

## [1.0.5] - 2021-04-27
### Changed
- Updated package dependencies.

## [1.0.4] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

## [1.0.3] - 2021-01-19

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.0.2] - 2019-11-08

- Packages: Use classmap instead of PSR-4

## 1.0.0 - 2019-10-29

- Add API endpoints and Jetpack Backup package for managing Help…

[1.2.0]: https://github.com/Automattic/jetpack-backup/compare/v1.1.11...v1.2.0
[1.1.11]: https://github.com/Automattic/jetpack-backup/compare/v1.1.10...v1.1.11
[1.1.10]: https://github.com/Automattic/jetpack-backup/compare/v1.1.9...v1.1.10
[1.1.9]: https://github.com/Automattic/jetpack-backup/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/Automattic/jetpack-backup/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/Automattic/jetpack-backup/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/Automattic/jetpack-backup/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/Automattic/jetpack-backup/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/Automattic/jetpack-backup/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/Automattic/jetpack-backup/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Automattic/jetpack-backup/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Automattic/jetpack-backup/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-backup/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/Automattic/jetpack-backup/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/Automattic/jetpack-backup/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Automattic/jetpack-backup/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Automattic/jetpack-backup/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Automattic/jetpack-backup/compare/v1.0.0...v1.0.2
