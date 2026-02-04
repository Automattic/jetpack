# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-02-04
### Changed
- Update package dependencies. [#45914] [#46143] [#46244] [#46362] [#46363] [#46430] [#46456] [#46647] [#46853] [#46854] [#46905]

### Removed
- Remove peer dependency on `@wordpress/i18n`, as it already has a non-peer dependency on the package. [#46167]

### Fixed
- `react` and `react-dom` should be peer dependencies, not direct dependencies. [#46167]

## [1.2.1] - 2025-11-21
### Changed
- Replace icons removed from @wordpress/icons with alternatives. [#45760]
- Update dependencies. [#45488]
- Update package dependencies. [#45551] [#45652] [#45735] [#45737] [#45915] [#45958] [#46022]

## [1.2.0] - 2025-10-10
### Added
- Add missing types. [#44787]

### Changed
- Update @wordpress/dataviews package. [#44376] [#45012] [#45213]
- Update package dependencies. [#44677] [#44701] [#45027] [#45097] [#45229] [#45335] [#45428]

## [1.1.0] - 2025-07-30
### Added
- Add UI confirmation via text box when deleting an extension via delete-fixer so that the user is fully aware that it may break their site. [#44521]

### Changed
- Update dependencies. [#44214]

## [1.0.2] - 2025-07-03
### Changed
- Update package dependencies. [#44148]

## [1.0.1] - 2025-06-05
### Changed
- Update package dependencies. [#43766]

## [1.0.0] - 2025-06-03
### Added
- Add threat components. [#41654]

### Changed
- Adjust relative imports in TypeScript sources to use correct extensions after enabling TypeScript's new `rewriteRelativeImportExtensions` option. The built JS should be unaffected, so this is not a breaking change. [#42990]
- Code: First pass of style coding standards. [#42734]
- Update package dependencies. [#42762] [#42806] [#42809] [#43326] [#43578] [#43711] [#43718]

### Fixed
- Code: Update stylesheets to use WordPress font styles. [#42928]
- Fixed TS type checking in the monorepo [#42817]

## [0.5.9] - 2025-03-18
### Changed
- Update package dependencies. [#42509]

## [0.5.8] - 2025-03-03
### Changed
- Update package dependencies. [#42163]

## [0.5.7] - 2025-02-24
### Changed
- Update package dependencies. [#41955]

## [0.5.6] - 2025-02-05
### Changed
- Updated package dependencies. [#41491] [#41577]

## [0.5.5] - 2025-01-23
### Changed
- Internal updates.

## [0.5.4] - 2025-01-20
### Changed
- Updated package dependencies. [#41099]

## [0.5.3] - 2025-01-06
### Changed
- Updated package dependencies. [#40798] [#40810] [#40841]

## [0.5.2] - 2024-12-16
### Changed
- Updated package dependencies. [#40564]

## [0.5.1] - 2024-12-09
### Changed
- Internal updates.

## [0.5.0] - 2024-12-04
### Added
- Added more types for working with scan results. [#40399]

### Changed
- Updated package dependencies. [#40363]

## [0.4.1] - 2024-11-28
### Fixed
- Fix package build. [#40299]

## [0.4.0] - 2024-11-26
### Added
- Adds utility for retrieving a detailed action description [#40214]

## [0.3.0] - 2024-11-25
### Added
- Adds utilities for retrieving fixer messaging [#40197]

### Changed
- Updated package dependencies. [#40288]

## [0.2.0] - 2024-11-14
### Added
- Adds fixer utility functions [#40111]

## 0.1.0 - 2024-11-11
### Added
- Added threat and fixer types. [#39754]
- Enable test coverage. [#39961]
- Initial version [#34818]

### Changed
- Make build usable in projects using tsc with `moduleResolution` set to 'nodenext'. [#35453]
- Updated package dependencies. [#35384]
- Updated package dependencies. [#35385]
- Updated package dependencies. [#35608]
- Updated package dependencies. [#35793]
- Updated package dependencies. [#36095]
- Updated package dependencies. [#36097]
- Updated package dependencies. [#36142]
- Updated package dependencies. [#36143]
- Updated package dependencies. [#36325]
- Updated package dependencies. [#36539]
- Updated package dependencies. [#36585]
- Updated package dependencies. [#36756]
- Updated package dependencies. [#36760]
- Updated package dependencies. [#36761]
- Updated package dependencies. [#37147]
- Updated package dependencies. [#37148]
- Updated package dependencies. [#37160]
- Updated package dependencies. [#37379]
- Updated package dependencies. [#37382]
- Updated package dependencies. [#37669]
- Updated package dependencies. [#37779]
- Updated package dependencies. [#37796]
- Updated package dependencies. [#38132]
- Updated package dependencies. [#38662]
- Updated package dependencies. [#38665]
- Updated package dependencies. [#38893]
- Updated package dependencies. [#39004]
- Updated package dependencies. [#39176]
- Updated package dependencies. [#39302]
- Updated package dependencies. [#39332]
- Updated package dependencies. [#39594]
- Updated package dependencies. [#39669]
- Updated package dependencies. [#39707]
- Updated package dependencies. [#39999]
- Updated package dependencies. [#40000]
- Updated package dependencies. [#40060]

### Removed
- Updated dependencies. [#39754]

[1.2.2]: https://github.com/Automattic/jetpack-scan/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Automattic/jetpack-scan/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-scan/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-scan/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/Automattic/jetpack-scan/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-scan/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Automattic/jetpack-scan/compare/v0.5.9...v1.0.0
[0.5.9]: https://github.com/Automattic/jetpack-scan/compare/v0.5.8...v0.5.9
[0.5.8]: https://github.com/Automattic/jetpack-scan/compare/v0.5.7...v0.5.8
[0.5.7]: https://github.com/Automattic/jetpack-scan/compare/v0.5.6...v0.5.7
[0.5.6]: https://github.com/Automattic/jetpack-scan/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/Automattic/jetpack-scan/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/Automattic/jetpack-scan/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/Automattic/jetpack-scan/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-scan/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-scan/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-scan/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/Automattic/jetpack-scan/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-scan/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-scan/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-scan/compare/v0.1.0...v0.2.0
