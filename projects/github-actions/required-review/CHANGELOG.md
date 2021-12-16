# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2021-11-02
### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- Updated package dependencies.
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.

## [2.2.0] - 2021-08-20
### Fixed
- A negated pattern (other than the first) now removes previously-matched paths, rather than unexpectedly adding _all_ the paths that don't match the pattern.

## [2.1.0] - 2021-08-12
### Added
- Added autotagger action to simplify releases
- Added support for naming individual users as required reviewers
- Created a changelog from the git history with help from [auto-changelog](https://www.npmjs.com/package/auto-changelog).

### Changed
- Updated package dependencies
- Updated `@actions/github` with attendent code adjustments.
- Update node version requirement to 14.16.1

## [2.0.0] - 2021-02-03

- Rewrite required-review action to add path-based requirements

## 1.0.0 - 2020-04-17

- Initial release

[2.2.1]: https://github.com/Automattic/action-required-review/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Automattic/action-required-review/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Automattic/action-required-review/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/action-required-review/compare/v1...v2.0.0
