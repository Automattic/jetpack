# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-10-14
### Added
- Add the `/help-center/article-rating` endpoint so the Help Center can save a user's "Was this helpful?" answer for a support article. [#51978]
- Add the `/help-center/cta` endpoint so the Help Center can fetch the contextual CTA for the current user from wp-admin. [#51992]
- Admin bar: register the Help Center entry point on every request so the admin-bar REST endpoints return it, and show a "Get Help" label beside its icon for users in the calypso_help_center_get_help_chat_forward experiment treatment, and pass that variation to the Help Center bundles so they open on the AI chat. [#52226]

### Changed
- Remove the obsolete Agents Manager unified experience check. [#52484]

### Removed
- Minimum supported PHP version is now 7.4. [#51515]
- Remove the unused Help Center admin bar menu panel and its experiment assignment. [#52251]

### Fixed
- Help Center: make the admin bar entry point keyboard reachable and let its icon follow the item's hover colour. [#52322]
- Prevent PHP warnings when handling malformed data. [#53126]

## [0.3.2] - 2026-08-03
### Fixed
- Help Center: Support empty asset dependency lists.

## [0.3.1] - 2026-07-31
### Fixed
- Help Center: Forward anonymous chat session data to WordPress.com.

## [0.3.0] - 2026-07-30
### Added
- Help Center: Allow consumers to configure interaction bot slugs.

## [0.2.0] - 2026-07-27
### Added
- Allow consumers to load the logged-out Help Center bundle and proxy logged-out requests anonymously.

## 0.1.0 - 2026-07-27
### Added
- Allow consumers to provide the WordPress.com authentication state and request client used by the Help Center.
- Initial version, extracted from Jetpack MU WPCOM to its own package for external consumption.

[0.4.0]: https://github.com/Automattic/jetpack-help-center/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/Automattic/jetpack-help-center/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-help-center/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-help-center/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-help-center/compare/v0.1.0...v0.2.0
