# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.6] - 2026-04-13
### Changed
- Set `.repository.url` in `package.json` to the mirror repo rather than the monorepo. Required for enabling provenance. [#47149]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update dependencies. [#46662]
- Update package dependencies. [#47002] [#47099] [#47173] [#47799]

## [0.1.5] - 2026-01-12
### Changed
- Update package dependencies. [#45652] [#45958]

## [0.1.4] - 2025-10-13
### Added
- Added `typecheck` script to ensure that TypeScript files are type-checked. [#45034]

### Changed
- Update dependencies. [#44736]
- Update package dependencies. [#45097] [#45173] [#45241] [#45334]

## [0.1.3] - 2025-08-06
### Changed
- Update dependencies. [#43569]
- Update package dependencies. [#43734] [#43766] [#44151] [#44217] [#44356]

## [0.1.2] - 2025-05-13
### Changed
- Update dependencies. [#41847]
- Update package dependencies. [#42511] [#42762]

## [0.1.1] - 2025-02-05
### Changed
- Updated package dependencies. [#40797] [#41286] [#41577]

## 0.1.0 - 2024-12-04
### Added
- Added VideoPress Core Skeleton. [#30589]
- Add TypeScript Build [#30648]
- Enable test coverage. [#39961]

### Changed
- Update build configuration to better match supported target environments. [#35713]
- Updated package dependencies. [#31872] [#32605] [#32804] [#33001] [#33429] [#33646] [#34427] [#34816] [#35385] [#36142] [#37796] [#39004] [#39111] [#40060]

### Removed
- Remove unnecessary files from mirror repo and published package. [#32674]

### Fixed
- Remove "private" flag from package.json so package can be published. [#33744]

[0.1.6]: https://github.com/Automattic/jetpack-videopress-core/compare/0.1.5...0.1.6
[0.1.5]: https://github.com/Automattic/jetpack-videopress-core/compare/0.1.4...0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-videopress-core/compare/0.1.3...0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-videopress-core/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-videopress-core/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-videopress-core/compare/0.1.0...0.1.1
