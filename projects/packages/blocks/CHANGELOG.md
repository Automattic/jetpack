# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2021-06-29
### Changed
- Update docs to replace yarn with pnpm.

## [1.4.0] - 2021-05-12
### Added
- Add helper method to determine if the current theme is an FSE/Site editor theme.
- Adds an attribute to paid blocks to support hiding nested upgrade nudges on the frontend.

### Changed
- Updated package dependencies.

## [1.3.0] - 2021-03-22
### Added
- Composer alias for dev-master, to improve dependencies
- Enable GitHub action for auto-tagging releases from monorepo pushes.

### Changed
- Update package dependencies.

### Fixed
- Add editor style dependency when registering Jetpack blocks to ensure support for the new site editor.
- Use `composer update` rather than `install` in scripts, as composer.lock isn't checked in.

## [1.2.2] - 2021-02-05

- CI: Make tests more generic

## [1.2.1] - 2021-01-20

- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.2.0] - 2020-12-07

- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.1.1] - 2020-11-13

- Codecoverage: fix reports
- Updated PHPCS: Packages and Debugger

## [1.1.0] - 2020-09-25

- Blocks: add block registration to package

## 1.0.0 - 2020-09-17

- Blocks: introduce new package for block management

[1.4.1]: https://github.com/Automattic/jetpack-blocks/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/Automattic/jetpack-blocks/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Automattic/jetpack-blocks/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-blocks/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-blocks/compare/v1.0.0...v1.1.0
