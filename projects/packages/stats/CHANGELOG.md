# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.15.9] - 2025-03-31
### Changed
- Internal updates.

## [0.15.8] - 2025-03-24
### Changed
- Internal updates.

## [0.15.7] - 2025-03-18
### Changed
- Internal updates.

## [0.15.6] - 2025-03-17
### Changed
- Internal updates.

## [0.15.5] - 2025-03-12
### Changed
- Internal updates.

## [0.15.4] - 2025-03-10
### Changed
- Internal updates.

## [0.15.3] - 2025-03-03
### Fixed
- Tracking Pixel: Ensure the tracking script can be deferred, so it is not blocking. [#42175]

## [0.15.2] - 2025-02-24
### Changed
- Update dependencies. [#39260]

## [0.15.1] - 2025-02-03
### Fixed
- Code: Remove extra params on function calls. [#41263]

## [0.15.0] - 2025-01-06
### Added
- Stats: Add API support for location stats. [#40852]

## [0.14.1] - 2024-11-25
### Changed
- Updated dependencies. [#40286]

## [0.14.0] - 2024-11-18
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.13.5] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [0.13.4] - 2024-10-29
### Changed
- Internal updates. [#39260]

## [0.13.3] - 2024-09-23
### Changed
- Internal updates.

## [0.13.2] - 2024-09-05
### Changed
- Update dependencies. [#39253]

## [0.13.1] - 2024-08-23
### Changed
- Updated package dependencies. [#39004]

## [0.13.0] - 2024-06-10
### Added
- Staging: deprecating staging mode and separating the logic into is_development_site and in_safe_mode [#37023]

## [0.12.5] - 2024-05-06
### Changed
- Internal updates.

## [0.12.4] - 2024-04-26
### Changed
- Internal updates.

## [0.12.3] - 2024-04-25
### Changed
- Update dependencies.

## [0.12.2] - 2024-04-22
### Changed
- Internal updates.

## [0.12.1] - 2024-04-08
### Changed
- Internal updates.

## [0.12.0] - 2024-04-01
### Added
- Add the 'stats/blog' REST endpoint. [#36571]
- Composer: added version constant for ststs package. [#36657]

## [0.11.2] - 2024-03-25
### Changed
- Internal updates.

## [0.11.1] - 2024-03-18
### Changed
- Internal updates.

## [0.11.0] - 2024-02-26
### Added
- Add new method to convert stats data for external consumption. [#35865]

## [0.10.1] - 2024-02-19
### Fixed
- Avoid Fatal errors when saved stats data is a WP_Error object [#35746]

## [0.10.0] - 2024-02-05
### Added
- Stats fetching mechanism: add filter allowing one to customize how long we cache results. [#35421]

### Changed
- Permit overriding cache when retrieving post views. [#34557]
- Remove pre-6.3 asset enqueuing method, and relying on WordPress Core method instead. [#34072]

### Removed
- Stop requiring the Jetpack Assets Composer package. [#34072]

## [0.9.0] - 2023-12-25
### Added
- Stats: added passing select UTM parameters to Tracking Pixel requests. [#34431]

## [0.8.0] - 2023-12-11
### Changed
- Permit overriding cache when retrieving top posts. [#34153]

## [0.7.2] - 2023-12-03
### Changed
- Internal updates.

## [0.7.1] - 2023-11-21

## [0.7.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [0.6.6] - 2023-10-23
### Fixed
- Stats: Increase timeout to 20s. [#33549]

## [0.6.5] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [0.6.4] - 2023-08-09
### Added
- Stats: compatibility for AMP for WP plugin [#32328]

## [0.6.3] - 2023-05-15
### Changed
- PHP 8.1 compatibility updates [#30517]

## [0.6.2] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [0.6.1] - 2023-04-05
### Bug fixes
- Assets: avoid fatal error with outdated package versions. [#29947]

## [0.6.0] - 2023-04-04
### Changed
- Use core WordPress methods to add the Tracking pixel to the page, instead of printing the tracking pixel directly. [#29780]

### Deprecated
- Methods used to retrieve tracking pixels are now deprecated. No replacement needed, we now hook / enqueue the tracking pixels using core WP methods. [#29780]

## [0.5.2] - 2023-03-20
### Changed
- Updated package dependencies. [#29480]

## [0.5.1] - 2023-02-20
### Changed
- Minor internal updates.

## [0.5.0] - 2023-02-15
### Added
- Added new options to store the timestamp when Odyssey is enabled and disabled [#28794]
- Stats: Adds support for Notice control [#28857]

## [0.4.2] - 2023-02-08
### Changed
- Minor internal updates.

## [0.4.1] - 2023-01-11
### Changed
- Updated package dependencies.

## [0.4.0] - 2022-12-06
### Added
- Stats: added streak, highlights, insights for WPCOM_Stats [#27604]

### Changed
- Updated package dependencies. [#27688]

## [0.3.3] - 2022-11-28
### Changed
- Updated package dependencies. [#27043]

## [0.3.2] - 2022-11-07
### Changed
- Updated package dependencies. [#27278]

## [0.3.1] - 2022-10-25
### Changed
- Updated package dependencies. [#26705]

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

[0.15.9]: https://github.com/Automattic/jetpack-stats/compare/v0.15.8...v0.15.9
[0.15.8]: https://github.com/Automattic/jetpack-stats/compare/v0.15.7...v0.15.8
[0.15.7]: https://github.com/Automattic/jetpack-stats/compare/v0.15.6...v0.15.7
[0.15.6]: https://github.com/Automattic/jetpack-stats/compare/v0.15.5...v0.15.6
[0.15.5]: https://github.com/Automattic/jetpack-stats/compare/v0.15.4...v0.15.5
[0.15.4]: https://github.com/Automattic/jetpack-stats/compare/v0.15.3...v0.15.4
[0.15.3]: https://github.com/Automattic/jetpack-stats/compare/v0.15.2...v0.15.3
[0.15.2]: https://github.com/Automattic/jetpack-stats/compare/v0.15.1...v0.15.2
[0.15.1]: https://github.com/Automattic/jetpack-stats/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/Automattic/jetpack-stats/compare/v0.14.1...v0.15.0
[0.14.1]: https://github.com/Automattic/jetpack-stats/compare/v0.14.0...v0.14.1
[0.14.0]: https://github.com/Automattic/jetpack-stats/compare/v0.13.5...v0.14.0
[0.13.5]: https://github.com/Automattic/jetpack-stats/compare/v0.13.4...v0.13.5
[0.13.4]: https://github.com/Automattic/jetpack-stats/compare/v0.13.3...v0.13.4
[0.13.3]: https://github.com/Automattic/jetpack-stats/compare/v0.13.2...v0.13.3
[0.13.2]: https://github.com/Automattic/jetpack-stats/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/Automattic/jetpack-stats/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/Automattic/jetpack-stats/compare/v0.12.5...v0.13.0
[0.12.5]: https://github.com/Automattic/jetpack-stats/compare/v0.12.4...v0.12.5
[0.12.4]: https://github.com/Automattic/jetpack-stats/compare/v0.12.3...v0.12.4
[0.12.3]: https://github.com/Automattic/jetpack-stats/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/Automattic/jetpack-stats/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/Automattic/jetpack-stats/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/Automattic/jetpack-stats/compare/v0.11.2...v0.12.0
[0.11.2]: https://github.com/Automattic/jetpack-stats/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/Automattic/jetpack-stats/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-stats/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/Automattic/jetpack-stats/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-stats/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Automattic/jetpack-stats/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/Automattic/jetpack-stats/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/Automattic/jetpack-stats/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/jetpack-stats/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-stats/compare/v0.6.6...v0.7.0
[0.6.6]: https://github.com/Automattic/jetpack-stats/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/Automattic/jetpack-stats/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/Automattic/jetpack-stats/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/Automattic/jetpack-stats/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/Automattic/jetpack-stats/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-stats/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-stats/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/Automattic/jetpack-stats/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-stats/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-stats/compare/v0.4.2...v0.5.0
[0.4.2]: https://github.com/Automattic/jetpack-stats/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Automattic/jetpack-stats/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-stats/compare/v0.3.3...v0.4.0
[0.3.3]: https://github.com/Automattic/jetpack-stats/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/Automattic/jetpack-stats/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-stats/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-stats/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-stats/compare/v0.1.0...v0.2.0
