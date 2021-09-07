<?php

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;
use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Nonce_Handler;
use Automattic\Jetpack\Connection\Plugin_Storage as Connection_Plugin_Storage;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Connection\Secrets;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Connection\Webhooks as Connection_Webhooks;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Licensing;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Plugin\Tracking as Plugin_Tracking;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Sync\Functions;
use Automattic\Jetpack\Sync\Health;
use Automattic\Jetpack\Sync\Sender;
use Automattic\Jetpack\Sync\Users;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

/*
Options:
jetpack_options (array)
	An array of options.
	@see Jetpack_Options::get_option_names()

jetpack_register (string)
	Temporary verification secrets.

jetpack_activated (int)
	1: the plugin was activated normally
	2: the plugin was activated on this site because of a network-wide activation
	3: the plugin was auto-installed
	4: the plugin was manually disconnected (but is still installed)

jetpack_active_modules (array)
	Array of active module slugs.

jetpack_do_activate (bool)
	Flag for "activating" the plugin on sites where the activation hook never fired (auto-installs)
*/

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.media.php';

class Jetpack {
	public $xmlrpc_server = null;

	/**
	 * @var array The handles of styles that are concatenated into jetpack.css.
	 *
	 * When making changes to that list, you must also update concat_list in tools/builder/frontend-css.js.
	 */
	public $concatenated_style_handles = array(
		'jetpack-carousel-swiper-css',
		'jetpack-carousel',
		'grunion.css',
		'the-neverending-homepage',
		'jetpack_likes',
		'jetpack_related-posts',
		'sharedaddy',
		'jetpack-slideshow',
		'presentations',
		'quiz',
		'jetpack-subscriptions',
		'jetpack-responsive-videos-style',
		'jetpack-social-menu',
		'tiled-gallery',
		'jetpack_display_posts_widget',
		'gravatar-profile-widget',
		'goodreads-widget',
		'jetpack_social_media_icons_widget',
		'jetpack-top-posts-widget',
		'jetpack_image_widget',
		'jetpack-my-community-widget',
		'jetpack-authors-widget',
		'wordads',
		'eu-cookie-law-style',
		'flickr-widget-style',
		'jetpack-search-widget',
		'jetpack-simple-payments-widget-style',
		'jetpack-widget-social-icons-styles',
		'wpcom_instagram_widget',
	);

	/**
	 * Contains all assets that have had their URL rewritten to minified versions.
	 *
	 * @var array
	 */
	static $min_assets = array();

	public $plugins_to_deactivate = array(
		'stats'               => array( 'stats/stats.php', 'WordPress.com Stats' ),
		'shortlinks'          => array( 'stats/stats.php', 'WordPress.com Stats' ),
		'sharedaddy'          => array( 'sharedaddy/sharedaddy.php', 'Sharedaddy' ),
		'twitter-widget'      => array( 'wickett-twitter-widget/wickett-twitter-widget.php', 'Wickett Twitter Widget' ),
		'contact-form'        => array( 'grunion-contact-form/grunion-contact-form.php', 'Grunion Contact Form' ),
		'contact-form'        => array( 'mullet/mullet-contact-form.php', 'Mullet Contact Form' ),
		'custom-css'          => array( 'safecss/safecss.php', 'WordPress.com Custom CSS' ),
		'random-redirect'     => array( 'random-redirect/random-redirect.php', 'Random Redirect' ),
		'videopress'          => array( 'video/video.php', 'VideoPress' ),
		'widget-visibility'   => array( 'jetpack-widget-visibility/widget-visibility.php', 'Jetpack Widget Visibility' ),
		'widget-visibility'   => array( 'widget-visibility-without-jetpack/widget-visibility-without-jetpack.php', 'Widget Visibility Without Jetpack' ),
		'sharedaddy'          => array( 'jetpack-sharing/sharedaddy.php', 'Jetpack Sharing' ),
		'gravatar-hovercards' => array( 'jetpack-gravatar-hovercards/gravatar-hovercards.php', 'Jetpack Gravatar Hovercards' ),
		'latex'               => array( 'wp-latex/wp-latex.php', 'WP LaTeX' ),
	);

	/**
	 * Map of roles we care about, and their corresponding minimum capabilities.
	 *
	 * @deprecated 7.6 Use Automattic\Jetpack\Roles::$capability_translations instead.
	 *
	 * @access public
	 * @static
	 *
	 * @var array
	 */
	public static $capability_translations = array(
		'administrator' => 'manage_options',
		'editor'        => 'edit_others_posts',
		'author'        => 'publish_posts',
		'contributor'   => 'edit_posts',
		'subscriber'    => 'read',
	);

	/**
	 * Map of modules that have conflicts with plugins and should not be auto-activated
	 * if the plugins are active.  Used by filter_default_modules
	 *
	 * Plugin Authors: If you'd like to prevent a single module from auto-activating,
	 * change `module-slug` and add this to your plugin:
	 *
	 * add_filter( 'jetpack_get_default_modules', 'my_jetpack_get_default_modules' );
	 * function my_jetpack_get_default_modules( $modules ) {
	 *     return array_diff( $modules, array( 'module-slug' ) );
	 * }
	 *
	 * @var array
	 */
	private $conflicting_plugins = array(
		'comments'           => array(
			'Intense Debate'                 => 'intensedebate/intensedebate.php',
			'Disqus'                         => 'disqus-comment-system/disqus.php',
			'Livefyre'                       => 'livefyre-comments/livefyre.php',
			'Comments Evolved for WordPress' => 'gplus-comments/comments-evolved.php',
			'Google+ Comments'               => 'google-plus-comments/google-plus-comments.php',
			'WP-SpamShield Anti-Spam'        => 'wp-spamshield/wp-spamshield.php',
		),
		'comment-likes'      => array(
			'Epoch' => 'epoch/plugincore.php',
		),
		'contact-form'       => array(
			'Contact Form 7'           => 'contact-form-7/wp-contact-form-7.php',
			'Gravity Forms'            => 'gravityforms/gravityforms.php',
			'Contact Form Plugin'      => 'contact-form-plugin/contact_form.php',
			'Easy Contact Forms'       => 'easy-contact-forms/easy-contact-forms.php',
			'Fast Secure Contact Form' => 'si-contact-form/si-contact-form.php',
			'Ninja Forms'              => 'ninja-forms/ninja-forms.php',
		),
		'latex'              => array(
			'LaTeX for WordPress'     => 'latex/latex.php',
			'Youngwhans Simple Latex' => 'youngwhans-simple-latex/yw-latex.php',
			'Easy WP LaTeX'           => 'easy-wp-latex-lite/easy-wp-latex-lite.php',
			'MathJax-LaTeX'           => 'mathjax-latex/mathjax-latex.php',
			'Enable Latex'            => 'enable-latex/enable-latex.php',
			'WP QuickLaTeX'           => 'wp-quicklatex/wp-quicklatex.php',
		),
		'protect'            => array(
			'Limit Login Attempts'              => 'limit-login-attempts/limit-login-attempts.php',
			'Captcha'                           => 'captcha/captcha.php',
			'Brute Force Login Protection'      => 'brute-force-login-protection/brute-force-login-protection.php',
			'Login Security Solution'           => 'login-security-solution/login-security-solution.php',
			'WPSecureOps Brute Force Protect'   => 'wpsecureops-bruteforce-protect/wpsecureops-bruteforce-protect.php',
			'BulletProof Security'              => 'bulletproof-security/bulletproof-security.php',
			'SiteGuard WP Plugin'               => 'siteguard/siteguard.php',
			'Security-protection'               => 'security-protection/security-protection.php',
			'Login Security'                    => 'login-security/login-security.php',
			'Botnet Attack Blocker'             => 'botnet-attack-blocker/botnet-attack-blocker.php',
			'Wordfence Security'                => 'wordfence/wordfence.php',
			'All In One WP Security & Firewall' => 'all-in-one-wp-security-and-firewall/wp-security.php',
			'iThemes Security'                  => 'better-wp-security/better-wp-security.php',
		),
		'random-redirect'    => array(
			'Random Redirect 2' => 'random-redirect-2/random-redirect.php',
		),
		'related-posts'      => array(
			'YARPP'                       => 'yet-another-related-posts-plugin/yarpp.php',
			'WordPress Related Posts'     => 'wordpress-23-related-posts-plugin/wp_related_posts.php',
			'nrelate Related Content'     => 'nrelate-related-content/nrelate-related.php',
			'Contextual Related Posts'    => 'contextual-related-posts/contextual-related-posts.php',
			'Related Posts for WordPress' => 'microkids-related-posts/microkids-related-posts.php',
			'outbrain'                    => 'outbrain/outbrain.php',
			'Shareaholic'                 => 'shareaholic/shareaholic.php',
			'Sexybookmarks'               => 'sexybookmarks/shareaholic.php',
		),
		'sharedaddy'         => array(
			'AddThis'     => 'addthis/addthis_social_widget.php',
			'Add To Any'  => 'add-to-any/add-to-any.php',
			'ShareThis'   => 'share-this/sharethis.php',
			'Shareaholic' => 'shareaholic/shareaholic.php',
		),
		'seo-tools'          => array(
			'WordPress SEO by Yoast'         => 'wordpress-seo/wp-seo.php',
			'WordPress SEO Premium by Yoast' => 'wordpress-seo-premium/wp-seo-premium.php',
			'All in One SEO Pack'            => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
			'All in One SEO Pack Pro'        => 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
			'The SEO Framework'              => 'autodescription/autodescription.php',
			'Rank Math'                      => 'seo-by-rank-math/rank-math.php',
			'Slim SEO'                       => 'slim-seo/slim-seo.php',
		),
		'verification-tools' => array(
			'WordPress SEO by Yoast'         => 'wordpress-seo/wp-seo.php',
			'WordPress SEO Premium by Yoast' => 'wordpress-seo-premium/wp-seo-premium.php',
			'All in One SEO Pack'            => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
			'All in One SEO Pack Pro'        => 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
			'The SEO Framework'              => 'autodescription/autodescription.php',
			'Rank Math'                      => 'seo-by-rank-math/rank-math.php',
			'Slim SEO'                       => 'slim-seo/slim-seo.php',
		),
		'widget-visibility'  => array(
			'Widget Logic'    => 'widget-logic/widget_logic.php',
			'Dynamic Widgets' => 'dynamic-widgets/dynamic-widgets.php',
		),
		'sitemaps'           => array(
			'Google XML Sitemaps'                  => 'google-sitemap-generator/sitemap.php',
			'Better WordPress Google XML Sitemaps' => 'bwp-google-xml-sitemaps/bwp-simple-gxs.php',
			'Google XML Sitemaps for qTranslate'   => 'google-xml-sitemaps-v3-for-qtranslate/sitemap.php',
			'XML Sitemap & Google News feeds'      => 'xml-sitemap-feed/xml-sitemap.php',
			'Google Sitemap by BestWebSoft'        => 'google-sitemap-plugin/google-sitemap-plugin.php',
			'WordPress SEO by Yoast'               => 'wordpress-seo/wp-seo.php',
			'WordPress SEO Premium by Yoast'       => 'wordpress-seo-premium/wp-seo-premium.php',
			'All in One SEO Pack'                  => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
			'All in One SEO Pack Pro'              => 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
			'The SEO Framework'                    => 'autodescription/autodescription.php',
			'Sitemap'                              => 'sitemap/sitemap.php',
			'Simple Wp Sitemap'                    => 'simple-wp-sitemap/simple-wp-sitemap.php',
			'Simple Sitemap'                       => 'simple-sitemap/simple-sitemap.php',
			'XML Sitemaps'                         => 'xml-sitemaps/xml-sitemaps.php',
			'MSM Sitemaps'                         => 'msm-sitemap/msm-sitemap.php',
			'Rank Math'                            => 'seo-by-rank-math/rank-math.php',
			'Slim SEO'                             => 'slim-seo/slim-seo.php',
		),
		'lazy-images'        => array(
			'Lazy Load'              => 'lazy-load/lazy-load.php',
			'BJ Lazy Load'           => 'bj-lazy-load/bj-lazy-load.php',
			'Lazy Load by WP Rocket' => 'rocket-lazy-load/rocket-lazy-load.php',
		),
	);

	/**
	 * Plugins for which we turn off our Facebook OG Tags implementation.
	 *
	 * Note: All in One SEO Pack, All in one SEO Pack Pro, WordPress SEO by Yoast, and WordPress SEO Premium by Yoast automatically deactivate
	 * Jetpack's Open Graph tags via filter when their Social Meta modules are active.
	 *
	 * Plugin authors: If you'd like to prevent Jetpack's Open Graph tag generation in your plugin, you can do so via this filter:
	 * add_filter( 'jetpack_enable_open_graph', '__return_false' );
	 */
	private $open_graph_conflicting_plugins = array(
		'2-click-socialmedia-buttons/2-click-socialmedia-buttons.php',
		// 2 Click Social Media Buttons
		'add-link-to-facebook/add-link-to-facebook.php',         // Add Link to Facebook
		'add-meta-tags/add-meta-tags.php',                       // Add Meta Tags
		'complete-open-graph/complete-open-graph.php',           // Complete Open Graph
		'easy-facebook-share-thumbnails/esft.php',               // Easy Facebook Share Thumbnail
		'heateor-open-graph-meta-tags/heateor-open-graph-meta-tags.php',
		// Open Graph Meta Tags by Heateor
		'facebook/facebook.php',                                 // Facebook (official plugin)
		'facebook-awd/AWD_facebook.php',                         // Facebook AWD All in one
		'facebook-featured-image-and-open-graph-meta-tags/fb-featured-image.php',
		// Facebook Featured Image & OG Meta Tags
		'facebook-meta-tags/facebook-metatags.php',              // Facebook Meta Tags
		'wonderm00ns-simple-facebook-open-graph-tags/wonderm00n-open-graph.php',
		// Facebook Open Graph Meta Tags for WordPress
		'facebook-revised-open-graph-meta-tag/index.php',        // Facebook Revised Open Graph Meta Tag
		'facebook-thumb-fixer/_facebook-thumb-fixer.php',        // Facebook Thumb Fixer
		'facebook-and-digg-thumbnail-generator/facebook-and-digg-thumbnail-generator.php',
		// Fedmich's Facebook Open Graph Meta
		'network-publisher/networkpub.php',                      // Network Publisher
		'nextgen-facebook/nextgen-facebook.php',                 // NextGEN Facebook OG
		'social-networks-auto-poster-facebook-twitter-g/NextScripts_SNAP.php',
		// NextScripts SNAP
		'og-tags/og-tags.php',                                   // OG Tags
		'opengraph/opengraph.php',                               // Open Graph
		'open-graph-protocol-framework/open-graph-protocol-framework.php',
		// Open Graph Protocol Framework
		'seo-facebook-comments/seofacebook.php',                 // SEO Facebook Comments
		'seo-ultimate/seo-ultimate.php',                         // SEO Ultimate
		'sexybookmarks/sexy-bookmarks.php',                      // Shareaholic
		'shareaholic/sexy-bookmarks.php',                        // Shareaholic
		'sharepress/sharepress.php',                             // SharePress
		'simple-facebook-connect/sfc.php',                       // Simple Facebook Connect
		'social-discussions/social-discussions.php',             // Social Discussions
		'social-sharing-toolkit/social_sharing_toolkit.php',     // Social Sharing Toolkit
		'socialize/socialize.php',                               // Socialize
		'squirrly-seo/squirrly.php',                             // SEO by SQUIRRLY™
		'only-tweet-like-share-and-google-1/tweet-like-plusone.php',
		// Tweet, Like, Google +1 and Share
		'wordbooker/wordbooker.php',                             // Wordbooker
		'wpsso/wpsso.php',                                       // WordPress Social Sharing Optimization
		'wp-caregiver/wp-caregiver.php',                         // WP Caregiver
		'wp-facebook-like-send-open-graph-meta/wp-facebook-like-send-open-graph-meta.php',
		// WP Facebook Like Send & Open Graph Meta
		'wp-facebook-open-graph-protocol/wp-facebook-ogp.php',   // WP Facebook Open Graph protocol
		'wp-ogp/wp-ogp.php',                                     // WP-OGP
		'zoltonorg-social-plugin/zosp.php',                      // Zolton.org Social Plugin
		'wp-fb-share-like-button/wp_fb_share-like_widget.php',   // WP Facebook Like Button
		'open-graph-metabox/open-graph-metabox.php',              // Open Graph Metabox
		'seo-by-rank-math/rank-math.php',                        // Rank Math.
		'slim-seo/slim-seo.php',                                 // Slim SEO
	);

	/**
	 * Plugins for which we turn off our Twitter Cards Tags implementation.
	 */
	private $twitter_cards_conflicting_plugins = array(
		// 'twitter/twitter.php',                       // The official one handles this on its own.
		// https://github.com/twitter/wordpress/blob/master/src/Twitter/WordPress/Cards/Compatibility.php
			'eewee-twitter-card/index.php',              // Eewee Twitter Card
		'ig-twitter-cards/ig-twitter-cards.php',     // IG:Twitter Cards
		'jm-twitter-cards/jm-twitter-cards.php',     // JM Twitter Cards
		'kevinjohn-gallagher-pure-web-brilliants-social-graph-twitter-cards-extention/kevinjohn_gallagher___social_graph_twitter_output.php',
		// Pure Web Brilliant's Social Graph Twitter Cards Extension
		'twitter-cards/twitter-cards.php',           // Twitter Cards
		'twitter-cards-meta/twitter-cards-meta.php', // Twitter Cards Meta
		'wp-to-twitter/wp-to-twitter.php',           // WP to Twitter
		'wp-twitter-cards/twitter_cards.php',        // WP Twitter Cards
		'seo-by-rank-math/rank-math.php',            // Rank Math.
		'slim-seo/slim-seo.php',                     // Slim SEO
	);

	/**
	 * Message to display in admin_notice
	 *
	 * @var string
	 */
	public $message = '';

	/**
	 * Error to display in admin_notice
	 *
	 * @var string
	 */
	public $error = '';

	/**
	 * Modules that need more privacy description.
	 *
	 * @var string
	 */
	public $privacy_checks = '';

	/**
	 * Stats to record once the page loads
	 *
	 * @var array
	 */
	public $stats = array();

	/**
	 * Jetpack_Sync object
	 */
	public $sync;

	/**
	 * Verified data for JSON authorization request
	 */
	public $json_api_authorization_request = array();

	/**
	 * @var Automattic\Jetpack\Connection\Manager
	 */
	protected $connection_manager;

	/**
	 * @var string Transient key used to prevent multiple simultaneous plugin upgrades
	 */
	public static $plugin_upgrade_lock_key = 'jetpack_upgrade_lock';

	/**
	 * Holds an instance of Automattic\Jetpack\A8c_Mc_Stats
	 *
	 * @var Automattic\Jetpack\A8c_Mc_Stats
	 */
	public $a8c_mc_stats_instance;

	/**
	 * Constant for login redirect key.
	 *
	 * @var string
	 * @since 8.4.0
	 */
	public static $jetpack_redirect_login = 'jetpack_connect_login_redirect';

	/**
	 * Holds the singleton instance of this class
	 *
	 * @since 2.3.3
	 * @var Jetpack
	 */
	static $instance = false;

	/**
	 * Singleton
	 *
	 * @static
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new Jetpack();
			add_action( 'plugins_loaded', array( self::$instance, 'plugin_upgrade' ) );
			add_action( 'jetpack_idc_disconnect', array( __CLASS__, 'on_idc_disconnect' ) );
		}

		return self::$instance;
	}

	/**
	 * Must never be called statically
	 */
	function plugin_upgrade() {
		if ( self::is_connection_ready() ) {
			list( $version ) = explode( ':', Jetpack_Options::get_option( 'version' ) );
			if ( JETPACK__VERSION != $version ) {
				// Prevent multiple upgrades at once - only a single process should trigger
				// an upgrade to avoid stampedes
				if ( false !== get_transient( self::$plugin_upgrade_lock_key ) ) {
					return;
				}

				// Set a short lock to prevent multiple instances of the upgrade
				set_transient( self::$plugin_upgrade_lock_key, 1, 10 );

				// check which active modules actually exist and remove others from active_modules list
				$unfiltered_modules = self::get_active_modules();
				$modules            = array_filter( $unfiltered_modules, array( 'Jetpack', 'is_module' ) );
				if ( array_diff( $unfiltered_modules, $modules ) ) {
					self::update_active_modules( $modules );
				}

				add_action( 'init', array( __CLASS__, 'activate_new_modules' ) );

				// Upgrade to 4.3.0
				if ( Jetpack_Options::get_option( 'identity_crisis_whitelist' ) ) {
					Jetpack_Options::delete_option( 'identity_crisis_whitelist' );
				}

				// Make sure Markdown for posts gets turned back on
				if ( ! get_option( 'wpcom_publish_posts_with_markdown' ) ) {
					update_option( 'wpcom_publish_posts_with_markdown', true );
				}

				/*
				 * Minileven deprecation. 8.3.0.
				 * Only delete options if not using
				 * the replacement standalone Minileven plugin.
				 */
				if (
					! self::is_plugin_active( 'minileven-master/minileven.php' )
					&& ! self::is_plugin_active( 'minileven/minileven.php' )
				) {
					if ( get_option( 'wp_mobile_custom_css' ) ) {
						delete_option( 'wp_mobile_custom_css' );
					}
					if ( get_option( 'wp_mobile_excerpt' ) ) {
						delete_option( 'wp_mobile_excerpt' );
					}
					if ( get_option( 'wp_mobile_featured_images' ) ) {
						delete_option( 'wp_mobile_featured_images' );
					}
					if ( get_option( 'wp_mobile_app_promos' ) ) {
						delete_option( 'wp_mobile_app_promos' );
					}
				}

				// Upgrade to 8.4.0.
				if ( Jetpack_Options::get_option( 'ab_connect_banner_green_bar' ) ) {
					Jetpack_Options::delete_option( 'ab_connect_banner_green_bar' );
				}

				// Update to 8.8.x (WordPress 5.5 Compatibility).
				if ( Jetpack_Options::get_option( 'autoupdate_plugins' ) ) {
					$updated = update_site_option(
						'auto_update_plugins',
						array_unique(
							array_merge(
								(array) Jetpack_Options::get_option( 'autoupdate_plugins', array() ),
								(array) get_site_option( 'auto_update_plugins', array() )
							)
						)
					);

					if ( $updated ) {
						Jetpack_Options::delete_option( 'autoupdate_plugins' );
					} // Should we have some type of fallback if something fails here?
				}

				if ( did_action( 'wp_loaded' ) ) {
					self::upgrade_on_load();
				} else {
					add_action(
						'wp_loaded',
						array( __CLASS__, 'upgrade_on_load' )
					);
				}
			}
		}
	}

	/**
	 * Runs upgrade routines that need to have modules loaded.
	 */
	static function upgrade_on_load() {

		// Not attempting any upgrades if jetpack_modules_loaded did not fire.
		// This can happen in case Jetpack has been just upgraded and is
		// being initialized late during the page load. In this case we wait
		// until the next proper admin page load with Jetpack active.
		if ( ! did_action( 'jetpack_modules_loaded' ) ) {
			delete_transient( self::$plugin_upgrade_lock_key );

			return;
		}

		self::maybe_set_version_option();

		if ( method_exists( 'Jetpack_Widget_Conditions', 'migrate_post_type_rules' ) ) {
			Jetpack_Widget_Conditions::migrate_post_type_rules();
		}

		if (
			class_exists( 'Jetpack_Sitemap_Manager' )
			&& version_compare( JETPACK__VERSION, '5.3', '>=' )
		) {
			do_action( 'jetpack_sitemaps_purge_data' );
		}

		// Delete old stats cache
		delete_option( 'jetpack_restapi_stats_cache' );

		delete_transient( self::$plugin_upgrade_lock_key );
	}

	/**
	 * Saves all the currently active modules to options.
	 * Also fires Action hooks for each newly activated and deactivated module.
	 *
	 * @param $modules Array Array of active modules to be saved in options.
	 *
	 * @return $success bool true for success, false for failure.
	 */
	static function update_active_modules( $modules ) {
		$current_modules      = Jetpack_Options::get_option( 'active_modules', array() );
		$active_modules       = self::get_active_modules();
		$new_active_modules   = array_diff( $modules, $current_modules );
		$new_inactive_modules = array_diff( $active_modules, $modules );
		$new_current_modules  = array_diff( array_merge( $current_modules, $new_active_modules ), $new_inactive_modules );
		$reindexed_modules    = array_values( $new_current_modules );
		$success              = Jetpack_Options::update_option( 'active_modules', array_unique( $reindexed_modules ) );

		foreach ( $new_active_modules as $module ) {
			/**
			 * Fires when a specific module is activated.
			 *
			 * @since 1.9.0
			 *
			 * @param string $module Module slug.
			 * @param boolean $success whether the module was activated. @since 4.2
			 */
			do_action( 'jetpack_activate_module', $module, $success );
			/**
			 * Fires when a module is activated.
			 * The dynamic part of the filter, $module, is the module slug.
			 *
			 * @since 1.9.0
			 *
			 * @param string $module Module slug.
			 */
			do_action( "jetpack_activate_module_$module", $module );
		}

		foreach ( $new_inactive_modules as $module ) {
			/**
			 * Fired after a module has been deactivated.
			 *
			 * @since 4.2.0
			 *
			 * @param string $module Module slug.
			 * @param boolean $success whether the module was deactivated.
			 */
			do_action( 'jetpack_deactivate_module', $module, $success );
			/**
			 * Fires when a module is deactivated.
			 * The dynamic part of the filter, $module, is the module slug.
			 *
			 * @since 1.9.0
			 *
			 * @param string $module Module slug.
			 */
			do_action( "jetpack_deactivate_module_$module", $module );
		}

		return $success;
	}

	static function delete_active_modules() {
		self::update_active_modules( array() );
	}

	/**
	 * Adds a hook to plugins_loaded at a priority that's currently the earliest
	 * available.
	 */
	public function add_configure_hook() {
		global $wp_filter;

		$current_priority = has_filter( 'plugins_loaded', array( $this, 'configure' ) );
		if ( false !== $current_priority ) {
			remove_action( 'plugins_loaded', array( $this, 'configure' ), $current_priority );
		}

		$taken_priorities = array_map( 'intval', array_keys( $wp_filter['plugins_loaded']->callbacks ) );
		sort( $taken_priorities );

		$first_priority = array_shift( $taken_priorities );

		if ( defined( 'PHP_INT_MAX' ) && $first_priority <= - PHP_INT_MAX ) {
			$new_priority = - PHP_INT_MAX;
		} else {
			$new_priority = $first_priority - 1;
		}

		add_action( 'plugins_loaded', array( $this, 'configure' ), $new_priority );
	}

	/**
	 * Constructor.  Initializes WordPress hooks
	 */
	private function __construct() {
		/*
		 * Check for and alert any deprecated hooks
		 */
		add_action( 'init', array( $this, 'deprecated_hooks' ) );

		// Note how this runs at an earlier plugin_loaded hook intentionally to accomodate for other plugins.
		add_action( 'plugin_loaded', array( $this, 'add_configure_hook' ), 90 );
		add_action( 'network_plugin_loaded', array( $this, 'add_configure_hook' ), 90 );
		add_action( 'mu_plugin_loaded', array( $this, 'add_configure_hook' ), 90 );
		add_action( 'plugins_loaded', array( $this, 'late_initialization' ), 90 );

		add_action( 'jetpack_verify_signature_error', array( $this, 'track_xmlrpc_error' ) );

		add_filter(
			'jetpack_signature_check_token',
			array( __CLASS__, 'verify_onboarding_token' ),
			10,
			3
		);

		/**
		 * Prepare Gutenberg Editor functionality
		 */
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-gutenberg.php';
		add_action( 'plugins_loaded', array( 'Jetpack_Gutenberg', 'init' ) );
		add_action( 'plugins_loaded', array( 'Jetpack_Gutenberg', 'load_independent_blocks' ) );
		add_action( 'plugins_loaded', array( 'Jetpack_Gutenberg', 'load_extended_blocks' ), 9 );
		add_action( 'enqueue_block_editor_assets', array( 'Jetpack_Gutenberg', 'enqueue_block_editor_assets' ) );

		add_action( 'set_user_role', array( $this, 'maybe_clear_other_linked_admins_transient' ), 10, 3 );

		// Unlink user before deleting the user from WP.com.
		add_action( 'deleted_user', array( $this, 'disconnect_user' ), 10, 1 );
		add_action( 'remove_user_from_blog', array( $this, 'disconnect_user' ), 10, 1 );

		add_action( 'jetpack_event_log', array( 'Jetpack', 'log' ), 10, 2 );

		add_filter( 'login_url', array( $this, 'login_url' ), 10, 2 );
		add_action( 'login_init', array( $this, 'login_init' ) );

		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_init', array( $this, 'dismiss_jetpack_notice' ) );

		add_filter( 'admin_body_class', array( $this, 'admin_body_class' ), 20 );

		add_action( 'wp_dashboard_setup', array( $this, 'wp_dashboard_setup' ) );
		// Filter the dashboard meta box order to swap the new one in in place of the old one.
		add_filter( 'get_user_option_meta-box-order_dashboard', array( $this, 'get_user_option_meta_box_order_dashboard' ) );

		// returns HTTPS support status
		add_action( 'wp_ajax_jetpack-recheck-ssl', array( $this, 'ajax_recheck_ssl' ) );

		add_action( 'wp_ajax_jetpack_connection_banner', array( $this, 'jetpack_connection_banner_callback' ) );

		add_action( 'wp_ajax_jetpack_recommendations_banner', array( 'Jetpack_Recommendations_Banner', 'ajax_callback' ) );

		add_action( 'wp_loaded', array( $this, 'register_assets' ) );

		/**
		 * These actions run checks to load additional files.
		 * They check for external files or plugins, so they need to run as late as possible.
		 */
		add_action( 'wp_head', array( $this, 'check_open_graph' ), 1 );
		add_action( 'web_stories_story_head', array( $this, 'check_open_graph' ), 1 );
		add_action( 'plugins_loaded', array( $this, 'check_twitter_tags' ), 999 );
		add_action( 'plugins_loaded', array( $this, 'check_rest_api_compat' ), 1000 );

		add_filter( 'plugins_url', array( 'Jetpack', 'maybe_min_asset' ), 1, 3 );
		add_action( 'style_loader_src', array( 'Jetpack', 'set_suffix_on_min' ), 10, 2 );
		add_filter( 'style_loader_tag', array( 'Jetpack', 'maybe_inline_style' ), 10, 2 );

		add_filter( 'profile_update', array( 'Jetpack', 'user_meta_cleanup' ) );

		add_filter( 'jetpack_get_default_modules', array( $this, 'filter_default_modules' ) );
		add_filter( 'jetpack_get_default_modules', array( $this, 'handle_deprecated_modules' ), 99 );

		require_once JETPACK__PLUGIN_DIR . 'class-jetpack-pre-connection-jitms.php';
		$jetpack_jitm_messages = ( new Jetpack_Pre_Connection_JITMs() );
		add_filter( 'jetpack_pre_connection_jitms', array( $jetpack_jitm_messages, 'add_pre_connection_jitms' ) );

		/*
		 * If enabled, point edit post, page, and comment links to Calypso instead of WP-Admin.
		 * We should make sure to only do this for front end links.
		 */
		if ( self::get_option( 'edit_links_calypso_redirect' ) && ! is_admin() ) {
			add_filter( 'get_edit_post_link', array( $this, 'point_edit_post_links_to_calypso' ), 1, 2 );
			add_filter( 'get_edit_comment_link', array( $this, 'point_edit_comment_links_to_calypso' ), 1 );

			/*
			 * We'll shortcircuit wp_notify_postauthor and wp_notify_moderator pluggable functions
			 * so they point moderation links on emails to Calypso.
			 */
			jetpack_require_lib( 'functions.wp-notify' );
			add_filter( 'comment_notification_recipients', 'jetpack_notify_postauthor', 1, 2 );
			add_filter( 'notify_moderator', 'jetpack_notify_moderator', 1, 2 );
		}

		add_action(
			'plugins_loaded',
			function () {
				if ( User_Agent_Info::is_mobile_app() ) {
					add_filter( 'get_edit_post_link', '__return_empty_string' );
				}
			}
		);

		// Update the site's Jetpack plan and products from API on heartbeats.
		add_action( 'jetpack_heartbeat', array( 'Jetpack_Plan', 'refresh_from_wpcom' ) );

		/**
		 * This is the hack to concatenate all css files into one.
		 * For description and reasoning see the implode_frontend_css method.
		 *
		 * Super late priority so we catch all the registered styles.
		 */
		if ( ! is_admin() ) {
			add_action( 'wp_print_styles', array( $this, 'implode_frontend_css' ), -1 ); // Run first
			add_action( 'wp_print_footer_scripts', array( $this, 'implode_frontend_css' ), -1 ); // Run first to trigger before `print_late_styles`
		}

		// Actually push the stats on shutdown.
		if ( ! has_action( 'shutdown', array( $this, 'push_stats' ) ) ) {
			add_action( 'shutdown', array( $this, 'push_stats' ) );
		}

		// After a successful connection.
		add_action( 'jetpack_site_registered', array( $this, 'activate_default_modules_on_site_register' ) );
		add_action( 'jetpack_site_registered', array( $this, 'handle_unique_registrations_stats' ) );

		// Actions for Manager::authorize().
		add_action( 'jetpack_authorize_starting', array( $this, 'authorize_starting' ) );
		add_action( 'jetpack_authorize_ending_linked', array( $this, 'authorize_ending_linked' ) );
		add_action( 'jetpack_authorize_ending_authorized', array( $this, 'authorize_ending_authorized' ) );

		add_action( 'jetpack_client_authorize_error', array( Jetpack_Client_Server::class, 'client_authorize_error' ) );
		add_filter( 'jetpack_client_authorize_already_authorized_url', array( Jetpack_Client_Server::class, 'client_authorize_already_authorized_url' ) );
		add_action( 'jetpack_client_authorize_processing', array( Jetpack_Client_Server::class, 'client_authorize_processing' ) );
		add_filter( 'jetpack_client_authorize_fallback_url', array( Jetpack_Client_Server::class, 'client_authorize_fallback_url' ) );

		// Filters for the Manager::get_token() urls and request body.
		add_filter( 'jetpack_token_redirect_url', array( __CLASS__, 'filter_connect_redirect_url' ) );
		add_filter( 'jetpack_token_request_body', array( __CLASS__, 'filter_token_request_body' ) );

		// Filter for the `jetpack/v4/connection/data` API response.
		add_filter( 'jetpack_current_user_connection_data', array( __CLASS__, 'filter_jetpack_current_user_connection_data' ) );

		// Actions for successful reconnect.
		add_action( 'jetpack_reconnection_completed', array( $this, 'reconnection_completed' ) );

		// Actions for successful disconnect.
		add_action( 'jetpack_site_disconnected', array( $this, 'jetpack_site_disconnected' ) );

		// Actions for licensing.
		Licensing::instance()->initialize();

		// Filters for Sync Callables.
		add_filter( 'jetpack_sync_callable_whitelist', array( $this, 'filter_sync_callable_whitelist' ), 10, 1 );
		add_filter( 'jetpack_sync_multisite_callable_whitelist', array( $this, 'filter_sync_multisite_callable_whitelist' ), 10, 1 );

		// Make resources use static domain when possible.
		add_filter( 'jetpack_static_url', array( 'Automattic\\Jetpack\\Assets', 'staticize_subdomain' ) );

		// Validate the domain names in Jetpack development versions.
		add_action( 'jetpack_pre_register', array( get_called_class(), 'registration_check_domains' ) );
	}

	/**
	 * Before everything else starts getting initalized, we need to initialize Jetpack using the
	 * Config object.
	 */
	public function configure() {
		$config = new Config();

		foreach (
			array(
				'sync',
				'jitm',
			)
			as $feature
		) {
			$config->ensure( $feature );
		}

		$config->ensure(
			'connection',
			array(
				'slug' => 'jetpack',
				'name' => 'Jetpack',
			)
		);

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager( 'jetpack' );

			/**
			 * Filter to activate Jetpack Connection UI.
			 * INTERNAL USE ONLY.
			 *
			 * @since 9.5.0
			 *
			 * @param bool false Whether to activate the Connection UI.
			 */
			if ( apply_filters( 'jetpack_connection_ui_active', false ) ) {
				Automattic\Jetpack\ConnectionUI\Admin::init();
			}
		}

		/*
		 * Load things that should only be in Network Admin.
		 *
		 * For now blow away everything else until a more full
		 * understanding of what is needed at the network level is
		 * available
		 */
		if ( is_multisite() ) {
			$network = Jetpack_Network::init();
			$network->set_connection( $this->connection_manager );
		}

		if ( self::is_connection_ready() ) {
			add_action( 'login_form_jetpack_json_api_authorization', array( $this, 'login_form_json_api_authorization' ) );

			Jetpack_Heartbeat::init();
			if ( self::is_module_active( 'stats' ) && self::is_module_active( 'search' ) ) {
				require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.jetpack-search-performance-logger.php';
				Jetpack_Search_Performance_Logger::init();
			}
		}

		// Initialize remote file upload request handlers.
		$this->add_remote_request_handlers();

		/*
		 * Enable enhanced handling of previewing sites in Calypso
		 */
		if ( self::is_connection_ready() ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.jetpack-iframe-embed.php';
			add_action( 'init', array( 'Jetpack_Iframe_Embed', 'init' ), 9, 0 );
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.jetpack-keyring-service-helper.php';
			add_action( 'init', array( 'Jetpack_Keyring_Service_Helper', 'init' ), 9, 0 );
		}

		if ( ( new Tracking( $this->connection_manager ) )->should_enable_tracking( new Terms_Of_Service(), new Status() ) ) {
			add_action( 'init', array( new Plugin_Tracking(), 'init' ) );
		} else {
			/**
			 * Initialize tracking right after the user agrees to the terms of service.
			 */
			add_action( 'jetpack_agreed_to_terms_of_service', array( new Plugin_Tracking(), 'init' ) );
		}
	}

	/**
	 * Runs on plugins_loaded. Use this to add code that needs to be executed later than other
	 * initialization code.
	 *
	 * @action plugins_loaded
	 */
	public function late_initialization() {
		add_action( 'plugins_loaded', array( 'Jetpack', 'load_modules' ), 100 );

		Partner::init();

		/**
		 * Fires when Jetpack is fully loaded and ready. This is the point where it's safe
		 * to instantiate classes from packages and namespaces that are managed by the Jetpack Autoloader.
		 *
		 * @since 8.1.0
		 *
		 * @param Jetpack $jetpack the main plugin class object.
		 */
		do_action( 'jetpack_loaded', $this );

		add_filter( 'map_meta_cap', array( $this, 'jetpack_custom_caps' ), 1, 4 );
	}

	/**
	 * Sets up the XMLRPC request handlers.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::setup_xmlrpc_handlers()
	 *
	 * @param array                 $request_params Incoming request parameters.
	 * @param Boolean               $is_active      Whether the connection is currently active.
	 * @param Boolean               $is_signed      Whether the signature check has been successful.
	 * @param Jetpack_XMLRPC_Server $xmlrpc_server  (optional) An instance of the server to use instead of instantiating a new one.
	 */
	public function setup_xmlrpc_handlers(
		$request_params,
		$is_active,
		$is_signed,
		Jetpack_XMLRPC_Server $xmlrpc_server = null
	) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::setup_xmlrpc_handlers' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->setup_xmlrpc_handlers(
			$request_params,
			$is_active,
			$is_signed,
			$xmlrpc_server
		);
	}

	/**
	 * Initialize REST API registration connector.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::initialize_rest_api_registration_connector()
	 */
	public function initialize_rest_api_registration_connector() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::initialize_rest_api_registration_connector' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		$this->connection_manager->initialize_rest_api_registration_connector();
	}

	/**
	 * This is ported over from the manage module, which has been deprecated and baked in here.
	 *
	 * @param $domains
	 */
	function add_wpcom_to_allowed_redirect_hosts( $domains ) {
		add_filter( 'allowed_redirect_hosts', array( $this, 'allow_wpcom_domain' ) );
	}

	/**
	 * Return $domains, with 'wordpress.com' appended.
	 * This is ported over from the manage module, which has been deprecated and baked in here.
	 *
	 * @param $domains
	 * @return array
	 */
	function allow_wpcom_domain( $domains ) {
		if ( empty( $domains ) ) {
			$domains = array();
		}
		$domains[] = 'wordpress.com';
		return array_unique( $domains );
	}

	function point_edit_post_links_to_calypso( $default_url, $post_id ) {
		$post = get_post( $post_id );

		if ( empty( $post ) ) {
			return $default_url;
		}

		$post_type = $post->post_type;

		// Mapping the allowed CPTs on WordPress.com to corresponding paths in Calypso.
		// https://en.support.wordpress.com/custom-post-types/
		$allowed_post_types = array(
			'post',
			'page',
			'jetpack-portfolio',
			'jetpack-testimonial',
		);

		if ( ! in_array( $post_type, $allowed_post_types, true ) ) {
			return $default_url;
		}

		return Redirect::get_url(
			'calypso-edit-' . $post_type,
			array(
				'path' => $post_id,
			)
		);
	}

	function point_edit_comment_links_to_calypso( $url ) {
		// Take the `query` key value from the URL, and parse its parts to the $query_args. `amp;c` matches the comment ID.
		wp_parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $query_args );

		return Redirect::get_url(
			'calypso-edit-comment',
			array(
				'path' => $query_args['amp;c'],
			)
		);

	}

	/**
	 * Extend Sync callables with Jetpack Plugin functions.
	 *
	 * @param array $callables list of callables.
	 *
	 * @return array list of callables.
	 */
	public function filter_sync_callable_whitelist( $callables ) {

		// Jetpack Functions.
		$jetpack_callables = array(
			'single_user_site'         => array( 'Jetpack', 'is_single_user_site' ),
			'updates'                  => array( 'Jetpack', 'get_updates' ),
			'active_modules'           => array( 'Jetpack', 'get_active_modules' ),
			'available_jetpack_blocks' => array( 'Jetpack_Gutenberg', 'get_availability' ), // Includes both Gutenberg blocks *and* plugins.
		);
		$callables         = array_merge( $callables, $jetpack_callables );

		// Jetpack_SSO_Helpers.
		if ( include_once JETPACK__PLUGIN_DIR . 'modules/sso/class.jetpack-sso-helpers.php' ) {
			$sso_helpers = array(
				'sso_is_two_step_required'      => array( 'Jetpack_SSO_Helpers', 'is_two_step_required' ),
				'sso_should_hide_login_form'    => array( 'Jetpack_SSO_Helpers', 'should_hide_login_form' ),
				'sso_match_by_email'            => array( 'Jetpack_SSO_Helpers', 'match_by_email' ),
				'sso_new_user_override'         => array( 'Jetpack_SSO_Helpers', 'new_user_override' ),
				'sso_bypass_default_login_form' => array( 'Jetpack_SSO_Helpers', 'bypass_login_forward_wpcom' ),
			);
			$callables   = array_merge( $callables, $sso_helpers );
		}

		return $callables;
	}

	/**
	 * Extend Sync multisite callables with Jetpack Plugin functions.
	 *
	 * @param array $callables list of callables.
	 *
	 * @return array list of callables.
	 */
	public function filter_sync_multisite_callable_whitelist( $callables ) {

		// Jetpack Funtions.
		$jetpack_multisite_callables = array(
			'network_name'                        => array( 'Jetpack', 'network_name' ),
			'network_allow_new_registrations'     => array( 'Jetpack', 'network_allow_new_registrations' ),
			'network_add_new_users'               => array( 'Jetpack', 'network_add_new_users' ),
			'network_site_upload_space'           => array( 'Jetpack', 'network_site_upload_space' ),
			'network_upload_file_types'           => array( 'Jetpack', 'network_upload_file_types' ),
			'network_enable_administration_menus' => array( 'Jetpack', 'network_enable_administration_menus' ),
		);
		$callables                   = array_merge( $callables, $jetpack_multisite_callables );

		return $callables;
	}

	/**
	 * Deprecated
	 * Please use Automattic\Jetpack\JITMS\JITM::jetpack_track_last_sync_callback instead.
	 *
	 * @param array $params The action parameters.
	 *
	 * @deprecated since 9.8.
	 */
	function jetpack_track_last_sync_callback( $params ) {
		_deprecated_function( __METHOD__, 'jetpack-9.8', '\Automattic\Jetpack\JITMS\JITM->jetpack_track_last_sync_callback' );
		return Automattic\Jetpack\JITMS\JITM::get_instance()->jetpack_track_last_sync_callback( $params );
	}

	function jetpack_connection_banner_callback() {
		check_ajax_referer( 'jp-connection-banner-nonce', 'nonce' );

		// Disable the banner dismiss functionality if the pre-connection prompt helpers filter is set.
		if (
			isset( $_REQUEST['dismissBanner'] ) &&
			! Jetpack_Connection_Banner::force_display()
		) {
			Jetpack_Options::update_option( 'dismissed_connection_banner', 1 );
			wp_send_json_success();
		}

		wp_die();
	}

	/**
	 * Removes all XML-RPC methods that are not `jetpack.*`.
	 * Only used in our alternate XML-RPC endpoint, where we want to
	 * ensure that Core and other plugins' methods are not exposed.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::remove_non_jetpack_xmlrpc_methods()
	 *
	 * @param array $methods A list of registered WordPress XMLRPC methods.
	 * @return array Filtered $methods
	 */
	public function remove_non_jetpack_xmlrpc_methods( $methods ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::remove_non_jetpack_xmlrpc_methods' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->remove_non_jetpack_xmlrpc_methods( $methods );
	}

	/**
	 * Since a lot of hosts use a hammer approach to "protecting" WordPress sites,
	 * and just blanket block all requests to /xmlrpc.php, or apply other overly-sensitive
	 * security/firewall policies, we provide our own alternate XML RPC API endpoint
	 * which is accessible via a different URI. Most of the below is copied directly
	 * from /xmlrpc.php so that we're replicating it as closely as possible.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::alternate_xmlrpc()
	 */
	public function alternate_xmlrpc() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::alternate_xmlrpc' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		$this->connection_manager->alternate_xmlrpc();
	}

	/**
	 * The callback for the JITM ajax requests.
	 *
	 * @deprecated since 7.9.0
	 */
	function jetpack_jitm_ajax_callback() {
		_deprecated_function( __METHOD__, 'jetpack-7.9' );
	}

	/**
	 * If there are any stats that need to be pushed, but haven't been, push them now.
	 */
	function push_stats() {
		if ( ! empty( $this->stats ) ) {
			$this->do_stats( 'server_side' );
		}
	}

	/**
	 * Sets the Jetpack custom capabilities.
	 *
	 * @param string[] $caps    Array of the user's capabilities.
	 * @param string   $cap     Capability name.
	 * @param int      $user_id The user ID.
	 * @param array    $args    Adds the context to the cap. Typically the object ID.
	 */
	public function jetpack_custom_caps( $caps, $cap, $user_id, $args ) {
		switch ( $cap ) {
			case 'jetpack_manage_modules':
			case 'jetpack_activate_modules':
			case 'jetpack_deactivate_modules':
				$caps = array( 'manage_options' );
				break;
			case 'jetpack_configure_modules':
				$caps = array( 'manage_options' );
				break;
			case 'jetpack_manage_autoupdates':
				$caps = array(
					'manage_options',
					'update_plugins',
				);
				break;
			case 'jetpack_network_admin_page':
			case 'jetpack_network_settings_page':
				$caps = array( 'manage_network_plugins' );
				break;
			case 'jetpack_network_sites_page':
				$caps = array( 'manage_sites' );
				break;
			case 'jetpack_admin_page':
				$is_offline_mode = ( new Status() )->is_offline_mode();
				if ( $is_offline_mode ) {
					$caps = array( 'manage_options' );
					break;
				} else {
					$caps = array( 'read' );
				}
				break;
		}
		return $caps;
	}

	/**
	 * Require a Jetpack authentication.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::require_jetpack_authentication()
	 */
	public function require_jetpack_authentication() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::require_jetpack_authentication' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		$this->connection_manager->require_jetpack_authentication();
	}

	/**
	 * Register assets for use in various modules and the Jetpack admin page.
	 *
	 * @uses wp_script_is, wp_register_script, plugins_url
	 * @action wp_loaded
	 * @return null
	 */
	public function register_assets() {
		if ( ! wp_script_is( 'jetpack-gallery-settings', 'registered' ) ) {
			wp_register_script(
				'jetpack-gallery-settings',
				Assets::get_file_url_for_environment( '_inc/build/gallery-settings.min.js', '_inc/gallery-settings.js' ),
				array( 'media-views' ),
				'20121225'
			);
		}

		if ( ! wp_script_is( 'jetpack-twitter-timeline', 'registered' ) ) {
			wp_register_script(
				'jetpack-twitter-timeline',
				Assets::get_file_url_for_environment( '_inc/build/twitter-timeline.min.js', '_inc/twitter-timeline.js' ),
				array( 'jquery' ),
				'4.0.0',
				true
			);
		}

		if ( ! wp_script_is( 'jetpack-facebook-embed', 'registered' ) ) {
			wp_register_script(
				'jetpack-facebook-embed',
				Assets::get_file_url_for_environment( '_inc/build/facebook-embed.min.js', '_inc/facebook-embed.js' ),
				array(),
				null,
				true
			);

			/** This filter is documented in modules/sharedaddy/sharing-sources.php */
			$fb_app_id = apply_filters( 'jetpack_sharing_facebook_app_id', '249643311490' );
			if ( ! is_numeric( $fb_app_id ) ) {
				$fb_app_id = '';
			}
			wp_localize_script(
				'jetpack-facebook-embed',
				'jpfbembed',
				array(
					'appid'  => $fb_app_id,
					'locale' => $this->get_locale(),
				)
			);
		}

		/**
		 * As jetpack_register_genericons is by default fired off a hook,
		 * the hook may have already fired by this point.
		 * So, let's just trigger it manually.
		 */
		require_once JETPACK__PLUGIN_DIR . '_inc/genericons.php';
		jetpack_register_genericons();

		/**
		 * Register the social logos
		 */
		require_once JETPACK__PLUGIN_DIR . '_inc/social-logos.php';
		jetpack_register_social_logos();

		if ( ! wp_style_is( 'jetpack-icons', 'registered' ) ) {
			wp_register_style( 'jetpack-icons', plugins_url( 'css/jetpack-icons.min.css', JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION );
		}
	}

	/**
	 * Guess locale from language code.
	 *
	 * @param string $lang Language code.
	 * @return string|bool
	 */
	function guess_locale_from_lang( $lang ) {
		if ( 'en' === $lang || 'en_US' === $lang || ! $lang ) {
			return 'en_US';
		}

		if ( ! class_exists( 'GP_Locales' ) ) {
			if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				return false;
			}

			require JETPACK__GLOTPRESS_LOCALES_PATH;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// WP.com: get_locale() returns 'it'
			$locale = GP_Locales::by_slug( $lang );
		} else {
			// Jetpack: get_locale() returns 'it_IT';
			$locale = GP_Locales::by_field( 'facebook_locale', $lang );
		}

		if ( ! $locale ) {
			return false;
		}

		if ( empty( $locale->facebook_locale ) ) {
			if ( empty( $locale->wp_locale ) ) {
				return false;
			} else {
				// Facebook SDK is smart enough to fall back to en_US if a
				// locale isn't supported. Since supported Facebook locales
				// can fall out of sync, we'll attempt to use the known
				// wp_locale value and rely on said fallback.
				return $locale->wp_locale;
			}
		}

		return $locale->facebook_locale;
	}

	/**
	 * Get the locale.
	 *
	 * @return string|bool
	 */
	function get_locale() {
		$locale = $this->guess_locale_from_lang( get_locale() );

		if ( ! $locale ) {
			$locale = 'en_US';
		}

		return $locale;
	}

	/**
	 * Return the network_site_url so that .com knows what network this site is a part of.
	 *
	 * @param  bool $option
	 * @return string
	 */
	public function jetpack_main_network_site_option( $option ) {
		return network_site_url();
	}
	/**
	 * Network Name.
	 */
	static function network_name( $option = null ) {
		global $current_site;
		return $current_site->site_name;
	}
	/**
	 * Does the network allow new user and site registrations.
	 *
	 * @return string
	 */
	static function network_allow_new_registrations( $option = null ) {
		return ( in_array( get_site_option( 'registration' ), array( 'none', 'user', 'blog', 'all' ) ) ? get_site_option( 'registration' ) : 'none' );
	}
	/**
	 * Does the network allow admins to add new users.
	 *
	 * @return boolian
	 */
	static function network_add_new_users( $option = null ) {
		return (bool) get_site_option( 'add_new_users' );
	}
	/**
	 * File upload psace left per site in MB.
	 *  -1 means NO LIMIT.
	 *
	 * @return number
	 */
	static function network_site_upload_space( $option = null ) {
		// value in MB
		return ( get_site_option( 'upload_space_check_disabled' ) ? -1 : get_space_allowed() );
	}

	/**
	 * Network allowed file types.
	 *
	 * @return string
	 */
	static function network_upload_file_types( $option = null ) {
		return get_site_option( 'upload_filetypes', 'jpg jpeg png gif' );
	}

	/**
	 * Maximum file upload size set by the network.
	 *
	 * @return number
	 */
	static function network_max_upload_file_size( $option = null ) {
		// value in KB
		return get_site_option( 'fileupload_maxk', 300 );
	}

	/**
	 * Lets us know if a site allows admins to manage the network.
	 *
	 * @return array
	 */
	static function network_enable_administration_menus( $option = null ) {
		return get_site_option( 'menu_items' );
	}

	/**
	 * If a user has been promoted to or demoted from admin, we need to clear the
	 * jetpack_other_linked_admins transient.
	 *
	 * @since 4.3.2
	 * @since 4.4.0  $old_roles is null by default and if it's not passed, the transient is cleared.
	 *
	 * @param int    $user_id   The user ID whose role changed.
	 * @param string $role      The new role.
	 * @param array  $old_roles An array of the user's previous roles.
	 */
	function maybe_clear_other_linked_admins_transient( $user_id, $role, $old_roles = null ) {
		if ( 'administrator' == $role
			|| ( is_array( $old_roles ) && in_array( 'administrator', $old_roles ) )
			|| is_null( $old_roles )
		) {
			delete_transient( 'jetpack_other_linked_admins' );
		}
	}

	/**
	 * Checks to see if there are any other users available to become primary
	 * Users must both:
	 * - Be linked to wpcom
	 * - Be an admin
	 *
	 * @return mixed False if no other users are linked, Int if there are.
	 */
	static function get_other_linked_admins() {
		$other_linked_users = get_transient( 'jetpack_other_linked_admins' );

		if ( false === $other_linked_users ) {
			$admins = get_users( array( 'role' => 'administrator' ) );
			if ( count( $admins ) > 1 ) {
				$available = array();
				foreach ( $admins as $admin ) {
					if ( self::connection()->is_user_connected( $admin->ID ) ) {
						$available[] = $admin->ID;
					}
				}

				$count_connected_admins = count( $available );
				if ( count( $available ) > 1 ) {
					$other_linked_users = $count_connected_admins;
				} else {
					$other_linked_users = 0;
				}
			} else {
				$other_linked_users = 0;
			}

			set_transient( 'jetpack_other_linked_admins', $other_linked_users, HOUR_IN_SECONDS );
		}

		return ( 0 === $other_linked_users ) ? false : $other_linked_users;
	}

	/**
	 * Return whether we are dealing with a multi network setup or not.
	 * The reason we are type casting this is because we want to avoid the situation where
	 * the result is false since when is_main_network_option return false it cases
	 * the rest the get_option( 'jetpack_is_multi_network' ); to return the value that is set in the
	 * database which could be set to anything as opposed to what this function returns.
	 *
	 * @param  bool $option
	 *
	 * @return boolean
	 */
	public function is_main_network_option( $option ) {
		// return '1' or ''
		return (string) (bool) self::is_multi_network();
	}

	/**
	 * Return true if we are with multi-site or multi-network false if we are dealing with single site.
	 *
	 * @param  string $option
	 * @return boolean
	 */
	public function is_multisite( $option ) {
		return (string) (bool) is_multisite();
	}

	/**
	 * Implemented since there is no core is multi network function
	 * Right now there is no way to tell if we which network is the dominant network on the system
	 *
	 * @since  3.3
	 * @return boolean
	 */
	public static function is_multi_network() {
		global  $wpdb;

		// if we don't have a multi site setup no need to do any more
		if ( ! is_multisite() ) {
			return false;
		}

		$num_sites = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->site}" );
		if ( $num_sites > 1 ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Trigger an update to the main_network_site when we update the siteurl of a site.
	 *
	 * @return null
	 */
	function update_jetpack_main_network_site_option() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
	}
	/**
	 * Triggered after a user updates the network settings via Network Settings Admin Page
	 */
	function update_jetpack_network_settings() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
		// Only sync this info for the main network site.
	}

	/**
	 * Get back if the current site is single user site.
	 *
	 * @return bool
	 */
	public static function is_single_user_site() {
		global $wpdb;

		if ( false === ( $some_users = get_transient( 'jetpack_is_single_user' ) ) ) {
			$some_users = $wpdb->get_var( "SELECT COUNT(*) FROM (SELECT user_id FROM $wpdb->usermeta WHERE meta_key = '{$wpdb->prefix}capabilities' LIMIT 2) AS someusers" );
			set_transient( 'jetpack_is_single_user', (int) $some_users, 12 * HOUR_IN_SECONDS );
		}
		return 1 === (int) $some_users;
	}

	/**
	 * Returns true if the site has file write access false otherwise.
	 *
	 * @return string ( '1' | '0' )
	 **/
	public static function file_system_write_access() {
		if ( ! function_exists( 'get_filesystem_method' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		require_once ABSPATH . 'wp-admin/includes/template.php';

		$filesystem_method = get_filesystem_method();
		if ( $filesystem_method === 'direct' ) {
			return 1;
		}

		ob_start();
		$filesystem_credentials_are_stored = request_filesystem_credentials( self_admin_url() );
		ob_end_clean();
		if ( $filesystem_credentials_are_stored ) {
			return 1;
		}
		return 0;
	}

	/**
	 * Finds out if a site is using a version control system.
	 *
	 * @return string ( '1' | '0' )
	 **/
	public static function is_version_controlled() {
		_deprecated_function( __METHOD__, 'jetpack-4.2', 'Functions::is_version_controlled' );
		return (string) (int) Functions::is_version_controlled();
	}

	/**
	 * Determines whether the current theme supports featured images or not.
	 *
	 * @return string ( '1' | '0' )
	 */
	public static function featured_images_enabled() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
		return current_theme_supports( 'post-thumbnails' ) ? '1' : '0';
	}

	/**
	 * Wrapper for core's get_avatar_url().  This one is deprecated.
	 *
	 * @deprecated 4.7 use get_avatar_url instead.
	 * @param int|string|object $id_or_email A user ID,  email address, or comment object
	 * @param int               $size Size of the avatar image
	 * @param string            $default URL to a default image to use if no avatar is available
	 * @param bool              $force_display Whether to force it to return an avatar even if show_avatars is disabled
	 *
	 * @return array
	 */
	public static function get_avatar_url( $id_or_email, $size = 96, $default = '', $force_display = false ) {
		_deprecated_function( __METHOD__, 'jetpack-4.7', 'get_avatar_url' );
		return get_avatar_url(
			$id_or_email,
			array(
				'size'          => $size,
				'default'       => $default,
				'force_default' => $force_display,
			)
		);
	}
// phpcs:disable WordPress.WP.CapitalPDangit.Misspelled
	/**
	 * jetpack_updates is saved in the following schema:
	 *
	 * array (
	 *      'plugins'                       => (int) Number of plugin updates available.
	 *      'themes'                        => (int) Number of theme updates available.
	 *      'wordpress'                     => (int) Number of WordPress core updates available.
	 *      'translations'                  => (int) Number of translation updates available.
	 *      'total'                         => (int) Total of all available updates.
	 *      'wp_update_version'             => (string) The latest available version of WordPress, only present if a WordPress update is needed.
	 * )
	 *
	 * @return array
	 */
	public static function get_updates() {
		$update_data = wp_get_update_data();

		// Stores the individual update counts as well as the total count.
		if ( isset( $update_data['counts'] ) ) {
			$updates = $update_data['counts'];
		}

		// If we need to update WordPress core, let's find the latest version number.
		if ( ! empty( $updates['wordpress'] ) ) {
			$cur = get_preferred_from_update_core();
			if ( isset( $cur->response ) && 'upgrade' === $cur->response ) {
				$updates['wp_update_version'] = $cur->current;
			}
		}
		return isset( $updates ) ? $updates : array();
	}
	// phpcs:enable

	public static function get_update_details() {
		$update_details = array(
			'update_core'    => get_site_transient( 'update_core' ),
			'update_plugins' => get_site_transient( 'update_plugins' ),
			'update_themes'  => get_site_transient( 'update_themes' ),
		);
		return $update_details;
	}

	public static function refresh_update_data() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );

	}

	public static function refresh_theme_data() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
	}

	/**
	 * Is Jetpack active?
	 * The method only checks if there's an existing token for the master user. It doesn't validate the token.
	 *
	 * This method is deprecated since 9.6.0. Please use one of the methods provided by the Manager class in the Connection package,
	 * or Jetpack::is_connection_ready if you want to know when the Jetpack plugin starts considering the connection ready to be used.
	 *
	 * Since this method has a wide spread use, we decided not to throw any deprecation warnings for now.
	 *
	 * @deprecated 9.6.0
	 *
	 * @return bool
	 */
	public static function is_active() {
		return self::connection()->is_active();
	}

	/**
	 * Returns true if the current site is connected to WordPress.com and has the minimum requirements to enable Jetpack UI
	 *
	 * This method was introduced just before the release of the possibility to use Jetpack without a user connection, while
	 * it was available only when no_user_testing_mode was enabled. In the near future, this will return is_connected for all
	 * users and this option will be available by default for everybody.
	 *
	 * @since 9.6.0
	 * @since 9.7.0 returns is_connected in all cases and adds filter to the returned value
	 *
	 * @return bool is the site connection ready to be used?
	 */
	public static function is_connection_ready() {
		/**
		 * Allows filtering whether the connection is ready to be used. If true, this will enable the Jetpack UI and modules
		 *
		 * Modules will be enabled depending on the connection status and if the module requires a connection or user connection.
		 *
		 * @since 9.7.0
		 *
		 * @param bool                                  $is_connection_ready Is the connection ready?
		 * @param Automattic\Jetpack\Connection\Manager $connection_manager Instance of the Manager class, can be used to check the connection status.
		 */
		return apply_filters( 'jetpack_is_connection_ready', self::connection()->is_connected(), self::connection() );
	}

	/**
	 * Make an API call to WordPress.com for plan status
	 *
	 * @deprecated 7.2.0 Use Jetpack_Plan::refresh_from_wpcom.
	 *
	 * @return bool True if plan is updated, false if no update
	 */
	public static function refresh_active_plan_from_wpcom() {
		_deprecated_function( __METHOD__, 'jetpack-7.2.0', 'Jetpack_Plan::refresh_from_wpcom' );
		return Jetpack_Plan::refresh_from_wpcom();
	}

	/**
	 * Get the plan that this Jetpack site is currently using
	 *
	 * @deprecated 7.2.0 Use Jetpack_Plan::get.
	 * @return array Active Jetpack plan details.
	 */
	public static function get_active_plan() {
		_deprecated_function( __METHOD__, 'jetpack-7.2.0', 'Jetpack_Plan::get' );
		return Jetpack_Plan::get();
	}

	/**
	 * Determine whether the active plan supports a particular feature
	 *
	 * @deprecated 7.2.0 Use Jetpack_Plan::supports.
	 * @return bool True if plan supports feature, false if not.
	 */
	public static function active_plan_supports( $feature ) {
		_deprecated_function( __METHOD__, 'jetpack-7.2.0', 'Jetpack_Plan::supports' );
		return Jetpack_Plan::supports( $feature );
	}

	/**
	 * Deprecated: Is Jetpack in development (offline) mode?
	 *
	 * This static method is being left here intentionally without the use of _deprecated_function(), as other plugins
	 * and themes still use it, and we do not want to flood them with notices.
	 *
	 * Please use Automattic\Jetpack\Status()->is_offline_mode() instead.
	 *
	 * @deprecated since 8.0.
	 */
	public static function is_development_mode() {
		_deprecated_function( __METHOD__, 'jetpack-8.0', '\Automattic\Jetpack\Status->is_offline_mode' );
		return ( new Status() )->is_offline_mode();
	}

	/**
	 * Whether the site is currently onboarding or not.
	 * A site is considered as being onboarded if it currently has an onboarding token.
	 *
	 * @since 5.8
	 *
	 * @access public
	 * @static
	 *
	 * @return bool True if the site is currently onboarding, false otherwise
	 */
	public static function is_onboarding() {
		return Jetpack_Options::get_option( 'onboarding' ) !== false;
	}

	/**
	 * Determines reason for Jetpack offline mode.
	 */
	public static function development_mode_trigger_text() {
		$status = new Status();

		if ( ! $status->is_offline_mode() ) {
			return __( 'Jetpack is not in Offline Mode.', 'jetpack' );
		}

		if ( defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG ) {
			$notice = __( 'The JETPACK_DEV_DEBUG constant is defined in wp-config.php or elsewhere.', 'jetpack' );
		} elseif ( defined( 'WP_LOCAL_DEV' ) && WP_LOCAL_DEV ) {
			$notice = __( 'The WP_LOCAL_DEV constant is defined in wp-config.php or elsewhere.', 'jetpack' );
		} elseif ( $status->is_local_site() ) {
			$notice = __( 'The site URL is a known local development environment URL (e.g. http://localhost).', 'jetpack' );
			/** This filter is documented in packages/status/src/class-status.php */
		} elseif ( has_filter( 'jetpack_development_mode' ) && apply_filters( 'jetpack_development_mode', false ) ) { // This is a deprecated filter name.
			$notice = __( 'The jetpack_development_mode filter is set to true.', 'jetpack' );
		} else {
			$notice = __( 'The jetpack_offline_mode filter is set to true.', 'jetpack' );
		}

		return $notice;

	}
	/**
	 * Get Jetpack offline mode notice text and notice class.
	 *
	 * Mirrors the checks made in Automattic\Jetpack\Status->is_offline_mode
	 */
	public static function show_development_mode_notice() {
		if ( ( new Status() )->is_offline_mode() ) {
			$notice = sprintf(
				/* translators: %s is a URL */
				__( 'In <a href="%s" target="_blank">Offline Mode</a>:', 'jetpack' ),
				Redirect::get_url( 'jetpack-support-development-mode' )
			);

			$notice .= ' ' . self::development_mode_trigger_text();

			echo '<div class="updated" style="border-color: #f0821e;"><p>' . $notice . '</p></div>';
		}

		// Throw up a notice if using a development version and as for feedback.
		if ( self::is_development_version() ) {
			/* translators: %s is a URL */
			$notice = sprintf( __( 'You are currently running a development version of Jetpack. <a href="%s" target="_blank">Submit your feedback</a>', 'jetpack' ), Redirect::get_url( 'jetpack-contact-support-beta-group' ) );

			echo '<div class="updated" style="border-color: #f0821e;"><p>' . $notice . '</p></div>';
		}
		// Throw up a notice if using staging mode
		if ( ( new Status() )->is_staging_site() ) {
			/* translators: %s is a URL */
			$notice = sprintf( __( 'You are running Jetpack on a <a href="%s" target="_blank">staging server</a>.', 'jetpack' ), Redirect::get_url( 'jetpack-support-staging-sites' ) );

			echo '<div class="updated" style="border-color: #f0821e;"><p>' . $notice . '</p></div>';
		}
	}

	/**
	 * Whether Jetpack's version maps to a public release, or a development version.
	 */
	public static function is_development_version() {
		/**
		 * Allows filtering whether this is a development version of Jetpack.
		 *
		 * This filter is especially useful for tests.
		 *
		 * @since 4.3.0
		 *
		 * @param bool $development_version Is this a develoment version of Jetpack?
		 */
		return (bool) apply_filters(
			'jetpack_development_version',
			! preg_match( '/^\d+(\.\d+)+$/', Constants::get_constant( 'JETPACK__VERSION' ) )
		);
	}

	/**
	 * Is a given user (or the current user if none is specified) linked to a WordPress.com user?
	 */
	public static function is_user_connected( $user_id = false ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5', 'Automattic\\Jetpack\\Connection\\Manager\\is_user_connected' );
		return self::connection()->is_user_connected( $user_id );
	}

	/**
	 * Get the wpcom user data of the current|specified connected user.
	 */
	public static function get_connected_user_data( $user_id = null ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5', 'Automattic\\Jetpack\\Connection\\Manager\\get_connected_user_data' );
		return self::connection()->get_connected_user_data( $user_id );
	}

	/**
	 * Get the wpcom email of the current|specified connected user.
	 */
	public static function get_connected_user_email( $user_id = null ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		$xml = new Jetpack_IXR_Client(
			array(
				'user_id' => $user_id,
			)
		);
		$xml->query( 'wpcom.getUserEmail' );
		if ( ! $xml->isError() ) {
			return $xml->getResponse();
		}
		return false;
	}

	/**
	 * Get the wpcom email of the master user.
	 */
	public static function get_master_user_email() {
		$master_user_id = Jetpack_Options::get_option( 'master_user' );
		if ( $master_user_id ) {
			return self::get_connected_user_email( $master_user_id );
		}
		return '';
	}

	/**
	 * Whether the current user is the connection owner.
	 *
	 * @deprecated since 7.7
	 *
	 * @return bool Whether the current user is the connection owner.
	 */
	public function current_user_is_connection_owner() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::is_connection_owner' );
		return self::connection()->is_connection_owner();
	}

	/**
	 * Gets current user IP address.
	 *
	 * @param  bool $check_all_headers Check all headers? Default is `false`.
	 *
	 * @return string                  Current user IP address.
	 */
	public static function current_user_ip( $check_all_headers = false ) {
		if ( $check_all_headers ) {
			foreach ( array(
				'HTTP_CF_CONNECTING_IP',
				'HTTP_CLIENT_IP',
				'HTTP_X_FORWARDED_FOR',
				'HTTP_X_FORWARDED',
				'HTTP_X_CLUSTER_CLIENT_IP',
				'HTTP_FORWARDED_FOR',
				'HTTP_FORWARDED',
				'HTTP_VIA',
			) as $key ) {
				if ( ! empty( $_SERVER[ $key ] ) ) {
					return $_SERVER[ $key ];
				}
			}
		}

		return ! empty( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '';
	}

	/**
	 * Synchronize connected user role changes
	 */
	function user_role_change( $user_id ) {
		_deprecated_function( __METHOD__, 'jetpack-4.2', 'Users::user_role_change()' );
		Users::user_role_change( $user_id );
	}

	/**
	 * Loads the currently active modules.
	 */
	public static function load_modules() {
		$is_offline_mode = ( new Status() )->is_offline_mode();
		if (
			! self::is_connection_ready()
			&& ! $is_offline_mode
			&& ! self::is_onboarding()
			&& (
				! is_multisite()
				|| ! get_site_option( 'jetpack_protect_active' )
			)
		) {
			return;
		}

		$version = Jetpack_Options::get_option( 'version' );
		if ( ! $version ) {
			$version = $old_version = JETPACK__VERSION . ':' . time();
			/** This action is documented in class.jetpack.php */
			do_action( 'updating_jetpack_version', $version, false );
			Jetpack_Options::update_options( compact( 'version', 'old_version' ) );
		}
		list( $version ) = explode( ':', $version );

		$modules = array_filter( self::get_active_modules(), array( 'Jetpack', 'is_module' ) );

		$modules_data = array();

		// Don't load modules that have had "Major" changes since the stored version until they have been deactivated/reactivated through the lint check.
		if ( version_compare( $version, JETPACK__VERSION, '<' ) ) {
			$updated_modules = array();
			foreach ( $modules as $module ) {
				$modules_data[ $module ] = self::get_module( $module );
				if ( ! isset( $modules_data[ $module ]['changed'] ) ) {
					continue;
				}

				if ( version_compare( $modules_data[ $module ]['changed'], $version, '<=' ) ) {
					continue;
				}

				$updated_modules[] = $module;
			}

			$modules = array_diff( $modules, $updated_modules );
		}

		$is_site_connection = self::connection()->is_site_connection();

		foreach ( $modules as $index => $module ) {
			// If we're in offline/site-connection mode, disable modules requiring a connection/user connection.
			if ( $is_offline_mode || $is_site_connection ) {
				// Prime the pump if we need to
				if ( empty( $modules_data[ $module ] ) ) {
					$modules_data[ $module ] = self::get_module( $module );
				}
				// If the module requires a connection, but we're in local mode, don't include it.
				if ( $is_offline_mode && $modules_data[ $module ]['requires_connection'] ) {
					continue;
				}

				if ( $is_site_connection && $modules_data[ $module ]['requires_user_connection'] ) {
					continue;
				}
			}

			if ( did_action( 'jetpack_module_loaded_' . $module ) ) {
				continue;
			}

			if ( ! include_once self::get_module_path( $module ) ) {
				unset( $modules[ $index ] );
				self::update_active_modules( array_values( $modules ) );
				continue;
			}

			/**
			 * Fires when a specific module is loaded.
			 * The dynamic part of the hook, $module, is the module slug.
			 *
			 * @since 1.1.0
			 */
			do_action( 'jetpack_module_loaded_' . $module );
		}

		/**
		 * Fires when all the modules are loaded.
		 *
		 * @since 1.1.0
		 */
		do_action( 'jetpack_modules_loaded' );

		// Load module-specific code that is needed even when a module isn't active. Loaded here because code contained therein may need actions such as setup_theme.
		require_once JETPACK__PLUGIN_DIR . 'modules/module-extras.php';
	}

	/**
	 * Check if Jetpack's REST API compat file should be included
	 *
	 * @action plugins_loaded
	 * @return null
	 */
	public function check_rest_api_compat() {
		/**
		 * Filters the list of REST API compat files to be included.
		 *
		 * @since 2.2.5
		 *
		 * @param array $args Array of REST API compat files to include.
		 */
		$_jetpack_rest_api_compat_includes = apply_filters( 'jetpack_rest_api_compat', array() );

		foreach ( $_jetpack_rest_api_compat_includes as $_jetpack_rest_api_compat_include ) {
			require_once $_jetpack_rest_api_compat_include;
		}
	}

	/**
	 * Gets all plugins currently active in values, regardless of whether they're
	 * traditionally activated or network activated.
	 *
	 * @todo Store the result in core's object cache maybe?
	 */
	public static function get_active_plugins() {
		$active_plugins = (array) get_option( 'active_plugins', array() );

		if ( is_multisite() ) {
			// Due to legacy code, active_sitewide_plugins stores them in the keys,
			// whereas active_plugins stores them in the values.
			$network_plugins = array_keys( get_site_option( 'active_sitewide_plugins', array() ) );
			if ( $network_plugins ) {
				$active_plugins = array_merge( $active_plugins, $network_plugins );
			}
		}

		sort( $active_plugins );

		return array_unique( $active_plugins );
	}

	/**
	 * Gets and parses additional plugin data to send with the heartbeat data
	 *
	 * @since 3.8.1
	 *
	 * @return array Array of plugin data
	 */
	public static function get_parsed_plugin_data() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		$all_plugins    = apply_filters( 'all_plugins', get_plugins() );
		$active_plugins = self::get_active_plugins();

		$plugins = array();
		foreach ( $all_plugins as $path => $plugin_data ) {
			$plugins[ $path ] = array(
				'is_active' => in_array( $path, $active_plugins ),
				'file'      => $path,
				'name'      => $plugin_data['Name'],
				'version'   => $plugin_data['Version'],
				'author'    => $plugin_data['Author'],
			);
		}

		return $plugins;
	}

	/**
	 * Gets and parses theme data to send with the heartbeat data
	 *
	 * @since 3.8.1
	 *
	 * @return array Array of theme data
	 */
	public static function get_parsed_theme_data() {
		$all_themes  = wp_get_themes( array( 'allowed' => true ) );
		$header_keys = array( 'Name', 'Author', 'Version', 'ThemeURI', 'AuthorURI', 'Status', 'Tags' );

		$themes = array();
		foreach ( $all_themes as $slug => $theme_data ) {
			$theme_headers = array();
			foreach ( $header_keys as $header_key ) {
				$theme_headers[ $header_key ] = $theme_data->get( $header_key );
			}

			$themes[ $slug ] = array(
				'is_active_theme' => $slug == wp_get_theme()->get_template(),
				'slug'            => $slug,
				'theme_root'      => $theme_data->get_theme_root_uri(),
				'parent'          => $theme_data->parent(),
				'headers'         => $theme_headers,
			);
		}

		return $themes;
	}

	/**
	 * Checks whether a specific plugin is active.
	 *
	 * We don't want to store these in a static variable, in case
	 * there are switch_to_blog() calls involved.
	 */
	public static function is_plugin_active( $plugin = 'jetpack/jetpack.php' ) {
		return in_array( $plugin, self::get_active_plugins() );
	}

	/**
	 * Check if Jetpack's Open Graph tags should be used.
	 * If certain plugins are active, Jetpack's og tags are suppressed.
	 *
	 * @uses Jetpack::get_active_modules, add_filter, get_option, apply_filters
	 * @action plugins_loaded
	 * @return null
	 */
	public function check_open_graph() {
		if ( in_array( 'publicize', self::get_active_modules() ) || in_array( 'sharedaddy', self::get_active_modules() ) ) {
			add_filter( 'jetpack_enable_open_graph', '__return_true', 0 );
		}

		$active_plugins = self::get_active_plugins();

		if ( ! empty( $active_plugins ) ) {
			foreach ( $this->open_graph_conflicting_plugins as $plugin ) {
				if ( in_array( $plugin, $active_plugins ) ) {
					add_filter( 'jetpack_enable_open_graph', '__return_false', 99 );
					break;
				}
			}
		}

		/**
		 * Allow the addition of Open Graph Meta Tags to all pages.
		 *
		 * @since 2.0.3
		 *
		 * @param bool false Should Open Graph Meta tags be added. Default to false.
		 */
		if ( apply_filters( 'jetpack_enable_open_graph', false ) ) {
			require_once JETPACK__PLUGIN_DIR . 'functions.opengraph.php';
		}
	}

	/**
	 * Check if Jetpack's Twitter tags should be used.
	 * If certain plugins are active, Jetpack's twitter tags are suppressed.
	 *
	 * @uses Jetpack::get_active_modules, add_filter, get_option, apply_filters
	 * @action plugins_loaded
	 * @return null
	 */
	public function check_twitter_tags() {

		$active_plugins = self::get_active_plugins();

		if ( ! empty( $active_plugins ) ) {
			foreach ( $this->twitter_cards_conflicting_plugins as $plugin ) {
				if ( in_array( $plugin, $active_plugins ) ) {
					add_filter( 'jetpack_disable_twitter_cards', '__return_true', 99 );
					break;
				}
			}
		}

		/**
		 * Allow Twitter Card Meta tags to be disabled.
		 *
		 * @since 2.6.0
		 *
		 * @param bool true Should Twitter Card Meta tags be disabled. Default to true.
		 */
		if ( ! apply_filters( 'jetpack_disable_twitter_cards', false ) ) {
			require_once JETPACK__PLUGIN_DIR . 'class.jetpack-twitter-cards.php';
		}
	}

	/**
	 * Allows plugins to submit security reports.
	 *
	 * @param string $type         Report type (login_form, backup, file_scanning, spam)
	 * @param string $plugin_file  Plugin __FILE__, so that we can pull plugin data
	 * @param array  $args         See definitions above
	 */
	public static function submit_security_report( $type = '', $plugin_file = '', $args = array() ) {
		_deprecated_function( __FUNCTION__, 'jetpack-4.2', null );
	}

	/* Jetpack Options API */

	public static function get_option_names( $type = 'compact' ) {
		return Jetpack_Options::get_option_names( $type );
	}

	/**
	 * Returns the requested option.  Looks in jetpack_options or jetpack_$name as appropriate.
	 *
	 * @param string $name    Option name
	 * @param mixed  $default (optional)
	 */
	public static function get_option( $name, $default = false ) {
		return Jetpack_Options::get_option( $name, $default );
	}

	/**
	 * Updates the single given option.  Updates jetpack_options or jetpack_$name as appropriate.
	 *
	 * @deprecated 3.4 use Jetpack_Options::update_option() instead.
	 * @param string $name  Option name
	 * @param mixed  $value Option value
	 */
	public static function update_option( $name, $value ) {
		_deprecated_function( __METHOD__, 'jetpack-3.4', 'Jetpack_Options::update_option()' );
		return Jetpack_Options::update_option( $name, $value );
	}

	/**
	 * Updates the multiple given options.  Updates jetpack_options and/or jetpack_$name as appropriate.
	 *
	 * @deprecated 3.4 use Jetpack_Options::update_options() instead.
	 * @param array $array array( option name => option value, ... )
	 */
	public static function update_options( $array ) {
		_deprecated_function( __METHOD__, 'jetpack-3.4', 'Jetpack_Options::update_options()' );
		return Jetpack_Options::update_options( $array );
	}

	/**
	 * Deletes the given option.  May be passed multiple option names as an array.
	 * Updates jetpack_options and/or deletes jetpack_$name as appropriate.
	 *
	 * @deprecated 3.4 use Jetpack_Options::delete_option() instead.
	 * @param string|array $names
	 */
	public static function delete_option( $names ) {
		_deprecated_function( __METHOD__, 'jetpack-3.4', 'Jetpack_Options::delete_option()' );
		return Jetpack_Options::delete_option( $names );
	}

	/**
	 * Enters a user token into the user_tokens option
	 *
	 * @deprecated 8.0 Use Automattic\Jetpack\Connection\Tokens->update_user_token() instead.
	 *
	 * @param int    $user_id The user id.
	 * @param string $token The user token.
	 * @param bool   $is_master_user Whether the user is the master user.
	 * @return bool
	 */
	public static function update_user_token( $user_id, $token, $is_master_user ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5', 'Automattic\\Jetpack\\Connection\\Tokens->update_user_token' );
		return ( new Tokens() )->update_user_token( $user_id, $token, $is_master_user );
	}

	/**
	 * Returns an array of all PHP files in the specified absolute path.
	 * Equivalent to glob( "$absolute_path/*.php" ).
	 *
	 * @param string $absolute_path The absolute path of the directory to search.
	 * @return array Array of absolute paths to the PHP files.
	 */
	public static function glob_php( $absolute_path ) {
		if ( function_exists( 'glob' ) ) {
			return glob( "$absolute_path/*.php" );
		}

		$absolute_path = untrailingslashit( $absolute_path );
		$files         = array();
		if ( ! $dir = @opendir( $absolute_path ) ) {
			return $files;
		}

		while ( false !== $file = readdir( $dir ) ) {
			if ( '.' == substr( $file, 0, 1 ) || '.php' != substr( $file, -4 ) ) {
				continue;
			}

			$file = "$absolute_path/$file";

			if ( ! is_file( $file ) ) {
				continue;
			}

			$files[] = $file;
		}

		closedir( $dir );

		return $files;
	}

	public static function activate_new_modules( $redirect = false ) {
		if ( ! self::is_connection_ready() && ! ( new Status() )->is_offline_mode() ) {
			return;
		}

		$jetpack_old_version = Jetpack_Options::get_option( 'version' ); // [sic]
		if ( ! $jetpack_old_version ) {
			$jetpack_old_version = $version = $old_version = '1.1:' . time();
			/** This action is documented in class.jetpack.php */
			do_action( 'updating_jetpack_version', $version, false );
			Jetpack_Options::update_options( compact( 'version', 'old_version' ) );
		}

		list( $jetpack_version ) = explode( ':', $jetpack_old_version ); // [sic]

		if ( version_compare( JETPACK__VERSION, $jetpack_version, '<=' ) ) {
			return;
		}

		$active_modules     = self::get_active_modules();
		$reactivate_modules = array();
		foreach ( $active_modules as $active_module ) {
			$module = self::get_module( $active_module );
			if ( ! isset( $module['changed'] ) ) {
				continue;
			}

			if ( version_compare( $module['changed'], $jetpack_version, '<=' ) ) {
				continue;
			}

			$reactivate_modules[] = $active_module;
			self::deactivate_module( $active_module );
		}

		$new_version = JETPACK__VERSION . ':' . time();
		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', $new_version, $jetpack_old_version );
		Jetpack_Options::update_options(
			array(
				'version'     => $new_version,
				'old_version' => $jetpack_old_version,
			)
		);

		self::state( 'message', 'modules_activated' );

		self::activate_default_modules( $jetpack_version, JETPACK__VERSION, $reactivate_modules, $redirect );

		if ( $redirect ) {
			$page = 'jetpack'; // make sure we redirect to either settings or the jetpack page
			if ( isset( $_GET['page'] ) && in_array( $_GET['page'], array( 'jetpack', 'jetpack_modules' ) ) ) {
				$page = $_GET['page'];
			}

			wp_safe_redirect( self::admin_url( 'page=' . $page ) );
			exit;
		}
	}

	/**
	 * List available Jetpack modules. Simply lists .php files in /modules/.
	 * Make sure to tuck away module "library" files in a sub-directory.
	 *
	 * @param bool|string $min_version Only return modules introduced in this version or later. Default is false, do not filter.
	 * @param bool|string $max_version Only return modules introduced before this version. Default is false, do not filter.
	 * @param bool|null   $requires_connection Pass a boolean value to only return modules that require (or do not require) a connection.
	 * @param bool|null   $requires_user_connection Pass a boolean value to only return modules that require (or do not require) a user connection.
	 *
	 * @return array $modules Array of module slugs
	 */
	public static function get_available_modules( $min_version = false, $max_version = false, $requires_connection = null, $requires_user_connection = null ) {
		static $modules = null;

		if ( ! isset( $modules ) ) {
			$available_modules_option = Jetpack_Options::get_option( 'available_modules', array() );
			// Use the cache if we're on the front-end and it's available...
			if ( ! is_admin() && ! empty( $available_modules_option[ JETPACK__VERSION ] ) ) {
				$modules = $available_modules_option[ JETPACK__VERSION ];
			} else {
				$files = self::glob_php( JETPACK__PLUGIN_DIR . 'modules' );

				$modules = array();

				foreach ( $files as $file ) {
					$slug    = self::get_module_slug( $file );
					$headers = self::get_module( $slug );

					if ( ! $headers ) {
						continue;
					}

					$modules[ $slug ] = $headers['introduced'];
				}

				Jetpack_Options::update_option(
					'available_modules',
					array(
						JETPACK__VERSION => $modules,
					)
				);
			}
		}

		/**
		 * Filters the array of modules available to be activated.
		 *
		 * @since 2.4.0
		 *
		 * @param array $modules Array of available modules.
		 * @param string $min_version Minimum version number required to use modules.
		 * @param string $max_version Maximum version number required to use modules.
		 * @param bool|null $requires_connection Value of the Requires Connection filter.
		 * @param bool|null $requires_user_connection Value of the Requires User Connection filter.
		 */
		$mods = apply_filters( 'jetpack_get_available_modules', $modules, $min_version, $max_version, $requires_connection, $requires_user_connection );

		if ( ! $min_version && ! $max_version && is_null( $requires_connection ) && is_null( $requires_user_connection ) ) {
			return array_keys( $mods );
		}

		$r = array();
		foreach ( $mods as $slug => $introduced ) {
			if ( $min_version && version_compare( $min_version, $introduced, '>=' ) ) {
				continue;
			}

			if ( $max_version && version_compare( $max_version, $introduced, '<' ) ) {
				continue;
			}

			$mod_details = self::get_module( $slug );

			if ( null !== $requires_connection && (bool) $requires_connection !== $mod_details['requires_connection'] ) {
				continue;
			}

			if ( null !== $requires_user_connection && (bool) $requires_user_connection !== $mod_details['requires_user_connection'] ) {
				continue;
			}

			$r[] = $slug;
		}

		return $r;
	}

	/**
	 * Get default modules loaded on activation.
	 *
	 * @param bool|string $min_version Onlu return modules introduced in this version or later. Default is false, do not filter.
	 * @param bool|string $max_version Only return modules introduced before this version. Default is false, do not filter.
	 * @param bool|null   $requires_connection Pass a boolean value to only return modules that require (or do not require) a connection.
	 * @param bool|null   $requires_user_connection Pass a boolean value to only return modules that require (or do not require) a user connection.
	 *
	 * @return array $modules Array of module slugs
	 */
	public static function get_default_modules( $min_version = false, $max_version = false, $requires_connection = null, $requires_user_connection = null ) {
		$return = array();

		foreach ( self::get_available_modules( $min_version, $max_version, $requires_connection, $requires_user_connection ) as $module ) {
			$module_data = self::get_module( $module );

			switch ( strtolower( $module_data['auto_activate'] ) ) {
				case 'yes':
					$return[] = $module;
					break;
				case 'public':
					if ( Jetpack_Options::get_option( 'public' ) ) {
						$return[] = $module;
					}
					break;
				case 'no':
				default:
					break;
			}
		}
		/**
		 * Filters the array of default modules.
		 *
		 * @since 2.5.0
		 *
		 * @param array $return Array of default modules.
		 * @param string $min_version Minimum version number required to use modules.
		 * @param string $max_version Maximum version number required to use modules.
		 * @param bool|null $requires_connection Value of the Requires Connection filter.
		 * @param bool|null $requires_user_connection Value of the Requires User Connection filter.
		 */
		return apply_filters( 'jetpack_get_default_modules', $return, $min_version, $max_version, $requires_connection, $requires_user_connection );
	}

	/**
	 * Checks activated modules during auto-activation to determine
	 * if any of those modules are being deprecated.  If so, close
	 * them out, and add any replacement modules.
	 *
	 * Runs at priority 99 by default.
	 *
	 * This is run late, so that it can still activate a module if
	 * the new module is a replacement for another that the user
	 * currently has active, even if something at the normal priority
	 * would kibosh everything.
	 *
	 * @since 2.6
	 * @uses jetpack_get_default_modules filter
	 * @param array $modules
	 * @return array
	 */
	function handle_deprecated_modules( $modules ) {
		$deprecated_modules = array(
			'debug'            => null,  // Closed out and moved to the debugger library.
			'wpcc'             => 'sso', // Closed out in 2.6 -- SSO provides the same functionality.
			'gplus-authorship' => null,  // Closed out in 3.2 -- Google dropped support.
			'minileven'        => null,  // Closed out in 8.3 -- Responsive themes are common now, and so is AMP.
		);

		// Don't activate SSO if they never completed activating WPCC.
		if ( self::is_module_active( 'wpcc' ) ) {
			$wpcc_options = Jetpack_Options::get_option( 'wpcc_options' );
			if ( empty( $wpcc_options ) || empty( $wpcc_options['client_id'] ) || empty( $wpcc_options['client_id'] ) ) {
				$deprecated_modules['wpcc'] = null;
			}
		}

		foreach ( $deprecated_modules as $module => $replacement ) {
			if ( self::is_module_active( $module ) ) {
				self::deactivate_module( $module );
				if ( $replacement ) {
					$modules[] = $replacement;
				}
			}
		}

		return array_unique( $modules );
	}

	/**
	 * Checks activated plugins during auto-activation to determine
	 * if any of those plugins are in the list with a corresponding module
	 * that is not compatible with the plugin. The module will not be allowed
	 * to auto-activate.
	 *
	 * @since 2.6
	 * @uses jetpack_get_default_modules filter
	 * @param array $modules
	 * @return array
	 */
	function filter_default_modules( $modules ) {

		$active_plugins = self::get_active_plugins();

		if ( ! empty( $active_plugins ) ) {

			// For each module we'd like to auto-activate...
			foreach ( $modules as $key => $module ) {
				// If there are potential conflicts for it...
				if ( ! empty( $this->conflicting_plugins[ $module ] ) ) {
					// For each potential conflict...
					foreach ( $this->conflicting_plugins[ $module ] as $title => $plugin ) {
						// If that conflicting plugin is active...
						if ( in_array( $plugin, $active_plugins ) ) {
							// Remove that item from being auto-activated.
							unset( $modules[ $key ] );
						}
					}
				}
			}
		}

		return $modules;
	}

	/**
	 * Extract a module's slug from its full path.
	 */
	public static function get_module_slug( $file ) {
		return str_replace( '.php', '', basename( $file ) );
	}

	/**
	 * Generate a module's path from its slug.
	 */
	public static function get_module_path( $slug ) {
		/**
		 * Filters the path of a modules.
		 *
		 * @since 7.4.0
		 *
		 * @param array $return The absolute path to a module's root php file
		 * @param string $slug The module slug
		 */
		return apply_filters( 'jetpack_get_module_path', JETPACK__PLUGIN_DIR . "modules/$slug.php", $slug );
	}

	/**
	 * Load module data from module file. Headers differ from WordPress
	 * plugin headers to avoid them being identified as standalone
	 * plugins on the WordPress plugins page.
	 *
	 * @param string $module The module slug.
	 */
	public static function get_module( $module ) {
		static $modules_details;

		if ( jetpack_has_no_module_info( $module ) ) {
			return false;
		}

		$file = self::get_module_path( self::get_module_slug( $module ) );

		if ( isset( $modules_details[ $module ] ) ) {
			$mod = $modules_details[ $module ];
		} else {
			$mod = jetpack_get_module_info( $module );

			if ( null === $mod ) {
				// Try to get the module info from the file as a fallback.
				$mod = self::get_file_data( $file, jetpack_get_all_module_header_names() );

				if ( empty( $mod['name'] ) ) {
					// No info for this module.
					return false;
				}
			}

			$mod['sort']                     = empty( $mod['sort'] ) ? 10 : (int) $mod['sort'];
			$mod['recommendation_order']     = empty( $mod['recommendation_order'] ) ? 20 : (int) $mod['recommendation_order'];
			$mod['deactivate']               = empty( $mod['deactivate'] );
			$mod['free']                     = empty( $mod['free'] );
			$mod['requires_connection']      = ( ! empty( $mod['requires_connection'] ) && 'No' === $mod['requires_connection'] ) ? false : true;
			$mod['requires_user_connection'] = ( empty( $mod['requires_user_connection'] ) || 'No' === $mod['requires_user_connection'] ) ? false : true;

			if ( empty( $mod['auto_activate'] ) || ! in_array( strtolower( $mod['auto_activate'] ), array( 'yes', 'no', 'public' ), true ) ) {
				$mod['auto_activate'] = 'No';
			} else {
				$mod['auto_activate'] = (string) $mod['auto_activate'];
			}

			if ( $mod['module_tags'] ) {
				$mod['module_tags'] = explode( ',', $mod['module_tags'] );
				$mod['module_tags'] = array_map( 'trim', $mod['module_tags'] );
				$mod['module_tags'] = array_map( array( __CLASS__, 'translate_module_tag' ), $mod['module_tags'] );
			} else {
				$mod['module_tags'] = array( self::translate_module_tag( 'Other' ) );
			}

			if ( $mod['plan_classes'] ) {
				$mod['plan_classes'] = explode( ',', $mod['plan_classes'] );
				$mod['plan_classes'] = array_map( 'strtolower', array_map( 'trim', $mod['plan_classes'] ) );
			} else {
				$mod['plan_classes'] = array( 'free' );
			}

			if ( $mod['feature'] ) {
				$mod['feature'] = explode( ',', $mod['feature'] );
				$mod['feature'] = array_map( 'trim', $mod['feature'] );
			} else {
				$mod['feature'] = array( self::translate_module_tag( 'Other' ) );
			}

			$modules_details[ $module ] = $mod;

		}

		/**
		 * Filters the feature array on a module.
		 *
		 * This filter allows you to control where each module is filtered: Recommended,
		 * and the default "Other" listing.
		 *
		 * @since 3.5.0
		 *
		 * @param array   $mod['feature'] The areas to feature this module:
		 *     'Recommended' shows on the main Jetpack admin screen.
		 *     'Other' should be the default if no other value is in the array.
		 * @param string  $module The slug of the module, e.g. sharedaddy.
		 * @param array   $mod All the currently assembled module data.
		 */
		$mod['feature'] = apply_filters( 'jetpack_module_feature', $mod['feature'], $module, $mod );

		/**
		 * Filter the returned data about a module.
		 *
		 * This filter allows overriding any info about Jetpack modules. It is dangerous,
		 * so please be careful.
		 *
		 * @since 3.6.0
		 *
		 * @param array   $mod    The details of the requested module.
		 * @param string  $module The slug of the module, e.g. sharedaddy
		 * @param string  $file   The path to the module source file.
		 */
		return apply_filters( 'jetpack_get_module', $mod, $module, $file );
	}

	/**
	 * Like core's get_file_data implementation, but caches the result.
	 */
	public static function get_file_data( $file, $headers ) {
		// Get just the filename from $file (i.e. exclude full path) so that a consistent hash is generated
		$file_name = basename( $file );

		$cache_key = 'jetpack_file_data_' . JETPACK__VERSION;

		$file_data_option = get_transient( $cache_key );

		if ( ! is_array( $file_data_option ) ) {
			delete_transient( $cache_key );
			$file_data_option = false;
		}

		if ( false === $file_data_option ) {
			$file_data_option = array();
		}

		$key           = md5( $file_name . serialize( $headers ) );
		$refresh_cache = is_admin() && isset( $_GET['page'] ) && 'jetpack' === substr( $_GET['page'], 0, 7 );

		// If we don't need to refresh the cache, and already have the value, short-circuit!
		if ( ! $refresh_cache && isset( $file_data_option[ $key ] ) ) {
			return $file_data_option[ $key ];
		}

		$data = get_file_data( $file, $headers );

		$file_data_option[ $key ] = $data;

		set_transient( $cache_key, $file_data_option, 29 * DAY_IN_SECONDS );

		return $data;
	}

	/**
	 * Return translated module tag.
	 *
	 * @param string $tag Tag as it appears in each module heading.
	 *
	 * @return mixed
	 */
	public static function translate_module_tag( $tag ) {
		return jetpack_get_module_i18n_tag( $tag );
	}

	/**
	 * Return module name translation. Uses matching string created in modules/module-headings.php.
	 *
	 * @since 3.9.2
	 *
	 * @param array $modules
	 *
	 * @return string|void
	 */
	public static function get_translated_modules( $modules ) {
		foreach ( $modules as $index => $module ) {
			$i18n_module = jetpack_get_module_i18n( $module['module'] );
			if ( isset( $module['name'] ) ) {
				$modules[ $index ]['name'] = $i18n_module['name'];
			}
			if ( isset( $module['description'] ) ) {
				$modules[ $index ]['description']       = $i18n_module['description'];
				$modules[ $index ]['short_description'] = $i18n_module['description'];
			}
		}
		return $modules;
	}

	/**
	 * Get a list of activated modules as an array of module slugs.
	 */
	public static function get_active_modules() {
		$active = Jetpack_Options::get_option( 'active_modules' );

		if ( ! is_array( $active ) ) {
			$active = array();
		}

		if ( class_exists( 'VaultPress' ) || function_exists( 'vaultpress_contact_service' ) ) {
			$active[] = 'vaultpress';
		} else {
			$active = array_diff( $active, array( 'vaultpress' ) );
		}

		// If protect is active on the main site of a multisite, it should be active on all sites.
		if ( ! in_array( 'protect', $active ) && is_multisite() && get_site_option( 'jetpack_protect_active' ) ) {
			$active[] = 'protect';
		}

		/**
		 * Allow filtering of the active modules.
		 *
		 * Gives theme and plugin developers the power to alter the modules that
		 * are activated on the fly.
		 *
		 * @since 5.8.0
		 *
		 * @param array $active Array of active module slugs.
		 */
		$active = apply_filters( 'jetpack_active_modules', $active );

		return array_unique( $active );
	}

	/**
	 * Check whether or not a Jetpack module is active.
	 *
	 * @param string $module The slug of a Jetpack module.
	 * @return bool
	 *
	 * @static
	 */
	public static function is_module_active( $module ) {
		return in_array( $module, self::get_active_modules() );
	}

	public static function is_module( $module ) {
		return ! empty( $module ) && ! validate_file( $module, self::get_available_modules() );
	}

	/**
	 * Catches PHP errors.  Must be used in conjunction with output buffering.
	 *
	 * @param bool $catch True to start catching, False to stop.
	 *
	 * @static
	 */
	public static function catch_errors( $catch ) {
		static $display_errors, $error_reporting;

		if ( $catch ) {
			$display_errors  = @ini_set( 'display_errors', 1 );
			$error_reporting = @error_reporting( E_ALL );
			add_action( 'shutdown', array( 'Jetpack', 'catch_errors_on_shutdown' ), 0 );
		} else {
			@ini_set( 'display_errors', $display_errors );
			@error_reporting( $error_reporting );
			remove_action( 'shutdown', array( 'Jetpack', 'catch_errors_on_shutdown' ), 0 );
		}
	}

	/**
	 * Saves any generated PHP errors in ::state( 'php_errors', {errors} )
	 */
	public static function catch_errors_on_shutdown() {
		self::state( 'php_errors', self::alias_directories( ob_get_clean() ) );
	}

	/**
	 * Rewrite any string to make paths easier to read.
	 *
	 * Rewrites ABSPATH (eg `/home/jetpack/wordpress/`) to ABSPATH, and if WP_CONTENT_DIR
	 * is located outside of ABSPATH, rewrites that to WP_CONTENT_DIR.
	 *
	 * @param $string
	 * @return mixed
	 */
	public static function alias_directories( $string ) {
		// ABSPATH has a trailing slash.
		$string = str_replace( ABSPATH, 'ABSPATH/', $string );
		// WP_CONTENT_DIR does not have a trailing slash.
		$string = str_replace( WP_CONTENT_DIR, 'WP_CONTENT_DIR', $string );

		return $string;
	}

	public static function activate_default_modules(
		$min_version = false,
		$max_version = false,
		$other_modules = array(),
		$redirect = null,
		$send_state_messages = null,
		$requires_connection = null,
		$requires_user_connection = null
	) {
		$jetpack = self::init();

		if ( is_null( $redirect ) ) {
			if (
				( defined( 'REST_REQUEST' ) && REST_REQUEST )
			||
				( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST )
			||
				( defined( 'WP_CLI' ) && WP_CLI )
			||
				( defined( 'DOING_CRON' ) && DOING_CRON )
			||
				( defined( 'DOING_AJAX' ) && DOING_AJAX )
			) {
				$redirect = false;
			} elseif ( is_admin() ) {
				$redirect = true;
			} else {
				$redirect = false;
			}
		}

		if ( is_null( $send_state_messages ) ) {
			$send_state_messages = current_user_can( 'jetpack_activate_modules' );
		}

		$modules = self::get_default_modules( $min_version, $max_version, $requires_connection, $requires_user_connection );
		$modules = array_merge( $other_modules, $modules );

		// Look for standalone plugins and disable if active.

		$to_deactivate = array();
		foreach ( $modules as $module ) {
			if ( isset( $jetpack->plugins_to_deactivate[ $module ] ) ) {
				$to_deactivate[ $module ] = $jetpack->plugins_to_deactivate[ $module ];
			}
		}

		$deactivated = array();
		foreach ( $to_deactivate as $module => $deactivate_me ) {
			list( $probable_file, $probable_title ) = $deactivate_me;
			if ( Jetpack_Client_Server::deactivate_plugin( $probable_file, $probable_title ) ) {
				$deactivated[] = $module;
			}
		}

		if ( $deactivated ) {
			if ( $send_state_messages ) {
				self::state( 'deactivated_plugins', join( ',', $deactivated ) );
			}

			if ( $redirect ) {
				$url = add_query_arg(
					array(
						'action'   => 'activate_default_modules',
						'_wpnonce' => wp_create_nonce( 'activate_default_modules' ),
					),
					add_query_arg( compact( 'min_version', 'max_version', 'other_modules' ), self::admin_url( 'page=jetpack' ) )
				);
				wp_safe_redirect( $url );
				exit;
			}
		}

		/**
		 * Fires before default modules are activated.
		 *
		 * @since 1.9.0
		 *
		 * @param string    $min_version Minimum version number required to use modules.
		 * @param string    $max_version Maximum version number required to use modules.
		 * @param array     $other_modules Array of other modules to activate alongside the default modules.
		 * @param bool|null $requires_connection Value of the Requires Connection filter.
		 * @param bool|null $requires_user_connection Value of the Requires User Connection filter.
		 */
		do_action( 'jetpack_before_activate_default_modules', $min_version, $max_version, $other_modules, $requires_connection, $requires_user_connection );

		// Check each module for fatal errors, a la wp-admin/plugins.php::activate before activating
		if ( $send_state_messages ) {
			self::restate();
			self::catch_errors( true );
		}

		$active = self::get_active_modules();

		foreach ( $modules as $module ) {
			if ( did_action( "jetpack_module_loaded_$module" ) ) {
				$active[] = $module;
				self::update_active_modules( $active );
				continue;
			}

			if ( $send_state_messages && in_array( $module, $active ) ) {
				$module_info = self::get_module( $module );
				if ( ! $module_info['deactivate'] ) {
					$state = in_array( $module, $other_modules ) ? 'reactivated_modules' : 'activated_modules';
					if ( $active_state = self::state( $state ) ) {
						$active_state = explode( ',', $active_state );
					} else {
						$active_state = array();
					}
					$active_state[] = $module;
					self::state( $state, implode( ',', $active_state ) );
				}
				continue;
			}

			$file = self::get_module_path( $module );
			if ( ! file_exists( $file ) ) {
				continue;
			}

			// we'll override this later if the plugin can be included without fatal error
			if ( $redirect ) {
				wp_safe_redirect( self::admin_url( 'page=jetpack' ) );
			}

			if ( $send_state_messages ) {
				self::state( 'error', 'module_activation_failed' );
				self::state( 'module', $module );
			}

			ob_start();
			require_once $file;

			$active[] = $module;

			if ( $send_state_messages ) {

				$state = in_array( $module, $other_modules ) ? 'reactivated_modules' : 'activated_modules';
				if ( $active_state = self::state( $state ) ) {
					$active_state = explode( ',', $active_state );
				} else {
					$active_state = array();
				}
				$active_state[] = $module;
				self::state( $state, implode( ',', $active_state ) );
			}

			self::update_active_modules( $active );

			ob_end_clean();
		}

		if ( $send_state_messages ) {
			self::state( 'error', false );
			self::state( 'module', false );
		}

		self::catch_errors( false );
		/**
		 * Fires when default modules are activated.
		 *
		 * @since 1.9.0
		 *
		 * @param string    $min_version Minimum version number required to use modules.
		 * @param string    $max_version Maximum version number required to use modules.
		 * @param array     $other_modules Array of other modules to activate alongside the default modules.
		 * @param bool|null $requires_connection Value of the Requires Connection filter.
		 * @param bool|null $requires_user_connection Value of the Requires User Connection filter.
		 */
		do_action( 'jetpack_activate_default_modules', $min_version, $max_version, $other_modules, $requires_connection, $requires_user_connection );
	}

	public static function activate_module( $module, $exit = true, $redirect = true ) {
		/**
		 * Fires before a module is activated.
		 *
		 * @since 2.6.0
		 *
		 * @param string $module Module slug.
		 * @param bool $exit Should we exit after the module has been activated. Default to true.
		 * @param bool $redirect Should the user be redirected after module activation? Default to true.
		 */
		do_action( 'jetpack_pre_activate_module', $module, $exit, $redirect );

		$jetpack = self::init();

		if ( ! strlen( $module ) ) {
			return false;
		}

		if ( ! self::is_module( $module ) ) {
			return false;
		}

		// If it's already active, then don't do it again
		$active = self::get_active_modules();
		foreach ( $active as $act ) {
			if ( $act == $module ) {
				return true;
			}
		}

		$module_data = self::get_module( $module );

		$is_offline_mode = ( new Status() )->is_offline_mode();
		if ( ! self::is_connection_ready() ) {
			if ( ! $is_offline_mode && ! self::is_onboarding() ) {
				return false;
			}

			// If we're not connected but in offline mode, make sure the module doesn't require a connection.
			if ( $is_offline_mode && $module_data['requires_connection'] ) {
				return false;
			}
		}

		// Check and see if the old plugin is active
		if ( isset( $jetpack->plugins_to_deactivate[ $module ] ) ) {
			// Deactivate the old plugin
			if ( Jetpack_Client_Server::deactivate_plugin( $jetpack->plugins_to_deactivate[ $module ][0], $jetpack->plugins_to_deactivate[ $module ][1] ) ) {
				// If we deactivated the old plugin, remembere that with ::state() and redirect back to this page to activate the module
				// We can't activate the module on this page load since the newly deactivated old plugin is still loaded on this page load.
				self::state( 'deactivated_plugins', $module );
				wp_safe_redirect( add_query_arg( 'jetpack_restate', 1 ) );
				exit;
			}
		}

		// Protect won't work with mis-configured IPs
		if ( 'protect' === $module ) {
			include_once JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php';
			if ( ! jetpack_protect_get_ip() ) {
				self::state( 'message', 'protect_misconfigured_ip' );
				return false;
			}
		}

		if ( ! Jetpack_Plan::supports( $module ) ) {
			return false;
		}

		// Check the file for fatal errors, a la wp-admin/plugins.php::activate
		self::state( 'module', $module );
		self::state( 'error', 'module_activation_failed' ); // we'll override this later if the plugin can be included without fatal error

		self::catch_errors( true );
		ob_start();
		require self::get_module_path( $module );
		/** This action is documented in class.jetpack.php */
		do_action( 'jetpack_activate_module', $module );
		$active[] = $module;
		self::update_active_modules( $active );

		self::state( 'error', false ); // the override
		ob_end_clean();
		self::catch_errors( false );

		if ( $redirect ) {
			wp_safe_redirect( self::admin_url( 'page=jetpack' ) );
		}
		if ( $exit ) {
			exit;
		}
		return true;
	}

	function activate_module_actions( $module ) {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
	}

	public static function deactivate_module( $module ) {
		/**
		 * Fires when a module is deactivated.
		 *
		 * @since 1.9.0
		 *
		 * @param string $module Module slug.
		 */
		do_action( 'jetpack_pre_deactivate_module', $module );

		$jetpack = self::init();

		$active = self::get_active_modules();
		$new    = array_filter( array_diff( $active, (array) $module ) );

		return self::update_active_modules( $new );
	}

	public static function enable_module_configurable( $module ) {
		$module = self::get_module_slug( $module );
		add_filter( 'jetpack_module_configurable_' . $module, '__return_true' );
	}

	/**
	 * Composes a module configure URL. It uses Jetpack settings search as default value
	 * It is possible to redefine resulting URL by using "jetpack_module_configuration_url_$module" filter
	 *
	 * @param string $module Module slug
	 * @return string $url module configuration URL
	 */
	public static function module_configuration_url( $module ) {
		$module      = self::get_module_slug( $module );
		$default_url = self::admin_url() . "#/settings?term=$module";
		/**
		 * Allows to modify configure_url of specific module to be able to redirect to some custom location.
		 *
		 * @since 6.9.0
		 *
		 * @param string $default_url Default url, which redirects to jetpack settings page.
		 */
		$url = apply_filters( 'jetpack_module_configuration_url_' . $module, $default_url );

		return $url;
	}

	/* Installation */
	public static function bail_on_activation( $message, $deactivate = true ) {
		?>
<!doctype html>
<html>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<style>
* {
	text-align: center;
	margin: 0;
	padding: 0;
	font-family: "Lucida Grande",Verdana,Arial,"Bitstream Vera Sans",sans-serif;
}
p {
	margin-top: 1em;
	font-size: 18px;
}
</style>
<body>
<p><?php echo esc_html( $message ); ?></p>
</body>
</html>
		<?php
		if ( $deactivate ) {
			$plugins = get_option( 'active_plugins' );
			$jetpack = plugin_basename( JETPACK__PLUGIN_DIR . 'jetpack.php' );
			$update  = false;
			foreach ( $plugins as $i => $plugin ) {
				if ( $plugin === $jetpack ) {
					$plugins[ $i ] = false;
					$update        = true;
				}
			}

			if ( $update ) {
				update_option( 'active_plugins', array_filter( $plugins ) );
			}
		}
		exit;
	}

	/**
	 * Attached to activate_{ plugin_basename( __FILES__ ) } by register_activation_hook()
	 *
	 * @static
	 */
	public static function plugin_activation( $network_wide ) {
		Jetpack_Options::update_option( 'activated', 1 );

		if ( version_compare( $GLOBALS['wp_version'], JETPACK__MINIMUM_WP_VERSION, '<' ) ) {
			self::bail_on_activation( sprintf( __( 'Jetpack requires WordPress version %s or later.', 'jetpack' ), JETPACK__MINIMUM_WP_VERSION ) );
		}

		if ( $network_wide ) {
			self::state( 'network_nag', true );
		}

		// For firing one-off events (notices) immediately after activation
		set_transient( 'activated_jetpack', true, 0.1 * MINUTE_IN_SECONDS );

		update_option( 'jetpack_activation_source', self::get_activation_source( wp_get_referer() ) );

		Health::on_jetpack_activated();

		self::plugin_initialize();
	}

	public static function get_activation_source( $referer_url ) {

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return array( 'wp-cli', null );
		}

		$referer = wp_parse_url( $referer_url );

		$source_type  = 'unknown';
		$source_query = null;

		if ( ! is_array( $referer ) ) {
			return array( $source_type, $source_query );
		}

		$plugins_path         = wp_parse_url( admin_url( 'plugins.php' ), PHP_URL_PATH );
		$plugins_install_path = wp_parse_url( admin_url( 'plugin-install.php' ), PHP_URL_PATH );// /wp-admin/plugin-install.php

		if ( isset( $referer['query'] ) ) {
			parse_str( $referer['query'], $query_parts );
		} else {
			$query_parts = array();
		}

		if ( $plugins_path === $referer['path'] ) {
			$source_type = 'list';
		} elseif ( $plugins_install_path === $referer['path'] ) {
			$tab = isset( $query_parts['tab'] ) ? $query_parts['tab'] : 'featured';
			switch ( $tab ) {
				case 'popular':
					$source_type = 'popular';
					break;
				case 'recommended':
					$source_type = 'recommended';
					break;
				case 'favorites':
					$source_type = 'favorites';
					break;
				case 'search':
					$source_type  = 'search-' . ( isset( $query_parts['type'] ) ? $query_parts['type'] : 'term' );
					$source_query = isset( $query_parts['s'] ) ? $query_parts['s'] : null;
					break;
				default:
					$source_type = 'featured';
			}
		}

		return array( $source_type, $source_query );
	}

	/**
	 * Runs before bumping version numbers up to a new version
	 *
	 * @param string $version    Version:timestamp.
	 * @param string $old_version Old Version:timestamp or false if not set yet.
	 */
	public static function do_version_bump( $version, $old_version ) {
		if ( $old_version ) { // For existing Jetpack installations.
			add_action( 'admin_enqueue_scripts', __CLASS__ . '::enqueue_block_style' );

			// If a front end page is visited after the update, the 'wp' action will fire.
			add_action( 'wp', 'Jetpack::set_update_modal_display' );

			// If an admin page is visited after the update, the 'current_screen' action will fire.
			add_action( 'current_screen', 'Jetpack::set_update_modal_display' );
		}
	}

	/**
	 * Sets the display_update_modal state.
	 */
	public static function set_update_modal_display() {
		self::state( 'display_update_modal', true );

	}

	/**
	 * Enqueues the block library styles.
	 *
	 * @param string $hook The current admin page.
	 */
	public static function enqueue_block_style( $hook ) {
		if ( 'toplevel_page_jetpack' === $hook ) {
			wp_enqueue_style( 'wp-block-library' );
		}
	}

	/**
	 * Sets the internal version number and activation state.
	 *
	 * @static
	 */
	public static function plugin_initialize() {
		if ( ! Jetpack_Options::get_option( 'activated' ) ) {
			Jetpack_Options::update_option( 'activated', 2 );
		}

		if ( ! Jetpack_Options::get_option( 'version' ) ) {
			$version = $old_version = JETPACK__VERSION . ':' . time();
			/** This action is documented in class.jetpack.php */
			do_action( 'updating_jetpack_version', $version, false );
			Jetpack_Options::update_options( compact( 'version', 'old_version' ) );
		}

		self::load_modules();

		Jetpack_Options::delete_option( 'do_activate' );
		Jetpack_Options::delete_option( 'dismissed_connection_banner' );
	}

	/**
	 * Removes all connection options
	 *
	 * @static
	 */
	public static function plugin_deactivation() {
		require_once ABSPATH . '/wp-admin/includes/plugin.php';
		$tracking = new Tracking();
		$tracking->record_user_event( 'deactivate_plugin', array() );
		if ( is_plugin_active_for_network( 'jetpack/jetpack.php' ) ) {
			Jetpack_Network::init()->deactivate();
		} else {
			add_filter( 'jetpack_update_activated_state_on_disconnect', '__return_false' );
			self::disconnect();
			// Jetpack_Heartbeat::init()->deactivate();
		}
	}

	/**
	 * Set activated option to 4 on jetpack_idc_disconnect action.
	 */
	public static function on_idc_disconnect() {
		\Jetpack_Options::update_option( 'activated', 4 );
	}

	/**
	 * Disconnects from the Jetpack servers.
	 * Forgets all connection details and tells the Jetpack servers to do the same.
	 *
	 * @static
	 */
	public static function disconnect() {

		$connection = self::connection();

		// If the site is in an IDC because sync is not allowed,
		// let's make sure to not disconnect the production site.
		$connection->disconnect_site( ! Identity_Crisis::validate_sync_error_idc_option() );
	}

	/**
	 * Happens after a successfull disconnection.
	 *
	 * @static
	 */
	public static function jetpack_site_disconnected() {
		Identity_Crisis::clear_all_idc_options();

		// Delete all the sync related data. Since it could be taking up space.
		Sender::get_instance()->uninstall();

		/**
		 * Filters whether the Jetpack activated state should be updated after disconnecting.
		 *
		 * @since 10.0.0
		 *
		 * @param bool $update_activated_state Whether activated state should be updated after disconnecting, defaults to true.
		 */
		$update_activated_state = apply_filters( 'jetpack_update_activated_state_on_disconnect', true );

		if ( $update_activated_state ) {
			Jetpack_Options::update_option( 'activated', 4 );
		}
	}

	/**
	 * Disconnects the user
	 *
	 * @param int $user_id The user ID to disconnect.
	 */
	public function disconnect_user( $user_id ) {
		$this->connection_manager->disconnect_user( $user_id );
	}

	/**
	 * Attempts Jetpack registration.  If it fail, a state flag is set: @see ::admin_page_load()
	 *
	 * @deprecated since Jetpack 9.7.0
	 * @see Automattic\Jetpack\Connection\Manager::try_registration()
	 *
	 * @return bool|WP_Error
	 */
	public static function try_registration() {
		_deprecated_function( __METHOD__, 'jetpack-9.7', 'Automattic\\Jetpack\\Connection\\Manager::try_registration' );
		return static::connection()->try_registration();
	}

	/**
	 * Checking the domain names in beta versions.
	 * If this is a development version, before attempting to connect, let's make sure that the domains are viable.
	 *
	 * @param null|\WP_Error $error The domain validation error, or `null` if everything's fine.
	 *
	 * @return null|\WP_Error The domain validation error, or `null` if everything's fine.
	 */
	public static function registration_check_domains( $error ) {
		if ( static::is_development_version() && defined( 'PHP_URL_HOST' ) ) {
			$domains_to_check = array_unique(
				array(
					'siteurl' => wp_parse_url( get_site_url(), PHP_URL_HOST ),
					'homeurl' => wp_parse_url( get_home_url(), PHP_URL_HOST ),
				)
			);
			foreach ( $domains_to_check as $domain ) {
				$result = static::connection()->is_usable_domain( $domain );
				if ( is_wp_error( $result ) ) {
					return $result;
				}
			}
		}

		return $error;
	}

	/**
	 * Tracking an internal event log. Try not to put too much chaff in here.
	 *
	 * [Everyone Loves a Log!](https://www.youtube.com/watch?v=2C7mNr5WMjA)
	 */
	public static function log( $code, $data = null ) {
		// only grab the latest 200 entries
		$log = array_slice( Jetpack_Options::get_option( 'log', array() ), -199, 199 );

		// Append our event to the log
		$log_entry = array(
			'time'    => time(),
			'user_id' => get_current_user_id(),
			'blog_id' => Jetpack_Options::get_option( 'id' ),
			'code'    => $code,
		);
		// Don't bother storing it unless we've got some.
		if ( ! is_null( $data ) ) {
			$log_entry['data'] = $data;
		}
		$log[] = $log_entry;

		// Try add_option first, to make sure it's not autoloaded.
		// @todo: Add an add_option method to Jetpack_Options
		if ( ! add_option( 'jetpack_log', $log, null, 'no' ) ) {
			Jetpack_Options::update_option( 'log', $log );
		}

		/**
		 * Fires when Jetpack logs an internal event.
		 *
		 * @since 3.0.0
		 *
		 * @param array $log_entry {
		 *  Array of details about the log entry.
		 *
		 *  @param string time Time of the event.
		 *  @param int user_id ID of the user who trigerred the event.
		 *  @param int blog_id Jetpack Blog ID.
		 *  @param string code Unique name for the event.
		 *  @param string data Data about the event.
		 * }
		 */
		do_action( 'jetpack_log_entry', $log_entry );
	}

	/**
	 * Get the internal event log.
	 *
	 * @param $event (string) - only return the specific log events
	 * @param $num   (int)    - get specific number of latest results, limited to 200
	 *
	 * @return array of log events || WP_Error for invalid params
	 */
	public static function get_log( $event = false, $num = false ) {
		if ( $event && ! is_string( $event ) ) {
			return new WP_Error( __( 'First param must be string or empty', 'jetpack' ) );
		}

		if ( $num && ! is_numeric( $num ) ) {
			return new WP_Error( __( 'Second param must be numeric or empty', 'jetpack' ) );
		}

		$entire_log = Jetpack_Options::get_option( 'log', array() );

		// If nothing set - act as it did before, otherwise let's start customizing the output
		if ( ! $num && ! $event ) {
			return $entire_log;
		} else {
			$entire_log = array_reverse( $entire_log );
		}

		$custom_log_output = array();

		if ( $event ) {
			foreach ( $entire_log as $log_event ) {
				if ( $event == $log_event['code'] ) {
					$custom_log_output[] = $log_event;
				}
			}
		} else {
			$custom_log_output = $entire_log;
		}

		if ( $num ) {
			$custom_log_output = array_slice( $custom_log_output, 0, $num );
		}

		return $custom_log_output;
	}

	/**
	 * Log modification of important settings.
	 */
	public static function log_settings_change( $option, $old_value, $value ) {
		switch ( $option ) {
			case 'jetpack_sync_non_public_post_stati':
				self::log( $option, $value );
				break;
		}
	}

	/**
	 * Return stat data for WPCOM sync
	 */
	public static function get_stat_data( $encode = true, $extended = true ) {
		$data = Jetpack_Heartbeat::generate_stats_array();

		if ( $extended ) {
			$additional_data = self::get_additional_stat_data();
			$data            = array_merge( $data, $additional_data );
		}

		if ( $encode ) {
			return json_encode( $data );
		}

		return $data;
	}

	/**
	 * Get additional stat data to sync to WPCOM
	 */
	public static function get_additional_stat_data( $prefix = '' ) {
		$return[ "{$prefix}themes" ]        = self::get_parsed_theme_data();
		$return[ "{$prefix}plugins-extra" ] = self::get_parsed_plugin_data();
		$return[ "{$prefix}users" ]         = (int) self::get_site_user_count();
		$return[ "{$prefix}site-count" ]    = 0;

		if ( function_exists( 'get_blog_count' ) ) {
			$return[ "{$prefix}site-count" ] = get_blog_count();
		}
		return $return;
	}

	private static function get_site_user_count() {
		global $wpdb;

		if ( function_exists( 'wp_is_large_network' ) ) {
			if ( wp_is_large_network( 'users' ) ) {
				return -1; // Not a real value but should tell us that we are dealing with a large network.
			}
		}
		if ( false === ( $user_count = get_transient( 'jetpack_site_user_count' ) ) ) {
			// It wasn't there, so regenerate the data and save the transient
			$user_count = $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->usermeta WHERE meta_key = '{$wpdb->prefix}capabilities'" );
			set_transient( 'jetpack_site_user_count', $user_count, DAY_IN_SECONDS );
		}
		return $user_count;
	}

	/* Admin Pages */

	function admin_init() {
		// If the plugin is not connected, display a connect message.
		if (
			// the plugin was auto-activated and needs its candy
			Jetpack_Options::get_option_and_ensure_autoload( 'do_activate', '0' )
		||
			// the plugin is active, but was never activated.  Probably came from a site-wide network activation
			! Jetpack_Options::get_option( 'activated' )
		) {
			self::plugin_initialize();
		}

		$is_offline_mode              = ( new Status() )->is_offline_mode();
		$fallback_no_verify_ssl_certs = Jetpack_Options::get_option( 'fallback_no_verify_ssl_certs' );
		/** Already documented in automattic/jetpack-connection::src/class-client.php */
		$client_verify_ssl_certs = apply_filters( 'jetpack_client_verify_ssl_certs', false );

		if ( ! $is_offline_mode ) {
			Jetpack_Connection_Banner::init();
		}

		if ( ( self::is_connection_ready() || $is_offline_mode ) && false === $fallback_no_verify_ssl_certs && ! $client_verify_ssl_certs ) {
			// Upgrade: 1.1 -> 1.1.1
			// Check and see if host can verify the Jetpack servers' SSL certificate
			$args = array();
			Client::_wp_remote_request( self::connection()->api_url( 'test' ), $args, true );
		}

		Jetpack_Recommendations_Banner::init();

		if ( current_user_can( 'manage_options' ) && ! self::permit_ssl() ) {
			add_action( 'jetpack_notices', array( $this, 'alert_auto_ssl_fail' ) );
		}

		add_action( 'load-plugins.php', array( $this, 'intercept_plugin_error_scrape_init' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_menu_css' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'deactivate_dialog' ) );

		if ( isset( $_COOKIE['jetpackState']['display_update_modal'] ) ) {
			add_action( 'admin_enqueue_scripts', __CLASS__ . '::enqueue_block_style' );
		}

		add_filter( 'plugin_action_links_' . plugin_basename( JETPACK__PLUGIN_DIR . 'jetpack.php' ), array( $this, 'plugin_action_links' ) );

		if ( self::is_connection_ready() || $is_offline_mode ) {
			// Artificially throw errors in certain specific cases during plugin activation.
			add_action( 'activate_plugin', array( $this, 'throw_error_on_activate_plugin' ) );
		}

		// Add custom column in wp-admin/users.php to show whether user is linked.
		add_filter( 'manage_users_columns', array( $this, 'jetpack_icon_user_connected' ) );
		add_action( 'manage_users_custom_column', array( $this, 'jetpack_show_user_connected_icon' ), 10, 3 );
		add_action( 'admin_print_styles', array( $this, 'jetpack_user_col_style' ) );
	}

	function admin_body_class( $admin_body_class = '' ) {
		$classes = explode( ' ', trim( $admin_body_class ) );

		$classes[] = self::is_connection_ready() ? 'jetpack-connected' : 'jetpack-disconnected';

		$admin_body_class = implode( ' ', array_unique( $classes ) );
		return " $admin_body_class ";
	}

	static function add_jetpack_pagestyles( $admin_body_class = '' ) {
		return $admin_body_class . ' jetpack-pagestyles ';
	}

	/**
	 * Sometimes a plugin can activate without causing errors, but it will cause errors on the next page load.
	 * This function artificially throws errors for such cases (per a specific list).
	 *
	 * @param string $plugin The activated plugin.
	 */
	function throw_error_on_activate_plugin( $plugin ) {
		$active_modules = self::get_active_modules();

		// The Shortlinks module and the Stats plugin conflict, but won't cause errors on activation because of some function_exists() checks.
		if ( function_exists( 'stats_get_api_key' ) && in_array( 'shortlinks', $active_modules ) ) {
			$throw = false;

			// Try and make sure it really was the stats plugin
			if ( ! class_exists( 'ReflectionFunction' ) ) {
				if ( 'stats.php' == basename( $plugin ) ) {
					$throw = true;
				}
			} else {
				$reflection = new ReflectionFunction( 'stats_get_api_key' );
				if ( basename( $plugin ) == basename( $reflection->getFileName() ) ) {
					$throw = true;
				}
			}

			if ( $throw ) {
				trigger_error( sprintf( __( 'Jetpack contains the most recent version of the old &#8220;%1$s&#8221; plugin.', 'jetpack' ), 'WordPress.com Stats' ), E_USER_ERROR );
			}
		}
	}

	function intercept_plugin_error_scrape_init() {
		add_action( 'check_admin_referer', array( $this, 'intercept_plugin_error_scrape' ), 10, 2 );
	}

	function intercept_plugin_error_scrape( $action, $result ) {
		if ( ! $result ) {
			return;
		}

		foreach ( $this->plugins_to_deactivate as $deactivate_me ) {
			if ( "plugin-activation-error_{$deactivate_me[0]}" == $action ) {
				self::bail_on_activation( sprintf( __( 'Jetpack contains the most recent version of the old &#8220;%1$s&#8221; plugin.', 'jetpack' ), $deactivate_me[1] ), false );
			}
		}
	}

	/**
	 * Register the remote file upload request handlers, if needed.
	 *
	 * @access public
	 */
	public function add_remote_request_handlers() {
		// Remote file uploads are allowed only via AJAX requests.
		if ( ! is_admin() || ! Constants::get_constant( 'DOING_AJAX' ) ) {
			return;
		}

		// Remote file uploads are allowed only for a set of specific AJAX actions.
		$remote_request_actions = array(
			'jetpack_upload_file',
			'jetpack_update_file',
		);

		// phpcs:ignore WordPress.Security.NonceVerification
		if ( ! isset( $_POST['action'] ) || ! in_array( $_POST['action'], $remote_request_actions, true ) ) {
			return;
		}

		// Require Jetpack authentication for the remote file upload AJAX requests.
		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		$this->connection_manager->require_jetpack_authentication();

		// Register the remote file upload AJAX handlers.
		foreach ( $remote_request_actions as $action ) {
			add_action( "wp_ajax_nopriv_{$action}", array( $this, 'remote_request_handlers' ) );
		}
	}

	/**
	 * Handler for Jetpack remote file uploads.
	 *
	 * @access public
	 */
	public function remote_request_handlers() {
		$action = current_filter();

		switch ( current_filter() ) {
			case 'wp_ajax_nopriv_jetpack_upload_file':
				$response = $this->upload_handler();
				break;

			case 'wp_ajax_nopriv_jetpack_update_file':
				$response = $this->upload_handler( true );
				break;
			default:
				$response = new WP_Error( 'unknown_handler', 'Unknown Handler', 400 );
				break;
		}

		if ( ! $response ) {
			$response = new WP_Error( 'unknown_error', 'Unknown Error', 400 );
		}

		if ( is_wp_error( $response ) ) {
			$status_code       = $response->get_error_data();
			$error             = $response->get_error_code();
			$error_description = $response->get_error_message();

			if ( ! is_int( $status_code ) ) {
				$status_code = 400;
			}

			status_header( $status_code );
			die( json_encode( (object) compact( 'error', 'error_description' ) ) );
		}

		status_header( 200 );
		if ( true === $response ) {
			exit;
		}

		die( json_encode( (object) $response ) );
	}

	/**
	 * Uploads a file gotten from the global $_FILES.
	 * If `$update_media_item` is true and `post_id` is defined
	 * the attachment file of the media item (gotten through of the post_id)
	 * will be updated instead of add a new one.
	 *
	 * @param  boolean $update_media_item - update media attachment
	 * @return array - An array describing the uploadind files process
	 */
	function upload_handler( $update_media_item = false ) {
		if ( 'POST' !== strtoupper( $_SERVER['REQUEST_METHOD'] ) ) {
			return new WP_Error( 405, get_status_header_desc( 405 ), 405 );
		}

		$user = wp_authenticate( '', '' );
		if ( ! $user || is_wp_error( $user ) ) {
			return new WP_Error( 403, get_status_header_desc( 403 ), 403 );
		}

		wp_set_current_user( $user->ID );

		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error( 'cannot_upload_files', 'User does not have permission to upload files', 403 );
		}

		if ( empty( $_FILES ) ) {
			return new WP_Error( 'no_files_uploaded', 'No files were uploaded: nothing to process', 400 );
		}

		foreach ( array_keys( $_FILES ) as $files_key ) {
			if ( ! isset( $_POST[ "_jetpack_file_hmac_{$files_key}" ] ) ) {
				return new WP_Error( 'missing_hmac', 'An HMAC for one or more files is missing', 400 );
			}
		}

		$media_keys = array_keys( $_FILES['media'] );

		$token = ( new Tokens() )->get_access_token( get_current_user_id() );
		if ( ! $token || is_wp_error( $token ) ) {
			return new WP_Error( 'unknown_token', 'Unknown Jetpack token', 403 );
		}

		$uploaded_files = array();
		$global_post    = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
		unset( $GLOBALS['post'] );
		foreach ( $_FILES['media']['name'] as $index => $name ) {
			$file = array();
			foreach ( $media_keys as $media_key ) {
				$file[ $media_key ] = $_FILES['media'][ $media_key ][ $index ];
			}

			list( $hmac_provided, $salt ) = explode( ':', $_POST['_jetpack_file_hmac_media'][ $index ] );

			$hmac_file = hash_hmac_file( 'sha1', $file['tmp_name'], $salt . $token->secret );
			if ( $hmac_provided !== $hmac_file ) {
				$uploaded_files[ $index ] = (object) array(
					'error'             => 'invalid_hmac',
					'error_description' => 'The corresponding HMAC for this file does not match',
				);
				continue;
			}

			$_FILES['.jetpack.upload.'] = $file;
			$post_id                    = isset( $_POST['post_id'][ $index ] ) ? absint( $_POST['post_id'][ $index ] ) : 0;
			if ( ! current_user_can( 'edit_post', $post_id ) ) {
				$post_id = 0;
			}

			if ( $update_media_item ) {
				if ( ! isset( $post_id ) || $post_id === 0 ) {
					return new WP_Error( 'invalid_input', 'Media ID must be defined.', 400 );
				}

				$media_array = $_FILES['media'];

				$file_array['name']     = $media_array['name'][0];
				$file_array['type']     = $media_array['type'][0];
				$file_array['tmp_name'] = $media_array['tmp_name'][0];
				$file_array['error']    = $media_array['error'][0];
				$file_array['size']     = $media_array['size'][0];

				$edited_media_item = Jetpack_Media::edit_media_file( $post_id, $file_array );

				if ( is_wp_error( $edited_media_item ) ) {
					return $edited_media_item;
				}

				$response = (object) array(
					'id'   => (string) $post_id,
					'file' => (string) $edited_media_item->post_title,
					'url'  => (string) wp_get_attachment_url( $post_id ),
					'type' => (string) $edited_media_item->post_mime_type,
					'meta' => (array) wp_get_attachment_metadata( $post_id ),
				);

				return (array) array( $response );
			}

			$attachment_id = media_handle_upload(
				'.jetpack.upload.',
				$post_id,
				array(),
				array(
					'action' => 'jetpack_upload_file',
				)
			);

			if ( ! $attachment_id ) {
				$uploaded_files[ $index ] = (object) array(
					'error'             => 'unknown',
					'error_description' => 'An unknown problem occurred processing the upload on the Jetpack site',
				);
			} elseif ( is_wp_error( $attachment_id ) ) {
				$uploaded_files[ $index ] = (object) array(
					'error'             => 'attachment_' . $attachment_id->get_error_code(),
					'error_description' => $attachment_id->get_error_message(),
				);
			} else {
				$attachment               = get_post( $attachment_id );
				$uploaded_files[ $index ] = (object) array(
					'id'   => (string) $attachment_id,
					'file' => $attachment->post_title,
					'url'  => wp_get_attachment_url( $attachment_id ),
					'type' => $attachment->post_mime_type,
					'meta' => wp_get_attachment_metadata( $attachment_id ),
				);
			}
		}
		if ( ! is_null( $global_post ) ) {
			$GLOBALS['post'] = $global_post;
		}

		return $uploaded_files;
	}

	/**
	 * Add help to the Jetpack page
	 *
	 * @since Jetpack (1.2.3)
	 * @return false if not the Jetpack page
	 */
	function admin_help() {
		$current_screen = get_current_screen();

		// Overview
		$current_screen->add_help_tab(
			array(
				'id'      => 'home',
				'title'   => __( 'Home', 'jetpack' ),
				'content' =>
					'<p><strong>' . __( 'Jetpack', 'jetpack' ) . '</strong></p>' .
					'<p>' . __( 'Jetpack supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.', 'jetpack' ) . '</p>' .
					'<p>' . __( 'On this page, you are able to view the modules available within Jetpack, learn more about them, and activate or deactivate them as needed.', 'jetpack' ) . '</p>',
			)
		);

		// Screen Content
		if ( current_user_can( 'manage_options' ) ) {
			$current_screen->add_help_tab(
				array(
					'id'      => 'settings',
					'title'   => __( 'Settings', 'jetpack' ),
					'content' =>
						'<p><strong>' . __( 'Jetpack', 'jetpack' ) . '</strong></p>' .
						'<p>' . __( 'You can activate or deactivate individual Jetpack modules to suit your needs.', 'jetpack' ) . '</p>' .
						'<ol>' .
							'<li>' . __( 'Each module has an Activate or Deactivate link so you can toggle one individually.', 'jetpack' ) . '</li>' .
							'<li>' . __( 'Using the checkboxes next to each module, you can select multiple modules to toggle via the Bulk Actions menu at the top of the list.', 'jetpack' ) . '</li>' .
						'</ol>' .
						'<p>' . __( 'Using the tools on the right, you can search for specific modules, filter by module categories or which are active, or change the sorting order.', 'jetpack' ) . '</p>',
				)
			);
		}

		// Help Sidebar
		$support_url = Redirect::get_url( 'jetpack-support' );
		$faq_url     = Redirect::get_url( 'jetpack-faq' );
		$current_screen->set_help_sidebar(
			'<p><strong>' . __( 'For more information:', 'jetpack' ) . '</strong></p>' .
			'<p><a href="' . $faq_url . '" rel="noopener noreferrer" target="_blank">' . __( 'Jetpack FAQ', 'jetpack' ) . '</a></p>' .
			'<p><a href="' . $support_url . '" rel="noopener noreferrer" target="_blank">' . __( 'Jetpack Support', 'jetpack' ) . '</a></p>' .
			'<p><a href="' . self::admin_url( array( 'page' => 'jetpack-debugger' ) ) . '">' . __( 'Jetpack Debugging Center', 'jetpack' ) . '</a></p>'
		);
	}

	function admin_menu_css() {
		wp_enqueue_style( 'jetpack-icons' );
	}

	function admin_menu_order() {
		return true;
	}

	function jetpack_menu_order( $menu_order ) {
		$jp_menu_order = array();

		foreach ( $menu_order as $index => $item ) {
			if ( $item != 'jetpack' ) {
				$jp_menu_order[] = $item;
			}

			if ( $index == 0 ) {
				$jp_menu_order[] = 'jetpack';
			}
		}

		return $jp_menu_order;
	}

	function admin_banner_styles() {
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		if ( ! wp_style_is( 'jetpack-dops-style' ) ) {
			wp_register_style(
				'jetpack-dops-style',
				plugins_url( '_inc/build/admin.css', JETPACK__PLUGIN_FILE ),
				array(),
				JETPACK__VERSION
			);
		}

		wp_enqueue_style(
			'jetpack',
			plugins_url( "css/jetpack-banners{$min}.css", JETPACK__PLUGIN_FILE ),
			array( 'jetpack-dops-style' ),
			JETPACK__VERSION . '-20121016'
		);
		wp_style_add_data( 'jetpack', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack', 'suffix', $min );
	}

	function plugin_action_links( $actions ) {

		$jetpack_home = array( 'jetpack-home' => sprintf( '<a href="%s">%s</a>', self::admin_url( 'page=jetpack' ), __( 'My Jetpack', 'jetpack' ) ) );

		if ( current_user_can( 'jetpack_manage_modules' ) && ( self::is_connection_ready() || ( new Status() )->is_offline_mode() ) ) {
			return array_merge(
				$jetpack_home,
				array( 'settings' => sprintf( '<a href="%s">%s</a>', self::admin_url( 'page=jetpack#/settings' ), __( 'Settings', 'jetpack' ) ) ),
				array( 'support' => sprintf( '<a href="%s">%s</a>', self::admin_url( 'page=jetpack-debugger ' ), __( 'Support', 'jetpack' ) ) ),
				$actions
			);
		}

		return array_merge( $jetpack_home, $actions );
	}

	/**
	 * Adds the deactivation warning modal if there are other active plugins using the connection
	 *
	 * @param string $hook The current admin page.
	 *
	 * @return void
	 */
	public function deactivate_dialog( $hook ) {
		if (
			'plugins.php' === $hook
			&& self::is_connection_ready()
		) {

			$active_plugins_using_connection = Connection_Plugin_Storage::get_all();

			if ( count( $active_plugins_using_connection ) > 1 ) {

				add_thickbox();

				// Register jp-tracks-functions dependency.
				Tracking::register_tracks_functions_scripts();

				wp_enqueue_script(
					'jetpack-deactivate-dialog-js',
					Assets::get_file_url_for_environment(
						'_inc/build/jetpack-deactivate-dialog.min.js',
						'_inc/jetpack-deactivate-dialog.js'
					),
					array( 'jquery', 'jp-tracks-functions' ),
					JETPACK__VERSION,
					true
				);

				wp_localize_script(
					'jetpack-deactivate-dialog-js',
					'deactivate_dialog',
					array(
						'title'            => __( 'Deactivate Jetpack', 'jetpack' ),
						'deactivate_label' => __( 'Disconnect and Deactivate', 'jetpack' ),
						'tracksUserData'   => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
					)
				);

				add_action( 'admin_footer', array( $this, 'deactivate_dialog_content' ) );

				wp_enqueue_style( 'jetpack-deactivate-dialog', plugins_url( 'css/jetpack-deactivate-dialog.css', JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
			}
		}
	}

	/**
	 * Outputs the content of the deactivation modal
	 *
	 * @return void
	 */
	public function deactivate_dialog_content() {
		$active_plugins_using_connection = Connection_Plugin_Storage::get_all();
		unset( $active_plugins_using_connection['jetpack'] );
		$this->load_view( 'admin/deactivation-dialog.php', $active_plugins_using_connection );
	}

	/**
	 * Filters the login URL to include the registration flow in case the user isn't logged in.
	 *
	 * @param string $login_url The wp-login URL.
	 * @param string $redirect  URL to redirect users after logging in.
	 * @since Jetpack 8.4
	 * @return string
	 */
	public function login_url( $login_url, $redirect ) {
		parse_str( wp_parse_url( $redirect, PHP_URL_QUERY ), $redirect_parts );
		if ( ! empty( $redirect_parts[ self::$jetpack_redirect_login ] ) ) {
			$login_url = add_query_arg( self::$jetpack_redirect_login, 'true', $login_url );
		}
		return $login_url;
	}

	/**
	 * Redirects non-authenticated users to authenticate with Calypso if redirect flag is set.
	 *
	 * @since Jetpack 8.4
	 */
	public function login_init() {
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( ! empty( $_GET[ self::$jetpack_redirect_login ] ) ) {
			add_filter( 'allowed_redirect_hosts', array( &$this, 'allow_wpcom_environments' ) );
			wp_safe_redirect(
				add_query_arg(
					array(
						'forceInstall' => 1,
						'url'          => rawurlencode( get_site_url() ),
					),
					// @todo provide way to go to specific calypso env.
					self::get_calypso_host() . 'jetpack/connect'
				)
			);
			exit;
		}
	}

	/*
	 * Registration flow:
	 * 1 - ::admin_page_load() action=register
	 * 2 - ::try_registration()
	 * 3 - ::register()
	 *     - Creates jetpack_register option containing two secrets and a timestamp
	 *     - Calls https://jetpack.wordpress.com/jetpack.register/1/ with
	 *       siteurl, home, gmt_offset, timezone_string, site_name, secret_1, secret_2, site_lang, timeout, stats_id
	 *     - That request to jetpack.wordpress.com does not immediately respond.  It first makes a request BACK to this site's
	 *       xmlrpc.php?for=jetpack: RPC method: jetpack.verifyRegistration, Parameters: secret_1
	 *     - The XML-RPC request verifies secret_1, deletes both secrets and responds with: secret_2
	 *     - https://jetpack.wordpress.com/jetpack.register/1/ verifies that XML-RPC response (secret_2) then finally responds itself with
	 *       jetpack_id, jetpack_secret, jetpack_public
	 *     - ::register() then stores jetpack_options: id => jetpack_id, blog_token => jetpack_secret
	 * 4 - redirect to https://wordpress.com/start/jetpack-connect
	 * 5 - user logs in with WP.com account
	 * 6 - remote request to this site's xmlrpc.php with action remoteAuthorize, Jetpack_XMLRPC_Server->remote_authorize
	 *		- Manager::authorize()
	 *		- Manager::get_token()
	 *		- GET https://jetpack.wordpress.com/jetpack.token/1/ with
	 *        client_id, client_secret, grant_type, code, redirect_uri:action=authorize, state, scope, user_email, user_login
	 *			- which responds with access_token, token_type, scope
	 *		- Manager::authorize() stores jetpack_options: user_token => access_token.$user_id
	 *		- Jetpack::activate_default_modules()
	 *     		- Deactivates deprecated plugins
	 *     		- Activates all default modules
	 *		- Responds with either error, or 'connected' for new connection, or 'linked' for additional linked users
	 * 7 - For a new connection, user selects a Jetpack plan on wordpress.com
	 * 8 - User is redirected back to wp-admin/index.php?page=jetpack with state:message=authorized
	 *     Done!
	 */

	/**
	 * Handles the page load events for the Jetpack admin page
	 */
	function admin_page_load() {
		$error = false;

		// Make sure we have the right body class to hook stylings for subpages off of.
		add_filter( 'admin_body_class', array( __CLASS__, 'add_jetpack_pagestyles' ), 20 );

		if ( ! empty( $_GET['jetpack_restate'] ) ) {
			// Should only be used in intermediate redirects to preserve state across redirects
			self::restate();
		}

		if ( isset( $_GET['connect_url_redirect'] ) ) {
			// @todo: Add validation against a known allowed list.
			$from = ! empty( $_GET['from'] ) ? $_GET['from'] : 'iframe';
			// User clicked in the iframe to link their accounts
			if ( ! self::connection()->is_user_connected() ) {
				$redirect = ! empty( $_GET['redirect_after_auth'] ) ? $_GET['redirect_after_auth'] : false;

				add_filter( 'allowed_redirect_hosts', array( &$this, 'allow_wpcom_environments' ) );
				$connect_url = $this->build_connect_url( true, $redirect, $from );
				remove_filter( 'allowed_redirect_hosts', array( &$this, 'allow_wpcom_environments' ) );

				if ( isset( $_GET['notes_iframe'] ) ) {
					$connect_url .= '&notes_iframe';
				}
				wp_redirect( $connect_url );
				exit;
			} else {
				if ( ! isset( $_GET['calypso_env'] ) ) {
					self::state( 'message', 'already_authorized' );
					wp_safe_redirect( self::admin_url() );
					exit;
				} else {
					$connect_url  = $this->build_connect_url( true, false, $from );
					$connect_url .= '&already_authorized=true';
					wp_redirect( $connect_url );
					exit;
				}
			}
		}

		if ( isset( $_GET['action'] ) ) {
			switch ( $_GET['action'] ) {
				case 'authorize_redirect':
					self::log( 'authorize_redirect' );

					add_filter(
						'allowed_redirect_hosts',
						function ( $domains ) {
							$domains[] = 'jetpack.com';
							$domains[] = 'jetpack.wordpress.com';
							$domains[] = 'wordpress.com';
							$domains[] = wp_parse_url( static::get_calypso_host(), PHP_URL_HOST ); // May differ from `wordpress.com`.
							return array_unique( $domains );
						}
					);

					// phpcs:ignore WordPress.Security.NonceVerification.Recommended
					$dest_url = empty( $_GET['dest_url'] ) ? null : $_GET['dest_url'];

					if ( ! $dest_url || ( 0 === stripos( $dest_url, 'https://jetpack.com/' ) && 0 === stripos( $dest_url, 'https://wordpress.com/' ) ) ) {
						// The destination URL is missing or invalid, nothing to do here.
						exit;
					}

					if ( static::connection()->is_connected() && static::connection()->is_user_connected() ) {
						// The user is either already connected, or finished the connection process.
						wp_safe_redirect( $dest_url );
						exit;
					} elseif ( ! empty( $_GET['done'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
						// The user decided not to proceed with setting up the connection.
						wp_safe_redirect( self::admin_url( 'page=jetpack' ) );
						exit;
					}

					$redirect_args = array(
						'page'     => 'jetpack',
						'action'   => 'authorize_redirect',
						'dest_url' => rawurlencode( $dest_url ),
						'done'     => '1',
					);

					if ( ! empty( $_GET['from'] ) && 'jetpack_site_only_checkout' === $_GET['from'] ) {
						$redirect_args['from'] = 'jetpack_site_only_checkout';
					}

					wp_safe_redirect( static::build_authorize_url( self::admin_url( $redirect_args ) ) );
					exit;
				case 'authorize':
					_doing_it_wrong( __METHOD__, 'The `page=jetpack&action=authorize` webhook is deprecated. Use `handler=jetpack-connection-webhooks&action=authorize` instead', 'Jetpack 9.5.0' );
					( new Connection_Webhooks( $this->connection_manager ) )->handle_authorize();
					exit;
				case 'register':
					if ( ! current_user_can( 'jetpack_connect' ) ) {
						$error = 'cheatin';
						break;
					}
					check_admin_referer( 'jetpack-register' );
					self::log( 'register' );
					self::maybe_set_version_option();
					$from = isset( $_GET['from'] ) ? $_GET['from'] : false;
					if ( $from ) {
						static::connection()->add_register_request_param( 'from', (string) $from );
					}
					$registered = static::connection()->try_registration();
					if ( is_wp_error( $registered ) ) {
						$error = $registered->get_error_code();
						self::state( 'error', $error );
						self::state( 'error', $registered->get_error_message() );

						/**
						 * Jetpack registration Error.
						 *
						 * @since 7.5.0
						 *
						 * @param string|int $error The error code.
						 * @param \WP_Error $registered The error object.
						 */
						do_action( 'jetpack_connection_register_fail', $error, $registered );
						break;
					}

					$redirect = isset( $_GET['redirect'] ) ? $_GET['redirect'] : false;

					/**
					 * Jetpack registration Success.
					 *
					 * @since 7.5.0
					 *
					 * @param string $from 'from' GET parameter;
					 */
					do_action( 'jetpack_connection_register_success', $from );

					$url = $this->build_connect_url( true, $redirect, $from );

					if ( ! empty( $_GET['onboarding'] ) ) {
						$url = add_query_arg( 'onboarding', $_GET['onboarding'], $url );
					}

					if ( ! empty( $_GET['auth_approved'] ) && 'true' === $_GET['auth_approved'] ) {
						$url = add_query_arg( 'auth_approved', 'true', $url );
					}

					wp_redirect( $url );
					exit;
				case 'activate':
					if ( ! current_user_can( 'jetpack_activate_modules' ) ) {
						$error = 'cheatin';
						break;
					}

					$module = stripslashes( $_GET['module'] );
					check_admin_referer( "jetpack_activate-$module" );
					self::log( 'activate', $module );
					if ( ! self::activate_module( $module ) ) {
						self::state( 'error', sprintf( __( 'Could not activate %s', 'jetpack' ), $module ) );
					}
					// The following two lines will rarely happen, as Jetpack::activate_module normally exits at the end.
					wp_safe_redirect( self::admin_url( 'page=jetpack' ) );
					exit;
				case 'activate_default_modules':
					check_admin_referer( 'activate_default_modules' );
					self::log( 'activate_default_modules' );
					self::restate();
					$min_version   = isset( $_GET['min_version'] ) ? $_GET['min_version'] : false;
					$max_version   = isset( $_GET['max_version'] ) ? $_GET['max_version'] : false;
					$other_modules = isset( $_GET['other_modules'] ) && is_array( $_GET['other_modules'] ) ? $_GET['other_modules'] : array();
					self::activate_default_modules( $min_version, $max_version, $other_modules );
					wp_safe_redirect( self::admin_url( 'page=jetpack' ) );
					exit;
				case 'disconnect':
					if ( ! current_user_can( 'jetpack_disconnect' ) ) {
						$error = 'cheatin';
						break;
					}

					check_admin_referer( 'jetpack-disconnect' );
					self::log( 'disconnect' );
					self::disconnect();
					wp_safe_redirect( self::admin_url( 'disconnected=true' ) );
					exit;
				case 'reconnect':
					if ( ! current_user_can( 'jetpack_reconnect' ) ) {
						$error = 'cheatin';
						break;
					}

					check_admin_referer( 'jetpack-reconnect' );
					self::log( 'reconnect' );
					self::disconnect();
					wp_redirect( $this->build_connect_url( true, false, 'reconnect' ) );
					exit;
				case 'deactivate':
					if ( ! current_user_can( 'jetpack_deactivate_modules' ) ) {
						$error = 'cheatin';
						break;
					}

					$modules = stripslashes( $_GET['module'] );
					check_admin_referer( "jetpack_deactivate-$modules" );
					foreach ( explode( ',', $modules ) as $module ) {
						self::log( 'deactivate', $module );
						self::deactivate_module( $module );
						self::state( 'message', 'module_deactivated' );
					}
					self::state( 'module', $modules );
					wp_safe_redirect( self::admin_url( 'page=jetpack' ) );
					exit;
				case 'unlink':
					$redirect = isset( $_GET['redirect'] ) ? $_GET['redirect'] : '';
					check_admin_referer( 'jetpack-unlink' );
					self::log( 'unlink' );
					$this->connection_manager->disconnect_user();
					self::state( 'message', 'unlinked' );
					if ( 'sub-unlink' == $redirect ) {
						wp_safe_redirect( admin_url() );
					} else {
						wp_safe_redirect( self::admin_url( array( 'page' => $redirect ) ) );
					}
					exit;
				case 'onboard':
					if ( ! current_user_can( 'manage_options' ) ) {
						wp_safe_redirect( self::admin_url( 'page=jetpack' ) );
					} else {
						self::create_onboarding_token();
						$url = $this->build_connect_url( true );

						if ( false !== ( $token = Jetpack_Options::get_option( 'onboarding' ) ) ) {
							$url = add_query_arg( 'onboarding', $token, $url );
						}

						$calypso_env = $this->get_calypso_env();
						if ( ! empty( $calypso_env ) ) {
							$url = add_query_arg( 'calypso_env', $calypso_env, $url );
						}

						wp_redirect( $url );
						exit;
					}
					exit;
				default:
					/**
					 * Fires when a Jetpack admin page is loaded with an unrecognized parameter.
					 *
					 * @since 2.6.0
					 *
					 * @param string sanitize_key( $_GET['action'] ) Unrecognized URL parameter.
					 */
					do_action( 'jetpack_unrecognized_action', sanitize_key( $_GET['action'] ) );
			}
		}

		if ( ! $error = $error ? $error : self::state( 'error' ) ) {
			self::activate_new_modules( true );
		}

		$message_code = self::state( 'message' );
		if ( self::state( 'optin-manage' ) ) {
			$activated_manage = $message_code;
			$message_code     = 'jetpack-manage';
		}

		switch ( $message_code ) {
			case 'jetpack-manage':
				$sites_url = esc_url( Redirect::get_url( 'calypso-sites' ) );
				// translators: %s is the URL to the "Sites" panel on wordpress.com.
				$this->message = '<strong>' . sprintf( __( 'You are all set! Your site can now be managed from <a href="%s" target="_blank">wordpress.com/sites</a>.', 'jetpack' ), $sites_url ) . '</strong>';
				if ( $activated_manage ) {
					$this->message .= '<br /><strong>' . __( 'Manage has been activated for you!', 'jetpack' ) . '</strong>';
				}
				break;

		}

		$deactivated_plugins = self::state( 'deactivated_plugins' );

		if ( ! empty( $deactivated_plugins ) ) {
			$deactivated_plugins = explode( ',', $deactivated_plugins );
			$deactivated_titles  = array();
			foreach ( $deactivated_plugins as $deactivated_plugin ) {
				if ( ! isset( $this->plugins_to_deactivate[ $deactivated_plugin ] ) ) {
					continue;
				}

				$deactivated_titles[] = '<strong>' . str_replace( ' ', '&nbsp;', $this->plugins_to_deactivate[ $deactivated_plugin ][1] ) . '</strong>';
			}

			if ( $deactivated_titles ) {
				if ( $this->message ) {
					$this->message .= "<br /><br />\n";
				}

				$this->message .= wp_sprintf(
					_n(
						'Jetpack contains the most recent version of the old %l plugin.',
						'Jetpack contains the most recent versions of the old %l plugins.',
						count( $deactivated_titles ),
						'jetpack'
					),
					$deactivated_titles
				);

				$this->message .= "<br />\n";

				$this->message .= _n(
					'The old version has been deactivated and can be removed from your site.',
					'The old versions have been deactivated and can be removed from your site.',
					count( $deactivated_titles ),
					'jetpack'
				);
			}
		}

		$this->privacy_checks = self::state( 'privacy_checks' );

		if ( $this->message || $this->error || $this->privacy_checks ) {
			add_action( 'jetpack_notices', array( $this, 'admin_notices' ) );
		}

		add_filter( 'jetpack_short_module_description', 'wptexturize' );
	}

	function admin_notices() {

		if ( $this->error ) {
			?>
<div id="message" class="jetpack-message jetpack-err">
	<div class="squeezer">
		<h2>
			<?php
			echo wp_kses(
				$this->error,
				array(
					'a'      => array( 'href' => array() ),
					'small'  => true,
					'code'   => true,
					'strong' => true,
					'br'     => true,
					'b'      => true,
				)
			);
			?>
			</h2>
			<?php	if ( $desc = self::state( 'error_description' ) ) : ?>
		<p><?php echo esc_html( stripslashes( $desc ) ); ?></p>
<?php	endif; ?>
	</div>
</div>
			<?php
		}

		if ( $this->message ) {
			?>
<div id="message" class="jetpack-message">
	<div class="squeezer">
		<h2>
			<?php
			echo wp_kses(
				$this->message,
				array(
					'strong' => array(),
					'a'      => array( 'href' => true ),
					'br'     => true,
				)
			);
			?>
			</h2>
	</div>
</div>
			<?php
		}

		if ( $this->privacy_checks ) :
			$module_names = $module_slugs = array();

			$privacy_checks = explode( ',', $this->privacy_checks );
			$privacy_checks = array_filter( $privacy_checks, array( 'Jetpack', 'is_module' ) );
			foreach ( $privacy_checks as $module_slug ) {
				$module = self::get_module( $module_slug );
				if ( ! $module ) {
					continue;
				}

				$module_slugs[] = $module_slug;
				$module_names[] = "<strong>{$module['name']}</strong>";
			}

			$module_slugs = join( ',', $module_slugs );
			?>
<div id="message" class="jetpack-message jetpack-err">
	<div class="squeezer">
		<h2><strong><?php esc_html_e( 'Is this site private?', 'jetpack' ); ?></strong></h2><br />
		<p>
			<?php
			echo wp_kses(
				wptexturize(
					wp_sprintf(
						_nx(
							"Like your site's RSS feeds, %l allows access to your posts and other content to third parties.",
							"Like your site's RSS feeds, %l allow access to your posts and other content to third parties.",
							count( $privacy_checks ),
							'%l = list of Jetpack module/feature names',
							'jetpack'
						),
						$module_names
					)
				),
				array( 'strong' => true )
			);

			echo "\n<br />\n";

			echo wp_kses(
				sprintf(
					_nx(
						'If your site is not publicly accessible, consider <a href="%1$s" title="%2$s">deactivating this feature</a>.',
						'If your site is not publicly accessible, consider <a href="%1$s" title="%2$s">deactivating these features</a>.',
						count( $privacy_checks ),
						'%1$s = deactivation URL, %2$s = "Deactivate {list of Jetpack module/feature names}',
						'jetpack'
					),
					wp_nonce_url(
						self::admin_url(
							array(
								'page'   => 'jetpack',
								'action' => 'deactivate',
								'module' => urlencode( $module_slugs ),
							)
						),
						"jetpack_deactivate-$module_slugs"
					),
					esc_attr( wp_kses( wp_sprintf( _x( 'Deactivate %l', '%l = list of Jetpack module/feature names', 'jetpack' ), $module_names ), array() ) )
				),
				array(
					'a' => array(
						'href'  => true,
						'title' => true,
					),
				)
			);
			?>
		</p>
	</div>
</div>
			<?php
endif;
	}

	/**
	 * We can't always respond to a signed XML-RPC request with a
	 * helpful error message. In some circumstances, doing so could
	 * leak information.
	 *
	 * Instead, track that the error occurred via a Jetpack_Option,
	 * and send that data back in the heartbeat.
	 * All this does is increment a number, but it's enough to find
	 * trends.
	 *
	 * @param WP_Error $xmlrpc_error The error produced during
	 *                               signature validation.
	 */
	function track_xmlrpc_error( $xmlrpc_error ) {
		$code = is_wp_error( $xmlrpc_error )
			? $xmlrpc_error->get_error_code()
			: 'should-not-happen';

		$xmlrpc_errors = Jetpack_Options::get_option( 'xmlrpc_errors', array() );
		if ( isset( $xmlrpc_errors[ $code ] ) && $xmlrpc_errors[ $code ] ) {
			// No need to update the option if we already have
			// this code stored.
			return;
		}
		$xmlrpc_errors[ $code ] = true;

		Jetpack_Options::update_option( 'xmlrpc_errors', $xmlrpc_errors, false );
	}

	/**
	 * Initialize the jetpack stats instance only when needed
	 *
	 * @return void
	 */
	private function initialize_stats() {
		if ( is_null( $this->a8c_mc_stats_instance ) ) {
			$this->a8c_mc_stats_instance = new Automattic\Jetpack\A8c_Mc_Stats();
		}
	}

	/**
	 * Record a stat for later output.  This will only currently output in the admin_footer.
	 */
	function stat( $group, $detail ) {
		$this->initialize_stats();
		$this->a8c_mc_stats_instance->add( $group, $detail );

		// Keep a local copy for backward compatibility (there are some direct checks on this).
		$this->stats = $this->a8c_mc_stats_instance->get_current_stats();
	}

	/**
	 * Load stats pixels. $group is auto-prefixed with "x_jetpack-"
	 */
	function do_stats( $method = '' ) {
		$this->initialize_stats();
		if ( 'server_side' === $method ) {
			$this->a8c_mc_stats_instance->do_server_side_stats();
		} else {
			$this->a8c_mc_stats_instance->do_stats();
		}

		// Keep a local copy for backward compatibility (there are some direct checks on this).
		$this->stats = array();
	}

	/**
	 * Runs stats code for a one-off, server-side.
	 *
	 * @param $args array|string The arguments to append to the URL. Should include `x_jetpack-{$group}={$stats}` or whatever we want to store.
	 *
	 * @return bool If it worked.
	 */
	static function do_server_side_stat( $args ) {
		$url                   = self::build_stats_url( $args );
		$a8c_mc_stats_instance = new Automattic\Jetpack\A8c_Mc_Stats();
		return $a8c_mc_stats_instance->do_server_side_stat( $url );
	}

	/**
	 * Builds the stats url.
	 *
	 * @param $args array|string The arguments to append to the URL.
	 *
	 * @return string The URL to be pinged.
	 */
	static function build_stats_url( $args ) {

		$a8c_mc_stats_instance = new Automattic\Jetpack\A8c_Mc_Stats();
		return $a8c_mc_stats_instance->build_stats_url( $args );

	}

	/**
	 * Builds a URL to the Jetpack connection auth page
	 *
	 * @since 3.9.5
	 *
	 * @param bool        $raw If true, URL will not be escaped.
	 * @param bool|string $redirect If true, will redirect back to Jetpack wp-admin landing page after connection.
	 *                              If string, will be a custom redirect.
	 * @param bool|string $from If not false, adds 'from=$from' param to the connect URL.
	 * @param bool        $register If true, will generate a register URL regardless of the existing token, since 4.9.0
	 *
	 * @return string Connect URL
	 */
	function build_connect_url( $raw = false, $redirect = false, $from = false, $register = false ) {
		$site_id    = Jetpack_Options::get_option( 'id' );
		$blog_token = ( new Tokens() )->get_access_token();

		if ( $register || ! $blog_token || ! $site_id ) {
			$url = self::nonce_url_no_esc( self::admin_url( 'action=register' ), 'jetpack-register' );

			if ( ! empty( $redirect ) ) {
				$url = add_query_arg(
					'redirect',
					urlencode( wp_validate_redirect( esc_url_raw( $redirect ) ) ),
					$url
				);
			}

			if ( is_network_admin() ) {
				$url = add_query_arg( 'is_multisite', network_admin_url( 'admin.php?page=jetpack-settings' ), $url );
			}

			$calypso_env = self::get_calypso_env();

			if ( ! empty( $calypso_env ) ) {
				$url = add_query_arg( 'calypso_env', $calypso_env, $url );
			}
		} else {

			// Let's check the existing blog token to see if we need to re-register. We only check once per minute
			// because otherwise this logic can get us in to a loop.
			$last_connect_url_check = (int) Jetpack_Options::get_raw_option( 'jetpack_last_connect_url_check' );
			if ( ! $last_connect_url_check || ( time() - $last_connect_url_check ) > MINUTE_IN_SECONDS ) {
				Jetpack_Options::update_raw_option( 'jetpack_last_connect_url_check', time() );

				$response = Client::wpcom_json_api_request_as_blog(
					sprintf( '/sites/%d', $site_id ) . '?force=wpcom',
					'1.1'
				);

				if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {

					// Generating a register URL instead to refresh the existing token
					return $this->build_connect_url( $raw, $redirect, $from, true );
				}
			}

			$url = $this->build_authorize_url( $redirect );
		}

		if ( $from ) {
			$url = add_query_arg( 'from', $from, $url );
		}

		$url = $raw ? esc_url_raw( $url ) : esc_url( $url );
		/**
		 * Filter the URL used when connecting a user to a WordPress.com account.
		 *
		 * @since 8.1.0
		 *
		 * @param string $url Connection URL.
		 * @param bool   $raw If true, URL will not be escaped.
		 */
		return apply_filters( 'jetpack_build_connection_url', $url, $raw );
	}

	public static function build_authorize_url( $redirect = false, $iframe = false ) {

		add_filter( 'jetpack_connect_request_body', array( __CLASS__, 'filter_connect_request_body' ) );
		add_filter( 'jetpack_connect_redirect_url', array( __CLASS__, 'filter_connect_redirect_url' ) );

		if ( $iframe ) {
			add_filter( 'jetpack_use_iframe_authorization_flow', '__return_true' );
		}

		$c8n = self::connection();
		$url = $c8n->get_authorization_url( wp_get_current_user(), $redirect );

		remove_filter( 'jetpack_connect_request_body', array( __CLASS__, 'filter_connect_request_body' ) );
		remove_filter( 'jetpack_connect_redirect_url', array( __CLASS__, 'filter_connect_redirect_url' ) );

		if ( $iframe ) {
			remove_filter( 'jetpack_use_iframe_authorization_flow', '__return_true' );
		}

		/**
		 * Filter the URL used when authorizing a user to a WordPress.com account.
		 *
		 * @since 8.9.0
		 *
		 * @param string $url Connection URL.
		 */
		return apply_filters( 'jetpack_build_authorize_url', $url );
	}

	/**
	 * Filters the connection URL parameter array.
	 *
	 * @param array $args default URL parameters used by the package.
	 * @return array the modified URL arguments array.
	 */
	public static function filter_connect_request_body( $args ) {
		if (
			Constants::is_defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' )
			&& include_once Constants::get_constant( 'JETPACK__GLOTPRESS_LOCALES_PATH' )
		) {
			$gp_locale      = GP_Locales::by_field( 'wp_locale', get_locale() );
			$args['locale'] = isset( $gp_locale ) && isset( $gp_locale->slug )
				? $gp_locale->slug
				: '';
		}

		$tracking        = new Tracking();
		$tracks_identity = $tracking->tracks_get_identity( $args['state'] );

		$args = array_merge(
			$args,
			array(
				'_ui' => $tracks_identity['_ui'],
				'_ut' => $tracks_identity['_ut'],
			)
		);

		$calypso_env = self::get_calypso_env();

		if ( ! empty( $calypso_env ) ) {
			$args['calypso_env'] = $calypso_env;
		}

		return $args;
	}

	/**
	 * Filters the `jetpack/v4/connection/data` API response of the Connection package in order to
	 * add Jetpack-the-plugin related permissions.
	 *
	 * @since 10.0
	 *
	 * @param array $current_user_connection_data An array containing the current user connection data.
	 * @return array
	 */
	public static function filter_jetpack_current_user_connection_data( $current_user_connection_data ) {
		$jetpack_permissions = array(
			'admin_page'         => current_user_can( 'jetpack_admin_page' ),
			'manage_modules'     => current_user_can( 'jetpack_manage_modules' ),
			'network_admin'      => current_user_can( 'jetpack_network_admin_page' ),
			'network_sites_page' => current_user_can( 'jetpack_network_sites_page' ),
			'edit_posts'         => current_user_can( 'edit_posts' ),
			'publish_posts'      => current_user_can( 'publish_posts' ),
			'manage_options'     => current_user_can( 'manage_options' ),
			'view_stats'         => current_user_can( 'view_stats' ),
			'manage_plugins'     => current_user_can( 'install_plugins' )
									&& current_user_can( 'activate_plugins' )
									&& current_user_can( 'update_plugins' )
									&& current_user_can( 'delete_plugins' ),
		);

		if ( isset( $current_user_connection_data['permissions'] ) &&
			is_array( $current_user_connection_data['permissions'] ) ) {
				$current_user_connection_data['permissions'] = array_merge( $current_user_connection_data['permissions'], $jetpack_permissions );
		} else {
			$current_user_connection_data['permissions'] = $jetpack_permissions;
		}

		return $current_user_connection_data;
	}

	/**
	 * Filters the URL that will process the connection data. It can be different from the URL
	 * that we send the user to after everything is done.
	 *
	 * @param String $processing_url the default redirect URL used by the package.
	 * @return String the modified URL.
	 *
	 * @deprecated since Jetpack 9.5.0
	 */
	public static function filter_connect_processing_url( $processing_url ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5' );

		$processing_url = admin_url( 'admin.php?page=jetpack' ); // Making PHPCS happy.
		return $processing_url;
	}

	/**
	 * Filters the redirection URL that is used for connect requests. The redirect
	 * URL should return the user back to the Jetpack console.
	 *
	 * @param String $redirect the default redirect URL used by the package.
	 * @return String the modified URL.
	 */
	public static function filter_connect_redirect_url( $redirect ) {
		$jetpack_admin_page = esc_url_raw( admin_url( 'admin.php?page=jetpack' ) );
		$redirect           = $redirect
			? wp_validate_redirect( esc_url_raw( $redirect ), $jetpack_admin_page )
			: $jetpack_admin_page;

		if ( isset( $_REQUEST['is_multisite'] ) ) {
			$redirect = Jetpack_Network::init()->get_url( 'network_admin_page' );
		}

		return $redirect;
	}

	/**
	 * This action fires at the beginning of the Manager::authorize method.
	 */
	public static function authorize_starting() {
		$jetpack_unique_connection = Jetpack_Options::get_option( 'unique_connection' );
		// Checking if site has been active/connected previously before recording unique connection.
		if ( ! $jetpack_unique_connection ) {
			// jetpack_unique_connection option has never been set.
			$jetpack_unique_connection = array(
				'connected'    => 0,
				'disconnected' => 0,
				'version'      => '3.6.1',
			);

			update_option( 'jetpack_unique_connection', $jetpack_unique_connection );

			// Track unique connection.
			$jetpack = self::init();

			$jetpack->stat( 'connections', 'unique-connection' );
			$jetpack->do_stats( 'server_side' );
		}

		// Increment number of times connected.
		$jetpack_unique_connection['connected'] += 1;
		Jetpack_Options::update_option( 'unique_connection', $jetpack_unique_connection );
	}

	/**
	 * This action fires when the site is registered (connected at a site level).
	 */
	public function handle_unique_registrations_stats() {
		$jetpack_unique_registrations = Jetpack_Options::get_option( 'unique_registrations' );
		// Checking if site has been registered previously before recording unique connection.
		if ( ! $jetpack_unique_registrations ) {

			$jetpack_unique_registrations = 0;

			$this->stat( 'connections', 'unique-registrations' );
			$this->do_stats( 'server_side' );
		}

		// Increment number of times connected.
		$jetpack_unique_registrations ++;
		Jetpack_Options::update_option( 'unique_registrations', $jetpack_unique_registrations );
	}

	/**
	 * This action fires at the end of the Manager::authorize method when a secondary user is
	 * linked.
	 */
	public static function authorize_ending_linked() {
		// Don't activate anything since we are just connecting a user.
		self::state( 'message', 'linked' );
	}

	/**
	 * This action fires at the end of the Manager::authorize method when the master user is
	 * authorized.
	 *
	 * @param array $data The request data.
	 */
	public static function authorize_ending_authorized( $data ) {
		// If this site has been through the Jetpack Onboarding flow, delete the onboarding token.
		self::invalidate_onboarding_token();

		// If redirect_uri is SSO, ensure SSO module is enabled.
		parse_str( wp_parse_url( $data['redirect_uri'], PHP_URL_QUERY ), $redirect_options );

		/** This filter is documented in class.jetpack-cli.php */
		$jetpack_start_enable_sso = apply_filters( 'jetpack_start_enable_sso', true );

		$activate_sso = (
			isset( $redirect_options['action'] ) &&
			'jetpack-sso' === $redirect_options['action'] &&
			$jetpack_start_enable_sso
		);

		$do_redirect_on_error = ( 'client' === $data['auth_type'] );

		self::handle_post_authorization_actions( $activate_sso, $do_redirect_on_error );
	}

	/**
	 * Fires on the jetpack_site_registered hook and acitvates default modules
	 */
	public static function activate_default_modules_on_site_register() {
		$active_modules = Jetpack_Options::get_option( 'active_modules' );
		if ( $active_modules ) {
			self::delete_active_modules();

			// If there was previously activated modules (a reconnection), re-activate them all including those that require a user, and do not re-activate those that have been deactivated.
			self::activate_default_modules( 999, 1, $active_modules, false );
		} else {
			// On a fresh new connection, at this point we activate only modules that do not require a user connection.
			self::activate_default_modules( false, false, array(), false, null, null, false );
		}

		// Since this is a fresh connection, be sure to clear out IDC options.
		Identity_Crisis::clear_all_idc_options();
	}

	/**
	 * This action fires at the end of the REST_Connector connection_reconnect method when the
	 * reconnect process is completed.
	 * Note that this currently only happens when we don't need the user to re-authorize
	 * their WP.com account, eg in cases where we are restoring a connection with
	 * unhealthy blog token.
	 */
	public static function reconnection_completed() {
		self::state( 'message', 'reconnection_completed' );
	}

	/**
	 * Get our assumed site creation date.
	 * Calculated based on the earlier date of either:
	 * - Earliest admin user registration date.
	 * - Earliest date of post of any post type.
	 *
	 * @since 7.2.0
	 * @deprecated since 7.8.0
	 *
	 * @return string Assumed site creation date and time.
	 */
	public static function get_assumed_site_creation_date() {
		_deprecated_function( __METHOD__, 'jetpack-7.8', 'Automattic\\Jetpack\\Connection\\Manager' );
		return self::connection()->get_assumed_site_creation_date();
	}

	public static function apply_activation_source_to_args( &$args ) {
		list( $activation_source_name, $activation_source_keyword ) = get_option( 'jetpack_activation_source' );

		if ( $activation_source_name ) {
			$args['_as'] = urlencode( $activation_source_name );
		}

		if ( $activation_source_keyword ) {
			$args['_ak'] = urlencode( $activation_source_keyword );
		}
	}

	function build_reconnect_url( $raw = false ) {
		$url = wp_nonce_url( self::admin_url( 'action=reconnect' ), 'jetpack-reconnect' );
		return $raw ? $url : esc_url( $url );
	}

	public static function admin_url( $args = null ) {
		$args = wp_parse_args( $args, array( 'page' => 'jetpack' ) );
		$url  = add_query_arg( $args, admin_url( 'admin.php' ) );
		return $url;
	}

	public static function nonce_url_no_esc( $actionurl, $action = -1, $name = '_wpnonce' ) {
		$actionurl = str_replace( '&amp;', '&', $actionurl );
		return add_query_arg( $name, wp_create_nonce( $action ), $actionurl );
	}

	function dismiss_jetpack_notice() {

		if ( ! isset( $_GET['jetpack-notice'] ) ) {
			return;
		}

		switch ( $_GET['jetpack-notice'] ) {
			case 'dismiss':
				if ( check_admin_referer( 'jetpack-deactivate' ) && ! is_plugin_active_for_network( plugin_basename( JETPACK__PLUGIN_DIR . 'jetpack.php' ) ) ) {

					require_once ABSPATH . 'wp-admin/includes/plugin.php';
					deactivate_plugins( JETPACK__PLUGIN_DIR . 'jetpack.php', false, false );
					wp_safe_redirect( admin_url() . 'plugins.php?deactivate=true&plugin_status=all&paged=1&s=' );
				}
				break;
		}
	}

	public static function sort_modules( $a, $b ) {
		if ( $a['sort'] == $b['sort'] ) {
			return 0;
		}

		return ( $a['sort'] < $b['sort'] ) ? -1 : 1;
	}

	function ajax_recheck_ssl() {
		check_ajax_referer( 'recheck-ssl', 'ajax-nonce' );
		$result = self::permit_ssl( true );
		wp_send_json(
			array(
				'enabled' => $result,
				'message' => get_transient( 'jetpack_https_test_message' ),
			)
		);
	}

	/* Client API */

	/**
	 * Returns the requested Jetpack API URL
	 *
	 * @deprecated since 7.7
	 * @return string
	 */
	public static function api_url( $relative_url ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::api_url' );
		$connection = self::connection();
		return $connection->api_url( $relative_url );
	}

	/**
	 * @deprecated 8.0
	 *
	 * Some hosts disable the OpenSSL extension and so cannot make outgoing HTTPS requests.
	 * But we no longer fix "bad hosts" anyway, outbound HTTPS is required for Jetpack to function.
	 */
	public static function fix_url_for_bad_hosts( $url ) {
		_deprecated_function( __METHOD__, 'jetpack-8.0' );
		return $url;
	}

	public static function verify_onboarding_token( $token_data, $token, $request_data ) {
		// Default to a blog token.
		$token_type = 'blog';

		// Let's see if this is onboarding. In such case, use user token type and the provided user id.
		if ( isset( $request_data ) || ! empty( $_GET['onboarding'] ) ) {
			if ( ! empty( $_GET['onboarding'] ) ) {
				$jpo = $_GET;
			} else {
				$jpo = json_decode( $request_data, true );
			}

			$jpo_token = ! empty( $jpo['onboarding']['token'] ) ? $jpo['onboarding']['token'] : null;
			$jpo_user  = ! empty( $jpo['onboarding']['jpUser'] ) ? $jpo['onboarding']['jpUser'] : null;

			if (
				isset( $jpo_user )
				&& isset( $jpo_token )
				&& is_email( $jpo_user )
				&& ctype_alnum( $jpo_token )
				&& isset( $_GET['rest_route'] )
				&& self::validate_onboarding_token_action(
					$jpo_token,
					$_GET['rest_route']
				)
			) {
				$jp_user = get_user_by( 'email', $jpo_user );
				if ( is_a( $jp_user, 'WP_User' ) ) {
					wp_set_current_user( $jp_user->ID );
					$user_can = is_multisite()
						? current_user_can_for_blog( get_current_blog_id(), 'manage_options' )
						: current_user_can( 'manage_options' );
					if ( $user_can ) {
						$token_type              = 'user';
						$token->external_user_id = $jp_user->ID;
					}
				}
			}

			$token_data['type']    = $token_type;
			$token_data['user_id'] = $token->external_user_id;
		}

		return $token_data;
	}

	/**
	 * Create a random secret for validating onboarding payload
	 *
	 * @return string Secret token
	 */
	public static function create_onboarding_token() {
		if ( false === ( $token = Jetpack_Options::get_option( 'onboarding' ) ) ) {
			$token = wp_generate_password( 32, false );
			Jetpack_Options::update_option( 'onboarding', $token );
		}

		return $token;
	}

	/**
	 * Remove the onboarding token
	 *
	 * @return bool True on success, false on failure
	 */
	public static function invalidate_onboarding_token() {
		return Jetpack_Options::delete_option( 'onboarding' );
	}

	/**
	 * Validate an onboarding token for a specific action
	 *
	 * @return boolean True if token/action pair is accepted, false if not
	 */
	public static function validate_onboarding_token_action( $token, $action ) {
		// Compare tokens, bail if tokens do not match
		if ( ! hash_equals( $token, Jetpack_Options::get_option( 'onboarding' ) ) ) {
			return false;
		}

		// List of valid actions we can take
		$valid_actions = array(
			'/jetpack/v4/settings',
		);

		// Only allow valid actions.
		if ( ! in_array( $action, $valid_actions ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Checks to see if the URL is using SSL to connect with Jetpack
	 *
	 * @since 2.3.3
	 * @return boolean
	 */
	public static function permit_ssl( $force_recheck = false ) {
		// Do some fancy tests to see if ssl is being supported
		if ( $force_recheck || false === ( $ssl = get_transient( 'jetpack_https_test' ) ) ) {
			$message = '';
			if ( 'https' !== substr( JETPACK__API_BASE, 0, 5 ) ) {
				$ssl = 0;
			} else {
				$ssl = 1;

				if ( ! wp_http_supports( array( 'ssl' => true ) ) ) {
					$ssl     = 0;
					$message = __( 'WordPress reports no SSL support', 'jetpack' );
				} else {
					$response = wp_remote_get( JETPACK__API_BASE . 'test/1/' );
					if ( is_wp_error( $response ) ) {
						$ssl     = 0;
						$message = __( 'WordPress reports no SSL support', 'jetpack' );
					} elseif ( 'OK' !== wp_remote_retrieve_body( $response ) ) {
						$ssl     = 0;
						$message = __( 'Response was not OK: ', 'jetpack' ) . wp_remote_retrieve_body( $response );
					}
				}
			}
			set_transient( 'jetpack_https_test', $ssl, DAY_IN_SECONDS );
			set_transient( 'jetpack_https_test_message', $message, DAY_IN_SECONDS );
		}

		return (bool) $ssl;
	}

	/*
	 * Displays an admin_notice, alerting the user that outbound SSL isn't working.
	 */
	public function alert_auto_ssl_fail() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$ajax_nonce = wp_create_nonce( 'recheck-ssl' );
		?>

		<div id="jetpack-ssl-warning" class="error jp-identity-crisis">
			<div class="jp-banner__content">
				<h2><?php _e( 'Outbound HTTPS not working', 'jetpack' ); ?></h2>
				<p><?php _e( 'Your site could not connect to WordPress.com via HTTPS. This could be due to any number of reasons, including faulty SSL certificates, misconfigured or missing SSL libraries, or network issues.', 'jetpack' ); ?></p>
				<p>
					<?php _e( 'Jetpack will re-test for HTTPS support once a day, but you can click here to try again immediately: ', 'jetpack' ); ?>
					<a href="#" id="jetpack-recheck-ssl-button"><?php _e( 'Try again', 'jetpack' ); ?></a>
					<span id="jetpack-recheck-ssl-output"><?php echo get_transient( 'jetpack_https_test_message' ); ?></span>
				</p>
				<p>
					<?php
					printf(
						__( 'For more help, try our <a href="%1$s">connection debugger</a> or <a href="%2$s" target="_blank">troubleshooting tips</a>.', 'jetpack' ),
						esc_url( self::admin_url( array( 'page' => 'jetpack-debugger' ) ) ),
						esc_url( Redirect::get_url( 'jetpack-support-getting-started-troubleshooting-tips' ) )
					);
					?>
				</p>
			</div>
		</div>
		<style>
			#jetpack-recheck-ssl-output { margin-left: 5px; color: red; }
		</style>
		<script type="text/javascript">
			jQuery( document ).ready( function( $ ) {
				$( '#jetpack-recheck-ssl-button' ).click( function( e ) {
					var $this = $( this );
					$this.html( <?php echo json_encode( __( 'Checking', 'jetpack' ) ); ?> );
					$( '#jetpack-recheck-ssl-output' ).html( '' );
					e.preventDefault();
					var data = { action: 'jetpack-recheck-ssl', 'ajax-nonce': '<?php echo $ajax_nonce; ?>' };
					$.post( ajaxurl, data )
					  .done( function( response ) {
						  if ( response.enabled ) {
							  $( '#jetpack-ssl-warning' ).hide();
						  } else {
							  this.html( <?php echo json_encode( __( 'Try again', 'jetpack' ) ); ?> );
							  $( '#jetpack-recheck-ssl-output' ).html( 'SSL Failed: ' + response.message );
						  }
					  }.bind( $this ) );
				} );
			} );
		</script>

		<?php
	}

	/**
	 * Returns the Jetpack XML-RPC API
	 *
	 * @deprecated 8.0 Use Connection_Manager instead.
	 * @return string
	 */
	public static function xmlrpc_api_url() {
		_deprecated_function( __METHOD__, 'jetpack-8.0', 'Automattic\\Jetpack\\Connection\\Manager::xmlrpc_api_url()' );
		return self::connection()->xmlrpc_api_url();
	}

	/**
	 * Returns the connection manager object.
	 *
	 * @return Automattic\Jetpack\Connection\Manager
	 */
	public static function connection() {
		$jetpack = static::init();

		// If the connection manager hasn't been instantiated, do that now.
		if ( ! $jetpack->connection_manager ) {
			$jetpack->connection_manager = new Connection_Manager( 'jetpack' );
		}

		return $jetpack->connection_manager;
	}

	/**
	 * Creates two secret tokens and the end of life timestamp for them.
	 *
	 * Note these tokens are unique per call, NOT static per site for connecting.
	 *
	 * @deprecated 9.5 Use Automattic\Jetpack\Connection\Secrets->generate() instead.
	 *
	 * @since 2.6
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 * @param Integer $exp     Expiration time in seconds.
	 * @return array
	 */
	public static function generate_secrets( $action, $user_id = false, $exp = 600 ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5', 'Automattic\\Jetpack\\Connection\\Secrets->generate' );
		return self::connection()->generate_secrets( $action, $user_id, $exp );
	}

	public static function get_secrets( $action, $user_id ) {
		$secrets = ( new Secrets() )->get( $action, $user_id );

		if ( Secrets::SECRETS_MISSING === $secrets ) {
			return new WP_Error( 'verify_secrets_missing', 'Verification secrets not found' );
		}

		if ( Secrets::SECRETS_EXPIRED === $secrets ) {
			return new WP_Error( 'verify_secrets_expired', 'Verification took too long' );
		}

		return $secrets;
	}

	/**
	 * Builds the timeout limit for queries talking with the wpcom servers.
	 *
	 * Based on local php max_execution_time in php.ini
	 *
	 * @since 2.6
	 * @return int
	 * @deprecated
	 **/
	public function get_remote_query_timeout_limit() {
		_deprecated_function( __METHOD__, 'jetpack-5.4' );
		return self::get_max_execution_time();
	}

	/**
	 * Builds the timeout limit for queries talking with the wpcom servers.
	 *
	 * Based on local php max_execution_time in php.ini
	 *
	 * @since 5.4
	 * @return int
	 **/
	public static function get_max_execution_time() {
		$timeout = (int) ini_get( 'max_execution_time' );

		// Ensure exec time set in php.ini
		if ( ! $timeout ) {
			$timeout = 30;
		}
		return $timeout;
	}

	/**
	 * Sets a minimum request timeout, and returns the current timeout
	 *
	 * @since 5.4
	 **/
	public static function set_min_time_limit( $min_timeout ) {
		$timeout = self::get_max_execution_time();
		if ( $timeout < $min_timeout ) {
			$timeout = $min_timeout;
			set_time_limit( $timeout );
		}
		return $timeout;
	}

	/**
	 * Takes the response from the Jetpack register new site endpoint and
	 * verifies it worked properly.
	 *
	 * @since 2.6
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::validate_remote_register_response()
	 **/
	public function validate_remote_register_response() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::validate_remote_register_response' );
	}

	/**
	 * @deprecated since Jetpack 9.7.0
	 * @see Automattic\Jetpack\Connection\Manager::try_registration()
	 *
	 * @return bool|WP_Error
	 */
	public static function register() {
		_deprecated_function( __METHOD__, 'jetpack-9.7', 'Automattic\\Jetpack\\Connection\\Manager::try_registration' );
		return static::connection()->try_registration( false );
	}

	/**
	 * Filters the registration request body to include tracking properties.
	 *
	 * @deprecated since Jetpack 9.7.0
	 * @see Automattic\Jetpack\Connection\Utils::filter_register_request_body()
	 *
	 * @param array $properties
	 * @return array amended properties.
	 */
	public static function filter_register_request_body( $properties ) {
		_deprecated_function( __METHOD__, 'jetpack-9.7', 'Automattic\\Jetpack\\Connection\\Utils::filter_register_request_body' );
		return Connection_Utils::filter_register_request_body( $properties );
	}

	/**
	 * Filters the token request body to include tracking properties.
	 *
	 * @param array $properties
	 * @return array amended properties.
	 */
	public static function filter_token_request_body( $properties ) {
		$tracking        = new Tracking();
		$tracks_identity = $tracking->tracks_get_identity( get_current_user_id() );

		return array_merge(
			$properties,
			array(
				'_ui' => $tracks_identity['_ui'],
				'_ut' => $tracks_identity['_ut'],
			)
		);
	}

	/**
	 * If the db version is showing something other that what we've got now, bump it to current.
	 *
	 * @return bool: True if the option was incorrect and updated, false if nothing happened.
	 */
	public static function maybe_set_version_option() {
		list( $version ) = explode( ':', Jetpack_Options::get_option( 'version' ) );
		if ( JETPACK__VERSION != $version ) {
			Jetpack_Options::update_option( 'version', JETPACK__VERSION . ':' . time() );

			if ( version_compare( JETPACK__VERSION, $version, '>' ) ) {
				/** This action is documented in class.jetpack.php */
				do_action( 'updating_jetpack_version', JETPACK__VERSION, $version );
			}

			return true;
		}
		return false;
	}

	/* Client Server API */

	/**
	 * Loads the Jetpack XML-RPC client.
	 * No longer necessary, as the XML-RPC client will be automagically loaded.
	 *
	 * @deprecated since 7.7.0
	 */
	public static function load_xml_rpc_client() {
		_deprecated_function( __METHOD__, 'jetpack-7.7' );
	}

	/**
	 * Resets the saved authentication state in between testing requests.
	 *
	 * @deprecated since 8.9.0
	 * @see Automattic\Jetpack\Connection\Rest_Authentication::reset_saved_auth_state()
	 */
	public function reset_saved_auth_state() {
		_deprecated_function( __METHOD__, 'jetpack-8.9', 'Automattic\\Jetpack\\Connection\\Rest_Authentication::reset_saved_auth_state' );
		Connection_Rest_Authentication::init()->reset_saved_auth_state();
	}

	/**
	 * Verifies the signature of the current request.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::verify_xml_rpc_signature()
	 *
	 * @return false|array
	 */
	public function verify_xml_rpc_signature() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::verify_xml_rpc_signature' );
		return self::connection()->verify_xml_rpc_signature();
	}

	/**
	 * Verifies the signature of the current request.
	 *
	 * This function has side effects and should not be used. Instead,
	 * use the memoized version `->verify_xml_rpc_signature()`.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::internal_verify_xml_rpc_signature()
	 * @internal
	 */
	private function internal_verify_xml_rpc_signature() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::internal_verify_xml_rpc_signature' );
	}

	/**
	 * Authenticates XML-RPC and other requests from the Jetpack Server.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::authenticate_jetpack()
	 *
	 * @param \WP_User|mixed $user     User object if authenticated.
	 * @param string         $username Username.
	 * @param string         $password Password string.
	 * @return \WP_User|mixed Authenticated user or error.
	 */
	public function authenticate_jetpack( $user, $username, $password ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::authenticate_jetpack' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->authenticate_jetpack( $user, $username, $password );
	}

	/**
	 * Authenticates requests from Jetpack server to WP REST API endpoints.
	 * Uses the existing XMLRPC request signing implementation.
	 *
	 * @deprecated since 8.9.0
	 * @see Automattic\Jetpack\Connection\Rest_Authentication::wp_rest_authenticate()
	 */
	function wp_rest_authenticate( $user ) {
		_deprecated_function( __METHOD__, 'jetpack-8.9', 'Automattic\\Jetpack\\Connection\\Rest_Authentication::wp_rest_authenticate' );
		return Connection_Rest_Authentication::init()->wp_rest_authenticate( $user );
	}

	/**
	 * Report authentication status to the WP REST API.
	 *
	 * @deprecated since 8.9.0
	 * @see Automattic\Jetpack\Connection\Rest_Authentication::wp_rest_authentication_errors()
	 *
	 * @param  WP_Error|mixed $result Error from another authentication handler, null if we should handle it, or another value if not
	 * @return WP_Error|boolean|null {@see WP_JSON_Server::check_authentication}
	 */
	public function wp_rest_authentication_errors( $value ) {
		_deprecated_function( __METHOD__, 'jetpack-8.9', 'Automattic\\Jetpack\\Connection\\Rest_Authentication::wp_rest_authenication_errors' );
		return Connection_Rest_Authentication::init()->wp_rest_authentication_errors( $value );
	}

	/**
	 * In some setups, $HTTP_RAW_POST_DATA can be emptied during some IXR_Server paths since it is passed by reference to various methods.
	 * Capture it here so we can verify the signature later.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::xmlrpc_methods()
	 *
	 * @param array $methods XMLRPC methods.
	 * @return array XMLRPC methods, with the $HTTP_RAW_POST_DATA one.
	 */
	public function xmlrpc_methods( $methods ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::xmlrpc_methods' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->xmlrpc_methods( $methods );
	}

	/**
	 * Register additional public XMLRPC methods.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::public_xmlrpc_methods()
	 *
	 * @param array $methods Public XMLRPC methods.
	 * @return array Public XMLRPC methods, with the getOptions one.
	 */
	public function public_xmlrpc_methods( $methods ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::public_xmlrpc_methods' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->public_xmlrpc_methods( $methods );
	}

	/**
	 * Handles a getOptions XMLRPC method call.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::jetpack_getOptions()
	 *
	 * @param array $args method call arguments.
	 * @return array an amended XMLRPC server options array.
	 */
	public function jetpack_getOptions( $args ) { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::jetpack_getOptions' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->jetpack_getOptions( $args );
	}

	/**
	 * Adds Jetpack-specific options to the output of the XMLRPC options method.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::xmlrpc_options()
	 *
	 * @param array $options Standard Core options.
	 * @return array Amended options.
	 */
	public function xmlrpc_options( $options ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::xmlrpc_options' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->xmlrpc_options( $options );
	}

	/**
	 * State is passed via cookies from one request to the next, but never to subsequent requests.
	 * SET: state( $key, $value );
	 * GET: $value = state( $key );
	 *
	 * @param string $key
	 * @param string $value
	 * @param bool   $restate private
	 */
	public static function state( $key = null, $value = null, $restate = false ) {
		static $state = array();
		static $path, $domain;
		if ( ! isset( $path ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
			$admin_url = self::admin_url();
			$bits      = wp_parse_url( $admin_url );

			if ( is_array( $bits ) ) {
				$path   = ( isset( $bits['path'] ) ) ? dirname( $bits['path'] ) : null;
				$domain = ( isset( $bits['host'] ) ) ? $bits['host'] : null;
			} else {
				$path = $domain = null;
			}
		}

		// Extract state from cookies and delete cookies
		if ( isset( $_COOKIE['jetpackState'] ) && is_array( $_COOKIE['jetpackState'] ) ) {
			$yum = wp_unslash( $_COOKIE['jetpackState'] );
			unset( $_COOKIE['jetpackState'] );
			foreach ( $yum as $k => $v ) {
				if ( strlen( $v ) ) {
					$state[ $k ] = $v;
				}
				setcookie( "jetpackState[$k]", false, 0, $path, $domain );
			}
		}

		if ( $restate ) {
			foreach ( $state as $k => $v ) {
				setcookie( "jetpackState[$k]", $v, 0, $path, $domain );
			}
			return;
		}

		// Get a state variable.
		if ( isset( $key ) && ! isset( $value ) ) {
			if ( array_key_exists( $key, $state ) ) {
				return $state[ $key ];
			}
			return null;
		}

		// Set a state variable.
		if ( isset( $key ) && isset( $value ) ) {
			if ( is_array( $value ) && isset( $value[0] ) ) {
				$value = $value[0];
			}
			$state[ $key ] = $value;
			if ( ! headers_sent() ) {
				if ( self::should_set_cookie( $key ) ) {
					setcookie( "jetpackState[$key]", $value, 0, $path, $domain );
				}
			}
		}
	}

	public static function restate() {
		self::state( null, null, true );
	}

	/**
	 * Determines whether the jetpackState[$key] value should be added to the
	 * cookie.
	 *
	 * @param string $key The state key.
	 *
	 * @return boolean Whether the value should be added to the cookie.
	 */
	public static function should_set_cookie( $key ) {
		global $current_screen;
		$page = isset( $current_screen->base ) ? $current_screen->base : null;

		if ( 'toplevel_page_jetpack' === $page && 'display_update_modal' === $key ) {
			return false;
		}

		return true;
	}

	public static function check_privacy( $file ) {
		static $is_site_publicly_accessible = null;

		if ( is_null( $is_site_publicly_accessible ) ) {
			$is_site_publicly_accessible = false;

			$rpc = new Jetpack_IXR_Client();

			$success = $rpc->query( 'jetpack.isSitePubliclyAccessible', home_url() );
			if ( $success ) {
				$response = $rpc->getResponse();
				if ( $response ) {
					$is_site_publicly_accessible = true;
				}
			}

			Jetpack_Options::update_option( 'public', (int) $is_site_publicly_accessible );
		}

		if ( $is_site_publicly_accessible ) {
			return;
		}

		$module_slug = self::get_module_slug( $file );

		$privacy_checks = self::state( 'privacy_checks' );
		if ( ! $privacy_checks ) {
			$privacy_checks = $module_slug;
		} else {
			$privacy_checks .= ",$module_slug";
		}

		self::state( 'privacy_checks', $privacy_checks );
	}

	/**
	 * Helper method for multicall XMLRPC.
	 *
	 * @deprecated since 8.9.0
	 * @see Automattic\\Jetpack\\Connection\\Xmlrpc_Async_Call::add_call()
	 *
	 * @param ...$args Args for the async_call.
	 */
	public static function xmlrpc_async_call( ...$args ) {

		_deprecated_function( 'Jetpack::xmlrpc_async_call', 'jetpack-8.9.0', 'Automattic\\Jetpack\\Connection\\Xmlrpc_Async_Call::add_call' );

		global $blog_id;
		static $clients = array();

		$client_blog_id = is_multisite() ? $blog_id : 0;

		if ( ! isset( $clients[ $client_blog_id ] ) ) {
			$clients[ $client_blog_id ] = new Jetpack_IXR_ClientMulticall( array( 'user_id' => true ) );
			if ( function_exists( 'ignore_user_abort' ) ) {
				ignore_user_abort( true );
			}
			add_action( 'shutdown', array( 'Jetpack', 'xmlrpc_async_call' ) );
		}

		if ( ! empty( $args[0] ) ) {
			call_user_func_array( array( $clients[ $client_blog_id ], 'addCall' ), $args );
		} elseif ( is_multisite() ) {
			foreach ( $clients as $client_blog_id => $client ) {
				if ( ! $client_blog_id || empty( $client->calls ) ) {
					continue;
				}

				$switch_success = switch_to_blog( $client_blog_id, true );
				if ( ! $switch_success ) {
					continue;
				}

				flush();
				$client->query();

				restore_current_blog();
			}
		} else {
			if ( isset( $clients[0] ) && ! empty( $clients[0]->calls ) ) {
				flush();
				$clients[0]->query();
			}
		}
	}

	/**
	 * Serve a WordPress.com static resource via a randomized wp.com subdomain.
	 *
	 * @deprecated 9.3.0 Use Assets::staticize_subdomain.
	 *
	 * @param string $url WordPress.com static resource URL.
	 */
	public static function staticize_subdomain( $url ) {
		_deprecated_function( __METHOD__, 'jetpack-9.3.0', 'Automattic\Jetpack\Assets::staticize_subdomain' );
		return Assets::staticize_subdomain( $url );
	}

	/* JSON API Authorization */

	/**
	 * Handles the login action for Authorizing the JSON API
	 */
	function login_form_json_api_authorization() {
		$this->verify_json_api_authorization_request();

		add_action( 'wp_login', array( &$this, 'store_json_api_authorization_token' ), 10, 2 );

		add_action( 'login_message', array( &$this, 'login_message_json_api_authorization' ) );
		add_action( 'login_form', array( &$this, 'preserve_action_in_login_form_for_json_api_authorization' ) );
		add_filter( 'site_url', array( &$this, 'post_login_form_to_signed_url' ), 10, 3 );
	}

	// Make sure the login form is POSTed to the signed URL so we can reverify the request
	function post_login_form_to_signed_url( $url, $path, $scheme ) {
		if ( 'wp-login.php' !== $path || ( 'login_post' !== $scheme && 'login' !== $scheme ) ) {
			return $url;
		}

		$parsed_url = wp_parse_url( $url );
		$url        = strtok( $url, '?' );
		$url        = "$url?{$_SERVER['QUERY_STRING']}";
		if ( ! empty( $parsed_url['query'] ) ) {
			$url .= "&{$parsed_url['query']}";
		}

		return $url;
	}

	// Make sure the POSTed request is handled by the same action
	function preserve_action_in_login_form_for_json_api_authorization() {
		echo "<input type='hidden' name='action' value='jetpack_json_api_authorization' />\n";
		echo "<input type='hidden' name='jetpack_json_api_original_query' value='" . esc_url( set_url_scheme( $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ) ) . "' />\n";
	}

	// If someone logs in to approve API access, store the Access Code in usermeta
	function store_json_api_authorization_token( $user_login, $user ) {
		add_filter( 'login_redirect', array( &$this, 'add_token_to_login_redirect_json_api_authorization' ), 10, 3 );
		add_filter( 'allowed_redirect_hosts', array( &$this, 'allow_wpcom_public_api_domain' ) );
		$token = wp_generate_password( 32, false );
		update_user_meta( $user->ID, 'jetpack_json_api_' . $this->json_api_authorization_request['client_id'], $token );
	}

	// Add public-api.wordpress.com to the safe redirect allowed list - only added when someone allows API access.
	function allow_wpcom_public_api_domain( $domains ) {
		$domains[] = 'public-api.wordpress.com';
		return $domains;
	}

	static function is_redirect_encoded( $redirect_url ) {
		return preg_match( '/https?%3A%2F%2F/i', $redirect_url ) > 0;
	}

	// Add all wordpress.com environments to the safe redirect allowed list.
	function allow_wpcom_environments( $domains ) {
		$domains[] = 'wordpress.com';
		$domains[] = 'wpcalypso.wordpress.com';
		$domains[] = 'horizon.wordpress.com';
		$domains[] = 'calypso.localhost';
		return $domains;
	}

	// Add the Access Code details to the public-api.wordpress.com redirect
	function add_token_to_login_redirect_json_api_authorization( $redirect_to, $original_redirect_to, $user ) {
		return add_query_arg(
			urlencode_deep(
				array(
					'jetpack-code'    => get_user_meta( $user->ID, 'jetpack_json_api_' . $this->json_api_authorization_request['client_id'], true ),
					'jetpack-user-id' => (int) $user->ID,
					'jetpack-state'   => $this->json_api_authorization_request['state'],
				)
			),
			$redirect_to
		);
	}

	/**
	 * Verifies the request by checking the signature
	 *
	 * @since 4.6.0 Method was updated to use `$_REQUEST` instead of `$_GET` and `$_POST`. Method also updated to allow
	 * passing in an `$environment` argument that overrides `$_REQUEST`. This was useful for integrating with SSO.
	 *
	 * @param null|array $environment
	 */
	function verify_json_api_authorization_request( $environment = null ) {
		$environment = is_null( $environment )
			? $_REQUEST
			: $environment;

		list( $env_token,, $env_user_id ) = explode( ':', $environment['token'] );
		$token                            = ( new Tokens() )->get_access_token( $env_user_id, $env_token );
		if ( ! $token || empty( $token->secret ) ) {
			wp_die( __( 'You must connect your Jetpack plugin to WordPress.com to use this feature.', 'jetpack' ) );
		}

		$die_error = __( 'Someone may be trying to trick you into giving them access to your site. Or it could be you just encountered a bug :).  Either way, please close this window.', 'jetpack' );

		// Host has encoded the request URL, probably as a result of a bad http => https redirect
		if ( self::is_redirect_encoded( $_GET['redirect_to'] ) ) {
			/**
			 * Jetpack authorisation request Error.
			 *
			 * @since 7.5.0
			 */
			do_action( 'jetpack_verify_api_authorization_request_error_double_encode' );
			$die_error = sprintf(
				/* translators: %s is a URL */
				__( 'Your site is incorrectly double-encoding redirects from http to https. This is preventing Jetpack from authenticating your connection. Please visit our <a href="%s">support page</a> for details about how to resolve this.', 'jetpack' ),
				Redirect::get_url( 'jetpack-support-double-encoding' )
			);
		}

		$jetpack_signature = new Jetpack_Signature( $token->secret, (int) Jetpack_Options::get_option( 'time_diff' ) );

		if ( isset( $environment['jetpack_json_api_original_query'] ) ) {
			$signature = $jetpack_signature->sign_request(
				$environment['token'],
				$environment['timestamp'],
				$environment['nonce'],
				'',
				'GET',
				$environment['jetpack_json_api_original_query'],
				null,
				true
			);
		} else {
			$signature = $jetpack_signature->sign_current_request(
				array(
					'body'   => null,
					'method' => 'GET',
				)
			);
		}

		if ( ! $signature ) {
			wp_die( $die_error );
		} elseif ( is_wp_error( $signature ) ) {
			wp_die( $die_error );
		} elseif ( ! hash_equals( $signature, $environment['signature'] ) ) {
			if ( is_ssl() ) {
				// If we signed an HTTP request on the Jetpack Servers, but got redirected to HTTPS by the local blog, check the HTTP signature as well
				$signature = $jetpack_signature->sign_current_request(
					array(
						'scheme' => 'http',
						'body'   => null,
						'method' => 'GET',
					)
				);
				if ( ! $signature || is_wp_error( $signature ) || ! hash_equals( $signature, $environment['signature'] ) ) {
					wp_die( $die_error );
				}
			} else {
				wp_die( $die_error );
			}
		}

		$timestamp = (int) $environment['timestamp'];
		$nonce     = stripslashes( (string) $environment['nonce'] );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		if ( ! ( new Nonce_Handler() )->add( $timestamp, $nonce ) ) {
			// De-nonce the nonce, at least for 5 minutes.
			// We have to reuse this nonce at least once (used the first time when the initial request is made, used a second time when the login form is POSTed)
			$old_nonce_time = get_option( "jetpack_nonce_{$timestamp}_{$nonce}" );
			if ( $old_nonce_time < time() - 300 ) {
				wp_die( esc_html__( 'The authorization process expired. Please go back and try again.', 'jetpack' ) );
			}
		}

		$data         = json_decode( base64_decode( stripslashes( $environment['data'] ) ) );
		$data_filters = array(
			'state'        => 'opaque',
			'client_id'    => 'int',
			'client_title' => 'string',
			'client_image' => 'url',
		);

		foreach ( $data_filters as $key => $sanitation ) {
			if ( ! isset( $data->$key ) ) {
				wp_die( $die_error );
			}

			switch ( $sanitation ) {
				case 'int':
					$this->json_api_authorization_request[ $key ] = (int) $data->$key;
					break;
				case 'opaque':
					$this->json_api_authorization_request[ $key ] = (string) $data->$key;
					break;
				case 'string':
					$this->json_api_authorization_request[ $key ] = wp_kses( (string) $data->$key, array() );
					break;
				case 'url':
					$this->json_api_authorization_request[ $key ] = esc_url_raw( (string) $data->$key );
					break;
			}
		}

		if ( empty( $this->json_api_authorization_request['client_id'] ) ) {
			wp_die( $die_error );
		}
	}

	function login_message_json_api_authorization( $message ) {
		return '<p class="message">' . sprintf(
			/* translators: Name/image of the client requesting authorization */
			esc_html__( '%s wants to access your site’s data. Log in to authorize that access.', 'jetpack' ),
			'<strong>' . esc_html( $this->json_api_authorization_request['client_title'] ) . '</strong>'
		) . '<img src="' . esc_url( $this->json_api_authorization_request['client_image'] ) . '" /></p>';
	}

	/**
	 * Get $content_width, but with a <s>twist</s> filter.
	 */
	public static function get_content_width() {
		$content_width = ( isset( $GLOBALS['content_width'] ) && is_numeric( $GLOBALS['content_width'] ) )
			? $GLOBALS['content_width']
			: false;
		/**
		 * Filter the Content Width value.
		 *
		 * @since 2.2.3
		 *
		 * @param string $content_width Content Width value.
		 */
		return apply_filters( 'jetpack_content_width', $content_width );
	}

	/**
	 * Pings the WordPress.com Mirror Site for the specified options.
	 *
	 * @param string|array $option_names The option names to request from the WordPress.com Mirror Site
	 *
	 * @return array An associative array of the option values as stored in the WordPress.com Mirror Site
	 */
	public function get_cloud_site_options( $option_names ) {
		$option_names = array_filter( (array) $option_names, 'is_string' );

		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.fetchSiteOptions', $option_names );
		if ( $xml->isError() ) {
			return array(
				'error_code' => $xml->getErrorCode(),
				'error_msg'  => $xml->getErrorMessage(),
			);
		}
		$cloud_site_options = $xml->getResponse();

		return $cloud_site_options;
	}

	/**
	 * Checks if the site is currently in an identity crisis.
	 *
	 * @return array|bool Array of options that are in a crisis, or false if everything is OK.
	 */
	public static function check_identity_crisis() {
		if ( ! self::is_connection_ready() || ( new Status() )->is_offline_mode() || ! Identity_Crisis::validate_sync_error_idc_option() ) {
			return false;
		}

		return Jetpack_Options::get_option( 'sync_error_idc' );
	}

	/**
	 * Checks whether the home and siteurl specifically are allowed.
	 * Written so that we don't have re-check $key and $value params every time
	 * we want to check if this site is allowed, for example in footer.php
	 *
	 * @since  3.8.0
	 * @return bool True = already allowed False = not on the allowed list.
	 */
	public static function is_staging_site() {
		_deprecated_function( 'Jetpack::is_staging_site', 'jetpack-8.1', '/Automattic/Jetpack/Status->is_staging_site' );
		return ( new Status() )->is_staging_site();
	}

	/**
	 * Checks whether the sync_error_idc option is valid or not, and if not, will do cleanup.
	 *
	 * @since 4.4.0
	 * @since 5.4.0 Do not call get_sync_error_idc_option() unless site is in IDC
	 *
	 * @return bool
	 */
	public static function validate_sync_error_idc_option() {
		_deprecated_function( __METHOD__, 'jetpack-9.8', '\\Automattic\\Jetpack\\Identity_Crisis::validate_sync_error_idc_option' );
		return Identity_Crisis::validate_sync_error_idc_option();
	}

	/**
	 * Normalizes a url by doing three things:
	 *  - Strips protocol
	 *  - Strips www
	 *  - Adds a trailing slash
	 *
	 * @since 4.4.0
	 * @param string $url
	 * @return WP_Error|string
	 */
	public static function normalize_url_protocol_agnostic( $url ) {
		$parsed_url = wp_parse_url( trailingslashit( esc_url_raw( $url ) ) );
		if ( ! $parsed_url || empty( $parsed_url['host'] ) || empty( $parsed_url['path'] ) ) {
			return new WP_Error( 'cannot_parse_url', sprintf( esc_html__( 'Cannot parse URL %s', 'jetpack' ), $url ) );
		}

		// Strip www and protocols
		$url = preg_replace( '/^www\./i', '', $parsed_url['host'] . $parsed_url['path'] );
		return $url;
	}

	/**
	 * Gets the value that is to be saved in the jetpack_sync_error_idc option.
	 *
	 * @since 4.4.0
	 * @since 5.4.0 Add transient since home/siteurl retrieved directly from DB
	 *
	 * @param array $response
	 * @return array Array of the local urls, wpcom urls, and error code
	 */
	public static function get_sync_error_idc_option( $response = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-9.8', '\\Automattic\\Jetpack\\Identity_Crisis::get_sync_error_idc_option' );
		return Identity_Crisis::get_sync_error_idc_option( $response );
	}

	/**
	 * Returns the value of the jetpack_sync_idc_optin filter, or constant.
	 * If set to true, the site will be put into staging mode.
	 *
	 * @since 4.3.2
	 * @return bool
	 */
	public static function sync_idc_optin() {
		_deprecated_function( __METHOD__, 'jetpack-9.8', '\\Automattic\\Jetpack\\Identity_Crisis::sync_idc_optin' );
		return Identity_Crisis::sync_idc_optin();
	}

	/**
	 * Maybe Use a .min.css stylesheet, maybe not.
	 *
	 * Hooks onto `plugins_url` filter at priority 1, and accepts all 3 args.
	 */
	public static function maybe_min_asset( $url, $path, $plugin ) {
		// Short out on things trying to find actual paths.
		if ( ! $path || empty( $plugin ) ) {
			return $url;
		}

		$path = ltrim( $path, '/' );

		// Strip out the abspath.
		$base = dirname( plugin_basename( $plugin ) );

		// Short out on non-Jetpack assets.
		if ( 'jetpack/' !== substr( $base, 0, 8 ) ) {
			return $url;
		}

		// File name parsing.
		$file              = "{$base}/{$path}";
		$full_path         = JETPACK__PLUGIN_DIR . substr( $file, 8 );
		$file_name         = substr( $full_path, strrpos( $full_path, '/' ) + 1 );
		$file_name_parts_r = array_reverse( explode( '.', $file_name ) );
		$extension         = array_shift( $file_name_parts_r );

		if ( in_array( strtolower( $extension ), array( 'css', 'js' ) ) ) {
			// Already pointing at the minified version.
			if ( 'min' === $file_name_parts_r[0] ) {
				return $url;
			}

			$min_full_path = preg_replace( "#\.{$extension}$#", ".min.{$extension}", $full_path );
			if ( file_exists( $min_full_path ) ) {
				$url = preg_replace( "#\.{$extension}$#", ".min.{$extension}", $url );
				// If it's a CSS file, stash it so we can set the .min suffix for rtl-ing.
				if ( 'css' === $extension ) {
					$key                      = str_replace( JETPACK__PLUGIN_DIR, 'jetpack/', $min_full_path );
					self::$min_assets[ $key ] = $path;
				}
			}
		}

		return $url;
	}

	/**
	 * If the asset is minified, let's flag .min as the suffix.
	 *
	 * Attached to `style_loader_src` filter.
	 *
	 * @param string $tag The tag that would link to the external asset.
	 * @param string $handle The registered handle of the script in question.
	 * @param string $href The url of the asset in question.
	 */
	public static function set_suffix_on_min( $src, $handle ) {
		if ( false === strpos( $src, '.min.css' ) ) {
			return $src;
		}

		if ( ! empty( self::$min_assets ) ) {
			foreach ( self::$min_assets as $file => $path ) {
				if ( false !== strpos( $src, $file ) ) {
					wp_style_add_data( $handle, 'suffix', '.min' );
					return $src;
				}
			}
		}

		return $src;
	}

	/**
	 * Maybe inlines a stylesheet.
	 *
	 * If you'd like to inline a stylesheet instead of printing a link to it,
	 * wp_style_add_data( 'handle', 'jetpack-inline', true );
	 *
	 * Attached to `style_loader_tag` filter.
	 *
	 * @param string $tag The tag that would link to the external asset.
	 * @param string $handle The registered handle of the script in question.
	 *
	 * @return string
	 */
	public static function maybe_inline_style( $tag, $handle ) {
		global $wp_styles;
		$item = $wp_styles->registered[ $handle ];

		if ( ! isset( $item->extra['jetpack-inline'] ) || ! $item->extra['jetpack-inline'] ) {
			return $tag;
		}

		if ( preg_match( '# href=\'([^\']+)\' #i', $tag, $matches ) ) {
			$href = $matches[1];
			// Strip off query string
			if ( $pos = strpos( $href, '?' ) ) {
				$href = substr( $href, 0, $pos );
			}
			// Strip off fragment
			if ( $pos = strpos( $href, '#' ) ) {
				$href = substr( $href, 0, $pos );
			}
		} else {
			return $tag;
		}

		$plugins_dir = plugin_dir_url( JETPACK__PLUGIN_FILE );
		if ( $plugins_dir !== substr( $href, 0, strlen( $plugins_dir ) ) ) {
			return $tag;
		}

		// If this stylesheet has a RTL version, and the RTL version replaces normal...
		if ( isset( $item->extra['rtl'] ) && 'replace' === $item->extra['rtl'] && is_rtl() ) {
			// And this isn't the pass that actually deals with the RTL version...
			if ( false === strpos( $tag, " id='$handle-rtl-css' " ) ) {
				// Short out, as the RTL version will deal with it in a moment.
				return $tag;
			}
		}

		$file = JETPACK__PLUGIN_DIR . substr( $href, strlen( $plugins_dir ) );
		$css  = self::absolutize_css_urls( file_get_contents( $file ), $href );
		if ( $css ) {
			$tag = "<!-- Inline {$item->handle} -->\r\n";
			if ( empty( $item->extra['after'] ) ) {
				wp_add_inline_style( $handle, $css );
			} else {
				array_unshift( $item->extra['after'], $css );
				wp_style_add_data( $handle, 'after', $item->extra['after'] );
			}
		}

		return $tag;
	}

	/**
	 * Loads a view file from the views
	 *
	 * Data passed in with the $data parameter will be available in the
	 * template file as $data['value']
	 *
	 * @param string $template - Template file to load
	 * @param array  $data - Any data to pass along to the template
	 * @return boolean - If template file was found
	 **/
	public function load_view( $template, $data = array() ) {
		$views_dir = JETPACK__PLUGIN_DIR . 'views/';

		if ( file_exists( $views_dir . $template ) ) {
			require_once $views_dir . $template;
			return true;
		}

		error_log( "Jetpack: Unable to find view file $views_dir$template" );
		return false;
	}

	/**
	 * Throws warnings for deprecated hooks to be removed from Jetpack that cannot remain in the original place in the code.
	 */
	public function deprecated_hooks() {
		$filter_deprecated_list = array(
			'jetpack_bail_on_shortcode'                    => array(
				'replacement' => 'jetpack_shortcodes_to_include',
				'version'     => 'jetpack-3.1.0',
			),
			'wpl_sharing_2014_1'                           => array(
				'replacement' => null,
				'version'     => 'jetpack-3.6.0',
			),
			'jetpack-tools-to-include'                     => array(
				'replacement' => 'jetpack_tools_to_include',
				'version'     => 'jetpack-3.9.0',
			),
			'jetpack_identity_crisis_options_to_check'     => array(
				'replacement' => null,
				'version'     => 'jetpack-4.0.0',
			),
			'update_option_jetpack_single_user_site'       => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'audio_player_default_colors'                  => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_featured_images_enabled'   => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_update_details'            => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_updates'                   => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_network_name'              => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_network_allow_new_registrations' => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_network_add_new_users'     => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_network_site_upload_space' => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_network_upload_file_types' => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_network_enable_administration_menus' => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_is_multi_site'             => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_is_main_network'           => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'add_option_jetpack_main_network_site'         => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'jetpack_sync_all_registered_options'          => array(
				'replacement' => null,
				'version'     => 'jetpack-4.3.0',
			),
			'jetpack_has_identity_crisis'                  => array(
				'replacement' => 'jetpack_sync_error_idc_validation',
				'version'     => 'jetpack-4.4.0',
			),
			'jetpack_is_post_mailable'                     => array(
				'replacement' => null,
				'version'     => 'jetpack-4.4.0',
			),
			'jetpack_seo_site_host'                        => array(
				'replacement' => null,
				'version'     => 'jetpack-5.1.0',
			),
			'jetpack_installed_plugin'                     => array(
				'replacement' => 'jetpack_plugin_installed',
				'version'     => 'jetpack-6.0.0',
			),
			'jetpack_holiday_snow_option_name'             => array(
				'replacement' => null,
				'version'     => 'jetpack-6.0.0',
			),
			'jetpack_holiday_chance_of_snow'               => array(
				'replacement' => null,
				'version'     => 'jetpack-6.0.0',
			),
			'jetpack_holiday_snow_js_url'                  => array(
				'replacement' => null,
				'version'     => 'jetpack-6.0.0',
			),
			'jetpack_is_holiday_snow_season'               => array(
				'replacement' => null,
				'version'     => 'jetpack-6.0.0',
			),
			'jetpack_holiday_snow_option_updated'          => array(
				'replacement' => null,
				'version'     => 'jetpack-6.0.0',
			),
			'jetpack_holiday_snowing'                      => array(
				'replacement' => null,
				'version'     => 'jetpack-6.0.0',
			),
			'jetpack_sso_auth_cookie_expirtation'          => array(
				'replacement' => 'jetpack_sso_auth_cookie_expiration',
				'version'     => 'jetpack-6.1.0',
			),
			'jetpack_cache_plans'                          => array(
				'replacement' => null,
				'version'     => 'jetpack-6.1.0',
			),

			'jetpack_lazy_images_skip_image_with_atttributes' => array(
				'replacement' => 'jetpack_lazy_images_skip_image_with_attributes',
				'version'     => 'jetpack-6.5.0',
			),
			'jetpack_enable_site_verification'             => array(
				'replacement' => null,
				'version'     => 'jetpack-6.5.0',
			),
			'can_display_jetpack_manage_notice'            => array(
				'replacement' => null,
				'version'     => 'jetpack-7.3.0',
			),
			'atd_http_post_timeout'                        => array(
				'replacement' => null,
				'version'     => 'jetpack-7.3.0',
			),
			'atd_service_domain'                           => array(
				'replacement' => null,
				'version'     => 'jetpack-7.3.0',
			),
			'atd_load_scripts'                             => array(
				'replacement' => null,
				'version'     => 'jetpack-7.3.0',
			),
			'jetpack_widget_authors_exclude'               => array(
				'replacement' => 'jetpack_widget_authors_params',
				'version'     => 'jetpack-7.7.0',
			),
			// Removed in Jetpack 7.9.0
			'jetpack_pwa_manifest'                         => array(
				'replacement' => null,
				'version'     => 'jetpack-7.9.0',
			),
			'jetpack_pwa_background_color'                 => array(
				'replacement' => null,
				'version'     => 'jetpack-7.9.0',
			),
			'jetpack_check_mobile'                         => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'jetpack_mobile_stylesheet'                    => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'jetpack_mobile_template'                      => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'jetpack_mobile_theme_menu'                    => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'minileven_show_featured_images'               => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'minileven_attachment_size'                    => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'instagram_cache_oembed_api_response_body'     => array(
				'replacement' => null,
				'version'     => 'jetpack-9.1.0',
			),
			'jetpack_can_make_outbound_https'              => array(
				'replacement' => null,
				'version'     => 'jetpack-9.1.0',
			),
		);

		foreach ( $filter_deprecated_list as $tag => $args ) {
			if ( has_filter( $tag ) ) {
				apply_filters_deprecated( $tag, array( null ), $args['version'], $args['replacement'] );
			}
		}

		$action_deprecated_list = array(
			'jetpack_updated_theme'        => array(
				'replacement' => 'jetpack_updated_themes',
				'version'     => 'jetpack-6.2.0',
			),
			'atd_http_post_error'          => array(
				'replacement' => null,
				'version'     => 'jetpack-7.3.0',
			),
			'mobile_reject_mobile'         => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'mobile_force_mobile'          => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'mobile_app_promo_download'    => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'mobile_setup'                 => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'jetpack_mobile_footer_before' => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'wp_mobile_theme_footer'       => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'minileven_credits'            => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'jetpack_mobile_header_before' => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
			'jetpack_mobile_header_after'  => array(
				'replacement' => null,
				'version'     => 'jetpack-8.3.0',
			),
		);

		foreach ( $action_deprecated_list as $tag => $args ) {
			if ( has_action( $tag ) ) {
				do_action_deprecated( $tag, array(), $args['version'], $args['replacement'] );
			}
		}
	}

	/**
	 * Converts any url in a stylesheet, to the correct absolute url.
	 *
	 * Considerations:
	 *  - Normal, relative URLs     `feh.png`
	 *  - Data URLs                 `data:image/gif;base64,eh129ehiuehjdhsa==`
	 *  - Schema-agnostic URLs      `//domain.com/feh.png`
	 *  - Absolute URLs             `http://domain.com/feh.png`
	 *  - Domain root relative URLs `/feh.png`
	 *
	 * @param $css string: The raw CSS -- should be read in directly from the file.
	 * @param $css_file_url : The URL that the file can be accessed at, for calculating paths from.
	 *
	 * @return mixed|string
	 */
	public static function absolutize_css_urls( $css, $css_file_url ) {
		$pattern = '#url\((?P<path>[^)]*)\)#i';
		$css_dir = dirname( $css_file_url );
		$p       = wp_parse_url( $css_dir );
		$domain  = sprintf(
			'%1$s//%2$s%3$s%4$s',
			isset( $p['scheme'] ) ? "{$p['scheme']}:" : '',
			isset( $p['user'], $p['pass'] ) ? "{$p['user']}:{$p['pass']}@" : '',
			$p['host'],
			isset( $p['port'] ) ? ":{$p['port']}" : ''
		);

		if ( preg_match_all( $pattern, $css, $matches, PREG_SET_ORDER ) ) {
			$find = $replace = array();
			foreach ( $matches as $match ) {
				$url = trim( $match['path'], "'\" \t" );

				// If this is a data url, we don't want to mess with it.
				if ( 'data:' === substr( $url, 0, 5 ) ) {
					continue;
				}

				// If this is an absolute or protocol-agnostic url,
				// we don't want to mess with it.
				if ( preg_match( '#^(https?:)?//#i', $url ) ) {
					continue;
				}

				switch ( substr( $url, 0, 1 ) ) {
					case '/':
						$absolute = $domain . $url;
						break;
					default:
						$absolute = $css_dir . '/' . $url;
				}

				$find[]    = $match[0];
				$replace[] = sprintf( 'url("%s")', $absolute );
			}
			$css = str_replace( $find, $replace, $css );
		}

		return $css;
	}

	/**
	 * This methods removes all of the registered css files on the front end
	 * from Jetpack in favor of using a single file. In effect "imploding"
	 * all the files into one file.
	 *
	 * Pros:
	 * - Uses only ONE css asset connection instead of 15
	 * - Saves a minimum of 56k
	 * - Reduces server load
	 * - Reduces time to first painted byte
	 *
	 * Cons:
	 * - Loads css for ALL modules. However all selectors are prefixed so it
	 *      should not cause any issues with themes.
	 * - Plugins/themes dequeuing styles no longer do anything. See
	 *      jetpack_implode_frontend_css filter for a workaround
	 *
	 * For some situations developers may wish to disable css imploding and
	 * instead operate in legacy mode where each file loads seperately and
	 * can be edited individually or dequeued. This can be accomplished with
	 * the following line:
	 *
	 * add_filter( 'jetpack_implode_frontend_css', '__return_false' );
	 *
	 * @since 3.2
	 **/
	public function implode_frontend_css( $travis_test = false ) {
		$do_implode = true;
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$do_implode = false;
		}

		// Do not implode CSS when the page loads via the AMP plugin.
		if ( Jetpack_AMP_Support::is_amp_request() ) {
			$do_implode = false;
		}

		/**
		 * Allow CSS to be concatenated into a single jetpack.css file.
		 *
		 * @since 3.2.0
		 *
		 * @param bool $do_implode Should CSS be concatenated? Default to true.
		 */
		$do_implode = apply_filters( 'jetpack_implode_frontend_css', $do_implode );

		// Do not use the imploded file when default behavior was altered through the filter
		if ( ! $do_implode ) {
			return;
		}

		// We do not want to use the imploded file in dev mode, or if not connected
		if ( ( new Status() )->is_offline_mode() || ! self::is_connection_ready() ) {
			if ( ! $travis_test ) {
				return;
			}
		}

		// Do not use the imploded file if sharing css was dequeued via the sharing settings screen
		if ( get_option( 'sharedaddy_disable_resources' ) ) {
			return;
		}

		/*
		 * Now we assume Jetpack is connected and able to serve the single
		 * file.
		 *
		 * In the future there will be a check here to serve the file locally
		 * or potentially from the Jetpack CDN
		 *
		 * For now:
		 * - Enqueue a single imploded css file
		 * - Zero out the style_loader_tag for the bundled ones
		 * - Be happy, drink scotch
		 */

		add_filter( 'style_loader_tag', array( $this, 'concat_remove_style_loader_tag' ), 10, 2 );

		$version = self::is_development_version() ? filemtime( JETPACK__PLUGIN_DIR . 'css/jetpack.css' ) : JETPACK__VERSION;

		wp_enqueue_style( 'jetpack_css', plugins_url( 'css/jetpack.css', __FILE__ ), array(), $version );
		wp_style_add_data( 'jetpack_css', 'rtl', 'replace' );
	}

	function concat_remove_style_loader_tag( $tag, $handle ) {
		if ( in_array( $handle, $this->concatenated_style_handles ) ) {
			$tag = '';
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				$tag = '<!-- `' . esc_html( $handle ) . "` is included in the concatenated jetpack.css -->\r\n";
			}
		}

		return $tag;
	}

	/**
	 * @deprecated
	 * @see Automattic\Jetpack\Assets\add_aync_script
	 */
	public function script_add_async( $tag, $handle, $src ) {
		_deprecated_function( __METHOD__, 'jetpack-8.6.0' );
	}

	/*
	 * Check the heartbeat data
	 *
	 * Organizes the heartbeat data by severity.  For example, if the site
	 * is in an ID crisis, it will be in the $filtered_data['bad'] array.
	 *
	 * Data will be added to "caution" array, if it either:
	 *  - Out of date Jetpack version
	 *  - Out of date WP version
	 *  - Out of date PHP version
	 *
	 * $return array $filtered_data
	 */
	public static function jetpack_check_heartbeat_data() {
		$raw_data = Jetpack_Heartbeat::generate_stats_array();

		$good    = array();
		$caution = array();
		$bad     = array();

		foreach ( $raw_data as $stat => $value ) {

			// Check jetpack version
			if ( 'version' == $stat ) {
				if ( version_compare( $value, JETPACK__VERSION, '<' ) ) {
					$caution[ $stat ] = $value . ' - min supported is ' . JETPACK__VERSION;
					continue;
				}
			}

			// Check WP version
			if ( 'wp-version' == $stat ) {
				if ( version_compare( $value, JETPACK__MINIMUM_WP_VERSION, '<' ) ) {
					$caution[ $stat ] = $value . ' - min supported is ' . JETPACK__MINIMUM_WP_VERSION;
					continue;
				}
			}

			// Check PHP version
			if ( 'php-version' == $stat ) {
				if ( version_compare( PHP_VERSION, JETPACK__MINIMUM_PHP_VERSION, '<' ) ) {
					$caution[ $stat ] = $value . ' - min supported is ' . JETPACK__MINIMUM_PHP_VERSION;
					continue;
				}
			}

			// Check ID crisis
			if ( 'identitycrisis' == $stat ) {
				if ( 'yes' == $value ) {
					$bad[ $stat ] = $value;
					continue;
				}
			}

			// The rest are good :)
			$good[ $stat ] = $value;
		}

		$filtered_data = array(
			'good'    => $good,
			'caution' => $caution,
			'bad'     => $bad,
		);

		return $filtered_data;
	}

	/*
	 * This method is used to organize all options that can be reset
	 * without disconnecting Jetpack.
	 *
	 * It is used in class.jetpack-cli.php to reset options
	 *
	 * @since 5.4.0 Logic moved to Jetpack_Options class. Method left in Jetpack class for backwards compat.
	 *
	 * @return array of options to delete.
	 */
	public static function get_jetpack_options_for_reset() {
		return Jetpack_Options::get_options_for_reset();
	}

	/*
	 * Strip http:// or https:// from a url, replaces forward slash with ::,
	 * so we can bring them directly to their site in calypso.
	 *
	 * @deprecated 9.2.0 Use Automattic\Jetpack\Status::get_site_suffix
	 *
	 * @param string | url
	 * @return string | url without the guff
	 */
	public static function build_raw_urls( $url ) {
		_deprecated_function( __METHOD__, 'jetpack-9.2.0', 'Automattic\Jetpack\Status::get_site_suffix' );

		return ( new Status() )->get_site_suffix( $url );
	}

	/**
	 * Stores and prints out domains to prefetch for page speed optimization.
	 *
	 * @deprecated 8.8.0 Use Jetpack::add_resource_hints.
	 *
	 * @param string|array $urls URLs to hint.
	 */
	public static function dns_prefetch( $urls = null ) {
		_deprecated_function( __FUNCTION__, 'jetpack-8.8.0', 'Automattic\Jetpack\Assets::add_resource_hint' );
		if ( $urls ) {
			Assets::add_resource_hint( $urls );
		}
	}

	public function wp_dashboard_setup() {
		if ( self::is_connection_ready() ) {
			add_action( 'jetpack_dashboard_widget', array( __CLASS__, 'dashboard_widget_footer' ), 999 );
		}

		if ( has_action( 'jetpack_dashboard_widget' ) ) {
			$jetpack_logo = new Jetpack_Logo();
			$widget_title = sprintf(
				/* translators: Placeholder is a Jetpack logo. */
				__( 'Stats by %s', 'jetpack' ),
				$jetpack_logo->get_jp_emblem( true )
			);

			// Wrap title in span so Logo can be properly styled.
			$widget_title = sprintf(
				'<span>%s</span>',
				$widget_title
			);

			wp_add_dashboard_widget(
				'jetpack_summary_widget',
				$widget_title,
				array( __CLASS__, 'dashboard_widget' )
			);
			wp_enqueue_style( 'jetpack-dashboard-widget', plugins_url( 'css/dashboard-widget.css', JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
			wp_style_add_data( 'jetpack-dashboard-widget', 'rtl', 'replace' );

			// If we're inactive and not in offline mode, sort our box to the top.
			if ( ! self::is_connection_ready() && ! ( new Status() )->is_offline_mode() ) {
				global $wp_meta_boxes;

				$dashboard = $wp_meta_boxes['dashboard']['normal']['core'];
				$ours      = array( 'jetpack_summary_widget' => $dashboard['jetpack_summary_widget'] );

				$wp_meta_boxes['dashboard']['normal']['core'] = array_merge( $ours, $dashboard );
			}
		}
	}

	/**
	 * @param mixed $result Value for the user's option
	 * @return mixed
	 */
	function get_user_option_meta_box_order_dashboard( $sorted ) {
		if ( ! is_array( $sorted ) ) {
			return $sorted;
		}

		foreach ( $sorted as $box_context => $ids ) {
			if ( false === strpos( $ids, 'dashboard_stats' ) ) {
				// If the old id isn't anywhere in the ids, don't bother exploding and fail out.
				continue;
			}

			$ids_array = explode( ',', $ids );
			$key       = array_search( 'dashboard_stats', $ids_array );

			if ( false !== $key ) {
				// If we've found that exact value in the option (and not `google_dashboard_stats` for example)
				$ids_array[ $key ]      = 'jetpack_summary_widget';
				$sorted[ $box_context ] = implode( ',', $ids_array );
				// We've found it, stop searching, and just return.
				break;
			}
		}

		return $sorted;
	}

	public static function dashboard_widget() {
		/**
		 * Fires when the dashboard is loaded.
		 *
		 * @since 3.4.0
		 */
		do_action( 'jetpack_dashboard_widget' );
	}

	public static function dashboard_widget_footer() {
		?>
		<footer>

		<div class="protect">
			<h3><?php esc_html_e( 'Brute force attack protection', 'jetpack' ); ?></h3>
			<?php if ( self::is_module_active( 'protect' ) ) : ?>
				<p class="blocked-count">
					<?php echo number_format_i18n( get_site_option( 'jetpack_protect_blocked_attempts', 0 ) ); ?>
				</p>
				<p><?php echo esc_html_x( 'Blocked malicious login attempts', '{#} Blocked malicious login attempts -- number is on a prior line, text is a caption.', 'jetpack' ); ?></p>
			<?php elseif ( current_user_can( 'jetpack_activate_modules' ) && ! ( new Status() )->is_offline_mode() ) : ?>
				<a href="
				<?php
				echo esc_url(
					wp_nonce_url(
						self::admin_url(
							array(
								'action' => 'activate',
								'module' => 'protect',
							)
						),
						'jetpack_activate-protect'
					)
				);
				?>
							" class="button button-jetpack" title="<?php esc_attr_e( 'Protect helps to keep you secure from brute-force login attacks.', 'jetpack' ); ?>">
					<?php esc_html_e( 'Activate brute force attack protection', 'jetpack' ); ?>
				</a>
			<?php else : ?>
				<?php esc_html_e( 'Brute force attack protection is inactive.', 'jetpack' ); ?>
			<?php endif; ?>
		</div>

		<div class="akismet">
			<h3><?php esc_html_e( 'Anti-spam', 'jetpack' ); ?></h3>
			<?php if ( is_plugin_active( 'akismet/akismet.php' ) ) : ?>
				<p class="blocked-count">
					<?php echo number_format_i18n( get_option( 'akismet_spam_count', 0 ) ); ?>
				</p>
				<p><?php echo esc_html_x( 'Blocked spam comments.', '{#} Spam comments blocked by Akismet -- number is on a prior line, text is a caption.', 'jetpack' ); ?></p>
			<?php elseif ( current_user_can( 'activate_plugins' ) && ! is_wp_error( validate_plugin( 'akismet/akismet.php' ) ) ) : ?>
				<a href="
				<?php
				echo esc_url(
					wp_nonce_url(
						add_query_arg(
							array(
								'action' => 'activate',
								'plugin' => 'akismet/akismet.php',
							),
							admin_url( 'plugins.php' )
						),
						'activate-plugin_akismet/akismet.php'
					)
				);
				?>
							" class="button button-jetpack">
					<?php esc_html_e( 'Activate Anti-spam', 'jetpack' ); ?>
				</a>
			<?php else : ?>
				<p><a href="<?php echo esc_url( 'https://akismet.com/?utm_source=jetpack&utm_medium=link&utm_campaign=Jetpack%20Dashboard%20Widget%20Footer%20Link' ); ?>"><?php esc_html_e( 'Anti-spam can help to keep your blog safe from spam!', 'jetpack' ); ?></a></p>
			<?php endif; ?>
		</div>

		</footer>
		<?php
	}

	/*
	 * Adds a "blank" column in the user admin table to display indication of user connection.
	 */
	function jetpack_icon_user_connected( $columns ) {
		$columns['user_jetpack'] = '';
		return $columns;
	}

	/*
	 * Show Jetpack icon if the user is linked.
	 */
	function jetpack_show_user_connected_icon( $val, $col, $user_id ) {
		if ( 'user_jetpack' === $col && self::connection()->is_user_connected( $user_id ) ) {
			$jetpack_logo = new Jetpack_Logo();
			$emblem_html  = sprintf(
				'<a title="%1$s" class="jp-emblem-user-admin">%2$s</a>',
				esc_attr__( 'This user is linked and ready to fly with Jetpack.', 'jetpack' ),
				$jetpack_logo->get_jp_emblem()
			);
			return $emblem_html;
		}

		return $val;
	}

	/*
	 * Style the Jetpack user column
	 */
	function jetpack_user_col_style() {
		global $current_screen;
		if ( ! empty( $current_screen->base ) && 'users' == $current_screen->base ) {
			?>
			<style>
				.fixed .column-user_jetpack {
					width: 21px;
				}
				.jp-emblem-user-admin svg {
					width: 20px;
					height: 20px;
				}
				.jp-emblem-user-admin path {
					fill: #00BE28;
				}
			</style>
			<?php
		}
	}

	/**
	 * Checks if Akismet is active and working.
	 *
	 * We dropped support for Akismet 3.0 with Jetpack 6.1.1 while introducing a check for an Akismet valid key
	 * that implied usage of methods present since more recent version.
	 * See https://github.com/Automattic/jetpack/pull/9585
	 *
	 * @since  5.1.0
	 *
	 * @return bool True = Akismet available. False = Aksimet not available.
	 */
	public static function is_akismet_active() {
		static $status = null;

		if ( ! is_null( $status ) ) {
			return $status;
		}

		// Check if a modern version of Akismet is active.
		if ( ! method_exists( 'Akismet', 'http_post' ) ) {
			$status = false;
			return $status;
		}

		// Make sure there is a key known to Akismet at all before verifying key.
		$akismet_key = Akismet::get_api_key();
		if ( ! $akismet_key ) {
			$status = false;
			return $status;
		}

		// Possible values: valid, invalid, failure via Akismet. false if no status is cached.
		$akismet_key_state = get_transient( 'jetpack_akismet_key_is_valid' );

		// Do not used the cache result in wp-admin or REST API requests if the key isn't valid, in case someone is actively renewing, etc.
		$recheck = ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) && 'valid' !== $akismet_key_state;
		// We cache the result of the Akismet key verification for ten minutes.
		if ( ! $akismet_key_state || $recheck ) {
			$akismet_key_state = Akismet::verify_key( $akismet_key );
			set_transient( 'jetpack_akismet_key_is_valid', $akismet_key_state, 10 * MINUTE_IN_SECONDS );
		}

		$status = 'valid' === $akismet_key_state;

		return $status;
	}

	/**
	 * @deprecated
	 *
	 * @see Automattic\Jetpack\Sync\Modules\Users::is_function_in_backtrace
	 */
	public static function is_function_in_backtrace() {
		_deprecated_function( __METHOD__, 'jetpack-7.6.0' );
	}

	/**
	 * Given a minified path, and a non-minified path, will return
	 * a minified or non-minified file URL based on whether SCRIPT_DEBUG is set and truthy.
	 *
	 * Both `$min_base` and `$non_min_base` are expected to be relative to the
	 * root Jetpack directory.
	 *
	 * @since 5.6.0
	 *
	 * @param string $min_path
	 * @param string $non_min_path
	 * @return string The URL to the file
	 */
	public static function get_file_url_for_environment( $min_path, $non_min_path ) {
		return Assets::get_file_url_for_environment( $min_path, $non_min_path );
	}

	/**
	 * Checks for whether Jetpack Backup is enabled.
	 * Will return true if the state of Backup is anything except "unavailable".
	 *
	 * @return bool|int|mixed
	 */
	public static function is_rewind_enabled() {
		// Rewind is a paid feature, therefore requires a user-level connection.
		if ( ! static::connection()->has_connected_owner() ) {
			return false;
		}

		$rewind_enabled = get_transient( 'jetpack_rewind_enabled' );
		if ( false === $rewind_enabled ) {
			jetpack_require_lib( 'class.core-rest-api-endpoints' );
			$rewind_data    = (array) Jetpack_Core_Json_Api_Endpoints::rewind_data();
			$rewind_enabled = ( ! is_wp_error( $rewind_data )
				&& ! empty( $rewind_data['state'] )
				&& 'active' === $rewind_data['state'] )
				? 1
				: 0;

			set_transient( 'jetpack_rewind_enabled', $rewind_enabled, 10 * MINUTE_IN_SECONDS );
		}
		return $rewind_enabled;
	}

	/**
	 * Return Calypso environment value; used for developing Jetpack and pairing
	 * it with different Calypso enrionments, such as localhost.
	 *
	 * @since 7.4.0
	 *
	 * @return string Calypso environment
	 */
	public static function get_calypso_env() {
		if ( isset( $_GET['calypso_env'] ) ) {
			return sanitize_key( $_GET['calypso_env'] );
		}

		if ( getenv( 'CALYPSO_ENV' ) ) {
			return sanitize_key( getenv( 'CALYPSO_ENV' ) );
		}

		if ( defined( 'CALYPSO_ENV' ) && CALYPSO_ENV ) {
			return sanitize_key( CALYPSO_ENV );
		}

		return '';
	}

	/**
	 * Returns the hostname with protocol for Calypso.
	 * Used for developing Jetpack with Calypso.
	 *
	 * @since 8.4.0
	 *
	 * @return string Calypso host.
	 */
	public static function get_calypso_host() {
		$calypso_env = self::get_calypso_env();
		switch ( $calypso_env ) {
			case 'development':
				return 'http://calypso.localhost:3000/';
			case 'wpcalypso':
				return 'https://wpcalypso.wordpress.com/';
			case 'horizon':
				return 'https://horizon.wordpress.com/';
			default:
				return 'https://wordpress.com/';
		}
	}

	/**
	 * Handles activating default modules as well general cleanup for the new connection.
	 *
	 * @param boolean $activate_sso                 Whether to activate the SSO module when activating default modules.
	 * @param boolean $redirect_on_activation_error Whether to redirect on activation error.
	 * @param boolean $send_state_messages          Whether to send state messages.
	 * @return void
	 */
	public static function handle_post_authorization_actions(
		$activate_sso = false,
		$redirect_on_activation_error = false,
		$send_state_messages = true
	) {
		$other_modules = $activate_sso
			? array( 'sso' )
			: array();

		if ( Jetpack_Options::get_option( 'active_modules_initialized' ) ) {
			$active_modules = Jetpack_Options::get_option( 'active_modules' );
			self::delete_active_modules();

			self::activate_default_modules( 999, 1, array_merge( $active_modules, $other_modules ), $redirect_on_activation_error, $send_state_messages );
		} else {
			// Default modules that don't require a user were already activated on site_register.
			// This time let's activate only those that require a user, this assures we don't reactivate manually deactivated modules while the site was connected only at a site level.
			self::activate_default_modules( false, false, $other_modules, $redirect_on_activation_error, $send_state_messages, null, true );
			Jetpack_Options::update_option( 'active_modules_initialized', true );
		}

		// Since this is a fresh connection, be sure to clear out IDC options
		Identity_Crisis::clear_all_idc_options();

		if ( $send_state_messages ) {
			self::state( 'message', 'authorized' );
		}
	}

	/**
	 * Returns a boolean for whether backups UI should be displayed or not.
	 *
	 * @return bool Should backups UI be displayed?
	 */
	public static function show_backups_ui() {
		/**
		 * Whether UI for backups should be displayed.
		 *
		 * @since 6.5.0
		 *
		 * @param bool $show_backups Should UI for backups be displayed? True by default.
		 */
		return self::is_plugin_active( 'vaultpress/vaultpress.php' ) || apply_filters( 'jetpack_show_backups', true );
	}

	/*
	 * Deprecated manage functions
	 */
	function prepare_manage_jetpack_notice() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	function manage_activate_screen() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	function admin_jetpack_manage_notice() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	function opt_out_jetpack_manage_url() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	function opt_in_jetpack_manage_url() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	function opt_in_jetpack_manage_notice() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	function can_display_jetpack_manage_notice() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}

	/**
	 * Clean leftoveruser meta.
	 *
	 * Delete Jetpack-related user meta when it is no longer needed.
	 *
	 * @since 7.3.0
	 *
	 * @param int $user_id User ID being updated.
	 */
	public static function user_meta_cleanup( $user_id ) {
		$meta_keys = array(
			// AtD removed from Jetpack 7.3
			'AtD_options',
			'AtD_check_when',
			'AtD_guess_lang',
			'AtD_ignored_phrases',
		);

		foreach ( $meta_keys as $meta_key ) {
			if ( get_user_meta( $user_id, $meta_key ) ) {
				delete_user_meta( $user_id, $meta_key );
			}
		}
	}

	/**
	 * Checks if a Jetpack site is both active and not in offline mode.
	 *
	 * This is a DRY function to avoid repeating `Jetpack::is_active && ! Automattic\Jetpack\Status->is_offline_mode`.
	 *
	 * @deprecated 8.8.0
	 *
	 * @return bool True if Jetpack is active and not in offline mode.
	 */
	public static function is_active_and_not_development_mode() {
		_deprecated_function( __FUNCTION__, 'jetpack-8.8.0', 'Jetpack::is_active_and_not_offline_mode' );
		if ( ! self::is_active() || ( new Status() )->is_offline_mode() ) {
			return false;
		}
		return true;
	}

	/**
	 * Checks if a Jetpack site is both active and not in offline mode.
	 *
	 * This is a DRY function to avoid repeating `Jetpack::is_connection_ready && ! Automattic\Jetpack\Status->is_offline_mode`.
	 *
	 * @since 8.8.0
	 *
	 * @return bool True if Jetpack is active and not in offline mode.
	 */
	public static function is_active_and_not_offline_mode() {
		if ( ! self::is_connection_ready() || ( new Status() )->is_offline_mode() ) {
			return false;
		}
		return true;
	}

	/**
	 * Returns the list of products that we have available for purchase.
	 */
	public static function get_products_for_purchase() {
		$products = array();
		if ( ! is_multisite() ) {
			$products[] = array(
				'key'               => 'backup',
				'title'             => __( 'Jetpack Backup', 'jetpack' ),
				'short_description' => __( 'Always-on backups ensure you never lose your site.', 'jetpack' ),
				'learn_more'        => __( 'Which backup option is best for me?', 'jetpack' ),
				'description'       => __( 'Always-on backups ensure you never lose your site. Your changes are saved as you edit and you have unlimited backup archives.', 'jetpack' ),
				'options_label'     => __( 'Select a backup option:', 'jetpack' ),
				'options'           => array(
					array(
						'type'        => 'daily',
						'slug'        => 'jetpack-backup-daily',
						'key'         => 'jetpack_backup_daily',
						'name'        => __( 'Daily Backups', 'jetpack' ),
						'description' => __( 'Your data is being securely backed up daily.', 'jetpack' ),
					),
					array(
						'type'        => 'realtime',
						'slug'        => 'jetpack-backup-realtime',
						'key'         => 'jetpack_backup_realtime',
						'name'        => __( 'Real-Time Backups', 'jetpack' ),
						'description' => __( 'Your data is being securely backed up as you edit.', 'jetpack' ),
					),
				),
				'default_option'    => 'realtime',
				'show_promotion'    => true,
				'discount_percent'  => 70,
				'included_in_plans' => array( 'personal-plan', 'premium-plan', 'business-plan', 'daily-backup-plan', 'realtime-backup-plan' ),
			);

			$products[] = array(
				'key'               => 'scan',
				'title'             => __( 'Jetpack Scan', 'jetpack' ),
				'short_description' => __( 'Automatic scanning and one-click fixes keep your site one step ahead of security threats.', 'jetpack' ),
				'learn_more'        => __( 'Learn More', 'jetpack' ),
				'description'       => __( 'Automatic scanning and one-click fixes keep your site one step ahead of security threats.', 'jetpack' ),
				'show_promotion'    => true,
				'discount_percent'  => 30,
				'options'           => array(
					array(
						'type' => 'scan',
						'slug' => 'jetpack-scan',
						'key'  => 'jetpack_scan',
						'name' => __( 'Daily Scan', 'jetpack' ),
					),
				),
				'default_option'    => 'scan',
				'included_in_plans' => array( 'premium-plan', 'business-plan', 'scan-plan' ),
			);
		}

		$products[] = array(
			'key'               => 'search',
			'title'             => __( 'Jetpack Search', 'jetpack' ),
			'short_description' => __( 'Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.', 'jetpack' ),
			'learn_more'        => __( 'Learn More', 'jetpack' ),
			'description'       => __( 'Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.', 'jetpack' ),
			'label_popup'       => __( 'Records are all posts, pages, custom post types, and other types of content indexed by Jetpack Search.', 'jetpack' ),
			'options'           => array(
				array(
					'type' => 'search',
					'slug' => 'jetpack-search',
					'key'  => 'jetpack_search',
					'name' => __( 'Search', 'jetpack' ),
				),
			),
			'tears'             => array(),
			'default_option'    => 'search',
			'show_promotion'    => false,
			'included_in_plans' => array( 'search-plan' ),
		);

		$products[] = array(
			'key'               => 'anti-spam',
			'title'             => __( 'Jetpack Anti-Spam', 'jetpack' ),
			'short_description' => __( 'Automatically clear spam from comments and forms. Save time, get more responses, give your visitors a better experience – all without lifting a finger.', 'jetpack' ),
			'learn_more'        => __( 'Learn More', 'jetpack' ),
			'description'       => __( 'Automatically clear spam from comments and forms. Save time, get more responses, give your visitors a better experience – all without lifting a finger.', 'jetpack' ),
			'options'           => array(
				array(
					'type' => 'anti-spam',
					'slug' => 'jetpack-anti-spam',
					'key'  => 'jetpack_anti_spam',
					'name' => __( 'Anti-Spam', 'jetpack' ),
				),
			),
			'default_option'    => 'anti-spam',
			'included_in_plans' => array( 'personal-plan', 'premium-plan', 'business-plan', 'anti-spam-plan' ),
		);

		return $products;
	}

	/**
	 * Determine if the current user is allowed to make Jetpack purchases without
	 * a WordPress.com account
	 *
	 * @return boolean True if the user can make purchases, false if not
	 */
	public static function current_user_can_purchase() {

		// The site must be site-connected to Jetpack (no users connected).
		if ( ! self::connection()->is_site_connection() ) {
			return false;
		}

		// Make sure only administrators can make purchases.
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return true;
	}

}
