# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2022-09-06
### Added
- Instant Search: add author filtering support.
- Search: add links to Search plugin line on plugins page.
- Instant Search: add descriptions to post type icons for accessibility purposes.
- Record Meter: adds info link to docs.
- Instant Search: always use submit overlay trigger if user prefers reduced motion.
- Instant Search: only show animation to users who have not chosen reduced motion.
- Instant Search: user friendly error messaging.
- Instant Search: add focus border to search input field.
- My Jetpack: include JITMs.

### Changed
- Search: always show Search submenu when Search plugin is installed.
- Search: changed default overlay trigger to form submission.
- Instant Search: updates dark mode active link color for increased contrast.
- Search: changed to only require site level connection.
- Search: revert "Search should not require user connection".
- Search: only redirect when activating from the Plugins page in the browser.
- Updated package dependencies.

### Fixed
- Dashboard: updated Instant Search description to match changes in default overlay trigger.
- Instant Search: constrain tab loop to overlay when visible.
- Instant Search: make "Clear filters" button accessible.
- Instant Search: fix button styling in Twenty Twenty One theme.
- Instant Search: fix the display order on mobile to match the tab order.
- Instant Search: use classname rather than ID for styling sort select.
- Instant Search: add focus styles for easier keyboard navigation.
- Instant Search: remove redundant links from search results.
- Search Widget: keep widget preview with settings.

### Removed
- Search: remove 'results' overlay trigger.

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
