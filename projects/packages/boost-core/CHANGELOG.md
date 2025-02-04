# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.5] - 2025-02-03
### Fixed
- Code: Remove extra params on function calls. [#41263]

## [0.3.4] - 2025-01-23
### Changed
- Internal updates.

## [0.3.3] - 2024-12-23
### Fixed
- General: Fixed not parsing error responses from WordPress.com properly. [#40660]

## [0.3.2] - 2024-11-28
### Fixed
- Cachable: Make the expiry overridable by child classes. [#40339]

## [0.3.1] - 2024-11-25
### Changed
- Updated dependencies. [#40286]

## [0.3.0] - 2024-11-14
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.2.14] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [0.2.13] - 2024-10-29
### Changed
- Internal updates.

## [0.2.12] - 2024-09-23
### Changed
- Update dependencies.

## [0.2.11] - 2024-09-05
### Changed
- Update dependencies.

## [0.2.10] - 2024-09-05
### Changed
- Update dependencies.

## [0.2.9] - 2024-08-26
### Changed
- Updated package dependencies. [#39004]

## [0.2.8] - 2024-08-15
### Fixed
- Fix incorrect next-version tokens in php `@since` and/or `@deprecated` docs. [#38869]

## [0.2.7] - 2024-05-06
### Added
- Add missing package dependencies. [#37141]

## [0.2.6] - 2024-03-25
### Changed
- Internal updates.

## [0.2.5] - 2024-03-14
### Changed
- Internal updates.

## [0.2.4] - 2024-01-25
### Fixed
- Chage get_client() visibility so that older versions of boost do not break. [#35240]

## [0.2.3] - 2024-01-22
### Added
- Send current boost version with API requests to handle requests accordingly [#35132]

### Changed
- Jetpack Boost: Use ARRAY_A when decoding from JSON [#35062]

## [0.2.2] - 2023-11-24
### Changed
- Replaced usage of strpos() with str_contains(). [#34137]
- Replaced usage of substr() with str_starts_with() and str_ends_with(). [#34207]

## [0.2.1] - 2023-11-21
### Fixed
- Made abstract static methods in `Automattic\Jetpack\Boost_Core\Lib\Cacheable` abstract, instead of being implemented to always throw. [#34220]

## [0.2.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [0.1.3] - 2023-09-19

- Minor internal updates.

## [0.1.2] - 2023-09-01
### Fixed
- Fix showing default error message and code when parsing cloud response. [#32685]

## [0.1.1] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## 0.1.0 - 2023-06-06
### Added
- Introduce new package. [#31163]

[0.3.5]: https://github.com/Automattic/jetpack-boost-core/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/Automattic/jetpack-boost-core/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/Automattic/jetpack-boost-core/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/Automattic/jetpack-boost-core/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-boost-core/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.14...v0.3.0
[0.2.14]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.13...v0.2.14
[0.2.13]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.12...v0.2.13
[0.2.12]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.11...v0.2.12
[0.2.11]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.10...v0.2.11
[0.2.10]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.9...v0.2.10
[0.2.9]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.8...v0.2.9
[0.2.8]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-boost-core/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/Automattic/jetpack-boost-core/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-boost-core/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-boost-core/compare/v0.1.0...v0.1.1
