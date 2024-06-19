# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.9] - 2024-06-12
### Changed
- Updated package dependencies. [#37796]

## [1.1.8] - 2024-05-06
### Changed
- Internal updates.

## [1.1.7] - 2024-03-04
### Changed
- Updated package dependencies. [#36142]

## [1.1.6] - 2024-02-07
### Changed
- At some point a change in the toolchain (babel? terser?) broke one of the possible fixes for expression movement. Update the docs to stop recommending that fix. [#35452]

## [1.1.5] - 2023-12-06
### Changed
- Updated package dependencies. [#34416]

## [1.1.4] - 2023-12-03
### Changed
- Updated package dependencies. [#34427]

## [1.1.3] - 2023-11-20

## [1.1.2] - 2023-10-17
### Changed
- Updated package dependencies. [#33646]

## [1.1.1] - 2023-10-16
### Changed
- Updated package dependencies. [#33429]

## [1.1.0] - 2023-10-03
### Added
- Add a sub-plugin, `I18nSafeMangleExportsPlugin`, to allow for avoiding problems with Webpack's `optimization.mangleExports` option occasionally mangling an export to one of the i18n function names. [#33392]

## [1.0.36] - 2023-09-13
### Changed
- Updated package dependencies. [#33001]

## [1.0.35] - 2023-09-04
### Changed
- Updated package dependencies. [#32804]

### Removed
- Remove unnecessary files from mirror repo and published package. [#32674]

## [1.0.34] - 2023-07-17
### Changed
- Updated package dependencies. [#31872]

## [1.0.33] - 2023-05-02
### Changed
- Updated package dependencies. [#30376]

## [1.0.32] - 2023-04-17
### Changed
- Updated package dependencies. [#30019]

## [1.0.31] - 2023-03-23
### Changed
- Updated package dependencies.

## [1.0.30] - 2023-03-20
### Changed
- Updated package dependencies. [#29471]

## [1.0.29] - 2023-03-08
### Changed
- Updated package dependencies. [#29289]

## [1.0.28] - 2023-02-06
### Changed
- Updated package dependencies. [#28682]

## [1.0.27] - 2023-01-25
### Changed
- Minor internal updates.

## [1.0.26] - 2023-01-23
### Fixed
- Clean up JavaScript eslint issues. [#28441]

## [1.0.25] - 2023-01-11
### Changed
- Updated package dependencies.

## [1.0.24] - 2022-12-02
### Changed
- Updated package dependencies. [#27576]

## [1.0.23] - 2022-11-22
### Changed
- Updated package dependencies. [#27043]

## [1.0.22] - 2022-11-10
### Changed
- Updated package dependencies. [#27319]

## [1.0.21] - 2022-10-13
### Fixed
- Update test snapshots. [#26716]

## [1.0.20] - 2022-10-05
### Changed
- Updated package dependencies. [#26583]

## [1.0.19] - 2022-09-13
### Changed
- Updated package dependencies. [#26072]

## [1.0.18] - 2022-08-23
### Added
- Add documentation of another problematic pattern (same string with different translator comments). [#25677]

### Changed
- Updated package dependencies. [#25339, #25762]

## [1.0.17] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [1.0.16] - 2022-07-12
### Changed
- Updated package dependencies.

## [1.0.15] - 2022-07-06
### Changed
- Updated package dependencies. [#24924]

## [1.0.14] - 2022-06-14
### Changed
- Updated package dependencies. [#24724]

## [1.0.13] - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]

## [1.0.12] - 2022-05-18
### Changed
- Updated package dependencies [#24372]

## [1.0.11] - 2022-05-10
### Changed
- Updated package dependencies [#24276]

### Fixed
- Update test snapshot. [#24302]

## [1.0.10] - 2022-05-04
### Added
- Add missing JavaScript dependencies. [#24096]

## [1.0.9] - 2022-04-26
### Changed
- Updated package dependencies.
- Update package.json metadata.

## [1.0.8] - 2022-04-12
### Changed
- Updated package dependencies

## [1.0.7] - 2022-04-05
### Changed
- Updated package dependencies.

## [1.0.6] - 2022-03-23
### Changed
- Updated package dependencies

## [1.0.5] - 2022-02-16
### Added
- Add timing info to debug output.

## [1.0.4] - 2022-01-27
### Changed
- Updated package dependencies.

## [1.0.3] - 2022-01-25
### Changed
- Updated package dependencies.

## [1.0.2] - 2022-01-18
### Changed
- General: update required node version to v16.13.2

## [1.0.1] - 2022-01-04
### Changed
- Updated package dependencies

## [1.0.0] - 2021-12-22
### Added
- Allow specifying the expected textdomain to be used in the output assets.

### Fixed
- Fix a unit test that broke when we added i18n-loader to the webpack config.
- Fixed a documentation error.
- Fix use in Node 14.

## 0.1.0 - 2021-12-14
### Added
- Initial release.

[1.1.9]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.36...v1.1.0
[1.0.36]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.35...v1.0.36
[1.0.35]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.34...v1.0.35
[1.0.34]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.33...v1.0.34
[1.0.33]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.32...v1.0.33
[1.0.32]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.31...v1.0.32
[1.0.31]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.30...v1.0.31
[1.0.30]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.29...v1.0.30
[1.0.29]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.28...v1.0.29
[1.0.28]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.27...v1.0.28
[1.0.27]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.26...v1.0.27
[1.0.26]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.25...v1.0.26
[1.0.25]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.24...v1.0.25
[1.0.24]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.23...v1.0.24
[1.0.23]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.22...v1.0.23
[1.0.22]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.21...v1.0.22
[1.0.21]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.20...v1.0.21
[1.0.20]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.19...v1.0.20
[1.0.19]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.18...v1.0.19
[1.0.18]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.17...v1.0.18
[1.0.17]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.16...v1.0.17
[1.0.16]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.15...v1.0.16
[1.0.15]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.14...v1.0.15
[1.0.14]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.13...v1.0.14
[1.0.13]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.12...v1.0.13
[1.0.12]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Automattic/i18n-check-webpack-plugin/compare/v0.1.0...v1.0.0
