# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.0-beta - 2021-08-12
### Added
- Added Backup UI, placeholders, and supporting end points.
- Added design for No Backup Capabilities view. Removed unused CSS. Minor styling fixes.
- Adds Jetpack header and footer
- Add UI options to manage your Jetpack connection

### Changed
- Updated all external links to use jetpack redirect service
- Changed backup storage and heartbeat info blocks to only display with a backup plan

### Fixed
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
