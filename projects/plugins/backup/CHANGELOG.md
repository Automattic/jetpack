# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
