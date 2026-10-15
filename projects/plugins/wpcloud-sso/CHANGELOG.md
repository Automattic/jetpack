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
- General: Update minimum WordPress version to 6.9. [#49021]
- General: Update minimum WordPress version to 7.0. [#51370]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Remove unneeded development and documentation files from the published plugin. [#49014]
- Tested up to WordPress 7.0. [#48114]
- Tested up to WordPress 7.1. [#51370]
- Update design of the sidebar upsell. [#47909]
- Updated package dependencies. [#48735]
- Update package dependencies. [#46785]
- Update package dependencies. [#47021]
- Update package dependencies. [#47505]
- Update package dependencies. [#48064]
- Update Sync settings to include users and dataset required by A4A. [#45685]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- Connection: Translate the Connectors card's text on sites that don't use English. [#53179]
