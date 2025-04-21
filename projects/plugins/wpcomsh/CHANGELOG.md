# Changelog

## 6.1.0 - 2025-04-07
### Added
- Add `AI_SEO_ENHANCER` feature for Business plans and above and JP Complete plans. [#42731]
- Add Atomic site ID to WooCommerce tracker data. [#42588]
- Add a temporary version of Instant Search which excludes business/commerce sites for performance reasons. [#42117]
- Add newsletter widget. [#41807]
- Add Account Protection initialization. [#40925]
- Add site launch button to the admin bar. [#41240]
- Add subscribers in WP Admin boostrap page. [#42066]
- Add `wpcomsh_at_managed_plugins` option to allowed list for sync. [#42287]
- Bump a Tracks stat for every wp-admin page view. [#42422]
- Business sites are now added on Instant Search. [#41963]
- Connection: Disconnect all other users before disconnecting a connection owner account. [#41923]
- Dashboard: Add Daily Writing Prompt widget. [#41094]
- Dashboard: Add general tasks widget. [#41150]
- Dashboard: Add launchpad. [#41434]
- Dashboard: Add site preview and links. [#41106]
- External Media: Add external media modal on the Media Import page. [#41282]
- Hotfix: Add filter to hide the Elementor Beta/Dev install banner. [#42219]
- Import Media: Introduce the Import Media page. [#41032]
- Incompatible Plugins: Add `object-cache-pro` and variation of `wp-simple-firewall`. [#42654]
- Launchpad: Add `create-course-goal` intent task list. [#42108]
- Managed Plugins: Maintain list of Atomic-managed plugins. [#42164]
- Media Library: Support Upload from URL on media-new page. [#41627]
- Newsletter Dashboard Widget: Remove feature flag and enable widget. [#42276]
- Post List: Add a Copy Link Quick Action. [#41305]
- Social: Enable Social Post UI for WordPress.com. [#41219]
- Untangle Calypso media page. [#41628]
- WOA: Add WordAds post transfer action. [#38915]
- WPCOM Site Helper CLI: Add processing for `woocommerce_helper_data`. [#41910]

### Changed
- Add Complete to AI features and sync other changes on wpcom features. [#40545]
- Admin Bar: Point the Edit Site menu item to `site-editor.php`. [#41137]
- Admin Color Schemes: Update color schemes to match Calypso. [#40908]
- Report site timezone via Bilmur RUM library. [#41964]
- Code: First pass of style coding standards. [#42734]
- Code: Use function-style `exit()` and `die()` with a default status code of 0. [#41167]
- Connection: Allow pre-selected login providers. [#42662]
- Connection: Display connection status on Users page independent of the SSO module. [#41794]
- External Media: Move the GooglePhotosMedia, OpenverseMedia, and PexelsMedia to `@automattic/jetpack-shared-extension-utils`. [#41078]
- General: Indicate compatibility with WordPress 6.8. [#42701]
- Hide "Verify Email" launchpad task for existing users. [#41326]
- i18n: Use translations from WP_LANG_DIR. [#42521]
- Legacy Music Player Widget: Add hook to bump stats on view. [#42541]
- Legacy Music Player Widget: Hide from the block-based widget editor. [#42540]
- Media Library: Hide storage info on Atomic upload.php's uploader. [#41625]
- Move logo-tool to be within `jetpack-mu-wpcom`. [#42598]
- Prevent site owner from editing user's account-level fields. [#42177]
- Newspack Blocks: Updated to version 4.5.2. [#40636]
- Site Visibility: Port the site visibility settings from Calypso to WP Admin. [#42230]
- Social: Enable connections management for WordPress.com sites. [#41019]
- Social: Enable media sharing for WordPress.com Business plan. [#41355]
- Social: Enable social admin page for all WordPress.com sites. [#41713]
- Social: Enable Social Image Generator for WordPress.com sites. [#42548]
- Social: Use feature flag for social admin page. [#41413]
- SSO: Use same login page after logging out as when already logged out. [#42586]
- Theme: Clean up files that were used during the theme switch and theme preview. [#42420]
- Theme Switch: Do not change homepage when switching theme. [#42388]
- Typekit Custom Fonts: Add license. [#42862]
- Typekit Custom Fonts: Avoid deprecation notices in PHP 8.2. [#42862]
- Update AIOWP tracks events. [#40149]
- Update composer.lock file. [#41066]
- Update deployment section with automatic releases & deploys [#42608]
- Update package dependencies. [#40515] [#40814] [#40980] [#41659]
- Update minimum PHP version to 8.1. [#41928]
- Update package dependencies. [#42180] [#42815]
- Update Site Settings link copy. [#41663]
- Update wc-calypso-bridge dependency. [#41453] [#41569] [#42360] [#42531] [#42606] [#42720]
- Use a new endpoint to get the list of themes from WordPress.com [#42143]
- Use `automattic/jetpack-composer-plugin` so jetpack-library packages will be installed in a place where `wp i18n` will see them. [#41185]
- Enable WordAds module via WP-CLI post transfer. [#40909]

### Deprecated
- Remove an extra instant search feature which included the Business/commerce sites. [#42710]

### Removed
- Remove the "Personalize Link in Bio" launchpad task. [#41949]
- Remove the launch bar from the frontend of Atomic sites. [#41113]
- Start page pattern modal: Remove start page pattern modal and default to core behavior. [#41479]
- Default to core welcome guide instead of custom welcome tour when the user creates a post for the first time. [#41258]

### Fixed
- Add Business sites back to Classic Search.. [#42254]
- Admin Color Scheme: Fix the color of the Aquatic color scheme. [#42632]
- Avoid opening Fiverr link when hitting Enter. [#42093]
- Do not set default values for autoincrement columns. [#42257]
- Fix missing SQLite default driver index sizes. [#42371]
- Remove Customizer color styles from the editor. [#41186]
- Fix undefined array key warnings on any Customizer theme with colors. [#41136]
- Fix a database password escaping issue when installing tests. [#39258]
- Fix an issue where setting color identity on the Customizer breaks block editor UI elements. [#41073]
- Ensure the color palette now shows up. [#40846]
- Global Styles: Stop showing the limited global styles notice in distraction free mode. [#40907]
- Gutenberg 19.9: Hide launch banner when the site is previewed in Appearance -> Design. [#40695]
- i18n: Download updated translations for wpcomsh. [#42494]
- i18n: Load javascript translations from WP_LANG_DIR. [#42550]
- i18n: Load jetpack-mu-wpcom translations from WP_LANG_DIR/mu-plugins. [#42172]
- Media Library: Ensure Upload from URL shows in the editor. [#41711]
- Don't load ETK on agency sites on all pages. [#41272]
- Filter out the full-site-editing plugin from the active_plugins list if the plugin file doesn't exist. [#41887]
- Use blueberry (modern) scheme for launch site button. [#42605]
- Make email and password available on the profile.php on the default view. [#41945]
- Port the fix of the modern color scheme from WP 6.8. [#42462]
- Page & Post: Fix the layout on mobile when details are open. [#40872]
- Playground SQL Importer: Correctly handle `DB_HOST` containing a port. [#42439]
- Purge the cache when the site visibility changes on Atomic sites. [#40650]
- Site Badge: Update styles of the Coming Soon badge. [#42496]
- Site Visibility: Prevent accidental changes to blog_public on the Settings > Reading page. [#42716]
- Testimonials: Fix bug in shortcode if the column attribute is added and set to 0. [#40896]
- Verbum: Fix broken block editor. [#41747]
- wpcomsh/private-site: Use `allowed_options` filter instead of deprecated `whitelist_options` one and use proper function for adding the callback (`add_filter` instead of `add_action`). [#40586]

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
