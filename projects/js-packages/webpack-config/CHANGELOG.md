# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.3.9 - 2022-08-23
### Changed
- Updated package dependencies. [#25338, #25339, #25762]

## 1.3.8 - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## 1.3.7 - 2022-07-12
### Changed
- Updated package dependencies.

## 1.3.6 - 2022-07-06
### Changed
- Updated package dependencies. [#24923]

## 1.3.5 - 2022-06-28
### Removed
- Remove unused testing infrastructure.

## 1.3.4 - 2022-06-21
### Changed
- Updated package dependencies.

## 1.3.3 - 2022-06-14
### Changed
- Updated package dependencies. [#24724]

## 1.3.2 - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]

## 1.3.1 - 2022-05-30
### Changed
- Updated package dependencies

## 1.3.0 - 2022-05-18
### Changed
- Updated package dependencies [#24372]
- Update PnpmDeterministicModuleIdsPlugin for Webpack 5.67.0. [#24372]

## 1.2.0 - 2022-05-10
### Changed
- Updated package dependencies [#24296]

### Fixed
- Add a plugin to make module IDs more deterministic with pnpm. [#24302]

## 1.1.10 - 2022-05-04
### Added
- Add missing JavaScript dependencies. [#24096]

### Changed
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Updated package dependencies [#24208]
- Use the local copy of `@babel/runtime` rather than any that might be installed in the project. [#24096]

## 1.1.9 - 2022-04-26
### Changed
- Update package.json metadata.

## 1.1.8 - 2022-04-12
### Changed
- Updated package dependencies.

## 1.1.7 - 2022-04-05
### Changed
- Updated package dependencies

## 1.1.6 - 2022-03-29
### Changed
- Updated package dependencies.

## 1.1.5 - 2022-03-23
### Changed
- Updated package dependencies.

## 1.1.4 - 2022-03-02
### Changed
- Updated package dependencies

## 1.1.3 - 2022-02-16
### Changed
- Updated package dependencies.

## 1.1.2 - 2022-02-09
### Changed
- Updated package dependencies

## 1.1.1 - 2022-01-27
### Changed
- Updated package dependencies.

## 1.1.0 - 2022-01-25
### Added
- Add missing dev dependency on `nyc` for code coverage.

### Changed
- Updated package dependencies. Major version bump for i18n-loader-webpack-plugin.

## 1.0.2 - 2022-01-18
### Changed
- General: update required node version to v16.13.2
- Updated package dependencies.

## 1.0.1 - 2022-01-04
### Changed
- Updated package dependencies

## 1.0.0 - 2021-12-22
### Added
- Add `@automattic/i18n-loader-webpack-plugin`. This may break some builds.
- Set i18n-check-webpack-plugin's `expectDomain` based on composer.json.

### Changed
- Updated package dependencies.

## 0.5.0 - 2021-12-14
### Added
- Added `@automattic/babel-plugin-replace-textdomain` as an option for the Babel preset.
- Include `@automattic/i18n-check-webpack-plugin` in default configuration in production mode.

### Changed
- Use Webpack's provided `validateSchema` instead of requiring `schema-utils` ourself.

## 0.4.0 - 2021-11-30
### Changed
- Change default output filenames: remove `.min`, move hashes to chunk query strings, and add `minify=false` to chunk query strings.

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
