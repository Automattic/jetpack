<?php
/**
 * Static catalog of the main Jetpack features shown on the My Jetpack Features tab.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;

/**
 * Describes the main Jetpack features and resolves each one's live state on this site.
 */
class Main_Features {

	/**
	 * Feature is running on this site.
	 */
	const STATUS_ACTIVE = 'active';

	/**
	 * Feature is available but switched off, so we offer to explain it.
	 */
	const STATUS_INACTIVE = 'inactive';

	/**
	 * The static feature catalog.
	 *
	 * Keys are feature slugs. `product` names a My Jetpack product class to borrow state
	 * from; features with no product class instead carry `admin_page`, plus `module` when
	 * a Jetpack module governs them. `essential` marks a feature every site should run.
	 * `image`, `info_url` and `docs_url` point at the feature's own public pages.
	 *
	 * How a site owner gets a feature: `delivery.in_jetpack` says the Jetpack plugin ships
	 * it, `delivery.standalone` and `delivery.standalone_url` name a separate plugin that also
	 * does and its WordPress.org page, and `delivery.free` says it can be used without paying. `paid_highlights` lists what paying adds,
	 * `paid_product` names what to buy, and `plans` lists the bundles that include it.
	 *
	 * @return array
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
				'long_description' => __( 'Break long forms into steps with a progress bar, and get every response by email and in your dashboard, with no limit on responses. Secure file uploads keep harmful files off your server and your visitors’ files private.', 'jetpack-my-jetpack' ),
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

	/**
	 * The paid bundles that include a feature, named for display.
	 *
	 * Read from the catalog's hand-maintained `plans` list, not from the bundle product classes.
	 *
	 * @param array $definition One feature's catalog entry.
	 * @return array List of slug/name pairs.
	 */
	private static function get_plan_badges( array $definition ) {
		$names = array(
			'security' => __( 'Jetpack Security', 'jetpack-my-jetpack' ),
			'complete' => __( 'Jetpack Complete', 'jetpack-my-jetpack' ),
			'growth'   => __( 'Jetpack Growth', 'jetpack-my-jetpack' ),
		);

		$badges = array();

		foreach ( $definition['plans'] ?? array() as $slug ) {
			if ( isset( $names[ $slug ] ) ) {
				$badges[] = array(
					'slug' => $slug,
					'name' => $names[ $slug ],
				);
			}
		}

		return $badges;
	}

	/**
	 * The feature catalog merged with each feature's live state, sorted by name.
	 *
	 * @return array List of features: the catalog entry's copy, links and delivery details,
	 *               plus live status, manage_url, plan badges and standalone plugin link.
	 */
	public static function get_features() {
		$features = array();

		foreach ( self::get_feature_definitions() as $slug => $definition ) {
			$standalone_plugin_url = $definition['delivery']['standalone_url'] ?? '';

			$features[] = array(
				'slug'                  => $slug,
				'name'                  => $definition['name'],
				'description'           => $definition['description'],
				'long_description'      => $definition['long_description'] ?? '',
				'icon'                  => $definition['icon'],
				'status'                => self::get_feature_status( $definition ),
				'manage_url'            => self::get_feature_manage_url( $definition ),
				'learn_more_route'      => $definition['interstitial'] ?? '',
				'essential'             => ! empty( $definition['essential'] ),
				'paid_highlights'       => $definition['paid_highlights'] ?? array(),
				'plans'                 => self::get_plan_badges( $definition ),
				'paid_product'          => $definition['paid_product'] ?? '',
				'delivery'              => $definition['delivery'] ?? array(),
				'has_standalone_plugin' => '' !== $standalone_plugin_url,
				'standalone_plugin_url' => $standalone_plugin_url,
				'screenshot'            => $definition['image'],
				'info_url'              => $definition['info_url'],
				'docs_url'              => $definition['docs_url'],
				// Join keys: the UI reads live, post-mutation state from the product and
				// module stores rather than from the `status` resolved above.
				'product'               => $definition['product'] ?? '',
				'module'                => $definition['module'] ?? '',
			);
		}

		usort(
			$features,
			function ( $a, $b ) {
				return strnatcasecmp( $a['name'], $b['name'] );
			}
		);

		return $features;
	}

	/**
	 * Resolve whether a feature is currently running on this site.
	 *
	 * @param array $definition A single entry from the feature catalog.
	 * @return string One of the STATUS_* constants.
	 */
	private static function get_feature_status( array $definition ) {
		if ( isset( $definition['product'] ) ) {
			$product_class = Products::get_product_class( $definition['product'] );

			return $product_class && $product_class::is_active() ? self::STATUS_ACTIVE : self::STATUS_INACTIVE;
		}

		if ( isset( $definition['module'] ) ) {
			return ( new Modules() )->is_active( $definition['module'] ) ? self::STATUS_ACTIVE : self::STATUS_INACTIVE;
		}

		// Features with neither a product nor a module are hosted on WordPress.com and
		// need the site connection to show anything at all.
		return ( new Connection_Manager() )->is_connected() ? self::STATUS_ACTIVE : self::STATUS_INACTIVE;
	}

	/**
	 * Modules Jetpack itself tags as recommended.
	 *
	 * The tag lives on the module definition and never reaches the browser, so the
	 * Recommended filter needs it passed through explicitly.
	 *
	 * @return string[] Module slugs.
	 */
	public static function get_recommended_modules() {
		$recommended = array();

		$modules = new Modules();

		foreach ( $modules->get_available() as $slug ) {
			$module = $modules->get( $slug );

			if ( in_array( 'Recommended', (array) ( $module['feature'] ?? array() ), true ) ) {
				$recommended[] = $slug;
			}
		}

		return $recommended;
	}

	/**
	 * Headings for the modules the feature list does not cover.
	 *
	 * Grouped by the job a site owner is doing, not by Jetpack's own module tags, which
	 * describe mechanism instead: the Image CDN is tagged Appearance though its job is
	 * speed. A module missing from here falls into Other rather than disappearing.
	 *
	 * @return array Ordered groups, each with a label and its module slugs.
	 */
	public static function get_module_groups() {
		return array(
			array(
				'label'   => __( 'Security', 'jetpack-my-jetpack' ),
				'modules' => array( 'account-protection', 'monitor', 'sso', 'waf', 'vaultpress' ),
			),
			array(
				'label'   => __( 'Performance', 'jetpack-my-jetpack' ),
				'modules' => array( 'photon', 'photon-cdn' ),
			),
			array(
				'label'   => __( 'Search engines', 'jetpack-my-jetpack' ),
				'modules' => array( 'sitemaps', 'seo-tools', 'canonical-urls', 'verification-tools' ),
			),
			array(
				'label'   => __( 'Engagement', 'jetpack-my-jetpack' ),
				'modules' => array(
					'comments',
					'likes',
					'comment-likes',
					'gravatar-hovercards',
					'related-posts',
					'infinite-scroll',
					'sharedaddy',
				),
			),
			array(
				'label'   => __( 'Writing', 'jetpack-my-jetpack' ),
				'modules' => array(
					'blocks',
					'markdown',
					'latex',
					'shortcodes',
					'copy-post',
					'custom-content-types',
					'post-by-email',
					'post-list',
					'carousel',
					'tiled-gallery',
					'shortlinks',
				),
			),
			array(
				'label'   => __( 'Design', 'jetpack-my-jetpack' ),
				'modules' => array( 'google-fonts', 'widgets', 'widget-visibility' ),
			),
			array(
				'label'   => __( 'Earn', 'jetpack-my-jetpack' ),
				'modules' => array( 'wordads' ),
			),
			array(
				'label'   => __( 'Analytics', 'jetpack-my-jetpack' ),
				'modules' => array( 'woocommerce-analytics' ),
			),
		);
	}

	/**
	 * The Jetpack modules the feature list already accounts for.
	 *
	 * Each feature either names a module outright or is backed by a product that runs
	 * one. The remainder is what the More features tab has left to show, so this is the
	 * single place that decides which side of that line a module falls on.
	 *
	 * @return string[] Module slugs, unsorted.
	 */
	public static function get_covered_modules() {
		$modules = array();

		foreach ( self::get_feature_definitions() as $definition ) {
			if ( ! empty( $definition['module'] ) ) {
				$modules[] = $definition['module'];
			}

			if ( empty( $definition['product'] ) ) {
				continue;
			}

			$product_class = Products::get_product_class( $definition['product'] );

			if ( $product_class && ! empty( $product_class::$module_name ) ) {
				$modules[] = $product_class::$module_name;
			}
		}

		return array_values( array_unique( $modules ) );
	}

	/**
	 * Where an active feature lives.
	 *
	 * @param array $definition A single entry from the feature catalog.
	 * @return string Admin URL, or an empty string when the feature has nowhere to go.
	 */
	private static function get_feature_manage_url( array $definition ) {
		if ( isset( $definition['admin_page'] ) ) {
			return admin_url( 'admin.php?page=' . $definition['admin_page'] );
		}

		if ( isset( $definition['product'] ) ) {
			$product_class = Products::get_product_class( $definition['product'] );

			if ( $product_class ) {
				return (string) $product_class::get_manage_url();
			}
		}

		return '';
	}
}
