# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- Updated mediawiki/mediawiki-codesniffer to v38.
- Updated package dependencies.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [2.2.1] - 2021-08-26
### Added
- Composer alias for dev-master, to improve dependencies.
- Created a changelog from the git history with help from [auto-changelog](https://www.npmjs.com/package/auto-changelog). It could probably use cleanup!

### Changed
- Run composer update on test-php command instead of phpunit.
- Update package dependencies.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [2.2.0] - 2021-02-05

- CI: Make tests more generic
- codesniffer: Hack around mediawiki-codesniffer bug
- codesniffer: Update mediawiki-codesniffer dep to v35.0

## [2.1.1] - 2021-01-19

- Add mirror-repo information to all current composer packages
- Mirroring: Preserve file permissions by uploading a .tar.xz as the build artifact
- Monorepo: Reorganize all projects
- Various PHPCS and Cleanup
- Codesniffer: Unpin composer deps

## [2.1.0] - 2020-12-14

- Update dependency dealerdirect/phpcodesniffer-composer-installer to v0.7.1
- Codesniffer: Update mediawiki/mediawiki-codesniffer dependency
- CI Pipeline: Refactor CI pipeline files
- Update dependency sirbrillig/phpcs-variable-analysis to v2.10.0
- Pin dependencies
- Packages: Update for PHP 8 testing

## [2.0.0] - 2020-11-06

- Codesniffer: Fix code coverage generation hang due to Generic.PHP.Syntax sniff
- Update dependency mediawiki/mediawiki-codesniffer to v33
- Updated PHPCS: Packages and Debugger
- Import several phpcs sniffs from MediaWiki

## [1.1.0] - 2020-10-26

- Pin dependency dealerdirect/phpcodesniffer-composer-installer to 0.7.0

## 1.0.0 - 2020-10-19

- Codesniffer: Add a package to hold our coding standard

[2.3.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v1.0.0...v1.1.0
