# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.4.0 - 2026-04-11
### Added
- IDC: Add revalidation for IDCs. [#46268]

### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Update dependencies. [#47472]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#46143] [#46456] [#46552] [#46647] [#46785] [#46854] [#47002] [#47021] [#47099] [#47173] [#47300] [#47371] [#47496] [#47505] [#47684] [#47799] [#47825] [#47890] [#47998]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- PayPal Payments Button: Fix escaping issue for stacked payments buttons. [#47761]

## 0.3.2 - 2025-11-20
### Added
- Tested up to WordPress 6.9. [#45571]

### Changed
- Update package dependencies. [#45478] [#45676] [#45756] [#45915] [#45958]

### Fixed
- Jetpack: Remove getIconColor functions for block icons. [#45992]

## 0.3.1 - 2025-10-09
### Changed
- Update package dependencies. [#45173] [#45200] [#45229] [#45298] [#45299] [#45334]
- Update short description for plugin. [#45443]

## 0.3.0 - 2025-09-16
### Changed
- Improve robustness of PayPal Payment Buttons parsing [#45158]
- Remove admin page for PayPal Payment Buttons plugin. [#44712]
- Update package dependencies. [#44677] [#44701] [#44725] [#45027] [#45096]
- Update readme.txt and adds assets for distribution. [#44584]

## 0.2.0 - 2025-07-25
### Added
- Initial release setup and plugin structure. [#44479]
- Integration with paypal-payments package for core functionality. [#44479]
- Working PayPal Payment Button block with availability data. [#44479]
