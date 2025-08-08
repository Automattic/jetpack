=== Jetpack Social  ===
Contributors: automattic, pabline, siddarthan, gmjuhasz, manzoorwanijk
Tags: social media automation, social media scheduling, auto share, social sharing, social media marketing
Requires at least: 6.7
Requires PHP: 7.2
Tested up to: 6.8
Stable tag: 4.5.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Write once, publish everywhere. Reach your target audience by sharing your content with Jetpack Social!

== Description ==
### Write once, publish everywhere.

**Grow your following by sharing your content with Jetpack Social!**

It’s important to publish on both your website & social media in order to reach your whole audience. If you only publish on social media, you’re missing up to 60% of adults on a daily basis. Jetpack Social makes it easy to automatically share your site’s posts on popular social media channels such as Facebook and Tumblr. Increase your audience by engaging your site's viewers & your social followers.

**Manage all channels from a single hub to save time**

Don’t have the time to keep up with social media? Jetpack Social pushes your site’s posts and products to all your social media channels in one place, with just a few clicks.

**Set it and forget it!**

Jetpack Social has scheduling tools that allow you to set your posts to publish at the time and day that works for your plan. Schedule your posts in advance so you’re not chained to your desk and publish at the time of day your fans are most engaged on social media.

**Social Image Generator**

With the Jetpack Social plan, you can have engaging imagery created automatically using the Social Image Generator feature. You can overlay custom text onto your images and choose from a variety of styles to increase engagement on your social posts. Most importantly, you’ll save time by doing it all within the WordPress editor.

**Organic Content Sharing**

Boost your social media engagement with Jetpack Social's Organic Content Sharing feature. Research indicates that manually published posts receive 50% more interaction compared to shared links. Our feature allows you to select custom images, videos, and text to share your blog posts as native social media content, enhancing engagement and saving you time. This feature is available with the Jetpack Social plan.

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
2. Click on the "Connect an account" button.
3. Click Connect next to the social network you want to connect to.
4. Log in to that social network site and authorize the connection.

You can connect to any of the following networks:

* Facebook Pages
* Tumblr
* LinkedIn
* Mastodon
* Instagram Business
* Nextdoor
* Mastodon
* Threads
* Bluesky

After you add a new connection, you have the option to mark the connection as shared, meaning it can also be used by any other users on your site who have the ability to publish posts.

To make the connection available to all users, check the box labeled "Mark the connection as shared".

= To which social media platforms can I post using Jetpack Social? =

You can post to Facebook, Bluesky, Threads, Instagram Business, Tumblr, Mastodon, Linkedin, and Nextdoor. We are working hard to increase our social share integrations.

= How do I share a post on social media using Jetpack Social? =

To configure the Social options when writing a new post, click the Jetpack/Social icon at top right of the edit sidebar.

You’ll then see the Social options under the **Share this post** section, where you can toggle social media connections, connect new services, and write a custom message to be used when your post is shared.

= How do I add a custom excerpt to my social posts? =

The easiest way is to use the Custom Message option in the publishing options box prior to publishing your post.

== Screenshots ==

1. Social settings options
2. Social settings options
3. Connected social media accounts
4. Adding new social media accounts
5. Social media sharing options in the post editor
6. Managing Social media accounts in the post editor

== Changelog ==
### 7.1.0 - 2025-08-05
#### Added
- Social Image Generator: Add font option.
- My Jetpack: Add analytics for empty product search results.
- Social Notes: Add a fallback title that can be customized via the `jetpack_social_notes_default_title` filter.

#### Changed
- E2E tests: Remove redundant logic in test fixture and converted the fixture to Typscript.
- Improve performance of WordPress.com comment likes by caching and minimizing API requests.
- My Jetpack: Enable access to My Jetpack on WP Multisite.
- My Jetpack: Hide backup failure notice when backups are deactivated.
- My Jetpack: Unify the user connection flow with a unified screen.
- My Jetpack: Update Stats card to include a chart for better analytics.
- Sync: Ignore the ActivityPub Outbox CPT.
- Update package dependencies.

#### Fixed
- Ensure images load in connections management when concatenating JS.
- Fix image validation when images sizes are customised.
- JITM: Fix ineffective caching due to expired plugin sync transient.
- My Jetpack: Fix footer alignment for disconnected accounts.
- My Jetpack: Prevent expiration alerts for products covered by active bundles.
- My Jetpack: Restore plan purchase link in footer.
- Social Image Generator: Do not use the latest post's Social Image as Open Graph Image tag on the home page.
- Social Notes: Update filter name to match recent changes in WordPress.
- Social Previews: Fix a bug with text overflowing with Mastodon.
- Update JITMs to remove jQuery dependency.

== Upgrade Notice ==

= 3.0.0 =
Required for compatibility with Jetpack 12.9 and later.
