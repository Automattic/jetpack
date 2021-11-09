# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2021-11-02
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Thumbnails only available on "Pages" and "Posts". Share action only when publicize and block-editor supported.
- Updated package dependencies.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## [0.2.2] - 2021-10-08
### Fixed
- Fixed the check for a valid thumbnail

## [0.2.1] - 2021-10-06
### Changed
- Updated package dependencies

## [0.2.0] - 2021-10-06
### Added
- Added a 'Share' post action

### Changed
- Only add the thumbnail column for post types that support it
- Updated package dependencies.

## 0.1.0 - 2021-09-22
### Added
- Add the new Post List package to Jetpack project

### Changed
- Updated the default columns displayed on the post and page list screens
- Refactored thumbnail preview to function server side. All javascript removed.

[0.2.3]: https://github.com/automattic/jetpack-post-list/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/automattic/jetpack-post-list/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/automattic/jetpack-post-list/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/automattic/jetpack-post-list/compare/v0.1.0...v0.2.0
