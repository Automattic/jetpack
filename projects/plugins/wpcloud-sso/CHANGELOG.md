# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2026-10-15
### Added
- Add autoloader check to prevent fatal errors when plugin is activated before composer install. [#46489]
- Connection: Add a Connected view to the Users page listing users with a linked WordPress.com account. [#53150]
- Connection: Transfer connection ownership to another connected administrator from the Connectors page. [#53581]
- IDC: Add revalidation for IDCs. [#46268]
- Initial version. [#45511]

### Changed
- General: Update minimum WordPress version to 7.0. [#46801] [#49021] [#51370]
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Remove unneeded development and documentation files from the published plugin. [#49014]
- Tested up to WordPress 7.1. [#48114] [#51370]
- Update design of the sidebar upsell. [#47909]
- Updated package dependencies. [#46785] [#47021] [#47505] [#48064] [#48735]
- Update Sync settings to include users and dataset required by A4A. [#45685]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- Connection: Translate the Connectors card's text on sites that don't use English. [#53179]
