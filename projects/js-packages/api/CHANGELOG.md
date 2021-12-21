# Changelog

### This is a list detailing changes for the Jetpack RNA Components package releases.

## 0.8.0 - 2021-11-30
### Added
- Added jetpack/v4/seen-wc-connection-modal endpoint
- Search: Added search REST API

### Changed
- Updated package version

### Fixed
- Properly add GET-parameters for the `fetchAuthorizationUrl` API call.

## 0.7.0 - 2021-11-23
### Changed
- Auto-formatting of the unit test.
- Informs plugin_slug to the register endpoint using the JS Config package

## 0.6.0 - 2021-11-16
### Added
- Add new `attach-licences`api method.
- Add updateUserLicensesCounts API method

## 0.5.0 - 2021-10-26
### Added
- Add the IDC Start Fresh API method.

## 0.4.0 - 2021-10-19
### Added
- Add the IDC migrate API method.

## 0.3.1 - 2021-10-13
### Changed
- Updated package dependencies.

## 0.3.0 - 2021-10-12
### Added
- Add the IDC Safe Mode API call.

## 0.2.1 - 2021-09-28
### Added
- Set 'exports' in package.json.

### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- Updated package dependencies.

## 0.2.0 - 2021-08-31
### Added
- Recommendations: Add Product Suggestions endpoint

### Changed
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.

### Fixed
- Register site: do not send redirect URI if empty.

## 0.1.0 - 2021-08-12
### Added
- Add the API methods left behind by the previous PR.
- Initial release of jetpack-api package
