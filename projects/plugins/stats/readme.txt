=== Jetpack Stats ===
Contributors: automattic
Tags: stats, analytics, site stats, traffic, visitors
Requires at least: 6.9
Requires PHP: 7.2
Tested up to: 7.0
Stable tag: 0.1.0-alpha
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Simple, yet powerful stats to grow your site.

== Description ==

With Jetpack Stats, you don't need to be a data scientist to see how your site is performing.

**Tried and true visitor stats to help you understand your audience**

Explore real-time data on visitors, likes, and comments. Get detailed insights on the referrers that bring traffic to your site. Discover what countries your visitors are coming from. Measure link clicks, video plays, and file downloads within your site.

**See what's working with content performance metrics**

Discover your top performing posts & pages. See who is creating the most popular content on your team with our author metrics. Easily keep track of your content creation habits & trends over the years. View weekly and yearly trends with 7-day Highlights and Year in Review. Understand where your visitors are coming from with UTM tracking.

**Engage with your subscribers and view your social reach**

See your WordPress & Email subscribers, and follow them back to build your community. Connect Jetpack Social to popular social networks and see your total follower counts. See what popular social networks your content is being shared to the most.

**Third-party integrations to keep you growing**

Promote content to millions of WordPress and Tumblr users directly from Stats using Blaze. Easily see orders, refunds, shipping, and other product trends as a WooCommerce customer. Monitor ads displayed & keep track of earnings when using Jetpack Ads.

**Keeping personal data secure**

Jetpack Stats gives you a powerful WordPress analytics tool that respects your visitors' privacy, allowing you to gain valuable insights while maintaining GDPR compliance.

== External services ==

This plugin relies on WordPress.com, a service operated by Automattic. The plugin does not work without it.

* **What the service does:** it records page views and returns the reports shown in the Stats dashboard.
* **What data is sent:** the page viewed, the referring URL, the visitor IP address, the user agent, and your site ID. Data is sent on every front-end page view, and whenever the Stats dashboard loads a report.
* **Where it is sent:** `https://pixel.wp.com/g.gif` for collection, and `https://public-api.wordpress.com` for reporting.

This plugin requires a connection to a WordPress.com account. Until that connection is complete, no data is collected and no reports are available.

Service terms: [Terms of Service](https://wordpress.com/tos/)
Service privacy policy: [Privacy Policy](https://automattic.com/privacy/)

== Installation ==

1. Install the plugin through the WordPress plugins screen, or upload the plugin files to your `/wp-content/plugins/` directory.
2. Activate the plugin through the Plugins screen in WordPress.
3. Connect your site to a WordPress.com account when the plugin asks you to. Stats cannot collect data before this step is complete.
4. Go to the Stats tab.

== Frequently Asked Questions ==

= How do I configure Jetpack Stats? =

Simply install the plugin and go to the Stats tab. It's that simple. If you need more help, check out [this support article](https://jetpack.com/support/jetpack-stats/).

= Does Jetpack Stats integrate with Google Analytics? =

Yes! You can use both on your WordPress installation. The benefit of using Jetpack Stats is that you can see a snapshot of your blog's activity directly from your dashboard. If you want to use another analytics service to give you additional in-depth information, you can certainly do so.

= With Stats, can I view visitors by country? =

Yes! Jetpack Stats will show you a heatmap of exactly where in the world your site has been receiving its visitors from.

= Does Stats honor DNT requests? =

Do Not Track (DNT) is a feature in web browsers and websites that asks advertisers and other web software providers not to track individuals' browsing habits. As a site owner, you can configure Jetpack Stats to honor requests from visitors who have DNT enabled, and prevent tracking of their activity (i.e., post and page views) with an easy-to-add snippet.

= Through Stats, can I see who viewed individual posts? =

No. Any piece of data explicitly identifying a specific user (IP address, WordPress.com ID, WordPress.com username, etc.) is not visible to the site owner when using Jetpack Stats, so you won't be able to see which specific users or accounts viewed a particular post.

= Can I download my site stats? =

You can click the title of each feature on your stats page, and scroll to the bottom of that feature to download your stats. Simply click on the "Download data as CSV" link, and download the file to your computer.

== Changelog ==

= 0.1.0-alpha =
* Initial release.
