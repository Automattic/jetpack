# Changelog

## 5.3.2 - 2024-08-12
### Changed
- Internal updates.

## 5.3.1 - 2024-08-09
### Added
- Added safeguards against erroneous WordPress hook invocations. [#37859]

## 5.3.0 - 2024-08-08
### Changed
- Plan name change: Add translations [#38726]
- Update translation files [#38736]

### Fixed
- Update wpcomsh POT file [#38728]

## 5.2.1 - 2024-08-05
### Changed
- Internal updates.

## 5.2.0 - 2024-08-05
### Changed
- Add target_blog_id prop to AIOWP tracks events [#38615]
- My Jetpack: modify Jetpack AI product class and interstitial links [#38602]
- Plan names: Revert plan names to Personal/Premium/Business/Commerce [#38668]

## 5.1.2 - 2024-07-30
### Changed
- Fixup versions [#38612]

## 5.1.1 - 2024-07-30
### Removed
- Remove the old plugin banner code [#38605]

## 5.1.0 - 2024-07-29
### Changed
- Hide the plugin banner on non-wpcom-connected users or agency-managed users [#38532]

## 5.0.3 - 2024-07-26
### Removed
- Footer credit: Remove customizer option for block themes [#38559]

## 5.0.2 - 2024-07-26
### Fixed
- Fix the "The parent theme is missing" issue [#38557]

## 5.0.1 - 2024-07-25
### Changed
- WooCommerce Calypso Bridge version update to 2.5.5 [#38469]

## 5.0.0 - 2024-07-23
### Added
- Added new feature for social editor preview. [#38425]
- Added checks to remove WP.com items and links in WP Admin for users who are not connected to WP.com. [#38401]
- i18n: Updated language files. [#38447]

### Changed
- Improve plugin-dance command. [#38423]
- Updated package dependencies. [#38464]
- Updated WooCommerce Calypso Brdige version to 2.5.4. [#38451]

### Removed
- Footer credit: Removed customizer option for block themes. [#38473]
- Footer credit: Render default credit on block themes. [#38458]
- Removed checks for Jetpack versions over a year old. [#38386]
- Removed code for compatibility with WordPress before 6.5. [#38386]

## 4.0.0 - 2024-07-18
### Removed
- General: update WordPress version requirements to WordPress 6.5. [#38382]
- Removed code that disables Jetpack staging mode for WordPress.com staging sites. [#38355]

### Fixed
- Removed access to WPCom Themes to WP_CLI [#38351]

## 3.28.0 - 2024-07-15
### Added
- Added a check to hide the plugins banner for non-wpcom connected users. [#38241]
- WOA Post Transfer: Ensure that HPOS is enabled for WooCommerce sites. [#38119]

### Changed
- WooCommerce Calypso Bridge: Update version to 2.5.3 [#38302]

## 3.27.3 - 2024-07-08
### Added
- Add post transfer woo express deactivate plugins, post process cache flush, and post clone set staging environment [#38183]

### Changed
- Updated package dependencies. [#38228]
- Use wp-cli `success` function for messages [#38201]

### Fixed
- Fix generate POT script to follow symlinks in vendor/* and update language files. [#38153]

## 3.27.2 - 2024-07-01
### Changed
- Internal updates.

## 3.27.1 - 2024-06-28
### Fixed
- Wpcomsh: fixed fatal errors in case of null body class values. [#38114]

## 3.27.0 - 2024-06-28
### Added
- Added plugin dance command [#38108]

## 3.26.1 - 2024-06-26
### Added
- Site Migrations: Add tracks events for AIOWPM events. [#37902]

### Changed
- Updated custom-fonts to v3.0.4. [#38071]

## 3.26.0 - 2024-06-26
### Added
- Added polyfill for get_magic_quotes_gpc [#38039]

## 3.25.2 - 2024-06-26
### Changed
- Internal updates.

## 3.25.1 - 2024-06-25
### Changed
- Hide login banner for agency-managed sites. [#38021]

### Removed
- Plugin hotfixes: Remove a hotfix for an issue fixed in Gutenberg 15.3.0. [#38015]

### Fixed
- Custom Colors: Remove a use of `extract()`. [#38015]
- Switch from Jetpack-the-plugin's `Jetpack_WPCOM_Block_Editor` class to jetpack-mu-wpcom's namespaced version. [#38015]

## 3.25.0 - 2024-06-25
### Added
- Added a command to disable fatal error emails. [#38010]
- Add `atomic_managed_plugin_row_auto_update_label` filter to translate the managed plugin auto update label [#37983]

## 3.24.0 - 2024-06-24
### Added
- Added featrue flag checks for the Threads Social Connection. [#38001]
- wpcomsh: Add WP-CLI commands with hooks for WoA post-transfer/reset/clone functionality [#37972]

## 3.23.0 - 2024-06-21
### Added
- New wpcomsh CLI command to fix PHP 7.4 plugin [#37966]
- Wpcomsh: Update plugin dependencies [#37812]

### Changed
- Bump lock files. [#37870]
- Site Visibility: Update link copy [#37909]

## 3.22.16 - 2024-06-17
### Changed
- Fixed readme, added accurate links. [#37901]

## 3.22.15 - 2024-06-17
### Added
- Added a prefix for wpcomsh weekly shipping. [#37857]

### Changed
- WooCommerce Calypso Brdige version update to 2.5.2 [#37883]

### Removed
- Disable WP.com custom editor navigation bar. [#37893]
- Removed obsolete scripts and makefile targets. [#37880]

## 3.22.14 - 2024-06-14
### Changed
- Changed the composer package slug to wpcomsh. [#37861]

### Removed
- General: removing action status icons. [#37881]

## 3.22.13 - 2024-06-13
### Removed
- Untangling: Remove temporary code that hides Hosting menu options. [#37848]

## 3.22.12 - 2024-06-10
### Other Changes
- Update language files.

## 3.22.11 - 2024-06-13
### Other Changes
- Bump wpcomsh version.

## 3.22.10 - 2024-06-07
### Changed
- Update read access cookie arguments.

## 3.22.9 - 2024-06-06
### Fixed
- Do not override text color if it is not set on the theme.

### Other Changes
- Update jetpack-mu-wpcom version.
- Bump wpcomsh version.

## 3.22.8 - 2024-06-06

- Prevent non array/object from working.

## 3.22.7 - 2024-06-05
### Added
- Add create_function polyfill.

## 3.22.6 - 2024-06-04
### Added
- Initial version. [#37737]

### Changed
- Nav Redesign: Drop the early access and is_proxied. [#37845]
- Updated package dependencies. [#37737]

### Removed
- Remove code to replace "Site visibility" with a link to Calypso [#37843]
- Revert adding overview menu option [#37844]

## 3.22.5 - 2024-05-31
### Other Changes
- Phan: fixed bugs and problems that triggered static analysis warnings.

[13.3]: https://wp.me/p1moTy-19qu

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
