# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.4] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies

### Changed
- Update package dependencies.

## [1.4.3] - 2021-01-19

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.4.2] - 2020-10-28

- Updated PHPCS: Packages and Debugger
- Config: remove tos and tracking features
- Config: add info about the package dependencies to the package docs

## [1.4.1] - 2020-09-15

- Config: remove tos and tracking features

## [1.4.0] - 2020-08-26

- Config: Remove composer dependencies
- Config: Add connection status check

## [1.3.0] - 2020-06-26

- Config: check for both JITM namespaces

## [1.2.0] - 2020-05-20

- Store the list of active plugins that uses connection in an option
- Implement pre-connection JITMs
- Connection Package: Handle disconnections gracefully

## [1.1.0] - 2020-01-23

- Moved JITM initialization to plugins_loaded.

## [1.0.1] - 2020-01-20

- Move connection manager related logic to after plugins_loaded.

## 1.0.0 - 2020-01-14

- Trying to add deterministic initialization.

[1.4.4]: https://github.com/Automattic/jetpack-config/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/Automattic/jetpack-config/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/Automattic/jetpack-config/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/Automattic/jetpack-config/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-config/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-config/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-config/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-config/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/Automattic/jetpack-config/compare/v1.0.0...v1.0.1
