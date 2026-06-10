# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2026-06-08
### Changed
- Update dependencies. [#49354]

## [0.1.4] - 2026-06-01
### Added
- Notices: Add notice when the connection state prevents logs from showing. [#48858]

### Changed
- Update package dependencies. [#48404]

## [0.1.3] - 2026-05-25
### Changed
- Update package dependencies. [#48405]

### Fixed
- Fix upgrade prompt incorrectly shown to sites entitled to the full activity log. [#49067]

## [0.1.2] - 2026-05-19
### Added
- Add a "Performed by" filter for narrowing the log by actor, including MCP agents. Filtering is applied server-side so totals and pagination stay correct. [#48594]

### Changed
- Update dependencies. [#48778]

## [0.1.1] - 2026-05-11
### Changed
- Activity Log: Open the Jetpack Cloud Backup restore flow from the "Manage backup" row action instead of showing a disabled placeholder. [#48531]
- Activity Log: Refresh the free-tier upsell illustration to match Jetpack's branding. [#48531]
- Activity Log: Rename the row action to "Restore backup" so the label matches what clicking it actually does. [#48531]
- Components: Use Link from `@wordpress/ui` instead of ExternalLink. [#48529]

## [0.1.0] - 2026-05-04
### Added
- Initial release of the Activity Log package: Hosts the Activity Log UI and its REST endpoints directly in WP Admin. [#48244]

### Changed
- Activity Log: Opt into `<AdminPage unwrapped>` so DataViews can fill the bounded content slot and scroll its table body internally. Header, date picker, and DataViews toolbar stay pinned on short viewports. [#48244]

### Fixed
- Activity Log: Default the page to the Table layout, load the upsell-callout stylesheet from the main entry, and surface the disabled toolbar + disabled date-range picker on the free tier with upgrade tooltips. [#48418]

## 0.1.0-alpha - unreleased

Initial release.

[0.1.5]: https://github.com/Automattic/jetpack-activity-log/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-activity-log/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-activity-log/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-activity-log/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-activity-log/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Automattic/jetpack-activity-log/compare/v0.1.0-alpha...v0.1.0
