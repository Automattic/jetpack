=== Jetpack Social  ===
Contributors: automattic, pabline, siddarthan, gmjuhasz, manzoorwanijk
Tags: social media automation, social media scheduling, auto share, social sharing, social media marketing
Requires at least: 7.0
Requires PHP: 7.4
Tested up to: 7.1
Stable tag: 10.0.0
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
### 10.0.0 - 2026-10-14
#### Added
- Connection: Add a Connected view to the Users page listing users with a linked WordPress.com account.
- Connection: Surface SSL certificate verification failures reported by WordPress.com as a connection error notice.
- Connection: Transfer connection ownership to another administrator without leaving your site.
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed.

#### Changed
- AI: Use WordPress Design System colors in the image generator.
- Boost: Wait up to four minutes for slow speed tests in My Jetpack instead of timing out after two.
- Charts: follow the WordPress admin color scheme for chart series colors.
- Charts: update chart grid, axis and label colors immediately when the theme changes.
- Connection: Show every connection error in one notice, each with the account it affects, and link to Site Health when a firewall is blocking WordPress.com.
- Dashboard: Enable or disable Social directly from the dashboard, so it can be turned back on where Jetpack Settings is unreachable (e.g. WordPress.com Atomic sites).
- General: Update minimum WordPress version to 7.0.
- Hide the Social sidebar item when Social is not active.
- My Jetpack: answer module switch clicks immediately, and explain what happened when a change fails.
- My Jetpack: Restyle dashboard notices to match the WordPress design system.
- My Jetpack: Show a connection error on the Overview connection card while your account is still to be connected, instead of only asking you to connect it.
- My Jetpack: Show a Features tab in place of the Products tab.
- My Jetpack: Show product cards flat, without a drop shadow.
- My Jetpack: Show the dashboard in the new rounded admin page frame.
- My Jetpack: Show the Jetpack menu notification badge when a connection error is detected.
- My Jetpack: Show what Paid Stats actually adds — UTM tracking, device stats, and region & city locations — instead of commercial use.
- Overview: Show the traffic chart tooltip on the dark WordPress design system tooltip surface.
- Sharing: Keep focus on information icons when their tooltips open, announce the content to screen readers, and show a focus ring after clicking them.
- Sidebar: sort Jetpack menu items alphabetically, pinning My Jetpack to the top and external links and Settings to the bottom.
- Social: the block editor sidebar now uses the same connection management UI as the Social admin page.
- Surface a visible error when fetching the keyring result fails during a connection, instead of failing silently.
- Tested up to WordPress 7.1.
- Update package dependencies.
- Use core snackbar notice placement.

#### Removed
- Updated PHP version requirements to PHP 7.4 or newer.

#### Fixed
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window.
- Admin page: Fix the dashboard overlapping the admin menu in right-to-left languages.
- Charts: draw labels at the design system's font weight and size.
- Charts: Fix unreadable axis labels in forced-colors mode.
- Charts: keep chart tooltips under sticky and fixed page elements.
- Charts: Place line and area chart date ticks on the site's time zone boundaries, name the hour in tooltips on hourly data, and read hour labels in the site's own locale rather than a forced 12-hour clock.
- Charts: Restore keyboard focus after dismissing line chart tooltips.
- Charts: Stop the first and last dates on a chart's horizontal axis from being cut off.
- Connection: Fix a stale connection error notice that could persist on healthy sites.
- Connection: Fix reconnecting your WordPress.com account so it no longer disconnects other users and clears the broken-connection notice on the first attempt.
- Connection: Hide connection error notices from users who cannot fix the connection.
- Connection: Let users without admin access reconnect their own broken account from the connection error notice.
- Connection: Report a broken connection on My Jetpack's connection card instead of claiming everything looks good, and show a break only the connection owner can repair as a warning, not an error, to everyone else.
- Connection: Stop showing a duplicate account notice when your WordPress.com email differs from your site email only in letter case.
- Connection: Stop Site Health from showing spurious connection failures — remove the redundant outbound HTTP/HTTPS checks, and no longer prompt a reconnect when the WordPress.com connection test is inconclusive.
- Connection: Stop users who cannot set up the site connection from becoming the connection owner when the owner's connection is missing.
- Connection: Translate the Connectors card's text on sites that don't use English.
- Connection: Update wording for some connection error notices.
- Connections: Let a Facebook or Instagram connection with no Page or account saved pick one when reconnecting.
- Dashboard: Continue the wp-admin menu color behind the page frame on WordPress.com and third-party admin color schemes.
- Dashboard: Show contextual messages on the Social screen again.
- Fix low-contrast placeholder chips in the share message help text and the available placeholders list.
- Fix publishing failing with a share message database error, which also prevented social shares from being sent.
- Fix the Social admin screen and editor sidebar failing to load on WordPress.com-hosted sites.
- Footer: Hide Products and Help links when My Jetpack is unavailable.
- JITM: Fix missing messages and a console error on sites without the Jetpack plugin active.
- Keep admin icons colored after the @wordpress/icons 16 update, which draws them as strokes.
- Keep keyboard focus on the first or last data point when an arrow key reaches the end of the traffic chart, return focus to the chart when Escape closes a tooltip, stop a focused chart from swallowing keys it does not use such as Page Down, and close the tooltip when the series it describes is hidden.
- Line up the Jetpack in-dashboard message with the rest of the page.
- My Jetpack: always label the license activation link 'Activate a license'. It previously read 'Activate a new license' on sites with a plan, even when no licenses had been activated.
- My Jetpack: Fix the layout of the connection screen for right-to-left languages.
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs.
- My Jetpack: Point users who cannot connect the site at an administrator, instead of an onboarding screen they cannot complete.
- My Jetpack: Show each notice once instead of twice.
- My Jetpack: Show the highest-priority notice first when several are set at once.
- My Jetpack: Show the right product status as soon as fresher plan data is available, instead of reusing an earlier lookup.
- My Jetpack: Stop repeating the partner lookup request on every page load.
- My Jetpack: Stop reporting an error when switching VideoPress off while the Jetpack plugin is inactive.
- My Jetpack: Stop the Stats dashboard from asking which plan you want again after Start for Free was already chosen.
- My Jetpack: stretch the tab content background to the full height of the page.
- Point WordPress.com Simple sites at the Business plan when upgrading, instead of a checkout they can't complete.
- Pre-fill the Bluesky handle field when reconnecting an account.
- Sharing: Open information tooltips with the keyboard and dismiss them with Escape.
- Show each number on the traffic chart's value axis once when visit counts are small.
- Social Notes: Avoid repeated database queries when Social Notes are disabled.
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site.
- Stop the dashboard frame from flashing while loading and when switching admin pages.
- Traffic chart: Announce the chart correctly to screen readers.

== Upgrade Notice ==

= 3.0.0 =
Required for compatibility with Jetpack 12.9 and later.
