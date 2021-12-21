# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2021-12-14
### Changed
- Search package: add new methods and update timing for `Plan` class.
- Search package: refactored Module_Control class.

## [0.2.1] - 2021-12-07
### Changed
- Updated package dependencies.

## [0.2.0] - 2021-11-30
### Added
- Added essential scaffolding for package.
- Migrate additional helper classes to package
- Search: added new state store for search dashboard
- Search package: duplicated search dashboard dependencies to the package

### Changed
- Search: migrate/create necessary APIs for the frontend
- Search: removed other dependencies from copied code

## 0.1.0 - 2021-11-09
### Added
- Add a new Search package with Helper and Options classes.
- Search: Migrate helper classes from Jetpack plugin

### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Updated package dependencies.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

[0.3.0]: https://github.com/Automattic/jetpack-search/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/jetpack-search/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-search/compare/v0.1.0...v0.2.0
