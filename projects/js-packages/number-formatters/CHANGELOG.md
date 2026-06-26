# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.5] - 2026-06-26
### Changed
- Internal updates.

## [1.2.4] - 2026-06-22
### Changed
- Update package dependencies. [#49757]

## [1.2.3] - 2026-06-15
### Changed
- Update package dependencies. [#49631]

## [1.2.2] - 2026-06-08
### Changed
- Internal updates.

## [1.2.1] - 2026-06-03
### Changed
- Internal updates.

## [1.2.0] - 2026-05-25
### Added
- Currency formatting: Add `setCurrencyOverrides` for installing a dynamic per-currency override map (e.g. from the WordPress.com currencies endpoint). Falls back to the hard-coded smallest-unit exponent overrides when not called. [#49016]

## [1.1.10] - 2026-05-21
### Changed
- Update package dependencies. [#49012]

## [1.1.9] - 2026-05-19
### Fixed
- Currency formatting: use ISO 4217 minor-unit exponent for smallest-unit conversion to correctly format IDR and other currencies where browser ICU disagrees with ISO 4217. [#48967]

## [1.1.8] - 2026-05-19
### Changed
- Internal updates.

## [1.1.7] - 2026-05-04
### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]

## [1.1.6] - 2026-04-15
### Changed
- Internal updates.

## [1.1.5] - 2026-04-09
### Changed
- Internal updates.

## [1.1.4] - 2026-04-06
### Changed
- Update package dependencies. [#47887]

### Fixed
- Access wp.date settings directly. [#47812]

## [1.1.3] - 2026-03-30
### Changed
- Update package dependencies. [#47799]

## [1.1.2] - 2026-03-16
### Changed
- Tests: Disable test incompatible with newer Node versions (22.22.1+). [#47588]

## [1.1.1] - 2026-03-09
### Changed
- Switch to Native TypeScript compiler based on Go. [#47375]

## [1.1.0] - 2026-02-23
### Added
- `getCurrencyObject`: Add `floatValue` property to currency object. [#47203]

## [1.0.18] - 2026-02-18
### Changed
- Set `.repository.url` in `package.json` to the mirror repo rather than the monorepo. [#47149]

## [1.0.17] - 2026-02-12
### Changed
- Update package dependencies. [#47099]

## [1.0.16] - 2026-01-14
### Changed
- Internal updates.

## [1.0.15] - 2025-11-17
### Changed
- Update package dependencies. [#45958]

## [1.0.14] - 2025-10-28
### Changed
- Update package dependencies. [#45652]

## [1.0.13] - 2025-10-02
### Changed
- Update package dependencies. [#45334]

## [1.0.12] - 2025-09-19
### Changed
- Update package dependencies. [#45239]

## [1.0.11] - 2025-09-08
### Changed
- Update package dependencies. [#45097]

## [1.0.10] - 2025-08-01
### Changed
- Internal updates.

## [1.0.9] - 2025-07-21
### Changed
- Update package dependencies. [#44356]

## [1.0.8] - 2025-07-08
### Changed
- Update package dependencies. [#44217]

## [1.0.7] - 2025-07-03
### Changed
- Update package dependencies. [#44151]

## [1.0.6] - 2025-06-19
### Changed
- Internal updates.

## [1.0.5] - 2025-06-18
### Changed
- Internal updates.

## [1.0.4] - 2025-06-04
### Changed
- Update package dependencies. [#43766]

## [1.0.3] - 2025-06-03
### Changed
- Update package dependencies. [#43734]

## [1.0.2] - 2025-05-19
### Changed
- Internal updates.

## [1.0.1] - 2025-05-12
### Changed
- Update package dependencies. [#43320]

## [1.0.0] - 2025-04-29
### Changed
- Build CJS and ESM versions with TypeScript [#43106]

## [1.0.0-alpha.2] - 2025-04-10
### Changed
- Adjust relative imports in TypeScript sources to use correct extensions after enabling TypeScript's new `rewriteRelativeImportExtensions` option. The built JS should be unaffected, so this is not a breaking change. [#42990]
- Convert build to common-js [#42982]

## [1.0.0-alpha.1] - 2025-04-10
### Changed
- Internal updates.

## [1.0.0-alpha.1] - 2025-04-07
### Added
- initial release [#42639]
- introduce fallback locale logic [#42872]

### Changed
- Update package dependencies. [#42762]

### Fixed
- Fixed TS type checking in the monorepo [#42817]

## 0.1.0 - 2025-03-18
### Added
- Initial release
- Basic number formatting functionality

[1.2.5]: https://github.com/Automattic/number-formatters/compare/1.2.4...1.2.5
[1.2.4]: https://github.com/Automattic/number-formatters/compare/1.2.3...1.2.4
[1.2.3]: https://github.com/Automattic/number-formatters/compare/1.2.2...1.2.3
[1.2.2]: https://github.com/Automattic/number-formatters/compare/1.2.1...1.2.2
[1.2.1]: https://github.com/Automattic/number-formatters/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/Automattic/number-formatters/compare/1.1.10...1.2.0
[1.1.10]: https://github.com/Automattic/number-formatters/compare/1.1.9...1.1.10
[1.1.9]: https://github.com/Automattic/number-formatters/compare/1.1.8...1.1.9
[1.1.8]: https://github.com/Automattic/number-formatters/compare/1.1.7...1.1.8
[1.1.7]: https://github.com/Automattic/number-formatters/compare/1.1.6...1.1.7
[1.1.6]: https://github.com/Automattic/number-formatters/compare/1.1.5...1.1.6
[1.1.5]: https://github.com/Automattic/number-formatters/compare/1.1.4...1.1.5
[1.1.4]: https://github.com/Automattic/number-formatters/compare/1.1.3...1.1.4
[1.1.3]: https://github.com/Automattic/number-formatters/compare/1.1.2...1.1.3
[1.1.2]: https://github.com/Automattic/number-formatters/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/Automattic/number-formatters/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/Automattic/number-formatters/compare/1.0.18...1.1.0
[1.0.18]: https://github.com/Automattic/number-formatters/compare/1.0.17...1.0.18
[1.0.17]: https://github.com/Automattic/number-formatters/compare/1.0.16...1.0.17
[1.0.16]: https://github.com/Automattic/number-formatters/compare/1.0.15...1.0.16
[1.0.15]: https://github.com/Automattic/number-formatters/compare/1.0.14...1.0.15
[1.0.14]: https://github.com/Automattic/number-formatters/compare/1.0.13...1.0.14
[1.0.13]: https://github.com/Automattic/number-formatters/compare/1.0.12...1.0.13
[1.0.12]: https://github.com/Automattic/number-formatters/compare/1.0.11...1.0.12
[1.0.11]: https://github.com/Automattic/number-formatters/compare/1.0.10...1.0.11
[1.0.10]: https://github.com/Automattic/number-formatters/compare/1.0.9...1.0.10
[1.0.9]: https://github.com/Automattic/number-formatters/compare/1.0.8...1.0.9
[1.0.8]: https://github.com/Automattic/number-formatters/compare/1.0.7...1.0.8
[1.0.7]: https://github.com/Automattic/number-formatters/compare/1.0.6...1.0.7
[1.0.6]: https://github.com/Automattic/number-formatters/compare/1.0.5...1.0.6
[1.0.5]: https://github.com/Automattic/number-formatters/compare/1.0.4...1.0.5
[1.0.4]: https://github.com/Automattic/number-formatters/compare/1.0.3...1.0.4
[1.0.3]: https://github.com/Automattic/number-formatters/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/Automattic/number-formatters/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/Automattic/number-formatters/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/Automattic/number-formatters/compare/1.0.0-alpha.2...1.0.0
[1.0.0-alpha.2]: https://github.com/Automattic/number-formatters/compare/1.0.0-alpha.1...1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/Automattic/number-formatters/compare/0.1.0...1.0.0-alpha.1
