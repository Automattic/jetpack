# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.5] - 2021-08-31
### Changed
- Updated package dependencies.

## [0.2.4] - 2021-08-30
### Changed
- Bump changelogger version
- Tests: update PHPUnit polyfills dependency (yoast/phpunit-polyfills).
- update annotations versions
- Update to latest webpack, webpack-cli and calypso-build
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.

## [0.2.3] - 2021-08-12
### Changed
- Updated package dependencies

## [0.2.2] - 2021-07-27
### Added
- Add jetpack_connection_disconnect_site_wpcom filter.

## [0.2.1] - 2021-07-13
### Changed
- Updated package dependencies.

## [0.2.0] - 2021-06-29
### Added
- Add jetpack_idc_disconnect hook to properly disconnect based on IDC settings and clear IDC options.

### Changed
- Migrate jetpack/v4/identity-crisis endpoints into package.
- Update node version requirement to 14.16.1

## 0.1.0 - 2021-06-15
### Added
- Sync: Adding the Identity_Crisis package.

### Changed
- Updated package dependencies.
- Use Connection/Urls for home_url and site_url functions migrated from Sync.

[0.2.5]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.1.0...v0.2.0
