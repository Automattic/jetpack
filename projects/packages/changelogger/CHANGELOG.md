# Changelog
All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.2.2] - 2024-04-22
### Changed
- Internal updates.

## [4.2.1] - 2024-04-15
### Changed
- Support symfony/console 7.0. [#36861]

## [4.2.0] - 2024-04-11
### Deprecated
- Deprecated the `$subheading` parameter to `ChangelogEntry::getChangesBySubheading()` to make the return value clearer. [#36755]

## [4.1.2] - 2024-03-18
### Changed
- Internal updates.

## [4.1.1] - 2024-03-12
### Changed
- Internal updates.

## [4.1.0] - 2024-01-22
### Changed
- Default for `--deduplicate` is now 0, as 1 caused unexpected behavior for some cases and so should be opted in to. [#35138]

## [4.0.5] - 2023-12-11
### Changed
- Updated package dependencies. [#34492]

## [4.0.4] - 2023-11-30
### Changed
- Internal updates.

## [4.0.3] - 2023-11-24

## [4.0.2] - 2023-11-21
### Removed
- Removed `Utils::error_clear_last()`, the function can be called directly now. [#34222]

## [4.0.1] - 2023-11-21
### Added
- Added `symfony/*` v4.4 as an option, for use with PHP 7.1. [#34217]

### Removed
- Removed use of `wikimedia/at-ease` package as PHP 7 improved the behavior of `@`. [#34217]

## [4.0.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34126]

## [3.3.11] - 2023-09-28
### Changed
- Minor internal updates.

## [3.3.10] - 2023-09-25

- Minor internal updates.

## [3.3.9] - 2023-09-19

- Minor internal updates.

## [3.3.8] - 2023-08-23
### Changed
- Updated package dependencies. [#32605]

## [3.3.7] - 2023-07-17
### Added
- When omitting `--entry` for `changelogger add` in non-interactive mode for a patch-significance change, provide a hint on how to successfully create an empty entry. [#31630]

## [3.3.6] - 2023-07-10

- Minor internal updates.

## [3.3.5] - 2023-06-26

## [3.3.4] - 2023-05-22
### Added
- Set keywords to have `composer require` prompt for `--dev` on installation. [#30756]

## [3.3.3] - 2023-05-12

## [3.3.2] - 2023-02-20
### Changed
- Minor internal updates.

## [3.3.1] - 2023-01-11
### Changed
- Updated package dependencies.

## [3.3.0] - 2022-12-26
### Changed
- Support merge strategy for jetpack changelogger, assuming that merge commits contains the pr number in the merge commit with format (#{pr_number}) towards the end. [#27881]

## [3.2.3] - 2022-12-19
### Changed
- `Utils::loadChangeFile()` now throws a custom subclass of `RuntimeException` instead of `RuntimeException` itself. [#27949]

## [3.2.2] - 2022-12-02
### Changed
- Updated package dependencies. [#27688]

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

[4.2.2]: https://github.com/Automattic/jetpack-changelogger/compare/4.2.1...4.2.2
[4.2.1]: https://github.com/Automattic/jetpack-changelogger/compare/4.2.0...4.2.1
[4.2.0]: https://github.com/Automattic/jetpack-changelogger/compare/4.1.2...4.2.0
[4.1.2]: https://github.com/Automattic/jetpack-changelogger/compare/4.1.1...4.1.2
[4.1.1]: https://github.com/Automattic/jetpack-changelogger/compare/4.1.0...4.1.1
[4.1.0]: https://github.com/Automattic/jetpack-changelogger/compare/4.0.5...4.1.0
[4.0.5]: https://github.com/Automattic/jetpack-changelogger/compare/4.0.4...4.0.5
[4.0.4]: https://github.com/Automattic/jetpack-changelogger/compare/4.0.3...4.0.4
[4.0.3]: https://github.com/Automattic/jetpack-changelogger/compare/4.0.2...4.0.3
[4.0.2]: https://github.com/Automattic/jetpack-changelogger/compare/4.0.1...4.0.2
[4.0.1]: https://github.com/Automattic/jetpack-changelogger/compare/4.0.0...4.0.1
[4.0.0]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.11...4.0.0
[3.3.11]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.10...3.3.11
[3.3.10]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.9...3.3.10
[3.3.9]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.8...3.3.9
[3.3.8]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.7...3.3.8
[3.3.7]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.6...3.3.7
[3.3.6]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.5...3.3.6
[3.3.5]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.4...3.3.5
[3.3.4]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.3...3.3.4
[3.3.3]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.2...3.3.3
[3.3.2]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.1...3.3.2
[3.3.1]: https://github.com/Automattic/jetpack-changelogger/compare/3.3.0...3.3.1
[3.3.0]: https://github.com/Automattic/jetpack-changelogger/compare/3.2.3...3.3.0
[3.2.3]: https://github.com/Automattic/jetpack-changelogger/compare/3.2.2...3.2.3
[3.2.2]: https://github.com/Automattic/jetpack-changelogger/compare/3.2.1...3.2.2
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
