# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.13.0 - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## 0.12.2 - 2023-09-19
### Changed
- Updated Jetpack submenu sort order so individual features are alpha-sorted. [#32958]

## 0.12.1 - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## 0.12.0 - 2023-07-05
### Added
- Stats Admin: add plan and product for site [#31663]

## 0.11.0 - 2023-06-26
### Added
- Stats Admin: add subscribers endpoints. [#31394]

### Removed
- Stats: removed notices from initial state for better performance. [#31475]

### Fixed
- Stats Admin: fix user capabilities data especially for view_stats. [#31448]

## 0.10.0 - 2023-06-19
### Added
- Add new dependency: Jetpack Plans package. [#31213]

### Changed
- Switch to relying on the Plans package instead of a class available in the Jetpack plugin only. [#31213]

## 0.9.0 - 2023-06-12
### Added
- Stats Admin: added modules toggling API support [#31230]
- Stats Admin: Add module settings API [#31231]

### Changed
- Stats Admin: use WPCOM notices API [#31261]

### Fixed
- Replace dependency on deprecated `automattic/jetpack-options` package. [#31280]

## 0.8.0 - 2023-05-15
### Added
- Stats Admin: adds rest api for marking and unmarking referrers as spam [#30625]
- Stats Admin: adds versions and platform info to Odyssey config data [#30573]

### Fixed
- Stats Admin: align is_automated_transfer with other places [#30622]

## 0.7.3 - 2023-05-01
### Fixed
- Stats Admin: Cache bust the cache buster [#30374]

## 0.7.2 - 2023-04-25
### Changed
- Stats Admin: add minify=false to avoid JS minified by WP.com [#30174]
- Stats Admin: changed to use custom config data variable name to avoid conflicts with `configData` [#30147]

## 0.7.1 - 2023-04-17
### Changed
- Stats Admin: change site locale format from only language code to real locale e.g. `en-us` [#29958]

## 0.7.0 - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]
- Stats Admin: Adds ability to render Odyssey Widget [#29929]

## 0.6.4 - 2023-04-04
### Changed
- Stats Admin: moved Odyssey assets loading to separate class [#29893]
- Stats Admin: refactoring config data code to Odyssey_Config_Data [#29863]

## 0.6.3 - 2023-03-20
### Added
- Add momentjs dependency for Odyssey Stats [#29329]

## 0.6.2 - 2023-02-28
### Changed
- Stats: moved New Stats toggling logic to stats-admin [#29064]

### Fixed
- Stats Admin: Opt-in notice should be shown a month after the customer has opted out of Odyssey Stats. [#29065]

## 0.6.1 - 2023-02-20
### Fixed
- Fixed unit tests without internet [#28985]
- Stats: fix broken request_as_blog_cached [#28992]

## 0.6.0 - 2023-02-15
### Added
- Stats: Adds support for Notice control [#28857]

### Changed
- Rename stats option enable_calypso_stats to enable_odyssey_stats [#28794]

### Fixed
- Stats: remove unnecessary params that breaks wpcom API [#28935]

## 0.5.0 - 2023-02-08
### Added
- Stats: adds new Stats opt out notice [#28733]

### Changed
- Stats: Remove feature lock for Ads page [#28657]

## 0.4.1 - 2023-01-26
### Fixed
- Stats: fixed missing params to WPCOM API. [#28544]

## 0.4.0 - 2023-01-23
### Added
- Stats: enable Ads page [#27791]

## 0.3.1 - 2023-01-16
### Fixed
- Fix Odyssey Stats footer position [#28308]

## 0.3.0 - 2023-01-11
### Added
- Stats: add loading spinner for Stats Dashboard [#28219]

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
