# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2021-05-21
### Fixed
- Boost: fix module name; it does not need to include a [Block] prefix.

## [1.2.1] - 2021-05-20
### Added
- Cache API calls for fetching labels and files on the PR.

### Changed
- Check Description task: update changelogger instructions to recommend the use of the CLI tool.
- Labels: handle Jetpack Boost plugin structure when automatically managing labels.
- Updated package dependencies

## [1.2.0] - 2021-04-16
### Added
- Add new Flag OSS task: flags entries by external contributors, adds an "OSS Citizen" label to the PR, and sends a Slack message.

### Changed
- Description task: do not add the "Needs Author Reply" label if the PR is still being worked on (the "In Progress" label is in use).

## [1.1.0] - 2021-03-31
### Added
- Add a new task to notify Editorial team when we want their feedback.
- Added autotagger action to simplify releases

### Changed
- Automatically add "JS Package" PR label.
- Expand list of labels to clean up after a PR has been merged.
- Mark parameters that are not used by all tasks as optional.

### Fixed
- handle production files for external use

## 1.0.0 - 2020-07-07

- Initial release

[1.2.2]: https://github.com/Automattic/action-repo-gardening/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Automattic/action-repo-gardening/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.0.0...v1.1.0
