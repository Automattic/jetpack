# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0.1] - 2026-07-15
### Fixed
- Update `@wordpress/theme` to 0.17.0 to fix the Forms and VideoPress admin dashboards rendering blank on WordPress 6.9. [#50515]

## [0.2.0] - 2026-07-06
### Changed
- Update package dependencies. [#50097] [#50183]

### Fixed
- Strip unminified JS from widgets. [#50130]

## [0.1.18] - 2026-06-26
### Changed
- Update package dependencies. [#49271]

## [0.1.17] - 2026-06-25
### Changed
- Pin `@wordpress/private-apis` to an exact version instead of the floating `next` tag. [#49838]

## [0.1.16] - 2026-06-23
### Fixed
- Private APIs: Keep the private APIs polyfill active through WordPress 7.0 and older Gutenberg versions. [#49793]
- Private APIs: Track the @next private-apis release so the bundled allowlist covers newer dashboard packages such as @wordpress/widget-dashboard. [#49793]

## [0.1.15] - 2026-06-22
### Changed
- Update package dependencies. [#49631] [#49691] [#49757]

## [0.1.14] - 2026-06-15
### Changed
- Internal updates.

## [0.1.13] - 2026-06-09
### Changed
- Update package dependencies. [#49273]

## [0.1.12] - 2026-06-08
### Changed
- Update dependencies. [#49354]

## [0.1.11] - 2026-06-01
### Changed
- Update package dependencies. [#48404] [#49152]

## [0.1.10] - 2026-05-25
### Changed
- Update package dependencies. [#48405]

## [0.1.9] - 2026-05-19
### Fixed
- Fix notices loading on older WordPress versions by bundling a compatibility helper for newer `@wordpress/notices` dependencies. [#48743]

## [0.1.8] - 2026-05-14
### Changed
- Update dependencies. [#48778]

## [0.1.7] - 2026-05-11
### Changed
- Build: Update @wordpress/admin-ui to 2.0.0. [#48410]

## [0.1.6] - 2026-05-04
### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]

## [0.1.5] - 2026-04-20
### Changed
- Update package dependencies. [#48106] [#48141]

## [0.1.4] - 2026-04-15
### Changed
- Update package dependencies. [#47907]

## [0.1.3] - 2026-04-13
### Changed
- Update package dependencies. [#47890]

### Fixed
- Skip force-replacing polyfill scripts when the Gutenberg plugin is active, preventing crashes from allowlist mismatches (e.g. @wordpress/views). [#47956]

## [0.1.2] - 2026-04-06
### Fixed
- Update @wordpress/private-apis to v1.43.0 to include @wordpress/views in the core modules allowlist, fixing a crash with latest Gutenberg trunk. [#47905]

## [0.1.1] - 2026-03-30
### Changed
- Update dependencies.

## 0.1.0 - 2026-03-23
### Added
- Create wp-build polyfills package. [#47367]

### Changed
- Update @wordpress/boot version [#47644]
- Update package dependencies. [#47684]

### Fixed
- Add @wordpress/ui to devDependencies so the boot module bundles it instead of externalizing it as an unregistered wp-ui script handle, which caused a blank page at runtime. [#47727]

[0.2.0.1]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.2.0...v0.2.0.1
[0.2.0]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.18...v0.2.0
[0.1.18]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.17...v0.1.18
[0.1.17]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.16...v0.1.17
[0.1.16]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.15...v0.1.16
[0.1.15]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.14...v0.1.15
[0.1.14]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.13...v0.1.14
[0.1.13]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.12...v0.1.13
[0.1.12]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.11...v0.1.12
[0.1.11]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.10...v0.1.11
[0.1.10]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.0...v0.1.1
