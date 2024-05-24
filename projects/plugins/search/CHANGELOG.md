# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-05-23
### Added
- Trigger a red bubble notification when bad plugin install is detected. [#36449]

### Changed
- Update WordPRess tested version to 6.5. [#35820]
- Update minimum WordPress version requirement to WordPress 6.4. [#37047]
- Only show installation errors on the plugins page. [#36390]
- Show My Jetpack link on the plugins page even if the plugin is not installed. [#35523]

## [2.0.0] - 2024-02-07
### Added
- Allow users to select price as default sorting option for search [#35167]
- Implemented a "tabbed" variation for static filters. This adds tabs on top of the results for each filter group. [#29811]

### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- General: update WordPress version requirements to WordPress 6.3. [#34127]
- General: updated PHP requirement to PHP 7.0+ [#34126]

## [1.4.1] - 2023-03-08
### Changed
- Remove `ci.targets` from package.json. Better scoping of e2e tests. [#28913]
- Update playwright dependency. [#28094]
- Updated package dependencies.

## [1.4.0] - 2022-12-12
### Added
- Search: port Search plugin 1.3.1 changelog and plugin description [#27399]

### Changed
- My Jetpack: Requires connection only if needed [#27615]
- My Jetpack: Show My Jetpack even if site is disconnected [#26967]
- Updated package dependencies. [#26069]

### Fixed
- Search: Fixed E2E testing failures after adding a checkmark icon for resolved topics [#27586]
- Search: fixed search E2E failure after the new pricing update [#27430]

## [1.3.1] - 2022-11-13
### Fixed
- Fixed readme and descriptions for Free tier support and new pricing [#27341]

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
[2.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/2.0.0...2.1.0
[2.0.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.4.1...2.0.0
[1.4.1]: https://github.com/Automattic/jetpack-search-plugin/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.3.1...1.4.0
[1.3.1]: https://github.com/Automattic/jetpack-search-plugin/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.2.0-beta...1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-search-plugin/compare/1.1.0-beta...1.1.0
