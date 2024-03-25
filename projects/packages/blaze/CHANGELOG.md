# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.19.3] - 2024-03-25
### Changed
- Internal updates.

## [0.19.2] - 2024-03-18
### Changed
- Internal updates.

## [0.19.1] - 2024-03-12
### Changed
- Updated package dependencies. [#36325]

### Fixed
- Fixes the response body for the errors returned by the Blaze controller [#36134]

## [0.19.0] - 2024-03-04
### Added
- Add support for running DSP Campaign Creation API endpoint v1.1 from DSP widget [#36120]

### Changed
- Updated package dependencies.

## [0.18.1] - 2024-02-27
### Changed
- Update dependencies. [#35170]

## [0.18.0] - 2024-02-26
### Changed
- Blaze: Enable the Dashboard behind the feature flag [#35724]

### Fixed
- added a "use WC_Product" to include this in the post fetching endpoint for blaze [#35870]
- Changes to use the user's locale to render the dashboard [#35832]

## [0.17.0] - 2024-02-19
### Added
- Added price in blaze/posts endpoint [#35066]

### Changed
- Changes the Blaze Dashboard entry points to be compatible with Woo Blaze [#34964]
- Post Links: allow third-parties to toggle them depending on post type. [#35730]

## [0.16.0] - 2024-02-13
### Added
- Blaze: Whiteliste /media/new WPCOM REST API call for image uploading [#34790]
- Quick Action Links: introduce new filter allowing to disable quick links in the Posts screen. [#35586]

### Changed
- Updated package dependencies. [#35608]

## [0.15.3] - 2024-02-05
### Changed
- Updated package dependencies. [#35384]

## [0.15.2] - 2024-01-29
### Changed
- Update dependencies. [#35170]

## [0.15.1] - 2024-01-22
### Changed
- Update dependencies. [#35117]

## [0.15.0] - 2024-01-15
### Changed
- Changes the Blaze Dashboard paths to use the new format [#34896]

## [0.14.3] - 2024-01-04
### Changed
- Updated package dependencies. [#34815]

## [0.14.2] - 2023-12-11
### Changed
- Updated package dependencies. [#34416]

## [0.14.1] - 2023-12-03
### Changed
- Updated package dependencies. [#34411]

## [0.14.0] - 2023-11-24
### Added
- Added whitelisting for the payments endpoint. [#34227]

## [0.13.0] - 2023-11-20
### Changed
- Updated required PHP version to >= 7.0. [#34192]

## [0.12.3] - 2023-11-14
### Changed
- Updated package dependencies. [#34093]

## [0.12.2] - 2023-11-13
### Changed
- Updated dependencies. [#33960]

## [0.12.1] - 2023-11-03
### Changed
- Updated dependencies. [#33946]

## [0.12.0] - 2023-10-31
### Added
- Add sending Jetpack version to BlazePress Calypso App. [#33823]

## [0.11.0] - 2023-10-23
### Added
- DSP media endpoints allowlisting. [#33598]

### Changed
- Updated package dependencies. [#33646] [#33687]

### Fixed
- Fix unsetting `sub_path` in `Dashboard_REST_Controller`. [#33668]

## [0.10.4] - 2023-10-16
### Changed
- Updated package dependencies. [#33429]

## [0.10.3] - 2023-10-10
### Changed
- Updated package dependencies. [#33428]

## [0.10.2] - 2023-09-19
### Changed
- Updated package dependencies. [#33001]

## [0.10.1] - 2023-09-04
### Changed
- Updated package dependencies. [#32803]
- Updated package dependencies. [#32804]

### Fixed
- Fixes missing controller for DSP /subscriptions POST endpoint [#32752]

## [0.10.0] - 2023-08-28
### Added
- Added a rest route for the DSP experiments api endpoint [#32550]

### Changed
- Updated package dependencies. [#32605]

## [0.9.3] - 2023-08-21
### Changed
- Use the new method to render Connection initial state. [#32499]

## [0.9.2] - 2023-08-09
### Changed
- Updated package dependencies. [#32166]
- Update wording in the Blaze CTA link appearing in the post list. [#32339]

## [0.9.1] - 2023-08-07
### Fixed
- Fixes missing controller for DSP /woo/wpcom-payment-methods request [#32267]

## [0.9.0] - 2023-07-25
### Changed
- Enable the new Blaze Dashboard page by default. [#31750]
- Updated package dependencies. [#32040]

## [0.8.1] - 2023-07-17
### Changed
- Updated package dependencies. [#31785]

### Fixed
- Dashboard: Fixed compatibility with the checkout endpoint [#31756]

## [0.8.0] - 2023-07-10
### Added
- Added compatibility to new logs endpoint in DSP [#31694]

## [0.7.2] - 2023-07-05
### Changed
- Change Dashboard: Change to return connected user information to use for analytics [#31654]
- Dashboard Menu: change priority. [#31617]
- Updated package dependencies. [#31659]

### Fixed
- Fixes missing controller for DSP blaze/posts request [#31641]

## [0.7.1] - 2023-06-27
### Fixed
- Avoid errors when the post type label is not defined. [#31595]

## [0.7.0] - 2023-06-26
### Added
- Add new Blaze Dashboard menu item. [#30103]
- Add new endpoints to access general Blaze site information via the API. [#31485]

### Changed
- Blaze can now be loaded as a module, instead of relying on the Config package. [#31479]
- Updated package dependencies. [#31468]

### Fixed
- Ensure we use the translated post type name in Post-publish prompt. [#31399]

## [0.6.0] - 2023-06-19
### Fixed
- Removed the extra margin in the Blaze panel [#31411]

## [0.5.14] - 2023-06-06
### Changed
- Updated package dependencies. [#31129]

## [0.5.13] - 2023-05-22
### Changed
- Internal updates.

## [0.5.12] - 2023-05-02
### Changed
- Updated package dependencies.

## [0.5.11] - 2023-05-01
### Changed
- Internal updates.

## [0.5.10] - 2023-04-17
### Changed
- Updated package dependencies. [#30019]

## [0.5.9] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [0.5.8] - 2023-04-04
### Changed
- Updated package dependencies. [#29854]

## [0.5.7] - 2023-04-03
### Changed
- Internal updates.

## [0.5.6] - 2023-03-20
### Changed
- Updated package dependencies. [#29471]

## [0.5.5] - 2023-03-08
### Changed
- Updated package dependencies. [#29216]

## [0.5.4] - 2023-02-20
### Changed
- Minor internal updates.

## [0.5.3] - 2023-02-15
### Changed
- Update to React 18. [#28710]

### Fixed
- Blaze: prevent fatals on frontend-loaded Gutenberg + bail early if Jetpack is not connected [#28955]
- Do not load the Blaze script in the classic editor. [#28900]

## [0.5.2] - 2023-02-08
### Changed
- Only display the Blaze UI to admins on a site. [#28748]
- Updated package dependencies. [#28682]

### Fixed
- Do not display "Blaze" links in the post list for password-protected posts. [#28747]

## [0.5.1] - 2023-02-02
### Added
- Display "Blaze" links in page list too. [#28715]

### Changed
- Do not require Jetpack's JSON API module to use feature. [#28672]

### Fixed
- Do not display Blaze links in non-supported CPT pages. [#28671]

## [0.5.0] - 2023-01-26
### Changed
- Move away from Singleton pattern to improve performance [#28587]

### Fixed
- Avoid unnecessary requests for eligibility [#28568]

## [0.4.0] - 2023-01-23
### Added
- Add new method to request eligibility to Blaze from WordPress.com. [#28353]
- Add tracking when the post-publish panel is displayed. [#28392]

### Changed
- Start using utilities from Status package to detect whether a site is private or "coming-soon" (unlaunched). [#28328]

### Fixed
- Always enqueue Jetpack Connnection info when enqueuing Blaze script [#28457]

## [0.3.4] - 2023-01-16
### Added
- Do not display the Blaze UI on private or unlaunched sites. [#28315]

### Changed
- Do not load the Blaze UI if the JSON API module is inactive. [#28267]
- Only display the Blaze UI if the connected user's language is English. [#28266]

## [0.3.3] - 2023-01-11
### Changed
- Updated package dependencies. [#28127]

### Fixed
- Do not load the Blaze panel in the site editor or the widget editor. [#28187]

## [0.3.2] - 2023-01-04
### Changed
- Editor panel: update Blaze icon and wording. [#28155]
- Post List link: only display UI on WordPress.com Simple and WoA sites for now. [#28155]
- Update wording in Post List link. [#28155]

## [0.3.1] - 2023-01-03
### Fixed
- Blaze: Only show post row action to promote if the post is published. [#28139]

## [0.3.0] - 2023-01-02
### Added
- Blaze package: Add config initialization, initialization checks for loading. [#28077]

## [0.2.0] - 2022-12-27
### Added
- Add new Post-publish panel in the block editor [#28073]

## 0.1.0 - 2022-12-19
### Changed
- Updated package dependencies. [#27906]

[0.19.3]: https://github.com/automattic/jetpack-blaze/compare/v0.19.2...v0.19.3
[0.19.2]: https://github.com/automattic/jetpack-blaze/compare/v0.19.1...v0.19.2
[0.19.1]: https://github.com/automattic/jetpack-blaze/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/automattic/jetpack-blaze/compare/v0.18.1...v0.19.0
[0.18.1]: https://github.com/automattic/jetpack-blaze/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/automattic/jetpack-blaze/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/automattic/jetpack-blaze/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/automattic/jetpack-blaze/compare/v0.15.3...v0.16.0
[0.15.3]: https://github.com/automattic/jetpack-blaze/compare/v0.15.2...v0.15.3
[0.15.2]: https://github.com/automattic/jetpack-blaze/compare/v0.15.1...v0.15.2
[0.15.1]: https://github.com/automattic/jetpack-blaze/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/automattic/jetpack-blaze/compare/v0.14.3...v0.15.0
[0.14.3]: https://github.com/automattic/jetpack-blaze/compare/v0.14.2...v0.14.3
[0.14.2]: https://github.com/automattic/jetpack-blaze/compare/v0.14.1...v0.14.2
[0.14.1]: https://github.com/automattic/jetpack-blaze/compare/v0.14.0...v0.14.1
[0.14.0]: https://github.com/automattic/jetpack-blaze/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/automattic/jetpack-blaze/compare/v0.12.3...v0.13.0
[0.12.3]: https://github.com/automattic/jetpack-blaze/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/automattic/jetpack-blaze/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/automattic/jetpack-blaze/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/automattic/jetpack-blaze/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/automattic/jetpack-blaze/compare/v0.10.4...v0.11.0
[0.10.4]: https://github.com/automattic/jetpack-blaze/compare/v0.10.3...v0.10.4
[0.10.3]: https://github.com/automattic/jetpack-blaze/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/automattic/jetpack-blaze/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/automattic/jetpack-blaze/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/automattic/jetpack-blaze/compare/v0.9.3...v0.10.0
[0.9.3]: https://github.com/automattic/jetpack-blaze/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/automattic/jetpack-blaze/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/automattic/jetpack-blaze/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/automattic/jetpack-blaze/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/automattic/jetpack-blaze/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/automattic/jetpack-blaze/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/automattic/jetpack-blaze/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/automattic/jetpack-blaze/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/automattic/jetpack-blaze/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/automattic/jetpack-blaze/compare/v0.5.14...v0.6.0
[0.5.14]: https://github.com/automattic/jetpack-blaze/compare/v0.5.13...v0.5.14
[0.5.13]: https://github.com/automattic/jetpack-blaze/compare/v0.5.12...v0.5.13
[0.5.12]: https://github.com/automattic/jetpack-blaze/compare/v0.5.11...v0.5.12
[0.5.11]: https://github.com/automattic/jetpack-blaze/compare/v0.5.10...v0.5.11
[0.5.10]: https://github.com/automattic/jetpack-blaze/compare/v0.5.9...v0.5.10
[0.5.9]: https://github.com/automattic/jetpack-blaze/compare/v0.5.8...v0.5.9
[0.5.8]: https://github.com/automattic/jetpack-blaze/compare/v0.5.7...v0.5.8
[0.5.7]: https://github.com/automattic/jetpack-blaze/compare/v0.5.6...v0.5.7
[0.5.6]: https://github.com/automattic/jetpack-blaze/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/automattic/jetpack-blaze/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/automattic/jetpack-blaze/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/automattic/jetpack-blaze/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/automattic/jetpack-blaze/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/automattic/jetpack-blaze/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/automattic/jetpack-blaze/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/automattic/jetpack-blaze/compare/v0.3.4...v0.4.0
[0.3.4]: https://github.com/automattic/jetpack-blaze/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/automattic/jetpack-blaze/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/automattic/jetpack-blaze/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/automattic/jetpack-blaze/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/automattic/jetpack-blaze/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/automattic/jetpack-blaze/compare/v0.1.0...v0.2.0
