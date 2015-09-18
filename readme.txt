=== Jetpack by WordPress.com ===
Contributors: automattic, alternatekev, andy, apeatling, azaozz, barry, beaulebens, blobaugh, cfinke, chellycat, danielbachhuber, daniloercoli, designsimply, dsmart, eoigal, ethitter, gibrown, georgestephanis, hew, hugobaeta, iammattthomas, jblz, jeherve, jkudish, Joen, johnjamesjacoby, jshreve, kraftbj, lancewillett, martinremy, matt, matveb, maverick3x6, mcsf, mdawaffe, migueluy, nickmomrik, obenland, pento, professor44, richardmtl, roccotripaldi, samhotchkiss, sdquirk, stephdau, tmoorewp, Viper007Bond, westi, yoavf, zinigor
Tags: WordPress.com, jet pack, comments, contact, gallery, performance, sharing, security, shortcodes, stats, subscriptions, widgets
Stable tag: 3.7
Requires at least: 4.2
Tested up to: 4.3

Your WordPress, Streamlined.

== Description ==

[Jetpack](http://jetpack.me/) adds powerful features previously only available to WordPress.com users including customization, traffic, mobile, content, and performance tools.

**Features include:**

* **Customization.** Make your WordPress site uniquely yours with *Custom CSS*, *Carousels*, spam-free *Contact Forms*, *Sidebar Widgets*, *Infinite Scroll*, and *Tiled Galleries*.
* **Mobile theme.** Instant and customizable lightweight responsive theme designed for phones and tablets.
* **Content tools.** Create and publish richer content with *Post by Email*, *Shortcode Embeds*, *Markdown*, *Beautiful Math*, *Spelling*, and *VideoPress*.
* **Visitor engagement.** Increase your traffic and keep visitors coming back with *Enhanced Distribution*, spam-free *Comments*, *Shortlinks*, *Likes*, *Notifications*, *Related Posts*, *Publicize*, *Social Sharing*, *Subscriptions*, and *Site Verification Tools*.
* **Site performance.** Speed up image delivery with the *Photon CDN* and access to visitor *Stats*.
* **Security.** Keep your WordPress site up, safe, and protected with *Single Sign On*, *Jetpack Monitor*, and *Akismet* anti-spam.

**Our users love:**

* Simple, concise stats with no additional load on your server.
* Email subscriptions for your blog's posts and your post's comments.
* Social networking enabled comment system.
* Likes, allowing your readers to show their appreciation of your posts.
* Monitor and manage your site's activity with Notifications.
* Simple, Akismet-backed contact forms.
* The WP.me URL shortener.
* Hovercard popups for your commenters via Gravatar.
* Easily embedded media from popular sites like YouTube, Digg, and Vimeo.
* The ability to post to your blog from any email client.
* Integration with social networks including Twitter, Facebook, Tumblr, Path, and LinkedIn.
* For the Math geeks, a simple way to include beautiful mathematical expressions.
* A widget for displaying recent tweets.
* Your readers can easily share your posts via email or their favorite social networks.
* Improved writing thanks to an AI-based spell, style, and grammar checker.
* Turn WordPress  galleries into a gorgeous full-screen photo browsing experience.
* A CSS editor that lets you customize your site design without modifying your theme.
* A mobile theme that automatically streamlines your site for visitors on mobile devices.
* Mobile push notifications for new comments via WordPress mobile apps.
* Allowing applications to securely authenticate and access your site with your permission.
* Creative formats for your image galleries: mosaic, circles, squares, and a slideshow view.
* Add post sliders and other highlights to your theme with Featured Content.
* Omnisearch: Search posts, pages, comments, media, and plugins from one search box.
* Configure widgets to appear only on certain pages.
* Upload and insert videos into your posts thanks to VideoPress.
* Link WordPress and your Google+ Profile to add multiple Google features to your site.
* Sign in to your self-hosted WordPress site using your WordPress.com account.
* Receive alerts the moment that site downtime is detected.

**New features**
We're always improving Jetpack based on your feedback and WordPress development. [Subscribe to our mailing list](http://jetpack.me/coming-soon/) to get notified of new developments.



== Installation ==

1. Install Jetpack either via the WordPress.org plugin directory, or by uploading the files to your server.
2. After activating Jetpack, connect to WordPress.com to enable the Jetpack features.
3. Click the Connect button and log in to a WordPress.com account to authorize the Jetpack connection.
4. If you don't yet have a WordPress.com account, you can quickly create one after clicking the Connect button.
5. That's it.  You're ready to go!

If you need additional help [read our detailed instructions, including a video walkthrough](http://jetpack.me/support/installing-jetpack/).


== Frequently Asked Questions ==

= I already have a WordPress account, but it's not working, what's going on? =

Jetpack requires a connection to [WordPress.com](http://wordpress.com/) to enable all features. This is a different account than the one you use to log into your self-hosted WordPress. If you can log into http://wordpress.com, then you already have a WordPress.com account. If you can't, then you can easily create one as part of the installation of Jetpack.

= How do I view my stats? =

Once you've installed Jetpack, your stats will be available via the "Site Stats" menu which appears in the new Jetpack menu (under your Dashboard menu within WordPress).

= How do I contribute to Jetpack? =

Easy! There are opportunities for developers at all levels to contribute:

* Join our Beta Test group.
* Give us a hand answering questions in our [support forum](http://wordpress.org/support/plugin/jetpack).
* Report bugs, with reproduction steps, or post patches on [GitHub](https://github.com/Automattic/Jetpack).

Learn more (and get detailed instructions) in our [contribute guide](http://jetpack.me/contribute/).

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

