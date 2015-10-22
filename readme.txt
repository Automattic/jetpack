=== Jetpack by WordPress.com ===
Contributors: automattic, aduth, akirk, allendav, alternatekev, andy, apeatling, azaozz, barry, beaulebens, blobaugh, cfinke, chellycat, ChrissiePollock, csonnek, danielbachhuber, daniloercoli, designsimply, dllh, dsmart, dzver, ebinnion, enej, eoigal, ethitter, gcorne, gedex, georgestephanis, gibrown, hew, hugobaeta, iammattthomas, iandunn, jasmussen, jblz, jeffgolenski, jeherve, jessefriedman, jkudish, jmdodd, Joen, johnjamesjacoby, jshreve, koke, kraftbj, lancewillett, martinremy, matt, matveb, mattwiebe, maverick3x6, mcsf, mdawaffe, michaeldcain, MichaelArestad, migueluy, mikeyarce, mjangda, mkaz, mtias, nickmomrik, obenland, paulschreiber, pento, professor44, rase-, RCowles, richardmuscat, richardmtl, roccotripaldi, samhotchkiss, sdquirk, stephdau, tmoorewp, Viper007Bond, westi, xyu, yoavf, zinigor
Tags: WordPress.com, jet pack, comments, contact, gallery, performance, sharing, security, shortcodes, stats, subscriptions, widgets
Stable tag: 3.7.2
Requires at least: 4.2
Tested up to: 4.3.1

Your WordPress, Simplified.

== Description ==

Jetpack simplifies managing WordPress sites by giving you visitor stats, security services, speeding up images photos, and helping you get more traffic. Jetpack is a free plugin.

= Traffic Growth & Insights =
Jetpack tells you how many visits your site gets and helps you **get more traffic** with tools like Related Posts, Publicize, Enhanced Distribution, and Sharing.

= Security =
Jetpack **protects your site** against brute force attacks and unauthorised logins. We also monitor your site for downtime and keep your plugins updated.

= Image Performance =
Jetpack automatically **optimizes and speeds up** images using the global WordPress.com content delivery network. This saves you hosting costs by reducing bandwidth.

= Centralized Management =
With Jetpack comes a **centralized dashboard** on WordPress.com. Manage plugins and menus, publish posts, and view enhanced site stats for all of your sites.

= A few more things that our users love =
Jetpack includes other features that help you customize your site including Custom CSS, Contact Forms, Galleries and Carousels, Notifications and Subscriptions, Configurable Widgets, and [many more](https://jetpack.me/features).

= Dedicated Support =
We have an entire team of happiness engineers ready to help you.  Ask your questions in the support forum, or [contact us directly](https://jetpack.me/contact-support).

= Contributing to Jetpack =

Jetpack is open-source and we actively encourage community contributions: whether it's a compliment, complaint, code, or an idea we welcome it with open arms! [Learn about contributing](https://jetpack.me/contribute) or consider [joining our beta program](https://jetpack.me/beta).

== Installation ==

[Install Jetpack from our site](https://jetpack.me/install?from=wporg) by simply typing in your site address. 

Alternatively you can install Jetpack via the WordPress.org plugin directory, or by uploading the files manually to your server. After activating Jetpack, connect to WordPress.com to enable the Jetpack features.

If you need additional help [read our detailed instructions (including a video walkthrough)](http://jetpack.me/support/installing-jetpack/).


== Frequently Asked Questions ==

= Is Jetpack free? =

Yes! The core features of Jetpack are and always will be free. Jetpack also integrates with paid services like Akismet (anti-spam), VaultPress (backups), and VideoPress (video hosting) but these are not required for Jetpack to function.

= Why do I need a WordPress.com account? =

Many of our core features (like Photon, Stats, and Protect) make use of the WordPress.com cloud. For this to happen Jeptack requires your site to be linked to a (free) WordPress.com account. If you don't have a WordPress.com account already, you can easily create one during the connection process. 

= I already have a WordPress account, but it's not working, what's going on? =

A WordPress.com account is a different account to the one you use to log into your self-hosted WordPress. If you can log into http://wordpress.com, then you already have a WordPress.com account. If you can't, then you can easily create one as part of the installation of Jetpack.

= How do I view my stats? =

Once you've installed Jetpack, your stats will be available via the "Site Stats" menu which appears in the new Jetpack menu (under your Dashboard menu within WordPress).

= How do I contribute to Jetpack? =

There are opportunities for developers at all levels to contribute. [Learn more about contributing to Jetpack](https://jetpack.me/contribute) or consider [joining our beta program](https://jetpack.me/beta).


== Screenshots ==

1. Stats chart.
2. Sharing buttons.
3. Subscriptions widget.
4. Gravatar Hovercards settings.
5. Spelling and Grammar demo.
6. Gallery Carousel.
7. CSS Editor
8. Mobile Theme

== Changelog ==
= 3.8.0 =
Release date: Nov 4th, 2015
Release Post:

3.8 Brings a few new features to your Jetpack site:

* New Sidebar Widget: Google+ Badge Widget. Display a beautiful G+ Person, Page, or Community badge in your sidebar.
* New Shortcode: Twitch.vs.  We've taken the twitch.tv shortcode from WordPress.com and incorporated it into Jetpack!

And a few more ways to customize it:

* Sharing: Filter whether to display the Sharing Meta Box or not.
* Related Posts: Filter the post css classes added on HTML markup.
* Social Media Icon Widget: Filter the icons
* Sharing: Filter the App ID used in the official Facebook Share button.

Full List of Changes:


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
* Bug Fix: Shortcodes: Fixed Facebook embeds by placing the scipt in the footer
* Bug Fix: Shortcodes: Fixed PollDaddy shortcode issues over SSL connections
* Bug Fix: Shortcodes: Made responsive video wrappers only wrap video embeds
* Bug Fix: Shortcodes: Made SoundCloud accept percents for dimensions
* Bug Fix: Social Links: Fixed a possible conflict with another class
* Bug Fix: Stats: Made sure the Stats URL is always escaped properly
