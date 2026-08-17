=== Jetpack Stats ===
Contributors: automattic
Tags: stats, analytics, site stats, traffic, visitors
Requires at least: 6.9
Requires PHP: 7.2
Tested up to: 7.0
Stable tag: 0.1.0-alpha
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Simple, yet powerful stats to grow your site. See your traffic, referrers, and top content at a glance — no data science required.

== Description ==

With Jetpack Stats, you don't need to be a data scientist to see how your site is performing. Get a clear, privacy-friendly picture of your traffic right inside your WordPress dashboard.

Jetpack Stats is a standalone plugin — you can run it on its own, without installing the full Jetpack plugin.

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

== Installation ==

= Automated installation =

1. Go to the Plugins screen in your WordPress admin and click "Add New".
2. Search for "Jetpack Stats" and click "Install Now".
3. Activate the plugin through the Plugins screen.
4. Connect your site to a WordPress.com account when the plugin asks you to. Stats cannot collect data before this step is complete.
5. Go to the Stats tab.

= Manual installation =

1. Upload the plugin files to the `/wp-content/plugins/jetpack-stats` directory, or install the .zip file through the Plugins screen in your WordPress admin.
2. Activate the plugin through the Plugins screen.
3. Connect your site to a WordPress.com account when the plugin asks you to.
4. Go to the Stats tab.

== Frequently Asked Questions ==

= How do I configure Jetpack Stats? =

Simply install the plugin and go to the Stats tab. It's that simple. If you need more help, check out [this support article](https://jetpack.com/support/jetpack-stats/).

= Do I need the full Jetpack plugin to use Jetpack Stats? =

No. Jetpack Stats is a standalone plugin and works on its own. If you already run the full Jetpack plugin, Stats works there too — you don't need both, and running both will not create duplicate menus.

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

== Screenshots ==

1. The Stats dashboard — traffic at a glance with visitors, views, and trends.
2. Top posts & pages, and the referrers driving your traffic.
3. A world heatmap showing where your visitors come from.
4. 7-day Highlights and Year in Review trends.

== External services ==

This plugin relies on WordPress.com, a service operated by Automattic, to record visits and generate the reports shown in the Stats dashboard. The plugin does not work without it.

It connects to the following external services:

**WordPress.com view-tracking pixel (`https://pixel.wp.com/g.gif`)**

* What it does: records a page view each time a visitor loads a page on your site.
* Data sent: the page viewed, the referring URL, the visitor's IP address, the user agent, and your site ID.
* When: on every front-end page view.

**WordPress.com measurement script (`https://stats.wp.com/e-{year}.js`)**

* What it does: loads the small JavaScript file that sends the view-tracking request above from the visitor's browser.
* Data sent: no data is sent when the file is downloaded; it is a static script served from Automattic's CDN.
* When: on every front-end page view.

**WordPress.com reporting API (`https://public-api.wordpress.com`)**

* What it does: returns the aggregated statistics displayed in your Stats dashboard.
* Data sent: your site ID and the report parameters (date ranges, metric requested). Requires an authenticated WordPress.com connection.
* When: whenever you open the Stats dashboard or load a report.

**WordPress.com dashboard assets (`https://widgets.wp.com/odyssey-stats/`)**

* What it does: serves the JavaScript, styles, and icons that render the Stats dashboard interface in your WordPress admin.
* Data sent: no personal data; these are static front-end assets served from Automattic's CDN.
* When: whenever you open the Stats dashboard.

This plugin requires a connection to a WordPress.com account. Until that connection is complete, no data is collected and no reports are available.

Service terms: [Terms of Service](https://wordpress.com/tos/)
Service privacy policy: [Privacy Policy](https://automattic.com/privacy/)

== Changelog ==

= 0.1.0-alpha =
* Initial release.

== Upgrade Notice ==

= 0.1.0-alpha =
Initial release — install Jetpack Stats to see simple, privacy-friendly traffic insights right inside your WordPress dashboard.
