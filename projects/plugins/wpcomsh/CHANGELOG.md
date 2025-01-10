# Changelog

## 6.0.0 - 2024-12-04
### Added
- Add Growth to features in wpcomsh package. [#40187]
- Enable test coverage. [#39961]
- WordPress.com plan features: Added cornerstone 10 pages feature. [#40023]
- WordPress.com plan features: Added studio-sync feature. [#39843]

### Changed
- Added wp-downgrade to the incompatible list. [#39264]
- Admin dashboard: Disable portfolio toggle if theme supports portfolio and site is WoA. [#39508]
- General: indicate compatibility with the upcoming version of WordPress - 6.7. [#39786]
- Incompatible Plugins: whitelist duplicator pro. [#39775]
- Introduced ESLint base config and fixed errors. [#39275]
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Remove unused dev dependencies. [#40297]
- Updated feature check. [#40120]
- Updated package dependencies. [#39594] [#39653] [#40116] [#40261]
- Update Jetpack Scan link. [#39619]
- Update wc-calypso-bridge dependency to 2.7.1 [#39557]
- Update wc-calypso-bridge dependency to 2.8.0 [#39613]
- Update wc-calypso-bridge dependency to 2.8.1 [#39950]

### Removed
- General: Update minimum WordPress version to 6.6. [#40146]
- Test remove redirection. [#39615]

### Fixed
- Fix function that add links to URLs in the page when having HTML attributes with "<" in the value. [#39931]
- Move `load_muplugin_textdomain` call to `after_setup_theme` hook. [#39586]
- Stats: Fix top post card on the Insight page. [#39691]
- wpcom-block-editor: Support getting the canvas mode from the query string after GB 19.6. [#40045]

## 5.10.0 - 2024-09-23
### Added
- Performance Profiler: Ensure the associated url created when the performance report is generated is accessible for each page or as part of site settings for the home/main url. [#39310]

### Removed
- Connection: Removed deprecated method features_available. [#39442] [#39475]

### Fixed
- Portfolios: Ensure these are enabled and working properly on themes that support portfolios. [#39431]

## 5.9.0 - 2024-09-18
### Changed
- WPCOMSH: change call to so it doesn't trigger if not necessary [#39336]

### Removed
- Wpcomsh: Remove actions and filters related to the Masterbar module [#39367]

### Fixed
- Color Scheme: Avoid wpcom user data overriding the admin color after flushing cache [#39368]
- WPCOM Features: Add INSTALL_THEMES feature to Jetpack sites so that they are not erroneously seeing the "upgrade" badge when looking at dotorg themes in the wordpress.com showcase [#39392]

## 5.8.0 - 2024-09-10
### Changed
- Enable Users -> Profile (profile.php) on all sites [#39181]
- SSO: Show wp-admin login form if site has local users [#39139]
- Updated package dependencies. [#39288]
- Update wc-calypso-bridge dependency to 2.6.0 [#39313]

### Fixed
- Checks an array key before attempting to read it. [#39240]

## 5.7.0 - 2024-09-02
### Added
- WPCOM Marketplace: Added software manager to install marketplace products. [#38705]

## 5.6.2 - 2024-08-30
### Added
- Added a switch that will enable rolling trunk releases. [#38994]

## 5.6.1 - 2024-08-26
### Changed
- Internal updates.

## 5.6.0 - 2024-08-23
### Added
- Added social share status feature [#39023]

### Changed
- SSO: Automatic logic for Calypso users of classic sites [#38996]
- Updated package dependencies. [#39004]

## 5.5.0 - 2024-08-21
### Changed
- Site Level User Profile: expose all relevant fields on profile.php [#38949]

### Fixed
- Revert recent SVG image optimizations. [#38981]

## 5.4.1 - 2024-08-19
### Added
- Incompatible Plugins: Added one-click-ssl [#38918]

### Changed
- Updated package dependencies. [#38822]

### Fixed
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## 5.4.0 - 2024-08-13
### Changed
- rum data: include WooCommerce active status [#38846]

## 5.3.3 - 2024-08-12
### Changed
- Internal updates.

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
