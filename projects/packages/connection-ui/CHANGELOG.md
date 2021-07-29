# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.3.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-connection-ui/compare/v1.0.0...v1.0.1
