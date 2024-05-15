# Changelog

### This is a list detailing changes for all Super Cache releases.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.1] - 2024-05-09
### Changed
- General: update WordPress version requirements to WordPress 6.4. [#37047]
- General: use wp_admin_notice function introduced in WP 6.4 to display notices. [#37051]

### Fixed
- Fix the CDN functionality when cache is disabled [#37112]
- Do not define DONOTCACHEPAGE if it is already defined [#36423]

## [1.12.0] - 2024-03-11
### Added
- Setup: Detect Jetpack Boost cache and suggest troubleshooting steps [#36018]
- WP Super Cache: added WPSC_PRELOAD_POST_INTERVAL and WPSC_PRELOAD_LOOP_INTERVAL to modify preload timings [#36246]

### Changed
- Code Modernization: Replace usage of strpos() with str_contains() [#34137]
- Code Modernization: Replace usage of strpos() with str_starts_with(). [#34135]
- Code Modernization: Replace usage of substr() with str_starts_with() and str_ends_with(). [#34207]
- Fix blurry Automattic logo. [#34985]
- General: avoid deprecation warnings when trying to get URLs in PHP 8.2 [#34962]
- General: indicate compatibility with the upcoming version of WordPress, 6.5. [#35820]
- General: updated PHP requirement to PHP 7.0+ [#34126]
- General: update WordPress version requirements to WordPress 6.3. [#34127]
- WP Super Cache: check for Boost Cache when creating advanced-cache.php [#36027]
- WP Super Cache: fixed labels on advanced settings page [#36067]
- WP Super Cache: remove notifications that preload started working again. [#35960]

### Fixed
- Supercache: add "days" to "Next preload scheduled" message. [#34509]
- Super Cache: with rebuild enabled, apply that to subdirectories instead of deleting them. [#35032]
- WP Super Cache - fix the wp_super_cache_clear_post_cache filter so the homepage cache isn't deleted too. [#36069]
- WP Super Cache: bail if the request uri isn't set. It means the plugin isn't configured yet. [#36024]
- WP Super Cache: don't create an output buffer if there's already one active [#36124]
- WP Super Cache: fixed serving a cached page on POST with late init enabled. [#36211]
- WP Super Cache: fix the output buffer check, and make debug logs pre-formatted. [#36158]
- WP Super Cache: if the preload number of posts is not in the list, then add it [#36249]

## [1.11.0] - 2023-11-08
### Added
- Super Cache: fix "accept header" check, and add new "wpsc_accept_headers" filter on accept header list [#33972]

### Changed
- General: indicate full compatibility with the latest version of WordPress, 6.4. [#33776]
- General: update WordPress version requirements to WordPress 6.2. [#32762]
- Overhauled visual styling to match Jetpack branding [#32981]
- Updated package dependencies. [#32307]
- Updated package dependencies. [#32605]
- Updated package dependencies. [#32966]
- Updated package dependencies. [#33498]

### Fixed
- Caching: make sure $wp_cache_request_uri is defined to avoid warnings about "NULL" parameters. [#32629]
- super-cache: fixed null parameter warning when using $supercachedir [#33970]
- Super Cache: cancel the full preload job correctly. [#33560]

## [1.10.0] - 2023-08-16
### Added
- Caching: Added support for the 'Accept' HTTP Header. Prevent caching JSON content. [#29456]
- Preload: Improved preload notification panel shows the last 5 preloaded URLs. [#31017]

### Changed
- General: Indicate full compatibility with the latest version of WordPress, 6.3. [#31910]
- General: Update Boost install / activate card styles. [#31311]
- General: Update documentation links to point to Jetpack.com docs. [#32164]
- General: Update the contributors list. [#29241]
- Preload: Faster and more robust preloading slower hosts. [#30450]

### Removed
- Cleanup: Removes unwanted development environment files from production version of the plugin. [#30216]
- Cleanup: Remove unused "object cache" code. [#31783]

### Fixed
- Cache Compression: Fix PHP warning appearing in gzip output stream. [#31487]
- Caching: Reject unknown or malformed URIs to prevent PHP warnings. [#31786]
- Dynamic Caching: Fixed incorrect encoding headers when using dynamic caching with compression. [#32106]
- Setting page: Fixed boost banner getting oversized when zoomed out
- General: Fix incorrect Debug Log URL for nested WordPress installations. [#29985]
- General: Fix links to cache directory on sites that are in a sub directory. [#30872]
- General: Updated Nginx documentation hyperlink. [#31420]
- Preload: No longer deletes child taxonomies during preload. [#30830]
- Preload: Use a constant instead of hard-coded email numbers in preload dropdown. [#30713]
- Caching: Prevent Super Cache from attempting to gunzip content which is not zipped
- General: Fix null/false warning in PHP8.1

## [1.9.4] - 2023-02-28
### Added
- Added new filter which controls cache clearing on post edit. [#28556]
- Added a check to ensure preload cronjobs exist when updating preload settings. [#28545]

### Changed
- Updated contributors list. [#28891]

### Fixed
- Fixed undefined PHP variable when trying to delete a protected folder. [#28524]
- Fixed deprecation warnings on PHP 8.1+. [#28959]

## [1.9.3] - 2023-01-23
### Added
- Added new filters to set mod_expires rules and HTTP headers in the cache htaccess file. [#28031]

### Fixed
- Fixed an issue that caused wp-config.php file permissions to change. [#28164]
- Fixed missing missing action 'wp_cache_cleared' when clearing the cache on post update. [#28481]

## [1.9.2] - 2022-12-09
### Added
- Added a dismissable option to install Jetpack Boost. [#26702]
- Improved stability with the start of an end-to-end test suite. [#26462]
- Tested with v6.1 of WordPress. [#26831]

### Changed
- Updated package dependencies.

### Fixed
- Compatibility: Avoid use of QUERY_STRING value, which is not available in all environments. [#26251]
- Updated links to related plugins to remove click-tracking redirects. [#26757]

## [1.9.1] - 2022-11-02
### Fixed
- Fixes crash when using the “Jetpack Mobile Theme” plugin alongside Jetpack 11.5.

## [1.9.0] - 2022-09-16
### Added
- Cache deletion: add new hook to trigger actions after a successful cache deletion from the admin bar. [#26202]

### Fixed
- Fixes to URL parsing to prevent cache pollution issues around URLs with double-slashes. [#26247]

## [1.8] - 2022-08-16
### Added
- PHP 8 Support: Ensure the expected value for the $auto_release in sem_get is used.
- Added a link to give feedback on WP Super Cache
- Added information on Jetpack Boost

### Fixed
- Fixed jQuery deprecated notice
- Fixed replacing dirname(__FILE__) with __DIR__

## 1.7.9 - 2022-06-07

- Fix nonces used by "Delete Cache" button and remove JS from it on the frontend admin bar.
- Define the constant WPSCDISABLEDELETEBUTTON to disable the "Delete Cache" button in the admin bar.

## 1.7.8 - 2022-06-07

* Change the admin bar "Delete Cache" button into an AJAX link #808 #810
* Fix link to log file in custom WordPress structure #807
* Add an auto updating preload message. #811 #816
* Use REQUEST_URI instead of GET to check GET status. #813
* Add commonWP and disclaimer to "recommended links" #812
* Hide warnings in case files deleted #814
* Remove the GET param when removing tracking params #818
* Check that post is private to unpublish it and clear cache 2249e58e6f585d936c0993e9d18e6382fa976a66
* Check $gc_flag was opened before closing it. #819

## 1.7.7 - 2022-02-01

* Fixes to settings page

## 1.7.6 - 2022-01-31

* Fix for PHP < 7.3

## 1.7.5 - 2022-01-31

* Move the text of the settings pages into separate files. #791
* Allow editors to delete all the cache files. #793
* Only clear the cache from the current site, not the whole network (admin bar link). #794
* Check $cache_path is somewhat sane. #797
* realpath returns false if directory not found. #798
* Don't reject bots for new installs. They "preload pages" too. #800

## 1.7.4 - 2021-07-08

* Make config file path configurable, props @sebastianpopp #755
* Stop a very rare/difficult attack when updating wp-config.php, props @guyasyou for reporting. #780
* Add textbox to add tracking parameters to ignore when caching. props @markfinst, @radex02 #777
* Add "Rejected Cookies" setting to the advanced settings page. #774

## 1.7.3 - 2021-04-28

* Sanitize the settings that are written to the config file #763
* Fix the display of "direct cached" example urls in some circumstance. #766

## 1.7.2 - 2021-03-15

* Fixed authenticated RCE in the settings page. Props @m0ze
* Small bug fixes.

## 1.7.1 - 2020-01-30

* Minor fixes to docs. #709 #645
* Fixed typo on cache contents page. #719
* Fixed array index warning. #724
* Updated yellow box links. #725

## 1.7.0 - 2020-01-27

* Added "wpsc_cdn_urls" filter to modify the URLs used to rewrite URLs. #697
* Fixed CDN functionality for logged in users. #698
* Disable settings that don't work in Expert mode. #699
* Don't enable mobile support by default, but it can still be enabled manually. #700
* Change "admin bar" to "Toolbar". Props @garrett-eclipse. #701
* Show settings enabled by "easy" settings page. #703

## 1.6.9 - 2019-07-25

* Improve the variables and messaging used by advanced-cache.php code. #687
* Add a warning message to the debug log viewer. #688
* Disable raw viewing of the debug log. #691
* Clean up the debug log. #692 #694
* Added wpsc_update_check() in 9659af156344a77ae247dc582d52053d95c79b93.

## 1.6.8 - 2019-06-27

* Added new constants, WPSC_SERVE_DISABLED (disable serving of cached files) and WPSC_SUPERCACHE_ONLY (only serve supercache cache files). #682 and #672
* Hide get_post() warning on some sites. #684
* Check if WPCACHEHOME is set correctly before maybe updating it. #683
* Remove object cache support as it never worked properly. #681
* Add "logged in users" to the  "do not cache for users" setting and rename that setting to "Cache Restrictions" #657

## 1.6.7 - 2019-05-30

* wp_cache_setting() can now save boolean values since many of the settings are bools. #676
* Check if $super_cache_enabled is true in a less strict way because it might be '1' rather than true. #677

## 1.6.6 - 2019-05-28

* Fix problems with saving settings. Returns false ONLY when there's an issue with the config file, not when the setting isn't changed. Change other code to cope with that, including updating WPCACHEHOME (#670)
* When saving settings rename the temporary config file correctly, and delete wp-admin/.php if it exists. (#673)
* Fix adding WPCACHEHOME to wp-config.php when advanced-cache.php is not found and wp-config.php is RO. (#674)

## 1.6.5 - 2019-05-27

* Check advanced-cache.php was created by the plugin before modifying/deleting it. (#666)
* When saving settings, save blank lines. Fixes problems with WP_CACHE and WPCACHEHOME in wp-config.php. Related to #652. (#667)
* Update outdated code and use is_multisite() (#600)
* Fix the delete cache button in the Toolbar. (#603)
* Code cleanup in #602
* Use get_post_status instead of post_status (#623)
* Fixes button - Update Direct Pages (#622)
* Removes apache_response_headers and uses only headers_list (#618)
* Function is_site_admin has been deprecated (#611)
* Fixes action urls in wp_cache_manager (#610)
* Remove the link to the HibbsLupusTrust tweet. (#635)
* Don't load wp-cache-config.php if it's already loaded (#605)
* PHPCS fixes and optimization for plugins/domain-mapping.php (#615)
* Introduces PHP_VERSION_ID for faster checking (#604)
* Fixes regex and optimizes ossdl-cdn.php (#596)
* Only update new settings and use a temporary file to avoid corruption. (#652)
* Serve cached files to rejected user agents, don't cache them. (#658)
* Combine multiple headers with the same name (#641)
* Open ‘Delete Cache’ link in same window (#656)
* Promote the Jetpack Site Accelerator on the CDN page. (#636)

## 1.6.4 - 2018-08-22

* Changes between [1.6.3 and 1.6.4](https://github.com/Automattic/wp-super-cache/compare/1.6.3...1.6.4)
* Fixes for WP-CLI (#587) (#592)
* Bumped the minimum WordPress version to 3.1 to use functions introduced then. (#591)
* Fixes to wpsc_post_transition to avoid a fatal error using get_sample_permalink. (#595)
* Fixed the Toolbar "Delete Cache" link. (#589)
* Fixed the headings used in the settings page. (#597)

## 1.6.3 - 2018-08-10

* Changes between [1.6.2 and 1.6.3](https://github.com/Automattic/wp-super-cache/compare/1.6.2...1.6.3)
* Added cookie helper functions (#580)
* Added plugin helper functions (#574)
* Added actions to modify cookie and plugin lists. (#582)
* Really disable garbage collection when timeout = 0 (#571)
* Added warnings about DISABLE_WP_CRON (#575)
* Don't clean expired cache files after preload if garbage collection is disabled (#572)
* On preload, if deleting a post don't delete the sub directories if it's the homepage. (#573)
* Fix generation of semaphores when using WP CLI (#576)
* Fix deleting from the Toolbar (#578)
* Avoid a strpos() warning. (#579)
* Improve deleting of cache in edit/delete/publish actions (#577)
* Fixes to headers code (#496)

## 1.6.2 - 2018-06-19

* Fixed serving expired supercache files (#562)
* Write directly to the config file to avoid permission problems with wp-content. (#563)
* Correctly set the .htaccess rules on the main site of a multisite. (#557)
* Check if set_transient() exists before using it. (#565)
* Removed searchengine.php example plugin as it sets a cookie to track users. Still available [here](https://github.com/Automattic/wp-super-cache/blob/4cda5c0f2218e40e118232b5bf22d227fb3206b7/plugins/searchengine.php). (#567)
* For advanced users only. Change the vary and cache control headers. See https://github.com/Automattic/wp-super-cache/pull/555 (#555)

## 1.6.1 - 2018-05-15

* Fix the name of the WP Crontrol plugin. (#549)
* Handle errors during deactivation/uninstall by email rather than exiting. (#551)
* Add a notice when settings can't be updated. (#552 and #553)

## 1.6.0 - 2018-04-30

* Fix issues in multisite plugin (#501)
* Fixes wp-cli plugin deactivate/activate (#499)
* Cleanup - change quotes. (#495)
* $htaccess_path defines the path to the global .htacess file. (#507)
* Fix 'cannot redeclare gzip_accepted()' (#511)
* Correct the renaming of tmp_wpcache_filename (removed unnecessary slash in path) which caused renaming to fail. (#516)
* Add check for Jetpack mobile theme cookie (#515)
* Optimize wp_cache_phase2 and create wpsc_register_post_hooks (#508)
* WPCACHEHOME has a trailing slash (#513)
* Cleanup cache enable/disable and update_mod_rewrite_rules (#500)
* Post Update now clears category cache (#519)
* Various fixes for saving the debug page form (#542)
* Expert-caching and empty parameters, like ?amp, should not serve cached page (#533)
* Tiny Yslow description fix (#527)
* Add ipad to mobile list (#525)
* Hide opcache_invalidate() warnings since it's disabled some places. (#543)
* Check that HTTP_REFERER exists before checking it. (#544)
* Replace Cron View" with WP Crontrol because it's still updated. (#546)
* adding hook (wp_cache_cleared) for full cache purges (#537)

## 1.5.9 - 2017-12-15

* Fixed fatal error if the debug log was deleted while debugging was enabled and a visitor came to the site.
* Fixed the dynamic caching test plugin because of PHP7 changes. Dynamic cache mode must be enabled now.
* Lots of WordPress coding style formatting fixes to the code.
* All changes: https://github.com/Automattic/wp-super-cache/compare/1.5.8...1.5.9

## 1.5.8 - 2017-10-31

* PHP 7 fixes. (#429)
* Fix debug comments checkbox. (#433)
* Only register uninstall function in admin pages to save queries. (#430)
* Check that wp-cache-phase1.php is loaded before saving settings page. (#428)
* If a url has a "?" in it then don't delete the associated cache. It'll delete the whole cache after stripping out ?... part. (#427 & #420)
* Allow static functions in classes to be used in cacheactions. (#425)
* Don't make AJAX requests anonymous. (#423)
* Fixed link to chmod explanation. (#421)
* Add more escaping to the CDN settings page. (#416)
* Use SERVER_PROTOCOL to determine http protocol. (#412 & #413)
* If preload stalls only send one email per day, but do display an admin notice. (#432)
* Fixed more PHP warnings in #438 and #437
* Hide mod_rewrite warnings for Nginx users. #434

## 1.5.7.1 - 2017-10-11

* If the HTTP HOST is empty then don't use it in strpos to avoid a PHP warning. (#408)
* Don't preload posts with permalinks that contain rejected strings. (#407)
* Generate a list of archive feeds that can be deleted when the site is updated. Also fixes corrupted config file issue and fatal error with older versions of WordPress. (#403)

## 1.5.7 - 2017-10-06

* Fix fatal error in plugins/searchengine.php (#398)

## 1.5.6 - 2017-10-04

* REST API: Added /plugins endpoint to handle the plugins settings page. (#382)
* Minor changes to indentaion and spaces to tabs conversion (#371) (#395)
* Don't set $wp_super_cache_comments here as it's not saved. (#379)
* realpath() only works on directories. The cache_file wasn't set correctly. (#377)
* Fix problem deleting cache from Toolbar because of realpath() (#381)
* Use trigger_error() instead of echoing to the screen if a config file isn't writeable. (#394)
* Added the "wpsc_enable_wp_config_edit" filter to disable editing the wp-config.php (#392)
* Fix some PHP notices when comments are edited/published/maintained. (#386)
* Minor changes to description on plugins page. (#393)

## 1.5.5 - 2017-08-29

* Catch fatal errors so they're not cached, improve code that catches unknown page types. (#367)
* Fix caching on older WP installs, and if the plugin is inactive on a blog, but still caching, give feeds a short TTL to ensure they're fresh. (#366)
* When preloading don't delete sub-directories, or child pages, when caching pages. (#363)
* Avoid PHP warnings from the REST API for settings that are not yet defined. (#361)
* Added missing settings to the config file. (#360)

## 1.5.4 - 2017-08-23

* Fix messages related to creating advanced-cache.php (#355, #354)
* Deleting the plugin doesn't need to delete the cache directory as it's already done on deactivation. (#323)
* Disable Jetpack mobile detection if Jetpack Beta is detected. (#298)
* Add more checks on directories to make sure they exist before deleting them. (#324)
* Add siteurl setting to CDN page for users who have WordPress in it's own directory. (#332)
* Don't enable and then not save debug comments when toggling logging. (#334)
* Show plugin activity html comments to users who disable caching for logged in users. (#335)
* Better notifications on Preload page, and redo sql to fetch posts. Added "wpsc_preload_post_types_args" filter on post visibility, and wpsc_preload_post_types filter on post types used. (#336)
* Use a cached feed if it is newer than the last time a post was updated. (#337)
* Better define a sitemap (#340) but when the content type is unknown add more checks to find out what it is. (#346)
* Save cache location correctly on the advanced settings page. (#345)
* Make sure the debug log exists before toggling it on/off to ensure the http auth code is added to it.
* Return the correct cache type to the REST API. Ignore supercache enabled status. (#352)
* Fix cache contents in REST API showing double count of supercache files. (#353)
* Move the nonce in the CDN page back into a function. (#346)
* Use realpath to compare directories when loading the sample config file to account for symlinked directories. (#342)
* Other minor changes to html or typos
(Numbers are [pull requests](https://github.com/Automattic/wp-super-cache/pulls) on Github.)

## 1.5.3 - 2017-07-26

* Fix a critical bug that caused unlink to be run on null while deleting the plugin.

## 1.5.2 - 2017-07-26

* Add a trailing slash to home path. Fixes problems with finding the .htaccess file.
* Delete WPCACHEHOME and WP_CACHE from wp-config.php when plugin deactivated.
* Check that WPCACHEHOME is the right path on each load of the settings page.
* Load the REST API code without using WPCACHEHOME.
* Fixed mobile browser caching when using WP-Cache caching.
* Fixed directory checks on Windows machines.
* Reverted CDN changes in 1.5.0 as they caused problems in older "WordPress in a separate directory" installs.
* Added note to CDN page when site url != home url. Site owners can use a filter to adjust the URL used.
* Stop preload quicker when requested while preloading taxonomies.
* Added more information for when updating the .htaccess file fails.
* "Served by" header is now optional. Enable it by setting $wpsc_served_header to true in the config file.

## 1.5.1 - 2017-07-20

* Don't use anonymous functions in REST API
* Check that REST API Controller is available before loading the REST API.
* Don't use multibyte string functions because some sites don't have it enabled.

## 1.5.0 - 2017-07-19

* REST API settings endpoints.
* Simplified settings page.
* WP-Cache files reorganised.
* Caching of more http headers.
* Lots of bug fixes.

## 1.4.9 - 2017-06-01

* Fixed bug when not running sem_remove after sem_release. See https://github.com/Automattic/wp-super-cache/issues/85
* Fixed a PHP error impacting PHP 7.1.
* Fixed a bug where we cached PUT and DELETE requests. We're treating them like POST requests now.
* Delete supercache cache files, even when supercache is disabled, because mod_rewrite rules might still be active.
* Updated the settings page, moving things around. [#173](https://github.com/Automattic/wp-super-cache/pull/173)
* Make file locking less attractive on the settings page and fixed the WPSC_DISABLE_LOCKING constant so it really disables file locking even if the user has enabled it already.
* Added a WPSC_REMOVE_SEMAPHORE constant that must be defined if sem_remove() is to be used as it may cause problems.  [#174](https://github.com/Automattic/wp-super-cache/pull/174)
* Added a "wpsc_delete_related_pages_on_edit" filter that on returning 0 will disable deletion of pages outside of page being edited. [#175](https://github.com/Automattic/wp-super-cache/pull/175)
* Fixed plugin deleting all cached pages when a site had a static homepage. [#175](https://github.com/Automattic/wp-super-cache/pull/175)
* Make sure $cache_path has a trailing slash [#177](https://github.com/Automattic/wp-super-cache/pull/77)
* Remove flush() [#127](https://github.com/Automattic/wp-super-cache/pull/127) but also check if headers are empty and flush and get headers again. [#179](https://github.com/Automattic/wp-super-cache/pull/179)
* Add fix for customizer [#161](https://github.com/Automattic/wp-super-cache/pull/161) and don't cache PUT AND DELETE requests [#178](https://github.com/Automattic/wp-super-cache/pull/178)
* Check for superglobals before using them. [#131](https://github.com/Automattic/wp-super-cache/pull/131)

## 1.4.8 - 2017-01-11

* Removed malware URL in a code comment. (harmless to operation of plugin but gets flagged by A/V software)
* Updated translation file.

## 1.4.7 - 2016-12-09

* Update the settings page for WordPress 4.4. layout changes.

## 1.4.6 - 2015-10-09

* Generate the file cache/.htaccess even when one exists so gzip rules are created and gzipped pages are served correctly. Props Tigertech. https://wordpress.org/support/topic/all-website-pages-downloading-gz-file-after-latest-update?replies=36#post-7494087

## 1.4.5 - 2015-09-25

* Enhancement: Only preload public post types. Props webaware.
* Added an uninstall function that deletes the config file. Deactivate function doesn't delete it any more.
* Possible to deactivate the plugin without visiting the settings page now.
* Fixed the cache rebuild system. Rebuild files now survive longer than the request that generate them.
* Minor optimisations: prune_super_cache() exits immediately if the file doesn't exist. The output of wp_cache_get_cookies_values() is now cached.
* Added PHP pid to the debug log to aid debugging.
* Various small bug fixes.
* Fixed reset of expiry time and GC settings when updating advanced settings.
* Removed CacheMeta class to avoid APC errors. It's not used any more.
* Fixed reset of advanced settings when using "easy" settings page.
* Fixed XSS in settings page.
* Hide cache files when servers display directory indexes.
* Prevent PHP object injection through use of serialize().

## 1.4.4 - 2015-05-15

* Fixed fatal error in output handler if GET parameters present in query. Props webaware.
* Fixed debug log. It wasn't logging the right message.

## 1.4.3 - 2015-04-03

* Security release fixing an XSS bug in the settings page. Props Marc Montpas from Sucuri.
* Added wp_debug_log(). Props Jen Heilemann.
* Minor fixes.

## 1.4.2 - 2014-12-18

* Fixed "acceptable file list".
* Fixed "Don't cache GET requests" feature.
* Maybe fixed "304 not modified" problem for some users.
* Fixed some PHP warnings.

## 1.4.1 - 2014-08-07

* Fixed XSS in settings page. Props Simon Waters, Surevine Limited.
* Fix to object cache so entries may now be deleted when posts updated. (object cache still experimental)
* Documentation updates and cleanup of settings page.

## 1.4 - 2014-04-17

* Replace legacy mfunc/mnclude/dynamic-cached-content functionality with a "wpsc_cachedata" cacheaction filter.
* Added dynamic-cache-test.php plugin example wpsc_cachedata filter plugin.
* Delete post, tag and category cache when a post changes from draft to publish or vice versa. Props @Biranit.
* Update advanced-cache.php and wp-config.php if wp-cache-phase1.php doesn't load, usually happening after migrating to a new hosting service.
* Misc bugfixes.

## 1.3.2 - 2013-08-19

* Any mfunc/mclude/dynamic-cached-content tags in comments are now removed.
* Dynamic cached content feature disabled by default and must be enabled on the Advanced Settings page.
* Support for the mobile theme in Jetpack via helper plugin on script's Plugins tab.

## 1.3.1 - 2013-04-12

* Minor updates to documentation
* Fixed XSS in settings page.

## 1.3 - 2013-04-11

* mfunc tags could be executed in comments. Fixed.
* More support for sites that use the LOGGED_IN_COOKIE constant and custom cookies.

## 1.2 - 2012-12-13

* Garbage collection of old cache files is significantly improved. I added a scheduled job that keeps an eye on things and restarts the job if necessary. Also, if you enable caching from the Easy page garbage collection will be enabled too.
* Editors can delete single cached files from the Toolbar now.
* Fixed the cached page counter on the settings page.
* Some sites that updated to 1.0 experienced too much garbage collection. There are still stragglers out there who haven't upgraded but that's fixed now!
* Supercached mobile files are now used as there was a tiny little typo that needed fixing.
* If your site is in a directory and you saw problems updating a page then that should be fixed now.
* The deactivate hook has been changed so your configuration isn.t hosed when you upgrade. Unfortunately this will only happen after you do this upgrade.
* Some sites use custom cookies with the LOGGED_IN_COOKIE constant. Added support for that.
* Added support for WPTouch Pro, but it appears to be flaky still. Anyone have time to work on that? I don.t.
* Some sites had problems with scheduled posts. For some reason the plugin thought the post was in draft mode and then because it only checked the same post once, when the post magically became published the cache wasn.t cleared. That.s fixed, thanks to the debug logging of several patient users.
* And more bug fixes and translation updates.

## 1.1 - 2012-06-13

* Use $_SERVER[ 'SERVER_NAME' ] to create cache directories.
* Only create blogs cached directories if valid requests and blogs exist.
* Only clear current blog's cache files if navigation menu is modified
* Added clean_post_cache action to clear cache on post actions
* Removed garbage collection details on Contents tab
* Added wp_cache_check_mobile cacheaction filter to shortcircuit mobile device check.
* Don't delete cache files for draft posts
* Added action on wp_trash_post to clear the cache when trashed posts are deleted
* Show a warning when 304 browser caching is disabled (because mod_rewrite caching is on)
* New check for safe mode if using less that PHP 5.3.0
* Added wp_supercache_remove_cookies filter to disable anonymous browsing mode.
* Fixed garbage collection schedule dropdown
* Fixed preload problem clearing site's cache on "page on front" sites.
* Fix for PHP variable not defined warnings
* Fixed problem refreshing cache when comments made as siteurl() sometimes didn't work
* Preloading of taxonomies is now optional
* Domain mapping fixes.
* Better support for https sites. Remove https:// to get cache paths.
* Added AddDefaultCharset .htaccess rule back in and added an option to remove it if required.
* Added multisite plugin that adds a "Cached" column to Network->Sites to disable caching on a per site basis.
* Added WPTouch plugin to modify browser and prefix list in mobile detection code. Added support for that plugin's exclude list.
* Fixed cache tester
* Filter the tags that are used to detect end-of-page using the wp_cache_eof_tags filter.
* Removed debug level from logging as it wasn't helpful.
* Removed mention of wp-minify.

## 1.0 - 2012-01-30

* Removed AddDefaultCharset .htaccess rule
* Fixed problem with blogs in a folder and don't have a trailing slash
* New scheduling of garbage collection
* Added a "Delete cache" link to Toolbar to delete cache of current page.
* Updated documentation
* Sorry Digg, Stephen Fry power now!
* Updated translations
* Preload taxonomies and all post types except revisionsand nav menu items
* Fixed previews by logged in users.
* Added option to make logged in users anonymous
* Use WP 3.0 variables to detect multisite installs
* Hash filenames so files are served from the same CDNs

## 0.9.9.9 - 2011-07-12

* Fixed typo, is_front_page.
* Serve repeated static files from the same CDN hostname.
* Updated translations.
* Make supercache dir lowercase to avoid problems with unicode URLs.
* Add option to skip https loaded static content.
* Remove 5 second check on age of existing cache files. Should help with posts that get lots of comments and traffic.
* Lots of bugs fixed.

## 0.9.9.8 - 2011-01-07

* CDN updates: can be switched off, multiple CNAMEs.
* Uninstall process improved. It removes generated files and fixes edited files.
* Cached dynamic pages can now be stored in Supercache files and compressed.
* 1and1 Webhosting fix (/kunden/)
* Remove log by email functionality as it caused problems for users who were inundated by email
* Many more minor fixes and changes.

## 0.9.9.6 - 2010-09-29

* Fixed problem serving cached files with PHP
* Added support for 304 "file not modified" header to help browser caching. (PHP caching only)
* Added French & German translations, updated Italian translation and fixed translation strings.
* Sleep 4 seconds between preload urls to reduce load on the server
* Updated docs and FAQs.

## 0.9.9.5 - 2010-09-24

* Disable compression on on easy setup page. Still causes problems on some hosts.
* Remove footerlink on easy setup page.
* Don't delete mod_rewrite rules when caching is disabled.
* Don't stop users using settings page when in safe mode.

## 0.9.9.4 - 2010-09-22

* Settings page split into tabbed pages.
* Added new "Easy" settings page for new users.
* New PHP caching mode to serve supercached files.
* Mobile support fixes.
* Added Domain mapping support plugin.
* Added "awaiting moderation" plugin that removes that text from posts.
* Terminology change. Changed "half on" to "legacy caching".
* Fixed cache tester on some installs of WordPress.
* Updated documentation
* Added $wp_super_cache_lock_down config variable to hide lockdown and directly cached pages admin items.
* Preloaded checks if it has stalled and reschedules the job to continue.
* Serve the gzipped page when first cached if the client supports compression.
* Lots more bug fixes..

## 0.9.9.3 - 2010-06-16

* Fixed division by zero error in half on mode.
* Always show "delete cache" button.
* Fixed "Update mod_rewrite rules" button.
* Minor text changes to admin page.

## 0.9.9.2 - 2010-06-15

* Forgot to change version number in wp-cache.php

## 0.9.9.1 - 2010-06-15

* Added preloading of static cache.
* Better mobile plugin support
* .htaccess rules can be updated now. Added wpsc_update_htaccess().
* Fixed "page on front" cache clearing bug.
* Check for wordpress_logged_in cookie so test cookie isn't detected.
* Added clear_post_supercache() to clear supercache for a single post.
* Put quotes around rewrite rules in case paths have spaces.

## 0.9.9 - 2010-02-08

* Added experimental object cache support.
* Added Chinese(Traditional) translation by Pseric.
* Added FAQ on WP-Cache vs Supercache files.
* Use Supercache file if WP-Cache file not found. Useful if mod_rewrite rules are broken or not working.
* Get mobile browser list from WP Mobile Edition if found. Warn user if .htaccess out of date.
* Make sure writer lock is unlocked after writing cache files.
* Added link to developer docs in readme.
* Added Ukranian translation by Vitaly Mylo.
* Added Upgrade Notice section to readme.
* Warn if zlib compression in PHP is enabled.
* Added compression troubleshooting answer. Props Vladimir (http://blog.sjinks.pro/)
* Added Japanese translation by Tai (http://tekapo.com/)
* Updated Italian translation.
* Link to WP Mobile Edition from admin page for mobile support.

## 0.9.8 - 2009-11-18

* Added Spanish translation by Omi.
* Added Italian translation by Gianni Diurno.
* Addded advanced debug code to check front page for category problem. Enable by setting $wp_super_cache_advanced_debug to 1 in the config file.
* Fixed wordpress vs wordpress_logged_in cookie mismatch in cookie checking function.
* Correctly check if WP_CACHE is set or not. PHP is weird.
* Added wp_cache_clear_cache() to clear out cache directory.
* Only show logged in message when debugging enabled.
* Added troubleshooting point 20. PHP vs Apache user.
* Fixed problem deleting cache file.
* Don't delete cache files when moderated comments are deleted.

## 0.9.7 - 2009-10-02

* Fixed problem with blogs in folders.
* Added cache file listing and delete links to admin page.
* Added "Newest Cached Pages" listing in sidebox.
* Made admin page translatable.
* Added "How do I make certain parts of the page stay dynamic?" to FAQ.
* Advanced: added "late init" feature so that plugin activates on "init". Set $wp_super_cache_late_init to true in config file to use.
* Disable supercaching when GET parameters present instead of disabling all caching. Disable on POST (as normal) and preview.
* Fixed problem with cron job and mutex filename.
* Warn users they must enable mobile device support if rewrite rules detected. Better detection of when to warn that .htaccess rules must be updated (no need when rewrite rules not present)
* Advanced: Added "wpsupercache_404" filter. Return true to cache 404 error pages.
* Use the wordpress_test_cookie in the cache key.
* Show correct number of cache files when compression off.
* Fixed problem with PHP safe_mode detection.
* Various bugfixes and documentation updates. See Changelog.txt

## 0.9.6.1 - 2009-07-29

* Move "not logged in" message init below check for POST.
* Add is_admin() check so plugin definitely can't cache the backend.
* Add "do not cache" page type to admin page.

## 0.9.6 - 2009-07-27

* Add uninstall.php uninstall script.
* Updated cache/.htaccess rules (option to upgrade that)
* Added FAQ about category and static homepage problem.
* Add wp_cache_user_agent_is_rejected() back to wp-cache-phase2.php
* Show message for logged in users when caching disable for them.
* Check filemtime on correct supercache file

## 0.9.5 - 2009-07-17

* Show next and last GC times in minutes, not local time.
* Don't serve wp_cache cache files to rejected user agents. Supercache files are still served to them.
* If enabled, mobile support now serves php cached files to mobile clients and static cached files to everyone else.
* Added checks for "WPSC_DISABLE_COMPRESSION" and "WPSC_DISABLE_LOCKING" constants to disable compression and file locking. For hosting companies primarily.
* Added check for DONOTCACHEPAGE constant to avoid caching a page.
* Use PHP_DOCUMENT_ROOT when creating .htaccess if necessary.

## 0.9.4.3 - 2009-04-25

1. Added "Don't cache for logged in users" option.
2. Display file size stats on admin page.
3. Clear the cache when profile page is updated.
4. Don't cache post previews.
5. Added backslashes to rejected URI regex list.
6. Fixed problems with posts and comments not refreshing.

Misc fixes

[1.12.1]: https://github.com/Automattic/wp-super-cache/compare/v1.12.0...v1.12.1
[1.12.0]: https://github.com/Automattic/wp-super-cache/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/Automattic/wp-super-cache/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/Automattic/wp-super-cache/compare/v1.9.4...v1.10.0
[1.9.4]: https://github.com/Automattic/wp-super-cache/compare/v1.9.3...v1.9.4
[1.9.3]: https://github.com/Automattic/wp-super-cache/compare/v1.9.2...v1.9.3
[1.9.2]: https://github.com/Automattic/wp-super-cache/compare/v1.9.1...v1.9.2
[1.9.1]: https://github.com/Automattic/wp-super-cache/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/Automattic/wp-super-cache/compare/v1.8...v1.9
[1.8]: https://github.com/Automattic/wp-super-cache/compare/v1.7.9...v1.8
