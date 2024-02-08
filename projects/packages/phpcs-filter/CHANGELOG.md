# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.0.0 - 2024-02-07
### Added
- Support the old PHPCS 2.x "phpcs_input_file:path" method for specifying the stdin filename. [#33545]

### Changed
- The package now requires PHP >= 7.0. [#34192]
- Updated package dependencies. [#32605]

### Fixed
- Ignore `--basepath` command line option. It doesn't mean what we thought it means. [#33508]

## 1.0.5 - 2023-06-06
### Added
- Set keywords to have `composer require` prompt for `--dev` on installation.

## 1.0.4 - 2023-02-07
### Changed
- Minor internal updates.

## 1.0.3 - 2022-11-01
### Changed
- Updated package dependencies.

## 1.0.2 - 2022-07-06
### Changed
- Renaming master to trunk. [#24661]
- Updated package dependencies. [#24045]

## 1.0.1 - 2022-03-01
### Changed
- Switch to pcov for code coverage.
- Updated package dependencies

## 1.0.0 - 2021-12-22
### Added
- Initial release.
