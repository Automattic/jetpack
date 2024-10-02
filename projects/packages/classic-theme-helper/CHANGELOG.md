# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.2] - 2024-09-30
### Added
- Admin dashboard: Disable portfolio toggle if theme supports portfolio and site is WoA [#39508]

## [0.6.1] - 2024-09-23
### Fixed
- Portfolios: Ensure these are enabled and working properly on themes that support portfolios [#39431]

## [0.6.0] - 2024-09-16
### Added
- Content Options: Ensuring feature is now required. [#39210]

### Changed
- Custom Content Types: Require feature along with portfolios from the package [#39268]

## [0.5.6] - 2024-09-10
### Changed
- Updated package dependencies. [#39302]

## [0.5.5] - 2024-09-09
### Added
- Site Breadcrumbs: Ensure main function is not created when host is WordPress.com. [#39235]

### Changed
- Updated package dependencies. [#39176]

### Fixed
- Content Options: Add back value to filter in package version of Content Options file. [#39200]

## [0.5.4] - 2024-08-30
### Security
- Social Menu: Switch to more appropriate method of calling the SVG icon file. [#39136]

### Added
- Classic Theme Helper: Adding Portfolio custom post type content [#39134]
- Content Options: Moving content to Classic Theme Helper package. [#39028]

### Changed
- Updated package dependencies. [#39111]

## [0.5.3] - 2024-08-26
### Changed
- Site Breadcrumbs: Requiring the feature from the Classic Theme Helper package [#38931]

## [0.5.2] - 2024-08-23
### Changed
- Updated package dependencies. [#39004]

## [0.5.1] - 2024-08-21
### Fixed
- Revert recent SVG image optimizations. [#38981]
- Social Menus: fix SVG format. [#38966]

## [0.5.0] - 2024-08-19
### Added
- Site Breadcrumbs: Copying functionality file into Classic Theme Helper package. [#38880]
- Social Links: Requiring feature from Classic Theme Helper package instead of Jetpack module. [#38730]

### Changed
- Updated package dependencies. [#38662]

### Fixed
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## [0.4.5] - 2024-08-12
### Changed
- Social Links: Modified package file - new functions, modified function types, added imports [#38738]

## [0.4.4] - 2024-08-05
### Added
- Social Links: Added feature to Classic Theme Helper package. [#38593]

## [0.4.3] - 2024-07-25
### Changed
- Social Menus: Requiring the feature from the Classic Theme Helper package. [#38297]

## [0.4.2] - 2024-07-22
### Added
- Added Jetpack_Color class. [#38357]

## [0.4.1] - 2024-07-15
### Added
- Theme Tools: Adding Social Menu to Classic Theme Helper package [#38243]

## [0.4.0] - 2024-07-08
### Changed
- Classic Theme Helper - Featured Content: Moved check for plugins page to init since setup is used now externally [#38215]
- Classic Theme Helper - Requiring Responsive Videos and Featured Content files. [#37969]
- Updated package dependencies. [#38132]

### Removed
- Classic Theme Helper: Remove wpcom only code for featured content [#38154]

## [0.3.1] - 2024-06-13
### Changed
- Updated package dependencies. [#37796]

## [0.3.0] - 2024-06-10
### Changed
- Classic Theme Helper: Move code from module to package [#37260]

## [0.2.1] - 2024-06-06
### Changed
- Updated package dependencies. [#37669]

### Fixed
- Classic Theme Helper: Added dist folder to gitattributes so mirror repo picks it. [#37677]

## [0.2.0] - 2024-05-27
### Added
- Classic Theme Helper: Add responsive videos. [#37406]
- Classic Theme Helper: Copied featured content code from module. [#37515]

## 0.1.0 - 2024-05-09
### Added
- Classic Theme Helper: Added Featured content code to the package. [#37202]
- Initial version. [#37175]

### Changed
- Add wordpress folder on gitignore. [#37177]

[0.6.2]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.5.6...v0.6.0
[0.5.6]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.4.5...v0.5.0
[0.4.5]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.1.0...v0.2.0
