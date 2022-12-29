# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.1 - 2022-12-27
### Changed
- Stats: added more dependencies to be loaded for stats bundle [#28065]

## 0.2.0 - 2022-12-19
### Added
- Stats: added list posts endpoint. [#27875]

### Changed
- Stats: changed loading assets from odyssey-stats folder and some names. [#27971]
- Stats Admin: changed the time to refresh cache buster to 15 min. [#27969]

### Removed
- Stats: removed style overriding for Odyssey stats. [#27896]

### Fixed
- Stats: added `hostname` and `admin_url` to config. [#27922]
- Stats Admin: fixed phpunit CI tests. [#27948]

## 0.1.1 - 2022-12-06
### Changed
- Stats: explicitly allow only certain API access with blog token to wpcom [#27604]
- Updated package dependencies. [#27688]

## 0.1.0 - 2022-11-28
### Added
- Stats: add stats-admin package [#27247]
- Stats: add stats option `enable_calypso_stats` to allow users to enable the new Calypso Stats experience [#27431]

### Changed
- Updated package dependencies. [#27043]
