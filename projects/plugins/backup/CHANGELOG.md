# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.7] - 2024-06-27
### Added
- On-demand backups feature

### Changed
- General: indicate compatibility with the upcoming version of WordPress - 6.6. [#37962]
- Remove the explicit Plugin Install package dependency. [#37430]
- Updated package dependencies. [#37348] [#37767]
- Updated backup header layout for responsive design

## [2.6] - 2024-05-09
### Added
- Add Woocommerce event remove_order_items to Jetpack Sync [#33748]
- Real time backups: Add endpoints orders to be used in real-time backups jetpack [#35649]
- Trigger red bubble notification when bad install is detected [#36449]

### Changed
- Add a LoadingPlaceholder while waiting for Jetpack Backup price

### Fixed
- Backup: change some error messages to not trigger security scanners [#36496]

## [2.5] - 2024-02-08
### Changed
- Updated package dependencies. [#34882]

### Fixed
- Write helper script to ABSPATH by default, just like we did before [#35508]

## [2.4] - 2024-01-04
### Fixed
- Backup: Add namespace versioning to Helper_Script_Manager and other classes [#34739]

## [2.3] - 2023-12-13
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- General: updated PHP requirement to PHP 7.0+ [#34126]
- General: update WordPress version requirements to WordPress 6.3. [#34127]
- Updated package dependencies. [#33498]
- Update lockfile [#33607]

### Fixed
- Improved helper script installer logging. [#34297]

## [2.2] - 2023-09-20
### Changed
- General: update WordPress version requirements to WordPress 6.2. [#32762]
- Updated package dependencies. [#32966]

## [2.1] - 2023-08-23
### Changed
- Updated package dependencies. [#32307]

## [2.0] - 2023-08-01
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.3. [#31910]
- Updated package dependencies. [#31769]

## [1.9] - 2023-07-05
### Added
- Add authentication to Zendesk chat widget. [#31339]
- Add video section to Backup connect page. [#31260]

### Changed
- Update connection module to have an RNA option that updates the design. [#31201]
- Updated package dependencies. [#31308]

## [1.8] - 2023-06-06
### Changed
- General: update link references to releases in changelog. [#30634]
- Updated package dependencies. [#30493]

## 1.7 - 2023-05-02
### Changed
- Updated package dependencies. [#29565]
- Update WordPress version requirements. Now requires version 6.1. [#30120]

## 1.6 - 2023-04-04
### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.2. [#29341]
- Updated package dependencies. [#29434]

## 1.5 - 2023-03-07
### Changed
- Backup: Update description headline, add video [#28890]
- Updated package dependencies. [#28910]

### Fixed
- Fixes the plugin's versioning so it actually uses WordPress versioning [#29133]

## 1.4.4 - 2023-02-07
### Changed
- Updated package dependencies. [#28218]

## 1.4.3 - 2023-01-10
### Changed
- Updated Backup logo. [#27802]
- Updated package dependencies. [#27688, #27874]

## 1.4.2 - 2022-12-06
### Changed
- Add real-time backups details in plugin FAQs [#27470]
- Compatibility: WordPress 6.1 compatibility [#27084]
- Rename plugin name to Jetpack VaultPress Backup [#27432] [#27411]
- Updated package dependencies. [#26072]

### Removed
- Remove connection-ui package dependency [#26381]

## 1.4.1 - 2022-09-08
### Added
- Include contextual notifications from My Jetpack [#22452]

### Changed
- Plugin activation: Only redirect when activating from the Plugins page in the browser

### Other changes <!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->
- Updated package dependencies. [#25713] [#24929] [#24998] [#25048] [#25158] [#25279] [#25315] [#25406] [#25945]

## 1.4.0 - 2022-06-28
### Added
- Added Social card to My Jetpack.

### Changed
- Renamed main branch `master` references to `trunk`
- Updated package dependencies.

## 1.3.0 - 2022-05-19
### Changed
- Now requires WordPress 5.9 since WordPress 6.0 is just around the corner.
- Updated package dependencies

### Fixed
- Fixed progress state in admin page to use real site title.

## 1.2.0 - 2022-02-28
### Added
- Added My Jetpack.
- Smarter connection handling when disconnecting.

### Changed
- Updated: Upgraded from Jetpack Sync 1.28 to 1.29
- Updated package dependencies.

### Fixed
- Backup: Update spacing for all containers.
- Fixed various JavaScript warnings.

## 1.1.0 - 2022-01-26
### Added
- Added My Jetpack page work in progress behind a feature flag.
- Added pricing information to Jetpack Connection screen.
- Pass connected plugin information to disconnect dialog flow, include analytics scripts.
- Redirect to Jetpack Backup plugin page when the plugin is activated.
- Use monorepo `validate-es` script to validate Webpack builds.

### Changed
- Change initial screen for first backup.
- Detect when a backup will retry and update error screen content.
- Import RNA styles from base styles package.
- Make Admin UI consume layout components.
- The Admin page now promotes the new real-time Backup products.
- Updated content shown on backup segments section.
- Updated Jetpack Primary color to match latest brand book.
- Updated upgrade button link target to point to checkout.
- Use `Assets::register_script()` to load Webpack-built script.

### Removed
- Remove use of deprecated `~` in sass-loader imports.
- Remove use of `gulp` in build, all it was doing was wrapping `webpack`.

### Fixed
- Removed backup-in-progress animation on small viewports
- Use `@automattic/babel-plugin-replace-textdomain` to ensure proper textdomains in JS bundles.

## 1.0.1 - 2021-11-22
### Removed
- Remove the Connection UI activation.

### Fixed
- Fix a bug that prevented the IDC UI from displaying when the site is in an identity crisis.

## 1.0.0 - 2021-10-13
### Added
- Added link to the plugins list table for "Settings" to match other Jetpack plugins.
- Plugin now disconnects Jetpack on deactivation if it's the last plugin using the connection.
- Updated Backup plugin readme text and remove dummy tag.
- Updated readme.md installation instructions.
- Updated plugin menu structure.

### Changed
- Changed menu label.
- Updated package dependencies.
- Updated styles for buttons in backup panel and spacing for sections below.

### Fixed
- Adjust dashboard styling.

## 0.2.0 - 2021-08-18
### Added
- Added Backup UI, placeholders, and supporting end points.
- Added design for No Backup Capabilities view. Removed unused CSS. Minor styling fixes.
- Added Jetpack header and footer
- Added UI options to manage your Jetpack connection

### Changed
- Changed backup storage and heartbeat info blocks to only display with a backup plan
- Updated all external links to use jetpack redirect service
- Updated Jetpack Backup menu item title and icon

### Fixed
- Added a state to display before a first backup starts
- Fix minor styling issue for the "no plan" page.

## 0.1.0-beta - 2021-06-15
### Added
- Added RNA connection to the plugin.
- Initial wire frame for the Jetpack Backup plugin.

### Changed
- Changes associated with plugin release process.
- Updated package dependencies.
- Update RNA Connection usage based on Automattic/jetpack/pull/19837.
- Utilize the config package for sync and connection.

### Fixed
- Use `absoluteRuntime` in babel JS build to avoid module not found errors.

[2.2-beta]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.1...2.2-beta
[2.7]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.6...2.7
[2.6]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.5...2.6
[2.5]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.4...2.5
[2.4]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.3...2.4
[2.3]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.2...2.3
[2.2]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.2-beta...2.2
[2.1]: https://github.com/Automattic/jetpack-backup-plugin/compare/2.0...2.1
[2.0]: https://github.com/Automattic/jetpack-backup-plugin/compare/1.9...2.0
[1.9]: https://github.com/Automattic/jetpack-backup-plugin/compare/1.8...1.9-beta
[1.8]: https://github.com/Automattic/jetpack-backup-plugin/compare/1.7...1.8
