# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.3]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.0...v0.1.1
