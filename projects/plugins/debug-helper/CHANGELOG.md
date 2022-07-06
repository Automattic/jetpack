# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2022-07-06
### Added
- Added the Autoloader debugger helper to the Debug tool. [#23726]
- Add Protect helper module. [#24805]
- Debug helper plugin: add debug helper page for Jetpack modules. [#24456]

### Changed
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`. [#23942]
- Renaming master to trunk. [#24661]
- Updated package dependencies.

## [1.3.0] - 2022-03-01
### Added
- Add a Sync Data Settings page, which displays the data settings provided by each Sync data filter.
- IDC Simulator: Display an admin notice when the module disables Sync

### Changed
- Updated composer.lock file.
- Updated package dependencies

### Fixed
- Fixed minor coding standard violation.

## [1.2.0] - 2021-11-02
### Added
- Added an IDC simulator module to Debug Helper.
- Display the IDC option values (sync_error_idc, migrate_for_idc, and safe_mode_confirmed)
- IDC Simulator: Add a button that triggers an authenticated remote request
- IDC Simulator: add setting to enable and disable Sync
- IDC Simulator: display the last five remote requests
- IDC Simulatore: add the ability to spoof the home option value

### Changed
- Updated package dependencies.

### Removed
- Rmove the unusaed jetpack_idc_option transient from the UI

### Fixed
- Set `prefer-stable: true` in composer.json.

## [1.1.0] - 2021-08-26
### Added
- Broken Token: Add clear current user token functionality.
- Created a changelog from the git history with help from [auto-changelog](https://www.npmjs.com/package/auto-changelog). It could probably use cleanup!
- Display the registration nonce to test the endpoint `connection/register`.

### Changed
- Remove composer dev-monorepo hack.
- Update package dependencies.

## 1.0.1 - 2021-03-04

- Initial version.

[1.4.0]: https://github.com/Automattic/jetpack-debug-helper/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-debug-helper/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-debug-helper/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-debug-helper/compare/v1.0.1...v1.1.0
