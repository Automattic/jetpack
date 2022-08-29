# Changelog
All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.1] - 2022-08-26

## [3.2.0] - 2022-07-26
### Added
- Added support for Symfony 6. [#25158]

## [3.1.3] - 2022-06-21
### Changed
- Renaming `master` references to `trunk` in tests.

## [3.1.2] - 2022-06-14
### Added
- Recognize more branch names as non-feature-branches. [#24689]

## [3.1.1] - 2022-05-18
### Fixed
- Fix new PHPCS sniffs. [#24366]

## [3.1.0] - 2022-04-26
### Added
- Add 'write' command option 'add-pr-num' for adding GH PR numbers to entries.

## [3.0.9] - 2022-04-05
### Added
- Adds additional context to the Heading seems to have a linked... error.

### Fixed
- Deduplicate input entries. Even when `--deduplicate=0`. This may be disabled by setting `--deduplicate=-1`.

## [3.0.8] - 2022-03-23
### Changed
- Updated package dependencies.

## [3.0.7] - 2022-02-09
### Fixed
- Fixed some new PHPCS warnings.

## [3.0.6] - 2022-01-25
### Changed
- Updated package dependencies.

## [3.0.5] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## [3.0.4] - 2021-12-20
### Changed
- Reconfigure phpcs so we don't need so many `phpcs:ignore` comments.

## [3.0.3] - 2021-11-17
### Changed
- Removed internal special case for Changelogger itself. Only applicable for development.

## [3.0.2] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

### Fixed
- Adjust for PHP 8.1 compatibility.

## [3.0.1] - 2021-10-19
### Fixed
- Fix the situation where the current is "1.2.3-beta" and we're looking at the dev branch towards the -alpha following the 1.2.3 release, it shouldn't ignore significances.

## [3.0.0] - 2021-10-13
### Changed
- BREAKING: `VersioningPlugin::normalizeVersion` now takes an `$extra` parameter.
- Changed version number format for Atomic releases.

### Fixed
- Fixed handling of `changelogger version next` when the current version is a prerelease.

## [2.0.1] - 2021-10-06
### Changed
- Updated package dependencies

## [2.0.0] - 2021-09-28
### Added
- Add `squash` command.

### Changed
- BREAKING: Added method `parseVersion` to `VersioningPlugin` interface. Any versioning plugins must implement this method.
- Update available WordPress version types

## [1.2.1] - 2021-08-30
### Changed
- Run composer update on test-php command instead of phpunit
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).

## [1.2.0] - 2021-05-12
### Added
- New option, `--filename-auto-suffix`, to ensure that a reused branch won't prevent entry creation in non-interactive mode.

### Deprecated
- Changelogger `Config::setOutput()` is no longer needed. Config will throw a ConfigException instead of printing an error.

### Fixed
- If composer.json is not present in the current directory, check parents and ask if the parent should be used (like composer does).

## [1.1.2] - 2021-04-08
### Fixed
- Don't insert extra newlines if a subsection has no non-empty entries.

## [1.1.1] - 2021-03-30
### Changed
- Build infrastructure changes, nothing affecting the package itself.

## [1.1.0] - 2021-03-22
### Added
- Allow "unreleased" as the date for a changelog entry.
- Enable GitHub action for auto-tagging releases from monorepo pushes.

### Changed
- Branch-alias dev-master rather than dev-monorepo, as we're removing the hack.

### Fixed
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## 1.0.0 - 2021-03-08
### Added
- Initial version.

[3.2.1]: https://github.com/Automattic/jetpack-changelogger/compare/3.2.0...3.2.1
[3.2.0]: https://github.com/Automattic/jetpack-changelogger/compare/3.1.3...3.2.0
[3.1.3]: https://github.com/Automattic/jetpack-changelogger/compare/3.1.2...3.1.3
[3.1.2]: https://github.com/Automattic/jetpack-changelogger/compare/3.1.1...3.1.2
[3.1.1]: https://github.com/Automattic/jetpack-changelogger/compare/3.1.0...3.1.1
[3.1.0]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.9...3.1.0
[3.0.9]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.8...3.0.9
[3.0.8]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.7...3.0.8
[3.0.7]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.6...3.0.7
[3.0.6]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.5...3.0.6
[3.0.5]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.4...3.0.5
[3.0.4]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.3...3.0.4
[3.0.3]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.2...3.0.3
[3.0.2]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.1...3.0.2
[3.0.1]: https://github.com/Automattic/jetpack-changelogger/compare/3.0.0...3.0.1
[3.0.0]: https://github.com/Automattic/jetpack-changelogger/compare/2.0.1...3.0.0
[2.0.1]: https://github.com/Automattic/jetpack-changelogger/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/Automattic/jetpack-changelogger/compare/1.2.1...2.0.0
[1.2.1]: https://github.com/Automattic/jetpack-changelogger/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-changelogger/compare/1.1.2...1.2.0
[1.1.2]: https://github.com/Automattic/jetpack-changelogger/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/Automattic/jetpack-changelogger/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-changelogger/compare/1.0.0...1.1.0
