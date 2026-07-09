# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.4] - 2026-06-26
### Changed
- Internal updates.

## [2.0.3] - 2026-06-24
### Changed
- Update package dependencies. [#49631]
- Update package dependencies. [#49757]
- Update package dependencies. [#49831]

## [2.0.2] - 2026-06-10
### Changed
- Update dependencies. [#49488]

## [2.0.1] - 2026-06-08
### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Update dependencies. [#48210]
- Update package dependencies. [#49012]
- Update package dependencies. [#49133]
- Update package dependencies. [#49218]

## [2.0.0] - 2026-04-13
### Changed
- Bump minimum Node version to 20.11. [#47770]
- Update dependencies. [#47600]
- Update package dependencies. [#47799]
- Update package dependencies. [#47842]
- Update package dependencies. [#47998]

## [1.0.27] - 2026-03-09
### Changed
- Set `.repository.url` in `package.json` to the mirror repo rather than the monorepo. Required for enabling provenance. [#47149]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update package dependencies. [#47002] [#47099] [#47173] [#47285] [#47371]

## [1.0.26] - 2026-02-03
### Changed
- Update dependencies. [#46893]

## [1.0.25] - 2026-01-26
### Changed
- Update dependencies. [#46662]

## [1.0.24] - 2026-01-07
### Changed
- Internal updates.

## [1.0.23] - 2025-12-11
### Changed
- Update dependencies. [#46157]
- Update package dependencies. [#46161]

## [1.0.22] - 2025-11-25
### Changed
- Update package dependencies. [#45958]

## [1.0.21] - 2025-10-28
### Changed
- Update package dependencies. [#45652]

## [1.0.20] - 2025-10-14
### Changed
- Update package dependencies. [#45173] [#45241] [#45298] [#45334] [#45335]

## [1.0.19] - 2025-09-17
### Changed
- Update package dependencies. [#45097]
- Update package dependencies. [#45200]

## [1.0.18] - 2025-08-21
### Added
- Add `typecheck` script to ensure that TypeScript files are type-checked. [#44795]

### Changed
- Update dependencies. [#44736]

### Fixed
- Fix not picking up stylesheets when their rel attribute was more complex. [#44753]

## [1.0.17] - 2025-08-05
### Changed
- Internal updates.

## [1.0.16] - 2025-07-23
### Changed
- Update package dependencies. [#44356]

## [1.0.15] - 2025-07-08
### Changed
- Update dependencies. [#44142]
- Update package dependencies. [#44151] [#44217]

## [1.0.14] - 2025-06-23
### Fixed
- Playwright interface: Fix page redirects from breaking the generation process. [#43929]

## [1.0.13] - 2025-06-11
### Changed
- Update dependencies. [#43569]
- Update package dependencies. [#43734] [#43766]

## [1.0.12] - 2025-05-15
### Fixed
- Linting: Fix more Stylelint violations. [#43213]

## [1.0.11] - 2025-04-16
### Changed
- Adjust relative imports in TypeScript sources to use correct extensions after enabling TypeScript's new `rewriteRelativeImportExtensions` option. The built JS should be unaffected, so this is not a breaking change. [#42990]
- Update dependencies. [#42830]
- Update package dependencies. [#43071]

### Fixed
- Fix not returning correct URL when a page is 404. [#42856]

## [1.0.10] - 2025-04-01
### Changed
- Update package dependencies. [#42762]

## [1.0.9] - 2025-03-26
### Fixed
- Fix throwing exceptions during ATF selector collection causing the whole generation to fail. [#42613]

## [1.0.8] - 2025-03-18
### Changed
- Update package dependencies. [#42406] [#42511]

### Fixed
- Fix potential memory leak. [#41354]

## [1.0.7] - 2025-03-05
### Changed
- Update dependencies. [#41847]

### Fixed
- Prevent invalid URLs from breaking the whole process. [#41946]

## [1.0.6] - 2025-02-12
### Changed
- Updated package dependencies. [#41286]

## [1.0.5] - 2025-01-23
### Changed
- Internal updates.

## [1.0.4] - 2025-01-06
### Changed
- Updated package dependencies. [#40372] [#40498] [#40693] [#40798]

### Removed
- Remove unused prettier dep. [#40434]

## [1.0.3] - 2024-11-28
### Changed
- Updated package dependencies. [#40060]

## [1.0.2] - 2024-11-04
### Added
- Enable test coverage. [#39961]

### Changed
- Updated package dependencies. [#39733]

## [1.0.1] - 2024-10-10
### Changed
- Updated package dependencies. [#39670]

### Fixed
- Add missing build folder to package. [#39723]

## [1.0.0] - 2024-10-07
### Security
- Security: Fix XSS vulnerability. [#39507]

### Added
- Add /playwright entry point for BrowserInterfacePlaywright. [#39509]

### Changed
- Change default entry point of package to include BrowserInterfaceIframe instead of BrowserInterfacePlaywright. [#39509]

## 0.1.0 - 2024-09-24
### Added
- Initial version. [#38429]

[2.0.4]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.27...v2.0.0
[1.0.27]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.26...v1.0.27
[1.0.26]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.25...v1.0.26
[1.0.25]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.24...v1.0.25
[1.0.24]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.23...v1.0.24
[1.0.23]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.22...v1.0.23
[1.0.22]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.21...v1.0.22
[1.0.21]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.20...v1.0.21
[1.0.20]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.19...v1.0.20
[1.0.19]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.18...v1.0.19
[1.0.18]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.17...v1.0.18
[1.0.17]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.16...v1.0.17
[1.0.16]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.15...v1.0.16
[1.0.15]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.14...v1.0.15
[1.0.14]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.13...v1.0.14
[1.0.13]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.12...v1.0.13
[1.0.12]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Automattic/jetpack-critical-css-gen/compare/v0.1.0...v1.0.0
