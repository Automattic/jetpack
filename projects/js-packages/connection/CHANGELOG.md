# Changelog

### This is a list detailing changes for the Jetpack RNA Connection Component releases.

## 0.5.1 - 2021-08-12
### Changed
- Move API calls to jetpack-api package
- Updated package dependencies

### Fixed
- Fix minor styling issues on the connection screen.

## 0.5.0 - 2021-07-27
### Added
- Add Connection Status Card component.
- Add DisconnectDialog RNA component.
- Added the connection screen components, moved connection status callback to properties.

### Changed
- Mark assetBaseUrl as optional for ImageSlider.

## 0.4.0 - 2021-06-29
### Changed
- Remove In-Place Connection flow from the package.
- Rename 'Main' component into 'ConnectButton'
- Update node version requirement to 14.16.1

## 0.3.0 - 2021-06-15
### Added
- Added dev dependency on react (in addition to existing peer dep) for tests to run.
- Added missing dependencies.

### Changed
- Getting rid of the 'authorizeUrl' parameter, retrieving the value via REST API, and extrating the user connection functionality into a separate 'ConnectUser' component.

## 0.2.0 - 2021-05-25
### Added
- Add connection components.

### Changed
- Updated package dependencies.

## 0.1.0 - 2021-04-27
### Added
- `InPlaceConnection` component added.

## 0.2.0 - 2021-05-18

- `Main` and `ConnectUser` components added.
- `JetpackRestApiClient` API client added.
