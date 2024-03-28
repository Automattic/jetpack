# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.9] - 2024-03-27
### Added
- Use `jetpack_boost_critical_css_environment_changed` hook instead of `handle_environment_change` [#36519]

### Changed
- Speed Score: More accurately detect which modules are active when a speed score is requested. [#36534]

### Fixed
- Updated Jetpack_Boost_Modules placeholder class to match Boost interface [#36598]

## [0.3.8] - 2024-03-25
### Changed
- Internal updates.

## [0.3.7] - 2024-03-18
### Changed
- Internal updates.

## [0.3.6] - 2024-03-14
### Changed
- Internal updates.

## [0.3.5] - 2024-03-01
### Changed
- Add gereric Jetpack_Boost_Modules class for when Boost is uninstalled/not activated. [#36080]

## [0.3.4] - 2024-02-13
### Fixed
- Speed Score: Do not return no-boost score if no boost modules are active [#35327]

## [0.3.3] - 2024-01-22
### Added
- Send current boost version with API requests to handle requests accordingly [#35132]

### Changed
- Jetpack Boost: Use Arrays, not objects [#35062]

## [0.3.2] - 2024-01-15
### Changed
- Internal updates.

## [0.3.1] - 2023-12-14
### Changed
- Internal updates.

## [0.3.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [0.2.2] - 2023-09-19
### Fixed
- Fixed deprecation notice in PHP 8.2. [#33079]

## [0.2.1] - 2023-08-28
### Added
- Add boost speed score history endpoint [#32016]

### Changed
- Updated package dependencies. [#32605]
- Updated package version [#32016]

## [0.2.0] - 2023-06-06
### Changed
- Moved boost core classes to boost-core package [#31163]
- Updated package dependencies. [#31163]

## 0.1.0 - 2023-05-29
### Added
- Add a new package for Boost Speed Score [#30914]
- Add a new argument to `Speed_Score` to identify where the request was made from (e.g. 'boost-plugin', 'jetpack-dashboard', etc). [#31012]

[0.3.9]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.8...v0.3.9
[0.3.8]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.7...v0.3.8
[0.3.7]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-boost-speed-score/compare/v0.1.0...v0.2.0
