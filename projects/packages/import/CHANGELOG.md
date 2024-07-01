# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.6] - 2024-05-27
### Changed
- Update dependencies.

## [0.8.5] - 2024-05-06
### Added
- Add missing package dependencies. [#37141]

## [0.8.4] - 2024-04-29
### Changed
- Internal updates.

## [0.8.3] - 2024-04-08
### Changed
- Internal updates.

## [0.8.2] - 2024-03-18
### Changed
- Internal updates.

## [0.8.1] - 2023-11-24
### Changed
- Replaced usage of strpos() with str_contains(). [#34137]

## [0.8.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [0.7.4] - 2023-09-19

- Minor internal updates.

## [0.7.3] - 2023-09-11
### Fixed
- Handles scaled images for attachments [#32838]

## [0.7.2] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [0.7.1] - 2023-05-29
### Changed
- Internal updates.

## [0.7.0] - 2023-04-17
### Added
- Added Unified Importer end endpoint [#30087]
- Add new start endpoint. [#30028]

## [0.6.1] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [0.6.0] - 2023-04-04
### Added
- Add support for wp_block, wp_navigation, wp_template, wp_template_part import. [#29744]
- Align all HTTP codes to a standard 409. [#29869]

## [0.5.0] - 2023-03-29
### Added
- Prevent media duplication when it's already existed [#29646]

### Fixed
- Remove process post meta function outside of hook [#29771]

## [0.4.0] - 2023-03-27
### Added
- Added global style import. [#29622]
- Added import of custom CSS [#29595]
- Adding functionality to create term on the fly [#29581]

### Changed
- Updated package version [#29457]

### Fixed
- Fixed post meta imports issue [#29497]
- Fix wp_global_styles issue [#29686]

## [0.3.0] - 2023-03-20
### Added
- Add support for nav-menu and nav-menu-item import. [#29481]

### Fixed
- Fix attachments path for import media endpoint [#29379]

## [0.2.0] - 2023-03-08
### Added
- Add the `/jetpack/v4/import/media/*` endpoints. [#29080]

## 0.1.0 - 2023-02-20
### Added
- Added import REST endpoints. [#28824]
- Add new Jetpack Import package. [#28735]

### Fixed
- Fixed various imported resources hierarchies [#29012]

[0.8.6]: https://github.com/Automattic/jetpack-import/compare/v0.8.5...v0.8.6
[0.8.5]: https://github.com/Automattic/jetpack-import/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/Automattic/jetpack-import/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/Automattic/jetpack-import/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/Automattic/jetpack-import/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-import/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-import/compare/v0.7.4...v0.8.0
[0.7.4]: https://github.com/Automattic/jetpack-import/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/Automattic/jetpack-import/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/Automattic/jetpack-import/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/jetpack-import/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-import/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/Automattic/jetpack-import/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-import/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-import/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-import/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-import/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-import/compare/v0.1.0...v0.2.0
