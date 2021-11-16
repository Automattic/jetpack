# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2021-08-26
### Added
- Add autotagger action to simplify releases.
- Created a changelog from the git history with help from [auto-changelog](https://www.npmjs.com/package/auto-changelog). It could probably use cleanup!

### Changed
- Avoid context expression substitution in GitHub Actions `run` steps.
- Avoid setting global state during the action.
- Update package dependencies.

### Fixed
- Correctly supply git auth token.

## 1.0.0 - 2021-02-01

- Initial release

[1.0.1]: https://github.com/Automattic/action-push-to-mirrors/compare/v1.0.0...v1.0.1
