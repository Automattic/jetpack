# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0] - 2026-07-13
### Changed
- Enable the modernized dashboard for all sites by default. [#50091]
- Update package dependencies. [#49272]
- Update WPDS design tokens to the @wordpress/theme 0.16/0.17 names (see https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/CHANGELOG.md#0160-2026-06-24 ). [#49272]

### Fixed
- Daily Writing Prompt: Decode HTML entities so quotation marks render correctly instead of showing entity names like `&quot;`. [#50405]
- Subscribers: Show the styled "Subscribers moved" announcement page instead of the bare fallback. [#50349]

## [0.11.2] - 2026-07-06
### Changed
- Settings: Space the Email content private-site notice from the form with a Stack gap instead of a custom CSS margin rule. [#50085]
- Update package dependencies. [#50097] [#50183]

### Fixed
- Daily Writing Prompt: Show a branded fallback with a Reader link when no prompt is available or the request fails, instead of rendering a blank widget. [#50119]
- Settings: Add bottom margin to the Email content private-site notice so it no longer collides with the featured image toggle. [#50072]

## [0.11.1] - 2026-06-29
### Changed
- Settings: Link the "Button only" style hint to platform-appropriate support documentation. [#50009]
- Update package dependencies. [#49271]

## [0.11.0] - 2026-06-25
### Changed
- Introduce the modernized dashboard and WP Admin subscriber management behind the `rsm_jetpack_ui_modernization_newsletter` and `jetpack_wp_admin_subscriber_management_enabled` filters, off by default. [#49036]
- Update package dependencies. [#49831]

### Fixed
- Align the settings DataForm field `Edit` controls, the import-subscribers notice `ActionLink`, and the dashboard tab panels with the `@wordpress/dataviews` 16 and `@wordpress/ui` 0.15 type APIs. [#49801]

## [0.10.0] - 2026-06-22
### Added
- Add a transitional Subscribers announcement page (wp-build) shown in place of the legacy Subscribers menu link when the Newsletter modernization filter is enabled. [#49496]
- Register the transitional Subscribers announcement page directly under the Jetpack menu on WordPress.com sites. [#49675]

### Changed
- Subscribers: Link the Substack importer button to the WordPress.com site-setup importer flow. [#49538]
- Update package dependencies. [#49631] [#49691] [#49757]

### Fixed
- Close the subscriber detail panel when its subscriber is removed instead of leaving it open with stale data. [#49598]

## [0.9.1] - 2026-06-15
### Added
- Add a setting for the Subscribe modal heading shown by Subscribe blocks using the Button-only style. [#49171]
- Daily Writing Prompt: Record Tracks events when interacting with the widget's actions. [#49534]

### Changed
- Daily Writing Prompt: Link to the WordPress.com Reader and move the responses button next to the Post Answer button. [#49462]
- Label the subscription placement options with a "Homepage and posts" section header. [#49466]
- Update package dependencies. [#49273] [#49492]

### Fixed
- Daily Writing Prompt: Defer the connection-readiness check to Dashboard setup to avoid a fatal error on Atomic sites. [#49525]
- Fix the "Add plans" link for WordPress installs in a subdirectory. [#49553]
- Keep the Subscribers/Settings tab bar pinned while scrolling the modernized Settings tab. [#49460]
- Only show the subscription placement "Preview and edit" link once the placement is enabled and saved. [#49532]
- Render the same initials avatar in the subscriber row and detail panel when a subscriber has no Gravatar. [#49581]
- Stop the modernized Settings tab from flashing a full-page loading spinner on every visit. [#49530]
- Subscribers: Hide the "Comp a subscription" action when the site has no paid newsletter plans. [#49531]

## [0.9.0] - 2026-06-08
### Added
- Add Jetpack branding to the Daily Writing Prompt dashboard widget. [#49438]
- Add the Daily Writing Prompt dashboard widget, moved here from the jetpack-mu-wpcom package. [#49425]

### Changed
- Remove the per-page Hello Dolly rule, as it is now handled by `@automattic/jetpack-components`'s AdminPage component. [#48472]

### Fixed
- Include the routes directory in the TypeScript config so dashboard route files type-check correctly. [#49368]
- Hide the WordPress.com connection prompt on Simple sites, which are already connected. [#49365]
- Restore body padding by wrapping content in Dialog.Content in Add subscribers and Comp modals. [#49327]
- Subscribers Dashboard: Fix several Comp modal issues. [#49441]
- Subscribers Dashboard: Show the empty state when the site owner is the only subscriber, and point the empty-state copy at the subscription form documentation. [#49410]

## [0.8.10] - 2026-06-01
### Changed
- Update package dependencies. [#48404] [#49152]

### Fixed
- Record a `jetpack_newsletter_tab_view` Tracks event on initial page load in Newsletter dashboard (matching its tab-switch behavior). [#49243]

## [0.8.9] - 2026-05-25
### Changed
- Normalize page tabs onto the shared minimal variant and `jp-admin-page-tabs--minimal` wrapper modifier. [#48964]
- Update package dependencies. [#48405] [#49012]

### Fixed
- Drop dead `@wordpress/admin-ui` build-style import that no longer exists in 2.x. [#49007]
- Fix Settings tab toggles that controlled the wrong setting due to duplicate element IDs. [#49102]

## [0.8.8] - 2026-05-19
### Changed
- Build: Run webpack and wp-build scripts concurrently. [#48794]
- Exclude development files from production builds. [#47365]

### Fixed
- Fix saving settings on the Newsletter admin page on Atomic and self-hosted sites. [#48813]

## [0.8.7] - 2026-05-11
### Changed
- Components: Use Link from `@wordpress/ui` instead of ExternalLink. [#48529]

## [0.8.6] - 2026-05-04
### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]

## [0.8.5] - 2026-04-27
### Fixed
- Reader Link: Only enqueue styles when the admin bar is visible. [#48145]

## [0.8.4] - 2026-04-20
### Changed
- Adopt the shared Jetpack admin-page-layout mixin on the Newsletter admin page: pinned header, scrolling middle, pinned footer, no window-level scroll. [#48109]
- Update package dependencies. [#48106] [#48141]

### Removed
- Remove the jetpack_wp_admin_newsletter_settings_enabled filter; the wp-admin newsletter settings page is now always enabled. [#48092]

## [0.8.3] - 2026-04-15
### Changed
- Update package dependencies. [#47907]

## [0.8.2] - 2026-04-10
### Changed
- Update dependencies. [#48049]

## [0.8.1] - 2026-04-09
### Changed
- Update package dependencies. [#47890] [#47998]

### Fixed
- Defer is_connected() check from init to admin_menu callback to avoid caching a false result before External Storage providers are registered. [#48005]

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

[0.12.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.11.2...v0.12.0
[0.11.2]: https://github.com/Automattic/jetpack-newsletter/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/Automattic/jetpack-newsletter/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.9.1...v0.10.0
[0.9.1]: https://github.com/Automattic/jetpack-newsletter/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.10...v0.9.0
[0.8.10]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.9...v0.8.10
[0.8.9]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.8...v0.8.9
[0.8.8]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.7...v0.8.8
[0.8.7]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.6...v0.8.7
[0.8.6]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.5...v0.8.6
[0.8.5]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-newsletter/compare/v0.8.0...v0.8.1
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
