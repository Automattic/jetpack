# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.6.0 - 2025-04-04

### Changed
- Code: Use function-style `exit()` and `die()` with a default status code of 0. [#41167]
- General: Indicate compatibility with WordPress 6.8. [#42701]
- Update composer.lock [#40863]
- Update package dependencies. [#40515] [#40564] [#40693] [#40815] [#40980] [#41099] [#41286] [#41491] [#41577] [#41659] [#42163] [#42180] [#42384] [#42511] [#42809] [#42815]

### Fixed
- Code: Prevent dynamic class properties. [#41857]
- E2E Tests: Only install single browser used by Playwright. [#40827]

## 0.5.0 - 2024-12-04
### Added
- Add Woocommerce event remove_order_items to Jetpack Sync [#33748]
- Enable test coverage. [#39961]
- Explicitly add the Connection package as dependency [#36418]
- My Jetpack: update the recommendations section in My Jetpack to include a slider interaction for the cards. [#39850]
- New setting in /sties/$site/settings that is not relevant to this plugin. [#35509]
- Packages: add version tracking for identity-crisis package. [#36635]
- Trigger red bubble notification when bad install is detected [#36449]

### Changed
- General: indicate compatibility with the upcoming version of WordPress, 6.5. [#35820]
- General: indicate compatibility with the upcoming version of WordPress - 6.6. [#37962]
- General: indicate compatibility with the upcoming version of WordPress - 6.7. [#39786]
- General: update WordPress version requirements to WordPress 6.4. [#37047]
- General: use wp_admin_notice function introduced in WP 6.4 to display notices. [#37051]
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Only show installation errors on plugins page [#36390]
- Remove explicit Plugin Install package dependency. [#37430]
- Remove the 'jetpack-identity-crisis' dependency. [#36968]
- Resolved an issue where revoked licenses were incorrectly treated as unattached. This caused users to be redirected to the license activation page after site connection, even when unattached licenses were not valid for activation. [#40215]
- Social | Changed My Jetpack CTA for Social from "Learn more" to "Activate" [#40359]
- Update composer lock file [#38942]
- Updated dependencies. [#40286]
- Updated package dependencies. [#35591] [#35608] [#36095] [#36097] [#36142] [#36309] [#36325] [#36585] [#36760] [#36775] [#36788] [#37147] [#37348] [#37379] [#37380] [#37382] [#37669] [#37767] [#37776] [#37796] [#38132] [#38228] [#38235] [#38662] [#38822] [#39004] [#39111] [#39176] [#39278] [#39288] [#39302] [#39332] [#39594] [#39653] [#39707] [#39999] [#40060] [#40116] [#40258] [#40288] [#40363]
- Update package lock [#35672]

### Removed
- Connection: Removed deprecated method features_available [#39442]
- Connection: Removed features_enabled deprecated method [#39475]
- General: Update minimum PHP version to 7.2. [#40147]
- General: Update minimum WordPress version to 6.6. [#40146]
- General: update WordPress version requirements to WordPress 6.5. [#38382]

### Fixed
- My Jetpack: visual update to the GlobalNotice component look better on mobile. [#39537]
- Updated package dependencies. [#38464]

## 0.4.0 - 2024-02-07
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.3. [#31910]
- General: indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- General: remove WP 6.1 backwards compatibility checks [#32772]
- General: updated PHP requirement to PHP 7.0+ [#34126]
- General: update WordPress version requirements to WordPress 6.2. [#32762]
- General: update WordPress version requirements to WordPress 6.3. [#34127]
- Updated Jetpack submenu sort order so individual features are alpha-sorted. [#32958]
- Updated package dependencies.
- Update lockfile [#33607]
- Use the new method to render Connection initial state. [#32499]

## 0.3.0 - 2023-07-06
### Added
- Add authentication to zendesk chat widget [#31339]

### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.2. [#29341]
- Remove conditional rendering from zendesk chat widget component due to it being handled by an api endpoint now [#29942]
- Updated package dependencies.
- Update WordPress version requirements. Now requires version 6.1. [#30120]

## 0.2.0 - 2023-03-08
### Added
- Add support for JITMs to starter plugin [#25880]
- E2E tests: use CI build artifacts in e2e tests [#26278]
- My Jetpack includes JITMs [#22452]
- Starter Plugin: Add basic JS and PHP test setup [#27729]
- Use ThemeProvider when rendering Starter Plugin AdminPage [#25870]

### Changed
- Compatibility: WordPress 6.1 compatibility [#27084]
- E2E tests: bump dependencies [#25725]
- Updated package dependencies.
- Update playwright dependency [#28094]
- Update to React 18. [#28710]

### Removed
- E2E tests: removed deprecated Slack notification code [#26215]

### Fixed
- E2E tests: fixed pretest cleanup script not running [#25051]
- Plugin activation: Only redirect when activating from Plugins page in the browser [#25711]

## 0.1.0 - 2022-07-06
### Added
- Add activation and deactivation hooks. [#24250]
- E2E tests boilerplate. [#24723]
- Enable beta plugin support. [#23836]
- Initial release. [#23434]

### Changed
- Changed the method used to disconnect. [#24299]
- Configure Sync with the minimal amount of data. [#23759]
- Janitorial: require a more recent version of WordPress now that WP 6.0 is coming out. [#24083]
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Renaming master to trunk. [#24661]
- Renaming `master` references to `trunk`. [#24712]
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Updated package dependencies.

### Fixed
- Jetpack CLI: correctly replace project description and release-branch-prefix. [#23911]
- Updated .gitattributes file so it is able to build properly by the CI build jobs. [#23591]
