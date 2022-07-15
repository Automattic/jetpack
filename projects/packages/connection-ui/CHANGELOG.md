# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.9.1] - 2022-07-15
### Changed
- Updated package dependencies.

## [2.4.9] - 2022-06-28
### Removed
- Remove unused JS dep on `enzyme`.

## [2.4.8] - 2022-06-21
### Changed
- Renaming master to trunk. [#24661]

## [2.4.7] - 2022-06-14
### Changed
- Updated package dependencies. [#24529]

## [2.4.6] - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]

## [2.4.5] - 2022-05-31
### Changed
- Updated package dependencies. [#24573]

## [2.4.4] - 2022-05-18
### Changed
- Updated package dependencies [#24372]

## [2.4.3] - 2022-05-10
### Changed
- Updated package dependencies. [#24189]

## [2.4.2] - 2022-05-04
### Changed
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Updated package dependencies. [#24095] [#24198]

## [2.4.1] - 2022-04-26
### Changed
- Updated package dependencies.
- Update package.json metadata.

## [2.4.0] - 2022-04-19
### Deprecated
- Deprecated in-place connection.

## [2.3.14] - 2022-04-12
### Changed
- Updated package dependencies.

## [2.3.13] - 2022-04-06
### Changed
- Updated package dependencies

## [2.3.12] - 2022-03-29
### Changed
- Updated package dependencies.

## [2.3.11] - 2022-03-23
### Changed
- Updated package dependencies

## [2.3.10] - 2022-03-15
### Changed
- Updated package dependencies.

## [2.3.9] - 2022-03-08
### Changed
- Updated package dependencies.

## [2.3.8] - 2022-03-02
### Changed
- Updated package dependencies

## [2.3.7] - 2022-02-22
### Changed
- Updated package dependencies.

## [2.3.6] - 2022-02-16
### Changed
- Updated package dependencies.

## [2.3.5] - 2022-02-09
### Changed
- Updated package dependencies

## [2.3.4] - 2022-02-02
### Changed
- Updated package dependencies.

## [2.3.3] - 2022-01-25
### Added
- connection initial state

### Changed
- Updated package dependencies.

## [2.3.2] - 2022-01-18
### Changed
- General: update required node version to v16.13.2

## [2.3.1] - 2022-01-11
### Changed
- Updated package dependencies.

## [2.3.0] - 2022-01-04
### Changed
- Drop isRegistered and isUserConnected params from ConnectionStatusCard component
- Replaced IDC screen rendering with site-wide IDC screen.
- Updated package dependencies
- Updated package textdomain from `jetpack` to `jetpack-connection-ui`.

## [2.2.0] - 2021-12-14
### Changed
- Allow non-adimin access to the Connection Manager for proper IDC screen review.

### Fixed
- Build minimized JS for the production build.

## [2.1.4] - 2021-12-07
### Added
- Pass tracking data into the RNA IDC package.

### Changed
- Updated package dependencies.

## [2.1.3] - 2021-11-30
### Changed
- Remove now-redundant `output.filename` from Webpack config.

## [2.1.2] - 2021-11-23
### Changed
- Updated package dependencies.

## [2.1.1] - 2021-11-17
### Changed
- Updated package dependencies.

## [2.1.0] - 2021-11-16
### Added
- Use monorepo `validate-es` script to validate Webpack builds.

### Changed
- Replace the withConnectionStatus HOC with withSelect HOC.
- Updated package dependencies

### Removed
- Remove use of `gulp` in build, all it was doing was wrapping `webpack`.

## [2.0.0] - 2021-11-09
### Added
- Initialize IDC package, properly display the RNA IDC screen.

### Changed
- Updated package dependencies.
- Update webpack build config. Removes IE 11 support in the JavaScript.

## [1.6.0] - 2021-11-02
### Changed
- Updated package dependencies
- Use ConnectScreenRequiredPlan instead of ConnectScreen.

## [1.5.3] - 2021-10-26
### Added
- Add the redirect URI for RNA IDC "Start Fresh" functionality.

### Changed
- Updated package dependencies.

## [1.5.2] - 2021-10-19
### Changed
- Bump the RNA API version.

## [1.5.1] - 2021-10-13
### Changed
- Updated package dependencies.

## [1.5.0] - 2021-10-12
### Added
- Initialize REST API in the IDC package.
- Temporarily force the IDC screen to appear for debugging purposes.

### Changed
- Use the "withConnectionStatus" HOC for ConnectScreen component.

## [1.4.1] - 2021-09-28
### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- Updated package dependencies.

## [1.4.0] - 2021-08-31
### Changed
- Bump connection package version to 0.5.2-alpha.
- Updated package dependencies.
- Updated Package versions in annotations.
- Update to latest webpack, webpack-cli and calypso-build.
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.
- Use the "withConnectionStatus" HOC for ConnectScreen component.

### Removed
- Removed unused method

## [1.3.1] - 2021-08-12
### Changed
- Updated package dependencies
- Update jest dependency to fix jetpack search tests

## [1.3.0] - 2021-07-27
### Added
- Integrate ConnectionStatusCard component.
- Integrate DisconnectDialog RNA component.
- Integrate the RNA connection screen component.

## [1.2.0] - 2021-06-29
### Added
- Add the Jetpack logo to the header.

### Changed
- Adjust the RNA Connection usage because 'Main' component has been removed to 'ConnectButton'
- Clean up the code that used to be required for now removed In-Place Connection flow.
- Updated package dependencies.
- Update node version requirement to 14.16.1

## [1.1.1] - 2021-06-15
### Changed
- Remove the 'authorizeUrl' RNA Connection parameter as it's no longer needed.
- Update docs to replace yarn with pnpm.

### Fixed
- Remove dependency on @wordpress/url as it caused dependency issues in build test flows.
- Use `absoluteRuntime` in babel JS build to avoid module not found errors.

## [1.1.0] - 2021-05-25
### Added
- Integrate the connection flow using RNA Connection package.

### Fixed
- Add docblock for `jetpack_on_connection_ui_init` hook.
- Fixing the Connection UI initialization logical error
- Initialize the main connection-ui Admin class only once since it may be called multiple times.

## [1.0.2] - 2021-04-27
### Added
- Add React initial state.

### Changed
- Updated package dependencies.

## [1.0.1] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Connection UI: remove .github directory from production package
- Pin dependencies
- Update Node to match latest LTS 12
- Update package dependencies.

## 1.0.0 - 2021-02-23

- Connection UI: Building the Framework

[2.4.9.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.9...v2.4.9.1
[2.4.9]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.8...v2.4.9
[2.4.8]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.7...v2.4.8
[2.4.7]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.6...v2.4.7
[2.4.6]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.5...v2.4.6
[2.4.5]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.4...v2.4.5
[2.4.4]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.3...v2.4.4
[2.4.3]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.2...v2.4.3
[2.4.2]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.1...v2.4.2
[2.4.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.4.0...v2.4.1
[2.4.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.14...v2.4.0
[2.3.14]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.13...v2.3.14
[2.3.13]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.12...v2.3.13
[2.3.12]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.11...v2.3.12
[2.3.11]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.10...v2.3.11
[2.3.10]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.9...v2.3.10
[2.3.9]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.8...v2.3.9
[2.3.8]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.7...v2.3.8
[2.3.7]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.6...v2.3.7
[2.3.6]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.5...v2.3.6
[2.3.5]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.4...v2.3.5
[2.3.4]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.3...v2.3.4
[2.3.3]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.2...v2.3.3
[2.3.2]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.1.4...v2.2.0
[2.1.4]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.1.3...v2.1.4
[2.1.3]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.6.0...v2.0.0
[1.6.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.5.3...v1.6.0
[1.5.3]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.0.0...v1.0.1
