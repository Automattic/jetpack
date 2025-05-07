# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.14] - 2025-05-05
### Changed
- Update package dependencies. [#43326]

## [0.8.13] - 2025-04-28
### Changed
- Internal updates.

## [0.8.12] - 2025-04-14
### Changed
- Update dependencies. [#43001]

## [0.8.11] - 2025-04-07
### Changed
- Linting: First pass of style coding standards. [#42734]
- Update dependencies. [#42820]
- Update package dependencies. [#42809]

## [0.8.10] - 2025-03-21
### Changed
- Internal updates.

## [0.8.9] - 2025-03-18
### Changed
- Update dependencies. [#42545]

## [0.8.8] - 2025-03-17
### Changed
- Internal updates.

## [0.8.7] - 2025-03-17
### Changed
- Social: Change the query parameter to open Jetpack sidebar on editor load. [#42364]

## [0.8.6] - 2025-03-12
### Changed
- Internal updates.

## [0.8.5] - 2025-03-10
### Fixed
- Exclude unit tests from published package. [#42190]

## [0.8.4] - 2025-03-03
### Changed
- Update package dependencies. [#42163]

## [0.8.3] - 2025-02-24
### Changed
- Update dependencies.

## [0.8.2] - 2025-02-17
### Changed
- Update dependencies.

## [0.8.1] - 2025-02-10
### Changed
- Updated package dependencies. [#41491]

## [0.8.0] - 2025-02-03
### Added
- Post List: Add a Copy Link Quick Action. [#41305]

## [0.7.3] - 2025-01-13
### Fixed
- Pages and Posts: Fix the layout on mobile when details are open. [#40872]

## [0.7.2] - 2024-12-16
### Changed
- Internal updates.

## [0.7.1] - 2024-11-25
### Changed
- Updated dependencies. [#40286]

## [0.7.0] - 2024-11-18
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.6.5] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [0.6.4] - 2024-10-29
### Changed
- Internal updates.

## [0.6.3] - 2024-08-23
### Changed
- Updated package dependencies. [#39004]

## [0.6.2] - 2024-04-08
### Changed
- Internal updates.

## [0.6.1] - 2024-03-18
### Changed
- Internal updates.

## [0.6.0] - 2024-02-26
### Changed
- Social Notes: Added the post list enhancements [#35819]

## [0.5.1] - 2023-11-24
### Changed
- Replaced usage of substr() with str_starts_with() and str_ends_with(). [#34207]

## [0.5.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [0.4.6] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [0.4.5] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [0.4.4] - 2023-02-20
### Changed
- Minor internal updates.

## [0.4.3] - 2022-12-06
### Changed
- Updated package dependencies. [#27688]

## [0.4.2] - 2022-11-28
### Changed
- Updated package dependencies. [#27043]

## [0.4.1] - 2022-09-20
### Changed
- Updated package dependencies.

## [0.4.0] - 2022-08-30
### Changed
- Rebrand Publicize to Jetpack Social [#25787]
- Updated package dependencies. [#25158]

## [0.3.1] - 2022-07-06
### Changed
- PHPCS: fix `WordPress.Security.ValidatedSanitizedInput`. [#23942]
- Renaming master to trunk. [#24661]
- Updated package dependencies. [#24045]

## [0.3.0] - 2022-02-01
### Changed
- Build: remove unneeded files from production build.
- Switch to pcov for code coverage.
- Updated package dependencies.
- Updated package textdomain from `jetpack` to `jetpack-post-list`.

## [0.2.4] - 2021-11-19
### Fixed
- Fixed the stretched thumbnails when using a non-square image.
- Fixed the broken layout after making a quick edit.

### Changed
- Updated package dependencies

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

[0.8.14]: https://github.com/automattic/jetpack-post-list/compare/v0.8.13...v0.8.14
[0.8.13]: https://github.com/automattic/jetpack-post-list/compare/v0.8.12...v0.8.13
[0.8.12]: https://github.com/automattic/jetpack-post-list/compare/v0.8.11...v0.8.12
[0.8.11]: https://github.com/automattic/jetpack-post-list/compare/v0.8.10...v0.8.11
[0.8.10]: https://github.com/automattic/jetpack-post-list/compare/v0.8.9...v0.8.10
[0.8.9]: https://github.com/automattic/jetpack-post-list/compare/v0.8.8...v0.8.9
[0.8.8]: https://github.com/automattic/jetpack-post-list/compare/v0.8.7...v0.8.8
[0.8.7]: https://github.com/automattic/jetpack-post-list/compare/v0.8.6...v0.8.7
[0.8.6]: https://github.com/automattic/jetpack-post-list/compare/v0.8.5...v0.8.6
[0.8.5]: https://github.com/automattic/jetpack-post-list/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/automattic/jetpack-post-list/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/automattic/jetpack-post-list/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/automattic/jetpack-post-list/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/automattic/jetpack-post-list/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/automattic/jetpack-post-list/compare/v0.7.3...v0.8.0
[0.7.3]: https://github.com/automattic/jetpack-post-list/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/automattic/jetpack-post-list/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/automattic/jetpack-post-list/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/automattic/jetpack-post-list/compare/v0.6.5...v0.7.0
[0.6.5]: https://github.com/automattic/jetpack-post-list/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/automattic/jetpack-post-list/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/automattic/jetpack-post-list/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/automattic/jetpack-post-list/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/automattic/jetpack-post-list/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/automattic/jetpack-post-list/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/automattic/jetpack-post-list/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/automattic/jetpack-post-list/compare/v0.4.6...v0.5.0
[0.4.6]: https://github.com/automattic/jetpack-post-list/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/automattic/jetpack-post-list/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/automattic/jetpack-post-list/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/automattic/jetpack-post-list/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/automattic/jetpack-post-list/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/automattic/jetpack-post-list/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/automattic/jetpack-post-list/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/automattic/jetpack-post-list/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/automattic/jetpack-post-list/compare/v0.2.4...v0.3.0
[0.2.4]: https://github.com/automattic/jetpack-post-list/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/automattic/jetpack-post-list/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/automattic/jetpack-post-list/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/automattic/jetpack-post-list/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/automattic/jetpack-post-list/compare/v0.1.0...v0.2.0
