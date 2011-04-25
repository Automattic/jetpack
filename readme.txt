=== Jetpack by WordPress.com ===
Contributors: automattic, apeatling, beaulebens, hugobaeta, joen, mdawaffe, skeltoac
Tags: WordPress.com, statistics, stats, views, tweets, twitter, widget, gravatar, hovercards, profile, equations, latex, math, maths, youtube, shortcode, archives, audio, blip, bliptv, dailymotion, digg, flickr, googlevideo, google, kyte, kytetv, livevideo, redlasso, rockyou, scribd, slide, slideshare, soundcloud, vimeo, shortlinks, wp.me
Requires at least: 3.0.5
Tested up to: 3.1
Stable tag: 1.1.2

Supercharge your WordPress site with powerful features previously only available to WordPress.com users.

== Description ==

[Jetpack](http://jetpack.me/) is a WordPress plugin that supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.

For more information, check out [Jetpack.me](http://jetpack.me/).

Features include:

* Simple, concise stats with no additional load on your server.  Previously provided by [WordPress.com Stats](http://wordpress.org/extend/plugins/stats/).
* The [WP.me URL shortener](http://wp.me/sf2B5-shorten).
* Hovercard popups for your commenters via [Gravatar](http://gravatar.com/).
* Easily embedded media from popular sites like YouTube, Digg, and Vimeo.
* For the Math geeks, a simple way to include beautiful mathematical expressions on your site.
* A widget for displaying recent tweets.  Previously provided by [Wickett Twitter Widget](http://wordpress.org/extend/plugins/wickett-twitter-widget/)
* Your readers can easily share your posts via email or their favorite social networks.  Previously provided by the [Sharedaddy](http://wordpress.org/extend/plugins/sharedaddy/) WordPress plugin.
* Your writing will improve thanks to After the Deadline, an artificial intelligence based spell, style, and grammar checker.  Previously provided by the [After the Deadline](http://wordpress.org/extend/plugins/after-the-deadline/) WordPress plugin.
* and *many* more to come!

== Installation ==

1. Install Jetpack either via the WordPress.org plugin directory, or by uploading the files to your server
2. After activating Jetpack by WordPress.com, you will be asked to connect to WordPress.com to enable the Jetpack features.
3. Click the connect button and log in to a WordPress.com account to authorize the Jetpack connection.
4. If you don't yet have a WordPress.com account, you can quickly create one after clicking the connect button.
5. That's it.  You're ready to go!

== Frequently Asked Questions ==

= I already have a WordPress account, but it's not working, what's going on? =

Jetpack requires a connection to [WordPress.com](http://wordpress.com/) to enable all features. This is a different account than the one you use to log into your self-hosted WordPress. If you can log into http://wordpress.com, then you already have a WordPress.com account. If you can't, then you can easily create one as part of the installation of Jetpack.

= How do I view my stats? =

Once you've installed Jetpack, your stats will be available via the "Site Stats" menu which appears in the new Jetpack menu (under your Dashboard menu within WordPress).

= How do I embed media? =

Use [shortcodes](http://support.wordpress.com/shortcodes/) to embed your media.  Currently, Jetpack provides the following shortcodes.

* [[archives]](http://support.wordpress.com/archives-shortcode/)
* [[audio]](http://support.wordpress.com/audio/)
* [[blip.tv]](http://support.wordpress.com/videos/bliptv/)
* [[dailymotion]](http://support.wordpress.com/videos/dailymotion/)
* [[digg]](http://support.wordpress.com/digg/)
* [[flickr]](http://support.wordpress.com/videos/flickr-video/)
* [[googlevideo]](http://support.wordpress.com/videos/google-video/)
* [[polldaddy]](http://support.polldaddy.com/wordpress-shortcodes/)
* [[scribd]](http://support.wordpress.com/scribd/)
* [[slide]](http://support.wordpress.com/slideshows/slide/)
* [[slideshare]](http://support.wordpress.com/slideshows/slideshare/)
* [[soundcloud]](http://support.wordpress.com/audio/soundcloud-audio-player/)
* [[vimeo]](http://support.wordpress.com/videos/vimeo/)
* [[youtube]](http://support.wordpress.com/videos/youtube/)

== Changelog ==

= 1.1.2 =
* Bug Fix: Note, store, and keep fresh the time difference between the Jetpack site's host and the Jetpack servers at WordPress.com.  Should fix all "timestamp is too old" errors.
* Bug Fix: Improve experience on hosts capable of making outgoing HTTPS requests but incapable of verifying SSL certificates. Fixes some "register_http_request_failed", "error setting certificate verify locations", and "error:14090086:lib(20):func(144):reason(134)" errors.
* Bug Fix: Better fallback when WordPress.com is experiencing problems.
* Bug Fix: It's Jetpack, not JetPack :)
* Bug Fix: Remove PHP Warnings/Notices.
* Bug Fix: AtD: JS based XSS bug.  Props markjaquith.
* Bug Fix: AtD: Prevent stored configuration options from becoming corrupted.
* Bug Fix: Stats: Prevent missing old stats for some blogs.
* Bug Fix: Twitter Widget: Fix formatting of dates/times in PHP4.
* Bug Fix: Twitter Widget: Cache the response from Twitter to prevent "Twitter did not respond. Please wait a few minutes and refresh this page." errors.
* Enhancement: Slightly improved RTL experience.  Jetpack 1.2 should include a much better fix.
* Enhancement: Sharedaddy: Improve localization for Facebook Like button.
* Enhancement: Gravatar Hovercards: Improved experience for Windows browsers.

= 1.1.1 =
* Bug Fix: Improve experience on hosts capable of making outgoing HTTPS requests but incapable of verifying SSL certificates. Fixes most "Your Jetpack has a glitch. Connecting this site with WordPress.com is not possible. This usually means your site is not publicly accessible (localhost)." errors.
* Bug Fix: Sharedaddy: Fatal error under PHP4.  Disable on PHP4 hosts.
* Bug Fix: Stats: Fatal error under PHP4.  Rewrite to be PHP4 compatible.
* Bug Fix: Stats: Fatal error on some sites modifying/removing core WordPress user roles.  Add sanity check.
* Bug Fix: Stats: Replace debug output with error message in dashboard widget.
* Bug Fix: Stats: Rework hook priorities so that stats views are always counted even if a plugin (such as Paginated Comments) bails early on template_redirect.
* Bug Fix: Identify the module that connot be activated to fatal error during single module activation.
* Bug Fix: `glob()` is not always available.  Use `opendir()`, `readdir()`, `closedir()`.
* Bug Fix: Send permalink options to Stats Server for improved per post permalink calculation.
* Bug Fix: Do not hide Screen Options and Help links during Jetpack call to connect.
* Bug Fix: Improve readablitiy of text.
* Bug Fix: AtD: Correctly store/display options.
* Enhancement: Output more informative error messages.
* Enhancement: Improve CSS styling.
* Enhancement: Stats: Query all post types and statuses when getting posts for stats reports.
* Enhancement: Improve performance of LaTeX URLs be using cookieless CDN.

= 1.1 =
* Initial release
