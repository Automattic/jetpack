# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.1] - 2022-07-06
### Changed
- Renaming `master` references to `trunk`. [#24712]
- Updated package dependencies. [#24045]

## [1.7.0] - 2022-02-23
### Added
- API for anayzer service
- Slurper Script now uses a shebang to preset a 2 GB memory limit

### Changed
- Analyzer: Change minimum PHP version to 7.4.
- Updated package dependencies
- Updated to Slurper example script to use new Docker location and not exclude vendor dir.

### Fixed
- Fix jetpack-svn.php script getting latest stable Jetpack version by default

## [1.6.2] - 2021-12-07
### Added
- Handle more code tokens

### Changed
- Changes to Analyzer serialization
- Updated package dependencies.

## [1.6.1] - 2021-08-26
### Added
- Composer alias for dev-master, to improve dependencies.
- Created a changelog from the git history with help from [auto-changelog](https://www.npmjs.com/package/auto-changelog). It could probably use cleanup!

### Changed
- Update package dependencies.

## [1.6.0] - 2021-02-05

- CI: Make tests more generic
- Analyzer: Some PHPCS improvements
- codesniffer: Hack around mediawiki-codesniffer bug

## [1.5.0] - 2021-01-25

- Adds a script to scan a repository for Core function calls.
- Add mirror-repo information to all current composer packages
- Monorepo: Reorganize all projects

## [1.4.0] - 2020-12-09

- Codesniffer: Update mediawiki/mediawiki-codesniffer dependency
- Pin dependencies
- Packages: Update for PHP 8 testing

## [1.3.0] - 2020-06-22

- PHPCS: Clean up the packages
- PHPCS Updates after WPCS 2.3

## [1.2.0] - 2020-05-05

- Add support for detecting deprecated functions in the Analyzer

## [1.1.0] - 2020-03-11

- Added a Slurper example to the analyzer package.

## [1.0.3] - 2019-11-08

- Packages: Use classmap instead of PSR-4

## [1.0.2] - 2019-10-29

- PHPCS: Rest of the packages

## [1.0.1] - 2019-10-07

- Update dependency phpcompatibility/phpcompatibility-wp to v2.1.0

## 1.0.0 - 2019-09-14

- Jetpack code analyzer

[1.7.1]: https://github.com/Automattic/jetpack-analyzer/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/Automattic/jetpack-analyzer/compare/v1.6.2...v1.7.0
[1.6.2]: https://github.com/Automattic/jetpack-analyzer/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/Automattic/jetpack-analyzer/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/Automattic/jetpack-analyzer/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Automattic/jetpack-analyzer/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-analyzer/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/jetpack-analyzer/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Automattic/jetpack-analyzer/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/jetpack-analyzer/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/Automattic/jetpack-analyzer/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Automattic/jetpack-analyzer/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-analyzer/compare/v1.0.0...v1.0.1
