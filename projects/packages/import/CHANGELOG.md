# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.5.0]: https://github.com/Automattic/jetpack-import/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-import/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-import/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-import/compare/v0.1.0...v0.2.0
