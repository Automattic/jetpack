# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2022-07-06
### Added
- Added the ability to check against multiple tags. [#22925]

### Changed
- BREAKING: Changed the default value for the `status` input. [#22925]
- Renaming `master` references to `main` where relevant. [#24712, #24661]
- Updated package dependencies. [#24045]

### Fixed
- Disable automatic garbage collection, like GitHub's checkout action does for its own checkouts. [#23047]
- Fix documentation of the token parameter in README.md. [#22793]
- Remove a stray comma. [#23046]
- Speed up processing of tag push with paths. [#23123]
- Try and fix source file not found error by specifying path. [#23022]

## [1.0.3] - 2022-02-09
### Changed
- Core: update description and metadata before to publish to marketplace.

## [1.0.2] - 2021-12-07
### Changed
- Updated package dependencies.

## [1.0.1] - 2021-08-26
### Changed
- Avoid context expression substitution in GitHub Actions `run` steps.
- Update package dependencies.

## 1.0.0 - 2021-04-05
### Added
- Initial release.

[2.0.0]: https://github.com/Automattic/action-pr-is-up-to-date/compare/v1.0.3...v2.0.0
[1.0.3]: https://github.com/Automattic/action-pr-is-up-to-date/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Automattic/action-pr-is-up-to-date/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/action-pr-is-up-to-date/compare/v1.0.0...v1.0.1
