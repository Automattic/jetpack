# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2023-12-21
### Fixed
- Defer JS: added importmap to the exclusion list to fix compatibility issues. [#34746]

## [2.2.0] - 2023-10-31
### Changed
- General: Indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- Getting Started: Improved how features are sorted in the getting started page. [#33766]
- Performance History: Improvements in design. [#33133]

### Deprecated
- Lazy Images: Added deprecation notice. [#33749]
- Lazy Images: Force disable feature to avoid conflict with new version of Gutenberg and WordPress 6.4. [#33208]

### Fixed
- Concatenate JS/CSS: Fixed generating invalid html ID values for concatenated stylesheets. [#33002]
- Image CDN: Update quality slider UI. [#33300]

## [2.1.1] - 2023-09-13
### Added
- Image CDN: Added quality settings for premium users. [#32780]
- Performance History: New section to display historical performance. [#32759]

### Changed
- Image Size Analyzer: Removed get parameters from image URLs on ISA report details page. [#32476]
- UI: Improved discount elements for pricing section. [#32545]
- UI: Updated Image Size Analyzer error feedback. [#32685]
- General: Removed WP 6.1 backwards compatibility checks. [#32772]

### Fixed
- UI: Added the footer back on the getting started page. [#32549]
- Critical CSS: Improved the regenerate button to eliminate the possibility of accidental parallel regeneration. [#32011]
- Image Guide: Fixed oversize ratio in some cases. [#32548]
- Image Guide: Fixed grammar issue in the feature description on the Boost dashboard. [#32072]

## [2.0.2] - 2023-08-29
### Changed
- Critical CSS: Updated critical CSS url parameter to avoid redirect caching [#32727]

### Fixed
- Critical CSS: Improved compatibility with Yoast SEO and All in One SEO to ensure smooth Critical CSS generation. [#32627]

## [2.0.1] - 2023-08-18
### Fixed
- Critical CSS: Fixed manual critical CSS generation failure [#32502]
- Concatenate CSS: Fixed concatenated CSS being render-blocking when used with Critical CSS. [#32479]

## [2.0.0] - 2023-07-24
### Added
- Image Size Analyzer: New feature for Premium users which scans their site for image issues [#31794]

### Changed
- General: Beta tags removed from Concatenate CSS/JS and Image CDN. [#31777]
- General: Indicate full compatibility with the latest version of WordPress, 6.3. [#31910]
- Speed Scores: Update 'score dropped' card copy, with links to documentation. [#32010]

### Fixed
- Cloud CSS: Fixed automatic start of cloud CSS regeneration when module is toggled on [#31887]
- General: Fixed error snackbar from showing under UI separators on the Getting Started page. [#31706]
- Speed Score: Prevented page speed scores from auto refreshing on page load. [#31863]
- Super Cache Measurement Tool: Fixed the use of the donotcachepage option during tests, which may have produced understated results [#31828]

## [1.9.4] - 2023-07-05
### Fixed
- Minify CSS/JS: Removed Content-Length from cached minified content to avoid potential cache mangling on some hosts [#31692]

## [1.9.3] - 2023-07-03
### Fixed
- General: Bumped version to fix a versioning glitch in the WordPress.org repository.

## [1.9.2] - 2023-07-03
### Added
- Image Guide: Added a proxy to allow the Image Guide UI to load the size of remote images. [#31145]
- Minify CSS/JS: Added an endpoint for fetching minfied content which does not rely on loading WordPress, allowing hosts to more efficiently fetch minified content. [#30825]
- Speed Scores: Added an internal argument to record the source of each Speed Score request. [#31012]
- Speed Scores: Added a notice to the Site Health panel when speed scores need updating. [#31101]

### Changed
- Critical CSS: Updated the regeneration notice to include more descriptive text, explaining the trigger. [#31101]
- General: Updated checklist spacing and button font size and line height. [#31098]
- Image Guide: Switch to loading an invisible pixel for tracking Image Guide results, avoiding unnecessary traffic to admin-ajax. [#30983]
- Minify CSS: Moved the default URL base of minified CSS files to /_jb_static, and added a constant to override it. [#31631]
- Critical CSS: Updated the regeneration notice to include more descriptive text, explaining the trigger. [#31101]
- General: Updated checklist spacing and button font size and line height. [#31098]
- Image Guide: Switch to loading an invisible pixel for tracking Image Guide results, avoiding unnecessary traffic to admin-ajax. [#30983]

### Fixed
- Critical CSS: Critical CSS Generation was skipping posts and pages on sites with fewer than 10 of either. [#31506]
- General: Compatibility fixes for older versions of Safari [#31534]
- General: Fixed a potential loop which repeatedly showed the Getting Started page. [#31648]
- General: Fixed incorrect tracks events around plugin connection [#31233]
- Image Guide: Fixed issues with Image Guide placement on the page with some themes. [#31410]
- Minify CSS: Fixed issues with relative paths when WordPress is installed in a sub-directory. [30863]
- Minify CSS: Fixed issues with relative paths when WordPress is installed in a sub-directory. [#30863]
- Image Guide: Fixed issues with Image Guide placement on the page with some themes. [#31410]

## [1.9.1] - 2023-05-11
### Added
- New Feature: Added JS and CSS file minification [#30005]

### Changed
- General: Improved the way modules are toggled internally [#29451]
- General: Updated package dependencies
- Image CDN: Improved Image CDN description [#29962]
- User Experience: Removed back button from purchase success page [#30180]

### Fixed
- Cloud CSS: Don't run local regenerate automagically when using cloud css [#29968]
- Cloud CSS: Fixed a mismatch in cloud-css key [#29972]
- Critical CSS: Fixed Critical CSS from making redundant requests on page load [#30053]
- Deferred JS: Fixed some extremely short pages (such as WooCommerce Box Office tickets being printed) from resulting in a blank page [#30025]
- General: Fixed some PHP 8.2 Warnings [#30150]
- User Experience: Fixed some language choices around Boost popups [#30048]

## [1.8.0] - 2023-04-06
### Added
- Critical CSS: Added a notice to regenerate Critical CSS to the Boost dashboard. [#28858]
- General: Added a link to activate a license key. [#29443]
- Image CDN: Added image CDN to Boost. [#29561]
- Image Guide: Added information about the Image Guide to the readme. [#29799]

### Changed
- Critical CSS: Added clearer explanations of the feature, and when to regenerate CSS. [#29250]
- General: Faster "Getting Started" flow, bypassing the first connection screen. [#28938]
- General: Revised Jetpack connection agreement text to comply with our User Agreement. [#28403]
- General: Switch to a more stable internal data sync package. [#29899]
- General: Updated contributors list. [#28891]
- General: Updated to React 18. [#28710]

### Fixed
- Critical CSS: Added Internal schema validation for improved stability. [#29564]
- Critical CSS: Expanded the set of site changes which can trigger a regeneration. [#29109]
- Critical CSS: Fixed a minor UI glitch caused by a missing close tag. [#28548]
- Critical CSS: Fixed PHP warning when deleting stored Critical CSS [#28372]
- Critical CSS: Unified the internal structure of Cloud and Critical CSS, ensuring a smoother experience when switching between the two. [#29554]
- Lazy Loading: Fixed images sometimes failing to Lazy-load in Safari. [#29266]
- General: Fixed incorrect font sizes and weights in various screens. [#29411]
- General: Fixed incorrect GET parameters used during purchase flow, which leading to inconsistent behaviour. [#28825]
- Deferred JS: Fixed some compatibility issues with page-builders by turning off Deferred JS in the customizer preview. [#29143]
- General: Fixed triggers for optimization initialization sometimes firing on the wrong hook. [#28888]
- General: Fixed "Undefined array key: post" warning. [#29096]
- General: Fixed stats tracking by using the correct casing for Tracks event properties. [#29111]

## [1.7.0] - 2023-01-17
### Added
- New Feature: Jetpack Boost Image Guide.
- General: Add a notification bubble next to Boost in the WP-admin sidebar.
- General: Added new tracks events.
- User Experience: Add redirect to Boost dashboard after activating Boost plugin.

### Fixed
- Admin notices: only display regeneration notice to admins.
- Compatibility: Improve critical CSS compatibility with older Safari browsers.
- General: Don't let analytics failures prevent features from functioning.
- Critical CSS: Fixed an issue where notices to regenerate critical CSS were showing unnecessarily.
- General: Fix woocommerce deprecation warning.

## [1.6.0] - 2022-12-05
### Added
- General: New deactivation survey.
- General: New tracks events for upgrade CTA impressions.
- Super Cache: Added a tool for measuring the impact of Super Cache on your site performance.
- Usability: Prompt new users to setup Boost after plugin activation.

### Fixed
- Fixed an error on navigating to the getting-started page
- Fixed issues in Super Cache measurement tool on some URLs
- General: Fix showing discount markers on pricing options without a discount.
- General: Remove invalid link to priority support for free users.
- Speed Score: Fix un-clickable link to dismiss speed score popups.

## [1.5.4] - 2022-11-09
### Fixed
- Fixed an issue that caused boost to break on offline sites [#27312]

## [1.5.3] - 2022-10-25
### Added
- Compatibility: Added a compatibility module for WP Super Cache.
- Compatibility: Tested with v6.1 of WordPress.
- General: Added tracking to purchase flows.
- User Experience: Added a flow for first-time users.

### Fixed
- Critical CSS: Keep Critical CSS and Cloud CSS status in sync.
- Deferred JS: Fix detection of application/json scripts to auto-exclude them from deferral.
- Lazy Loading: Fix desynchronization of Lazy Loading features between Boost and Jetpack.
- Speed Scores: Fixed issues dismissing notifications on speed score improvements.

## [1.5.1] - 2022-06-29
### Fixed
- General: Fix caching of purchased plan features to reduce calls to wpcom api

## [1.5.0] - 2022-06-27
### Added
- Cloud CSS: Added support for generating Critical CSS in the cloud.
- Critical CSS: Added an explanation for Console output during Critical CSS Generation.
- General: Added an option to purchase a premium Jetpack Boost plan.
- General: Added option to contact premium support for paid users.
- Speed Scores: Added prompt for reaching out to support when the speed score decreases.

### Changed
- General: Remove soft disconnect.
- General: Remove use of `pnpx` in preparation for pnpm 7.0.
- General: Renamed hook `handle_theme_change` to `handle_environment_change`
- General: Updated external links to use Jetpack Redirects.

### Fixed
- General: Clean up use of FILTER_SANITIZE_STRING as it is deprecated in PHP 8.1
- Stability: Fix broken SQL query on uninstall.

## [1.4.2] - 2022-04-11
### Fixed
- Fixed critical CSS generation failure while using a CDN to serve CSS

## [1.4.1] - 2022-04-06
### Changed
- Critical CSS: Tidied up Critical CSS class structure.
- Critical CSS: Updated Critical CSS generation to exclude animation keyframes.
- Deferred JS: Updated exclusion attribute to allow quotes.
- General: Tested compatibility with WordPress 5.9.
- General: Updated Boost Dashboard heading logo.
- Lazy Loading: Updated Image Lazy Loading to reflect Jetpack's Lazy Loading setting.

## 1.4.0 - 2022-02-28
### Added
- UI: Adds My Jetpack functionality for consistent UI across all Jetpack plugins.

## 1.3.1 - 2021-12-02
### Added
- Critical CSS: Added a filter to allow stylesheets to load synchronously, to avoid CLS issues on certain setups.
- Critical CSS: Exclude "library" posts from Elementor plugin when generating Critical CSS.
- Critical CSS: Explicitly hide admin_bar during Critical CSS render, to improve compatability with custom admin bar setups.
- Speed Scores: Automatically retry if a speed score request is stuck for more than 15 minutes.
- Stability: New end-to-end testing system.

### Changed
- Critical CSS: Detect external CSS URLs from the client side, to improve compatibility with WAFs which modify HTML.
- Move Boost admin menu into Jetpack submenu.
- Speed Scores: Automatically refresh speed scores if the theme has changed.
- Speed Scores: Include active modules and Jetpack Boost version with Speed Score requests.

### Fixed
- Critical CSS: Ensure CSS files still load when JavaScript is not enabled.
- Critical CSS: Fixed issue with re-serving Critical CSS during generation process
- Critical CSS: Fix handling for corrupted font-face rules.
- Critical CSS: Fix issue with dismissing recommendations after enabling Critical CSS without page refresh.
- Critical CSS: Use home_url instead of site_url when determining homepage during Critical CSS generation.
- Minor UI fixes for small screens and tooltip display.
- Speed Scores: Do not show comparative scores when no modules are active.

## 1.3.0 - 2021-10-04
### Security
- Critical CSS: Add permissions checks to AJAX endpoints used when dismissing Critical CSS Recommendations.

### Added
- Critical CSS: Add extra information to "fetch" errors when generating Critical CSS.
- Critical CSS: Added explanation for mod-security HTTP 418 errors.
- Critical CSS: Added stats tracking for generation outcomes.
- Critical CSS: Added step-by-step instructions for Advanced Recommendations.
- Critical CSS: More descriptive error message if critical css is failing because of x-frame-options deny config.
- Speed Scores: Added "without Boost" speed score indicator.

### Changed
- Critical CSS: Take port numbers into account when comparing origins for proxying.

### Fixed
- Critical CSS: Clear generated CSS on theme change.
- Critical CSS: Ensure generator process is resumed after module deactivated and reactivated without reload.
- Speed Scores: Clear speed score on plugin deactivation and uninstallation.

## 1.2.0 - 2021-08-12
### Added
- Critical CSS: Added a new Advanced Critical CSS recommendations page.

### Changed
- Critical CSS: Updated error reporting for Critical CSS to offer more users more guidance.
- Tooling: Moved all development to the Jetpack monorepo.
- Boost is now compatible with WordPress 5.8.

### Fixed
- Tooling: Fix PHP unit testing dependency on later versions of PHP.
- Critical CSS: Ensure generator library uses cache-busting to load the latest version after updates.

## 1.1.0 - 2021-06-17

- Update: User connection is no longer required for Speed Scores.
- Update: Completely revamped how site speed scores are retreived.
- Update: Reduced backend dashboard JavaScript bundle size.
- Update: Added a message to explain how site score is calculated.
- Update: Added "Offline Mode" to allow testing Jetpack Boost on local environments easily.
- Update: Improved error handling and the error messages provided.
- Update: Improved Critical CSS Generation stability.
- Update: Remove animations from Critical CSS.
- Fix: Incompatibility with UsersWP and similar plugins that might introduce redirects during Critical CSS Generation.

## 1.0.6 - 2021-05-25

- Fix: Failed to execute 'json' errors
- Fix: Connection UI Border issues
- Update: Improve Jetpack compatibility
- Update: Improve Critical CSS Compatibility with caching and minification plugins
- Update: Clean up JavaScript dependencies

## 1.0.5 - 2021-05-13

- Fixed: Defer JavaScript compatibility with XML Requests

## 1.0.4 - 2021-05-06

- Fixed: Web Stories compatibility
- Improved: "Defer Non-Essential Javascript" module compatibility with other plugins

## 1.0.3 - 2021-04-26

- Updated: Support for AMP Plugin 2.0+
- Updated: No longer defer JavaScript on POST, AJAX, Cron requests and sitemaps.

## 1.0.2 - 2021-04-22

- Improved: HTML Media tag handling
- Fixed: Metrics timeout caused by caching in the REST API

## 1.0.1 - 2021-04-20

- Fixed: An issue where the connection iframe would sometimes break
- Updated: On connection: showing an XML RPC Error instead of HTTP 500 when XML-RPC is disabled

## 1.0.0 - 2021-04-19

- This update brings a lot of stability improvements.
- We've been hard at work to get here and Jetpack Boost v1.0.0 is finally here! 🎉

## 0.9.19 - 2021-03-19

- We've refactored the plugin quite a bit, starting from the UI to stability fixes.

## 0.9.1 - 2020-12-29

- First public alpha release

[2.2.1]: https://github.com/Automattic/jetpack-boost-production/compare/2.2.0...2.2.1
[2.2.0]: https://github.com/Automattic/jetpack-boost-production/compare/2.1.1...2.2.0
[2.1.1]: https://github.com/Automattic/jetpack-boost-production/compare/2.0.2...2.1.1
[2.0.2]: https://github.com/Automattic/jetpack-boost-production/compare/2.0.1...2.0.2
[2.0.1]: https://github.com/Automattic/jetpack-boost-production/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/Automattic/jetpack-boost-production/compare/1.9.4...2.0.0
[1.9.4]: https://github.com/Automattic/jetpack-boost-production/compare/1.9.3...1.9.4
[1.9.3]: https://github.com/Automattic/jetpack-boost-production/compare/1.9.2...1.9.3
[1.9.2]: https://github.com/Automattic/jetpack-boost-production/compare/1.9.1...1.9.2
[1.9.1]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.8.0...boost/branch-1.9.1
[1.8.0]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.7.0...boost/branch-1.8.0
[1.7.0]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.6.0...boost/branch-1.7.0
[1.6.0]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.5.4...boost/branch-1.6.0
[1.5.4]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.5.3...boost/branch-1.5.4
[1.5.3]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.5.1...boost/branch-1.5.3
[1.5.1]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.5.0...boost/branch-1.5.0
[1.5.0]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.4.2...boost/branch-1.5.0
[1.4.2]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.4.1...boost/branch-1.4.2
[1.4.1]: https://github.com/Automattic/jetpack-boost-production/compare/boost/branch-1.3.1...boost/branch-1.4.1
