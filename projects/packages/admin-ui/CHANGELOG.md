# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.9] - 2025-05-05
### Fixed
- Remove the Jetpack submenu only if My-Jetpack is present. [#43282]

## [0.5.8] - 2025-04-28
### Changed
- Internal updates.

## [0.5.7] - 2025-03-21
### Changed
- Internal updates.

## [0.5.6] - 2025-03-17
### Changed
- Internal updates.

## [0.5.5] - 2025-03-12
### Changed
- Internal updates.

## [0.5.4] - 2025-03-05
### Changed
- Internal updates.

## [0.5.3] - 2025-02-24
### Changed
- Update dependencies.

## [0.5.2] - 2025-02-03
### Added
- Add `remove_menu` method to `Admin_Menu` class. [#41422]

## [0.5.1] - 2024-11-25
### Changed
- Update dependencies. [#40286]

## [0.5.0] - 2024-11-14
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.4.6] - 2024-11-04
### Added
- Enable test coverage. [#39961]

## [0.4.5] - 2024-09-05
### Changed
- Jetpack menu: only register Jetpack admin page for contributor roles and above. [#39081]

## [0.4.4] - 2024-08-29
### Changed
- Admin menu: change order of Jetpack sub-menu items [#39095]

## [0.4.3] - 2024-08-23
### Changed
- Updated package dependencies. [#39004]

## [0.4.2] - 2024-04-22
### Changed
- Internal updates.

## [0.4.1] - 2024-03-12
### Changed
- Internal updates.

## [0.4.0] - 2024-03-01
### Added
- Register menus in network admin as well as regular admin. [#36058]

## [0.3.2] - 2024-01-29
### Fixed
- Wait until 'admin_menu' action to call `add_menu()`, to avoid triggering the l10n load too early. [#35279]

## [0.3.1] - 2023-11-24

## [0.3.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [0.2.25] - 2023-11-14

## [0.2.24] - 2023-10-30
### Fixed
- Handle Akismet submenu even if Jetpack is present, as Jetpack now relies on this package to do so. [#33559]

## [0.2.23] - 2023-09-19
### Changed
- Updated Jetpack submenu sort order so individual features are alpha-sorted. [#32958]

## [0.2.22] - 2023-09-11
### Fixed
- Akismet: update naming to common form [#32908]

## [0.2.21] - 2023-08-23
### Changed
- Updated package dependencies. [#32605]

## [0.2.20] - 2023-04-25
### Fixed
- Avoid errors when used in combination with an older version of the Logo package. [#30136]

## [0.2.19] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [0.2.18] - 2023-04-04
### Changed
- Menu icon: update to latest version of the Jetpack logo [#29418]

## [0.2.17] - 2023-02-20
### Changed
- Minor internal updates.

## [0.2.16] - 2023-01-25
### Changed
- Minor internal updates.

## [0.2.15] - 2023-01-11
### Changed
- Updated package dependencies.

## [0.2.14] - 2022-12-02
### Changed
- Updated package dependencies. [#27688]

## [0.2.13] - 2022-11-22
### Changed
- Updated package dependencies. [#27043]

## [0.2.12] - 2022-09-20
### Changed
- Updated package dependencies.

## [0.2.11] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [0.2.10] - 2022-07-12
### Changed
- Updated package dependencies.

## [0.2.9] - 2022-06-21
### Changed
- Renaming master to trunk.

## [0.2.8] - 2022-06-14
### Changed
- Updated package dependencies.

## [0.2.7] - 2022-04-26
### Changed
- Update package.json metadata.

## [0.2.6] - 2022-04-05
### Changed
- Updated package dependencies.

## [0.2.5] - 2022-03-08
### Fixed
- Do not handle Akismet submenu if Jetpack plugin is present

## [0.2.4] - 2022-02-09
### Added
- Support for akismet menu with stand-alone plugins

### Fixed
- Fixes menu order working around a bug in add_submenu_page

## [0.2.3] - 2022-01-25
### Changed
- Updated package dependencies.

## [0.2.2] - 2022-01-18
### Changed
- General: update required node version to v16.13.2

## [0.2.1] - 2022-01-04
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## [0.2.0] - 2021-12-14
### Added
- New method to get the top level menu item

## [0.1.1] - 2021-11-17
### Changed
- Set `convertDeprecationsToExceptions` true in PHPUnit config.
- Update PHPUnit configs to include just what needs coverage rather than include everything then try to exclude stuff that doesn't.

## 0.1.0 - 2021-10-13
### Added
- Created the package.

### Changed
- Updated package dependencies.

### Fixed
- Fixing menu visibility issues.

[0.5.9]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.8...0.5.9
[0.5.8]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.7...0.5.8
[0.5.7]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.6...0.5.7
[0.5.6]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.5...0.5.6
[0.5.5]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.4...0.5.5
[0.5.4]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.3...0.5.4
[0.5.3]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.2...0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.1...0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-admin-ui/compare/0.5.0...0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-admin-ui/compare/0.4.6...0.5.0
[0.4.6]: https://github.com/Automattic/jetpack-admin-ui/compare/0.4.5...0.4.6
[0.4.5]: https://github.com/Automattic/jetpack-admin-ui/compare/0.4.4...0.4.5
[0.4.4]: https://github.com/Automattic/jetpack-admin-ui/compare/0.4.3...0.4.4
[0.4.3]: https://github.com/Automattic/jetpack-admin-ui/compare/0.4.2...0.4.3
[0.4.2]: https://github.com/Automattic/jetpack-admin-ui/compare/0.4.1...0.4.2
[0.4.1]: https://github.com/Automattic/jetpack-admin-ui/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-admin-ui/compare/0.3.2...0.4.0
[0.3.2]: https://github.com/Automattic/jetpack-admin-ui/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-admin-ui/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.25...0.3.0
[0.2.25]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.24...0.2.25
[0.2.24]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.23...0.2.24
[0.2.23]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.22...0.2.23
[0.2.22]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.21...0.2.22
[0.2.21]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.20...0.2.21
[0.2.20]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.19...0.2.20
[0.2.19]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.18...0.2.19
[0.2.18]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.17...0.2.18
[0.2.17]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.16...0.2.17
[0.2.16]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.15...0.2.16
[0.2.15]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.14...0.2.15
[0.2.14]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.13...0.2.14
[0.2.13]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.12...0.2.13
[0.2.12]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.11...0.2.12
[0.2.11]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.10...0.2.11
[0.2.10]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.9...0.2.10
[0.2.9]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.8...0.2.9
[0.2.8]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.7...0.2.8
[0.2.7]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.6...0.2.7
[0.2.6]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.5...0.2.6
[0.2.5]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.4...0.2.5
[0.2.4]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.3...0.2.4
[0.2.3]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-admin-ui/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-admin-ui/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-admin-ui/compare/0.1.0...0.1.1
