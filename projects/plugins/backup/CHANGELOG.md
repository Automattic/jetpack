# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
