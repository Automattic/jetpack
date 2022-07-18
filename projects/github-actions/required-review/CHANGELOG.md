# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2022-07-06
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]
- The `token` parameter was effectively required, as the default `GITHUB_TOKEN` lacks the ability to read team membership. The parameter is now explicitly required. [#23995]
- Updated package dependencies. [#24045, #24573]
- Use the node16 runner instead of the deprecated node12 runner. [#23389]

### Fixed
- Fix handling of re-reviews, only look at the latest review per user. [#24000]

## [2.2.2] - 2022-02-09
### Changed
- Core: update description and metadata before to publish to marketplace.
- General: update required node version to v16.13.2

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

[3.0.0]: https://github.com/Automattic/action-required-review/compare/v2.2.2...v3.0.0
[2.2.2]: https://github.com/Automattic/action-required-review/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/Automattic/action-required-review/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Automattic/action-required-review/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Automattic/action-required-review/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/action-required-review/compare/v1...v2.0.0
