# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0-beta] - 2022-08-25
### Added
- Adds links to Search plugin line on plugins page [#25718]
- My Jetpack includes JITMs [#22452]
- Search: start v1.2.0-alpha release [#25320]

### Changed
- Activation: only redirect when activating from the Plugins page in the browser [#25715]
- E2E tests: bump dependencies [#25725]
- Search: always show Search submenu when Search plugin is installed [#25774]
- Search: changed default overlay trigger to form submission [#25093]
- Updated package dependencies.

## [1.1.0] - 2022-08-02
### Added
- Dashboard: new Record Meter feature to show the breakdown of records in your search index.

### Fixed
- Customization: fix fill color for gridicons in dark mode.
- Customization: hide unsupported taxonomies from Search widget.
- Customization: re-enable auto-collapsing sidebar in Customberg.
- Dashboard: fix currency code in upsell page.
- Dashboard: fix pricing issue before site is connected to Jetpack.
- Dashboard: minor CSS changes for Hello Dolly compatibility.
- Instant Search: avoid search query on component mount.
- Instant Search: consistent design for focus states in Search overlay.
- Instant Search: don't open modal if only sort parameter is set.
- Instant Search: fix header letter spacing in modal.
- Instant Search: fix irrelevant widgets added to sidebar during auto config.
- Instant Search: fix keyboard handling on search options.
- Instant Search: prevent hidden submit button appearing on focus.
- Instant Search: restore support for filtering by multiple post types with post_type=.
- Search: redirect to the Search Dashboard on activation only when Jetpack plugin does not exist.

## 1.0.0 - 2022-05-30
### Added
- Initial release.

[1.1.0-beta]: https://github.com/Automattic/jetpack-search-plugin/compare/1.0.0...1.1.0-beta
[1.2.0-beta]: https://github.com/Automattic/jetpack-search-plugin/compare/v1.1.0...v1.2.0-beta
[1.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.1.0-beta...1.1.0
