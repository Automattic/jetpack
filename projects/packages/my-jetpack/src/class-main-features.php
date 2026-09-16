<?php
/**
 * Static catalog of the main Jetpack features.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Describes the main Jetpack features: their copy, links and how a site owner gets each one.
 */
class Main_Features {

	/**
	 * The static feature catalog.
	 *
	 * Keys are feature slugs. `product` names the My Jetpack product behind a feature;
	 * features without one carry `admin_page` instead, plus `module` when a Jetpack module
	 * governs them. `essential` marks a feature every site should run. `icon` is a short
	 * icon key such as `shield`, and `interstitial` a My Jetpack route from `_inc/constants.ts`.
	 * `image`, `info_url` and `docs_url` point at the feature's own public pages.
	 *
	 * How a site owner gets a feature: `delivery.in_jetpack` says the Jetpack plugin ships it,
	 * `delivery.standalone` and `delivery.standalone_url` name a separate plugin that does and
	 * its WordPress.org page, and `delivery.free` says it can be used without paying.
	 * `paid_highlights` lists what paying adds, `paid_product` names what to buy, and `plans`
	 * lists the bundles that include it.
	 *
	 * @return array<string, array<string, mixed>> Feature definitions keyed by feature slug.
	 */
	public static function get_feature_definitions() {
		return array(
			'activity-log'  => array(
				'info_url'         => 'https://jetpack.com/security/activity-log/',
				'docs_url'         => 'https://jetpack.com/support/activity-log/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2020/05/421d9-95c1d-jetpack-activity-log-ui.png',
				'name'             => __( 'Activity Log', 'jetpack-my-jetpack' ),
				'description'      => __( 'See what changed on your site, when it happened, and who did it.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'When something breaks, see exactly what changed and who changed it, from published posts to plugin updates and logins. Every connected site gets its 20 most recent events for free.', 'jetpack-my-jetpack' ),
				'icon'             => 'list',
				'admin_page'       => 'jetpack-activity-log',
				'paid_highlights'  => array(
					__( '30 days of history with VaultPress Backup or Jetpack Security, a full year with Jetpack Complete', 'jetpack-my-jetpack' ),
					__( 'Filter events by activity type and date range', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'free'       => true,
				),
				'plans'            => array( 'security', 'complete' ),
				'paid_product'     => __( 'Jetpack VaultPress Backup', 'jetpack-my-jetpack' ),
			),
			'anti-spam'     => array(
				'info_url'         => 'https://akismet.com/',
				'docs_url'         => 'https://akismet.com/support/',
				'image'            => 'https://akismet.com/wp-content/uploads/2023/04/social-media.png',
				'name'             => __( 'Akismet Anti-spam', 'jetpack-my-jetpack' ),
				'description'      => __( 'Stop comment and form spam without making visitors solve CAPTCHAs.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Akismet filters spam out of your comments and form submissions in the background, so you stop moderating junk and visitors never have to prove they are human. When it gets one wrong, mark it and Akismet learns from your correction.', 'jetpack-my-jetpack' ),
				'icon'             => 'comment',
				'product'          => 'anti-spam',
				'interstitial'     => '/add-akismet',
				'paid_highlights'  => array(
					__( 'Use it on business and commercial sites', 'jetpack-my-jetpack' ),
					__( 'Advanced stats and diagnostics for your spam activity', 'jetpack-my-jetpack' ),
					__( 'Email support', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack'     => false,
					'standalone'     => __( 'Akismet Anti-spam', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/akismet/',
					'free'           => true,
				),
				'plans'            => array( 'security', 'complete' ),
				'paid_product'     => __( 'Jetpack Akismet Anti-spam', 'jetpack-my-jetpack' ),
			),
			'backup'        => array(
				'info_url'         => 'https://jetpack.com/backup/',
				'docs_url'         => 'https://jetpack.com/support/backup/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/01/24358-46709-backup-restore-card.jpg',
				'name'             => __( 'VaultPress Backup', 'jetpack-my-jetpack' ),
				'description'      => __( 'Get your site back online in one click if anything goes wrong.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Every change you make is saved off-site as it happens, so your content and WooCommerce orders stay safe even if your host goes down. Restore your site in one click, even when it is offline.', 'jetpack-my-jetpack' ),
				'icon'             => 'backup',
				'product'          => 'backup',
				'interstitial'     => '/add-backup',
				'paid_highlights'  => array(
					__( 'Real-time backups of your files, database and WooCommerce orders', 'jetpack-my-jetpack' ),
					__( 'One-click restores, even from the Jetpack mobile app', 'jetpack-my-jetpack' ),
					__( 'Move your site to any host without a developer', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack'     => true,
					'standalone'     => __( 'Jetpack VaultPress Backup', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/jetpack-backup/',
					'free'           => false,
				),
				'plans'            => array( 'security', 'complete' ),
				'paid_product'     => __( 'Jetpack VaultPress Backup', 'jetpack-my-jetpack' ),
			),
			'blaze'         => array(
				'info_url'         => 'https://jetpack.com/blaze/',
				'docs_url'         => 'https://jetpack.com/support/blaze/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/03/68752-43696-hero-blaze-2x-1.png',
				'name'             => __( 'Blaze', 'jetpack-my-jetpack' ),
				'description'      => __( 'Put your best posts in front of new readers on WordPress.com and Tumblr.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Turn a post or page into an ad shown across Tumblr and WordPress.com, aimed at the locations, languages and interests you choose. There is no plan to buy: set a budget for each campaign and pay only for the ad views you get.', 'jetpack-my-jetpack' ),
				'icon'             => 'megaphone',
				'admin_page'       => 'advertising',
				'module'           => 'blaze',
				'delivery'         => array(
					'in_jetpack'     => true,
					'standalone'     => __( 'Blaze Ads', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/blaze-ads/',
					'free'           => false,
				),
			),
			'boost'         => array(
				'info_url'         => 'https://jetpack.com/boost/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-boost/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/08/2c483-boost_performance-2x.png',
				'name'             => __( 'Boost', 'jetpack-my-jetpack' ),
				'description'      => __( 'Make your site load faster in a few clicks, no developer required.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Your pages reach visitors sooner: Boost caches them, defers non-essential JavaScript and serves resized images from a worldwide network. Mobile and desktop performance scores show you the impact of each change.', 'jetpack-my-jetpack' ),
				'icon'             => 'trending-up',
				'product'          => 'boost',
				'essential'        => true,
				'interstitial'     => '/add-boost',
				'paid_highlights'  => array(
					__( 'Critical CSS that updates automatically as your site changes', 'jetpack-my-jetpack' ),
					__( 'Performance history for mobile and desktop, including Core Web Vitals', 'jetpack-my-jetpack' ),
					__( 'Control over the quality and size of images from the image CDN', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack'     => false,
					'standalone'     => __( 'Jetpack Boost', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/jetpack-boost/',
					'free'           => true,
				),
				'plans'            => array( 'complete' ),
				'paid_product'     => __( 'Jetpack Boost', 'jetpack-my-jetpack' ),
			),
			'crm'           => array(
				'info_url'         => 'https://jetpackcrm.com/',
				'docs_url'         => 'https://kb.jetpackcrm.com/article-categories/getting-started/',
				'image'            => 'https://jetpackcrm.com/wp-content/uploads/2022/02/jpcrm-styled-1.png',
				'name'             => __( 'Jetpack CRM', 'jetpack-my-jetpack' ),
				'description'      => __( 'Keep every lead and customer in one place, right inside WordPress.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Track leads, send quotes and invoices, and see each customer’s full history from your dashboard. Because it runs on your own site, your customer data stays yours.', 'jetpack-my-jetpack' ),
				'icon'             => 'people',
				'product'          => 'crm',
				'interstitial'     => '/add-crm',
				'paid_highlights'  => array(
					__( 'A sales dashboard, sales funnels and automations to follow up on leads', 'jetpack-my-jetpack' ),
					__( 'Take payments through Stripe and PayPal', 'jetpack-my-jetpack' ),
					__( 'Sync contacts from Gravity Forms, Contact Form 7 and Mailchimp', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack'     => false,
					'standalone'     => __( 'Jetpack CRM', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/zero-bs-crm/',
					'free'           => true,
				),
				'plans'            => array( 'complete' ),
				'paid_product'     => __( 'Jetpack CRM Entrepreneur', 'jetpack-my-jetpack' ),
			),
			'jetpack-ai'    => array(
				'info_url'         => 'https://jetpack.com/ai/',
				'docs_url'         => 'https://jetpack.com/support/create-better-content-with-jetpack-ai/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/09/b76cf-48ca0-image-hero.png',
				'name'             => __( 'Jetpack AI Assistant', 'jetpack-my-jetpack' ),
				'description'      => __( 'Turn your ideas into ready-to-publish content without leaving the editor.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Generate posts, tables, forms and images from a prompt, then change the tone, translate, or fix unclear sentences to make your writing easier to read. Before you publish, improve your title and create a featured image in one click.', 'jetpack-my-jetpack' ),
				'icon'             => 'star',
				'product'          => 'jetpack-ai',
				'interstitial'     => '/add-jetpack-ai',
				'paid_highlights'  => array(
					__( 'Keep creating after your 20 free requests run out', 'jetpack-my-jetpack' ),
					__( 'Generate a logo for your site', 'jetpack-my-jetpack' ),
					__( 'Priority support', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'free'       => true,
				),
				'plans'            => array( 'complete' ),
				'paid_product'     => __( 'Jetpack AI Assistant', 'jetpack-my-jetpack' ),
			),
			'jetpack-forms' => array(
				'info_url'         => 'https://jetpack.com/forms/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-blocks/contact-form/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/03/14c11-5f571-hero-forms-2x.png',
				'name'             => __( 'Forms', 'jetpack-my-jetpack' ),
				'description'      => __( 'From quick contact forms to multistep surveys, everything you need is included.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Break long forms into steps with a progress bar, and get every response by email and in your dashboard, with no limit on responses. Upgrade to add secure file uploads that keep harmful files off your server.', 'jetpack-my-jetpack' ),
				'icon'             => 'list-bullets',
				'product'          => 'jetpack-forms',
				'essential'        => true,
				'paid_highlights'  => array(
					__( 'Secure file uploads that keep harmful files off your server', 'jetpack-my-jetpack' ),
					__( 'Visitors’ files stay private, visible only to you and your editors', 'jetpack-my-jetpack' ),
					__( 'Up to 10 files per field, 20 MB each', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'free'       => true,
				),
				'plans'            => array( 'complete' ),
				'paid_product'     => __( 'Jetpack Complete', 'jetpack-my-jetpack' ),
			),
			'newsletter'    => array(
				'info_url'         => 'https://jetpack.com/newsletter/',
				'docs_url'         => 'https://jetpack.com/support/newsletter/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/04/95dca-69c7b-jetpack-newsletter-lp.png',
				'name'             => __( 'Newsletter', 'jetpack-my-jetpack' ),
				'description'      => __( 'Turn every post you publish into an email your readers receive.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Subscribers get each new post by email as soon as you publish, or in a daily or weekly digest they choose. You can also earn from your writing with paid subscriptions for exclusive posts.', 'jetpack-my-jetpack' ),
				'icon'             => 'envelope',
				'product'          => 'newsletter',
				'paid_highlights'  => array(
					__( 'Keep more of what you earn with lower fees on paid subscriptions', 'jetpack-my-jetpack' ),
					__( 'Import as many subscribers as you like', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'free'       => true,
				),
				'plans'            => array( 'growth', 'complete' ),
				'paid_product'     => __( 'Jetpack Growth', 'jetpack-my-jetpack' ),
			),
			'podcast'       => array(
				'info_url'         => 'https://jetpack.com/podcast/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-podcast/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/08/9c2fc-jp-sync-6397e6142b48-image-5.png',
				'name'             => __( 'Podcast', 'jetpack-my-jetpack' ),
				'description'      => __( 'Start a podcast on your own site and reach listeners on every major app.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Publish unlimited episodes as posts, with your podcast feed served from your own domain. Submit your show to Apple Podcasts, Spotify, Pocket Casts and more from one place.', 'jetpack-my-jetpack' ),
				'icon'             => 'audio',
				'admin_page'       => 'jetpack-podcast',
				'module'           => 'podcast',
				'paid_highlights'  => array(
					__( 'Listener stats by episode, app and country', 'jetpack-my-jetpack' ),
					__( 'An episodes dashboard for your whole back catalog', 'jetpack-my-jetpack' ),
					__( 'An episode player with chapters, transcripts and soundbites', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'free'       => true,
				),
				'plans'            => array( 'growth', 'complete' ),
				'paid_product'     => __( 'Jetpack Growth', 'jetpack-my-jetpack' ),
			),
			'protect'       => array(
				'info_url'         => 'https://jetpack.com/protect/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-protect/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/05/6c5c0-d16e7-hero-scan-2x.png',
				'name'             => __( 'Protect', 'jetpack-my-jetpack' ),
				'description'      => __( 'Get warned about vulnerable plugins and stop login attacks on your site.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Your WordPress version, plugins and themes are checked daily against a database of known vulnerabilities, with results in your dashboard. Login attacks are blocked automatically, and you can block specific IP addresses yourself.', 'jetpack-my-jetpack' ),
				'icon'             => 'shield',
				'product'          => 'protect',
				'essential'        => true,
				'interstitial'     => '/add-protect',
				'paid_highlights'  => array(
					__( 'Daily malware scanning with one-click fixes for most threats', 'jetpack-my-jetpack' ),
					__( 'Automatic firewall rules that block harmful requests', 'jetpack-my-jetpack' ),
					__( 'Instant email alerts when a threat is found', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack'     => true,
					'standalone'     => __( 'Jetpack Protect', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/jetpack-protect/',
					'free'           => true,
				),
				'plans'            => array( 'security', 'complete' ),
				'paid_product'     => __( 'Jetpack Scan', 'jetpack-my-jetpack' ),
			),
			'search'        => array(
				'info_url'         => 'https://jetpack.com/search/',
				'docs_url'         => 'https://jetpack.com/support/search/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/05/8bcc4-5b7cc-woocommerce-product-search-1.png',
				'name'             => __( 'Search', 'jetpack-my-jetpack' ),
				'description'      => __( 'Help your visitors find the right post or product as they type.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Visitors see relevant results as they type and can filter by category, tag, date or author, so they find what they need instead of leaving. Match search to your theme without writing code.', 'jetpack-my-jetpack' ),
				'icon'             => 'search',
				'product'          => 'search',
				'interstitial'     => '/add-search',
				'paid_highlights'  => array(
					__( 'Room for more records and monthly searches as your site grows', 'jetpack-my-jetpack' ),
					__( 'AI Answers without the free plan’s limits', 'jetpack-my-jetpack' ),
					__( 'No Jetpack branding, plus priority support', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack'     => true,
					'standalone'     => __( 'Jetpack Search', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/jetpack-search/',
					'free'           => true,
				),
				'plans'            => array( 'complete' ),
				'paid_product'     => __( 'Jetpack Search', 'jetpack-my-jetpack' ),
			),
			'social'        => array(
				'info_url'         => 'https://jetpack.com/social/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-social/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/03/9529d-db753-lets-share-social-jetpack.png',
				'name'             => __( 'Social', 'jetpack-my-jetpack' ),
				'description'      => __( 'Share your posts to your social networks automatically when you publish.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Reach your followers on Facebook, Instagram, Threads, Bluesky, LinkedIn, Mastodon, Nextdoor and Tumblr without leaving WordPress. Posts share automatically when you publish, and you can re-share or schedule them later.', 'jetpack-my-jetpack' ),
				'icon'             => 'share',
				'product'          => 'social',
				'interstitial'     => '/add-social',
				'paid_highlights'  => array(
					__( 'Tailor the message and media for each network', 'jetpack-my-jetpack' ),
					__( 'Save reusable message templates for each account', 'jetpack-my-jetpack' ),
					__( 'Branded share images from Social Image Generator', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack'     => true,
					'standalone'     => __( 'Jetpack Social', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/jetpack-social/',
					'free'           => true,
				),
				'plans'            => array( 'growth', 'complete' ),
				'paid_product'     => __( 'Jetpack Social', 'jetpack-my-jetpack' ),
			),
			'stats'         => array(
				'info_url'         => 'https://jetpack.com/stats/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-stats/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/08/23631-stats-primary-desktop.png',
				'name'             => __( 'Stats', 'jetpack-my-jetpack' ),
				'description'      => __( 'See how many people visit your site and which posts they read.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Track views, visitors, top posts, referrers and visitor countries right from your WordPress dashboard. Learn what works without seeing who your individual visitors are.', 'jetpack-my-jetpack' ),
				'icon'             => 'chart-bar',
				'product'          => 'stats',
				'essential'        => true,
				'interstitial'     => '/add-stats',
				'paid_highlights'  => array(
					__( 'UTM tracking to see which campaigns bring you traffic', 'jetpack-my-jetpack' ),
					__( 'Device stats to see how visitors browse your site', 'jetpack-my-jetpack' ),
					__( 'Region and city locations, beyond country level', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'free'       => true,
				),
				'plans'            => array( 'growth', 'complete' ),
				'paid_product'     => __( 'Jetpack Stats', 'jetpack-my-jetpack' ),
			),
			'videopress'    => array(
				'info_url'         => 'https://jetpack.com/videopress/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-videopress/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/08/d3d23-videopress-built-for-wp-2x.jpeg',
				'name'             => __( 'VideoPress', 'jetpack-my-jetpack' ),
				'description'      => __( 'Share ad-free, high-quality video that keeps visitors on your site.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Your videos play in an ad-free 4K player you can match to your brand, so visitors stay on your site. Drag and drop uploads right in the WordPress editor.', 'jetpack-my-jetpack' ),
				'icon'             => 'video',
				'product'          => 'videopress',
				'interstitial'     => '/add-videopress',
				'paid_highlights'  => array(
					__( 'Unlimited videos, instead of one', 'jetpack-my-jetpack' ),
					__( 'Up to 1TB of video storage', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack'     => true,
					'standalone'     => __( 'Jetpack VideoPress', 'jetpack-my-jetpack' ),
					'standalone_url' => 'https://wordpress.org/plugins/jetpack-videopress/',
					'free'           => true,
				),
				'plans'            => array( 'complete' ),
				'paid_product'     => __( 'Jetpack VideoPress', 'jetpack-my-jetpack' ),
			),
		);
	}
}
