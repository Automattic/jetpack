# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2022-01-25
### Changed
- BREAKING: Remove the downloading logic from the runtime by requiring a "loader" module rather than a "state" module. This gives more flexibility for different implementations in the future.
- Update documentation for moving of the handling of package→plugin path mapping into jetpack-composer-plugin and jetpack-assets.

## [1.0.2] - 2022-01-18
### Changed
- General: update required node version to v16.13.2

## [1.0.1] - 2022-01-04
### Added
- Document use of jetpack-assets, jetpack-composer-plugin, and i18n-loader-webpack-plugin together.

### Changed
- Updated package dependencies

## 1.0.0 - 2021-12-22
### Added
- Initial release.

[2.0.0]: https://github.com/Automattic/i18n-loader-webpack-plugin/compare/v1.0.2...v2.0.0
[1.0.2]: https://github.com/Automattic/i18n-loader-webpack-plugin/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/i18n-loader-webpack-plugin/compare/v1.0.0...v1.0.1
