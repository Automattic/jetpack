# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.17.5] - 2025-06-02
### Changed
- Update package dependencies. [#43710]

## [0.17.4] - 2025-05-26
### Changed
- Update package dependencies. [#43516] [#43578]

## [0.17.3] - 2025-05-19
### Changed
- Update package dependencies. [#43398]

## [0.17.2] - 2025-05-12
### Changed
- Update package dependencies. [#43400]

### Fixed
- Add "Additional CSS" in the Appearance menu for Atomic sites. [#43272]

## [0.17.1] - 2025-05-05
### Changed
- Update package dependencies. [#43326]

### Fixed
- Linting: Address final rules in WordPress Stylelint config. [#43296]
- Linting: Do additional stylesheet cleanup. [#43247]

## [0.17.0] - 2025-04-28
### Removed
- Remove unused Phan exception. [#43063]

### Fixed
- Code: Remove unneeded `data:` URI components. [#43227]
- Linting: Fix more Stylelint violations. [#43213]

## [0.16.1] - 2025-04-21
### Fixed
- Add translation context to Search menu item. [#43094]

## [0.16.0] - 2025-04-14
### Changed
- Admin Menu: Update the icon of WooCommerce for the Woo installation. [#43029]

### Removed
- Color Scheme: Clean up `*-rgb` CSS variables. [#42960]
- Remove the site card from the admin sidebar. [#42499]

### Fixed
- Linting: Clean up various Stylelint violations. [#43010]
- Linting: Format SCSS imports consistently. [#43018]
- Linting: Update stylesheets to use WordPress rules for fonts and colors. [#42920] [#42928]
- Linting: Use double colon notation for pseudo-element selectors. [#43019]

## [0.15.1] - 2025-04-07
### Changed
- Code: First pass of style coding standards. [#42734]

## [0.15.0] - 2025-04-04
### Changed
- Stop using RDV experiment assignment. [#42765]

## [0.14.4] - 2025-04-02
### Changed
- Update dependencies. [#42820]
- Update package dependencies. [#42809]

## [0.14.3] - 2025-03-31
### Changed
- Internal updates.

## [0.14.2] - 2025-03-24
### Changed
- Update dependencies. [#42564]

### Fixed
- Admin Color Scheme: Fix colors in the Aquatic color scheme. [#42632]
- Site Badge: Update styles of the Coming Soon badge. [#42496]

## [0.14.1] - 2025-03-18
### Changed
- Update package dependencies. [#42511]

## [0.14.0] - 2025-03-17
### Added
- Add subscribers in WP Admin boilerplate. [#42066]

### Fixed
- Upsell to correct plan in Additional CSS customizer menu when running the Global Styles experiment. [#42471]

## [0.13.2] - 2025-03-12
### Changed
- Internal updates.

## [0.13.1] - 2025-03-10
### Changed
- Internal updates.

## [0.13.0] - 2025-03-03
### Changed
- Admin Color Schemes: Update color schemes to match Calypso. [#40908]
- Update package dependencies. [#42163]

### Removed
- Masterbar: Remove My Mailboxes admin link. [#40885]

### Fixed
- Admin menu: do not display the dashboard switcher button twice. [#42068]

## [0.12.4] - 2025-02-24
### Changed
- Internal updates.

## [0.12.3] - 2025-02-17
### Fixed
- JITMs: Ensure we offer the same shortcircuit as in other elements where JITMs can be injected. [#41380]

## [0.12.2] - 2025-02-10
### Changed
- Update package dependencies. [#41491]

## [0.12.1] - 2025-02-03
### Changed
- Phan: Update baselines. [#41263]
- Update package dependencies. [#41286]

## [0.12.0] - 2025-01-27
### Added
- Hide the calypso based Performance menu item on wordpress.com, show page-optimize based Performance menu item on Atomic sites. [#41145]

### Removed
- Remove classic view admin notice from general settings (for Atomic sites). [#41155]

## [0.11.0] - 2025-01-20
### Changed
- Add watch command in the masterbar package. [#41066]
- Code: Use function-style exit() and die() with a default status code of 0. [#41167]
- Updated package dependencies. [#41099]

### Removed
- Removed Settings > Security menu item from wpcom atomic sites in the hold out experiment. [#41112]

## [0.10.6] - 2025-01-10
### Changed
- Fixes the self-hosted link when WooCommerce is installed alongside SSO. [#40840]

## [0.10.5] - 2025-01-06
### Changed
- Updated package dependencies. [#40784] [#40792] [#40831]

## [0.10.4] - 2024-12-23
### Fixed
- Exclude the wpcom_admin_interface from the admin_menu action. [#40669]

## [0.10.3] - 2024-12-16
### Changed
- Updated package dependencies. [#40564]

## [0.10.2] - 2024-12-04
### Changed
- Updated package dependencies. [#40363]

## [0.10.1] - 2024-11-25
### Changed
- Updated dependencies. [#40286]
- Updated package dependencies. [#40258] [#40288]

## [0.10.0] - 2024-11-18
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

### Fixed
- Update the upgrade nudge for Additional CSS with the correct plan names. [#40107]

## [0.9.9] - 2024-11-11
### Changed
- Updated package dependencies. [#39999] [#40060]

## [0.9.8] - 2024-11-04
### Added
- Enable test coverage. [#39961]

### Fixed
- Fix PHPUnit coverage warnings. [#39989]

## [0.9.7] - 2024-10-28
### Changed
- Updated package dependencies. [#39910]

## [0.9.6] - 2024-10-14
### Changed
- Updated package dependencies. [#39707]

### Fixed
- Admin bar: Clean up WPCOM_ADMIN_BAR_UNIFICATION feature flag. [#39692]

## [0.9.5] - 2024-10-07
### Changed
- Updated package dependencies. [#39594]
- Update Jetpack Scan link. [#39619]

## [0.9.4] - 2024-09-30
### Changed
- Remove user connection nudges where they aren't needed. Add user connection nudges where needed [#39533]

### Removed
- Masterbar: Remove User Info side-panel [#39546]

### Fixed
- Admin bar: don't enqueue obsolete Core CSS overrides for Default scheme [#39453]

## [0.9.3] - 2024-09-23
### Changed
- Update dependencies.

## [0.9.2] - 2024-09-16
### Fixed
- Admin bar: align colors with Calypso's [#39314]
- Help Center: Fix the icon color when previewing color scheme [#39371]

## [0.9.1] - 2024-09-10
### Changed
- Updated package dependencies. [#39302]

## [0.9.0] - 2024-09-09
### Added
- Admin menu: Add text-overflow ellipsis for the site title and domain. [#39224]

### Changed
- Enable Users -> Profile (profile.php) on all sites [#39181]
- Updated package dependencies. [#39176]

### Fixed
- Hosting Configuration: Make the menu title under the settings the same as the destination [#39183]

## [0.8.1] - 2024-08-30
### Changed
- Updated package dependencies. [#39111]

## [0.8.0] - 2024-08-23
### Changed
- Remove locale sync [#39009]
- Updated package dependencies. [#39004]

### Fixed
- Inconsistent Color Scheme when previewing on Simple Default [#39048]

## [0.7.0] - 2024-08-21
### Changed
- Site Level User Profile: expose all relevant fields on profile.php [#38949]

### Fixed
- Revert recent SVG image optimizations. [#38981]

## [0.6.1] - 2024-08-19
### Changed
- Updated package dependencies. [#38662]

### Fixed
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## [0.6.0] - 2024-07-29
### Changed
- Remove Browse sites from sidebar as it's on WordPress logo in masterbar [#38547]

## [0.5.0] - 2024-07-22
### Added
- Add background color to address overlapping. [#38438]

### Changed
- Nav Redesign: Use Core admin bar for Simple and Atomic Default-view sites. [#38419]

## [0.4.0] - 2024-07-18
### Changed
- Admin Bar: Make it consistent between Calypso and WP Admin regardless of the value of Admin Interface Style [#38399]

### Fixed
- Masterbar: Fix undefined array key warning in Base_Admin_Menu::hide_parent_of_hidden_submenus [#38363]

## [0.3.1] - 2024-07-15
### Fixed
- Hide "My Mailboxes" link on P2 sites [#38232]

## [0.3.0] - 2024-07-08
### Changed
- As we've launched untangling & nav redesign, the wpcom_is_nav_redesign_enabled() function name is not relevant anymore and can be confusing for future developers, so we replace it with the equivalent get_option call. [#38197]
- Updated package dependencies. [#38132]

### Fixed
- Fixes scrollbar issue if upsell nudge is loaded in specific viewport. [#38170]

## [0.2.5] - 2024-06-28
### Changed
- Internal updates.

## [0.2.4] - 2024-06-26
### Changed
- Internal updates.

## [0.2.3] - 2024-06-26
### Fixed
- For sites with Classic view, don't load the masterbar package except the admin color schemes functionality. [#38020]

## [0.2.2] - 2024-06-25
### Fixed
- Masterbar: Fix missing private badge on admin menu for private WoA sites [#38026]

## [0.2.1] - 2024-06-25
### Fixed
- Profile: Restore profile fields on Classic interface [#38016]

## [0.2.0] - 2024-06-21
### Changed
- Masterbar: Require and use 'jetpack-masterbar' package in jetpack-mu-wpcom [#37812]

### Fixed
- Masterbar: Remove old fly panel [#37764]

## [0.1.1] - 2024-06-17
### Changed
- Updated package dependencies. [#37796]

### Fixed
- Color Schemes: Fix Sakura color issues on masterbar [#37806]

## 0.1.0 - 2024-06-10
### Added
- Initial version. [#37277]

### Changed
- Auto-labeling: label changes to the Masterbar feature in the Masterbar package. [#37309]
- Masterbar: Copy module code to package [#37342]
- Notifications: Change Icon [#37676]
- Updated package dependencies. [#37669] [#37706]

[0.17.5]: https://github.com/Automattic/jetpack-masterbar/compare/v0.17.4...v0.17.5
[0.17.4]: https://github.com/Automattic/jetpack-masterbar/compare/v0.17.3...v0.17.4
[0.17.3]: https://github.com/Automattic/jetpack-masterbar/compare/v0.17.2...v0.17.3
[0.17.2]: https://github.com/Automattic/jetpack-masterbar/compare/v0.17.1...v0.17.2
[0.17.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.16.1...v0.17.0
[0.16.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.15.1...v0.16.0
[0.15.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.14.4...v0.15.0
[0.14.4]: https://github.com/Automattic/jetpack-masterbar/compare/v0.14.3...v0.14.4
[0.14.3]: https://github.com/Automattic/jetpack-masterbar/compare/v0.14.2...v0.14.3
[0.14.2]: https://github.com/Automattic/jetpack-masterbar/compare/v0.14.1...v0.14.2
[0.14.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.14.0...v0.14.1
[0.14.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.13.2...v0.14.0
[0.13.2]: https://github.com/Automattic/jetpack-masterbar/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.12.4...v0.13.0
[0.12.4]: https://github.com/Automattic/jetpack-masterbar/compare/v0.12.3...v0.12.4
[0.12.3]: https://github.com/Automattic/jetpack-masterbar/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/Automattic/jetpack-masterbar/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.10.6...v0.11.0
[0.10.6]: https://github.com/Automattic/jetpack-masterbar/compare/v0.10.5...v0.10.6
[0.10.5]: https://github.com/Automattic/jetpack-masterbar/compare/v0.10.4...v0.10.5
[0.10.4]: https://github.com/Automattic/jetpack-masterbar/compare/v0.10.3...v0.10.4
[0.10.3]: https://github.com/Automattic/jetpack-masterbar/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/Automattic/jetpack-masterbar/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.9...v0.10.0
[0.9.9]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.8...v0.9.9
[0.9.8]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.7...v0.9.8
[0.9.7]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.6...v0.9.7
[0.9.6]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.5...v0.9.6
[0.9.5]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.4...v0.9.5
[0.9.4]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.2.5...v0.3.0
[0.2.5]: https://github.com/Automattic/jetpack-masterbar/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/Automattic/jetpack-masterbar/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Automattic/jetpack-masterbar/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Automattic/jetpack-masterbar/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-masterbar/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-masterbar/compare/v0.1.0...v0.1.1
