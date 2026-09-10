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
 * Describes the main Jetpack features and resolves each one's live state.
 *
 * The descriptive half of an entry (name, description, icon) is expected to move to a
 * WordPress.com public-api endpoint in a later iteration; the state half (status,
 * manage_url) must stay local, because only the site knows what is active on it.
 */
class Main_Features {

	/**
	 * Feature is running and has a page of its own to visit.
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
	 * `image`, `info_url` and `docs_url` point at the feature's own pages on jetpack.com.
	 *
	 * @return array
	 */
	public static function get_feature_definitions() {
		return array(
			'activity-log'  => array(
				'info_url'         => 'https://jetpack.com/security/activity-log/',
				'docs_url'         => 'https://jetpack.com/support/backup/activity-log/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2020/05/421d9-95c1d-jetpack-activity-log-ui.png',
				'name'             => __( 'Activity Log', 'jetpack-my-jetpack' ),
				'description'      => __( 'See a chronological list of every change made to your site.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'See a chronological list of every change made to your site, from published posts to plugin updates and logins. When something breaks, the log tells you what changed and when.', 'jetpack-my-jetpack' ),
				'icon'             => 'list',
				'admin_page'       => 'jetpack-activity-log',
				'paid_highlights'  => array(
					__( 'A longer history, rather than only the most recent events', 'jetpack-my-jetpack' ),
					__( 'Filter the log by person, date or type of change', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
				),
				'paid_routes'      => array(
					__( 'Included with Jetpack VaultPress Backup, Jetpack Security or Jetpack Complete.', 'jetpack-my-jetpack' ),
				),
			),
			'anti-spam'     => array(
				'info_url'         => 'https://akismet.com/',
				'docs_url'         => 'https://akismet.com/support/',
				'image'            => 'https://akismet.com/wp-content/uploads/2023/10/illo-1-1.png',
				'name'             => __( 'Akismet Anti-spam', 'jetpack-my-jetpack' ),
				'description'      => __( 'Automatically clear spam from comments and forms.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Automatically clear spam from comments and form responses before it reaches you. Every submission is checked against a network that has filtered spam for millions of sites.', 'jetpack-my-jetpack' ),
				'icon'             => 'comment',
				'product'          => 'anti-spam',
				'interstitial'     => '/add-akismet',
				'paid_highlights'  => array(
					__( 'Higher submission limits for busy sites', 'jetpack-my-jetpack' ),
					__( 'Detailed spam statistics and an advanced review queue', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => false,
					'standalone' => __( 'Akismet Anti-spam', 'jetpack-my-jetpack' ),
				),
				'paid_routes'      => array(
					__( 'Jetpack Security or Jetpack Complete.', 'jetpack-my-jetpack' ),
					__( 'Akismet Anti-spam, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'backup'        => array(
				'info_url'         => 'https://jetpack.com/backup/',
				'docs_url'         => 'https://jetpack.com/support/backup/',
				'image'            => 'https://s2.wp.com/wp-content/themes/a8c/jetpack-2026/assets/legacy-hero-visual/backup/hero-backup.jpg',
				'name'             => __( 'Backup', 'jetpack-my-jetpack' ),
				'description'      => __( 'Save every change and restore your site in one click.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Save every change as it happens and restore your whole site in one click. Backups are stored off-site, so they survive whatever happens to your host.', 'jetpack-my-jetpack' ),
				'icon'             => 'backup',
				'product'          => 'backup',
				'interstitial'     => '/add-backup',
				'paid_highlights'  => array(
					__( 'Real-time backups that save every change as it happens', 'jetpack-my-jetpack' ),
					__( 'One-click restores, including from your phone', 'jetpack-my-jetpack' ),
					__( 'A longer archive to roll back to', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'standalone' => __( 'Jetpack VaultPress Backup', 'jetpack-my-jetpack' ),
				),
				'paid_routes'      => array(
					__( 'Jetpack Security or Jetpack Complete.', 'jetpack-my-jetpack' ),
					__( 'Jetpack VaultPress Backup, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'blaze'         => array(
				'info_url'         => 'https://jetpack.com/blaze/',
				'docs_url'         => 'https://jetpack.com/support/blaze/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/03/68752-43696-hero-blaze-2x-1.png',
				'name'             => __( 'Blaze Ads', 'jetpack-my-jetpack' ),
				'description'      => __( 'Promote your posts to millions of readers across the web.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Promote your posts and pages to readers across WordPress.com and Tumblr. Campaigns start small and run for as long as you choose, with no long-term commitment.', 'jetpack-my-jetpack' ),
				'icon'             => 'megaphone',
				'admin_page'       => 'advertising',
				'module'           => 'blaze',
				'delivery'         => array(
					'in_jetpack' => true,
				),
			),
			'boost'         => array(
				'info_url'         => 'https://jetpack.com/boost/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-boost/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/08/2c483-boost_performance-2x.png',
				'name'             => __( 'Boost', 'jetpack-my-jetpack' ),
				'description'      => __( 'Make your site faster with one-click optimizations.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Make your site faster with one-click fixes for the things that slow pages down: render-blocking CSS, unused JavaScript and oversized images.', 'jetpack-my-jetpack' ),
				'icon'             => 'trending-up',
				'product'          => 'boost',
				'essential'        => true,
				'interstitial'     => '/add-boost',
				'paid_highlights'  => array(
					__( 'Critical CSS regenerated automatically whenever your site changes', 'jetpack-my-jetpack' ),
					__( 'Quality settings for the image CDN', 'jetpack-my-jetpack' ),
					__( 'Priority support from the Boost team', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => false,
					'standalone' => __( 'Jetpack Boost', 'jetpack-my-jetpack' ),
				),
				'paid_routes'      => array(
					__( 'Jetpack Complete.', 'jetpack-my-jetpack' ),
					__( 'Jetpack Boost, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'crm'           => array(
				'info_url'         => 'https://jetpackcrm.com/',
				'docs_url'         => 'https://kb.jetpackcrm.com/',
				'image'            => 'https://jetpackcrm.com/wp-content/uploads/2022/02/jpcrm-styled-1.png',
				'name'             => __( 'CRM', 'jetpack-my-jetpack' ),
				'description'      => __( 'Track leads and manage your customer relationships.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Track leads, manage contacts and keep every customer conversation in one place. Your data stays on your own site rather than in someone else’s cloud.', 'jetpack-my-jetpack' ),
				'icon'             => 'people',
				'product'          => 'crm',
				'interstitial'     => '/add-crm',
				'paid_highlights'  => array(
					__( 'Extensions for invoicing, automations and payments', 'jetpack-my-jetpack' ),
					__( 'Integrations with the tools you already bill and email from', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => false,
					'standalone' => __( 'Jetpack CRM', 'jetpack-my-jetpack' ),
				),
				'paid_routes'      => array(
					__( 'Jetpack Complete.', 'jetpack-my-jetpack' ),
					__( 'Jetpack CRM extensions, bought individually.', 'jetpack-my-jetpack' ),
				),
			),
			'jetpack-ai'    => array(
				'info_url'         => 'https://jetpack.com/ai/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-blocks/jetpack-ai-assistant-block/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/09/b76cf-48ca0-image-hero.png',
				'name'             => __( 'Jetpack AI', 'jetpack-my-jetpack' ),
				'description'      => __( 'Write, edit and translate content with an AI assistant.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Write, edit and translate content with an AI assistant built into the editor. It can draft a post, change the tone of a paragraph or turn your notes into a table.', 'jetpack-my-jetpack' ),
				'icon'             => 'star',
				'product'          => 'jetpack-ai',
				'interstitial'     => '/add-jetpack-ai',
				'paid_highlights'  => array(
					__( 'A larger monthly allowance of AI requests', 'jetpack-my-jetpack' ),
					__( 'Higher-quality models for longer pieces of writing', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
				),
				'paid_routes'      => array(
					__( 'Jetpack Complete.', 'jetpack-my-jetpack' ),
					__( 'Jetpack AI, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'jetpack-forms' => array(
				'info_url'         => 'https://jetpack.com/forms/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-blocks/contact-form/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/03/14c11-5f571-hero-forms-2x.png',
				'name'             => __( 'Forms', 'jetpack-my-jetpack' ),
				'description'      => __( 'Collect responses with forms that need no setup.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Collect responses with forms that need no setup, no third-party account and no per-response fee. Every submission lands in your dashboard and your inbox.', 'jetpack-my-jetpack' ),
				'icon'             => 'list-bullets',
				'product'          => 'jetpack-forms',
				'essential'        => true,
				'delivery'         => array(
					'in_jetpack' => true,
				),
			),
			'newsletter'    => array(
				'info_url'         => 'https://jetpack.com/newsletter/',
				'docs_url'         => 'https://jetpack.com/support/newsletter/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/04/95dca-69c7b-jetpack-newsletter-lp.png',
				'name'             => __( 'Newsletter', 'jetpack-my-jetpack' ),
				'description'      => __( 'Send your posts to subscribers by email.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Send your posts to subscribers by email the moment you publish. Readers subscribe from your own site, and the list stays yours.', 'jetpack-my-jetpack' ),
				'icon'             => 'envelope',
				'product'          => 'newsletter',
				'paid_highlights'  => array(
					__( 'Paid subscription tiers, so readers can support your writing', 'jetpack-my-jetpack' ),
					__( 'Subscriber-only posts and segments', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
				),
				'paid_routes'      => array(
					__( 'Jetpack Creator, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'podcast'       => array(
				'info_url'         => '',
				'docs_url'         => 'https://jetpack.com/support/jetpack-podcast/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/08/9c2fc-jp-sync-6397e6142b48-image-5.png',
				'name'             => __( 'Podcast', 'jetpack-my-jetpack' ),
				'description'      => __( 'Publish and manage a podcast from your site.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Publish and manage a podcast from your site, with a player your readers can use without leaving the page. Your feed stays yours to take elsewhere.', 'jetpack-my-jetpack' ),
				'icon'             => 'audio',
				'admin_page'       => 'jetpack-podcast',
				'module'           => 'podcast',
				'delivery'         => array(
					'in_jetpack' => true,
				),
			),
			'protect'       => array(
				'info_url'         => 'https://jetpack.com/protect/',
				'docs_url'         => 'https://jetpack.com/support/protect/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2024/05/6c5c0-d16e7-hero-scan-2x.png',
				'name'             => __( 'Protect', 'jetpack-my-jetpack' ),
				'description'      => __( 'Guard your site against malware and login attacks.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Guard your site against malware and brute-force login attacks. Your plugins and themes are checked against a database of known vulnerabilities, so you hear about one the moment it affects you.', 'jetpack-my-jetpack' ),
				'icon'             => 'shield',
				'product'          => 'protect',
				'essential'        => true,
				'interstitial'     => '/add-protect',
				'paid_highlights'  => array(
					__( 'Malware scanning that runs continuously, not just on demand', 'jetpack-my-jetpack' ),
					__( 'One-click fixes for most threats it finds', 'jetpack-my-jetpack' ),
					__( 'A firewall that blocks known bad traffic before it lands', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'standalone' => __( 'Jetpack Protect', 'jetpack-my-jetpack' ),
				),
				'paid_routes'      => array(
					__( 'Jetpack Security or Jetpack Complete.', 'jetpack-my-jetpack' ),
					__( 'Jetpack Scan, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'search'        => array(
				'info_url'         => 'https://jetpack.com/search/',
				'docs_url'         => 'https://jetpack.com/support/search/',
				'image'            => 'https://s2.wp.com/wp-content/themes/a8c/jetpack-2026/assets/legacy-hero-visual/search/hero-search.png',
				'name'             => __( 'Search', 'jetpack-my-jetpack' ),
				'description'      => __( 'Help visitors find what they are looking for, instantly.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Help visitors find what they are looking for instantly, with results that narrow as they type. Replaces the default WordPress search, which struggles once a site grows.', 'jetpack-my-jetpack' ),
				'icon'             => 'search',
				'product'          => 'search',
				'interstitial'     => '/add-search',
				'paid_highlights'  => array(
					__( 'Room for far more records and searches', 'jetpack-my-jetpack' ),
					__( 'Control over how results look and how they are ranked', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'standalone' => __( 'Jetpack Search', 'jetpack-my-jetpack' ),
				),
				'paid_routes'      => array(
					__( 'Jetpack Complete.', 'jetpack-my-jetpack' ),
					__( 'Jetpack Search, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'social'        => array(
				'info_url'         => 'https://jetpack.com/social/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-social/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/03/9529d-db753-lets-share-social-jetpack.png',
				'name'             => __( 'Social', 'jetpack-my-jetpack' ),
				'description'      => __( 'Share new posts to your social accounts automatically.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Share new posts to your social accounts the moment they publish. Write once, and let each network get its own version of the message.', 'jetpack-my-jetpack' ),
				'icon'             => 'share',
				'product'          => 'social',
				'interstitial'     => '/add-social',
				'paid_highlights'  => array(
					__( 'Connect an unlimited number of accounts', 'jetpack-my-jetpack' ),
					__( 'Schedule posts and re-share older ones', 'jetpack-my-jetpack' ),
					__( 'Generate a social image for every post', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'standalone' => __( 'Jetpack Social', 'jetpack-my-jetpack' ),
				),
				'paid_routes'      => array(
					__( 'Jetpack Complete or Jetpack Growth.', 'jetpack-my-jetpack' ),
					__( 'Jetpack Social, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'stats'         => array(
				'info_url'         => 'https://jetpack.com/stats/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-stats/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/08/23631-stats-primary-desktop.png',
				'name'             => __( 'Stats', 'jetpack-my-jetpack' ),
				'description'      => __( 'See who visits your site and what they read.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'See who visits your site, what they read and where they came from, in a dashboard that loads in seconds. Designed to be useful without tracking your readers around the web.', 'jetpack-my-jetpack' ),
				'icon'             => 'chart-bar',
				'product'          => 'stats',
				'essential'        => true,
				'interstitial'     => '/add-stats',
				'paid_highlights'  => array(
					__( 'The full history of your traffic, not just recent days', 'jetpack-my-jetpack' ),
					__( 'Deeper insights into referrers, devices and search terms', 'jetpack-my-jetpack' ),
					__( 'A commercial licence for business sites', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
				),
				'paid_routes'      => array(
					__( 'Jetpack Complete or Jetpack Growth.', 'jetpack-my-jetpack' ),
					__( 'Jetpack Stats, on its own.', 'jetpack-my-jetpack' ),
				),
			),
			'videopress'    => array(
				'info_url'         => 'https://jetpack.com/videopress/',
				'docs_url'         => 'https://jetpack.com/support/jetpack-videopress/',
				'image'            => 'https://jetpack.com/wp-content/uploads/2026/08/d3d23-videopress-built-for-wp-2x.jpeg',
				'name'             => __( 'VideoPress', 'jetpack-my-jetpack' ),
				'description'      => __( 'Host ad-free, high quality video on your site.', 'jetpack-my-jetpack' ),
				'long_description' => __( 'Host ad-free, high quality video on your site, in a player that never ends on somebody else’s recommendations. Upload straight from the editor.', 'jetpack-my-jetpack' ),
				'icon'             => 'video',
				'product'          => 'videopress',
				'interstitial'     => '/add-videopress',
				'paid_highlights'  => array(
					__( 'Up to 1TB of video storage', 'jetpack-my-jetpack' ),
					__( '4K resolution and a customisable player', 'jetpack-my-jetpack' ),
					__( 'No advertising, on your videos or after them', 'jetpack-my-jetpack' ),
				),
				'delivery'         => array(
					'in_jetpack' => true,
					'standalone' => __( 'Jetpack VideoPress', 'jetpack-my-jetpack' ),
				),
				'paid_routes'      => array(
					__( 'Jetpack Complete.', 'jetpack-my-jetpack' ),
					__( 'Jetpack VideoPress, on its own.', 'jetpack-my-jetpack' ),
				),
			),
		);
	}

	/**
	 * The feature catalog merged with each feature's live state, sorted by name.
	 *
	 * @return array List of features, each with slug, name, description, icon, status,
	 *               manage_url, learn_more_route and the product/module join keys.
	 */
	public static function get_features() {
		$features = array();

		foreach ( self::get_feature_definitions() as $slug => $definition ) {
			$features[] = array(
				'slug'             => $slug,
				'name'             => $definition['name'],
				'description'      => $definition['description'],
				'long_description' => $definition['long_description'] ?? '',
				'icon'             => $definition['icon'],
				'status'           => self::get_feature_status( $definition ),
				'manage_url'       => self::get_feature_manage_url( $definition ),
				'learn_more_route' => $definition['interstitial'] ?? '',
				'essential'        => ! empty( $definition['essential'] ),
				'paid_highlights'  => $definition['paid_highlights'] ?? array(),
				'paid_routes'      => $definition['paid_routes'] ?? array(),
				'delivery'         => $definition['delivery'] ?? array(),
				'screenshot'       => $definition['image'],
				'info_url'         => $definition['info_url'],
				'docs_url'         => $definition['docs_url'],
				'settings_url'     => self::get_feature_settings_url( $definition ),
				// Join keys: the UI reads live, post-mutation state from the product and
				// module stores rather than from the `status` resolved above.
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
	 * Where a feature's own settings screen lives.
	 *
	 * Must be the feature's own page: a section of the Jetpack settings screen is not a
	 * destination this list offers. No feature declares one yet, because for all fifteen
	 * the settings sit on the page `manage_url` already points at.
	 *
	 * @param array $definition A single entry from the feature catalog.
	 * @return string Admin URL, or an empty string when the feature has no separate settings.
	 */
	private static function get_feature_settings_url( array $definition ) {
		if ( empty( $definition['settings_page'] ) ) {
			return '';
		}

		return admin_url( 'admin.php?page=' . $definition['settings_page'] );
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
