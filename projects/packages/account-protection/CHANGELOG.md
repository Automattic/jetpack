# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2025-05-05
### Fixed
- Linting: Do additional stylesheet cleanup. [#43247]
- Prevent PHP error from errant third-party hook params. [#43352]

## [0.2.3] - 2025-04-28
### Fixed
- Fix an issue where authentication could fail when other authentication plugins are active. [#43240]
- Linting: Fix more Stylelint violations. [#43213]

## [0.2.2] - 2025-04-14
### Fixed
- Linting: Update stylesheets to use WordPress rules for fonts and colors. [#42920] [#42928]
- Fix: Improve compatibility with code using stdClass objects in `profile_update` hook. [#43045]

## [0.2.1] - 2025-04-07
### Changed
- Linting: First pass of style coding standards. [#42734]

## [0.2.0] - 2025-04-01
### Changed
- Add a default value for the error param in the `wp_login_failed` action callback. [#42819]
- Fix potential `wp_login_failed` action conflicts. [#42825]

## 0.1.0 - 2025-03-31
### Added
- Add initial account protection features. [#40925]
- Add a user requires protection filter. [#40925]
- Initial version. [#40923]
- Use jetpack-config package for Account Protection initialization. [#40925]
- Use jetpack-logo package for Account Protection logos. [#40925]

[0.2.4]: https://github.com/Automattic/jetpack-account-protection/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Automattic/jetpack-account-protection/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Automattic/jetpack-account-protection/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-account-protection/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-account-protection/compare/v0.1.0...v0.2.0
