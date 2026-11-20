# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-23
### Changed
- Make the help and Ask AI admin bar nodes available from the admin-bar REST endpoints, with the label, icon and destination a client needs. [#51657]
- Name the admin bar's AI chat button “Agent”, render an “Agent” label beside its icon while the chat is hidden, and rename its `meta.icon` key from `ask-ai` to `sparkle`. [#51926]
- Update dependencies. [#50044]

### Fixed
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site. [#51311]

## [0.1.2] - 2026-06-25
### Changed
- Update dependencies. [#49612]

## 0.1.0 - 2026-06-10
### Added
- Initial version: standalone plugin that loads the Jetpack Agents Manager package.

[0.2.0]: https://github.com/Automattic/agents-manager/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Automattic/agents-manager/compare/v0.1.0...v0.1.2
