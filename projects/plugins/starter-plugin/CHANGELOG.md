# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.11.0 - 2026-10-14
### Added
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed. [#51441]

### Changed
- Boost: Wait up to four minutes for slow speed tests in My Jetpack instead of timing out after two. [#51605]
- Charts: follow the WordPress admin color scheme for chart series colors. [#51535]
- General: Update minimum WordPress version to 7.0. [#49021] [#51370]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- My Jetpack: Show what Paid Stats actually adds — UTM tracking, device stats, and region & city locations — instead of commercial use. [#51410]
- Remove unneeded development and documentation files from the published plugin. [#49014]
- Tested up to WordPress 7.1. [#48114] [#51370]
- Update composer.lock files. [#49415]
- Updated package dependencies. [#48735] [#48064] [#48106] [#48405] [#48683] [#49012] [#49218] [#49273] [#49448] [#49492] [#49631] [#49691] [#49757] [#49831] [#50097] [#50183] [#50436] [#50510] [#50529] [#50751] [#51399] [#51701] [#51802] [#52028] [#52187] [#52297] [#52999]

### Removed
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]

### Fixed
- Charts: draw labels at the design system's font weight and size. [#51452]
- Fix fatal error on My Jetpack when the current stable Jetpack plugin is active. [#49994]
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs. [#51441]
- My Jetpack: keep the stats chart tooltip under sticky and fixed page elements. [#51640]
- My Jetpack: Stop repeating the partner lookup request on every page load. [#51441]
- My Jetpack: Stop the Stats dashboard from asking which plan you want again after Start for Free was already chosen. [#51413]

## 0.10.0 - 2026-04-10
### Added
- Add Jetpack Protect details page for users without the dedicated Jetpack Protect plugin. [#46630]

### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- My Jetpack: Check red bubble notification async when cache is not available. [#46396]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update admin page footer design. [#47840]
- Update composer.lock. [#46686]
- Update dependencies. [#47472]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#46552] [#46647] [#46785] [#46854] [#47002] [#47021] [#47099] [#47173] [#47285] [#47300] [#47371] [#47496] [#47505] [#47684] [#47799] [#47825] [#47890] [#47998]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Admin Page: Restore border on header component. [#47425]

## 0.9.0 - 2026-01-09
### Added
- IDC: Add revalidation for IDCs. [#46268]
- Tested up to WordPress 6.9 [#45571]

### Changed
- Update dependencies. [#45179]
- Update package dependencies. [#45173] [#45200] [#45229] [#45298] [#45299] [#45334] [#45478] [#45652] [#45676] [#45756] [#45915] [#45958] [#46143] [#46456]

### Fixed
- Ensure proper flags are used with `json_encode()`. [#46117]
- Jetpack: remove getIconColor functions for block icons. [#45992]
- My Jetpack: Fix expiring renewal prompt to show all products. [#45995]
- My Jetpack page: fix visual compatibility issue with Hello Dolly plugin. [#45474]

## 0.8.0 - 2025-09-09
### Added
- Add typecheck support for E2E tests. [#44788]
- My Jetpack: Add analytics for empty product search results. [#44344]

### Changed
- Improve performance of WordPress.com comment likes by caching and minimizing API requests. [#44205]
- My Jetpack: Enable access to My Jetpack on WP Multisite. [#44260]
- My Jetpack: Fix multisite availability check for restricted products and modules. [#44710]
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- My Jetpack: Update Stats card to include a chart for better analytics. [#43870]
- Remove CRM installation nudge for Complete plan users. [#45026]
- Sync: Ignore the ActivityPub Outbox CPT. [#44222]
- Update package dependencies. [#44020] [#44148] [#44151] [#44206] [#44217] [#44356] [#44677] [#44701] [#44725] [#45027] [#45096] [#45097]

### Fixed
- JITM: Fix ineffective caching due to expired plugin sync transient [#44117]
- JITM: Remove jQuery dependency. [#43783]
- My Jetpack: Fix footer alignment for disconnected accounts. [#44468]
- My Jetpack: Prevent expiration alerts for products covered by active bundles. [#44586]
- My Jetpack: Restore plan purchase link. [#44535]

## 0.7.1 - 2025-06-18
### Changed
- Update package dependencies. [#43839]

## 0.7.0 - 2025-06-06
### Added
- Add more error logging. [#42959]
- Add My Jetpack tour. [#42880]

### Changed
- Code: First pass of style coding standards. [#42734]
- E2E Tests: Update config file encryption algorithm. [#43523]
- My Jetpack: Hide backup failure notice when backups are deactivated. [#43568]
- My Jetpack: Optimize the images for onboarding slider for faster page load. [#43473]
- My Jetpack: Update the onboarding UI, changing it to a single button. [#43203]
- Update package dependencies. [#43085] [#43071] [#43320] [#43326] [#43398] [#43400] [#43425] [#43578] [#43734]

### Removed
- General: Update minimum WordPress version to 6.7. [#43192]

### Fixed
- JS Packages: Decrease CSS priority of global styles to prevent them from applying within the editor. [#43035]
- Linting: Address final rules in WordPress Stylelint config. [#43296]
- My Jetpack: Fixed Onboarding UI responsiveness at 600px. [#43533]
- My Jetpack: Fix readability of license activation button on hover. [#43550]
- My Jetpack: Ensure social login does not get stuck when email input is not empty. [#43158]

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
