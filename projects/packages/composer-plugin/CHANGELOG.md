# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.2] - 2025-03-05
### Changed
- Internal updates.

## [4.0.1] - 2025-02-24
### Changed
- Update dependencies.

## [4.0.0] - 2024-11-25
### Removed
- Drop support for Composer <2.2. [#40297]

## [3.0.0] - 2024-11-14
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [2.0.4] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [2.0.3] - 2024-08-26
### Changed
- Updated package dependencies. [#39004]

## [2.0.2] - 2024-06-03
### Changed
- Internal updates.

## [2.0.1] - 2024-03-14
### Changed
- Internal updates.

## [2.0.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [1.1.14] - 2023-09-19

- Minor internal updates.

## [1.1.13] - 2023-08-23
### Changed
- Updated package dependencies. [#32605]

## [1.1.12] - 2023-07-24
### Fixed
- Allow `beta-plugin-slug` for cases when a `wp-plugin-slug` doesn't exist yet but is planned to. [#31551]

## [1.1.11] - 2023-05-22
### Added
- Set keywords in `composer.json`. [#30756]

## [1.1.10] - 2023-02-20
### Changed
- Minor internal updates.

## [1.1.9] - 2023-01-16
### Fixed
- Ensure `jetpack_vendor/` exists before trying to write `jetpack_vendor/i18n-map.php`. [#28369]

## [1.1.8] - 2022-12-19
### Changed
- Updated package dependencies. [#27963]

## [1.1.7] - 2022-12-02
### Changed
- Updated package dependencies. [#27688]

## [1.1.6] - 2022-11-22
### Changed
- Updated package dependencies. [#27043]

## [1.1.5] - 2022-10-25
### Changed
- Sort data in generated `i18n-map.php` file to avoid spurious diffs. [#26929]

## [1.1.4] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [1.1.3] - 2022-06-21
### Changed
- Renaming master to trunk.

## [1.1.2] - 2022-04-26
### Changed
- Updated package dependencies.

## [1.1.1] - 2022-04-12
### Added
- Set `.extra.plugin-modifies-install-path` in composer.json for Composer 2.2.9+.

## [1.1.0] - 2022-01-25
### Added
- Include package path prefixes in `i18n-map.php` so Assets can map them when lazy-loading.

## [1.0.2] - 2022-01-13
### Fixed
- Composer's `getVersion()` likes to return 4-component versions, while semver wants only 3 components. Strip any extra components instead of considering that invalid.

## [1.0.1] - 2022-01-04
### Added
- Document use of jetpack-assets, jetpack-composer-plugin, and i18n-loader-webpack-plugin together.

### Changed
- Switch to pcov for code coverage.
- Updated package dependencies.

## [1.0.0] - 2021-12-22
### Fixed
- Fix deletion of the i18n-map.php if the plugin isn't configured correctly.
- Fix handling of dev versions in i18n-map.php.

## [0.2.0] - 2021-12-20
### Added
- Generate an i18n mapping file for the installed libraries.

## 0.1.0 - 2021-12-14
### Added
- Added the Jetpack Installer package.

[4.0.2]: https://github.com/Automattic/jetpack-composer-plugin/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/Automattic/jetpack-composer-plugin/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/Automattic/jetpack-composer-plugin/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/Automattic/jetpack-composer-plugin/compare/v2.0.4...v3.0.0
[2.0.4]: https://github.com/Automattic/jetpack-composer-plugin/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/Automattic/jetpack-composer-plugin/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/Automattic/jetpack-composer-plugin/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Automattic/jetpack-composer-plugin/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.14...v2.0.0
[1.1.14]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.13...v1.1.14
[1.1.13]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.12...v1.1.13
[1.1.12]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.11...v1.1.12
[1.1.11]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.10...v1.1.11
[1.1.10]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.9...v1.1.10
[1.1.9]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-composer-plugin/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Automattic/jetpack-composer-plugin/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/Automattic/jetpack-composer-plugin/compare/v0.1.0...v0.2.0
