=== Jetpack by WordPress.com ===
Contributors: automattic, adamkheckler, aduth, akirk, allendav, alternatekev, andy, apeatling, azaozz, batmoo, barry, beaulebens, blobaugh, cainm, cfinke, chaselivingston, chellycat, christinepollock, csonnek, danielbachhuber, daniloercoli, designsimply, dllh, dsmart, dzver, ebinnion, eliorivero, enej, eoigal, ethitter, gcorne, georgestephanis, gibrown, goldsounds, hew, hugobaeta, HypertextRanch, iammattthomas, iandunn, jacobshere, jblz, jeherve, jenhooks, jenia, jkudish, jmdodd, Joen, johnjamesjacoby, jshreve, koke, kraftbj, lancewillett, lschuyler, macmanx, martinremy, matt, matveb, mattwiebe, maverick3x6, mcsf, mdawaffe, michaeldcain, michael-arestad, migueluy, mikeyarce, mjangda, mkaz, nancythanki, nickmomrik, obenland, pento, professor44, ryancowles, richardmuscat, richardmtl, roccotripaldi, samhotchkiss, sdquirk, stephdau, tmoorewp, Viper007Bond, westi, yoavf, zinigor
Tags: WordPress.com, jet pack, comments, contact, gallery, performance, sharing, security, shortcodes, stats, subscriptions, widgets
Stable tag: 4.0.3
Requires at least: 4.4
Tested up to: 4.5

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

A WordPress.com account is different to the one you use to log into your self-hosted WordPress. If you can log into http://wordpress.com then you already have a WordPress.com account. If you can't, you can easily create one during Jetpack's connection process.

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

== Upgrade Notice ==
= 4.0.3 =
Jetpack 4.0.3 fixes a critical security issue. Please upgrade immediately.

== Changelog ==
= 4.0.3 =
Release date: May 26th, 2016

* Important security update. Please upgrade immediately.

= 4.0.2 =
Release date: April 21st, 2016

Bug Fix:

* Addresses an issue where Jetpack 4.0 caused a fatal error on sites with specific configurations.

= 4.0 =
Release date: April 20th, 2016

Performance Enhancements:

* Protect: the routine that verifies your site is protected from brute-force attacks got some love and is more efficient.
* Contact Forms: cleaning the database of spam form submission records is more efficient.

Feature Improvements:

* VideoPress: edit your VideoPress shortcode in the editor with a fancy new modal options window.
* Custom Content Types are now classier: a new CSS class on Testimonial featured images — has-testimonial-thumbnail — allows you to customize Jetpack custom post types as you see fit.
* Sharing: social icons are now placed under the "add to cart” singular product views in WooCommerce, making it easier for customers to share your products on social media.
* Theme Tools: search engines will now have an easier time knowing what page they are on, and how that page relates to the other pages in your site hierarchy with improved schema.org microdata for breadcrumbs.
* Widget Visibility: now you can select widgets and when to show or hide them right from custom post type single and archive views.

Jetpack UI Improvements:

* What’s in it for me? We’ve done a better job explaining the benefits of Jetpack and connecting it to WordPress.com.
* Shortcodes: handy links to shortcode documentation convey the types of media you can quickly and safely embed.
* Widgets: As of WordPress 4.5, Jetpack widgets now refresh in the customizer without making you refresh the entire page. Live previews, yes indeed.

Bug Fixes:

* Comments: we fixed a mistake where a comment subscription checkbox appeared on custom post types — despite the fact you couldn’t actually subscribe to those types of comments. Our bad.
* Contact Forms: we fixed a bug where the telephone field (which can only be added manually) rendered incorrectly — breaking some forms in the process.
* General: we blocked direct access to the Jetpack_IXR_Client class which caused fatal PHP errors in some server setups.
* Shortcodes: we removed the frameborder attribute in the YouTube embed code. It was deprecated in HTML 5.
* Unminified responsive-videos.min.js in order to address a false positive virus alert in ClamAV. Expect it to be re-minified in 4.0.3 once we resolve the issue with ClamAV.

= 3.9.6 =
Release date: March 31st, 2016

Bug fix: Shortcodes: fixed incorrect Vimeo embed logic.

= 3.9.5 =
Release date:

This release features several WordPress 4.5 compatibility changes that make several Jetpack features work properly in the Customizer view. Big thanks to @westonruter for contributing the code!

Other enhancements and bug fixes:

* Contact Form: no longer calling the datepicker method if it's not available.
* SSO: settings checkboxes now honor filters and constants that restrict certain sign-in modes.
* Shortcodes: fixed a problem with Gist fetching.
* Shortcodes: fixed invalid HTML5 markup in YouTube embed code.
* Shortcodes: made the Vimeo links work properly in case of multiple mixed uses in one post.

= 3.9.4 =
Release date: March 10th, 2016

Bug fix: Shortcodes: Addresses an issue with embedded Vimeo content

= 3.9.3 =
Release date: Mar 9th, 2016
Release post: http://wp.me/p1moTy-396

Featured:

* Site Logo now supports Custom Logo - a theme tool to be introduced in WordPress 4.5.

Enhancements:

* Carousel: Made the full size image URL use a Photon URL if enabled.
* Comments: Removed an unnecessary redirect by always connecting via HTTPS.
* General: Added new actions that fire before automatic updates.
* Infinite Scroll: Introduced a later filter for settings.
* Infinite Scroll: Removed code that is now redundant due to WordPress Core.
* Markdown: Removed deprecated markup from the output.
* Publicize: Improved handling of featured images in posts.
* Shortcodes: Added houzz.com support.
* Sitemaps: Added a language attribute to the news sitemap.
* Sitemaps: Improved the image retrieval mechanism for posts.
* Widgets: Added new filters in the Top Posts Widget code.
* Widgets: Cleaned up the CSS for the Subscription widget.

Bug Fixes:

* Comments: No longer reloading the page on clicking the reply button.
* Contact Forms: Fixed a fatal error on missing metadata.
* Contact Forms: Fixed message formatting for plaintext email clients.
* Shortcodes: Fixed dimensions of Vimeo embeds in certain cases.
* Shortcodes: Fixed warnings and allowed shorter style Vimeo embeds.
* Shortcodes: Removed alignment markup from feeds for YouTube embeds.
* Sitemaps: Made URLs display properly according to the permalink structure.
* Stats: Fixed non-XHTML-valid markup.
* Widgets: No longer showing errors when adding new instances of the Display Post Widget.

= 3.9.2 =
Release date: Feb 25th, 2016
Release post: http://wp.me/p1moTy-2Ei

Maintenance and Security Release

Featured:

* Beautiful Math: fix XSS vulnerability when parsing LaTeX markup within HTML elements.
* Contact Form: do not save private site credentials in post meta. Thanks to @visualdatasolutions.

Enhancements:

* Contact Info: Added two hooks for adding arbitrary information to the widget.
* Development: Added new possibilities for REST API debugging.
* Embeds: Added Codepen embeds support.
* Embeds: Added Sketchfab embeds support.
* I18n: Added support for translation packages for the Finnish language.
* Markdown: Added a filter to enable skipping processing of developer supplied patterns.
* Related Posts: Added a filter to change heading markup.
* Staging: Added a constant to force staging mode.
* Staging: Added a notice to make staging mode more obvious.
* Top Posts Widget: Added a new `[jetpack_top_posts_widget]` shortcode.

Bug Fixes:

* Custom Post Types: Nova: Fixed a JavaScript bug on adding multiple items.
* Embeds: Allowing embeds from Instagram with a www in an URL.
* General: Fixed untranslated module names on the Settings screen.
* General: Improved module descriptions and fixed misleading or broken links in descriptions.
* General: No more notices on module deprecation on older installations.
* General: Only showing one prompt to enable Photon when uploading several new images.
* Multisite: Fixed a problem with site lists for older WordPress installations.
* OpenGraph: Fixed a bug to properly fallback to a WordPress Site Icon image.
* Photon: Improve performance for images over a secure connection.
* Photon: No longer including links from data attributes.
* Publicize: Fixed problems for en_AU and en_CA locales with Facebook.
* Related Posts: Fixed a notice on certain requests.
* Site Logo: It's no longer possible to choose a non-image.
* Widget Visibility: No longer confusing page IDs and titles in certain cases.

= 3.9.1 =
Release date: Jan 21st, 2016

Bug Fixes:

* General: Addresses a namespacing issue which was causing conflicts on some hosting providers.
* Sitemaps: Added MSM-Sitemap to the list of plugins which, if installed, will prevent Jetpack Sitemaps from being used

= 3.9 =
Release date: Jan 20th, 2016

Featured:

* New sharing button: let users share your content using Skype.
* New "Social Menu" theme tool that uses Genericons to display Social Links.
* Sitemap support for better search engine indexing.

Enhancements:

* Contact Form: Added a new filter that allows you to change the "Required" text.
* General: Hidden archived sites in multisite site list.
* General: Removed several function calls that would be deprecated in WordPress 4.5.
* Infinite Scroll: Added a new filter to check if Infinite Scroll has been triggered.
* Likes: Added a conditional to ensure WordPress 4.5 compatibility.
* Photon: Improved compatibility with responsive images feature added in WordPress 4.4.
* Photon: Now enabled by default on sites using HTTPS.
* REST API: Extended the ability to manage users from WordPress.com.
* REST API: Increased the performance of the plugin update endpoint.
* Responsive Videos: Centering videos when they are wrapped in a centered paragraph.
* Sharing: Added a new filter to customize the default OpenGraph description.
* Shortcodes: Added Wistia oEmbed support.
* Shortcodes: Bandcamp: Added support for new attributes for tracks approved by artists.
* Shortcodes: Improved Medium path format recognition.
* Slideshow: Improved compatibility with older IE versions.
* Staging: Improved staging environment detection.
* Widgets: Added "width" option to the Facebook Page widget.
* Widgets: Added size parameters to tags in Top Posts to avoid warnings.
* Widgets: Introduced major performance and stability improvements to the Display Posts Widget.
* Widgets: Refactored to remove deprecated code patterns.

Bug Fixes:

* AtD: Fixed replacing emojis with images in the text editor in Chrome.
* AtD: Made pre tags be excluded from spell-checking.
* CPT: Not registering Nova if it is already registered.
* Carousel: Fixed a bug where full size images were not always served by Photon.
* Carousel: Reverted a change that broke direct link to carousel image.
* Contact Form: Fixed a CSV export bug with multiple choice questions.
* Contact Form: Fixed notices when creating feedback entries without a contact form.
* General: Fixed a scrolling bug on modal window closing.
* Infinite Scroll: Disabled in the Customizer when previewing a non-active theme.
* Publicize: Fixed notices appearing with bbPress or BuddyPress installed.
* Publicize: Showing options only to users that can change them.
* Related Posts: Fixed incorrect URLs generated for posts.
* Responsive Videos: Fixed warnings in debug mode.
* Shortcodes: Bandcamp: Fixed a problem with large track IDs.
* Shortcodes: Fixed a problem with dynamic Gist embeds.
* Stats: Fixed dashboard widget resize problem.
* Widgets: Added a fallback to English US when a locale isn't supported by Facebook.
* Widgets: Fixed layout for Twenty Sixteen.

= 3.8.2 =
Release date: Dec 17th, 2015
Release post: http://wp.me/p1moTy-26v

Jetpack 3.8.2 is here to squash a few annoying bugs.

Bug Fixes:

* Photon: Fixed a bug where some custom thumbnail image sizes weren't being sized properly.
* Shortcodes: Fixed an incompatibility with how WordPress renders the YouTube shortcode.
* Shortcodes: Tightened up security in the Wufoo shortcode.
* Image Widget: Now shows the caption.
* Fixed typos in inline docs.
* Very minor fixes to: Carousel, Publicize, Google+, and Infinite Scroll.

= 3.8.1 =
Release date: Dec 1st, 2015
Release post: http://wp.me/p1moTy-23V

Jetpack 3.8.1 is here and is fully compatible with WordPress 4.4.

Featured:

* Photon + Responsive Images FTW.
* Fully compatible with Twenty Sixteen.
* More accessibility enhancements.
* Dropped some weight by optimizing Jetpack's plugin images.

Enhancements:

* Comments: filter to allow disabling comments per post type.

Bug Fixes:

* Carousel: Stop page from scrolling to top when Carousel is closed.
* Carousel: Browser compatibility fixes with older version of IE.
* Markdown: Fixed a bug that would strip markdown when saving in "Quick Edit" mode.
* Single Sign On: Fixed login always redirecting to the admin dashboard.
* Subscriptions: Filter to allow per-post emails fixed for use in themes.

= 3.8.0 =
Release date: Nov 4th, 2015
Release post: http://wp.me/p1moTy-1VN

We're happy to introduce Jetpack 3.8, which has significant contributions from the Jetpack community. Read more about it here: http://wp.me/p1moTy-1VN

Feature enhancements:

* New Google+ Badge Widget. Display your profile, page, or community Google+ badge.
* New twitch.tv shortcode embeds. Display a Twitch.tv stream in your posts.
* Accessibility enhancements.
* A handful of new filters to allow further customization of Jetpack.

Other enhancements:

* Carousel: Added support to retrieve image dimensions from an image url.
* Carousel: Simpler algorithm to detect shutter speeds.
* Contact Form: New "Checkbox with Multiple Items" field available in the Contact Form.
* Contact Form: Allow pre-filling form fields with URL parameters.
* Contact Form: Better styling of the emailed form responses.
* Performance: Replaced some custom-built functions with core's native functions.
* Related Posts: New filter to add post classes to post's container class.
* Sharing: New filter to choose if sharing meta box should be shown.
* Sharing: New filter to allow sharing button markup to be editable.
* Sharing: New filter to allow you to specify a custom Facebook app ID.
* Social Media Icons Widget: Added option for YouTube username as well as Channel ID.
* Social Media Icons Widget: Added Google+ icon.
* Social Media Icons Widget: New filter to allow you to add your own social media icons and links.
* Subscriptions: Better errors to your visitors if their subscription sign-up fails.
* Subscriptions: Removed "widget" class from Subs shortcode form.


Bug fixes:

* Carousel: Fixed browser back/forward button behavior.
* Contact Form: Allow the email field to be set to empty when building form in post editor.
* Facebook Likebox Widget: Fixed an issue where some languages were not translating.
* Facebook Likebox Widget: Return a language when none found.
* General: Fixed some minor styling issues in the Jetpack admin areas.
* General: Add missing parameter to the_title filter call.
* General: Prevent scrolling of body when the Jetpack admin modals are opened.
* General: Update doc to reflect that Open Graph filter jetpack_enable_opengraph has been deprecated in favor of jetpack_enable_open_graph.
* Infinite Scroll: Fixed an error that sometimes occurred that would stop posts from loading.
* JSON API: Fixed some undefined notices when publishing a post with the API.
* Open Graph: Fixed bug where facebook description content was sometimes being polluted by a filter.
* Sharing: Use full SSL Pinterest url instead of protocol relative.
* Sharing: Fixed plus signs appearing in tweets shared from iOS.
* Shortcodes: Prefer HTTPS for video embeds to avoid mixed content warnings.
* Subscriptions Widget: Fix HTML Validation error.
* Theme Tools: Check oEmbeds for the presence of a video before adding the responsive videos filter.
* Tiled Galleries: Add image alt attribute if there is a title set. This was breaking some screen reader functionality.

= 3.7.2 =
Release date: September 29th, 2015

* Bug Fix: REST API: Fixed an error when saving drafts and publishing posts

= 3.7.1 =
Release date: September 28th, 2015

* Enhancement: General: Added inline documentation for various filters and functions
* Enhancement: General: Added custom capabilities for module management on multi-site installs
* Enhancement: General: Cleaned up old changelog entries from readme
* Enhancement: General: Cleaned up unused i18n textdomains
* Enhancement: General: Updated the new settings page to look better in various translations
* Enhancement: REST API: Added new endpoints to manage users
* Enhancement: Sharing: Updated the Google logo
* Bug Fix: Carousel: Page scroll no longer disappears after closing the carousel
* Bug Fix: Contact Form: Fields are sent and displayed in the correct order
* Bug Fix: Contact Form: No longer showing a notice on AJAX actions in feedback lists
* Bug Fix: Contact Form: Made using more than two notification emails possible
* Bug Fix: Contact Form: Mitigate a potential stored XSS vulnerability. Thanks to Marc-Alexandre Montpas (Sucuri)
* Bug Fix: General: Mitigate a potential information disclosure. Thanks to Jaime Delgado Horna
* Bug Fix: General: Fixed a locale error in the notifications popout
* Bug Fix: General: Fixed a possible fatal error in the client area
* Bug Fix: General: Fixed compatibility issues with certain use cases
* Bug Fix: General: Disabled connection warnings for multisites with domain mapping
* Bug Fix: General: Updated translations for correct link display in admin notices
* Bug Fix: REST API: Fixed a fatal error in one of the endpoints
* Bug Fix: Sharing: Fixed OpenGraph tags for Instagram embeds
* Bug Fix: Sharing: Fixed compatibility issues with bbPress
* Bug Fix: Widget Visibility: Fixed a fatal error in case of a missing tag

= 3.7.0 =
Release date: September 9th, 2015

Feature Enhancements:

* New admin page interface to easily configure Jetpack
* Added staging site support for testing a connected Jetpack site

Additional changes:

* Enhancement: CLI: Added a possibility to change all options with confirmation for some of them
* Enhancement: Gallery: Added filters to allow new gallery types to be declared
* Enhancement: General: Added inline documentation for actions, filters, etc.
* Enhancement: General: Changed class variable declarations keyword from var to public
* Enhancement: General: Made the Settings page module toggle buttons more accessible
* Enhancement: General: The admin bar now loads new notifications popout
* Enhancement: General: Renamed some modules to avoid redundant prefixes
* Enhancement: General: Switched to the WordPress Core's spinner image
* Enhancement: General: Updated the bot list
* Enhancement: Manage: Added the ability to activate a network-wide plugin on a single site from WordPress.com
* Enhancement: Photon: Added a way to check image URLs against custom domains
* Enhancement: Photon: Added prompts on the media upload page telling the user about Photon
* Enhancement: Publicize: Added width and height values to OpenGraph tags for default images
* Enhancement: Related Posts: Added a filter to allow disabling nofollow
* Enhancement: REST API: Added new API endpoints to extend API functionality
* Enhancement: REST API: Added new fields to existing API endpoints
* Enhancement: Sharing: Added a possibility to opt-out of sharing for a single post
* Enhancement: Sharing: Added bbPress support
* Enhancement: Sharing: Added more configuration to the Likes modal
* Enhancement: Sharing: Made the reddit button open a new tab
* Enhancement: Sharing: Removed unused files
* Enhancement: Shortcodes: Added auto embed option inside comments
* Enhancement: Shortcodes: Added autohide parameter to the YouTube shortcode
* Enhancement: Subscriptions: added an action that triggers at the end of the subscription process
* Enhancement: VideoPress: Videos are now embedded using a new player
* Enhancement: Widget Visibility: Added parent page logic
* Enhancement: Widget Visibility: Added support for split terms
* Enhancement: Widgets: Added actions to the Social Media widget
* Enhancement: Widgets: Switched the Display Posts widget to the new API version
* Bug Fix: General: Fixed scrolling to top after modal window closing
* Bug Fix: Infinite Scroll: Added a check for cases when output buffering is disabled
* Bug Fix: Infinite Scroll: Added translation to the copyright message
* Bug Fix: Manage: Fixed automatic update synchronization on WordPress multisite network admin
* Bug Fix: Manage: Redirects back to WordPress.com are allowed from the customizer view
* Bug Fix: Media: Fixed duplicate images bug in the Media Extractor
* Bug Fix: Publicize: Made it possible to remove previously set message
* Bug Fix: Sharing: Added a thumbnail image to OpenGraph tags on pages with DailyMotion embeds
* Bug Fix: Sharing: Fixed Twitter Cards tags escaping
* Bug Fix: Sharing: Made OpenGraph tags for title and description use proper punctuation
* Bug Fix: Sharing: Made sure Likes can be disabled on the front page
* Bug Fix: Shortcodes: Fixed Facebook embeds by placing the script in the footer
* Bug Fix: Shortcodes: Fixed PollDaddy shortcode issues over SSL connections
* Bug Fix: Shortcodes: Made responsive video wrappers only wrap video embeds
* Bug Fix: Shortcodes: Made SoundCloud accept percents for dimensions
* Bug Fix: Social Links: Fixed a possible conflict with another class
* Bug Fix: Stats: Made sure the Stats URL is always escaped properly
