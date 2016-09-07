=== Jetpack by WordPress.com ===
Contributors: automattic, adamkheckler, aduth, akirk, allendav, alternatekev, andy, annezazu, apeatling, azaozz, batmoo, barry, beaulebens, blobaugh, cainm, cena, cfinke, chaselivingston, chellycat, csonnek, danielbachhuber, davoraltman, daniloercoli, designsimply, dllh, drawmyface, dsmart, dzver, ebinnion, eliorivero, enej, eoigal, ethitter, gcorne, georgestephanis, gibrown, goldsounds, hew, hugobaeta, hypertextranch, iammattthomas, iandunn, jacobshere, jblz, jeherve, jenhooks, jenia, jgs, jkudish, jmdodd, Joen, johnjamesjacoby, jshreve, koke, kraftbj, lamdayap, lancewillett, lschuyler, macmanx, martinremy, matt, matveb, mattwiebe, maverick3x6, mcsf, mdawaffe, michael-arestad, migueluy, mikeyarce, mkaz, nancythanki, nickmomrik, obenland, pento, professor44, rachelsquirrel, rdcoll, ryancowles, richardmuscat, richardmtl, roccotripaldi, samhotchkiss, scarstocea, sdquirk, stefmattana, stephdau, tmoorewp, Viper007Bond, westi, yoavf, zinigor
Tags: WordPress.com, jet pack, comments, contact, gallery, performance, sharing, security, shortcodes, stats, subscriptions, widgets
Stable tag: 4.3
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

= 4.3.1 =

* Release date: September 7, 2016

**Support Enhancements**

* We're now syncing data about hosts so that we can provide better support when needed.
* Minor update to inline docs to match version numbers.

**Bug Fixes:**

* Admin Page: fix error when Admin Page resources could not be fetched with `wp_remote_get` due to unique host configurations.
* Admin Page: fix error when Post By Email could not be enabled when the browser's dev console was enabled.
* Admin Page: make sure all translated strings are encoded properly.
* Admin Page: only use POST requests for updating the state of Jetpack, to avoid issues on servers not allowing PUT requests.
* General: Improve random number generation for compatibility with more hosts.
* General: Add deprecated PHP file (class.jetpack-landing-page.php) back as an empty file, to avoid generating fatal errors on sites with aggressive caching.
* General: Ensure concatenated CSS is generated for RTL languages.
* Security: Ensure that all options are included on the security tab.
* Stats: fix display for sites with pretty permalinks disabled.
* Subscriptions: ensure that no email is sent when updating a published post.
* Sync: To improve performance, add snapTW to the list of post meta data that won't be synchronized for each post.
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

