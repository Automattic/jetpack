# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/Automattic/jetpack-account-protection/compare/v0.1.0...v0.2.0
