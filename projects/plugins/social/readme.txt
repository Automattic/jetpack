=== Jetpack Social  ===
Contributors: automattic, pabline, siddarthan, gmjuhasz, manzoorwanijk, danielpost
Tags: social-media, publicize, social-media-manager, social-networking, social marketing, social, social share,  social media scheduling, social media automation, auto post, auto- publish, social share
Requires at least: 6.3
Requires PHP: 7.0
Tested up to: 6.5
Stable tag: 2.3.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Write once, publish everywhere. Reach your target audience by sharing your content with Jetpack Social!

== Description ==
### Write once, publish everywhere.

*Share up to 30 times per month for free with Jetpack Social, and upgrade to share as many times as you want!*

**Grow your following by sharing your content with Jetpack Social!**

It’s important to publish on both your website & social media in order to reach your whole audience. If you only publish on social media, you’re missing up to 60% of adults on a daily basis. Jetpack Social makes it easy to automatically share your site’s posts on popular social media channels such as Facebook and Tumblr. Increase your audience by engaging your site's viewers & your social followers.

**Manage all channels from a single hub to save time**

Don’t have the time to keep up with social media? Jetpack Social pushes your site’s posts and products to all your social media channels in one place, with just a few clicks.

**Set it and forget it!**

Jetpack Social has scheduling tools that allow you to set your posts to publish at the time and day that works for your plan. Schedule your posts in advance so you’re not chained to your desk and publish at the time of day your fans are most engaged on social media.

**Social Image Generator**

With the Jetpack Social Advanced plan, you can have engaging imagery created automatically using the Social Image Generator feature. You can overlay custom text onto your images and choose from a variety of styles to increase engagement on your social posts. Most importantly, you’ll save time by doing it all within the WordPress editor.

**Organic Content Sharing**

Boost your social media engagement with Jetpack Social's Organic Content Sharing feature. Research indicates that manually published posts receive 50% more interaction compared to shared links. Our feature allows you to select custom images, videos, and text to share your blog posts as native social media content, enhancing engagement and saving you time. This feature is available with the Jetpack Social Advanced plan only.

== Installation ==

### Installation

The first option is to install Jetpack Social from within your WP Admin.

1. To begin, click on the Plugins link in the left hand sidebar, then click Add New.
2. Search for Jetpack Social. The latest version will be in the search results. Click the Install Now button.
3. Next, click the Activate button. After activating, you can navigate to "Jetpack → Social" in your admin area.

### Manual Alternatives

Alternatively, install Jetpack Social via the plugin directory, or upload the files manually to your server and follow the on-screen instructions.

### With 💚 by Jetpack

This is just the start!

We are working hard to bring more features and improvements to Jetpack Social. Let us know your thoughts and ideas!

== Frequently Asked Questions ==

= How do I connect to social networks? =

From your site’s WP Admin:

1. Navigate to Jetpack → Social.
2. Click on the Manage Connections button.
3. Click Connect next to the social network you want to connect to.
4. Log in to that social network site and authorize the connection.

You can connect to any of the following networks:

* Facebook Pages
* Tumblr
* LinkedIn
* Mastodon
* Instagram Business

After you add a new connection, you have the option to make the connection ‘global’, meaning it can also be used by any other user on your site who has the ability to publish posts.

To make the connection available to all users, check the box labeled "Connection available to all administrators, editors, and authors".

= To which social media platforms can I post using Jetpack Social? =

You can post to Facebook, Instagram Business, Tumblr, Mastodon and Linkedin. We are working hard to increase our social share integrations.

= How do I share a post on social media using Jetpack Social? =

To configure the Publicize options when writing a new post, click the green Jetpack icon at top right of the edit sidebar.

You’ll then see the Publicize options under the **Share this post** section, where you can toggle social media connections, connect new services, and write a custom message to be used when your post is shared.

= How do I add a custom excerpt to my social posts? =

The easiest way is to use the Custom Message option in the publishing options box prior to publishing your post.

== Screenshots ==

1. Activate the plugin and get access to your social media connections.
2. Connect your social media accounts.
3. Manage and publish to your social accounts via the Editor.
4. Manage your Jetpack Social and other Jetpack plugins from My Jetpack.

== Changelog ==
### 4.1.0 - 2024-03-07
#### Added
- Added a template lock to our Social Note CPT
- Added endpoint to update post meta
- Added feature support for the new CPT to support activitypub.
- Added fix for the post list screen for social notes.
- Added toggle to Social admin page for the Social Notes
- Implemented titless permalink fixes.
- New setting in /sties/$site/settings that is not relevant to this plugin.
- Register CPT for Social Notes.
- Social: Added archive page support to notes

#### Changed
- Changed the admin page 'Write a post' button to primary if the site has connections
- General: indicate compatibility with the upcoming version of WordPress, 6.5.
- Social Notes: Added the post list enhancements
- Tailored editor for social notes
- Updated package dependencies. [#35384, #35385, #35591, #35608, #35819, #36095, #36097, #36142, #36143]
- Update package lock
- Update to the most recent version of the @automattic/calypso-color-schemes package.
- Use Blog ID in links to WPCOM instead of site slug.

#### Fixed
- Fixed no title from showing up in og:title
- Fixed og:title having word-breaks.

== Upgrade Notice ==

= 3.0.0 =
Required for compatibility with Jetpack 12.9 and later.
