# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.5.8 - 2023-08-09
### Changed
- Updated package dependencies. [#32166]

## 1.5.7 - 2023-07-18
### Changed
- Updated package dependencies. [#31922]

## 1.5.6 - 2023-07-17
### Changed
- Updated package dependencies. [#31872]

## 1.5.5 - 2023-07-11
### Changed
- Updated package dependencies. [#31785]

## 1.5.4 - 2023-07-05
### Changed
- Updated package dependencies. [#31659]

## 1.5.3 - 2023-06-26
### Changed
- Updated package dependencies. [#31524]

## 1.5.2 - 2023-06-21
### Changed
- Updated package dependencies. [#31468]

## 1.5.1 - 2023-06-06
### Changed
- Updated package dependencies. [#31129]

## 1.5.0 - 2023-05-02
### Added
- Webpack's `.resolve.conditionNames` may now be set from `.npmrc` or the corresponding environment variable. [#30313]

### Changed
- Updated package dependencies.

## 1.4.5 - 2023-04-25
### Changed
- Updated package dependencies. [#30246]

## 1.4.4 - 2023-04-17
### Changed
- Updated package dependencies. [#30019]

## 1.4.3 - 2023-04-04
### Changed
- Updated package dependencies. [#29854]

## 1.4.2 - 2023-03-29
### Changed
- Minor internal updates.

## 1.4.1 - 2023-03-28
### Changed
- Minor internal updates.

## 1.4.0 - 2023-03-27
### Added
- Adds compatibility with @svgr/webpack library for loading svg files as react components [#29544]

## 1.3.27 - 2023-03-23
### Changed
- Updated package dependencies.

## 1.3.26 - 2023-03-20
### Changed
- Updated package dependencies. [#29471]

## 1.3.25 - 2023-03-08
### Changed
- Updated package dependencies. [#29216]

## 1.3.24 - 2023-02-15
### Changed
- Update to React 18. [#28710]

## 1.3.23 - 2023-02-06
### Changed
- Updated package dependencies.

## 1.3.22 - 2023-01-25
### Changed
- Minor internal updates.

## 1.3.21 - 2023-01-23
### Changed
- Replace `duplicate-package-checker-webpack-plugin` with `@cerner/duplicate-package-checker-webpack-plugin`. [#28518]

## 1.3.20 - 2023-01-11
### Changed
- Updated package dependencies.

## 1.3.19 - 2022-12-02
### Changed
- Updated package dependencies. [#27697]

## 1.3.18 - 2022-11-22
### Changed
- Updated package dependencies. [#27043]

## 1.3.17 - 2022-11-10
### Changed
- Updated package dependencies. [#27319]

## 1.3.16 - 2022-11-08
### Changed
- Updated package dependencies. [#27289]

## 1.3.15 - 2022-11-01
### Changed
- Updated package dependencies.

## 1.3.14 - 2022-10-13
### Changed
- Updated package dependencies. [#26791]

## 1.3.13 - 2022-10-05
### Changed
- Updated package dependencies. [#26568]

## 1.3.12 - 2022-09-13
### Changed
- Updated package dependencies. [#26072]

## 1.3.11 - 2022-09-08
### Changed
- Updated package dependencies.

## 1.3.10 - 2022-08-25
### Changed
- Updated package dependencies. [#25814]

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
