# Changelog

### This is a list detailing changes for the Jetpack RNA Connection Component releases.

## 0.9.1 - 2021-11-09
### Changed
- Updated package dependencies.

## 0.9.0 - 2021-11-02
### Added
- Add ConnectScreenRequiredPlan component.

### Changed
- Updated package dependencies.

## 0.8.0 - 2021-10-26
### Changed
- ConnectButton now uses ActionButton component
- Package version bump.
- Updated package dependencies

## 0.7.2 - 2021-10-19
### Changed
- Bump the RNA API version.

## 0.7.1 - 2021-10-13
### Changed
- Updated package dependencies.

## 0.7.0 - 2021-10-12
### Changed
- Bump the RNA API version.

### Removed
- Connection Screen component no longer pulls conneciton status from the API, it only relies on the properties. Use WithConnectionStatus HOC instead.

## 0.6.1 - 2021-09-28
### Added
- Set 'exports' in package.json.

### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- Updated package dependencies.

### Fixed
- Display an error message on site registration failure.

## 0.6.0 - 2021-08-31
### Added
- Add the spinner to the connection button.

### Changed
- Bump version number
- Extract connection status fetching into a higher order component.
- Make redirect URI optional for connection screen and button components.
- Updated package dependencies.
- Use Node 16.7.0 in tooling.

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
