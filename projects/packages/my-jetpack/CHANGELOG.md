# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2022-01-25
### Added
- add API endpoints to manipulate products
- Added css module for My Jetpack Plans Section
- Added useAnalytics hook
- Added Visitor class for status regarding the site visitor.
- Add first data approach
- Add Products and REST_Products basic classes
- Adds very basic product cards section component to my jetpack
- My Jetpack: Add Product Card component
- My Jetpack: check user connectivity before to hit wpcom side
- My Jetpack: Implement data handling for enable/disable products
- Removed endpoint plans superseded by purchases

### Changed
- Add Connections Section wrapping the Connection Status Card to My Jetpack
- Build: do not ship raw files in production bundle.

### Removed
- Remove unused usePlans() custom react hook

### Fixed
- Fixed svg attribute strokeWidth for Boost Card

## [0.3.3] - 2022-01-18
### Added
- Added redux store specific to my-jetpack
- Implement plans list properly in the PlansSection
- My Jetpack: Add scripts for JS tests
- My Jetpack: Include wordpress components as dep
- Reduxify purchases data

### Changed
- General: update required node version to v16.13.2
- Properly style the Plans Section according to proposed design
- Updated package dependencies.

## [0.3.2] - 2022-01-13
### Added
- My Jetpack: add story to `<PlanSection />` component
- My Jetpack: first PlanSection implementation

### Fixed
- Rename method enqueue_scritps to enqueue_scripts

## [0.3.1] - 2022-01-11
### Added
- Add devvelopment testing instructions to doc.

### Changed
- Updated package dependencies.

### Removed
- Remove use of deprecated `~` in sass-loader imports.

## [0.3.0] - 2022-01-04
### Changed
- Drop isRegistered and isUserConnected params from ConnectionStatusCard component
- Switch to pcov for code coverage.
- Updated package dependencies.
- Updated package textdomain from `jetpack` to `jetpack-my-jetpack`.

## [0.2.0] - 2021-12-14
### Added
- Added Connection Status Card to the page.
- Janitorial: add watch command to the plugin.

### Changed
- Adapt to new layout components.
- Build: do not ship scss and jsx files in production build.

### Fixed
- Build minimized JS for the production build.
- Fix JavaScript i18n strings.

## [0.1.3] - 2021-12-07
### Changed
- Updated package dependencies.

## [0.1.2] - 2021-11-30
### Added
- Janitorial: create mirror repo for the package.

### Changed
- Remove now-redundant `output.filename` from Webpack config.

## 0.1.1 - 2021-11-23
### Changed
- Updated package dependencies.

## 0.1.0 - 2021-11-17
### Added
- Created package

[0.4.0]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.3.3...0.4.0
[0.3.3]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.3.2...0.3.3
[0.3.2]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.1.3...0.2.0
[0.1.3]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-my-jetpack/compare/0.1.1...0.1.2
