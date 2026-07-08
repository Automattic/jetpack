# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2026-07-06
### Changed
- Update package dependencies. [#50097] [#50183]

## [0.1.8] - 2026-06-29
### Changed
- Update package dependencies. [#49271]

### Fixed
- Admin: Align Text, Notice and Tabs.Panel props with the `@wordpress/ui` 0.15 API. [#49796]

## [0.1.7] - 2026-06-25
### Changed
- Update dependencies. [#49857]

## [0.1.6] - 2026-06-22
### Changed
- Update package dependencies. [#49631] [#49691] [#49757]

## [0.1.5] - 2026-06-15
### Changed
- Update package dependencies. [#49273]

## [0.1.4] - 2026-06-08
### Changed
- Update dependencies. [#49354]

## [0.1.3] - 2026-06-01
### Changed
- Update package dependencies. [#48404] [#49152]

## [0.1.2] - 2026-05-25
### Changed
- Normalize page tabs onto the shared minimal variant and `jp-admin-page-tabs--minimal` wrapper modifier. [#48964]
- Update package dependencies. [#48405] [#49012]

## [0.1.1] - 2026-05-19
### Changed
- Build: Remove redundant dependency build script. [#48794]
- Exclude development files from production builds. [#47365]
- Update dependencies. [#48778]

## [0.1.0] - 2026-05-11
### Added
- Add initial package with page shell, REST namespace placeholder, and Active threats / History views. [#48458]
- Analytics: Add Tracks events for DataViews interactions, Scan now, auto-fix, modal opens, successes, and failures. [#48458]
- API: Add WPCOM bridge endpoints for scan reads, scan counts, scan enqueue, threat actions, and fix-status polling. [#48458]
- DataViews: Persist search, filters, sort, pagination, and layout across reloads for Active threats and Scan history. [#48458]
- Tests: Add PHPUnit route-registration coverage and Jest coverage for fix-status polling helpers. [#48458]
- Threats: Add per-threat fix, ignore, unignore, and view-details modal flows. [#48458]
- Threats: Add bulk auto-fix and Scan now flows with progress handling. [#48458]

### Changed
- Admin: Adopt shared Jetpack AdminPage chrome, tab layout, footer handling, and full-height WP Admin page structure. [#48458]
- Admin: Migrate the page from the webpack pipeline to a wp-build route. [#48458]
- Admin: Silence standard WP Admin notices on the Scan page to avoid layout shifts during scans and fix flows. [#48458]
- Admin: Update `@wordpress/admin-ui` to 2.0.0. [#48410]
- DataViews: Use DataViews-managed empty states and remove duplicate in-table status filtering from the Scan panels. [#48458]
- UI: Move tabs, empty states, stacks, buttons, dialog content, and notices toward `@wordpress/ui`. [#48458]

### Fixed
- Admin: Fix full-height table and empty-state layout issues. [#48458]
- API: Use blog-scoped WPCOM authentication for site-level scan reads and scan enqueue requests. [#48458]
- Availability: Fix a connection-store crash by relying on server-side Scan availability checks. [#48458]
- Build: Fix the wp-build production script and dependency build order so Scan builds from a fresh checkout. [#48458]
- Styles: Use double quotes in the `[role="tabpanel"]` selector to satisfy style checks. [#48458]
- Threats: Handle fix-status polling errors so fix modals no longer remain stuck in progress states. [#48458]

## 0.1.0-alpha - unreleased

Initial release.

[0.1.9]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.0-alpha...v0.1.0
