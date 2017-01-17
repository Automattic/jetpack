=== Jetpack by WordPress.com ===
Contributors: automattic, adamkheckler, aduth, akirk, allendav, alternatekev, andy, annezazu, apeatling, azaozz, batmoo, barry, beaulebens, blobaugh, cainm, cena, cfinke, chaselivingston, chellycat, csonnek, danielbachhuber, davoraltman, daniloercoli, designsimply, dllh, drawmyface, dsmart, dzver, ebinnion, eliorivero, enej, eoigal, erania-pinnera, ethitter, gcorne, georgestephanis, gibrown, goldsounds, hew, hugobaeta, hypertextranch, iammattthomas, iandunn, jacobshere, jblz, jeherve, jenhooks, jenia, jgs, jkudish, jmdodd, Joen, johnjamesjacoby, jshreve, koke, kraftbj, lamdayap, lancewillett, lschuyler, macmanx, martinremy, matt, matveb, mattwiebe, maverick3x6, mcsf, mdawaffe, michael-arestad, migueluy, mikeyarce, mkaz, nancythanki, nickmomrik, obenland, pento, professor44, rachelsquirrel, rdcoll, ryancowles, richardmuscat, richardmtl, roccotripaldi, samhotchkiss, scarstocea, sdquirk, stephdau, tmoorewp, tyxla, Viper007Bond, westi, yoavf, zinigor
Tags: WordPress.com, jet pack, comments, contact, gallery, performance, sharing, security, shortcodes, stats, subscriptions, widgets
Stable tag: 4.4.2
Requires at least: 4.6
Tested up to: 4.7

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
We have an entire team of happiness engineers ready to help you. Ask your questions in the support forum, or [contact us directly](https://jetpack.com/contact-support).

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

= 4.5 =

* Release date: January 17, 2017
* Release post: http://wp.me/p1moTy-3Kc

This release introduces a brand-new module, Jetpack Ads, a brand-new VideoPress feature, and a lot of new shortcodes and widgets.

**Exciting New Features and Improvements:**

* Generate revenue from your site with an all-new WordAds feature, which when enabled displays high-quality ads for your visitors.
* Today we are proud to release a fully redesigned VideoPress interface for easy uploading, management, and add-free playback of your fantastic videos now fully integrated with your Jetpack Premium or Professional plans.
* Spice up your sidebar with new widgets that display blog stats, author info, "Follow my blog" buttons, and even an event countdown.
* Embed your amazing 360° photos with the VR shortcode
* Link your visitors to your Tumblr or Twitch pages using the new icons in the Social Media Icons Widget.

**Enhancements**

* Use the beautiful Jetpack carousel feature to display single images.
* Turn on and update Related Posts right from the Customizer.
* Customize the output of the Related Posts headline using a new filter.

**Performance and Security Improvements:**

* Your Custom CSS will now be served in a separate stylesheet when it is more than 2,000 characters.
* Your Stats queries are now always being made over HTTPS.
* Holiday Snow files now load in the footer, but rest assured the snow still falls from above.
* We have improved Jetpack's synchronization process to support more plugins and use less resources.
* The jQuery Cycle script used by slideshow galleries is now minified, resulting in faster loading times.

**Slightly Less Exciting Enhancements:**

* The JSON API now allows updating translations and alternative theme installation methods.
* Public Custom Post Types are now automatically available via the WordPress.com REST API.
* We've added a token-based authentication mechanism to the REST API in order for the site to be able to receive authenticated requests from WordPress.com.
* Use `sync` commands in Jetpack's WP CLI.
* You can now set the value for options directly in the Contact Form shortcode.
* Updated some verbiage around IP Whitelisting on the Protect settings screen.
* Custom sharing buttons got some new variables.
* RIP blip.tv — we've removed your shortcode.
* Improved Image and Display Posts Widget settings to provide more explanation and better error messages.
* We've added a few new Content Options to the Customizer for supported themes.
* Improved the Facebook Widget to avoid confusion when editing width and height settings.
* Added and improved a few shortcodes.

**Improved Compatibility:**

* If your server is misconfigured and we can't get an IP address we're going to deactivate Protect and send you a notice so you're in the loop.
* The WPML compatibility file wasn't loading at the right time, but we've fixed that.
* We've improved compatibility with tools like Cavalcade to avoid stuck Cron jobs.
* Some selected WooCommerce data (order items and order item meta) are now syncing to WordPress.com.

**Bug Fixes**

* You'll notice numerous design improvements to the Jetpack UI.
* Accessibility is important to us so we've made some improvements there.
* Missing attachments in the Carousel were causing an infinite loop, but we've corrected that.
* Eliminated a PHP Notice when running the CLI `wp jetpack` command.
* PHP warnings in the Restaurant Menu Post type have seen their last day with us.
* Fixed a bug that displayed the wrong connected user for up to 24 hours after they disconnected.
* Removed a deprecated function to prevent notices when using Infinite Scroll in the Customizer.
* Long titles in Jetpack widgets weren't looking so great, so we cleaned them up.
* Before now you weren't able to create a child category from WordPress.com. Now you can!
* Rogue colons were showing up in the related posts area on sites with the Twenty Fourteen and Twenty Sixteen themes.
* Fixed a ReCaptcha error on the Email sharing button.
* Confirmed Instagram embeds actually load when using Infinite Scroll.
* Site Icons now display on the WordPress.com site management interface.
* Set a default time limit of 30 seconds when sending sync requests via Cron.
* Synchronized supported shortcodes on a site.
* Fixed an issue where empty categories weren't showing with the Widget Visibility feature dropdown.
* Fixed various little bugs when working with multiple widgets in the Customizer and in the Widgets admin screen.
* Added a Translate Widget default title in case you haven't defined one.
* The Top Posts Widget now avoids layout issues when using the Grid layout while displaying a post without an image.

= 4.4.2 =

* Release date: December 6, 2016
* Release post: http://wp.me/p1moTy-3JR

This release improves Jetpack compatibility with WordPress 4.7.

**Compatibility changes**

* Custom CSS: Made the Custom CSS feature of Jetpack compatible with the CSS Customizer editor in WordPress 4.7.
* Sync: improved compatibility with the wp-missed-schedule plugin.

**Bug Fixes**

* Featured Content: made sure there is no infinite loop when removing the featured tag from the tag list.
* Admin: made sure help tabs are not being hidden.
* Admin: made At a Glance page work nicely when there is no backup data yet.
* Sync: now making sure that needed classes are loaded, preventing errors.
* Sync: cleared out unneeded scheduled jobs.

= 4.4.1 =

* Release date: November 22, 2016
* Release post: http://wp.me/p1moTy-3JR

**Bug Fixes**

* Fixed an issue where some users with slower servers would get an error on the Jetpack dashboard when `WP_DEBUG` was enabled.
* Fixed an issue where users on a Jetpack Professional plan who were paying monthly (as opposed to annually) wouldn’t be able to enable SEO Tools.

= 4.4 =

* Release date: November 21, 2016
* Release post: http://wp.me/p1moTy-3FE

**Enhancements**

* Additional unit tests have been added to improve Jetpack's development process and stability.
* Custom post types have been added to the WP REST API output.
* Many of the screenshots throughout the plugin have been replaced by SVGs in order to make Jetpack smaller.
* New endpoints have been added to allow the installation of plugin and theme zip files via the API.
* Twelve new filters to make Jetpack more extensible!  See: http://wp.me/p1moTy-3FE.
* New widget: "Google Translate" to allow users to translate your site into their own language.
* New widget: "My Community" where you can see who recently interacted with your site.
* One of the biggest issues facing Jetpack users for years now has been difficulties in moving sites from one domain name to another. This update makes strides towards improving that process.
* Photon now uses HTTPS by default. Secure all the things!
* There are now helpful hints throughout the admin interface to make Jetpack easier to use.
* We now allow you to embed pins, boards and profiles from Pinterest.
* We've added a new feature: SEO Tools, available to Jetpack Professional subscribers. You can read more about our plans here: https://jetpack.com/features/
* We've made numerous improvements to the data sync process.

**Bug Fixes:**

* Fixed link to Akismet settings.
* Improved compatibility between Infinite Scroll and WPML.
* Move email notification settings back with the other email settings in the Discussion Settings.
* Various minor performance/compatibility fixes.

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

* We’re continuing our efforts to harden Jetpack security, by implementing the `hash_equals()` function to avoid timing attacks when comparing strings. We also improved security on CSVs exported from your contact form.

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
