# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.7] - 2021-11-22
### Changed
- Updated package dependencies

## [1.7.6] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [1.7.5] - 2021-10-26
### Changed
- Updated package dependencies.

## [1.7.4] - 2021-10-13
### Changed
- Updated package dependencies.

## [1.7.3] - 2021-10-12
### Changed
- Updated package dependencies

## [1.7.2] - 2021-09-28
### Changed
- Updated package dependencies.

## [1.7.1] - 2021-08-30
### Changed
- Run composer update on test-php command instead of phpunit
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).

## [1.7.0] - 2021-06-29
### Changed
- Allow any argument to be passed.
- Improve documentation.

## [1.6.1] - 2021-06-15
### Changed
- Updated package dependencies.

## [1.6.0] - 2021-05-25
### Removed
- Removed filter from the final Redirect URL

## [1.5.5] - 2021-04-27
### Changed
- Updated package dependencies.

## [1.5.4] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.
- Userless Connection: Redirect "userless" users to the "Plans" page

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.5.3] - 2021-02-23

- CI: Make tests more generic

## [1.5.2] - 2021-01-26

- Update dependencies to latest stable

## [1.5.1] - 2021-01-26

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.5.0] - 2021-01-05

- Update dependency brain/monkey to v2.6.0
- Pin dependencies
- Packages: Update for PHP 8 testing
- Pin dependency brain/monkey to 2.5.0

## [1.4.1] - 2020-11-24

- Status: Introduce get_site_suffix method

## [1.4.0] - 2020-10-27

- Masterbar: Add Admin Menu endpoint

## [1.3.0] - 2020-08-14

- Packages: Update filenames after #16810
- CI: Try collect js coverage
- Docker: Add package testing shortcut

## [1.2.0] - 2020-06-16

- Add a trailing / to jetpack.com/redirect URLs.

## [1.1.0] - 2020-05-22

- add filter to Redirect::get_url

## 1.0.0 - 2020-04-24

- Create Jetpack Redirect package

[1.7.7]: https://github.com/Automattic/jetpack-redirect/compare/v1.7.6...v1.7.7
[1.7.6]: https://github.com/Automattic/jetpack-redirect/compare/v1.7.5...v1.7.6
[1.7.5]: https://github.com/Automattic/jetpack-redirect/compare/v1.7.4...v1.7.5
[1.7.4]: https://github.com/Automattic/jetpack-redirect/compare/v1.7.3...v1.7.4
[1.7.3]: https://github.com/Automattic/jetpack-redirect/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/Automattic/jetpack-redirect/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/Automattic/jetpack-redirect/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/Automattic/jetpack-redirect/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/Automattic/jetpack-redirect/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/Automattic/jetpack-redirect/compare/v1.5.5...v1.6.0
[1.5.5]: https://github.com/Automattic/jetpack-redirect/compare/v1.5.4...v1.5.5
[1.5.4]: https://github.com/Automattic/jetpack-redirect/compare/v1.5.3...v1.5.4
[1.5.3]: https://github.com/Automattic/jetpack-redirect/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/Automattic/jetpack-redirect/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/Automattic/jetpack-redirect/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-redirect/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/Automattic/jetpack-redirect/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-redirect/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-redirect/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-redirect/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-redirect/compare/v1.0.0...v1.1.0
