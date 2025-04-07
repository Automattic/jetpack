# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-03-24
### Changed
- Internal updates.

## [0.3.0] - 2025-01-09
### Added
- Enable test coverage. [#39961]

### Changed
- Backup: Added next daily backup schedule time on admin page. [#39914]
- Updated dependencies. [#40286]

### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.2.6] - 2024-10-29
### Changed
- Internal updates. [#39781]

## [0.2.5] - 2024-10-15
### Changed
- Update dependencies. [#39497]

## [0.2.4] - 2024-09-06
### Changed
- Updated package dependencies. [#39004]

## [0.2.3] - 2024-05-24
### Fixed
- Backup: Change error messages to not trigger security scanners. [#36496]

## [0.2.2] - 2024-03-19
### Fixed
- Handle upgrades from plugins embedding version 0.2.0 of the package. [#36440]

## [0.2.1] - 2024-03-14
### Added
- Increasing backup version for new endpoint [#35649]

### Fixed
- Write helper script to ABSPATH by default, just like we did before [#35508]

## [0.2.0] - 2024-01-18
### Changed
- The package now requires PHP >= 7.0. [#34192]

### Fixed
- Backup: Add namespace versioning to Helper_Script_Manager and other classes. [#34739]
- Backup: Bug fixes in helper script installation class. [#34297]

## [0.1.6] - 2023-10-19
### Changed
- Updated package dependencies. [#32605]

### Fixed
- Fix helper script upload for sites without direct file system access. [#32102]

## [0.1.5] - 2023-07-06
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [0.1.4] - 2023-03-29
### Changed
- Minor internal updates.

## [0.1.3] - 2023-01-25
### Changed
- Use `WP_Filesystem` more consistently in `Helper_Script_Manager`. [#28198]

## [0.1.2] - 2022-12-05
### Changed
- Updated package dependencies. [#27688]

## [0.1.1] - 2022-11-30
### Changed
- Updated package dependencies. [#27043]

## 0.1.0 - 2022-11-01
### Added
- Adding the initial empty package
- Duplicate helper script code to a dedicated package

### Changed
- Updated package dependencies.

[0.3.1]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.2.6...v0.3.0
[0.2.6]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-transport-helper/compare/v0.1.0...v0.1.1
