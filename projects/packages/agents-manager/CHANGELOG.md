# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.2] - 2026-08-10
### Added
- Expose `isWpcomPlatform` in the `agentsManagerData` inline data so the frontend can gate WordPress.com-only menu items. [#51067]

## [0.9.1] - 2026-08-06
### Fixed
- Allow integrations to request the full Agents Manager shell without taking over the Help Center. [#50922]

## [0.9.0] - 2026-08-03
### Changed
- Dock the AI sidebar on shorter screens instead of floating it over the page content. [#50999]

### Fixed
- Fix missing AI entry points in the editor admin bar on sites running Gutenberg 23.5 or later. [#50905]
- Prevent Agents Manager from loading a second time inside plugin information modals. [#50921]

## [0.8.4] - 2026-07-27
### Changed
- Update package dependencies. [#50751]

## [0.8.3] - 2026-07-22
### Changed
- Internal updates.

## [0.8.2] - 2026-07-20
### Changed
- Update package dependencies. [#50510] [#50529]

## [0.8.1] - 2026-07-13
### Changed
- Update dependencies.

## [0.8.0] - 2026-07-09
### Changed
- Site Editor: Restore the AI chat on the navigation view. [#50273]

## [0.7.0] - 2026-07-06
### Added
- Load translation files for the UI so it can be displayed in the user's language. [#50069]

### Changed
- Show the editor Ask AI button whenever manager is enabled, instead of only in dev contexts. [#50075]
- Update package dependencies. [#50097] [#50183]

### Fixed
- Site Editor: Skip the docked-sidebar pre-render on the navigation view, where the chat can't dock — only the editing canvas (`?canvas=edit`) docks the chat. [#50120]

## [0.6.0] - 2026-06-29
### Added
- Add Ask AI and Help entry points to the block editor omnibar. [#49967]

## [0.5.3] - 2026-06-26
### Changed
- Internal updates.

## [0.5.2] - 2026-06-23
### Changed
- Update package dependencies. [#49831]

## [0.5.1] - 2026-06-22
### Changed
- Update package dependencies. [#49691] [#49757]

### Fixed
- Dequeue Help Center only in the block editor when the full unified experience is active, so Help Center stays available in block-editor-only mode. [#49750]

## [0.5.0] - 2026-06-15
### Changed
- Update package dependencies. [#49631]

### Fixed
- Agents Manager: Bootstrap hooks exactly once even if multiple versions of the class are shipped. [#49636]
- Agents Manager: drive the sidebar pre-render from the persisted open state (cached in a transient) instead of a path-scoped cookie, and only pre-render where the app is actually loaded, so closing the assistant on another domain no longer leaves a stale sidebar shell behind. [#49439]

## [0.4.0] - 2026-06-15
### Added
- Add a standalone AI chat button to the admin bar. [#49455]
- Persist the Agents Manager minimized and last-activity state via the open-state endpoint. [#49565]

## [0.3.2] - 2026-06-10
### Changed
- Update package dependencies. [#49273] [#49492]

## [0.3.1] - 2026-06-08
### Changed
- Internal updates.

## [0.3.0] - 2026-06-05
### Added
- Agents Manager: Add the jetpack-ai-jwt REST endpoint, moved from the My Jetpack package. [#49415]

## [0.2.1] - 2026-06-03
### Fixed
- Agents Manager: Include build folder when pushing changes to mirror repo. [#49383]

## [0.2.0] - 2026-06-03
### Added
- Agents Manager: Ensure sidebar preserves open state on load. [#49325]

## 0.1.0 - 2026-06-02
### Added
- Agents Manager: Allow overriding variant and sectionName through filters [#49283]
- Initial version, extracted from Jetpack MU WPCOM to its own package for external consumption. [#49202]

[0.9.2]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.8.4...v0.9.0
[0.8.4]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.5.3...v0.6.0
[0.5.3]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-agents-manager/compare/v0.1.0...v0.2.0
