=== Jetpack by WordPress.com ===
Contributors: automattic, adamkheckler, aduth, akirk, allendav, alternatekev, andy, annezazu, apeatling, azaozz, batmoo, barry, beaulebens, blobaugh, cainm, cena, cfinke, chaselivingston, chellycat, csonnek, danielbachhuber, davoraltman, daniloercoli, designsimply, dllh, drawmyface, dsmart, dzver, ebinnion, eliorivero, enej, eoigal, erania-pinnera, ethitter, gcorne, georgestephanis, gibrown, goldsounds, hew, hugobaeta, hypertextranch, iammattthomas, iandunn, jacobshere, jblz, jeherve, jenhooks, jenia, jgs, jkudish, jmdodd, Joen, johnjamesjacoby, jshreve, koke, kraftbj, lamdayap, lancewillett, lschuyler, macmanx, martinremy, matt, matveb, mattwiebe, maverick3x6, mcsf, mdawaffe, michael-arestad, migueluy, mikeyarce, mkaz, nancythanki, nickmomrik, obenland, pento, professor44, rachelsquirrel, rdcoll, ryancowles, richardmuscat, richardmtl, roccotripaldi, samhotchkiss, scarstocea, sdquirk, stephdau, tmoorewp, Viper007Bond, westi, yoavf, zinigor
Tags: WordPress.com, jet pack, comments, contact, gallery, performance, sharing, security, shortcodes, stats, subscriptions, widgets
Stable tag: 4.3.2
Requires at least: 4.5
Tested up to: 4.6.1

Increase your traffic, view your stats, speed up your site, and protect yourself from hackers with Jetpack.

== Description ==

Jetpack simplifies managing WordPress sites by giving you visitor stats, security services, speeding up images, and helping you get more traffic. Jetpack is a free plugin.

= Traffic Growth & Insights =
Jetpack tells you how many visits your site gets and helps you **get more traffic** with tools like Related Posts, Publicize, Enhanced Distribution, and Sharing.

= Security =
Jetpack **protects your site** against brute force attacks and unauthorised logins. We also monitor your site for downtime and keep your plugins updated.

= Image Performance =
Jetpack automatically **optimizes and speeds up** images using the global WordPress.com content delivery network. This saves you hosting costs by reducing bandwidth.

= Centralized Management =
With Jetpack comes a **centralized dashboard** on WordPress.com. Manage plugins and menus, publish posts, and view enhanced site stats for all of your sites.

= A few more things that our users love =
Jetpack includes other features that help you customize your site including Custom CSS, Contact Forms, Galleries and Carousels, Notifications and Subscriptions, Configurable Widgets, and [many more](https://jetpack.com/features).

= Dedicated Support =
We have an entire team of happiness engineers ready to help you.  Ask your questions in the support forum, or [contact us directly](https://jetpack.com/contact-support).

= Contributing to Jetpack =

Jetpack is open-source and we actively encourage community contributions: whether it's a compliment, bug report, code, or an idea we welcome it with open arms! [Learn about contributing](https://jetpack.com/contribute) or consider [joining our beta program](https://jetpack.com/beta).

== Installation ==

[Install Jetpack from our site](https://jetpack.com/install?from=wporg) by typing in your site address.

Alternatively install Jetpack via the plugin directory, or by uploading the files manually to your server. After activating Jetpack, connect to WordPress.com to enable the Jetpack features.

If you need additional help [read our detailed instructions (including a video walkthrough)](http://jetpack.com/support/installing-jetpack/).


== Frequently Asked Questions ==

= Is Jetpack free? =

Yes! The core features of Jetpack are and always will be free. Jetpack also integrates with paid services like Akismet (anti-spam), VaultPress (backups), and VideoPress (video hosting) but these are not required for Jetpack to function.

= Why do I need a WordPress.com account? =

Many of our core features (like Photon, Stats, and Protect) make use of the WordPress.com cloud. For this to happen Jetpack requires a (free) WordPress.com account. If you don't have one already you can easily create one during Jetpack's connection process.

= I already have a WordPress account, but it's not working. What's going on? =

A WordPress.com account is different to the one you use to log into your self-hosted WordPress. If you can log into https://wordpress.com then you already have a WordPress.com account. If you can't, you can easily create one during Jetpack's connection process.

= How do I view my stats? =

Once you've installed Jetpack your stats will be available via "Site Stats" which appears in the Jetpack menu (under your Dashboard menu within WordPress).

= How do I contribute to Jetpack? =

There are opportunities for developers at all levels to contribute. [Learn more about contributing to Jetpack](https://jetpack.com/contribute) or consider [joining our beta program](https://jetpack.com/beta).


== Screenshots ==

1. Jetpack Dashboard.
2. Site Stats.
3. Plugin Bulk Management.
4. Publicize.
5. Related Posts.

== Changelog ==

= 4.4 =

**Enhancements**

* Brand new SEO Tools module. #5307
* Shortcodes: added Pinterest embeds. #5437
* VideoPress: refreshed admin interface, seamless integration with the core Media manager, tied with Jetpack Plans. #5457

* Admin Page: added a filter to manage if the newly connected user should go to WordPress.com or not. #5319
* Admin Page: added links to pages where users can fix problems with Akismet and update plugins. #5176
* Admin Page: added helpful hints to make Jetpack easier to use. #5479
* Admin Page: redesign Development mode banner. #5186
* Admin Page: removed unnecessarily loaded theme compatibility files. #5454
* Admin Page: when user is non admin, Protect module is inactive and they have no access to Stats, don't break the UI trying to go to At a Glance which isn't accessible by them and instead display Apps tab. #5395
* Admin Page: use SVGs instead of raster images to improve performance. #5419
* Admin Page: improve design when Development mode is active. #5186
* Admin Page: improve contrast for better accessibility. #5236
* Carousel: moved close icon location to the top right. #5237
* Carousel: change the behavior of the browser's back button after closing a gallery. #5168
* Contact Form: add horizontal line between message content and meta data. #5270
* Custom Post Types: added custom posts to the output of the WordPress REST API. #5434
* Custom Post Types: made Nova post markup more flexible by adding new filters. #1542
* Debug Page: add information about Development mode. #5225
* Documentation: Improvements to README.md sections about development workflow and clarification about Node versions required for the build tasks. #5428
* Development: added tests for Jetpack API endpoints for the WordPress REST API. #5310
* Development: added tests for various constants in use by Jetpack. #5350
* General: improve the display of the connection banners to explain to site owners why they should connect to WordPress.com. #5473
* JSON API: add new API endpoint to allow installing a plugin via the API, from a zip file. #5507
* JSON API: add new API endpoint to allow installing a theme via the API. #5537
* JSON API: customize the theme endpoint to allow installing WordPress.com themes. #5392
* Markdown: add new filter to allow site owners to parse content inside shortcodes. #5573
* Photon: now using HTTPS to retrieve images by default. #5534
* Protect: added a filter to skip IP address checking in favor of another security check. #5369
* Publicize: only trigger Publicize for Post Types that support it. #5381
* Related Posts: add posts to the WP REST API Post Response. #3425
* Sharing / Likes: add new filter to customize the heading HTML. #5011
* Sharing: better video tags for Video posts including VideoPress videos. #3853
* Site Icon: added the site icon property to the output of the settings API endpoint. #5282
* SSO: Extend logged in expiration to 1 year. #5259
* Sync: added an API endpoint to examine the current state of scheduled sync jobs. #5324
* Sync: improve synchronization on sites with a custom implementation of Cron.
* Sync: disable Sync via Cron. #5528
* Tests: introduce GUI tests for the React components in Jetpack. #5496
* Tiled Galleries: add filter to override the default Tiled Gallery template files. #5090
* Widgets: new 'My Community' widget displaying people who recently interacted with your site. #3358
* Widgets: new Google Translate widget. #5386
* Widgets: new Flickr option in the Social Media Icons Widget. #5250
* Widgets: new 'WordPress.org' option in the Social Media Icons Widget. #5183
* Widgets: add new `jetpack_top_posts_widget_permalink` filter to the permalinks in Top Posts Widget. #4881
* Widgets: remove title attributes from the Social Media Icons Widget. #5286
* Widget Visibility: add a filter to the get_taxonomies arguments. #5222

**Improved Compatibility:**

* Infinite Scroll: improve compatibility with WPML and language slugs in permalinks. #4953
* Open Graph: add SEO by Squirrly TM to the list of conflicting plugins. #5365
* Sharing: fix conflict between the Email button and the Autoptimize plugin. #5291
* Sync: avoid conflicts with the Photo Gallery plugin. #5412
* Several improvements to avoid issues when cloning / duplicating sites, creating staging sites, or changing your site URL.

**Bug Fixes:**

* Admin Page: fix URL to Akismet Settings. #5332
* Admin Page: do not load unnecessary file on connection page. #5284
* Admin Page: avoid errors when page is loaded by secondary users. #5366
* Admin Page: update the Create Account link from the Admin Page's dashboard to direct the user into a connect screen that asks them to sign up by being aware that the user clicked the Create Account instead of just the connect button. #5382
* Admin Page: for non-admin users, when site is in Dev Mode, a Jetpack link leading to a blank page with a message "Sorry, you are not allowed to access this page." is no longer displayed. #5396
* Admin Page: fix PHP warning when roles allowed to see Stats don't exist or haven't been saved yet. #5432
* Admin Page: fix issue where certain administrative page actions would fail with sites using index permalinks. #5345
* Contact Forms: fixed shortcode properties passing when using do_shortcode. #3188
* Contact Forms: restricted access to feedback posts from the WordPress REST API. #5408
* JSON API: avoid errors when the Sharing module isn't available. #5423
* Likes: move email notification settings back with the other email settings in the Discussion Settings. #4987
* Site Icon: not using a site icon as fallback version if it is too small. #3515
* SSO: remove unnecessary styles for nonexistent profile UI. #5289
* Sitemaps: make sure sitemaps always use absolute paths for images. #5375
* Sync: avoid counting users on very large networks. #5575
* Subscriptions: fix PHP warnings when user subscribes to comments. #4897
* Widgets: fixed Instagram widget minimum width rule to actually use the minimum instead of maximum. #5316

= 4.3.2 =

* Release date: October 13, 2016

**Enhancements**

* Unsaved changes were getting lost when users were navigating away from settings so we put in a confirmation message to prevent this from happening.
* We've stopped counting carousel views in stats by default, you can use the `jetpack_enable_carousel_stats` filter to enable counting them again.
* Stats are now responding faster.
* There were several improvements and repairs made to sync including additional endpoints, performance enhancements, whitelisted data, better decision making around when to sync information, and more.
* Markdown now has a CSS class on footnotes.

**Improved Compatibility:**

* We've improved compatibility with Kinsta by automatically turning on Staging Mode for Jetpack when in a staging environment.

**Bug Fixes:**

* Several fixes have been made to sync to repair issues with Publicize, Notifications, and Subscriptions.
* We removed PHP warnings by checking to make sure json language files like jetpack-en_US.json are readable before we load them.
* We found an unused option in Gravatar Hovercard settings and removed it.
* The correct support link is now being used to make it easier for you to connect with the Jetpack team if you need us.
* The permissions check for plugin information retrieval was fixed as well.
* Some plugins were adding content on outbound http requests causing an infinite loop we fixed this right up.
* We removed some warnings that were occurring when translations didn't exist by adding a fallback.
* We've added Moroccan Arabic translations, and switched to language packs for Croatian, Spanish (Chile) and Greek.
* Sync was running into issues so we've limited dequeue time to 1/3 of PHP's max execution time, which has unclogged the problem.
* We're now sending full and incremental queues separately so that a failure in one doesn't block the other.
* There was a JavaScript enqueuing error with our Sharing feature that has been repaired.
* The Top Posts widget now includes the ability to list attachment (media) pages.
* We weren't building CPT links correctly resulting in bad navigation, which is now fixed.
* We removed the form legend for default Tiled Gallery settings as it doesn't relate.
* With shortcodes we now return early from processing them if no string is passed, as they are required.


= 4.3.1 =

* Release date: September 8, 2016

**Support Enhancements**

* We're now syncing data about hosts so that we can provide better support when needed.
* Minor update to inline docs to match version numbers.

**Bug Fixes:**

* Admin Page: fix error when Admin Page resources could not be fetched with `wp_remote_get` due to unique host configurations.
* Admin Page: fix error when Post By Email could not be enabled when the browser's dev console was enabled.
* Admin Page: make sure all translated strings are encoded properly.
* Admin Page: only use POST requests for updating the state of Jetpack, to avoid issues on servers not allowing PUT requests.
* Admin Page: search icon no longer overlaps the global notices.
* Admin Page: make sure that non-admins can also modify Spellchecking settings.
* General: Improve random number generation for compatibility with more hosts.
* General: Add deprecated PHP file (class.jetpack-landing-page.php) back as an empty file, to avoid generating fatal errors on sites with aggressive caching.
* General: Ensure concatenated CSS is generated for RTL languages.
* Security: Ensure that all options are included on the security tab.
* Stats: fix display for sites with pretty permalinks disabled.
* Subscriptions: ensure that no email is sent when updating a published post.
* Sync: To improve performance, add snapTW to the list of post meta data that won't be synchronized for each post.
* Sync: do not schedule a full sync after each import.
* Verification Tools: in the Settings card, use appropriate link for each service.


= 4.3 =

* Release date: September 6th, 2016

**Exciting Performance and UI Improvements:**

* We have launched the all new React powered interface, a year in the making, designed to give you better control of your favorite Jetpack features.

= 4.2.2 =

* Release date: August 19th, 2016

**Bug Fixes:**

* We fixed the code which displays the Facebook share count to accomodate Facebook's new data structure.
* We fixed an issue which caused PHP notices to get logged for users of the Twenty Fourteen theme.
* We fixed an issue with the Minileven mobile theme which was preventing it from loading.
* Improved Sync performance.
* Increase security by sanitizing a URL used in the SSO process.

= 4.2.1 =

* Release date: August 17th, 2016

**Bug Fixes:**

* We fixed a conflict between Jetpack and W3 Total Cache.
* We fixed some issues with Publicize and Custom Post Types.
* Very large Multisite networks with lots of users can now be synchronized with WordPress.com.
* We improved the synchronization process between your site and WordPress.com.

= 4.2 =

* Release date: August 10th, 2016

**Performance Enhancements:**

* We’ve improved Jetpack’s performance by making calls to the database more efficient; essentially, Jetpack is doing less on each page load, making things faster. #4281, #4316
* We’ve ensured that every feature uses information that is up to date by completely refactoring the way information was synchronized between your site and WordPress.com.
* We've improved the way Jetpack queries for information about features, which results in less overall queries.

**Exciting Feature and UI Improvements:**

* We now track your visitor views of Carousel images in stats.
* You can now customize advanced typographic settings like ligatures in the Custom CSS editor with new support for the `font-feature-settings` property.
* We’ve improved the experience when you don’t actually have enough posts to Infinitely Scroll.
* Our Contact Info Widget allows you to enter a Google Maps API Key which is now required by Google if you want to display a map.

**Security:**

* We’re continuing our efforts to harden Jetpack security, by implementing the `hash_equals()` function to avoid timing attacks when comparing strings.  We also improved security on CSVs exported from your contact form.

**Slightly Less Exciting Feature Improvements:**

* The Cartodb shortcode has been changed to match the new product name, Carto.
* The YouTube shortcode now uses the content width defined by the theme when available, even if an embed size was defined in an old version of WordPress.
* Breadcrumbs now support hierarchical post types and taxonomies.
* We’ve added the Portfolio Post Type to the WordPress.com REST API whitelist.
* There are a few new parameters for the Dailymotion shortcode.

**Improved Compatibility:**

* We now work well with WP Stagecoach staging sites, so you should not see any future impact on production sites.
* We had some PHP notices popping up in the WooCommerce plugin wizard screen, these are gone.

**Bug Fixes:**

* We stopped loading compatibility stylesheets on the default theme's singular views for Infinite Scroll.
* Debug tests forwarded through the contact form in the Jetpack Debug menu are now successfully sent to the support team.
* We’ve removed the PHP notices you might have seen when moderating comments.
* There are no longer PHP notices cropping up when publishing via Cron.
* We’ve fixed the official Sharing buttons so they now line up just right.
* The PHP warnings of Sitemaps stylesheets have been eliminated.
* We’ve done away with the warnings that appeared when Tonesque processes a file which claims to be one filetype, but is actually another.
* We’ve exterminated PHP notices that appeared when using Random Redirect, as well as when the author wasn't set.
