# Changelog

### This is a list detailing changes for the Jetpack RNA Components package releases.

## 0.14.0 - 2022-09-27
### Removed
- Mobile Login Email: Remove unused code [#26311]

## 0.13.11 - 2022-08-25
### Changed
- Updated package dependencies. [#25814]

## 0.13.10 - 2022-08-23
### Changed
- Updated package dependencies. [#25338]

## 0.13.9 - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## 0.13.8 - 2022-07-12
### Changed
- Updated package dependencies.

## 0.13.7 - 2022-07-06
### Changed
- Updated package dependencies. [#24923]

## 0.13.6 - 2022-06-21
### Changed
- Drop dependency on lodash, use `Object.assign` instead.

## 0.13.5 - 2022-06-14
### Changed
- Updated package dependencies. [#24722]

## 0.13.4 - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]

## 0.13.3 - 2022-05-30
### Changed
- Updated package dependencies

## 0.13.2 - 2022-05-10
### Changed
- Updated package dependencies [#24301]

## 0.13.1 - 2022-05-04
### Added
- Added an endpoint to load the firewall's settings. [#23769]
- Add missing JavaScript dependencies. [#24096]

### Changed
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Updated package dependencies [#24198]

## 0.13.0 - 2022-04-26
### Added
- Add endpoints for site discount
- Add endpoint to fetch intro offers

### Changed
- Updated package dependencies.

## 0.12.0 - 2022-04-19
### Added
- Added API routes for WordAds settings
- Search: added API support for search product tier pricing

## 0.11.0 - 2022-04-12
### Added
- Add endpoint for conditional recommendations

## 0.10.2 - 2022-04-05
### Changed
- Updated package dependencies

## 0.10.1 - 2022-03-29
### Changed
- Updated package dependencies.

## 0.10.0 - 2022-03-23
### Added
- New API which returns the list of licenses from WPCOM

## 0.9.1 - 2022-03-02
### Changed
- Updated package dependencies

## 0.9.0 - 2022-02-22
### Added
- API: add Jetpack Search stats endpoint

### Removed
- Removed testing dependency on `chai-fetch-mock`. It was unused.

## 0.8.4 - 2022-02-09
### Changed
- Updated package dependencies

## 0.8.3 - 2022-01-25
### Changed
- Updated package dependencies.

## 0.8.2 - 2022-01-18
### Changed
- General: update required node version to v16.13.2
- Updated package dependencies.

## 0.8.1 - 2022-01-04
### Changed
- Updated package dependencies

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
