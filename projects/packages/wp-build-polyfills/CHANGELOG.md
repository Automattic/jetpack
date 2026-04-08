# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.2]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-wp-build-polyfills/compare/v0.1.0...v0.1.1
