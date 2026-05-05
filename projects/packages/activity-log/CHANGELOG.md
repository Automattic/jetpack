# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-04
### Added
- Initial release of the Activity Log package: Hosts the Activity Log UI and its REST endpoints directly in WP Admin. [#48244]

### Changed
- Activity Log: Opt into `<AdminPage unwrapped>` so DataViews can fill the bounded content slot and scroll its table body internally. Header, date picker, and DataViews toolbar stay pinned on short viewports. [#48244]

### Fixed
- Activity Log: Default the page to the Table layout, load the upsell-callout stylesheet from the main entry, and surface the disabled toolbar + disabled date-range picker on the free tier with upgrade tooltips. [#48418]

## 0.1.0-alpha - unreleased

Initial release.

[0.1.0]: https://github.com/Automattic/jetpack-activity-log/compare/v0.1.0-alpha...v0.1.0
