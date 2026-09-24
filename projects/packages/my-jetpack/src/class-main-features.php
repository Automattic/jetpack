<?php
/**
 * Static catalog of the main Jetpack features.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Plugins_Installer;

/**
 * Describes the main Jetpack features: their copy, links and how a site owner gets each one.
 *
 * The descriptive fields may later come from a WordPress.com endpoint; what a feature is
 * delivered by stays local, since only the site knows what is installed on it.
 */
class Main_Features {

	/**
	 * A plugin is not on the site at all.
	 */
	const PLUGIN_NOT_INSTALLED = 'not-installed';

	/**
	 * A plugin is installed and switched off.
	 */
	const PLUGIN_INACTIVE = 'inactive';

	/**
	 * A plugin is installed and running.
	 */
	const PLUGIN_ACTIVE = 'active';

	/**
	 * The static feature catalog.
	 *
	 * Keyed by feature slug. `delivery` says what switches the feature: Protect and
	 * VaultPress Backup ship inside Jetpack too, but their switch is their own plugin, so
	 * they set `jetpack` false and name only that.
	 *
	 * @return array<string, array<string, mixed>> Feature definitions keyed by feature slug.
	 */
	public static function get_feature_definitions() {
		// Built once per locale: the REST route asks for it on every `rest_api_init` to
		// bound its plugin argument, and rebuilding a hundred translated strings for that
		// is a cost every request to the site pays, not just this page.
		static $definitions = array();

		$locale = get_user_locale();

		if ( isset( $definitions[ $locale ] ) ) {
			return $definitions[ $locale ];
		}

		$definitions[ $locale ] = array(
			'activity-log'  => array(
				'info_url'         => 'https://jetpack.com/security/activity-log/',
				'docs_url'         => 'https://jetpack.com/support/activity-log/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2020/05/421d9-95c1d-jetpack-activity-log-ui.png',
				'name'             => __( 'Activity Log', 'jetpack-my-jetpack' ),
				'description'      => __( 'See what changed on your site, when it happened, and who did it.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'When something breaks, see exactly what changed and who changed it, from published posts to plugin updates and logins. Every connected site gets its 20 most recent events for free.', 'jetpack-my-jetpack' ),
				'icon'             => 'list',
				'admin_page'       => 'jetpack-activity-log',
				'module'           => 'activity-log',
				'paid_highlights'  => array(
					__( '30 days of history with VaultPress Backup or Jetpack Security, a full year with Jetpack Complete', 'jetpack-my-jetpack' ),
					__( 'Filter events by activity type and date range', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'jetpack' => true,
					'plugin'  => '',
					'free'    => true,
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
					'jetpack'     => false,
					'plugin'      => 'akismet',
					'plugin_name' => __( 'Akismet Anti-spam', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/akismet/',
					'free'        => true,
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
					'jetpack'     => false,
					'plugin'      => 'jetpack-backup',
					'plugin_name' => __( 'Jetpack VaultPress Backup', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/jetpack-backup/',
					'free'        => false,
				),
				'plans'            => array( 'security', 'complete' ),
				'paid_product'     => __( 'Jetpack VaultPress Backup', 'jetpack-my-jetpack' ),
			),
			'blaze'         => array(
				'info_url'         => 'https://jetpack.com/blaze/',
				'docs_url'         => 'https://jetpack.com/support/blaze/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/03/68752-43696-hero-blaze-2x-1.png',
				'name'             => __( 'Blaze Ads', 'jetpack-my-jetpack' ),
				'description'      => __( 'Put your best posts in front of new readers on WordPress.com and Tumblr.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Turn a post or page into an ad shown across Tumblr and WordPress.com, aimed at the locations, languages and interests you choose. There is no plan to buy: set a budget for each campaign and pay only for the ad views you get.', 'jetpack-my-jetpack' ),
				'icon'             => 'megaphone',
				'admin_page'       => 'advertising',
				'module'           => 'blaze',
				'delivery'         => array(
					'jetpack'     => true,
					'plugin'      => 'blaze-ads',
					'plugin_name' => __( 'Blaze Ads', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/blaze-ads/',
					'free'        => false,
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
					'jetpack'     => false,
					'plugin'      => 'jetpack-boost',
					'plugin_name' => __( 'Jetpack Boost', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/jetpack-boost/',
					'free'        => true,
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
					'jetpack'     => false,
					'plugin'      => 'zero-bs-crm',
					'plugin_name' => __( 'Jetpack CRM', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/zero-bs-crm/',
					'free'        => true,
				),
				'plans'            => array( 'complete' ),
				'paid_product'     => __( 'Jetpack CRM Entrepreneur', 'jetpack-my-jetpack' ),
			),
			'jetpack-ai'    => array(
				'info_url'         => 'https://jetpack.com/ai/',
				'docs_url'         => 'https://jetpack.com/support/create-better-content-with-jetpack-ai/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/09/b76cf-48ca0-image-hero.png',
				'name'             => __( 'Jetpack AI', 'jetpack-my-jetpack' ),
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
					'jetpack' => true,
					'plugin'  => '',
					'free'    => true,
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
					'jetpack' => true,
					'plugin'  => '',
					'free'    => true,
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
				'module'           => 'subscriptions',
				'paid_highlights'  => array(
					__( 'Keep more of what you earn with lower fees on paid subscriptions', 'jetpack-my-jetpack' ),
					__( 'Import as many subscribers as you like', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'jetpack' => true,
					'plugin'  => '',
					'free'    => true,
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
					'jetpack' => true,
					'plugin'  => '',
					'free'    => true,
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
					'jetpack'     => false,
					'plugin'      => 'jetpack-protect',
					'plugin_name' => __( 'Jetpack Protect', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/jetpack-protect/',
					'free'        => true,
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
					'jetpack'     => true,
					'plugin'      => 'jetpack-search',
					'plugin_name' => __( 'Jetpack Search', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/jetpack-search/',
					'free'        => true,
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
					'jetpack'     => true,
					'plugin'      => 'jetpack-social',
					'plugin_name' => __( 'Jetpack Social', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/jetpack-social/',
					'free'        => true,
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
					'jetpack'     => true,
					'plugin'      => 'jetpack-stats',
					'plugin_name' => __( 'Jetpack Stats', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/jetpack-stats/',
					'free'        => true,
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
					'jetpack'     => true,
					'plugin'      => 'jetpack-videopress',
					'plugin_name' => __( 'Jetpack VideoPress', 'jetpack-my-jetpack' ),
					'plugin_url'  => 'https://wordpress.org/plugins/jetpack-videopress/',
					'free'        => true,
				),
				'plans'            => array( 'complete' ),
				'paid_product'     => __( 'Jetpack VideoPress', 'jetpack-my-jetpack' ),
			),
		);

		return $definitions[ $locale ];
	}

	/**
	 * The paid bundles that include a feature, named for display.
	 *
	 * Named by the bundle products themselves, so the Features tab and the Products tab
	 * call a plan the same thing.
	 *
	 * @param array $definition One feature's catalog entry.
	 * @return array List of slug/name pairs.
	 */
	private static function get_plan_badges( $definition ) {
		$badges = array();

		foreach ( $definition['plans'] ?? array() as $slug ) {
			$bundle_class = Products::get_product_class( $slug );

			if ( $bundle_class ) {
				$badges[] = array(
					'slug' => $slug,
					'name' => $bundle_class::get_title(),
				);
			}
		}

		return $badges;
	}

	/**
	 * The plugins the Features tab may install or switch: every standalone plugin in the map,
	 * and Jetpack itself.
	 *
	 * @return string[] WordPress.org plugin slugs.
	 */
	public static function get_switchable_plugins() {
		$plugins = array_filter( array_column( array_column( self::get_feature_definitions(), 'delivery' ), 'plugin' ) );

		return array_values( array_unique( array_merge( array( Product::JETPACK_PLUGIN_SLUG ), $plugins ) ) );
	}

	/**
	 * Whether a plugin is missing, installed and off, or running.
	 *
	 * @param string      $slug          WordPress.org plugin slug.
	 * @param string|null $product_class The product behind the plugin, when it has one.
	 * @return string One of the PLUGIN_* constants.
	 */
	public static function get_plugin_status( $slug, $product_class = null ) {
		$file = self::get_plugin_file( $slug, $product_class );

		if ( ! $file ) {
			return self::PLUGIN_NOT_INSTALLED;
		}

		// A network-activated plugin is running here, whatever this site's own list says.
		return 'inactive' === Plugins_Installer::get_plugin_status( $file )
			? self::PLUGIN_INACTIVE
			: self::PLUGIN_ACTIVE;
	}

	/**
	 * Whether a plugin is forced on or off where this site's own switch can't change it.
	 *
	 * Mirrors `Jetpack_Modules_Overrides`: an `option_active_plugins` filter that adds or
	 * drops the plugin whatever the stored list says, or a network activation.
	 *
	 * @since 6.6.0
	 *
	 * @param string      $slug          WordPress.org plugin slug.
	 * @param string|null $product_class The product behind the plugin, when it has one.
	 * @return string 'active' or 'inactive' when forced, or an empty string when the owner decides.
	 */
	public static function get_plugin_override( $slug, $product_class = null ) {
		$file = self::get_plugin_file( $slug, $product_class );

		if ( ! $file ) {
			return '';
		}

		if ( 'network-active' === Plugins_Installer::get_plugin_status( $file ) ) {
			return self::PLUGIN_ACTIVE;
		}

		if ( ! has_filter( 'option_active_plugins' ) ) {
			return '';
		}

		/** This filter is documented in wp-includes/option.php */
		if ( in_array( $file, (array) apply_filters( 'option_active_plugins', array(), 'active_plugins' ), true ) ) {
			return self::PLUGIN_ACTIVE;
		}

		/** This filter is documented in wp-includes/option.php */
		if ( ! in_array( $file, (array) apply_filters( 'option_active_plugins', array( $file ), 'active_plugins' ), true ) ) {
			return self::PLUGIN_INACTIVE;
		}

		return '';
	}

	/**
	 * The installed file for a plugin, by the names its product declares where there is one.
	 *
	 * A product lists every folder its plugin ships under, including the -dev checkout.
	 *
	 * @param string      $slug          WordPress.org plugin slug.
	 * @param string|null $product_class The product behind the plugin, when it has one.
	 * @return string|false The plugin file, or false when it is not installed.
	 */
	public static function get_plugin_file( $slug, $product_class = null ) {
		if ( Product::JETPACK_PLUGIN_SLUG === $slug ) {
			return Product::get_installed_plugin_filename( 'jetpack' ) ?? false;
		}

		if ( $product_class && $product_class::$has_standalone_plugin ) {
			return $product_class::get_installed_plugin_filename();
		}

		return Plugins_Installer::get_plugin_id_by_slug( $slug );
	}

	/**
	 * The plugin this copy of My Jetpack is running from.
	 *
	 * My Jetpack ships inside Jetpack, Boost, Protect, Social, Search and VideoPress, and
	 * whichever one wins the autoloader renders this page — so that is the plugin a switch
	 * here must never turn off.
	 *
	 * @return string The plugin's folder name, or an empty string when it is not under one.
	 */
	public static function get_hosting_plugin_slug() {
		return self::plugin_slug_from_path( WP_PLUGIN_DIR, __DIR__ );
	}

	/**
	 * Whether a plugin slug names the plugin this copy of My Jetpack runs from.
	 *
	 * Compared by folder rather than by slug: a checkout in `jetpack-protect-dev` serves
	 * the page just as well, and never equals the `jetpack-protect` a request carries.
	 *
	 * @param string $slug WordPress.org plugin slug.
	 * @return bool True when the plugin is the one this page is being served from.
	 */
	public static function is_hosting_plugin( $slug ) {
		$host = self::get_hosting_plugin_slug();

		if ( '' === $host ) {
			return false;
		}

		$file = self::get_plugin_file( $slug, self::get_product_class_for_plugin( $slug ) );

		return $file ? dirname( (string) $file ) === $host : $host === $slug;
	}

	/**
	 * The plugin folder a path sits in.
	 *
	 * @param string $plugins_dir The plugin directory, as WP_PLUGIN_DIR gives it.
	 * @param string $path        The path to place.
	 * @return string The plugin's folder name, or an empty string when the path is outside.
	 */
	public static function plugin_slug_from_path( $plugins_dir, $path ) {
		$plugins_dir = wp_normalize_path( trailingslashit( $plugins_dir ) );
		$path        = wp_normalize_path( $path );

		if ( ! str_starts_with( $path, $plugins_dir ) ) {
			return '';
		}

		$segments = explode( '/', substr( $path, strlen( $plugins_dir ) ) );

		return $segments[0];
	}

	/**
	 * Whether this plugin is the only active one carrying My Jetpack.
	 *
	 * Several plugins bundle it and the autoloader picks one, so the plugin serving this
	 * page is often not the only one that could. Switching that one off is only a problem
	 * when nothing else is left to take over.
	 *
	 * @param string $slug The plugin's folder name.
	 * @return bool True when no other active plugin carries My Jetpack.
	 */
	public static function is_only_my_jetpack_provider( $slug ) {
		$active = array_merge(
			(array) get_option( 'active_plugins', array() ),
			array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) )
		);

		foreach ( $active as $file ) {
			$folder = dirname( (string) $file );

			if ( '.' === $folder || $folder === $slug ) {
				continue;
			}

			if ( is_dir( WP_PLUGIN_DIR . '/' . $folder . '/jetpack_vendor/automattic/jetpack-my-jetpack' ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * The product class behind a plugin in the map, for surfaces holding only its slug.
	 *
	 * @param string $slug WordPress.org plugin slug.
	 * @return string|null The product class, or null when no product ships that plugin.
	 */
	public static function get_product_class_for_plugin( $slug ) {
		foreach ( self::get_feature_definitions() as $definition ) {
			if ( ( $definition['delivery']['plugin'] ?? '' ) !== $slug || ! isset( $definition['product'] ) ) {
				continue;
			}

			$product_class = Products::get_product_class( $definition['product'] );

			if ( $product_class && $product_class::$has_standalone_plugin ) {
				return $product_class;
			}
		}

		return null;
	}

	/**
	 * Everything the Features tab renders from: the Jetpack plugin's status and each feature.
	 *
	 * @return array{jetpack: string, features: array} The state.
	 */
	public static function get_state() {
		return array(
			'jetpack'  => self::get_plugin_status( Product::JETPACK_PLUGIN_SLUG ),
			'features' => self::get_features(),
		);
	}

	/**
	 * The feature catalog merged with each feature's live state, sorted by name.
	 *
	 * @return array List of features, each with slug, name, description, icon, manage_url,
	 *               the plugin it ships as and the product/module join keys.
	 */
	public static function get_features() {
		$features = array();
		$hidden   = Feature_Visibility::get_hidden();

		foreach ( self::get_feature_definitions() as $slug => $definition ) {
			// A host can name the feature by its own slug or by its product's or module's.
			$names = array_filter( array( $slug, $definition['product'] ?? '', $definition['module'] ?? '' ) );
			if ( array_intersect( $names, $hidden ) ) {
				continue;
			}

			$delivery      = $definition['delivery'] ?? array();
			$plugin        = $delivery['plugin'] ?? '';
			$product_class = isset( $definition['product'] ) ? Products::get_product_class( $definition['product'] ) : null;

			$features[] = array(
				'slug'             => $slug,
				'name'             => $definition['name'],
				'description'      => $definition['description'],
				'long_description' => $definition['long_description'] ?? '',
				'icon'             => $definition['icon'],
				'manage_url'       => self::get_feature_manage_url( $definition, $product_class ),
				'essential'        => ! empty( $definition['essential'] ),
				'in_jetpack'       => $delivery['jetpack'] ?? false,
				'plugin'           => $plugin,
				'plugin_name'      => $plugin ? ( $delivery['plugin_name'] ?? $definition['name'] ) : '',
				'plugin_url'       => $plugin ? ( $delivery['plugin_url'] ?? '' ) : '',
				'plugin_status'    => $plugin ? self::get_plugin_status( $plugin, $product_class ) : self::PLUGIN_NOT_INSTALLED,
				'plugin_override'  => $plugin ? self::get_plugin_override( $plugin, $product_class ) : '',
				'paid_highlights'  => $definition['paid_highlights'] ?? array(),
				'plans'            => self::get_plan_badges( $definition ),
				'paid_product'     => $definition['paid_product'] ?? '',
				'screenshot'       => $definition['image'],
				'info_url'         => $definition['info_url'],
				'docs_url'         => $definition['docs_url'],
				// Join keys: the UI reads live state from the module and plugin it names,
				// so the catalog never ships a status of its own.
				'product'          => $definition['product'] ?? '',
				'module'           => $definition['module'] ?? '',
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
	 * Where an active feature lives.
	 *
	 * @param array       $definition    A single entry from the feature catalog.
	 * @param string|null $product_class The product behind the feature, when it has one.
	 * @return string Admin URL, or an empty string when the feature has nowhere to go.
	 */
	private static function get_feature_manage_url( array $definition, $product_class = null ) {
		if ( isset( $definition['admin_page'] ) ) {
			return admin_url( 'admin.php?page=' . $definition['admin_page'] );
		}

		if ( $product_class ) {
			return (string) $product_class::get_manage_url();
		}

		return '';
	}
}
