# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.3] - 2025-06-02
### Changed
- Update dependencies. [#42876]

## [0.13.2] - 2025-05-26
### Changed
- Update package dependencies. [#43516] [#43578]

### Fixed
- Featured Content: Prevent error if invalid taxonomy data is provided. [#43553]

## [0.13.1] - 2025-05-19
### Changed
- Update package dependencies. [#43398]

## [0.13.0] - 2025-05-12
### Changed
- Update package dependencies. [#43400]

### Removed
- Remove Skype since the service no longer exists. [#43375]

## [0.12.1] - 2025-05-05
### Changed
- Update package dependencies. [#43326]

### Fixed
- Linting: Do additional stylesheet cleanup. [#43247]

## [0.12.0] - 2025-04-28
### Added
- Featured Content: Add messaging to clarify that the tag name is case sensitive. [#43165]

### Changed
- Update Phan baseline. [#43085]

### Fixed
- Code: Remove unneeded `data:` URI components. [#43227]
- Linting: Fix more Stylelint violations. [#43213]
- Linting: Remove outdated vendor prefixes in stylesheets. [#43219]
- Social Menus: Reorder SVGs to be alphabetic. [#41134]

## [0.11.8] - 2025-04-14
### Changed
- Social Menus: Update the Twitter sharing button to use the X logo. [#42813]

### Fixed
- Linting: Update stylesheets to use WordPress rules for fonts. [#42928]
- Linting: Use double colon notation for pseudo-element selectors. [#43019]

## [0.11.7] - 2025-04-07
### Changed
- Linting: First pass of style coding standards. [#42734]

## [0.11.6] - 2025-04-02
### Changed
- Update dependencies. [#42820]
- Update package dependencies. [#42809]

## [0.11.5] - 2025-03-24
### Changed
- Internal updates.

## [0.11.4] - 2025-03-18
### Changed
- Update package dependencies. [#42511]

## [0.11.3] - 2025-03-12
### Changed
- Internal updates.

## [0.11.2] - 2025-03-10
### Changed
- Internal updates.

## [0.11.1] - 2025-03-03
### Added
- Custom Content Types: Ensure script with initial state value is only added on Jetpack admin pages. [#42138]

### Changed
- Update package dependencies. [#42163]

## [0.11.0] - 2025-02-24
### Added
- Theme tools: Load theme compat functionality relevant to features in Classic Theme Helper package from this package. [#41598]

### Changed
- Custom Post Types: Do not display testimonials and portfolios on block themes where they are not in use. [#41714]

## [0.10.1] - 2025-02-17
### Changed
- Update dependencies.

## [0.10.0] - 2025-02-10
### Changed
- Custom Content Types: Ensure feature works on Jetpack settings page without using module functionality. [#41349]
- Update package dependencies. [#41491]

## [0.9.3] - 2025-02-03
### Added
- Theme compat: Move relevant functionality to the package. [#41394]

### Changed
- Update package dependencies. [#41286]

## [0.9.2] - 2025-01-27
### Fixed
- Classic Theme Helper: Fix Fatal in Jetpack_Portfolio. [#41304]

## [0.9.1] - 2025-01-20
### Changed
- Code: Use function-style exit() and die() with a default status code of 0. [#41167]
- Updated package dependencies. [#41099]

## [0.9.0] - 2025-01-13
### Added
- Nova Restaurant: ensuring the custom post type is now being required via the package. [#40782]

## [0.8.3] - 2025-01-10
### Fixed
- Testimonials: Fix a shortcode-related bug which occurs if the column attribute is added and set to 0. [#40896]

## [0.8.2] - 2025-01-06
### Changed
- Updated package dependencies. [#40784] [#40831]

## [0.8.1] - 2024-12-23
### Added
- Custom Post Types: Added Restaurant Menu CPT files. [#40668]

## [0.8.0] - 2024-12-16
### Added
- Jetpack Testimonials: Ensuring functionality runs via the Classic Theme Helper package. [#40388]

### Changed
- Updated package dependencies. [#40564]

### Fixed
- Testimonials: Include shortcode CSS file. [#40592]

## [0.7.4] - 2024-12-09
### Fixed
- Content Options: Ensure excerpt_length is cast to an int if it is not already, to prevent fatal errors. [#40389]
- Customizer: Fix spacing issue in Content Options. [#40445]

## [0.7.3] - 2024-12-04
### Changed
- Updated package dependencies. [#40363]

## [0.7.2] - 2024-12-02
### Added
- Add Testimonial custom post type content. [#40295]

## [0.7.1] - 2024-11-25
### Changed
- Updated package dependencies. [#40286] [#40288]

## [0.7.0] - 2024-11-18
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.6.7] - 2024-11-11
### Changed
- Updated package dependencies. [#39999] [#40060]

## [0.6.6] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [0.6.5] - 2024-10-28
### Changed
- Updated package dependencies. [#39910]

## [0.6.4] - 2024-10-14
### Changed
- Updated package dependencies. [#39707]

## [0.6.3] - 2024-10-07
### Changed
- Updated package dependencies. [#39594]

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

[0.13.3]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.13.2...v0.13.3
[0.13.2]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.12.1...v0.13.0
[0.12.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.8...v0.12.0
[0.11.8]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.7...v0.11.8
[0.11.7]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.6...v0.11.7
[0.11.6]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.5...v0.11.6
[0.11.5]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.4...v0.11.5
[0.11.4]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.3...v0.11.4
[0.11.3]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.2...v0.11.3
[0.11.2]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.9.3...v0.10.0
[0.9.3]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.8.3...v0.9.0
[0.8.3]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.7.4...v0.8.0
[0.7.4]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.6.7...v0.7.0
[0.6.7]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/Automattic/jetpack-classic-theme-helper/compare/v0.6.2...v0.6.3
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
