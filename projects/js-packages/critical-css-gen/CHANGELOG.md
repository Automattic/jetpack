# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
