# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2024-08-29
### Added
- Add mapping for `es-x/no-regexp-duplicate-named-capturing-groups`. [#39005]
- Support eslint flat configs (`eslint.config.js`). [#37855]
- Updated `eslint-plugin-es-x` adds additional rules: `es-x/no-arraybuffer-prototype-transfer`, `es-x/no-object-map-groupby`, `es-x/no-promise-withresolvers`, `es-x/no-resizable-and-growable-arraybuffers`, `es-x/no-set-prototype-difference`, `es-x/no-set-prototype-intersection`, `es-x/no-set-prototype-isdisjointfrom`, `es-x/no-set-prototype-issubsetof`, `es-x/no-set-prototype-issupersetof`, `es-x/no-set-prototype-symmetricdifference`, and `es-x/no-set-prototype-union`. [#37830]

### Changed
- Updated package dependencies. [#35608] [#36095] [#36325] [#36585] [#36760] [#37147] [#37379] [#37669] [#37828] [#37830] [#38132] [#38662] [#39002]

## [2.1.0] - 2024-02-07
### Added
- All versions indicated by browserslist are now checked, not just the lowest. Added `getAllBrowsers` function to support this. [#31658]
- Support for more complex MDN data:
  * Multiple support statements are now all checked. Previously only the first (most recent) was, which may have missed cases where support was backported.
  * `version_removed` is now checked.
  * Ranged versions (≤) are now handled.
  * `prefix`, `alternative_name`, and `flags` now indicate (possible) lack of support. [#31658]

### Changed
- Updated package dependencies.

### Deprecated
- Deprecated `getBrowsers` function in favor of the new `getAllBrowsers`. [#31658]

### Fixed
- Apparently MDN data considers "preview" a version, but didn't think that worth documenting. Handle it. [#31816]

## [2.0.0] - 2023-06-26
### Changed
- As `eslint-plugin-es` appears to be abandoned, change to using `eslint-plugin-es-x`. [#31556]
- Updated package dependencies.

## [1.0.6] - 2023-04-07
### Changed
- Update to React 18.

## [1.0.5] - 2023-01-11
### Changed
- Updated package dependencies.

## [1.0.4] - 2022-11-01
### Changed
- Updated package dependencies.

## [1.0.3] - 2022-07-06
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Update package.json metadata. [#23990]
- Updated package dependencies.

## [1.0.2] - 2022-04-05
### Removed
- Removed eslint from devDependencies

## [1.0.1] - 2022-02-01
### Changed
- General: update required node version to v16.13.2
- Updated package dependencies

## 1.0.0 - 2021-11-16
### Added
- Initial release.

[2.2.0]: https://github.com/Automattic/eslint-config-target-es/compare/2.1.0...2.2.0
[2.1.0]: https://github.com/Automattic/eslint-config-target-es/compare/2.0.0...2.1.0
[2.0.0]: https://github.com/Automattic/eslint-config-target-es/compare/1.0.6...2.0.0
[1.0.6]: https://github.com/Automattic/eslint-config-target-es/compare/1.0.5...1.0.6
[1.0.5]: https://github.com/Automattic/eslint-config-target-es/compare/1.0.4...1.0.5
[1.0.4]: https://github.com/Automattic/eslint-config-target-es/compare/1.0.3...1.0.4
[1.0.3]: https://github.com/Automattic/eslint-config-target-es/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/Automattic/eslint-config-target-es/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/Automattic/eslint-config-target-es/compare/1.0.0...1.0.1
