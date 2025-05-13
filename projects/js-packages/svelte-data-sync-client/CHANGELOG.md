# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-05-13
### Changed
- Adjust relative imports in TypeScript sources to use correct extensions after enabling TypeScript's new `rewriteRelativeImportExtensions` option. The built JS should be unaffected, so this is not a breaking change. [#42990]
- Update dependencies. [#41847]
- Update package dependencies. [#42762]

### Deprecated
- Deprecated the package. [#43312]

## [0.3.7] - 2025-02-05
### Changed
- Updated package dependencies. [#41286]

## [0.3.6] - 2024-12-04
### Added
- Enable test coverage. [#39961]

### Changed
- Update build configuration to better match supported target environments. [#35713]
- Updated package dependencies. [#37830] [#38288] [#39004] [#39111] [#39170] [#39898]

### Fixed
- Adjust build to work with `tsc` and `moduleResolution:nodenext`. [#35713]

## [0.3.5] - 2024-02-07
### Changed
- Updated package dependencies. [#34427]

## [0.3.4] - 2023-10-26
### Changed
- DataSync: Refactor the datasync interface [#33538]
- Updated package dependencies. [#32957] [#33454] [#33567] [#33569]

## [0.3.3] - 2023-09-13
### Changed
- Updated package dependencies. [#32953]

## [0.3.2] - 2023-09-01
### Changed
- Updated package dependencies. [#31815] [#32605]

### Removed
- Remove unnecessary files from mirror repo and published package. [#32674]

## [0.3.1] - 2023-07-11
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

[0.4.0]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.7...v0.4.0
[0.3.7]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-svelte-data-sync-client/compare/v0.2.0...v0.3.0
