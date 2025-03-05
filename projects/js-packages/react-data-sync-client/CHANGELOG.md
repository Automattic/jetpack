# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.11] - 2025-03-05
### Changed
- Update dependencies. [#41847]

## [0.1.10] - 2025-02-12
### Added
- Add React Query Devtools. [#41357]

### Changed
- Updated package dependencies. [#41286]

### Fixed
- Fix potential race condition if multiple requests are triggered. [#41472]

## [0.1.9] - 2025-01-23
### Changed
- Internal updates.

## [0.1.8] - 2025-01-06
### Changed
- Internal updates.

## [0.1.7] - 2024-11-28
### Changed
- Update dependencies. [#40194]

## [0.1.6] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [0.1.5] - 2024-09-25
### Changed
- Internal updates.

## [0.1.4] - 2024-08-29
### Changed
- Updated package dependencies. [#39004] [#39111]

## [0.1.3] - 2024-06-10
### Changed
- Updated package dependencies. [#37380]

## [0.1.2] - 2024-03-01
### Fixed
- DataSync: Add `isIdle` and `reset` to DataSyncSubset [#36022]
- Improved error handling and response formatting in DataSync client and PHP classes. Simplified page cache setup in Jetpack Boost. [#35962]

## [0.1.1] - 2024-02-22
### Added
- Add a way to invalidate queries. [#35568]

### Changed
- DataSync: Add `useDataSyncSubset` [#35808]
- React DataSync Client: Enhanced Error Handling and Debugging [#35325]
- React DataSync Client: Improve error resitance. Added new debugging features and improvements to existing functionality. [#35537]
- Update build configuration to better match supported target environments. [#35713]

### Fixed
- React DataSync Client: Use abortController to control mutation requests [#35253]
- WP JS DataSync: Try to prevent fatal errors in production as much as possible. [#35361]

## 0.1.0 - 2024-01-22
### Added
- Added useLazyDataSync [#34185]
- Init [#33625]

### Changed
- Add DataSync Actions [#34755]
- Added useDataSyncAction hook [#34599]
- React data sync updates. [#33657]
- Updated package dependencies. [#33646]

### Fixed
- Added default param for callbacks to prevent crashes when none provided [#34910]

[0.1.11]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.10...v0.1.11
[0.1.10]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.0...v0.1.1
