# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2022-11-10
### Added
- Enable stats tracking upon establishing a site connection. [#26697]
- Search: add post type breakdown endpoint. [#26463]
- Search Dashboard: Add support link for plan limits. [#26694]
- Search Dashboard: Add support for conditional CUTs. [#26656]
- Search: enable new pricing if pricing_version is set to 202208 from API. [#26900]
- Search: add blog ID filtering and `blogIdFilteringLabels` option. [#27120]

### Changed
- Compatibility: WordPress 6.1 compatibility. [#27084]
- Ported back 1.2.0 release changelog. [#26079]
- Search: now support 38 languages. [#27025]
- Introduce PricingTable to update Upsell page. [#26408]
- Updated package dependencies. [#27283]
- Search: always add Search Dashboard page even when submenu is hidden. [#26807]
- Hide Jetpack logo toggle, enforce display for free plans. [#26951]
- Search: add purchase tracking. [#26981]

### Fixed
- Fixes the issue where search results are not loaded in customizer. [#26212]
- Fix error message styling in Instant Search overlay. [#26339]
- Search: wpcom sites should not be considered as connected. [#26835]
- Search: hide meters etc for Classic Search. [#27073]

### Other changes <!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->
- Adds ability to autotag, autorelease and autopublish releases. [#26156]
- E2E tests: use CI build artifacts in e2e tests. [#26278]
- Search: start v1.3.0-alpha release cycle. [#25854]
- E2E tests: removed deprecated Slack notification code. [#26215]

## [1.2.0] - 2022-09-05
### Added
- Instant Search: add author filtering support.
- Instant Search: add descriptions to post type icons for accessibility purposes.
- Instant Search: add focus border to search input field.
- Instant Search: always use submit overlay trigger if user prefers reduced motion.
- Instant Search: only show animation to users who have not chosen reduced motion.
- Instant Search: user friendly error messaging.
- My Jetpack: include JITMs.
- Record Meter: adds info link to docs.
- Search: add links to Search plugin line on plugins page.

### Changed
- Instant Search: updates dark mode active link color for increased contrast.
- Search: always show Search submenu when Search plugin is installed.
- Search: changed default overlay trigger to form submission.
- Search: changed to only require site level connection.
- Search: only redirect when activating from the Plugins page in the browser.
- Search: revert "Search should not require user connection".
- Updated package dependencies.

### Removed
- Search: remove 'results' overlay trigger.

### Fixed
- Dashboard: updated Instant Search description to match changes in default overlay trigger.
- Instant Search: add focus styles for easier keyboard navigation.
- Instant Search: constrain tab loop to overlay when visible.
- Instant Search: fix button styling in Twenty Twenty One theme.
- Instant Search: fix the display order on mobile to match the tab order.
- Instant Search: make "Clear filters" button accessible.
- Instant Search: remove redundant links from search results.
- Instant Search: use classname rather than ID for styling sort select.
- Search Widget: keep widget preview with settings.

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
[1.2.0-beta]: https://github.com/Automattic/jetpack-search-plugin/compare/1.1.0...1.2.0-beta
[1.3.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.2.0-beta...1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.1.0-beta...1.1.0
