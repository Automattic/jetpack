# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.4] - 2025-02-03
### Fixed
- Code: Remove extra params on function calls. [#41263]

## [0.7.3] - 2025-01-20
### Fixed
- General: Ensure that double encoding doesn't happen. [#40886]

## [0.7.2] - 2024-12-16
### Changed
- Internal updates.

## [0.7.1] - 2024-11-25
### Changed
- Updated dependencies. [#40286]

## [0.7.0] - 2024-11-18
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.6.0] - 2024-11-11
### Changed
- Resource Hint: use preconnect instead of dns-prefetch [#39883]

## [0.5.3] - 2024-11-04
### Added
- Enable test coverage. [#39961]

### Fixed
- Fix PHPUnit coverage warnings. [#39989]

## [0.5.2] - 2024-10-29
### Changed
- Internal updates. [#39303]

## [0.5.1] - 2024-10-10
### Fixed
- Avoid deprecation notice when an image URL does not have an expected format. [#39685]
- URL encode path parts of an image [#39560]

## [0.5.0] - 2024-10-07
### Added
- Add a public method to check if a URL is CDN url. [#39635]

## [0.4.9] - 2024-09-09
### Changed
- Update dependencies. [#39260]

## [0.4.8] - 2024-09-03
### Fixed
- Avoid a fatal error if an `<img>` tag has width or height that's not an integer or percentage.

## [0.4.7] - 2024-08-29
### Changed
- Rely on WordPress HTML API to parse HTML instead of Regex [#32700]

## [0.4.6] - 2024-08-26
### Changed
- Updated package dependencies. [#39004]

## [0.4.5] - 2024-08-19
### Fixed
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## [0.4.4] - 2024-08-05
### Changed
- Do not serve media from Amazon CDN from Jetpack's CDN. [#38682]

## [0.4.3] - 2024-06-21
### Changed
- Image CDN: Added support for query strings in image URLs [#37931]
- More closely match core behavior while downsizing images [#37946]

## [0.4.2] - 2024-06-11
### Fixed
- Add additional check to avoid PHP deprecation warnings. [#37788]

## [0.4.1] - 2024-05-20
### Changed
- Internal updates.

## [0.4.0] - 2024-05-06
### Removed
- Lazy Loading: Removed compatibility script for Jetpack Lazy Loading module. [#37069]

## [0.3.7] - 2024-04-29
### Changed
- Internal updates.

## [0.3.6] - 2024-04-25
### Changed
- Update dependencies. [#33960]

## [0.3.5] - 2024-04-22
### Fixed
- WP.com: Don't Photonize images on private WordPress.com sites. [#36876]

## [0.3.4] - 2024-04-08
### Changed
- Update filter docblock to match possible types. [#36731]

## [0.3.3] - 2024-03-15
### Changed
- Internal updates.

## [0.3.2] - 2023-12-03
### Changed
- Internal updates.

## [0.3.1] - 2023-11-24
### Changed
- Replaced usage of strpos() with str_contains(). [#34137]
- Replaced usage of substr() with str_starts_with() and str_ends_with(). [#34207]

## [0.3.0] - 2023-11-20
### Changed
- Replaced usage of strpos() with str_starts_with(). [#34135]
- The package now requires PHP >= 7.0. [#34192]

## [0.2.8] - 2023-11-03
### Changed
- Update dependencies. [#33946]

## [0.2.7] - 2023-10-16
### Added
- Added HEIC (`*.heic`) to list of images types allowed to be passed through Photon. [#33494]

## [0.2.6] - 2023-09-28
### Fixed
- Use WordPress `str_ends_with` polyfill. [#33288]

## [0.2.5] - 2023-09-19

- Minor internal updates.

## [0.2.4] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [0.2.3] - 2023-06-06
### Fixed
- Photon: fix potential bug where two "?" characters might be added to a url [#30865]

## [0.2.2] - 2023-05-15
### Added
- Add compatibility layer for the ActivityPub plugin [#30298]

## [0.2.1] - 2023-05-11
### Added
- Added `is_enabled()` method to check if image CDN is enabled by any plugin' [#30582]

## [0.2.0] - 2023-05-08
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

### Changed
- Update photon compatibility to allow using the package in Jetpack [#30050]

### Removed
- Remove unused method used to update images in Open Graph Meta tags. [#30338]

## 0.1.0 - 2023-04-06
### Added
- Add image CDN package. [#29561]

[0.7.4]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.5.3...v0.6.0
[0.5.3]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.9...v0.5.0
[0.4.9]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.8...v0.4.9
[0.4.8]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.7...v0.4.8
[0.4.7]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.6...v0.4.7
[0.4.6]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.3.7...v0.4.0
[0.3.7]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.8...v0.3.0
[0.2.8]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-image-cdn/compare/v0.1.0...v0.2.0
