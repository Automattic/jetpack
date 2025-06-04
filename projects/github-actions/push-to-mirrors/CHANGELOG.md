# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.2] - 2025-05-13
### Changed
- Update dependencies. [#42002]

## [2.2.1] - 2025-01-09
### Changed
- Update dependencies. [#40194]

## [2.2.0] - 2024-08-29
### Added
- Add footers like `Upstream-Ref: owner/repo@sha` to mirrored commits, to make it easy to find the source of any particular mirrored commit. New workflow parameter `no-upstream-refs` may be set to disable this. [#36850]
- Use the `Upstream-Ref` footers to find better base commits for newly-mirrored branches. Add workflow parameters `upstream-ref-count` and `upstream-ref-since` to control how many commits are searched. [#36850]

### Changed
- Disable git automatic garbage collection. No point to it as the local repos will be immediately discarded. [#36902]

## [2.1.0] - 2024-02-07
### Added
- Added support for GitHub Enterprise by replacing github.com with a dynamic variable [#32974]

### Changed
- Update example in readme to use `actions/checkout@v4`. [#35262]

## [2.0.0] - 2022-11-23
### Changed
- It is now considered an error if the mirror repo does not exist. [#27523]
- Updated package dependencies. [#27043]

### Fixed
- When running the script locally for testing, do not require `API_TOKEN_GITHUB`. [#27208]

## [1.0.5] - 2022-11-01
### Added
- Tooling: enable automatic GitHub releases when a new version of the action is tagged, so the new version can be made available in the GitHub Actions marketplace.

## [1.0.4] - 2022-08-03
### Added
- Log the fetched base revision when preparing the push.

### Changed
- Renaming `master` references to `main`
- Updated package dependencies.
- Update version of `actions/checkout` in doc example.

## [1.0.3] - 2022-02-09
### Changed
- Core: update description and metadata before to publish to marketplace.

## [1.0.2] - 2021-12-07
### Changed
- Updated package dependencies.

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

[2.2.2]: https://github.com/Automattic/action-push-to-mirrors/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/Automattic/action-push-to-mirrors/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Automattic/action-push-to-mirrors/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Automattic/action-push-to-mirrors/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/action-push-to-mirrors/compare/v1.0.5...v2.0.0
[1.0.5]: https://github.com/Automattic/action-push-to-mirrors/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Automattic/action-push-to-mirrors/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Automattic/action-push-to-mirrors/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Automattic/action-push-to-mirrors/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/action-push-to-mirrors/compare/v1.0.0...v1.0.1
