# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2024-02-07
### Added
- Add "Jetpack-NoWP" ruleset. [#33287]
- Added rulesets `Jetpack-Compat-*` to disable PHPCompatibility rules that trigger with `testVersion` 5.6 but don't apply to various later PHP versions. [#31711]
- Add `Jetpack-Compat-83` ruleset. [#34346]
- Add `Jetpack-Compat-NoWP` ruleset. [#33287]
- Declare requirement of PHP >= 7.4. [#34192]
- Enable `MediaWiki.AlternativeSyntax.UnicodeEscape` sniff. [#34194]
- Enable `MediaWiki.PHPUnit.MockBoilerplate` sniff. [#34338]
- Enable `Modernize.FunctionCalls.Dirname.Nested` sniff that is currently being disabled by WordPress-Extra. [#34218]

### Changed
- BREAKING: Drop support for PHP 5.6. `testVersion` should be set to `7.0-`. [#34126]
- Updated package dependencies. [#31609]
- Updated package dependencies. [#32605]
- Updated package dependencies. [#34338]
- Update to WordPress-Coding-Standards 3.0. [#32608]
- Update `Jetpack-Compat-*` rulesets against PHPCompatibility develop branch. [#33112]

### Removed
- Exclude new `WordPress.Security.EscapeOutput.ExceptionNotEscaped` sniff. https://core.trac.wordpress.org/ticket/59282 is the correct way to fix the underlying issue it's trying to avoid, this would cause other problems. [#32608]
- Remove `MediaWiki.WhiteSpace.SpaceAfterClosure`, as `Squiz.Functions.MultiLineFunctionDeclaration` now catches the same thing and more. [#32608]

## [2.8.0] - 2023-06-06
### Added
- Added MediaWiki.Usage.ForbiddenFunctions rule to use preferred functions
- Set keywords to have `composer require` prompt for `--dev` on installation.

### Changed
- Updated package dependencies.

## [2.7.0] - 2023-01-11
### Added
- Add `MediaWiki.WhiteSpace.EmptyLinesBetweenUse` sniff.

### Changed
- Updated to a newer snapshot of WordPress-Coding-Standards, which adds a number of new sniffs.

### Fixed
- Rolled back a dependency update that caused breaking changes in Jetpack trunk.

## [2.6.1] - 2022-11-01
### Changed
- Updated package dependencies.

## [2.6.0] - 2022-07-06
### Added
- Added lint to ensure httponly is set (or intentionally ignored) on setcookie. [#24418]
- Import rules from `WordPress` instead of `WordPress-Core`, `WordPress-Docs`, and `WordPress-Extra` individually. This adds two new rules. [#23932]

### Changed
- Renaming master to trunk. [#24661]
- Rulesets: allow the use of lowercase WordPress. [#24363]
- Updated package dependencies.

### Fixed
- Detect classes like `WP_Test_.*_Case` as test case base classes too. [#24027]

## [2.5.0] - 2022-04-05
### Added
- Add sniff to disallow relative file includes.
- Removed requirement for an ending character on inline comments and enabled MediaWiki.Usage.IsNull

### Changed
- Adjust deps on dev-develop of wp-coding-standards/wpcs to not require users install it.

### Removed
- Yoda conditional checks are no longer enforced.

### Fixed
- Fixed minor coding standard violation.
- Resync PHPUnitTestTrait hack and have it detect "Testcase" in addition to "TestCase".
- Update `wp-coding-standards/wpcs` to `dev-develop`. They haven't done a release in over a year, and we need fixes for errors in PHP 8.0 and 8.1.

## [2.4.0] - 2022-02-01
### Added
- Add a sniff to check the textdomain passed to `Assets::register_script()`.

### Changed
- Disable CI tests on 8.1, PHPCompatibility raises deprecation warnings.
- Reconfigure phpcs so we don't need so many `phpcs:ignore` comments.
- Switch to pcov for code coverage.
- Updated package dependencies

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

[3.0.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.8.0...v3.0.0
[2.8.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.7.0...v2.8.0
[2.7.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.6.1...v2.7.0
[2.6.1]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/Automattic/jetpack-codesniffer/compare/v1.0.0...v1.1.0
