# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2021-11-02
### Added
- Automatically add the RNA label to PRs.

### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- BREAKING: Use `pull_request_target` instead of `pull_request` for the following tasks: assignIssues, addLabels, cleanLabels, checkDescription.
- Label Task: handle new block plugin type
- Updated package dependencies.
- Update regex for e2e tests paths to add relevant labels in PRs
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.

## [1.4.0] - 2021-08-26
### Added
- Add E2E Tests label in gardening.
- Include e2e test report url in PR bot comment.
- New task: triage newly opened issues to add the proper product labels.

### Changed
- jslint formatting.
- Labels: update label names to match new naming convention in use in the monorepo.
- Labels task: update paths to support new location of the Boost plugin.
- Update `@actions/github` with attendent code adjustments.
- Update node version requirement to 14.16.1.

### Fixed
- Milestone detection: fallback to any milestone when we cannot find any with a due date.

## [1.3.0] - 2021-05-28
### Fixed
- Slack notification tasks: both tasks now listen for `pull_request_target` events so they can be run on PRs opened from forks.

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

[2.0.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.4.0...v2.0.0
[1.4.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/Automattic/action-repo-gardening/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Automattic/action-repo-gardening/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.0.0...v1.1.0
