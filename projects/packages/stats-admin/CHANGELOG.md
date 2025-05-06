# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.26.1 - 2025-05-05
### Changed
- Update dependencies. [#39303]

## 0.26.0 - 2025-04-28
### Removed
- SAL_Site: Remove unused `view_hosting` field. [#43237]

### Fixed
- Stats: Avoid PHP warning when we have no views data about a specific post. [#43146]

## 0.25.2 - 2025-04-21
### Changed
- Internal updates.

## 0.25.1 - 2025-04-14
### Changed
- Internal updates.

## 0.25.0 - 2025-03-31
### Added
- Add page view count in the post and page list. [#42218]
- Update icon in stats column. [#42218]

## 0.24.6 - 2025-03-24
### Changed
- Internal updates.

## 0.24.5 - 2025-03-18
### Changed
- Update dependencies. [#39303]

## 0.24.4 - 2025-03-12
### Changed
- Internal updates.

## 0.24.3 - 2025-03-10
### Changed
- Internal updates.

## 0.24.2 - 2025-02-24
### Changed
- Internal updates.

## 0.24.1 - 2025-02-03
### Changed
- Phan: Update baselines. [#41263]

## 0.24.0 - 2025-01-06
### Added
- Stats: Add API support for location stats. [#40852]

## 0.23.1 - 2024-11-25
### Changed
- Updated dependencies. [#40286]

### Fixed
- Catch an issue when custom code removes `ver` param. [#40322]
- Stats: Remove cache for purchases and usage endpoints. [#40266]

## 0.23.0 - 2024-11-18
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## 0.22.6 - 2024-11-11
### Fixed
- Fixed flaky tests [#40062]

## 0.22.5 - 2024-11-04
### Added
- Enable test coverage. [#39961]

### Fixed
- API cache not refreshing when cache is bypassed. [#39955]

## 0.22.4 - 2024-10-28
### Changed
- Odyssey Stats cache busting: Use option instead of transient. [#39887]

## 0.22.3 - 2024-10-21
### Changed
- JITM: Expose function to render message. [#39714]

## 0.22.2 - 2024-10-14
### Fixed
- Added missing fields for stats single post endpoint. [#39691]

## 0.22.1 - 2024-09-23
### Changed
- Update dependencies. [#39303]

## 0.22.0 - 2024-09-16
### Added
- Create the user feedback endpoint proxy with a user login status check. [#39287]

## 0.21.2 - 2024-09-09
### Changed
- Update dependencies. [#39253]

## 0.21.1 - 2024-08-23
### Changed
- Updated package dependencies. [#39004]

## 0.21.0 - 2024-07-08
### Added
- Stats: Add purchases endpoint [#38150]

## 0.20.0 - 2024-06-18
### Added
- Check if Jetpack is integrated with the Complianz plugin to show the notice from blocking Stats. [#37870]

## 0.19.3 - 2024-06-10
### Changed
- Update dependencies.

## 0.19.2 - 2024-05-20
### Fixed
- Stats: Use user language instead of site language for translations. [#37423]

## 0.19.1 - 2024-05-06
### Changed
- Internal updates.

## 0.19.0 - 2024-04-29
### Added
- Proxy Devices Stats API endpoint. [#37098]

## 0.18.3 - 2024-04-25
### Changed
- Update dependencies.

## 0.18.2 - 2024-04-22
### Changed
- Internal updates.

## 0.18.1 - 2024-04-08
### Fixed
- Change Odyssey Stats default admin menu name and slug for Simple Classic. [#36689]

## 0.18.0 - 2024-04-01
### Added
- Change Phan baselines. [#36627]
- Stats: Add commercial classification endpoint [#36597]

### Changed
- Add config fields for odyssey stats to be loaded in Simple Site Classic. [#36633]

## 0.17.1 - 2024-03-25
### Changed
- Internal updates.

## 0.17.0 - 2024-03-18
### Added
- Stats: Add UTM stats endpoint [#36402]

## 0.16.2 - 2024-03-04
### Fixed
- Stats: fix posts endpoint for Atomic sites [#36039]

## 0.16.1 - 2024-02-26
### Changed
- Update dependencies.

## 0.16.0 - 2024-02-19
### Added
- Stats: added support for Email stats [#35703]

## 0.15.3 - 2024-02-14
### Fixed
- Stats: clear usage, modules, module-settings cache after purchase [#35590]

## 0.15.2 - 2024-02-05
### Changed
- Update dependencies.

## 0.15.1 - 2023-12-25
### Changed
- Update dependencies.

## 0.15.0 - 2023-12-11
### Added
- Introduced the plan usage API route porting to wpcom. [#34516]

## 0.14.0 - 2023-11-24
### Added
- Added support to load scripts conditionally for the Stats widget. [#34284]

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
