# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-04-06
### Added
- Newsletter settings: Disable settings and show a connection notice when the site has no connected owner. [#47927]

### Fixed
- Admin menu: Hide when a site is not connected to WordPress.com yet. [#47927]

## [0.7.0] - 2026-03-30
### Changed
- Enable WP Admin newsletter settings by default. [#47750]
- Update DataViews dependency. [#46973]
- Update legacy Node calls. [#47770]
- Update package dependencies. [#47799]

### Fixed
- Fix spacing between the send-default toggle description and the "Manage all subscribers" link in the Newsletter settings card. [#47830]
- Move admin notices and JITMs below the page header. [#47714]
- Reader Link: Add compatibility check for Urls::maybe_add_origin_site_id() to prevent fatal errors with older connection package versions. [#47808]
- Settings: Avoid fatals for disconnected jetpack errors. [#47782]

## [0.6.2] - 2026-03-23
### Changed
- Add "Send newsletter by default" toggle to Newsletter settings section. [#47565]
- Update newsletter settings max width to 660px to match MSD and future settings pages. [#47626]
- Update package dependencies. [#47684]

### Fixed
- Fix translator comment concatenation caused by dataviews function aliasing. [#47602]

## [0.6.1] - 2026-03-16
### Added
- Settings: Add privacy information link. [#47587]

### Changed
- Settings: Fix inconsistent punctuation and casing on labels. [#47559]
- Settings: Link to WordPress.com for all WordPress.com sites. [#47578]
- Update dependencies. [#47472]

### Fixed
- Add spacing below warning notice in Email content settings section. [#47516]
- Subscriptions: Fix mobile alignment of Preview and edit links in settings. [#47561]
- Ensure module configure URL points to the new newsletter settings page. [#47584]

## [0.6.0] - 2026-03-09
### Added
- Add `jetpack_show_newsletter_menu_item` filter to show menu regardless of subscriptions module state. [#47347]

### Changed
- Migrate admin page header to use unified header pattern. [#47313]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update newsletter sections to use new component patterns. [#47406]
- Update package dependencies. [#47496]

### Fixed
- Settings: Fix Hello Dolly banner display and box-sizing on the newsletter settings page. [#47313]

## [0.5.2] - 2026-03-02
### Changed
- Update dependencies. [#47038]

## [0.5.1] - 2026-02-26
### Added
- Add clarifying note to Reading settings page linking to Newsletter settings for email content control. [#47299]

### Changed
- Refactor settings to use `@automattic/jetpack-script-data` utilities for site info and admin URLs. [#47259]
- Update package dependencies. [#47285] [#47300]
- Use `Status` class methods for `isSitePublic` check (filterable and handles coming soon state). [#47321]

## [0.5.0] - 2026-02-23
### Added
- Add Tracks analytics to track user interactions on the newsletter settings page. [#47100]

### Changed
- Reader Link: Open the Reader in a different tab on self-hosted sites. [#47246]
- Settings: Wrap page with `AdminPage` component for consistency with other Jetpack pages. [#47086]
- Update package dependencies. [#47173]

## [0.4.0] - 2026-02-16
### Added
- Automatically enable the admin bar link on sites newly connected to WordPress.com. [#47033]
- WordPress.com Reader: Add new class to render a new navigation menu in the admin bar. [#46783]

### Changed
- Update package dependencies. [#47099]

### Fixed
- Settings: Improve feedback with toast notifications for save success/error and inline error for category load failures. [#46987]

## [0.3.2] - 2026-02-10
### Changed
- CSS: Ensure dataforms css is loaded. [#46877]
- Update dependencies. [#46931] [#47002]

### Fixed
- Fix settings and categories API endpoints on WordPress.com Simple sites. [#46930]

## [0.3.1] - 2026-02-02
### Added
- Add a newsletter categories section to the settings screen. [#46708]
- Add settings sections: subscriptions, paid newsletter, and welcome message. [#46473]

### Changed
- Update package dependencies. [#46430] [#46853] [#46854]

## [0.3.0] - 2026-01-26
### Added
- Add newsletter settings to the new screen. [#46471]

## [0.2.0] - 2026-01-19
### Added
- Implement bits of infrastructure for newsletter settings UI. [#46470]

### Changed
- Update package dependencies. [#46552] [#46647]

## [0.1.4] - 2026-01-12
### Changed
- Update package dependencies. [#46456]

## [0.1.3] - 2025-12-22
### Changed
- Update dependencies. [#46381]

## [0.1.2] - 2025-12-15
### Changed
- Update package dependencies. [#46244]

## [0.1.1] - 2025-12-08
### Changed
- Update package dependencies. [#45914]

## 0.1.0 - 2025-12-01
### Added
- Initial version. [#46049]

### Changed
- Update package dependencies. [#46143]

[0.8.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.6.2...v0.7.0
[0.6.2]: https://github.com/Automattic/jetpack-newsletter/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-newsletter/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/Automattic/jetpack-newsletter/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-newsletter/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/Automattic/jetpack-newsletter/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-newsletter/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/Automattic/jetpack-newsletter/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-newsletter/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-newsletter/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-newsletter/compare/v0.1.0...v0.1.1
