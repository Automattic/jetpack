# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.2] - 2023-08-21
### Changed
- Use the new method to render Connection initial state. [#32499]

### Fixed
- Add a stub module to avoid the native mobile editor importing incompatible web modules. [#32468]

## [0.11.1] - 2023-08-09
### Changed
- Updated package dependencies. [#32166]

## [0.11.0] - 2023-08-07
### Added
- Add shared block editor logo component. [#32257]

## [0.10.9] - 2023-07-17
### Changed
- Updated package dependencies. [#31872]

## [0.10.8] - 2023-07-11
### Changed
- Updated package dependencies. [#31785]

## [0.10.7] - 2023-07-05
### Changed
- Updated package dependencies. [#31659]

## [0.10.6] - 2023-06-21
### Changed
- Updated package dependencies. [#31468]

## [0.10.5] - 2023-06-06
### Changed
- Updated package dependencies. [#31129]

## [0.10.4] - 2023-05-02
### Changed
- Updated package dependencies.

## [0.10.3] - 2023-04-17
### Changed
- Updated package dependencies. [#30019]

## [0.10.2] - 2023-04-04
### Changed
- Updated package dependencies. [#29854]

## [0.10.1] - 2023-03-28
### Changed
- Minor internal updates.

## [0.10.0] - 2023-03-27
### Added
- useModuleStatus: Add new hook to enable or disable Jetpack modules. [#29044]

## [0.9.2] - 2023-03-23
### Changed
- Updated package dependencies.

## [0.9.1] - 2023-03-08
### Changed
- Updated package dependencies. [#29216]

## [0.9.0] - 2023-02-20
### Added
- Add a new section to describe including assets from backend [#29016]

## [0.8.4] - 2023-02-15
### Changed
- Update to React 18. [#28710]

## [0.8.3] - 2023-02-08
### Changed
- Updated package dependencies. [#28682]

## [0.8.2] - 2023-01-25
### Changed
- Minor internal updates.

## [0.8.1] - 2023-01-11
### Changed
- Updated package dependencies. [#28127]

## [0.8.0] - 2023-01-02
### Added
- Add additional methods to useAnalytics hook, allow for view event by passing initial props [#28072]

## [0.7.0] - 2022-12-19
### Added
- Add new Analytics wrapper hook. [#27937]
- Add new isCurrentUserConnected utility. [#27923]

## [0.6.10] - 2022-12-06
### Changed
- Updated package dependencies. [#27688, #27696, #27697]]

## [0.6.9] - 2022-11-28
### Changed
- Updated package dependencies. [#27043]

## [0.6.8] - 2022-11-14
### Changed
- Updated package dependencies. [#27319]

## [0.6.7] - 2022-11-08
### Changed
- Updated package dependencies. [#27289]

## [0.6.6] - 2022-11-01
### Changed
- Updated package dependencies. [#27196]

## [0.6.5] - 2022-10-13
### Changed
- Updated package dependencies. [#26791]

## [0.6.4] - 2022-10-05
### Changed
- Updated package dependencies. [#26568]

## [0.6.3] - 2022-09-13
### Changed
- Updated package dependencies. [#26072]

## [0.6.2] - 2022-08-30
### Changed
- Updated package dependencies. [#25814]

## [0.6.1] - 2022-08-23
### Changed
- Updated package dependencies. [#25338, #25339, #25762]

## [0.6.0] - 2022-08-03
### Fixed
- Change Site Editor route to `site-editor.php` [#25281]

## [0.5.0] - 2022-07-26
### Added
- Add a new utility function for native use. The function returns the namespace of the host app e.g. Jetpack or WordPress. [#25155]

### Changed
- Updated package dependencies. [#25158]

## [0.4.13] - 2022-07-12
### Changed
- Updated package dependencies.

## [0.4.12] - 2022-07-06
### Changed
- Updated package dependencies. [#24923]

## [0.4.11] - 2022-06-28
### Removed
- Remove unused testing infrastructure.

## [0.4.10] - 2022-06-21
### Changed
- Renaming `master` references to `trunk` [#24712]

## [0.4.9] - 2022-06-14
### Changed
- Updated package dependencies. [#24722]

## [0.4.8] - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]

## [0.4.7] - 2022-05-31
### Changed
- Updated package dependencies. [#24573]

## [0.4.6] - 2022-05-18
### Changed
- Updated package dependencies [#24296]

## [0.4.5] - 2022-05-10
### Changed
- Updated package dependencies [#24296]

## [0.4.4] - 2022-05-04
### Changed
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Updated package dependencies [#24198]

## [0.4.3] - 2022-04-26
### Changed
- Update package.json metadata.

## [0.4.2] - 2022-04-12
### Changed
- Updated package dependencies.

## [0.4.1] - 2022-04-06
### Changed
- Updated package dependencies

## [0.4.0] - 2022-03-31
### Added
- Add a new utility function to determine whether a site has been launched.

## [0.3.1] - 2022-03-29
### Added
- Add missing JS peer dependency.

## [0.3.0] - 2022-03-23
### Added
- Moved plan-utils.js file from plugin/jetpack to shared-extension-utils. Updated import references for the same

### Changed
- Updated package dependencies

## [0.2.0] - 2022-03-15
### Added
- Moved with-has-warning-is-interactive-class-names folder from jetpack plugin shared extensions

## [0.1.1] - 2022-03-02
### Changed
- Updated package dependencies

## 0.1.0 - 2022-02-09
### Added
- Core: add utility to register a Jetpack plugin.
- Created the shared-extension-utils library
- Moved get-jetpack-data file from jetpack plugin shared extensions
- Moved get-jetpack-extension-availability file from jetpack plugin shared extensions
- Moved get-site-fragment file from jetpack plugin shared extensions
- Moved site-type-utils file from jetpack plugin shared extensions

### Changed
- Core: prepare utility for release

[0.11.2]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.11.1...0.11.2
[0.11.1]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.11.0...0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.9...0.11.0
[0.10.9]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.8...0.10.9
[0.10.8]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.7...0.10.8
[0.10.7]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.6...0.10.7
[0.10.6]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.5...0.10.6
[0.10.5]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.4...0.10.5
[0.10.4]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.3...0.10.4
[0.10.3]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.2...0.10.3
[0.10.2]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.1...0.10.2
[0.10.1]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.10.0...0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.9.2...0.10.0
[0.9.2]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.9.1...0.9.2
[0.9.1]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.9.0...0.9.1
[0.9.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.8.4...0.9.0
[0.8.4]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.8.3...0.8.4
[0.8.3]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.8.2...0.8.3
[0.8.2]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.8.1...0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.8.0...0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.7.0...0.8.0
[0.7.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.10...0.7.0
[0.6.10]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.9...0.6.10
[0.6.9]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.8...0.6.9
[0.6.8]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.7...0.6.8
[0.6.7]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.6...0.6.7
[0.6.6]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.5...0.6.6
[0.6.5]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.4...0.6.5
[0.6.4]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.3...0.6.4
[0.6.3]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.2...0.6.3
[0.6.2]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.1...0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.6.0...0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.5.0...0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.13...0.5.0
[0.4.13]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.12...0.4.13
[0.4.12]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.11...0.4.12
[0.4.11]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.10...0.4.11
[0.4.10]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.9...0.4.10
[0.4.9]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.8...0.4.9
[0.4.8]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.7...0.4.8
[0.4.7]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.6...0.4.7
[0.4.6]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.5...0.4.6
[0.4.5]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.4...0.4.5
[0.4.4]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.3...0.4.4
[0.4.3]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.2...0.4.3
[0.4.2]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.1...0.4.2
[0.4.1]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.3.1...0.4.0
[0.3.1]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-shared-extension-utils/compare/0.1.0...0.1.1
