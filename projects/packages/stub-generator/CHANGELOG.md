# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-10-15
### Added
- Add config option `strip-docs-keep-tags`, which works like `strip-docs` but preserves unrecognized tags. [#49169]
- strip-docs: Recognize additional tags: `@abstract`, `@extends`, `@inherits`, `@mixin`, `@no-named-arguments`, `@phan-closure-scope`, `@readonly`, `@seal-methods`, `@seal-properties`, `@unused-param`. [#49169]

### Fixed
- Remove trailing whitespace when stripping tag descriptions. [#49169]

## [2.1.0] - 2026-05-13
### Added
- Allow extracting enum stubs. [#47233]

### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]

## [2.0.1] - 2026-01-12
### Changed
- Internal updates.

## [2.0.0] - 2025-05-13
### Removed
- Drop support for installation with Composer < 2.2. [#41876]

## [1.0.1] - 2024-12-04
### Added
- Enable test coverage. [#39961]

### Changed
- Updated dependencies. [#40286]
- Updated package dependencies. [#39004]

## 1.0.0 - 2024-05-22
### Added
- Initial version.

[2.2.0]: https://github.com/Automattic/jetpack-stub-generator/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Automattic/jetpack-stub-generator/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/Automattic/jetpack-stub-generator/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Automattic/jetpack-stub-generator/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/Automattic/jetpack-stub-generator/compare/v1.0.0...v1.0.1
