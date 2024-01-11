# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.2]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-boost-core/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-boost-core/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/Automattic/jetpack-boost-core/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-boost-core/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-boost-core/compare/v0.1.0...v0.1.1
