## 3.9

### Sitemaps

That's a brand new module! Once you activate it, 2 sitemaps will be generated and will be available at `/sitemap.xml` and `news-sitemap.xml`. To test:

- Make sure the sitemap isn't generated if your site is private.
- Make sure the module isn't automatically enabled if you already use a Sitemap plugin.
- Make sure the sitemaps work regardless of your permalink structure.
- Check the posts included in both sitemaps.

### Carousel

- Revert change that broke direct link to carousel image. To test, open the Carousel view, copy the URL from your browser bar, and reload that URL in a different tab. Carousel view should open for that specific image.
- Full Carousel images are now served by Photon again.

### Contact Form

- Fix notices when creating feedback entries without a contact form. Steps to reproduce the issue are available [here](https://github.com/Automattic/jetpack/issues/3115).
- CSV export option now handles multiple options questions in forms. To test, create a contact form with multiple questions, and questions with multiple options. See if you can then export submitted forms via the Feedback menu.
- New filter: `jetpack_required_field_text` allows you to change the "Required" text. To test, use a code snippet like this one:
```php
function jeherve_custom_required() {
	return 'this is important';
}
add_filter( 'jetpack_required_field_text', 'jeherve_custom_required' );
```

### General

We've added New Just In Time messages to promote WordPress.com new interface. To test:
- Message appearing in Media > Add New when Photon is inactive.
- Message appearing in Posts > Add New and Pages > Add New.
- Message appearing in Posts > Add New, in the image insert modal, when Photon is disabled, before you publish a post.
- Message about Stats, appearing in Posts > Add New and Pages > Add New, after publishing a post.
- Message appearing in Dashboard > Updates, if auto updates are allowed on the site and if Manage is disabled.
- Message appearing in the Plugins menu, after activating one or more plugins, if auto updates are allowed on the site, if the plugin is in the W.org repo, and if the plugin is already set to autoupdate on WordPress.com via Manage.

For each scenario, check the link in the message, to make sure it's correct. Make sure you can activate modules from the message when the option is available. Also check that when dismissing one message, all the others disappear as well.

- Multisite: hide archived sites in Network > Jetpack > Sites. To test, make sure no archived sites are displayed on this page.


### Likes

- Add conditional for `is_comments_popup` as 4.5 deprecates it. Test it by enabling Likes on a site running WordPress trunk and `WP_DEBUG` set to true.

### Manage

- New endpoints for user management. To test, go to [wordpress.com/people/](https://wordpress.com/people/) and try to search, edit, and delete users on your site. It's worth testing things on both Multisite and single installations.
- Update plugin installation process. To test, ensure you can use WordPress.com to install plugins to your site.

### Photon

We've made several changes to improve compatibility with WP 4.4. All images should now be parsed by Photon, and should not generate any notices when `WP_DEBUG` is set. To test:

- set your theme to call `the_post_thumbnail( array( 800, 800 ) )` using an array for the size that happens to be larger than the original image (say 500 x 500 for this example). Make sure the image is still displayed properly.
- Enable Twenty Sixteen and make sure all images use Photon, and all `scrset` image values are correct (you can check this with your browser inspector).
- Create a new image size in your theme by adding the following to your theme's functions.php: `add_image_size( 'jetpack-test-featured-thumbnail', 405, 405, true );`. Then output the image in your theme, with `the_post_thumbnail( 'jetpack-test-featured-thumbnail' );`. Create a new post, and use an old image from your Media Library as Featured Image. In your post, the returned image should fit within 400x400, using Photon, with the current values on both the `img` tag and the resize string in the Photon URL.
- You can also test several variations with different slider plugins activated.

- Photon is now enabled by default on sites using HTTPS. In the past, you had to add `add_filter( 'jetpack_photon_reject_https', '__return_false' );` for images served with HTTPS to be cached by Photon. You don't need that snippet anymore.

### Publicize

- Show Publicize options only to roles that can publish posts. To test, log in with a subscriber or contributor and make sure Publicize options are not displayed in Posts > Add New.
- Fix notices appearing on Publicize settings screen when bbPress or BuddyPress are installed.

### Related Posts

- Fix incorrect condition for Related Posts exclusions. To test, make sure that when clicking on a Related Post, no `&relatedposts_exclude=undefined` is added to the URL of the related post.

### Sharing

- New Sharing button: Skype. To test, go to Settings > Sharing and enable the new Skype service. Try switching between button styles to make sure the button is displayed properly regardless of the button style, and try using the button.
- The new `jetpack_open_graph_fallback_description` filter allows you to change the default Open Graph description, "Visit the post for more".

### Shortcodes

- Bandcamp: Switch to `esc_attr` instead of `int` for IDs, to allow for large track IDs. Try using very large track IDs like the ones from [this artist](https://renaudgabrielpion.bandcamp.com/album/voices-in-a-room).
- Bandcamp: add support for `tracks` and `esig` attributes. The 2 attributes are only available to approved artists, but general testing of the [Bandcamp shortcode](https://en.support.wordpress.com/audio/bandcamp/) should help.
- Medium: Improve URL path type matching. The list of possible URL formats is available [here](https://github.com/Automattic/jetpack/pull/3063).
- Slideshow: better detection of older versions of IE. Try viewing a post with a slideshow in IE8, IE9, and IE11.
- Add new Wistia oEmbed. To test, try inserting Wistia URLs into your posts. An example would be `http://automattic-2.wistia.com/medias/mqf9c9147u?embedType=iframe&videoWidth=320`

### Spellchecking

- Exclude `pre` tags from spellchecking. To test, add some code inside `pre` tags, including text that would trigger the spellchecker. Once you've done so, click on the "proofread" button and make sure content inside the `pre` tags is ignored.
- Do not replace emoji by `img` tags when using the spellchecker. Testing instructions can be found [here]
(https://github.com/Automattic/jetpack/issues/3220).

### Stats

- Fix Stats Dashboard widget when resizing stats chart in the browser. To test, check the Stats dashboard widget, and resize your browser. You can test in as many browsers as possible.

### Theme Tools

- Custom Content Types: do not register Nova CPT if it's already registered.
- Infinite Scroll: disable in the Customizer when previewing a non-active theme.
- Infinite Scroll: the new `infinite_scroll_got_infinity` filter allows you to filter the parameter used to check if Infinite Scroll has been triggered.
- Responsive Videos: center videos when it's wrapped in a centered paragraph. To test, enable a theme using Responsive Videos, like Sapor, and create a new post with a YouTube video, wrapped in a centered paragraph. Make sure the video is centered on all devices.
- Responsive Videos: fix [warning](https://github.com/Automattic/jetpack/issues/3048) appearing when `WP_DEBUG` was set to `true`. To test, enable `WP_DEBUG` on your site, switch to a theme that supports Responsive Videos like Sapor, and view posts including videos.
- Social Menu: this new theme tool adds a "Social Menu" menu location if your theme includes `add_theme_support( 'jetpack-social-menu' );`. The menu then uses Genericons to display Social Links, much like in Twenty Sixteen.


### Widgets

- Facebook Like Box: add "Width" option.
- Facebook Like Box: fallback to English US when a locale isn't supported by Facebook (e.g. Australian).
- Top Posts: add size parameters to `img` tag to avoid warnings on performance tests. To test, make sure the widget is still displayed properly on your site, when using one of the Top Posts widget layouts including images.
- Top Posts: layout fixes for Twenty Sixteen. To test, add a Top Posts widget using images to a site running Twenty Sixteen, and make sure the layout looks as shown [here](https://github.com/Automattic/jetpack/pull/3239).
- Image Widget: refactor to remove `extract()`. To test, try editing existing image widget options, and create new image widgets. All options must be saved properly, and applied on the site's frontend.
- Display Posts Widget: speed and stability improvements. To test, check if your existing Display Posts widgets still display posts from third-party Jetpack or WordPress.com sites, and try creating new widgets and see if everything works as expected, regardless of the widget settings.

------------------

# Past Releases

## 3.8.1

### WordPress 4.4 Compatibility

If you're running a WordPress 4.4 beta, or trunk, please test out the following:

- Photon + Responsive images:
Make sure your images are playing nicely with Responsive Images when Photon is active.  Look for image distortion, strange cropping, or Photon/srcset simply not working.

- Twenty Sixteen theme:
Activate the 2016 theme and look for any strangeness with Jetpack features.  Pay special attention to these features:
	- Gallery Widget
	- Sharing & Likes buttons should not be shown on custom excerpts
	- Infinite scroll

### Other testing

- Subscriptions filter:
Add `add_filter( 'jetpack_allow_per_post_subscriptions', '__return_true' );` to your theme's functions.php. You should see this when writing up a new post: https://cloudup.com/czXrr6ni5GX

- General styling with Jetpack admin messages
- We've made some changes to the heading structures with our admin notices to improve accessibility. Toggle some modules, connect/disconnect your site, trigger some errors. Let us know if anything looks off in regards to the message styles.

- Comments filter: filter to allow disabling Jetpack comments per post type.
This filter, when applied, should revert WordPress to its comment behaviour as it would have been without Jetpack.
`add_filter( 'jetpack_comment_form_enabled_for_page', '__return_false');`

- Carousel: don't scroll to top when closed.
Open a Carousel gallery.  Browse around and close out of it.  Scroll position when opened should not change.

- Single Sign On: redirect correctly.
Step 1. Add `add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );` to a core functionality plugin and verify that visiting your wp-admin skips the local login form.
Step 2. Logged out of both your local site and WP.com, try to visit your site's tools.php directly (e.g. example.com/wp-admin/tools.php )
Expected result: Login successful, dumped to /wp-admin/tools.php

## 3.8

### New Features/Enhancements

- Google+ Sidebar Widget
New widget!
To test: Add widget in both wp-admin and Customizer. Make sure there are no errors when adding either a person, page, or community badge.

Example Google+ urls to use:

https://plus.google.com/communities/101504763068635549461?hl=en (community)
https://plus.google.com/+WordPress/posts?hl=en (page)
https://plus.google.com/u/0/106016569422981142354/posts (profile)

- Social Media Icons: Add Google+
Adding Google+ to the Social Media Icons widget.
To test: set up a Google+ account in the widget using a Google+ username/user ID. Typically it's the value found in your Google+ page URL: https://plus.google.com/[USER_ID]/posts. Try with both the numerical value or a custom Google+ name if your URL uses +FirstName in the [USER_ID] instead of a numerical value.

- Sharing: Remove Twitter share counts.
Due to Twitter removing support for third party sharing counts, we needed to remove the option from our Twitter sharing buttons.
To test: Enable the Twitter sharing button (Icon, Icon + Text, or Text only) on a post that has Twitter share counts - you can verify existing counts by using the Official button - and verify that the share counts have been removed.

- Contact Form: Check for valid email address.
We've added a check to see if the "To" address in the Contact Form meets the Official Standard: RFC 5322 -- http://www.regular-expressions.info/email.html.
To test: Set up a contact form "To" address using an invalid email address. For example: "thisemail@is.invalid" or similar. You should see an alert message notifying you of the invalid email address.

- Contact Form: Checkbox with multiple items
In previous versions of Jetpack, if you wanted multiple checkboxes on your Contact Form, you had to enter one per field. Now, you can have multiple checkbox options in a single form field.
To test: Create a contact form using the new "Checkbox with Multiple Items" field type and ensure that they work properly in contact form submissions.

- Shortcodes: Add Twitch.tv shortcode embeds
Adding the Twitch.tv shortcode from WordPress.com.
To test: Add shortcode to a post or page. The most basic form of the shortcode requires only the URL parameter, and looks like this: [twitchtv url="http://www.twitch.tv/paperbat/b/323486192"]

You can also add additional parameters to customize the appearance:

height – defaults to 378 pixels
width – defaults to 620 pixels
autoplay – defaults to false

A more advanced shortcode would look something like: [twitchtv url="http://www.twitch.tv/paperbat" width="400" height="244" autoplay="true"]

- Notices
If you don't have Manage enabled, head on over to your updates page (update-core.php) -- you may see a message from us.

### Fixes

- Subscriptions: better error messaging for blocked emails.
Previously, if you had blocked emails from WordPress.com, then tried to subscribe to a page using Jetpack Subscriptions, you would never receive the confirmation email.
To test: Using your WordPress.com account, log into subscribe.wordpress.com, go to the Settings tab, and check the box to block all emails from WordPress.com and save. Leaving that window open, open a new tab/window to your test site (where you are not already subscribed to your site) and attempt to sign up using the same email address. Verify that the error message says "The email address has opted out of subscription emails." and includes a link to where you can fix the issue Then, refresh the subscribe.wordpress.com page and check to see if your subscription request is listed under the "Pending" tab. Don't forget to uncheck the "block emails" option under Settings when you're finished testing.

- Infinite Scroll: Use theme posts_per_page variable if set.
Previously, Jetpack ignored the posts_per_page variable set when declaring theme support for Infinite Scroll when the site was set to load additional posts on click. Now, if this variable is set in the theme, Jetpack will use the theme's variable when loading posts via Infinite Scroll.
To test: Using a theme that uses a posts_per_page that is not 7 (the default for Infinite Scroll), test to see whether or not the custom posts_per_page number is used when Infinite Scroll is enabled.

### New Filters/Hooks

- Sharing: Filter whether to display the Sharing Meta Box or not.
https://github.com/Automattic/jetpack/pull/2837/files

- Related Posts: Filter the post css classes added on HTML markup.
https://github.com/Automattic/jetpack/pull/2811

- Social Media Icon Widget: Filter the icons
See example in https://github.com/Automattic/jetpack/pull/2741

- Sharing: Filter the App ID used in the official Facebook Share button.
Example in https://github.com/Automattic/jetpack/pull/2590


## 3.7

### New Features/Enhancements

- New admin page UI!
You'll notice that the main Jetpack admin page has changed.
To test: Please follow these instructions https://github.com/Automattic/jetpack/pull/2549, and anything else you can think of.

- Staging Site Support!
Clone your site's database to a new site, e.g. using a host's staging site feature. Previously, since both databases had the needed info to communicate to WordPress.com's record for the original site, there would be lots of things broken/weird. Now, when opening on a site where WP.com and your site's siteurl/homeurl settings differ, we'll prompt you to ask what's going on.
To test: A brand new site cloned from an existing one: Confirm that the "Reset Connection" option properly connects the new site (e.g. the stats aren't shared with another site) and the original site remains operational.
To test: On a staging site, any changes made (e.g. creating new posts) are not reflected on the WP.com record. Example way to check: Visit the wordpress.com My Sites for the original test site and confirm any posts made only on the staging site aren't listed as a post there.

- Subscriptions per-post opt out!
When using the Subscriptions module, you can now opt-out individual posts from being sent out to subscribers.
To test: Toggle the checkmark in the publish meta box on an unpublished post.

- Switched notifications to API v1.1
To test: Make sure that new notification overlay is properly displayed both in the admin area and in the front-end area.

- Reddit "Official" Sharing Button
To test: Confirm that, when using the official Reddit button, the Reddit posting page opens in a new window/tab, not the original.

- Publicize Custom Message: Previously, once a custom Publicize message was set, it could not be completely removed.
To test: Set a custom message when writing a new post, save a draft, then come back and remove the message to restore the default settings.

- Open Graph tags with smart punctuation
To test: Set the post title or description (e.g. excerpt) to use smart punctuation—curly quotes, angled apostrophes, etc, and confirm sharing on various services that use OG tags works as expected (Facebook, Twitter, Pinterest, etc).

- New VideoPress player
Updates the Jetpack VideoPress player to HTML 5 when using the [wpvideo] shortcode and registers VideoPress as an oEmbed provider.
To test: Add an VideoPress permalink into the editor to test oEmbed.
To test: Play videos via oEmbed and the wpvideo shortcode on a number of browser/OS combinations.

- PollDaddy shortcode
The PollDaddy shortcode had been updated and enhanced quite a bit on WP.com. 3.7 brings those enhancements downstream.
To test: Add a PD poll via the Shortcode. Confirm it loads and no JS errors (JS changed to async)
To test: Add a PD poll via oEmbed (dropping in the poll.fm link). New to Jetpack.
To test: Add a PD poll via Shortcode on a HTTPS site. Expected: Works with no mixed content issues.

- Widget Visibility Enhancement!
A new rule has been added to show/hide widgets based on Parent Page. Very helpful for all of your hierarchical page-based site needs!
To test: Set widget visibility option for a parent page, confirm works as expected on a child of that page.

- bbPress Love!
Previously, Jetpack didn't insert Sharing buttons on bbPress CPTs even if they were set to be used via Settings->Sharing
To test: Enable Sharing on bbPress CPTs and confirm they're added.

### Fixes

- No longer forcing http:// on API urls
To test: If you have a site that uses HTTPS, please test to ensure that social sharing, shortlinks, and managing your site through WordPress.com all work as expected

- Edit Posts List Table: Fixed the styling associated with the Likes column resulting from 4.3 changes.
To test: Confirm no visual oddities while on either WP 4.2.x or 4.3.x

- Facebook Embeds: In some cases, the script loaded early resulting in no embed
To test: Try embedding a FB post using the Facebook shortcode.

- Sharing/Likes: Front Page settings
To test: Set a page as your site's front page and confirm the "Front Page" sharing option is respected.

- Open Graph Tags
DailyMotion videos are treated the same as YouTube/Vimeo. If the logic suggests a video screencap should be used, it'll now include DailyMotion.
