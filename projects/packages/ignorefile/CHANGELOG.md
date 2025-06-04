# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2025-05-13
### Changed
- Update dependencies. [#42002]

## [3.0.0] - 2025-01-09
### Added
- Enable test coverage. [#39961]

### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [2.1.0] - 2024-08-29
### Changed
- Add "strict mode", defaulting to off. When off, InvalidPatternException will no longer be thrown, instead the pattern will just be ignored to match `git` behavior. [#37289]
- Updated package dependencies. [#39004]

### Fixed
- Ignore a UTF-8 BOM when a string is passed to `->add()`, to match `git` behavior when reading the `.gitignore` file. [#37289]

## [2.0.0] - 2024-02-07
### Changed
- The package now requires PHP >= 7.0. [#34192]
- Updated package dependencies. [#32605]

### Removed
- Remove use of deprecated `wikimedia/at-ease` package. PHP 7 improved error handling so `@` is ok to use now. [#34217]

## [1.0.5] - 2023-06-06
### Changed
- Minor internal updates.

## [1.0.4] - 2023-02-07
### Changed
- Minor internal updates.

## [1.0.3] - 2022-11-01
### Changed
- Updated package dependencies.

## [1.0.2] - 2022-07-06
### Changed
- Renaming master to trunk. [#24661]
- Updated package dependencies. [#24045]

## [1.0.1] - 2022-03-01
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## 1.0.0 - 2021-12-22
### Added
- Initial release.

[3.0.1]: https://github.com/Automattic/ignorefile/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/Automattic/ignorefile/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/Automattic/ignorefile/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/ignorefile/compare/v1.0.5...v2.0.0
[1.0.5]: https://github.com/Automattic/ignorefile/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Automattic/ignorefile/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Automattic/ignorefile/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Automattic/ignorefile/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/ignorefile/compare/v1.0.0...v1.0.1
