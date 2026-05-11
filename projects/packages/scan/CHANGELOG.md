# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-11
### Added
- Scan: Add the initial wp-admin Scan package with page shell, REST namespace placeholder, and Active threats / History views. [#48458]
- Scan API: Add WPCOM bridge endpoints for scan reads, scan counts, scan enqueue, threat actions, and fix-status polling. [#48458]
- Scan DataViews: Persist search, filters, sort, pagination, and layout across reloads for Active threats and Scan history. [#48458]
- Scan Threats: Add per-threat fix, ignore, unignore, and view-details modal flows. [#48458]
- Scan Threats: Add bulk auto-fix and Scan now flows with progress handling. [#48458]
- Scan Analytics: Add Tracks events for DataViews interactions, Scan now, auto-fix, modal opens, successes, and failures. [#48458]
- Scan Tests: Add PHPUnit route-registration coverage and Jest coverage for fix-status polling helpers. [#48458]

### Changed
- Scan Admin: Migrate the page from the webpack pipeline to a wp-build route. [#48458]
- Scan Admin: Adopt shared Jetpack AdminPage chrome, tab layout, footer handling, and full-height wp-admin page structure. [#48458]
- Scan UI: Move tabs, empty states, stacks, buttons, dialog content, and notices toward `@wordpress/ui`. [#48458]
- Scan DataViews: Use DataViews-managed empty states and remove duplicate in-table status filtering from the Scan panels. [#48458]
- Scan Admin: Silence standard wp-admin notices on the Scan page to avoid layout shifts during scans and fix flows. [#48458]
- Scan Admin: Update `@wordpress/admin-ui` to 2.0.0. [#48410]

### Fixed
- Scan Build: Fix the wp-build production script and dependency build order so Scan builds from a fresh checkout. [#48458]
- Scan Admin: Fix full-height table and empty-state layout issues. [#48458]
- Scan Availability: Fix a connection-store crash by relying on server-side Scan availability checks. [#48458]
- Scan API: Use blog-scoped WPCOM authentication for site-level scan reads and scan enqueue requests. [#48458]
- Scan Threats: Handle fix-status polling errors so fix modals no longer remain stuck in progress states. [#48458]
- Scan Styles: Use double quotes in the `[role="tabpanel"]` selector to satisfy style checks. [#48458]

## 0.1.0-alpha - unreleased

Initial release.

[0.1.0]: https://github.com/Automattic/jetpack-scan-page/compare/v0.1.0-alpha...v0.1.0
