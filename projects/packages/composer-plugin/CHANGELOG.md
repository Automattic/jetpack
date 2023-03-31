# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
