# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2023-05-22
### Changed
- PHP8 compatibility updates. [#30729]

## [2.2.0] - 2023-05-12
### Changed
- Added plan_completed step for start-writing flow instead of plan_selected [#30686]

### Fixed
- Ensure calling Launchpad_Task_Lists::list() with an empty ID doesn't result in a PHP warning. [#30509]

## [2.1.0] - 2023-05-11
### Added
- Add start writing checklist and task definitions to Launchpad Checklist API [#30369]
- Launchpad API improvements and compat [#30527]

## [2.0.0] - 2023-05-08
### Added
- Refactor the Launchpad task list API [#30397]

### Changed
- Migrates Launchpad business logic from the mu-plugin to being defined by tasks [#30472]

### Fixed
- Avoid hooking Map settings multiple times. [#30454]
- Ensure Map block settings get hooked to existing block bbubundle. [#30453]

## [1.7.0] - 2023-05-03
### Added
- Refactor the Launchpad task list API

## [1.6.0] - 2023-05-02
### Added
- Add API to query Zendesk chat availability and use it to conditionally display zendesk chat [#29942]
- Add map_block_settings global [#30287]
- Launchpad: Return checklist from main endpoint. [#30227]

### Changed
- Launchpad: Update text strings. [#30286]
- Updated project dependencies. [#30292]

## [1.5.1] - 2023-05-01
### Changed
- Version update [#30293]

### Fixed
- Launchpad API: Address excess queries [#30361]

## [1.5.0] - 2023-04-25
### Security
- Sanitize cand validate checklist slug query param [#30112]

### Added
- Add newsletter task dedefinitions to launchpad checklist API endpoints [#30078]
- Fixed a bug where only the first option was updated and added unit tests. [#30096]
- Launchpad Checklist API: Adds registry to easily manage Launchpad checklists [#30211]
- SLaunchpad Checklist API: add task definitions for the Launchpad free flow [#30146]
- Update launchpad checklist API twrite flow task definitions to use site option data [#30116]
- Update launchpad checklist API twrite flow task definitions to use site option data [#30117]

### Changed
- Launchpad Checklist API: Update VideoPress tasks [#30141]

### Fixed
- change link_in_bio_launched dependency to link_edited [#30176]

## [1.4.0] - 2023-04-17
### Added
- Added Launchpad Checklist API scaffolding code [#30023]
- Launchpad: Add link-in-bio task logic to endpoint [#30076]

### Removed
- Removed namespacing of jetpack-mu-wpcom launchpad feature [#30044]

### Fixed
- Launchpad: Fixed variable scope issue with endpoint [#30069]

## [1.3.1] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [1.3.0] - 2023-04-05
### Added
- Add jetpack-mu-wpcom launchpad update site settings endpoint [#29841]

## [1.2.1] - 2023-03-28
### Changed
- Minor internal updates.

## [1.2.0] - 2023-03-27
### Added
- Fix for the unified navigation on mobile in WordPress 6.2. [#29716]

## [1.1.3] - 2023-03-20
### Changed
- Updated package dependencies. [#29480]

## [1.1.2] - 2023-03-10
### Fixed
- Coming Soon: use DVH units when available to fix height on iPhones [#29416]

## [1.1.1] - 2023-03-09
### Fixed
- Check for existence of wpcom_rest_api_v2_load_plugin function before loading wpcom endpoints. [#29399]

## [1.1.0] - 2023-03-08
### Added
- Add a Launchpad REST API endpoint for cross-platform benefit [#29082]

## [1.0.1] - 2023-02-28
### Changed
- Updated checks for loading the coming soon feature. [#28932]

### Fixed
- Fix undefined is_plugin_active fatal on wpcom. [#29158]

## 1.0.0 - 2023-02-28

- Bump non-zero major version.

## [0.2.2] - 2023-02-20
### Changed
- Minor internal updates.

## [0.2.1] - 2023-02-15
### Fixed
- Check array key exists before access. [#28931]

## [0.2.0] - 2023-02-09
### Changed
- Bumping major package version past zero. [#28880]

## [0.1.2] - 2023-02-06

- Migrate code from 'Automattic/jetpack/pull/27815'.

## 0.1.1 - 2023-01-27

- Minor internal updates.

## 0.1.0 - 2023-01-19

- Testing initial package release.

[2.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.7.0...v2.0.0
[1.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.0.0...v1.0.1
[0.2.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.1.1...v0.1.2
