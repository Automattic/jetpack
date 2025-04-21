# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.5.0 - 2025-04-03
### Added
- Add Account Protection initialization. [#40925]
- Connection: Disconnect all other users before disconnecting connection owner account. [#41923]
- Components: Export the `getRedirectUrl` function with subpath. [#41078]

### Changed
- Code: Use function-style `exit()` and `die()` with a default status code of 0. [#41167]
- Connection: Allow pre-selected login providers. [#42662]
- Connection: Display connection status on Users page independent of the SSO module. [#41794]
- General: Indicate compatibility with WordPress 6.8. [#42701]
- Update dependencies. [#42564]
- Updated package dependencies. [#40980] [#41099] [#41286] [#41491] [#41577] [#41659] [#42163] [#42180] [#42384] [#42511] [#42809] [#42815]

## 0.4.0 - 2025-01-09
### Changed
- Updated dependencies. [#40286]
- Updated package dependencies. [#40116] [#40258] [#40288] [#40363] [#40515] [#40564] [#40693] [#40792] [#40815]

### Removed
- General: Update minimum PHP version to 7.2. [#40147]
- General: Update minimum WordPress version to 6.6. [#40146]

### Fixed
- E2E Tests: Only install single browser used by Playwright. [#40827]

## 0.3.0 - 2024-11-11
### Added
- Enable test coverage. [#39961]

### Changed
- General: Indicate compatibility with the upcoming version of WordPress - 6.6. [#37962]
- General: Indicate compatibility with the upcoming version of WordPress - 6.7. [#39786]
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Updated package dependencies. [#38132] [#38228] [#38235] [#38662] [#38822] [#39004] [#39111] [#39176] [#39278] [#39288] [#39302] [#39332] [#39594] [#39653] [#39707] [#39999] [#40060]

### Removed
- Connection: Removed deprecated method features_available [#39442]
- Connection: Removed features_enabled deprecated method [#39475]
- General: Update WordPress version requirements to WordPress 6.5. [#38382]

### Fixed
- Lossless image optimization of images in projects/plugins [subdirectories from a* through social] [#38573]

## 0.2.1 - 2024-06-12
### Changed
- Dashboard: Switch to a smaller and faster dependency (`clsx`) to handle class names. [#37708]
- Dashboard: Update the connection screen's messaging to make our Terms of Service clearer. [#37536]
- Dependencies: Remove the 'jetpack-identity-crisis' dependency. [#36968]
- Dependencies: Update multiple dependencies. [#37669] [#37767] [#37776] [#37796]

## 0.2.0 - 2024-05-28
### Added
- Add autotagger and autorelease to composer.json to enable auto-tagging and auto-release actions [#37143]

### Changed
- Updated package dependencies. [#37147]

### Removed
- Remove the Plugin Installer package dependency. [#37430]

## 0.1.0 - 2024-04-30
### Added
- Added connected state content and site disconnection flow. [#36747]
- Added connection card [#36664]
- Added details about sharing information with Automattic to the connection card. [#36729]
- Added reconnection flow to the A4A client plugin. [#37036]
- Add Woocommerce event remove_order_items to Jetpack Sync [#33748]
- General: add first version of the plugin's readme and assets. [#36796]
- General: add modal displayed when deactivating the plugin. [#36523]
- Initial commit for the plugin’s infrastructure. [#36353]
- Packages: add version tracking for identity-crisis package. [#36635]

### Changed
- General: update WordPress version requirements to WordPress 6.4. [#37047]
- General: use wp_admin_notice function introduced in WP 6.4 to display notices. [#37051]
- Updated details about sharing data with WordPress.com [#37039]
- Updated package dependencies. [#36585] [#36760] [#36775] [#36788]

### Removed
- Removed the Jetpack-branded header and footer from the plugin. [#36930]

### Fixed
- Fix post-connection redirect URL. [#36960]
