# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.0 - 2021-11-22
### Added
- Added a `CssRule` in place of making everyone construct their own from a bunch of loaders.

### Removed
- Removed the `CssCacheLoader` loader (turns out `cache-loader` is deprecated), and moved the other CSS loaders to sub-properties of `CssRule`.

## 0.2.0 - 2021-11-16
### Added
- Forked calypso-build's mini-css-with-rtl plugin and cleaned it up.

### Changed
- Updated package dependencies
- Use `@automattic/babel-plugin-preserve-i18n` now that it has been split from calypso-build.

### Fixed
- Fix browserslist defaulting to `@wordpress/browserslist-config`.
- Reconfigure terser to preserve "translators" comments, and upgrade css-minimizer.

## 0.1.0 - 2021-11-09
### Added
- Initial release.

### Changed
- Updated package dependencies.
