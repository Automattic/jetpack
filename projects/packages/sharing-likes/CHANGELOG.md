# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-10-12
### Added
- Add a React version of the Settings > Sharing screen, available behind the `rsm_jetpack_ui_modernization_sharing_likes` filter. [#53297]
- Add a services manager to the React version of Settings > Sharing: reorder, add and remove sharing buttons, and create, edit and delete custom services. [#53378]
- Add Initializer::init() to set up the settings screen and its REST routes in one call. [#53099]
- Add REST endpoints to read and save every setting on Settings > Sharing, and to switch each feature to its block or turn it back on. [#53099]

### Changed
- Settings: Save no placement along with other sharing options until one is chosen, and return the saved options from Sharing_Options::update(). [#53278]

### Removed
- Remove the Sharing_Likes class. Read PACKAGE_VERSION from Initializer instead. [#53099]

### Fixed
- Stop Settings > Sharing from resetting sharing links to open in the same window. [#53099]

## [0.2.0] - 2026-10-05
### Added
- Add classes that register the per-post Likes and Sharing switches in the REST API. [#52950]

## [0.1.1] - 2026-09-29
### Changed
- Internal updates.

## 0.1.0 - 2026-09-28
### Added
- Initial version. [#52339]
- Settings: Add the wp-admin Settings > Sharing screen, covering sharing buttons, Like buttons, and where they appear. [#52407] [#52727] [#52756] [#52758]
- Settings: Give Comment Likes their own section on every platform, and offer the Like block to Jetpack and Atomic sites running Comment Likes. [#52796]

[0.3.0]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.1.0...v0.1.1
