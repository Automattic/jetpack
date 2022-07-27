# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.18] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [0.8.17] - 2022-07-12
### Changed
- Updated package dependencies.

## [0.8.16] - 2022-07-06
### Changed
- Updated package dependencies. [#24923]

## [0.8.15] - 2022-06-21
### Changed
- Renaming master to trunk. [#24661]

## [0.8.14] - 2022-06-14
### Changed
- Updated package dependencies. [#24529]

## [0.8.13] - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]

## [0.8.12] - 2022-05-30
### Changed
- Updated package dependencies

## [0.8.11] - 2022-05-18
### Changed
- Updated package dependencies [#24372]

## [0.8.10] - 2022-05-10
### Changed
- Updated package dependencies. [#24302]

## [0.8.9] - 2022-05-04
### Added
- Add missing JavaScript dependencies. [#24096]

### Changed
- Updated package dependencies. [#24095] [#24198]

### Deprecated
- Moved the options class into Connection. [#24095]

## [0.8.8] - 2022-04-26
### Changed
- Updated package dependencies.
- Update package.json metadata.

## [0.8.7] - 2022-04-19
### Changed
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`

## [0.8.6] - 2022-04-12
### Changed
- Updated package dependencies.

## [0.8.5] - 2022-04-06
### Changed
- Updated package dependencies

### Removed
- Removed tracking dependency.

## [0.8.4] - 2022-03-29
### Changed
- Microperformance: Use === null instead of is_null
- Updated package dependencies.

## [0.8.3] - 2022-03-23
### Changed
- Updated package dependencies

## [0.8.2] - 2022-03-15
### Changed
- Updated package dependencies.

## [0.8.1] - 2022-03-08
### Changed
- Updated package dependencies.

## [0.8.0] - 2022-03-02
### Added
- IDC: add detection for possibly dynamic HTTP_HOST being used in WP_SITEURL or WP_HOME.

### Changed
- Bring back the IDC screen in Staging mode.
- Updated package dependencies.

## [0.7.4] - 2022-02-22
### Added
- Add blog ID to event tracking.

## [0.7.3] - 2022-02-16
### Changed
- Updated package dependencies.

## [0.7.2] - 2022-02-09
### Changed
- Updated package dependencies

## [0.7.1] - 2022-02-02
### Changed
- Updated package dependencies.

## [0.7.0] - 2022-01-27
### Changed
- IDC "Safe Mode" admin bar button redesign.

## [0.6.4] - 2022-01-25
### Changed
- Add class notice to the IDC container div.
- Add missing JS peer dependency.
- Updated package dependencies.

## [0.6.3] - 2022-01-18
### Changed
- General: update required node version to v16.13.2

## [0.6.2] - 2022-01-11
### Changed
- Updated package dependencies.

## [0.6.1] - 2022-01-11
### Fixed
- Do not add IDC query args to authenticated request when in offline or staging mode.

## [0.6.0] - 2022-01-04
### Added
- Build and display the new RNA IDC banner.

### Changed
- Switch to pcov for code coverage.
- Updated package dependencies.
- Updated package textdomain from `jetpack` to `jetpack-idc`.
- Updated references to '.jp-recommendations__app-badge' to its new name '.apps-badge'

## [0.5.0] - 2021-12-14
### Added
- Add a method to determine the safe mode status.

### Changed
- Updated package dependencies.

## [0.4.4] - 2021-11-30
### Changed
- Colors: update Jetpack Primary color to match latest brand book.
- Remove now-redundant `output.filename` from Webpack config.

## [0.4.3] - 2021-11-23
### Changed
- Updated package dependencies.

## [0.4.2] - 2021-11-17

## [0.4.1] - 2021-11-16
### Added
- Use monorepo `validate-es` script to validate Webpack builds.

### Changed
- Updated package dependencies

## [0.4.0] - 2021-11-09
### Added
- Add a method to unambiguously determine whether the site is experiencing identity crisis.

### Changed
- Updated package dependencies.
- Update webpack build config. Removes IE 11 support in the JavaScript.

## [0.3.1] - 2021-11-02
### Changed
- Add the idc url query args to remote requests
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [0.3.0] - 2021-10-26
### Added
- Add redirect_uri parameter for IDC Start Fresh endpoint.
- Delete the migrate_for_idc option when a remote request returns migrated_for_idc

### Changed
- Updated package dependencies

## [0.2.8] - 2021-10-13
### Changed
- Updated package dependencies.

## [0.2.7] - 2021-10-12
### Added
- Add the new check_response_for_idc method to the Identity_Crisis class

### Changed
- Updated package dependencies

## [0.2.6] - 2021-09-28
### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- IDC: Rename the Identity_Crisis::sync_idc_optin method to Identity_Crisis:should_handle_idc. Add a new filter and constant that use the new name.
- Updated package dependencies.

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

[0.8.18]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.17...v0.8.18
[0.8.17]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.16...v0.8.17
[0.8.16]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.15...v0.8.16
[0.8.15]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.14...v0.8.15
[0.8.14]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.13...v0.8.14
[0.8.13]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.12...v0.8.13
[0.8.12]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.11...v0.8.12
[0.8.11]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.10...v0.8.11
[0.8.10]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.9...v0.8.10
[0.8.9]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.8...v0.8.9
[0.8.8]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.7...v0.8.8
[0.8.7]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.6...v0.8.7
[0.8.6]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.5...v0.8.6
[0.8.5]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.7.4...v0.8.0
[0.7.4]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.6.4...v0.7.0
[0.6.4]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.4.4...v0.5.0
[0.4.4]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.8...v0.3.0
[0.2.8]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-identity-crisis/compare/v0.1.0...v0.2.0
