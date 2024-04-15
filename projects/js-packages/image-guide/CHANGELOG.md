# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.8] - 2024-03-29
### Changed
- Updated package dependencies. [#30684]

## [0.5.7] - 2024-03-15
### Changed
- Updated package dependencies. [#36142]

## [0.5.6] - 2024-02-22
### Changed
- Make build usable in projects using tsc with `moduleResolution` set to 'nodenext'. [#35453]
- Updated targets in build configuration to better match supported browsers. [#35764]

### Fixed
- Fix image name causing image to go outside details panel. [#35309]

## [0.5.5] - 2024-01-22
### Changed
- Updated package dependencies. [#34427]

## [0.5.4] - 2023-10-26
### Changed
- Updated package dependencies. [#32957]
- Updated package dependencies. [#33567]
- Updated package dependencies. [#33569]

## [0.5.3] - 2023-09-13
### Changed
- Updated package dependencies. [#32953]

## [0.5.2] - 2023-09-01
### Changed
- Updated package dependencies. [#31815] [#32605]
- Update tiny image check to treat images who's dimentions are missing as tiny. [#32144]

### Removed
- Remove unnecessary files from mirror repo and published package. [#32674]

### Fixed
- Handle zero dimensions in getOversizedRatio [#32548]

## [0.5.1] - 2023-07-11
### Fixed
- Image Guide: Fix for broken background-images causing the image guide not to load [#31792]

## [0.5.0] - 2023-07-07
### Added
- Boost: exclude small images from Image Size Analysis [#31504]

### Changed
- Return an error when an image is missing, instead of -1 by -1 dimensions. [#31632]

### Fixed
- Check response.url, not response.ok to verify a response worked [#31538]

## [0.4.0] - 2023-06-23
### Added
- Jetpack Boost: add a proxy to Image Guide so it can load remote images. [#31145]

### Fixed
- Improved image url validation for background image source. [#31410]

## 0.3.0 - 2023-05-11
### Changed
- Set `exports` in package.json. This will break directly requiring files from within the package in environments that respect `exports`. [#30313]
- Updated package dependencies. [#30264] [#30265] [#30294]

## 0.2.1 - 2023-04-06
### Changed
- Updated package dependencies. [#28609]

## 0.2.0 - 2023-01-19
### Changed
- Bundle the package to make it easy to consume [#28429]

### Fixed
- Clean up JavaScript eslint issues. [#28441]

## 0.1.2 - 2023-01-17
### Added
- Fixed an issue that would break the release process [#28186]

### Fixed
- Adding prepare script back to package.json, was needed for an ESlint test [#28103]

## 0.1.1 - 2022-12-26
### Added
- Turn on auto-publish [#28032]

### Removed
- Minor package.json change - removing private entry. [#28071]

## 0.1.0 - 2022-12-23
### Added
- Turn on auto-publish

### Removed
- Minor package.json change - removing private entry.

[0.5.8]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.7...v0.5.8
[0.5.7]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.6...v0.5.7
[0.5.6]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-image-guide/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-image-guide/compare/v0.3.0...v0.4.0
