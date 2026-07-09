# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.35] - 2026-06-26
### Changed
- Internal updates.

## [0.1.34] - 2026-06-24
### Changed
- Update dependencies. [#49641]
- Update package dependencies. [#49831]

## [0.1.33] - 2026-06-10
### Changed
- Update dependencies. [#49488]

## [0.1.32] - 2026-06-08
### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Update dependencies. [#48210]
- Update package dependencies. [#49012]

### Fixed
- Remove the React Query devtools from DataSyncProvider so the TanStack debugger no longer renders in consuming apps. [#49280]

## [0.1.31] - 2026-04-13
### Changed
- Update dependencies. [#47600]
- Update package dependencies. [#47799]

## [0.1.30] - 2026-03-09
### Changed
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update package dependencies. [#47002] [#47173]

## [0.1.29] - 2026-02-03
### Changed
- Update dependencies. [#46893]

## [0.1.28] - 2026-01-26
### Changed
- Update dependencies. [#46662]

## [0.1.27] - 2026-01-07
### Changed
- Update dependencies. [#46381]

## [0.1.26] - 2025-12-11
### Changed
- Update dependencies. [#46157]

## [0.1.25] - 2025-11-25
### Changed
- Update package dependencies. [#45932]
- Update package dependencies. [#45958]

## [0.1.24] - 2025-10-28
### Changed
- Update package dependencies. [#45652]

## [0.1.23] - 2025-10-14
### Changed
- Update package dependencies. [#45173] [#45241]

## [0.1.22] - 2025-09-17
### Changed
- Update package dependencies. [#44901]
- Update package dependencies. [#45097]

## [0.1.21] - 2025-08-21
### Added
- Add `typecheck` script to ensure that TypeScript files are type-checked. [#44795]

### Changed
- Update dependencies. [#44736]

## [0.1.20] - 2025-08-05
### Changed
- Internal updates.

## [0.1.19] - 2025-07-23
### Changed
- Update dependencies. [#44400]

## [0.1.18] - 2025-07-08
### Changed
- Update dependencies. [#44142]
- Update package dependencies. [#44217]

## [0.1.17] - 2025-06-23
### Changed
- Internal updates.

## [0.1.16] - 2025-06-11
### Changed
- Update package dependencies. [#43766]

## [0.1.15] - 2025-05-15
### Changed
- Update package dependencies. [#43356]

## [0.1.14] - 2025-04-16
### Changed
- Update dependencies. [#42830]

## [0.1.13] - 2025-04-01
### Changed
- Update package dependencies. [#42762]

## [0.1.12] - 2025-03-18
### Changed
- Return more detailed error messages when an action fails. [#42110]
- Update dependencies. [#42406]

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

[0.1.35]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.34...v0.1.35
[0.1.34]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.33...v0.1.34
[0.1.33]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.32...v0.1.33
[0.1.32]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.31...v0.1.32
[0.1.31]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.30...v0.1.31
[0.1.30]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.29...v0.1.30
[0.1.29]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.28...v0.1.29
[0.1.28]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.27...v0.1.28
[0.1.27]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.26...v0.1.27
[0.1.26]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.25...v0.1.26
[0.1.25]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.24...v0.1.25
[0.1.24]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.23...v0.1.24
[0.1.23]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.22...v0.1.23
[0.1.22]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.21...v0.1.22
[0.1.21]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.20...v0.1.21
[0.1.20]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.19...v0.1.20
[0.1.19]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.18...v0.1.19
[0.1.18]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.17...v0.1.18
[0.1.17]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.16...v0.1.17
[0.1.16]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.15...v0.1.16
[0.1.15]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.14...v0.1.15
[0.1.14]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.13...v0.1.14
[0.1.13]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.12...v0.1.13
[0.1.12]: https://github.com/Automattic/jetpack-react-data-sync-client/compare/v0.1.11...v0.1.12
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
