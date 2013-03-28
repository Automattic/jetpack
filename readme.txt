=== Jetpack by WordPress.com ===
Contributors: automattic, alternatekev, andy, apeatling, azaozz, barry, beaulebens, cfinke, chellycat, danielbachhuber, daniloercoli, designsimply, eoigal, ethitter, gibrown, hew, hugobaeta, iammattthomas, jblz, jeherve, Joen, johnjamesjacoby, jshreve, lancewillett, martinremy, matt, matveb, mdawaffe, nickmomrik, pento, stephdau, tmoorewp, viper007bond, westi, yoavf
Tags: WordPress.com, statistics, stats, views, tweets, twitter, widget, gravatar, hovercards, profile, equations, latex, math, maths, youtube, shortcode, archives, audio, blip, bliptv, dailymotion, digg, flickr, googlevideo, google, googlemaps, kyte, kytetv, livevideo, redlasso, rockyou, rss, scribd, slide, slideshare, soundcloud, vimeo, shortlinks, wp.me, subscriptions, notifications, notes, json, api, rest, mosaic, gallery, slideshow
Requires at least: 3.3
Tested up to: 3.5
Stable tag: 2.2.1

Supercharge your WordPress site with powerful features previously only available to WordPress.com users.

== Description ==

[Jetpack](http://jetpack.me/) is a WordPress plugin that supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.

For more information, check out [Jetpack.me](http://jetpack.me/).

Features include:

* Simple, concise stats with no additional load on your server.  Previously provided by [WordPress.com Stats](http://wordpress.org/extend/plugins/stats/).
* Email subscriptions for your blog's posts and your post's comments.
* Social networking enabled comment system.
* Likes, allowing your readers to show their appreciation of your posts.
* Monitor and manage your site's activity with Notifications in your Toolbar and on WordPress.com.
* Simple, Akismet-backed contact forms.
* The [WP.me URL shortener](http://wp.me/sf2B5-shorten).
* Hovercard popups for your commenters via [Gravatar](http://gravatar.com/).
* Easily embedded media from popular sites like YouTube, Digg, and Vimeo.
* The ability to post to your blog from any email client.
* Integration with and automatic posting to your favorite social networks including Twitter, Facebook, Tumblr, and LinkedIn.
* For the Math geeks, a simple way to include beautiful mathematical expressions on your site.
* A widget for displaying recent tweets.  Previously provided by [Wickett Twitter Widget](http://wordpress.org/extend/plugins/wickett-twitter-widget/)
* Your readers can easily share your posts via email or their favorite social networks.  Previously provided by the [Sharedaddy](http://wordpress.org/extend/plugins/sharedaddy/) WordPress plugin.
* Your writing will improve thanks to After the Deadline, an artificial intelligence based spell, style, and grammar checker.  Previously provided by the [After the Deadline](http://wordpress.org/extend/plugins/after-the-deadline/) WordPress plugin.
* With Carousel active, any standard WordPress galleries you have embedded in posts or pages will launch a gorgeous full-screen photo browsing experience with comments and EXIF metadata.
* A CSS editor that lets you customize your site design without modifying your theme.
* A mobile theme that automatically streamlines your site for visitors on mobile devices.
* Mobile push notifications for new comments via WordPress mobile apps.
* The ability to allow applications to securely authenticate and access your site with your permission.
* Creative formats for your image galleries: mosaic, circles, squares, and a slideshow view.
* and *many* more to come!

Note: The stats portion of Jetpack uses Quantcast to enhance its data.

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
* [[googlemaps]](http://en.support.wordpress.com/google-maps/)
* [[googlevideo]](http://support.wordpress.com/videos/google-video/)
* [[polldaddy]](http://support.polldaddy.com/wordpress-shortcodes/)
* [[scribd]](http://support.wordpress.com/scribd/)
* [[slideshare]](http://support.wordpress.com/slideshows/slideshare/)
* [[soundcloud]](http://support.wordpress.com/audio/soundcloud-audio-player/)
* [[videopress]](http://support.wordpress.com/videopress/)
* [[vimeo]](http://support.wordpress.com/videos/vimeo/)
* [[youtube]](http://support.wordpress.com/videos/youtube/)

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

= 2.2.1 =
* Enhancement: Development Mode: Define the `JETPACK_DEV_DEBUG` constant to `true` to enable an offline mode for localhost development. Only modules that don't require a WordPress.com connection can be enabled in this mode.
* Enhancement: Likes: Added the number of likes to the wp-admin/edit.php screens.
* Enhancement: Mobile Theme - design refresh
* Enhancement: Shortcodes - Add a filter to the shortcode loading section so that a plugin can override what Jetpack loads for shortcodes
* Enhancement: Widgets - Filter Jetpack's widgets so that a plugin can control which widgets get loaded
* Bug Fix: Comments - Add in a wrapper div with id='commentform'
* Bug Fix: Contact Form - Added date field with datepicker
* Bug Fix: Contact Form - Allowed non-text widgets to use contact forms by running their output through the widget_text filter 
* Bug Fix: Custom CSS - Allowing color values to be defined multiple times
* Bug Fix: Custom CSS - Dynamically loading the correct CSS/LESS/SCSS mode for the CSS editor if the user changes the preprocessor
* Bug Fix: Custom CSS - Using the unminified worker CSS
* Bug Fix: Custom CSS - Added rule: reminder about using .custom-background on body selector 
* Bug Fix: Custom CSS - Modified rule: Removed portion of overqualification rule that deems 'a.foo' overqualified if there are no other 'a' rules
* Bug Fix: Custom CSS - Ensuring that the editor and the textarea behind it are using the same font so that the cursor appears in the correct location
* Bug Fix: Custom CSS - Fix a bug that caused some sites to always ignore the base theme's CSS when in preview mode
* Bug Fix: Custom CSS - Run stripslashes() before passing CSS to save()
* Bug Fix: Custom CSS - Moving inline CSS and JavaScript into external files
* Bug Fix: Infinite Scroll - Use the `is_main_query()` function and query method
* Bug Fix: Infinite Scroll - Remove unused styles and an unnecessary margin setting
* Bug Fix: Infinite Scroll - Allow the query used with IS to be filtered, so IS can be applied to a new query within a page template
* Bug Fix: JSON API - Catch the 'User cannot view password protected post' error from can_view_post and bypass it for likes actions if the user has the password entered
* Bug Fix: Likes - Bump cache buster, Don't show likes for password protected posts
* Bug Fix: Notifications - Remove a redundant span closing tag
* Bug Fix: Photon - If an image is already served from Photon but the anchor tag that surrounds it hasn't had its `href` value rewritten to use Photon, do so. Accounts for WP galleries whose individual items are linked to the original image files
* Bug Fix: Publicize - Allows GLOBAL_CAP to be filtered, Adds an AYS to connection deletion, UI improvement for MP6 (and in general)
* Bug Fix: Sharedaddy - Fire the sharing redirect earlier for increased plugin compatibility
* Bug Fix: Stats - Move the display:none CSS output to wp_head so it gets written inside the HEAD tag if the option to hide the stats smilie is active
* Bug Fix: Tiled Galleries - A more descriptive name for the default gallery type
* Bug Fix: Tiled Galleries - Hide the Columns setting for gallery types that don't support it
* Bug Fix: Run the admin_menu action late so that plugins hooking into it get a chance to run
* Bug Fix: Prophylactic strict equality check

= 2.2 =
* Enhancement: Likes: Allow your readers to show their appreciation of your posts.
* Enhancement: Shortcodes: SoundCloud: Update to version 2.3 of the SoundCloud plugin (HTML5 default player, various fixes).
* Enhancement: Shortcodes: Subscriptions: Add a shortcode to enable placement of a subscription signup form in a post or page.
* Enhancement: Sharedaddy: Allow selecting multiple images from a post using the Pinterest share button.
* Enhancement: Contact Form: Allow feedbacks to be marked spam in bulk.
* Enhancement: Widgets: Readmill Widget: Give your visitors a link to send your book to their Readmill library.
* Note: Notifications: Discontinue support for Internet Explorer 7 and below.
* Bug Fix: JSON API: Fix authorization problems that some users were experiencing.
* Bug Fix: JSON API: Sticky posts were not being sorted correctly in /posts requests.
* Bug Fix: Stats: sync stats_options so server has roles array needed for view_stats cap check.
* Bug Fix: Infinite Scroll: Display improvements.
* Bug Fix: Infinite Scroll: WordPress compatibility fixes.
* Bug Fix: Photon: Only rewrite iamge urls if the URL is compatible with Photon.
* Bug Fix: Photon: Account for registered image sizes with one or more dimesions set to zero.
* Bug Fix: Subscriptions: Make HTML markup more valid.
* Bug Fix: Subscriptions: Fixed notices displayed in debug mode.
* Bug Fix: Custom CSS: CSS warnings and errors should now work in environments where JavaScript is concatenated or otherwise modified before being served.
* Bug Fix: Hovercards: WordPress compatibility fixes.
* Bug Fix: Improved image handling for the Sharing and Publicize modules.
* Bug Fix: Carousel: Display and Scrollbar fixes.
* Bug Fix: Tiled Galleries: Restrict images in tiled galleries from being set larger than their containers.
* Bug Fix: Widgets: Gravatar Profile: CSS fixes.
* Bug Fix: Publicize: Strip HTML comments from the data we send to the third party services.
* Bug Fix: Notifications: Dropped support for IE7 and below in the notifications menu.
* Bug Fix: Custom CSS Editor: Allow custom themes to save CSS more easily.
* Bug Fix: Infinite Scroll: Waits until the DOM is ready before loading the scrolling code.
* Bug Fix: Mobile Theme: If the user has disabled the custom header text color, show the default black header text color.
* Bug Fix: Mobile Theme: Fix for the "View Full Site" link.
* Bug Fix: Mobile Theme: Use a filter to modify the output of wp_title().
* Bug Fix: Publicize: Twitter: Re-enable character count turning red when more than 140 characters are typed.

= 2.1.2 =
* Enhancement: Infinite Scroll: Introduce filters for Infinite Scroll.
* Enhancement: Shortcodes: TED shortcode.
* Bug Fix: Carousel: Make sure to use large image sizes.
* Bug Fix: Carousel: Clicking the back button in your browser after exiting a carousel gallery brings you back to the gallery.
* Bug Fix: Carousel: Fix a scrollbar issue.
* Bug Fix: Comments: Move the get_avatar() function out of the base class.
* Bug Fix: Contact Form: Prevent the form from displaying i18n characters.
* Bug Fix: Contact Form: Remove the !important CSS rule.
* Bug Fix: Infinite Scroll: Main query arguments are not respected when using default permalink.
* Bug Fix: JSON API: Trap 'wp_die' for new comments and image uploads.
* Bug Fix: JSON API: Use a better array key for the user_ID.
* Bug Fix: JSON API: Make the class instantiable only once, but multi-use.
* Bug Fix: JSON API: Fix lookup of pages by page slug.
* Bug Fix: JSON API: Updates for post likes.
* Bug Fix: Mobile Theme: Remove Android download link for BB10 and Playbook.
* Bug Fix: Open Graph: Stop using Loop functions to get post data for meta tags.
* Bug Fix: Photon: Suppress and check for warnings when pasing_url and using it.
* Bug Fix: Photon: Ensure full image size can be used.
* Bug Fix: Photon: Resolve Photon / YouTube embed conflict.
* Bug Fix: Photon: Fix dimension parsing from URLs.
* Bug Fix: Photon: Make sure that width/height atts are greater than zero.
* Bug Fix: Sharedaddy: Layout fixes for share buttons.
* Bug Fix: Sharedaddy: Always send Facebook a language locale.
* Bug Fix: Sharedaddy: Don't look up share counts for empty URLs.
* Bug Fix: Shortcodes: Ensure that images don't overflow their containers in the slideshow shortcode.
* Bug Fix: Shortcodes: only enqueue jquery if archive supports Infinite Scroll in the Audio Shortcode.
* Bug Fix: Tiled Galleries: Use a more specific class for gallery item size to avoid conflicts.
* Bug Fix: Tiled Galleries: Fixing scrolling issue when tapping on a Tiled Gallery on Android.
* Bug Fix: Widgets: Gravatar profile widget typo.
* Bug Fix: Widgets: Add (Jetpack) to widget titles.
* Bug Fix: Widgets: Twitter wasn't wrapping links in the t.co shortener.
* Bug Fix: Widgets: Facebook Likebox updates to handling the language locale.
* Bug Fix: Widgets: Top Posts: Fixed a WP_DEBUG notice.
* Bug Fix: Widgets: Gravatar Profile Widget: transient names must be less than 45 characters long.
* Bug Fix: typo in delete_post_action function.
* Bug Fix: Load rendered LaTeX image on same protocol as its page.


= 2.1.1 =
* Bug Fix: Fix for an error appearing for blogs updating from Jetpack 1.9.2 or earlier to 2.1.

= 2.1 =
* Enhancement: Tiled Galleries: Show off your photos with cool mosaic galleries.
* Enhancement: Slideshow gallery type: Display any gallery as a slideshow.
* Enhancement: Custom CSS: Allow zoom property.
* Enhancement: Stats: Show WordPress.com subscribers in stats.
* Bug Fix: Fix errors shown after connecting Jetpack to WordPress.com.
* Bug Fix: Photon: Fix bug causing errors to be shown in some posts.
* Bug Fix: Photon: Convert all images in posts when Photon is active.
* Bug Fix: Infinite Scroll: Improved compatibility with the other modules.
* Bug Fix: Custom CSS: Updated editor to fix missing file errors.
* Bug Fix: Publicize: Don't show the Facebook profile option if this is a Page-only account.
* Bug Fix: Photon: A fix for photos appearing shrunken if they didn't load quickly enough.
* Bug Fix: Sharing: A compatibility fix for posts that only have partial featured image data.
* Bug Fix: Publicize/Sharing: For sites without a static homepage, don't set the OpenGraph url value to the first post permalink.
* Bug Fix: Mobile Theme: Better compatibility with the customizer on mobile devices.
* Bug Fix: Sharing: Don't show sharing options on front page if that option is turned off.
* Bug Fix: Contact Form: Fix PHP warning shown when adding a Contact Form in WordPress 3.5.
* Bug Fix: Photon: Handle images with relative paths.
* Bug Fix: Contact Form: Fix compatibility with the Shortcode Embeds module.


= 2.0.4 =
* Bug Fix: Open Graph: Correct a bug that prevents Jetpack from being activated if the SharePress plugin isn't installed.

= 2.0.3 =
* Enhancement: Infinite Scroll: support [VideoPress](http://wordpress.org/extend/plugins/video/) plugin.
* Enhancement: Photon: Apply to all images retrieved from the Media Library.
* Enhancement: Photon: Retina image support.
* Enhancement: Custom CSS: Refined editor interface.
* Enhancement: Custom CSS: Support [Sass](http://sass-lang.com/) and [LESS](http://lesscss.org/) with built-in preprocessors.
* Enhancement: Open Graph: Better checks for other plugins that may be loading Open Graph tags to prevent Jetpack from doubling meta tag output.
* Bug Fix: Infinite Scroll: Respect relative image dimensions.
* Bug Fix: Photon: Detect custom-cropped images and use those with Photon, rather than trying to use the original.
* Bug Fix: Custom CSS: Fix for bug preventing @import from working with url()-style URLs.

= 2.0.2 =
* Bug Fix: Remove an erroneous PHP short open tag with the full tag to correct fatal errors under certain PHP configurations.

= 2.0.1 =
* Enhancement: Photon: Support for the [Lazy Load](http://wordpress.org/extend/plugins/lazy-load/) plugin.
* Bug Fix: Photon: Fix warped images with un- or under-specified dimensions.
* Bug Fix: Photon: Fix warped images with pre-photonized URLs; don't try to photonize them twice.
* Bug Fix: Infinite Scroll: Check a child theme's parent theme for infinite scroll support.
* Bug Fix: Infinite Scroll: Correct a bug with archives that resulted in posts appearing on archives that they didn't belong on.
* Bug Fix: Publicize: Send the correct shortlink to Twitter (et al.) if your site uses a shortener other than wp.me.
* Bug Fix: Sharing: Improved theme compatibility for the Google+ button.
* Bug Fix: Notifications: Use locally-installed Javascript libraries if available.

= 2.0 =
* Enhancement: Publicize: Connect your site to popular social networks and automatically share new posts with your friends.
* Enhancement: Post By Email: Publish posts to your blog directly from your personal email account.
* Enhancement: Photon: Images served through the global WordPress.com cloud.
* Enhancement: Infinite Scroll: Better/faster browsing by pulling the next set of posts into view automatically when the reader approaches the bottom of the page.
* Enhancement: Open Graph: Provides more detailed information about your posts to social networks.
* Enhancement: JSON API: New parameters for creating and viewing posts.
* Enhancement: Improved compatibility for the upcoming WordPress 3.5.
* Bug Fix: Sharing: When you set your sharing buttons to use icon, text, or icon + text mode, the Google+ button will display accordingly.
* Bug Fix: Gravatar Profile Widget: Allow basic HTML to be displayed.
* Bug Fix: Twitter Widget: Error handling fixes.
* Bug Fix: Sharing: Improved theme compatibility
* Bug Fix: JSON API: Fixed error when creating some posts in some versions of PHP.

= 1.9.2 =
* Bug Fix: Only sync options on upgrade once.

= 1.9.1 =
* Enhancement: Notifications feature is enabled for logged-out users when the module is active & the toolbar is shown by another plugin.
* Bug Fix: Use proper CDN addresses to avoid SSL cert issues.
* Bug Fix: Prioritize syncing comments over deleting comments on WordPress.com. Fixes comment notifications marked as spam appearing to be trashed.

= 1.9 =
* Enhancement: Notifications: Display Notifications in the toolbar and support reply/moderation of comment notifications.
* Enhancement: Mobile Push Notifications: Added support for mobile push notifications of new comments for users that linked their accounts to WordPress.com accounts.
* Enhancement: JSON API: Allows applications to send API requests via WordPress.com (see [the docs](http://developer.wordpress.com/docs/api/) )
* Enhancement: Sync: Modules (that require the data) sync full Post/Comment to ensure consistent data on WP.com (eg Stats)
* Enhancement: Sync: Improve syncing of site options to WP.com
* Enhancement: Sync: Sync attachment parents to WP.com
* Enhancement: Sync: Add signing of WP.com user ids for Jetpack Comments
* Enhancement: Sync: Mark and obfuscate private posts.
* Enhancement: Privacy: Default disable enhanced-distribution and json-api modules if site appears to be private.
* Enhancement: Custom CSS: allow applying Custom CSS to mobile theme.
* Enhancement: Sharing: On HTTPS pageloads, load as much of the sharing embeds as possible from HTTPS URLs.
* Enhancement: Contact Form: Overhaul of the contact form code to fix incompatibilites with other plugins.
* Bug Fix: Only allow users with manage_options permission to enable/disable modules
* Bug Fix: Custom CSS: allow '/' in media query units; e.g. (-o-min-device-pixel-ratio: 3/2)
* Bug Fix: Custom CSS: leave comments alone in CSS when editing but minify on the frontend
* Bug Fix: Sharing: Keep "more" pane open so Google+ Button isn't obscured
* Bug Fix: Carousel: Make sure the original size is used, even when it is exceedingly large.
* Bug Fix: Exclude iPad from Twitter on iPhone mobile browsing
* Bug Fix: Sync: On .org user role changes synchronize the change to .com
* Bug Fix: Contact Form: Fix a bug where some web hosts would reject mail from the contact form due to email address spoofing.

= 1.8.3 =
* Bug Fix: Subscriptions: Fix a bug where subscriptions were not being sent from the blog.
* Bug Fix: Twitter: Fix a bug where the Twitter username was being saved as blank.
* Bug Fix: Fix a bug where Contact Form notification emails were not being sent.

= 1.8.2 =
* Bug Fix: Subscriptions: Fix a bug where subscriptions were not sent for posts and comments written by some authors.
* Bug Fix: Widgets: Fix CSS that was uglifying some themes (like P2).
* Bug Fix: Widgets: Improve Top Posts and Pages styling.
* Bug Fix: Custom CSS: Make the default "Welcome" message translatable.
* Bug Fix: Fix Lithuanian translation.

= 1.8.1 =
* Bug Fix: Stats: Fixed a bug preventing some users from viewing stats.
* Bug Fix: Mobile Theme: Fixed some disabled toolbar buttons.
* Bug Fix: Top Posts widget: Fixed a bug preventing the usage of the Top Posts widget.
* Bug Fix: Mobile Theme: Fixed a bug that broke some sites when the Subscriptions module was not enabled and the Mobile Theme module was enabled.
* Bug Fix: Mobile Theme: Made mobile app promos in the Mobile Theme footer opt-in.
* Bug Fix: Twitter Widget: A fix to prevent malware warnings.
* Bug Fix: Mobile Theme: Fixed a bug that caused errors for some users with custom header images.

= 1.8 =
* Enhancement: Mobile Theme: Automatically serve a slimmed down version of your site to users on mobile devices.
* Enhancement: Multiuser: Allow multiple users to link their accounts to WordPress.com accounts.
* Enhancement: Custom CSS: Added support for object-fit, object-position, transition, and filter properties.
* Enhancement: Twitter Widget: Added Follow button
* Enhancement: Widgets: Added Top Posts and Pages widget
* Enhancement: Mobile Push Notifications: Added support for mobile push notifications on new comments.
* Enhancement: VideoPress: Shortcodes now support the HD option, for default HD playback.
* Bug Fix: Twitter Widget: Fixed tweet permalinks in the Twitter widget
* Bug Fix: Custom CSS: @import rules and external images are no longer stripped out of custom CSS
* Bug Fix: Custom CSS: Fixed warnings and notices displayed in debug mode
* Bug Fix: Sharing: Fixed double-encoding of image URLs
* Bug Fix: Sharing: Fix Google +1 button HTML validation issues (again :))
* Bug Fix: Gravatar Profile Widget: Reduce size of header margins

= 1.7 =
* Enhancement: CSS Editor: Customize your site's design without modifying your theme.
* Enhancement: Comments: Submit the comment within the iframe.  No more full page load to jetpack.wordpress.com.
* Enhancement: Sharing: Share counts for Twitter, Facebook, LinkedIn
* Enhancement: Sharing: Improve styling
* Enhancement: Sharing: Add support for ReCaptcha
* Enhancement: Sharing: Better extensability through filters
* Enhancement: Widgets: Twitter: Attempt to reduce errors by storing a long lasting copy of the data. Thanks, kareldonk :)
* Regression Fix: Sharing: Properly store and display the sharing label option's default value.
* Bug Fix: Contact Form: remove worse-than-useless nonce.
* Bug Fix: Subscriptions: remove worse-than-useless nonce.
* Bug Fix: Sharing: Don't show sharing buttons twice on attachment pages.
* Bug Fix: Sharing: Increase width of Spanish Like button for Facebook.
* Bug Fix: Sharing: Use the correct URL to the throbber.
* Bug Fix: Stats: Fix notice about undefined variable $alt
* Bug Fix: Subscriptions: Make Subscriptions module obey the settings of the Settngs -> Discussion checkboxes for Follow Blog/Comments
* Bug Fix: Shortcodes: VideoPress: Compatibility with the latest version of VideoPress
* Bug Fix: Shortcodes: Audio: Include JS File for HTML5 audio player
* Bug Fix: Hovercards: Improve cache handling.
* Bug Fix: Widgets: Gravatar Profle: Correctly display service icons in edge cases.
* Bug Fix: Widgets: Gravatar Profle: Prevent ugly "flash" of too-large image when page first loads on some sites
* Bug Fix: Carousel: CSS Compatibility with more themes.

= 1.6.1 =
* Bug Fix: Prevent Fatal error under certain conditions in sharing module
* Bug Fix: Add cachebuster to sharing.css
* Bug Fix: Disable via for Twitter until more robust code is in place

= 1.6 =
* Enhancement: Carousel: Better image resolution selection based on available width/height.
* Enhancement: Carousel: Load image caption, metadata, comments, et alii when a slide is clicked to switch to instead of waiting.
* Enhancement: Carousel: Added a "Comment" button and handling to scroll to and focus on comment textarea.
* Enhancement: Widgets: Facebook Likebox now supports a height parameter and a better width parameter.
* Enhancement: Widgets: Better feedback when widgets are not set up properly.
* Enhancement: Shortcodes: Google Maps shortcode now supports percentages in the width.
* Enhancement: Shortcodes: Update Polldaddy shortcode for more efficient Javascript libraries.
* Enhancement: Shortcodes: Youtube shortcode now has playlist support.
* Enhancement: Add Gravatar Profile widget.
* Enhancement: Update Sharedaddy to latest version, including Pinterest support.
* Enhancement: Retinize Jetpack and much of WordPress.
* Bug Fix: Shortcodes: Fix Audio shortcode color parameter and rename encoding function.
* Bug Fix: Shortcodes: Don't output HTML 5 version of the Audio shortcode because of a bug with Google Reader.
* Bug Fix: Jetpack Comments: Don't overlead the addComments object if it doesn't exist. Fixes spacing issue with comment form.
* Bug Fix: Contact Form: If send_to_editor() exists, use it. Fixes an IE9 text area issue.

= 1.5 =
* Enhancement: Add Gallery Carousel feature
* Note: the Carousel module bundles http://fgnass.github.com/spin.js/ (MIT license)

= 1.4.2 =
* Bug Fix: Jetpack Comments: Add alternative Javascript event listener for Internet 8 users.
* Enhancement: Remove more PHP 4 backwards-compatible code (WordPress andJetpack only support PHP 5).
* Enhancement: Remove more WordPress 3.1 and under backwards-compatible code.

= 1.4.1 =
* Bug Fix: Jetpack Comments / Subscriptions: Add checkboxes and logic control for the Subscription checkboxes.

= 1.4 =
* Enhancement: Add Jetpack Comments feature.
* Bug Fix: Sharing: Make the sharing_label translatable.
* Bug Fix: Sharing: Fixed the file type on the LinkedIn graphic.
* Bug Fix: Sharing: Fixes for the Faceboox Like button language locales.
* Bug Fix: Sharing: Updates for the "more" button when used with touch screen devices.
* Bug Fix: Sharing: Properly scope the More button so that multiple More buttons on a page behave properly.
* Bug Fix: Shortcodes: Update the YouTube and Audio shortcodes to better handle spaces in the URLs.
* Bug Fix: Shortcodes: Make the YouTube shortcode respect embed settings in Settings -> Media when appropriate.
* Bug Fix: Shortcodes: Removed the Slide.com shortcode; Slide.com no longer exists.
* Bug Fix: Shortcodes: Match both http and https links in the [googlemaps] shortcode.
* Bug Fix: After the Deadline: Code clean up and removal of inconsistencies.

= 1.3.4 =
* Bug Fix: Revert changes to the top level menu that are causing problems.

= 1.3.3 =
* Bug Fix: Fix notices caused by last update

= 1.3.2 =
* Bug Fix: Fix Jetpack menu so that Akismet and VaultPress submenus show up.

= 1.3.1 =
* Enhancement: Add a new widget, the Facebook Likebox
* Bug Fix: Sharing: Sharing buttons can now be used on custom post types.
* Bug Fix: Contact Forms: Make Contact Forms widget shortcode less aggressive about the shortcodes it converts.
* Bug Fix: Ensure contact forms are parsed correctly in text widgets.
* Bug Fix: Connection notices now only appear on the Dashboard and plugin page.
* Bug Fix: Connection notices are now dismissable if Jetpack is not network activated.
* Bug Fix: Subscriptions: Fix an issue that was causing errors with new BuddyPress forum posts.

= 1.3 =
* Enhancement: Add Contact Forms feature.  Formerly Grunion Contact Forms.
* Bug Fix: Tweak YouTube autoembedder to catch more YouTube URLs.
* Bug Fix: Correctly load the Sharing CSS files.

= 1.2.4 =
* Bug Fix: Fix rare bug with static front pages

= 1.2.3 =
* Enhancement: Twitter Widget: Expand t.co URLs
* Bug Fix: Various PHP Notices.
* Bug Fix: WordPress Deprecated `add_contextual_help()` notices
* Bug Fix: Don't display unimportant DB errors when processing Jetpack nonces
* Bug Fix: Correctly sync data during certain MultiSite cases.
* Bug Fix: Stats: Allow sparkline img to load even when there is a DB upgrade.
* Bug Fix: Stats: Replace "loading title" with post title regardless of type and status.
* Bug Fix: Stats: Avoid edge case infinite redirect for `show_on_front=page` sites where the `home_url()` conatins uppercase letters.
* Bug Fix: Subscriptions: Don't send subscriptions if the feature is turned off in Jetpack.
* Bug Fix: Subscriptions: Fix pagination of subscribers.
* Bug Fix: Subscriptions: Sync data about categories/tags as well to improve subscription emails.
* Bug Fix: Subscriptions: Better styling for the subscription success message.
* Bug Fix: Shortcodes: Support for multiple Google Maps in one post.  Support for all Google Maps URLs.
* Bug Fix: Shortcodes: Improved support for youtu.be URLs
* Bug Fix: Shortcodes: Improved Vimeo embeds.
* Bug Fix: Sharing: Switch to the 20px version of Google's +1 button for consistency.
* Bug Fix: Sharing: Fix Google +1 button HTML validation issues.
* Bug Fix: Sharing: Disable sharing buttons during preview.
* Bug Fix: Spelling and Grammar: Properly handle proofreading settings.
* Bug Fix: Spelling and Grammar: Don't prevent post save when proofreading service is unavailable.

= 1.2.2 =
* Bug Fix: Ensure expected modules get reactivated correctly during upgrade.
* Bug Fix: Don't send subscription request during spam comment submission.
* Bug Fix: Increased theme compatibility for subscriptions.
* Bug Fix: Remove reference to unused background image.

= 1.2.1 =
* Bug Fix: Ensure Site Stats menu item is accessible.
* Bug Fix: Fixed errors displayed during some upgrades.
* Bug Fix: Fix inaccurate new modules "bubble" in menu for some upgrades.
* Bug Fix: Fix VaultPress detection.
* Bug Fix: Fix link to http://jetpack.me/faq/

= 1.2 =
* Enhancement: Add Subscriptions: Subscribe to site's posts and posts' comments.
* Enhancement: Add Google Maps shortcode.
* Enhancement: Add Image Widget.
* Enhancement: Add RSS Links Widget.
* Enhancement: Stats: More responsive stats dashboard.
* Enhancement: Shortcodes: Google Maps, VideoPress
* Enhancement: Sharing: Google+, LinkedIn
* Enhancement: Enhanced Distribution: Added Jetpack blogs to http://en.wordpress.com/firehose/
* Bug Fix: Spelling and Grammar: WordPress 3.3 compatibility.
* Bug Fix: Translatable module names/descriptinos.
* Bug Fix: Correctly detect host's ability to make outgoing HTTPS requests.

= 1.1.3 =
* Bug Fix: Increase compatibility with WordPress 3.2's new `wp_remote_request()` API.
* Bug Fix: Increase compatibility with Admin Bar.
* Bug Fix: Stats: Improved performance when creating new posts.
* Bug Fix: Twitter Widget: Fix PHP Notice.
* Bug Fix: Sharedaddy: Fix PHP Warning.
* Enhancement: AtD: Add spellcheck button to Distraction Free Writing screen.
* Translations: Added: Bosnian, Danish, German, Finnish, Galician, Croatian, Indonesian,  Macedonian, Norwegian (Bokmål), Russian, Slovak, Serbian, Swedish
* Translations: Updated: Spanish, French, Italian, Japanese, Brazilian Portuguese, Portuguese

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
