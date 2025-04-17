# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

[1.0.0-alpha.2]: https://github.com/Automattic/number-formatters/compare/1.0.0-alpha.1...1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/Automattic/number-formatters/compare/0.1.0...1.0.0-alpha.1
