# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.9] - 2025-03-31
### Changed
- Internal updates.

## [3.0.8] - 2025-03-24
### Changed
- Internal updates.

## [3.0.7] - 2025-03-18
### Changed
- Internal updates.

## [3.0.6] - 2025-03-17
### Changed
- Internal updates.

## [3.0.5] - 2025-03-12
### Changed
- Internal updates.

## [3.0.4] - 2025-03-10
### Changed
- Internal updates.

## [3.0.3] - 2025-02-24
### Changed
- Update dependencies.

## [3.0.2] - 2025-02-03
### Changed
- Internal updates.

## [3.0.1] - 2024-11-25
### Changed
- Updated dependencies. [#40286]
- Updated package dependencies. [#40258]

## [3.0.0] - 2024-11-18
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [2.0.7] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [2.0.6] - 2024-09-16
### Changed
- Blocks: Determine block names from filename convention instead of disk access [#39329]

## [2.0.5] - 2024-08-23
### Changed
- Updated package dependencies. [#39004]

## [2.0.4] - 2024-05-20
### Changed
- Internal updates.

## [2.0.3] - 2024-04-22
### Changed
- Internal updates.

## [2.0.2] - 2024-04-08
### Changed
- Internal updates.

## [2.0.1] - 2024-03-18
### Changed
- Internal updates.

## [2.0.0] - 2023-11-20
### Changed
- Replaced usage of strpos() with str_starts_with(). [#34135]
- Updated required PHP version to >= 7.0. [#34192]

## [1.6.2] - 2023-10-23
### Fixed
- Fix missing block translations. [#33546]

## [1.6.1] - 2023-09-26
### Fixed
- Fix erroneous path check in Blocks class [#33318]

## [1.6.0] - 2023-09-19
### Added
- Add function to get path to block metadata file [#32698]
- Helper to get a block's feature name [#32815]

## [1.5.0] - 2023-09-11
### Added
- Enable block registration by specifying block.json path [#32697]

## [1.4.23] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [1.4.22] - 2023-05-29
### Changed
- FSE: remove usage of `gutenberg_is_fse_theme` for modern `wp_is_block_theme` [#30806]

## [1.4.21] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [1.4.20] - 2023-02-20
### Changed
- Minor internal updates.

## [1.4.19] - 2023-01-11
### Changed
- Updated package dependencies.

## [1.4.18] - 2022-12-06
### Changed
- Updated package dependencies. [#27688]

## [1.4.17] - 2022-11-28
### Changed
- Updated package dependencies. [#27043]

## [1.4.16] - 2022-09-20
### Changed
- Updated package dependencies.

## [1.4.15] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [1.4.14] - 2022-06-21
### Changed
- Renaming master to trunk. [#24661]

## [1.4.13] - 2022-06-08
### Fixed
- Update method checking for block-based themes to use latest core function. [#24622]

## [1.4.12] - 2022-04-26
### Changed
- Updated package dependencies.

## [1.4.11] - 2022-01-25
### Changed
- Updated package dependencies.

## [1.4.10] - 2022-01-18
### Changed
- Updated package dependencies.

## [1.4.9] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## [1.4.8] - 2021-12-14
### Changed
- Updated package dependencies.

## [1.4.7] - 2021-11-23
### Changed
- Updated package dependencies

## [1.4.6] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [1.4.5] - 2021-10-19
### Changed
- Updated package dependencies.

## [1.4.4] - 2021-10-12
### Changed
- Updated package dependencies

## [1.4.3] - 2021-09-28
### Changed
- Updated package dependencies.

## [1.4.2] - 2021-08-31
### Changed
- Run composer update on test-php command instead of phpunit.
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- Update annotations versions.

## [1.4.1] - 2021-06-29
### Changed
- Update docs to replace yarn with pnpm.

## [1.4.0] - 2021-05-12
### Added
- Add helper method to determine if the current theme is an FSE/Site editor theme.
- Adds an attribute to paid blocks to support hiding nested upgrade nudges on the frontend.

### Changed
- Updated package dependencies.

## [1.3.0] - 2021-03-22
### Added
- Composer alias for dev-master, to improve dependencies
- Enable GitHub action for auto-tagging releases from monorepo pushes.

### Changed
- Update package dependencies.

### Fixed
- Add editor style dependency when registering Jetpack blocks to ensure support for the new site editor.
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.2.2] - 2021-02-05

- CI: Make tests more generic

## [1.2.1] - 2021-01-20

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.2.0] - 2020-12-07

- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.1.1] - 2020-11-13

- Codecoverage: fix reports
- Updated PHPCS: Packages and Debugger

## [1.1.0] - 2020-09-25

- Blocks: add block registration to package

## 1.0.0 - 2020-09-17

- Blocks: introduce new package for block management

[3.0.9]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.8...v3.0.9
[3.0.8]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.7...v3.0.8
[3.0.7]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.6...v3.0.7
[3.0.6]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.5...v3.0.6
[3.0.5]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.4...v3.0.5
[3.0.4]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.3...v3.0.4
[3.0.3]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/Automattic/jetpack-blocks/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/Automattic/jetpack-blocks/compare/v2.0.7...v3.0.0
[2.0.7]: https://github.com/Automattic/jetpack-blocks/compare/v2.0.6...v2.0.7
[2.0.6]: https://github.com/Automattic/jetpack-blocks/compare/v2.0.5...v2.0.6
[2.0.5]: https://github.com/Automattic/jetpack-blocks/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/Automattic/jetpack-blocks/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/Automattic/jetpack-blocks/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/Automattic/jetpack-blocks/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Automattic/jetpack-blocks/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.6.2...v2.0.0
[1.6.2]: https://github.com/Automattic/jetpack-blocks/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/Automattic/jetpack-blocks/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.23...v1.5.0
[1.4.23]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.22...v1.4.23
[1.4.22]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.21...v1.4.22
[1.4.21]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.20...v1.4.21
[1.4.20]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.19...v1.4.20
[1.4.19]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.18...v1.4.19
[1.4.18]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.17...v1.4.18
[1.4.17]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.16...v1.4.17
[1.4.16]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.15...v1.4.16
[1.4.15]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.14...v1.4.15
[1.4.14]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.13...v1.4.14
[1.4.13]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.12...v1.4.13
[1.4.12]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.11...v1.4.12
[1.4.11]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.10...v1.4.11
[1.4.10]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.9...v1.4.10
[1.4.9]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.8...v1.4.9
[1.4.8]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.7...v1.4.8
[1.4.7]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.6...v1.4.7
[1.4.6]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.5...v1.4.6
[1.4.5]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/Automattic/jetpack-blocks/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Automattic/jetpack-blocks/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-blocks/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.0.0...v1.1.0
