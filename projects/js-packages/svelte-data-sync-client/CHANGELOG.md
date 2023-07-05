# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2023-07-05
### Fixed
- Fixed support for older versions of Safari [#31534]

## [0.3.0] - 2023-06-23
### Changed
- Improve value comparisons when syncing data [#30690]

### Fixed
- Fix: Edge case when updating multiple properties of a writable store object sequentially. [#30606]

## 0.2.0 - 2023-05-11
### Changed
- Ensured most up-to-date package version is in use. [#29973]
- Made it easier to refresh datasync stores [#30508]
- Set `exports` in package.json. This will break directly requiring files from within the package in environments that respect `exports`. [#30313]
- Updated package dependencies. [#30264] [#30265] [#30271] [#30294] [#30308]

### Fixed
- Expanded the pending state to span multiple requests to help better reflect it in the UI. [#30205]
- Fixed `pending` store in a SyncedStore [#29451]

## 0.1.0 - 2023-04-06
### Added
- Added an error store to help track errors that happen during syncing. [#29302]

### Changed
- Updated package dependencies. [#29471]
- Updated to use Abort Controller to allow cancelling requests mid-stream. [#29122]

[0.3.1]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.2.0...v0.3.0
