# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.5.1]: https://github.com/Automattic/jetpack-image-guide/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-image-guide/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-image-guide/compare/v0.3.0...v0.4.0
