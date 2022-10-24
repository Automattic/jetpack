# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2022-10-19
### Changed
- Cache errors when fetching stats and reverted cache prefix. [#26922]

## [0.2.0] - 2022-10-13
### Changed
- Changed cache prefix [#26719]
- Updated readme for Stats package [#26759]

## 0.1.0 - 2022-10-11
### Added
- Stats: Add package scaffold [#26312]
- Stats package: Add 'jetpack.getBlog' XMLRPC endpoint [#26473]
- Stats package: Add entrypoint class for setting hooks and configuration. [#26601]
- Stats package: Introduce WPCOM_Stats class [#26530]
- Stats package: Manage Stats options [#26431]
- Stats Package: Tracking Pixel functionality [#26516]

### Changed
- Add mirror repo [#26750]

### Fixed
- Fixing static method which was called without self reference. [#26640]

[0.3.0]: https://github.com/Automattic/jetpack-stats/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-stats/compare/v0.1.0...v0.2.0
