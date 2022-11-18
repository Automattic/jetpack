# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2022-11-01
### Added
- Add failure details from Playwright test runner JSON report
- Add rules configuration
- Add suite name option
- Add tests
- Initial release
- Tooling: enable automatic GitHub releases when a new version of the action is tagged, so the new version can be made available in the GitHub Actions marketplace.
- Upload screenshots from Playwright
- Use glob pattern to define refs in notification rules

### Changed
- Group notifications
- Improved tests
- Only send notifications for failures
- Style notifications
- Truncate long commit messages
- Updated package dependencies.

### Fixed
- Fixed missing commit url for workflow_run event
- Fixed notifications for event of type schedule
- Fixed notifications for schedule event
- Fix empty blocks for unsupported events. Add support for workflow_run event.
- Remove duplicated last run button for scheduled event notification
- Remove duplicated last run button for workflow_run events
