<?php

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

require_once( JETPACK__PLUGIN_DIR . '_inc/lib/class.media.php' );

class Jetpack {
	public $xmlrpc_server = null;

	private $xmlrpc_verification = null;
	private $rest_authentication_status = null;

	public $HTTP_RAW_POST_DATA = null; // copy of $GLOBALS['HTTP_RAW_POST_DATA']

	/**
	 * @var array The handles of styles that are concatenated into jetpack.css
	 */
	public $concatenated_style_handles = array(
		'jetpack-carousel',
		'grunion.css',
		'the-neverending-homepage',
		'jetpack_likes',
		'jetpack_related-posts',
		'sharedaddy',
		'jetpack-slideshow',
		'presentations',
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
		'wordads',
		'eu-cookie-law-style',
		'flickr-widget-style',
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
		'after-the-deadline'  => array( 'after-the-deadline/after-the-deadline.php', 'After The Deadline' ),
		'contact-form'        => array( 'grunion-contact-form/grunion-contact-form.php', 'Grunion Contact Form' ),
		'contact-form'        => array( 'mullet/mullet-contact-form.php', 'Mullet Contact Form' ),
		'custom-css'          => array( 'safecss/safecss.php', 'WordPress.com Custom CSS' ),
		'random-redirect'     => array( 'random-redirect/random-redirect.php', 'Random Redirect' ),
		'videopress'          => array( 'video/video.php', 'VideoPress' ),
		'widget-visibility'   => array( 'jetpack-widget-visibility/widget-visibility.php', 'Jetpack Widget Visibility' ),
		'widget-visibility'   => array( 'widget-visibility-without-jetpack/widget-visibility-without-jetpack.php', 'Widget Visibility Without Jetpack' ),
		'sharedaddy'          => array( 'jetpack-sharing/sharedaddy.php', 'Jetpack Sharing' ),
		'gravatar-hovercards' => array( 'jetpack-gravatar-hovercards/gravatar-hovercards.php', 'Jetpack Gravatar Hovercards' ),
		'latex'               => array( 'wp-latex/wp-latex.php', 'WP LaTeX' )
	);

	static $capability_translations = array(
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
		'comments'          => array(
			'Intense Debate'                       => 'intensedebate/intensedebate.php',
			'Disqus'                               => 'disqus-comment-system/disqus.php',
			'Livefyre'                             => 'livefyre-comments/livefyre.php',
			'Comments Evolved for WordPress'       => 'gplus-comments/comments-evolved.php',
			'Google+ Comments'                     => 'google-plus-comments/google-plus-comments.php',
			'WP-SpamShield Anti-Spam'              => 'wp-spamshield/wp-spamshield.php',
		),
		'comment-likes' => array(
			'Epoch'                                => 'epoch/plugincore.php',
		),
		'contact-form'      => array(
			'Contact Form 7'                       => 'contact-form-7/wp-contact-form-7.php',
			'Gravity Forms'                        => 'gravityforms/gravityforms.php',
			'Contact Form Plugin'                  => 'contact-form-plugin/contact_form.php',
			'Easy Contact Forms'                   => 'easy-contact-forms/easy-contact-forms.php',
			'Fast Secure Contact Form'             => 'si-contact-form/si-contact-form.php',
			'Ninja Forms'                          => 'ninja-forms/ninja-forms.php',
		),
		'minileven'         => array(
			'WPtouch'                              => 'wptouch/wptouch.php',
		),
		'latex'             => array(
			'LaTeX for WordPress'                  => 'latex/latex.php',
			'Youngwhans Simple Latex'              => 'youngwhans-simple-latex/yw-latex.php',
			'Easy WP LaTeX'                        => 'easy-wp-latex-lite/easy-wp-latex-lite.php',
			'MathJax-LaTeX'                        => 'mathjax-latex/mathjax-latex.php',
			'Enable Latex'                         => 'enable-latex/enable-latex.php',
			'WP QuickLaTeX'                        => 'wp-quicklatex/wp-quicklatex.php',
		),
		'protect'           => array(
			'Limit Login Attempts'                 => 'limit-login-attempts/limit-login-attempts.php',
			'Captcha'                              => 'captcha/captcha.php',
			'Brute Force Login Protection'         => 'brute-force-login-protection/brute-force-login-protection.php',
			'Login Security Solution'              => 'login-security-solution/login-security-solution.php',
			'WPSecureOps Brute Force Protect'      => 'wpsecureops-bruteforce-protect/wpsecureops-bruteforce-protect.php',
			'BulletProof Security'                 => 'bulletproof-security/bulletproof-security.php',
			'SiteGuard WP Plugin'                  => 'siteguard/siteguard.php',
			'Security-protection'                  => 'security-protection/security-protection.php',
			'Login Security'                       => 'login-security/login-security.php',
			'Botnet Attack Blocker'                => 'botnet-attack-blocker/botnet-attack-blocker.php',
			'Wordfence Security'                   => 'wordfence/wordfence.php',
			'All In One WP Security & Firewall'    => 'all-in-one-wp-security-and-firewall/wp-security.php',
			'iThemes Security'                     => 'better-wp-security/better-wp-security.php',
		),
		'random-redirect'   => array(
			'Random Redirect 2'                    => 'random-redirect-2/random-redirect.php',
		),
		'related-posts'     => array(
			'YARPP'                                => 'yet-another-related-posts-plugin/yarpp.php',
			'WordPress Related Posts'              => 'wordpress-23-related-posts-plugin/wp_related_posts.php',
			'nrelate Related Content'              => 'nrelate-related-content/nrelate-related.php',
			'Contextual Related Posts'             => 'contextual-related-posts/contextual-related-posts.php',
			'Related Posts for WordPress'          => 'microkids-related-posts/microkids-related-posts.php',
			'outbrain'                             => 'outbrain/outbrain.php',
			'Shareaholic'                          => 'shareaholic/shareaholic.php',
			'Sexybookmarks'                        => 'sexybookmarks/shareaholic.php',
		),
		'sharedaddy'        => array(
			'AddThis'                              => 'addthis/addthis_social_widget.php',
			'Add To Any'                           => 'add-to-any/add-to-any.php',
			'ShareThis'                            => 'share-this/sharethis.php',
			'Shareaholic'                          => 'shareaholic/shareaholic.php',
		),
		'seo-tools' => array(
			'WordPress SEO by Yoast'               => 'wordpress-seo/wp-seo.php',
			'WordPress SEO Premium by Yoast'       => 'wordpress-seo-premium/wp-seo-premium.php',
			'All in One SEO Pack'                  => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
			'All in One SEO Pack Pro'              => 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
		),
		'verification-tools' => array(
			'WordPress SEO by Yoast'               => 'wordpress-seo/wp-seo.php',
			'WordPress SEO Premium by Yoast'       => 'wordpress-seo-premium/wp-seo-premium.php',
			'All in One SEO Pack'                  => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
			'All in One SEO Pack Pro'              => 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
		),
		'widget-visibility' => array(
			'Widget Logic'                         => 'widget-logic/widget_logic.php',
			'Dynamic Widgets'                      => 'dynamic-widgets/dynamic-widgets.php',
		),
		'sitemaps' => array(
			'Google XML Sitemaps'                  => 'google-sitemap-generator/sitemap.php',
			'Better WordPress Google XML Sitemaps' => 'bwp-google-xml-sitemaps/bwp-simple-gxs.php',
			'Google XML Sitemaps for qTranslate'   => 'google-xml-sitemaps-v3-for-qtranslate/sitemap.php',
			'XML Sitemap & Google News feeds'      => 'xml-sitemap-feed/xml-sitemap.php',
			'Google Sitemap by BestWebSoft'        => 'google-sitemap-plugin/google-sitemap-plugin.php',
			'WordPress SEO by Yoast'               => 'wordpress-seo/wp-seo.php',
			'WordPress SEO Premium by Yoast'       => 'wordpress-seo-premium/wp-seo-premium.php',
			'All in One SEO Pack'                  => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
			'All in One SEO Pack Pro'              => 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php',
			'Sitemap'                              => 'sitemap/sitemap.php',
			'Simple Wp Sitemap'                    => 'simple-wp-sitemap/simple-wp-sitemap.php',
			'Simple Sitemap'                       => 'simple-sitemap/simple-sitemap.php',
			'XML Sitemaps'                         => 'xml-sitemaps/xml-sitemaps.php',
			'MSM Sitemaps'                         => 'msm-sitemap/msm-sitemap.php',
		),
		'lazy-images' => array(
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
		'autodescription/autodescription.php',                   // The SEO Framework
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
		'wp-fb-share-like-button/wp_fb_share-like_widget.php'    // WP Facebook Like Button
	);

	/**
	 * Plugins for which we turn off our Twitter Cards Tags implementation.
	 */
	private $twitter_cards_conflicting_plugins = array(
	//	'twitter/twitter.php',                       // The official one handles this on its own.
	//	                                             // https://github.com/twitter/wordpress/blob/master/src/Twitter/WordPress/Cards/Compatibility.php
		'eewee-twitter-card/index.php',              // Eewee Twitter Card
		'ig-twitter-cards/ig-twitter-cards.php',     // IG:Twitter Cards
		'jm-twitter-cards/jm-twitter-cards.php',     // JM Twitter Cards
		'kevinjohn-gallagher-pure-web-brilliants-social-graph-twitter-cards-extention/kevinjohn_gallagher___social_graph_twitter_output.php',
		                                             // Pure Web Brilliant's Social Graph Twitter Cards Extension
		'twitter-cards/twitter-cards.php',           // Twitter Cards
		'twitter-cards-meta/twitter-cards-meta.php', // Twitter Cards Meta
		'wp-twitter-cards/twitter_cards.php',        // WP Twitter Cards
	);

	/**
	 * Message to display in admin_notice
	 * @var string
	 */
	public $message = '';

	/**
	 * Error to display in admin_notice
	 * @var string
	 */
	public $error = '';

	/**
	 * Modules that need more privacy description.
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
	 * @var string Transient key used to prevent multiple simultaneous plugin upgrades
	 */
	public static $plugin_upgrade_lock_key = 'jetpack_upgrade_lock';

	/**
	 * Holds the singleton instance of this class
	 * @since 2.3.3
	 * @var Jetpack
	 */
	static $instance = false;

	/**
	 * Singleton
	 * @static
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new Jetpack;

			self::$instance->plugin_upgrade();
		}

		return self::$instance;
	}

	/**
	 * Must never be called statically
	 */
	function plugin_upgrade() {
		if ( Jetpack::is_active() ) {
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
				$unfiltered_modules = Jetpack::get_active_modules();
				$modules = array_filter( $unfiltered_modules, array( 'Jetpack', 'is_module' ) );
				if ( array_diff( $unfiltered_modules, $modules ) ) {
					Jetpack::update_active_modules( $modules );
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

		Jetpack::maybe_set_version_option();

		if ( class_exists( 'Jetpack_Widget_Conditions' ) ) {
			Jetpack_Widget_Conditions::migrate_post_type_rules();
		}

		if (
			class_exists( 'Jetpack_Sitemap_Manager' )
			&& version_compare( JETPACK__VERSION, '5.3', '>=' )
		) {
			do_action( 'jetpack_sitemaps_purge_data' );
		}

		delete_transient( self::$plugin_upgrade_lock_key );
	}

	static function activate_manage( ) {
		if ( did_action( 'init' ) || current_filter() == 'init' ) {
			self::activate_module( 'manage', false, false );
		} else if ( !  has_action( 'init' , array( __CLASS__, 'activate_manage' ) ) ) {
			add_action( 'init', array( __CLASS__, 'activate_manage' ) );
		}
	}

	static function update_active_modules( $modules ) {
		$current_modules = Jetpack_Options::get_option( 'active_modules', array() );

		$success = Jetpack_Options::update_option( 'active_modules', array_unique( $modules ) );

		if ( is_array( $modules ) && is_array( $current_modules ) ) {
			$new_active_modules = array_diff( $modules, $current_modules );
			foreach( $new_active_modules as $module ) {
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

			$new_deactive_modules = array_diff( $current_modules, $modules );
			foreach( $new_deactive_modules as $module ) {
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
		}

		return $success;
	}

	static function delete_active_modules() {
		self::update_active_modules( array() );
	}

	/**
	 * Constructor.  Initializes WordPress hooks
	 */
	private function __construct() {
		/*
		 * Check for and alert any deprecated hooks
		 */
		add_action( 'init', array( $this, 'deprecated_hooks' ) );

		/*
		 * Enable enhanced handling of previewing sites in Calypso
		 */
		if ( Jetpack::is_active() ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.jetpack-iframe-embed.php';
			add_action( 'init', array( 'Jetpack_Iframe_Embed', 'init' ), 9, 0 );
		}

		/*
		 * Load things that should only be in Network Admin.
		 *
		 * For now blow away everything else until a more full
		 * understanding of what is needed at the network level is
		 * available
		 */
		if( is_multisite() ) {
			Jetpack_Network::init();
		}

		add_action( 'set_user_role', array( $this, 'maybe_clear_other_linked_admins_transient' ), 10, 3 );

		// Unlink user before deleting the user from .com
		add_action( 'deleted_user', array( $this, 'unlink_user' ), 10, 1 );
		add_action( 'remove_user_from_blog', array( $this, 'unlink_user' ), 10, 1 );

		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST && isset( $_GET['for'] ) && 'jetpack' == $_GET['for'] ) {
			@ini_set( 'display_errors', false ); // Display errors can cause the XML to be not well formed.

			require_once JETPACK__PLUGIN_DIR . 'class.jetpack-xmlrpc-server.php';
			$this->xmlrpc_server = new Jetpack_XMLRPC_Server();

			$this->require_jetpack_authentication();

			if ( Jetpack::is_active() ) {
				// Hack to preserve $HTTP_RAW_POST_DATA
				add_filter( 'xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );

				$signed = $this->verify_xml_rpc_signature();
				if ( $signed && ! is_wp_error( $signed ) ) {
					// The actual API methods.
					add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'xmlrpc_methods' ) );
				} else {
					// The jetpack.authorize method should be available for unauthenticated users on a site with an
					// active Jetpack connection, so that additional users can link their account.
					add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'authorize_xmlrpc_methods' ) );
				}
			} else {
				// The bootstrap API methods.
				add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'bootstrap_xmlrpc_methods' ) );
			}

			// Now that no one can authenticate, and we're whitelisting all XML-RPC methods, force enable_xmlrpc on.
			add_filter( 'pre_option_enable_xmlrpc', '__return_true' );
		} elseif (
			is_admin() &&
			isset( $_POST['action'] ) && (
				'jetpack_upload_file' == $_POST['action'] ||
				'jetpack_update_file' == $_POST['action']
			)
		) {
			$this->require_jetpack_authentication();
			$this->add_remote_request_handlers();
		} else {
			if ( Jetpack::is_active() ) {
				add_action( 'login_form_jetpack_json_api_authorization', array( &$this, 'login_form_json_api_authorization' ) );
				add_filter( 'xmlrpc_methods', array( $this, 'public_xmlrpc_methods' ) );
			}
		}

		if ( Jetpack::is_active() ) {
			Jetpack_Heartbeat::init();
		}

		add_filter( 'determine_current_user', array( $this, 'wp_rest_authenticate' ) );
		add_filter( 'rest_authentication_errors', array( $this, 'wp_rest_authentication_errors' ) );

		add_action( 'jetpack_clean_nonces', array( 'Jetpack', 'clean_nonces' ) );
		if ( ! wp_next_scheduled( 'jetpack_clean_nonces' ) ) {
			wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );
		}

		add_filter( 'xmlrpc_blog_options', array( $this, 'xmlrpc_options' ) );

		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_init', array( $this, 'dismiss_jetpack_notice' ) );

		add_filter( 'admin_body_class', array( $this, 'admin_body_class' ) );

		add_action( 'wp_dashboard_setup', array( $this, 'wp_dashboard_setup' ) );
		// Filter the dashboard meta box order to swap the new one in in place of the old one.
		add_filter( 'get_user_option_meta-box-order_dashboard', array( $this, 'get_user_option_meta_box_order_dashboard' ) );

		// returns HTTPS support status
		add_action( 'wp_ajax_jetpack-recheck-ssl', array( $this, 'ajax_recheck_ssl' ) );

		// If any module option is updated before Jump Start is dismissed, hide Jump Start.
		add_action( 'update_option', array( $this, 'jumpstart_has_updated_module_option' ) );

		// JITM AJAX callback function
		add_action( 'wp_ajax_jitm_ajax',  array( $this, 'jetpack_jitm_ajax_callback' ) );

		// Universal ajax callback for all tracking events triggered via js
		add_action( 'wp_ajax_jetpack_tracks', array( $this, 'jetpack_admin_ajax_tracks_callback' ) );

		add_action( 'wp_ajax_jetpack_connection_banner', array( $this, 'jetpack_connection_banner_callback' ) );

		add_action( 'wp_loaded', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'devicepx' ) );
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'devicepx' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'devicepx' ) );

		add_action( 'plugins_loaded', array( $this, 'extra_oembed_providers' ), 100 );

		/**
		 * These actions run checks to load additional files.
		 * They check for external files or plugins, so they need to run as late as possible.
		 */
		add_action( 'wp_head', array( $this, 'check_open_graph' ),       1 );
		add_action( 'plugins_loaded', array( $this, 'check_twitter_tags' ),     999 );
		add_action( 'plugins_loaded', array( $this, 'check_rest_api_compat' ), 1000 );

		add_filter( 'plugins_url',      array( 'Jetpack', 'maybe_min_asset' ),     1, 3 );
		add_action( 'style_loader_src', array( 'Jetpack', 'set_suffix_on_min' ), 10, 2  );
		add_filter( 'style_loader_tag', array( 'Jetpack', 'maybe_inline_style' ), 10, 2 );

		add_filter( 'map_meta_cap', array( $this, 'jetpack_custom_caps' ), 1, 4 );

		add_filter( 'jetpack_get_default_modules', array( $this, 'filter_default_modules' ) );
		add_filter( 'jetpack_get_default_modules', array( $this, 'handle_deprecated_modules' ), 99 );

		// A filter to control all just in time messages
		add_filter( 'jetpack_just_in_time_msgs', '__return_true', 9 );
		add_filter( 'jetpack_just_in_time_msg_cache', '__return_true', 9);

		// If enabled, point edit post and page links to Calypso instead of WP-Admin.
		// We should make sure to only do this for front end links.
		if ( Jetpack_Options::get_option( 'edit_links_calypso_redirect' ) && ! is_admin() ) {
			add_filter( 'get_edit_post_link', array( $this, 'point_edit_links_to_calypso' ), 1, 2 );
		}

		// Update the Jetpack plan from API on heartbeats
		add_action( 'jetpack_heartbeat', array( $this, 'refresh_active_plan_from_wpcom' ) );

		/**
		 * This is the hack to concatinate all css files into one.
		 * For description and reasoning see the implode_frontend_css method
		 *
		 * Super late priority so we catch all the registered styles
		 */
		if( !is_admin() ) {
			add_action( 'wp_print_styles', array( $this, 'implode_frontend_css' ), -1 ); // Run first
			add_action( 'wp_print_footer_scripts', array( $this, 'implode_frontend_css' ), -1 ); // Run first to trigger before `print_late_styles`
		}

		/**
		 * These are sync actions that we need to keep track of for jitms
		 */
		add_filter( 'jetpack_sync_before_send_updated_option', array( $this, 'jetpack_track_last_sync_callback' ), 99 );

		// Actually push the stats on shutdown.
		if ( ! has_action( 'shutdown', array( $this, 'push_stats' ) ) ) {
			add_action( 'shutdown', array( $this, 'push_stats' ) );
		}
	}

	function point_edit_links_to_calypso( $default_url, $post_id ) {
		$post = get_post( $post_id );

		if ( empty( $post ) ) {
			return $default_url;
		}

		$post_type = $post->post_type;

		// Mapping the allowed CPTs on WordPress.com to corresponding paths in Calypso.
		// https://en.support.wordpress.com/custom-post-types/
		$allowed_post_types = array(
			'post' => 'post',
			'page' => 'page',
			'jetpack-portfolio' => 'edit/jetpack-portfolio',
			'jetpack-testimonial' => 'edit/jetpack-testimonial',
		);

		if ( ! in_array( $post_type, array_keys( $allowed_post_types ) ) ) {
			return $default_url;
		}

		$path_prefix = $allowed_post_types[ $post_type ];

		$site_slug  = Jetpack::build_raw_urls( get_home_url() );

		return esc_url( sprintf( 'https://wordpress.com/%s/%s/%d', $path_prefix, $site_slug, $post_id ) );
	}

	function jetpack_track_last_sync_callback( $params ) {
		/**
		 * Filter to turn off jitm caching
		 *
		 * @since 5.4.0
		 *
		 * @param bool false Whether to cache just in time messages
		 */
		if ( ! apply_filters( 'jetpack_just_in_time_msg_cache', false ) ) {
			return $params;
		}

		if ( is_array( $params ) && isset( $params[0] ) ) {
			$option = $params[0];
			if ( 'active_plugins' === $option ) {
				// use the cache if we can, but not terribly important if it gets evicted
				set_transient( 'jetpack_last_plugin_sync', time(), HOUR_IN_SECONDS );
			}
		}

		return $params;
	}

	function jetpack_connection_banner_callback() {
		check_ajax_referer( 'jp-connection-banner-nonce', 'nonce' );

		if ( isset( $_REQUEST['dismissBanner'] ) ) {
			Jetpack_Options::update_option( 'dismissed_connection_banner', 1 );
			wp_send_json_success();
		}

		wp_die();
	}

	function jetpack_admin_ajax_tracks_callback() {
		// Check for nonce
		if ( ! isset( $_REQUEST['tracksNonce'] ) || ! wp_verify_nonce( $_REQUEST['tracksNonce'], 'jp-tracks-ajax-nonce' ) ) {
			wp_die( 'Permissions check failed.' );
		}

		if ( ! isset( $_REQUEST['tracksEventName'] ) || ! isset( $_REQUEST['tracksEventType'] )  ) {
			wp_die( 'No valid event name or type.' );
		}

		$tracks_data = array();
		if ( 'click' === $_REQUEST['tracksEventType'] && isset( $_REQUEST['tracksEventProp'] ) ) {
			if ( is_array( $_REQUEST['tracksEventProp'] ) ) {
				$tracks_data = $_REQUEST['tracksEventProp'];
			} else {
				$tracks_data = array( 'clicked' => $_REQUEST['tracksEventProp'] );
			}
		}

		JetpackTracking::record_user_event( $_REQUEST['tracksEventName'], $tracks_data );
		wp_send_json_success();
		wp_die();
	}

	/**
	 * The callback for the JITM ajax requests.
	 */
	function jetpack_jitm_ajax_callback() {
		// Check for nonce
		if ( ! isset( $_REQUEST['jitmNonce'] ) || ! wp_verify_nonce( $_REQUEST['jitmNonce'], 'jetpack-jitm-nonce' ) ) {
			wp_die( 'Module activation failed due to lack of appropriate permissions' );
		}
		if ( isset( $_REQUEST['jitmActionToTake'] ) && 'activate' == $_REQUEST['jitmActionToTake'] ) {
			$module_slug = $_REQUEST['jitmModule'];
			Jetpack::log( 'activate', $module_slug );
			Jetpack::activate_module( $module_slug, false, false );
			Jetpack::state( 'message', 'no_message' );

			//A Jetpack module is being activated through a JITM, track it
			$this->stat( 'jitm', $module_slug.'-activated-' . JETPACK__VERSION );
			$this->do_stats( 'server_side' );

			wp_send_json_success();
		}
		if ( isset( $_REQUEST['jitmActionToTake'] ) && 'dismiss' == $_REQUEST['jitmActionToTake'] ) {
			// get the hide_jitm options array
			$jetpack_hide_jitm = Jetpack_Options::get_option( 'hide_jitm' );
			$module_slug = $_REQUEST['jitmModule'];

			if( ! $jetpack_hide_jitm ) {
				$jetpack_hide_jitm = array(
					$module_slug => 'hide'
				);
			} else {
				$jetpack_hide_jitm[$module_slug] = 'hide';
			}

			Jetpack_Options::update_option( 'hide_jitm', $jetpack_hide_jitm );

			//jitm is being dismissed forever, track it
			$this->stat( 'jitm', $module_slug.'-dismissed-' . JETPACK__VERSION );
			$this->do_stats( 'server_side' );

			wp_send_json_success();
		}
		if ( isset( $_REQUEST['jitmActionToTake'] ) && 'launch' == $_REQUEST['jitmActionToTake'] ) {
			$module_slug = $_REQUEST['jitmModule'];

			// User went to WordPress.com, track this
			$this->stat( 'jitm', $module_slug.'-wordpress-tools-' . JETPACK__VERSION );
			$this->do_stats( 'server_side' );

			wp_send_json_success();
		}
		if ( isset( $_REQUEST['jitmActionToTake'] ) && 'viewed' == $_REQUEST['jitmActionToTake'] ) {
			$track = $_REQUEST['jitmModule'];

			// User is viewing JITM, track it.
			$this->stat( 'jitm', $track . '-viewed-' . JETPACK__VERSION );
			$this->do_stats( 'server_side' );

			wp_send_json_success();
		}
	}

	/**
	 * If there are any stats that need to be pushed, but haven't been, push them now.
	 */
	function push_stats() {
		if ( ! empty( $this->stats ) ) {
			$this->do_stats( 'server_side' );
		}
	}

	function jetpack_custom_caps( $caps, $cap, $user_id, $args ) {
		switch( $cap ) {
			case 'jetpack_connect' :
			case 'jetpack_reconnect' :
				if ( Jetpack::is_development_mode() ) {
					$caps = array( 'do_not_allow' );
					break;
				}
				/**
				 * Pass through. If it's not development mode, these should match disconnect.
				 * Let users disconnect if it's development mode, just in case things glitch.
				 */
			case 'jetpack_disconnect' :
				/**
				 * In multisite, can individual site admins manage their own connection?
				 *
				 * Ideally, this should be extracted out to a separate filter in the Jetpack_Network class.
				 */
				if ( is_multisite() && ! is_super_admin() && is_plugin_active_for_network( 'jetpack/jetpack.php' ) ) {
					if ( ! Jetpack_Network::init()->get_option( 'sub-site-connection-override' ) ) {
						/**
						 * We need to update the option name -- it's terribly unclear which
						 * direction the override goes.
						 *
						 * @todo: Update the option name to `sub-sites-can-manage-own-connections`
						 */
						$caps = array( 'do_not_allow' );
						break;
					}
				}

				$caps = array( 'manage_options' );
				break;
			case 'jetpack_manage_modules' :
			case 'jetpack_activate_modules' :
			case 'jetpack_deactivate_modules' :
				$caps = array( 'manage_options' );
				break;
			case 'jetpack_configure_modules' :
				$caps = array( 'manage_options' );
				break;
			case 'jetpack_network_admin_page':
			case 'jetpack_network_settings_page':
				$caps = array( 'manage_network_plugins' );
				break;
			case 'jetpack_network_sites_page':
				$caps = array( 'manage_sites' );
				break;
			case 'jetpack_admin_page' :
				if ( Jetpack::is_development_mode() ) {
					$caps = array( 'manage_options' );
					break;
				} else {
					$caps = array( 'read' );
				}
				break;
			case 'jetpack_connect_user' :
				if ( Jetpack::is_development_mode() ) {
					$caps = array( 'do_not_allow' );
					break;
				}
				$caps = array( 'read' );
				break;
		}
		return $caps;
	}

	function require_jetpack_authentication() {
		// Don't let anyone authenticate
		$_COOKIE = array();
		remove_all_filters( 'authenticate' );
		remove_all_actions( 'wp_login_failed' );

		if ( Jetpack::is_active() ) {
			// Allow Jetpack authentication
			add_filter( 'authenticate', array( $this, 'authenticate_jetpack' ), 10, 3 );
		}
	}

	/**
	 * Load language files
	 * @action plugins_loaded
	 */
	public static function plugin_textdomain() {
		// Note to self, the third argument must not be hardcoded, to account for relocated folders.
		load_plugin_textdomain( 'jetpack', false, dirname( plugin_basename( JETPACK__PLUGIN_FILE ) ) . '/languages/' );
	}

	/**
	 * Register assets for use in various modules and the Jetpack admin page.
	 *
	 * @uses wp_script_is, wp_register_script, plugins_url
	 * @action wp_loaded
	 * @return null
	 */
	public function register_assets() {
		if ( ! wp_script_is( 'spin', 'registered' ) ) {
			wp_register_script(
				'spin',
				self::get_file_url_for_environment( '_inc/build/spin.min.js', '_inc/spin.js' ),
				false,
				'1.3'
			);
		}

		if ( ! wp_script_is( 'jquery.spin', 'registered' ) ) {
			wp_register_script(
				'jquery.spin',
				self::get_file_url_for_environment( '_inc/build/jquery.spin.min.js', '_inc/jquery.spin.js' ),
				array( 'jquery', 'spin' ),
				'1.3'
			);
		}

		if ( ! wp_script_is( 'jetpack-gallery-settings', 'registered' ) ) {
			wp_register_script(
				'jetpack-gallery-settings',
				self::get_file_url_for_environment( '_inc/build/gallery-settings.min.js', '_inc/gallery-settings.js' ),
				array( 'media-views' ),
				'20121225'
			);
		}

		if ( ! wp_script_is( 'jetpack-twitter-timeline', 'registered' ) ) {
			wp_register_script(
				'jetpack-twitter-timeline',
				self::get_file_url_for_environment( '_inc/build/twitter-timeline.min.js', '_inc/twitter-timeline.js' ),
				array( 'jquery' ),
				'4.0.0',
				true
			);
		}

		if ( ! wp_script_is( 'jetpack-facebook-embed', 'registered' ) ) {
			wp_register_script(
				'jetpack-facebook-embed',
				self::get_file_url_for_environment( '_inc/build/facebook-embed.min.js', '_inc/facebook-embed.js' ),
				array( 'jquery' ),
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
					'appid' => $fb_app_id,
					'locale' => $this->get_locale(),
				)
			);
		}

		/**
		 * As jetpack_register_genericons is by default fired off a hook,
		 * the hook may have already fired by this point.
		 * So, let's just trigger it manually.
		 */
		require_once( JETPACK__PLUGIN_DIR . '_inc/genericons.php' );
		jetpack_register_genericons();

		/**
		 * Register the social logos
		 */
		require_once( JETPACK__PLUGIN_DIR . '_inc/social-logos.php' );
		jetpack_register_social_logos();

		if ( ! wp_style_is( 'jetpack-icons', 'registered' ) )
			wp_register_style( 'jetpack-icons', plugins_url( 'css/jetpack-icons.min.css', JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION );
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
	 * Device Pixels support
	 * This improves the resolution of gravatars and wordpress.com uploads on hi-res and zoomed browsers.
	 */
	function devicepx() {
		if ( Jetpack::is_active() ) {
			wp_enqueue_script( 'devicepx', 'https://s0.wp.com/wp-content/js/devicepx-jetpack.js', array(), gmdate( 'oW' ), true );
		}
	}

	/**
	 * Return the network_site_url so that .com knows what network this site is a part of.
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
	 * @return string
	 */
	static function network_allow_new_registrations( $option = null ) {
		return ( in_array( get_site_option( 'registration' ), array('none', 'user', 'blog', 'all' ) ) ? get_site_option( 'registration') : 'none' );
	}
	/**
	 * Does the network allow admins to add new users.
	 * @return boolian
	 */
	static function network_add_new_users( $option = null ) {
		return (bool) get_site_option( 'add_new_users' );
	}
	/**
	 * File upload psace left per site in MB.
	 *  -1 means NO LIMIT.
	 * @return number
	 */
	static function network_site_upload_space( $option = null ) {
		// value in MB
		return ( get_site_option( 'upload_space_check_disabled' ) ? -1 : get_space_allowed() );
	}

	/**
	 * Network allowed file types.
	 * @return string
	 */
	static function network_upload_file_types( $option = null ) {
		return get_site_option( 'upload_filetypes', 'jpg jpeg png gif' );
	}

	/**
	 * Maximum file upload size set by the network.
	 * @return number
	 */
	static function network_max_upload_file_size( $option = null ) {
		// value in KB
		return get_site_option( 'fileupload_maxk', 300 );
	}

	/**
	 * Lets us know if a site allows admins to manage the network.
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
					if ( Jetpack::is_user_connected( $admin->ID ) ) {
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
	 * @param  bool  $option
	 *
	 * @return boolean
	 */
	public function is_main_network_option( $option ) {
		// return '1' or ''
		return (string) (bool) Jetpack::is_multi_network();
	}

	/**
	 * Return true if we are with multi-site or multi-network false if we are dealing with single site.
	 *
	 * @param  string  $option
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
	 * @return null
	 */
	function update_jetpack_main_network_site_option() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
	}
	/**
	 * Triggered after a user updates the network settings via Network Settings Admin Page
	 *
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
	 * @return string ( '1' | '0' )
	 **/
	public static function file_system_write_access() {
		if ( ! function_exists( 'get_filesystem_method' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/file.php' );
		}

		require_once( ABSPATH . 'wp-admin/includes/template.php' );

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
	 * @return string ( '1' | '0' )
	 **/
	public static function is_version_controlled() {
		_deprecated_function( __METHOD__, 'jetpack-4.2', 'Jetpack_Sync_Functions::is_version_controlled' );
		return (string) (int) Jetpack_Sync_Functions::is_version_controlled();
	}

	/**
	 * Determines whether the current theme supports featured images or not.
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
	 * @param int $size Size of the avatar image
	 * @param string $default URL to a default image to use if no avatar is available
	 * @param bool $force_display Whether to force it to return an avatar even if show_avatars is disabled
	 *
	 * @return array
	 */
	public static function get_avatar_url( $id_or_email, $size = 96, $default = '', $force_display = false ) {
		_deprecated_function( __METHOD__, 'jetpack-4.7', 'get_avatar_url' );
		return get_avatar_url( $id_or_email, array(
			'size' => $size,
			'default' => $default,
			'force_default' => $force_display,
		) );
	}

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

	public static function get_update_details() {
		$update_details = array(
			'update_core' => get_site_transient( 'update_core' ),
			'update_plugins' => get_site_transient( 'update_plugins' ),
			'update_themes' => get_site_transient( 'update_themes' ),
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
	 */
	public static function is_active() {
		return (bool) Jetpack_Data::get_access_token( JETPACK_MASTER_USER );
	}

	/**
	 * Make an API call to WordPress.com for plan status
	 *
	 * @uses Jetpack_Options::get_option()
	 * @uses Jetpack_Client::wpcom_json_api_request_as_blog()
	 * @uses update_option()
	 *
	 * @access public
	 * @static
	 *
	 * @return bool True if plan is updated, false if no update
	 */
	public static function refresh_active_plan_from_wpcom() {
		// Make the API request
		$request = sprintf( '/sites/%d', Jetpack_Options::get_option( 'id' ) );
		$response = Jetpack_Client::wpcom_json_api_request_as_blog( $request, '1.1' );

		// Bail if there was an error or malformed response
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return false;
		}

		// Decode the results
		$results = json_decode( $response['body'], true );

		// Bail if there were no results or plan details returned
		if ( ! is_array( $results ) || ! isset( $results['plan'] ) ) {
			return false;
		}

		// Store the option and return true if updated
		return update_option( 'jetpack_active_plan', $results['plan'] );
	}

	/**
	 * Get the plan that this Jetpack site is currently using
	 *
	 * @uses get_option()
	 *
	 * @access public
	 * @static
	 *
	 * @return array Active Jetpack plan details
	 */
	public static function get_active_plan() {
		$plan = get_option( 'jetpack_active_plan', array() );

		// Set the default options
		if ( empty( $plan ) || ( isset( $plan['product_slug'] ) && 'jetpack_free' === $plan['product_slug'] ) ) {
			$plan = wp_parse_args( $plan, array(
				'product_slug' => 'jetpack_free',
				'supports'     => array(),
				'class'        => 'free',
			) );
		}

		// Define what paid modules are supported by personal plans
		$personal_plans = array(
			'jetpack_personal',
			'jetpack_personal_monthly',
			'personal-bundle',
		);

		if ( in_array( $plan['product_slug'], $personal_plans ) ) {
			$plan['supports'] = array(
				'akismet',
			);
			$plan['class'] = 'personal';
		}

		// Define what paid modules are supported by premium plans
		$premium_plans = array(
			'jetpack_premium',
			'jetpack_premium_monthly',
			'value_bundle',
		);

		if ( in_array( $plan['product_slug'], $premium_plans ) ) {
			$plan['supports'] = array(
				'videopress',
				'akismet',
				'vaultpress',
				'wordads',
			);
			$plan['class'] = 'premium';
		}

		// Define what paid modules are supported by professional plans
		$business_plans = array(
			'jetpack_business',
			'jetpack_business_monthly',
			'business-bundle',
			'vip',
		);

		if ( in_array( $plan['product_slug'], $business_plans ) ) {
			$plan['supports'] = array(
				'videopress',
				'akismet',
				'vaultpress',
				'seo-tools',
				'google-analytics',
				'wordads',
				'search',
			);
			$plan['class'] = 'business';
		}

		// Make sure we have an array here in the event database data is stale
		if ( ! isset( $plan['supports'] ) ) {
			$plan['supports'] = array();
		}

		return $plan;
	}

	/**
	 * Determine whether the active plan supports a particular feature
	 *
	 * @uses Jetpack::get_active_plan()
	 *
	 * @access public
	 * @static
	 *
	 * @return bool True if plan supports feature, false if not
	 */
	public static function active_plan_supports( $feature ) {
		$plan = Jetpack::get_active_plan();

		if ( in_array( $feature, $plan['supports'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Is Jetpack in development (offline) mode?
	 */
	public static function is_development_mode() {
		$development_mode = false;

		if ( defined( 'JETPACK_DEV_DEBUG' ) ) {
			$development_mode = JETPACK_DEV_DEBUG;
		} elseif ( $site_url = site_url() ) {
			$development_mode = false === strpos( $site_url, '.' );
		}

		/**
		 * Filters Jetpack's development mode.
		 *
		 * @see https://jetpack.com/support/development-mode/
		 *
		 * @since 2.2.1
		 *
		 * @param bool $development_mode Is Jetpack's development mode active.
		 */
		return apply_filters( 'jetpack_development_mode', $development_mode );
	}

	/**
	* Get Jetpack development mode notice text and notice class.
	*
	* Mirrors the checks made in Jetpack::is_development_mode
	*
	*/
	public static function show_development_mode_notice() {
		if ( Jetpack::is_development_mode() ) {
			if ( defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG ) {
				$notice = sprintf(
					/* translators: %s is a URL */
					__( 'In <a href="%s" target="_blank">Development Mode</a>, via the JETPACK_DEV_DEBUG constant being defined in wp-config.php or elsewhere.', 'jetpack' ),
					'https://jetpack.com/support/development-mode/'
				);
			} elseif ( site_url() && false === strpos( site_url(), '.' ) ) {
				$notice = sprintf(
					/* translators: %s is a URL */
					__( 'In <a href="%s" target="_blank">Development Mode</a>, via site URL lacking a dot (e.g. http://localhost).', 'jetpack' ),
					'https://jetpack.com/support/development-mode/'
				);
			} else {
				$notice = sprintf(
					/* translators: %s is a URL */
					__( 'In <a href="%s" target="_blank">Development Mode</a>, via the jetpack_development_mode filter.', 'jetpack' ),
					'https://jetpack.com/support/development-mode/'
				);
			}

			echo '<div class="updated" style="border-color: #f0821e;"><p>' . $notice . '</p></div>';
		}

		// Throw up a notice if using a development version and as for feedback.
		if ( Jetpack::is_development_version() ) {
			/* translators: %s is a URL */
			$notice = sprintf( __( 'You are currently running a development version of Jetpack. <a href="%s" target="_blank">Submit your feedback</a>', 'jetpack' ), 'https://jetpack.com/contact-support/beta-group/' );

			echo '<div class="updated" style="border-color: #f0821e;"><p>' . $notice . '</p></div>';
		}
		// Throw up a notice if using staging mode
		if ( Jetpack::is_staging_site() ) {
			/* translators: %s is a URL */
			$notice = sprintf( __( 'You are running Jetpack on a <a href="%s" target="_blank">staging server</a>.', 'jetpack' ), 'https://jetpack.com/support/staging-sites/' );

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
			! preg_match( '/^\d+(\.\d+)+$/', Jetpack_Constants::get_constant( 'JETPACK__VERSION' ) )
		);
	}

	/**
	 * Is a given user (or the current user if none is specified) linked to a WordPress.com user?
	 */
	public static function is_user_connected( $user_id = false ) {
		$user_id = false === $user_id ? get_current_user_id() : absint( $user_id );
		if ( ! $user_id ) {
			return false;
		}

		return (bool) Jetpack_Data::get_access_token( $user_id );
	}

	/**
	 * Get the wpcom user data of the current|specified connected user.
	 */
	public static function get_connected_user_data( $user_id = null ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		$transient_key = "jetpack_connected_user_data_$user_id";

		if ( $cached_user_data = get_transient( $transient_key ) ) {
			return $cached_user_data;
		}

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => $user_id,
		) );
		$xml->query( 'wpcom.getUser' );
		if ( ! $xml->isError() ) {
			$user_data = $xml->getResponse();
			set_transient( $transient_key, $xml->getResponse(), DAY_IN_SECONDS );
			return $user_data;
		}

		return false;
	}

	/**
	 * Get the wpcom email of the current|specified connected user.
	 */
	public static function get_connected_user_email( $user_id = null ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => $user_id,
		) );
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

	function current_user_is_connection_owner() {
		$user_token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );
		return $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) && get_current_user_id() === $user_token->external_user_id;
	}

	/**
	 * Add any extra oEmbed providers that we know about and use on wpcom for feature parity.
	 */
	function extra_oembed_providers() {
		// Cloudup: https://dev.cloudup.com/#oembed
		wp_oembed_add_provider( 'https://cloudup.com/*' , 'https://cloudup.com/oembed' );
		wp_oembed_add_provider( 'https://me.sh/*', 'https://me.sh/oembed?format=json' );
		wp_oembed_add_provider( '#https?://(www\.)?gfycat\.com/.*#i', 'https://api.gfycat.com/v1/oembed', true );
		wp_oembed_add_provider( '#https?://[^.]+\.(wistia\.com|wi\.st)/(medias|embed)/.*#', 'https://fast.wistia.com/oembed', true );
		wp_oembed_add_provider( '#https?://sketchfab\.com/.*#i', 'https://sketchfab.com/oembed', true );
		wp_oembed_add_provider( '#https?://(www\.)?icloud\.com/keynote/.*#i', 'https://iwmb.icloud.com/iwmb/oembed', true );
	}

	/**
	 * Synchronize connected user role changes
	 */
	function user_role_change( $user_id ) {
		_deprecated_function( __METHOD__, 'jetpack-4.2', 'Jetpack_Sync_Users::user_role_change()' );
		Jetpack_Sync_Users::user_role_change( $user_id );
	}

	/**
	 * Loads the currently active modules.
	 */
	public static function load_modules() {
		if (
			! self::is_active()
			&& ! self::is_development_mode()
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

		$modules = array_filter( Jetpack::get_active_modules(), array( 'Jetpack', 'is_module' ) );

		$modules_data = array();

		// Don't load modules that have had "Major" changes since the stored version until they have been deactivated/reactivated through the lint check.
		if ( version_compare( $version, JETPACK__VERSION, '<' ) ) {
			$updated_modules = array();
			foreach ( $modules as $module ) {
				$modules_data[ $module ] = Jetpack::get_module( $module );
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

		$is_development_mode = Jetpack::is_development_mode();

		foreach ( $modules as $index => $module ) {
			// If we're in dev mode, disable modules requiring a connection
			if ( $is_development_mode ) {
				// Prime the pump if we need to
				if ( empty( $modules_data[ $module ] ) ) {
					$modules_data[ $module ] = Jetpack::get_module( $module );
				}
				// If the module requires a connection, but we're in local mode, don't include it.
				if ( $modules_data[ $module ]['requires_connection'] ) {
					continue;
				}
			}

			if ( did_action( 'jetpack_module_loaded_' . $module ) ) {
				continue;
			}

			if ( ! include_once( Jetpack::get_module_path( $module ) ) ) {
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
		require_once( JETPACK__PLUGIN_DIR . 'modules/module-extras.php' );
	}

	/**
	 * Check if Jetpack's REST API compat file should be included
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

		if ( function_exists( 'bbpress' ) )
			$_jetpack_rest_api_compat_includes[] = JETPACK__PLUGIN_DIR . 'class.jetpack-bbpress-json-api-compat.php';

		foreach ( $_jetpack_rest_api_compat_includes as $_jetpack_rest_api_compat_include )
			require_once $_jetpack_rest_api_compat_include;
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
			require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		}
		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		$all_plugins    = apply_filters( 'all_plugins', get_plugins() );
		$active_plugins = Jetpack::get_active_plugins();

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
		$all_themes = wp_get_themes( array( 'allowed' => true ) );
		$header_keys = array( 'Name', 'Author', 'Version', 'ThemeURI', 'AuthorURI', 'Status', 'Tags' );

		$themes = array();
		foreach ( $all_themes as $slug => $theme_data ) {
			$theme_headers = array();
			foreach ( $header_keys as $header_key ) {
				$theme_headers[ $header_key ] = $theme_data->get( $header_key );
			}

			$themes[ $slug ] = array(
					'is_active_theme' => $slug == wp_get_theme()->get_template(),
					'slug' => $slug,
					'theme_root' => $theme_data->get_theme_root_uri(),
					'parent' => $theme_data->parent(),
					'headers' => $theme_headers
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
		if ( in_array( 'publicize', Jetpack::get_active_modules() ) || in_array( 'sharedaddy', Jetpack::get_active_modules() ) ) {
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
	 * @param string  $type         Report type (login_form, backup, file_scanning, spam)
	 * @param string  $plugin_file  Plugin __FILE__, so that we can pull plugin data
	 * @param array   $args         See definitions above
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
	 * @param int $user_id
	 * @param string $token
	 * return bool
	 */
	public static function update_user_token( $user_id, $token, $is_master_user ) {
		// not designed for concurrent updates
		$user_tokens = Jetpack_Options::get_option( 'user_tokens' );
		if ( ! is_array( $user_tokens ) )
			$user_tokens = array();
		$user_tokens[$user_id] = $token;
		if ( $is_master_user ) {
			$master_user = $user_id;
			$options     = compact( 'user_tokens', 'master_user' );
		} else {
			$options = compact( 'user_tokens' );
		}
		return Jetpack_Options::update_options( $options );
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
		$files = array();
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
		if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
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

		$active_modules     = Jetpack::get_active_modules();
		$reactivate_modules = array();
		foreach ( $active_modules as $active_module ) {
			$module = Jetpack::get_module( $active_module );
			if ( ! isset( $module['changed'] ) ) {
				continue;
			}

			if ( version_compare( $module['changed'], $jetpack_version, '<=' ) ) {
				continue;
			}

			$reactivate_modules[] = $active_module;
			Jetpack::deactivate_module( $active_module );
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

		Jetpack::state( 'message', 'modules_activated' );
		Jetpack::activate_default_modules( $jetpack_version, JETPACK__VERSION, $reactivate_modules );

		if ( $redirect ) {
			$page = 'jetpack'; // make sure we redirect to either settings or the jetpack page
			if ( isset( $_GET['page'] ) && in_array( $_GET['page'], array( 'jetpack', 'jetpack_modules' ) ) ) {
				$page = $_GET['page'];
			}

			wp_safe_redirect( Jetpack::admin_url( 'page=' . $page ) );
			exit;
		}
	}

	/**
	 * List available Jetpack modules. Simply lists .php files in /modules/.
	 * Make sure to tuck away module "library" files in a sub-directory.
	 */
	public static function get_available_modules( $min_version = false, $max_version = false ) {
		static $modules = null;

		if ( ! isset( $modules ) ) {
			$available_modules_option = Jetpack_Options::get_option( 'available_modules', array() );
			// Use the cache if we're on the front-end and it's available...
			if ( ! is_admin() && ! empty( $available_modules_option[ JETPACK__VERSION ] ) ) {
				$modules = $available_modules_option[ JETPACK__VERSION ];
			} else {
				$files = Jetpack::glob_php( JETPACK__PLUGIN_DIR . 'modules' );

				$modules = array();

				foreach ( $files as $file ) {
					if ( ! $headers = Jetpack::get_module( $file ) ) {
						continue;
					}

					$modules[ Jetpack::get_module_slug( $file ) ] = $headers['introduced'];
				}

				Jetpack_Options::update_option( 'available_modules', array(
					JETPACK__VERSION => $modules,
				) );
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
		 */
		$mods = apply_filters( 'jetpack_get_available_modules', $modules, $min_version, $max_version );

		if ( ! $min_version && ! $max_version ) {
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

			$r[] = $slug;
		}

		return $r;
	}

	/**
	 * Default modules loaded on activation.
	 */
	public static function get_default_modules( $min_version = false, $max_version = false ) {
		$return = array();

		foreach ( Jetpack::get_available_modules( $min_version, $max_version ) as $module ) {
			$module_data = Jetpack::get_module( $module );

			switch ( strtolower( $module_data['auto_activate'] ) ) {
				case 'yes' :
					$return[] = $module;
					break;
				case 'public' :
					if ( Jetpack_Options::get_option( 'public' ) ) {
						$return[] = $module;
					}
					break;
				case 'no' :
				default :
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
		 */
		return apply_filters( 'jetpack_get_default_modules', $return, $min_version, $max_version );
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
			'debug'            => null,  // Closed out and moved to ./class.jetpack-debugger.php
			'wpcc'             => 'sso', // Closed out in 2.6 -- SSO provides the same functionality.
			'gplus-authorship' => null,  // Closed out in 3.2 -- Google dropped support.
		);

		// Don't activate SSO if they never completed activating WPCC.
		if ( Jetpack::is_module_active( 'wpcc' ) ) {
			$wpcc_options = Jetpack_Options::get_option( 'wpcc_options' );
			if ( empty( $wpcc_options ) || empty( $wpcc_options['client_id'] ) || empty( $wpcc_options['client_id'] ) ) {
				$deprecated_modules['wpcc'] = null;
			}
		}

		foreach ( $deprecated_modules as $module => $replacement ) {
			if ( Jetpack::is_module_active( $module ) ) {
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
		return JETPACK__PLUGIN_DIR . "modules/$slug.php";
	}

	/**
	 * Load module data from module file. Headers differ from WordPress
	 * plugin headers to avoid them being identified as standalone
	 * plugins on the WordPress plugins page.
	 */
	public static function get_module( $module ) {
		$headers = array(
			'name'                      => 'Module Name',
			'description'               => 'Module Description',
			'jumpstart_desc'            => 'Jumpstart Description',
			'sort'                      => 'Sort Order',
			'recommendation_order'      => 'Recommendation Order',
			'introduced'                => 'First Introduced',
			'changed'                   => 'Major Changes In',
			'deactivate'                => 'Deactivate',
			'free'                      => 'Free',
			'requires_connection'       => 'Requires Connection',
			'auto_activate'             => 'Auto Activate',
			'module_tags'               => 'Module Tags',
			'feature'                   => 'Feature',
			'additional_search_queries' => 'Additional Search Queries',
		);

		$file = Jetpack::get_module_path( Jetpack::get_module_slug( $module ) );

		$mod = Jetpack::get_file_data( $file, $headers );
		if ( empty( $mod['name'] ) ) {
			return false;
		}

		$mod['sort']                    = empty( $mod['sort'] ) ? 10 : (int) $mod['sort'];
		$mod['recommendation_order']    = empty( $mod['recommendation_order'] ) ? 20 : (int) $mod['recommendation_order'];
		$mod['deactivate']              = empty( $mod['deactivate'] );
		$mod['free']                    = empty( $mod['free'] );
		$mod['requires_connection']     = ( ! empty( $mod['requires_connection'] ) && 'No' == $mod['requires_connection'] ) ? false : true;

		if ( empty( $mod['auto_activate'] ) || ! in_array( strtolower( $mod['auto_activate'] ), array( 'yes', 'no', 'public' ) ) ) {
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

		if ( $mod['feature'] ) {
			$mod['feature'] = explode( ',', $mod['feature'] );
			$mod['feature'] = array_map( 'trim', $mod['feature'] );
		} else {
			$mod['feature'] = array( self::translate_module_tag( 'Other' ) );
		}

		/**
		 * Filters the feature array on a module.
		 *
		 * This filter allows you to control where each module is filtered: Recommended,
		 * Jumpstart, and the default "Other" listing.
		 *
		 * @since 3.5.0
		 *
		 * @param array   $mod['feature'] The areas to feature this module:
		 *     'Jumpstart' adds to the "Jumpstart" option to activate many modules at once.
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
		//Get just the filename from $file (i.e. exclude full path) so that a consistent hash is generated
		$file_name = basename( $file );

		$cache_key = 'jetpack_file_data_' . JETPACK__VERSION;

		$file_data_option = get_transient( $cache_key );

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
				$modules[ $index ]['description'] = $i18n_module['description'];
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

		//If protect is active on the main site of a multisite, it should be active on all sites.
		if ( ! in_array( 'protect', $active ) && is_multisite() && get_site_option( 'jetpack_protect_active' ) ) {
			$active[] = 'protect';
		}

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
		return ! empty( $module ) && ! validate_file( $module, Jetpack::get_available_modules() );
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
		Jetpack::state( 'php_errors', self::alias_directories( ob_get_clean() ) );
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
		$redirect = true,
		$send_state_messages = true
	) {
		$jetpack = Jetpack::init();

		$modules = Jetpack::get_default_modules( $min_version, $max_version );
		$modules = array_merge( $other_modules, $modules );

		// Look for standalone plugins and disable if active.

		$to_deactivate = array();
		foreach ( $modules as $module ) {
			if ( isset( $jetpack->plugins_to_deactivate[$module] ) ) {
				$to_deactivate[$module] = $jetpack->plugins_to_deactivate[$module];
			}
		}

		$deactivated = array();
		foreach ( $to_deactivate as $module => $deactivate_me ) {
			list( $probable_file, $probable_title ) = $deactivate_me;
			if ( Jetpack_Client_Server::deactivate_plugin( $probable_file, $probable_title ) ) {
				$deactivated[] = $module;
			}
		}

		if ( $deactivated && $redirect ) {
			Jetpack::state( 'deactivated_plugins', join( ',', $deactivated ) );

			$url = add_query_arg(
				array(
					'action'   => 'activate_default_modules',
					'_wpnonce' => wp_create_nonce( 'activate_default_modules' ),
				),
				add_query_arg( compact( 'min_version', 'max_version', 'other_modules' ), Jetpack::admin_url( 'page=jetpack' ) )
			);
			wp_safe_redirect( $url );
			exit;
		}

		/**
		 * Fires before default modules are activated.
		 *
		 * @since 1.9.0
		 *
		 * @param string $min_version Minimum version number required to use modules.
		 * @param string $max_version Maximum version number required to use modules.
		 * @param array $other_modules Array of other modules to activate alongside the default modules.
		 */
		do_action( 'jetpack_before_activate_default_modules', $min_version, $max_version, $other_modules );

		// Check each module for fatal errors, a la wp-admin/plugins.php::activate before activating
		Jetpack::restate();
		Jetpack::catch_errors( true );

		$active = Jetpack::get_active_modules();

		foreach ( $modules as $module ) {
			if ( did_action( "jetpack_module_loaded_$module" ) ) {
				$active[] = $module;
				self::update_active_modules( $active );
				continue;
			}

			if ( $send_state_messages && in_array( $module, $active ) ) {
				$module_info = Jetpack::get_module( $module );
				if ( ! $module_info['deactivate'] ) {
					$state = in_array( $module, $other_modules ) ? 'reactivated_modules' : 'activated_modules';
					if ( $active_state = Jetpack::state( $state ) ) {
						$active_state = explode( ',', $active_state );
					} else {
						$active_state = array();
					}
					$active_state[] = $module;
					Jetpack::state( $state, implode( ',', $active_state ) );
				}
				continue;
			}

			$file = Jetpack::get_module_path( $module );
			if ( ! file_exists( $file ) ) {
				continue;
			}

			// we'll override this later if the plugin can be included without fatal error
			if ( $redirect ) {
				wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
			}

			if ( $send_state_messages ) {
				Jetpack::state( 'error', 'module_activation_failed' );
				Jetpack::state( 'module', $module );
			}

			ob_start();
			require $file;

			$active[] = $module;

			if ( $send_state_messages ) {

				$state    = in_array( $module, $other_modules ) ? 'reactivated_modules' : 'activated_modules';
				if ( $active_state = Jetpack::state( $state ) ) {
					$active_state = explode( ',', $active_state );
				} else {
					$active_state = array();
				}
				$active_state[] = $module;
				Jetpack::state( $state, implode( ',', $active_state ) );
			}

			Jetpack::update_active_modules( $active );

			ob_end_clean();
		}

		if ( $send_state_messages ) {
			Jetpack::state( 'error', false );
			Jetpack::state( 'module', false );
		}

		Jetpack::catch_errors( false );
		/**
		 * Fires when default modules are activated.
		 *
		 * @since 1.9.0
		 *
		 * @param string $min_version Minimum version number required to use modules.
		 * @param string $max_version Maximum version number required to use modules.
		 * @param array $other_modules Array of other modules to activate alongside the default modules.
		 */
		do_action( 'jetpack_activate_default_modules', $min_version, $max_version, $other_modules );
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

		$jetpack = Jetpack::init();

		if ( ! strlen( $module ) )
			return false;

		if ( ! Jetpack::is_module( $module ) )
			return false;

		// If it's already active, then don't do it again
		$active = Jetpack::get_active_modules();
		foreach ( $active as $act ) {
			if ( $act == $module )
				return true;
		}

		$module_data = Jetpack::get_module( $module );

		if ( ! Jetpack::is_active() ) {
			if ( !Jetpack::is_development_mode() )
				return false;

			// If we're not connected but in development mode, make sure the module doesn't require a connection
			if ( Jetpack::is_development_mode() && $module_data['requires_connection'] )
				return false;
		}

		// Check and see if the old plugin is active
		if ( isset( $jetpack->plugins_to_deactivate[ $module ] ) ) {
			// Deactivate the old plugin
			if ( Jetpack_Client_Server::deactivate_plugin( $jetpack->plugins_to_deactivate[ $module ][0], $jetpack->plugins_to_deactivate[ $module ][1] ) ) {
				// If we deactivated the old plugin, remembere that with ::state() and redirect back to this page to activate the module
				// We can't activate the module on this page load since the newly deactivated old plugin is still loaded on this page load.
				Jetpack::state( 'deactivated_plugins', $module );
				wp_safe_redirect( add_query_arg( 'jetpack_restate', 1 ) );
				exit;
			}
		}

		// Protect won't work with mis-configured IPs
		if ( 'protect' === $module ) {
			include_once JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php';
			if ( ! jetpack_protect_get_ip() ) {
				Jetpack::state( 'message', 'protect_misconfigured_ip' );
				return false;
			}
		}

		// Check the file for fatal errors, a la wp-admin/plugins.php::activate
		Jetpack::state( 'module', $module );
		Jetpack::state( 'error', 'module_activation_failed' ); // we'll override this later if the plugin can be included without fatal error

		Jetpack::catch_errors( true );
		ob_start();
		require Jetpack::get_module_path( $module );
		/** This action is documented in class.jetpack.php */
		do_action( 'jetpack_activate_module', $module );
		$active[] = $module;
		Jetpack::update_active_modules( $active );

		Jetpack::state( 'error', false ); // the override
		ob_end_clean();
		Jetpack::catch_errors( false );

		// A flag for Jump Start so it's not shown again. Only set if it hasn't been yet.
		if ( 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) ) {
			Jetpack_Options::update_option( 'jumpstart', 'jetpack_action_taken' );

			//Jump start is being dismissed send data to MC Stats
			$jetpack->stat( 'jumpstart', 'manual,'.$module );

			$jetpack->do_stats( 'server_side' );
		}

		if ( $redirect ) {
			wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
		}
		if ( $exit ) {
			exit;
		}
		return true;
	}

	function activate_module_actions( $module ) {
		_deprecated_function( __METHOD__, 'jeptack-4.2' );
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

		$jetpack = Jetpack::init();

		$active = Jetpack::get_active_modules();
		$new    = array_filter( array_diff( $active, (array) $module ) );

		// A flag for Jump Start so it's not shown again.
		if ( 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) ) {
			Jetpack_Options::update_option( 'jumpstart', 'jetpack_action_taken' );

			//Jump start is being dismissed send data to MC Stats
			$jetpack->stat( 'jumpstart', 'manual,deactivated-'.$module );

			$jetpack->do_stats( 'server_side' );
		}

		return self::update_active_modules( $new );
	}

	public static function enable_module_configurable( $module ) {
		$module = Jetpack::get_module_slug( $module );
		add_filter( 'jetpack_module_configurable_' . $module, '__return_true' );
	}

	public static function module_configuration_url( $module ) {
		$module = Jetpack::get_module_slug( $module );
		return Jetpack::admin_url( array( 'page' => 'jetpack', 'configure' => $module ) );
	}

	public static function module_configuration_load( $module, $method ) {
		$module = Jetpack::get_module_slug( $module );
		add_action( 'jetpack_module_configuration_load_' . $module, $method );
	}

	public static function module_configuration_head( $module, $method ) {
		$module = Jetpack::get_module_slug( $module );
		add_action( 'jetpack_module_configuration_head_' . $module, $method );
	}

	public static function module_configuration_screen( $module, $method ) {
		$module = Jetpack::get_module_slug( $module );
		add_action( 'jetpack_module_configuration_screen_' . $module, $method );
	}

	public static function module_configuration_activation_screen( $module, $method ) {
		$module = Jetpack::get_module_slug( $module );
		add_action( 'display_activate_module_setting_' . $module, $method );
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
					$plugins[$i] = false;
					$update = true;
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
	 * @static
	 */
	public static function plugin_activation( $network_wide ) {
		Jetpack_Options::update_option( 'activated', 1 );

		if ( version_compare( $GLOBALS['wp_version'], JETPACK__MINIMUM_WP_VERSION, '<' ) ) {
			Jetpack::bail_on_activation( sprintf( __( 'Jetpack requires WordPress version %s or later.', 'jetpack' ), JETPACK__MINIMUM_WP_VERSION ) );
		}

		if ( $network_wide )
			Jetpack::state( 'network_nag', true );

		// For firing one-off events (notices) immediately after activation
		set_transient( 'activated_jetpack', true, .1 * MINUTE_IN_SECONDS );

		update_option( 'jetpack_activation_source', self::get_activation_source( wp_get_referer() ) );

		Jetpack::plugin_initialize();
	}

	public static function get_activation_source( $referer_url ) {

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return array( 'wp-cli', null );
		}

		$referer = parse_url( $referer_url );

		$source_type = 'unknown';
		$source_query = null;

		if ( ! is_array( $referer ) ) {
			return array( $source_type, $source_query );
		}

		$plugins_path = parse_url( admin_url( 'plugins.php' ), PHP_URL_PATH );
		$plugins_install_path = parse_url( admin_url( 'plugin-install.php' ), PHP_URL_PATH );// /wp-admin/plugin-install.php

		if ( isset( $referer['query'] ) ) {
			parse_str( $referer['query'], $query_parts );
		} else {
			$query_parts = array();
		}

		if ( $plugins_path === $referer['path'] ) {
			$source_type = 'list';
		} elseif ( $plugins_install_path === $referer['path'] ) {
			$tab = isset( $query_parts['tab'] ) ? $query_parts['tab'] : 'featured';
			switch( $tab ) {
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
					$source_type = 'search-' . ( isset( $query_parts['type'] ) ? $query_parts['type'] : 'term' );
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
	 * @param  string $version    Version:timestamp
	 * @param  string $old_version Old Version:timestamp or false if not set yet.
	 * @return null              [description]
	 */
	public static function do_version_bump( $version, $old_version ) {

		if ( ! $old_version ) { // For new sites
			// Setting up jetpack manage
			Jetpack::activate_manage();
		}
	}

	/**
	 * Sets the internal version number and activation state.
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

		Jetpack::load_modules();

		Jetpack_Options::delete_option( 'do_activate' );
		Jetpack_Options::delete_option( 'dismissed_connection_banner' );
	}

	/**
	 * Removes all connection options
	 * @static
	 */
	public static function plugin_deactivation( ) {
		require_once( ABSPATH . '/wp-admin/includes/plugin.php' );
		if( is_plugin_active_for_network( 'jetpack/jetpack.php' ) ) {
			Jetpack_Network::init()->deactivate();
		} else {
			Jetpack::disconnect( false );
			//Jetpack_Heartbeat::init()->deactivate();
		}
	}

	/**
	 * Disconnects from the Jetpack servers.
	 * Forgets all connection details and tells the Jetpack servers to do the same.
	 * @static
	 */
	public static function disconnect( $update_activated_state = true ) {
		wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
		Jetpack::clean_nonces( true );

		// If the site is in an IDC because sync is not allowed,
		// let's make sure to not disconnect the production site.
		if ( ! self::validate_sync_error_idc_option() ) {
			JetpackTracking::record_user_event( 'disconnect_site', array() );
			Jetpack::load_xml_rpc_client();
			$xml = new Jetpack_IXR_Client();
			$xml->query( 'jetpack.deregister' );
		}

		Jetpack_Options::delete_option(
			array(
				'blog_token',
				'user_token',
				'user_tokens',
				'master_user',
				'time_diff',
				'fallback_no_verify_ssl_certs',
			)
		);

		Jetpack_IDC::clear_all_idc_options();
		Jetpack_Options::delete_raw_option( 'jetpack_secrets' );

		if ( $update_activated_state ) {
			Jetpack_Options::update_option( 'activated', 4 );
		}

		if ( $jetpack_unique_connection = Jetpack_Options::get_option( 'unique_connection' ) ) {
			// Check then record unique disconnection if site has never been disconnected previously
			if ( - 1 == $jetpack_unique_connection['disconnected'] ) {
				$jetpack_unique_connection['disconnected'] = 1;
			} else {
				if ( 0 == $jetpack_unique_connection['disconnected'] ) {
					//track unique disconnect
					$jetpack = Jetpack::init();

					$jetpack->stat( 'connections', 'unique-disconnect' );
					$jetpack->do_stats( 'server_side' );
				}
				// increment number of times disconnected
				$jetpack_unique_connection['disconnected'] += 1;
			}

			Jetpack_Options::update_option( 'unique_connection', $jetpack_unique_connection );
		}

		// Delete cached connected user data
		$transient_key = "jetpack_connected_user_data_" . get_current_user_id();
		delete_transient( $transient_key );

		// Delete all the sync related data. Since it could be taking up space.
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-sender.php';
		Jetpack_Sync_Sender::get_instance()->uninstall();

		// Disable the Heartbeat cron
		Jetpack_Heartbeat::init()->deactivate();
	}

	/**
	 * Unlinks the current user from the linked WordPress.com user
	 */
	public static function unlink_user( $user_id = null ) {
		if ( ! $tokens = Jetpack_Options::get_option( 'user_tokens' ) )
			return false;

		$user_id = empty( $user_id ) ? get_current_user_id() : intval( $user_id );

		if ( Jetpack_Options::get_option( 'master_user' ) == $user_id )
			return false;

		if ( ! isset( $tokens[ $user_id ] ) )
			return false;

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( compact( 'user_id' ) );
		$xml->query( 'jetpack.unlink_user', $user_id );

		unset( $tokens[ $user_id ] );

		Jetpack_Options::update_option( 'user_tokens', $tokens );

		/**
		 * Fires after the current user has been unlinked from WordPress.com.
		 *
		 * @since 4.1.0
		 *
		 * @param int $user_id The current user's ID.
		 */
		do_action( 'jetpack_unlinked_user', $user_id );

		return true;
	}

	/**
	 * Attempts Jetpack registration.  If it fail, a state flag is set: @see ::admin_page_load()
	 */
	public static function try_registration() {
		// Let's get some testing in beta versions and such.
		if ( self::is_development_version() && defined( 'PHP_URL_HOST' ) ) {
			// Before attempting to connect, let's make sure that the domains are viable.
			$domains_to_check = array_unique( array(
				'siteurl' => parse_url( get_site_url(), PHP_URL_HOST ),
				'homeurl' => parse_url( get_home_url(), PHP_URL_HOST ),
			) );
			foreach ( $domains_to_check as $domain ) {
				$result = Jetpack_Data::is_usable_domain( $domain );
				if ( is_wp_error( $result ) ) {
					return $result;
				}
			}
		}

		$result = Jetpack::register();

		// If there was an error with registration and the site was not registered, record this so we can show a message.
		if ( ! $result || is_wp_error( $result ) ) {
			return $result;
		} else {
			return true;
		}
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
		 *	Array of details about the log entry.
		 *
		 *	@param string time Time of the event.
		 *	@param int user_id ID of the user who trigerred the event.
		 *	@param int blog_id Jetpack Blog ID.
		 *	@param string code Unique name for the event.
		 *	@param string data Data about the event.
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
				if ( $event == $log_event[ 'code' ] ) {
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
		switch( $option ) {
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
			$data = array_merge( $data, $additional_data );
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
		$return["{$prefix}themes"]         = Jetpack::get_parsed_theme_data();
		$return["{$prefix}plugins-extra"]  = Jetpack::get_parsed_plugin_data();
		$return["{$prefix}users"]          = (int) Jetpack::get_site_user_count();
		$return["{$prefix}site-count"]     = 0;

		if ( function_exists( 'get_blog_count' ) ) {
			$return["{$prefix}site-count"] = get_blog_count();
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
			Jetpack::plugin_initialize();
		}

		if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
			Jetpack_Connection_Banner::init();
		} elseif ( false === Jetpack_Options::get_option( 'fallback_no_verify_ssl_certs' ) ) {
			// Upgrade: 1.1 -> 1.1.1
			// Check and see if host can verify the Jetpack servers' SSL certificate
			$args = array();
			Jetpack_Client::_wp_remote_request(
				Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'test' ) ),
				$args,
				true
			);
		} else if ( $this->can_display_jetpack_manage_notice() && ! Jetpack_Options::get_option( 'dismissed_manage_banner' ) ) {
			// Show the notice on the Dashboard only for now
			add_action( 'load-index.php', array( $this, 'prepare_manage_jetpack_notice' ) );
		}

		if ( current_user_can( 'manage_options' ) && 'AUTO' == JETPACK_CLIENT__HTTPS && ! self::permit_ssl() ) {
			add_action( 'jetpack_notices', array( $this, 'alert_auto_ssl_fail' ) );
		}

		add_action( 'load-plugins.php', array( $this, 'intercept_plugin_error_scrape_init' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_menu_css' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( JETPACK__PLUGIN_DIR . 'jetpack.php' ), array( $this, 'plugin_action_links' ) );

		if ( Jetpack::is_active() || Jetpack::is_development_mode() ) {
			// Artificially throw errors in certain whitelisted cases during plugin activation
			add_action( 'activate_plugin', array( $this, 'throw_error_on_activate_plugin' ) );
		}

		// Jetpack Manage Activation Screen from .com
		Jetpack::module_configuration_activation_screen( 'manage', array( $this, 'manage_activate_screen' ) );

		// Add custom column in wp-admin/users.php to show whether user is linked.
		add_filter( 'manage_users_columns',       array( $this, 'jetpack_icon_user_connected' ) );
		add_action( 'manage_users_custom_column', array( $this, 'jetpack_show_user_connected_icon' ), 10, 3 );
		add_action( 'admin_print_styles',         array( $this, 'jetpack_user_col_style' ) );
	}

	function admin_body_class( $admin_body_class = '' ) {
		$classes = explode( ' ', trim( $admin_body_class ) );

		$classes[] = self::is_active() ? 'jetpack-connected' : 'jetpack-disconnected';

		$admin_body_class = implode( ' ', array_unique( $classes ) );
		return " $admin_body_class ";
	}

	static function add_jetpack_pagestyles( $admin_body_class = '' ) {
		return $admin_body_class . ' jetpack-pagestyles ';
	}

	/**
	 * Call this function if you want the Big Jetpack Manage Notice to show up.
	 *
	 * @return null
	 */
	function prepare_manage_jetpack_notice() {

		add_action( 'admin_print_styles', array( $this, 'admin_banner_styles' ) );
		add_action( 'admin_notices', array( $this, 'admin_jetpack_manage_notice' ) );
	}

	function manage_activate_screen() {
		include ( JETPACK__PLUGIN_DIR . 'modules/manage/activate-admin.php' );
	}
	/**
	 * Sometimes a plugin can activate without causing errors, but it will cause errors on the next page load.
	 * This function artificially throws errors for such cases (whitelisted).
	 *
	 * @param string $plugin The activated plugin.
	 */
	function throw_error_on_activate_plugin( $plugin ) {
		$active_modules = Jetpack::get_active_modules();

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
				Jetpack::bail_on_activation( sprintf( __( 'Jetpack contains the most recent version of the old &#8220;%1$s&#8221; plugin.', 'jetpack' ), $deactivate_me[1] ), false );
			}
		}
	}

	function add_remote_request_handlers() {
		add_action( 'wp_ajax_nopriv_jetpack_upload_file', array( $this, 'remote_request_handlers' ) );
		add_action( 'wp_ajax_nopriv_jetpack_update_file', array( $this, 'remote_request_handlers' ) );
	}

	function remote_request_handlers() {
		$action = current_filter();

		switch ( current_filter() ) {
		case 'wp_ajax_nopriv_jetpack_upload_file' :
			$response = $this->upload_handler();
			break;

		case 'wp_ajax_nopriv_jetpack_update_file' :
			$response = $this->upload_handler( true );
			break;
		default :
			$response = new Jetpack_Error( 'unknown_handler', 'Unknown Handler', 400 );
			break;
		}

		if ( ! $response ) {
			$response = new Jetpack_Error( 'unknown_error', 'Unknown Error', 400 );
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
			return new Jetpack_Error( 405, get_status_header_desc( 405 ), 405 );
		}

		$user = wp_authenticate( '', '' );
		if ( ! $user || is_wp_error( $user ) ) {
			return new Jetpack_Error( 403, get_status_header_desc( 403 ), 403 );
		}

		wp_set_current_user( $user->ID );

		if ( ! current_user_can( 'upload_files' ) ) {
			return new Jetpack_Error( 'cannot_upload_files', 'User does not have permission to upload files', 403 );
		}

		if ( empty( $_FILES ) ) {
			return new Jetpack_Error( 'no_files_uploaded', 'No files were uploaded: nothing to process', 400 );
		}

		foreach ( array_keys( $_FILES ) as $files_key ) {
			if ( ! isset( $_POST["_jetpack_file_hmac_{$files_key}"] ) ) {
				return new Jetpack_Error( 'missing_hmac', 'An HMAC for one or more files is missing', 400 );
			}
		}

		$media_keys = array_keys( $_FILES['media'] );

		$token = Jetpack_Data::get_access_token( get_current_user_id() );
		if ( ! $token || is_wp_error( $token ) ) {
			return new Jetpack_Error( 'unknown_token', 'Unknown Jetpack token', 403 );
		}

		$uploaded_files = array();
		$global_post    = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
		unset( $GLOBALS['post'] );
		foreach ( $_FILES['media']['name'] as $index => $name ) {
			$file = array();
			foreach ( $media_keys as $media_key ) {
				$file[$media_key] = $_FILES['media'][$media_key][$index];
			}

			list( $hmac_provided, $salt ) = explode( ':', $_POST['_jetpack_file_hmac_media'][$index] );

			$hmac_file = hash_hmac_file( 'sha1', $file['tmp_name'], $salt . $token->secret );
			if ( $hmac_provided !== $hmac_file ) {
				$uploaded_files[$index] = (object) array( 'error' => 'invalid_hmac', 'error_description' => 'The corresponding HMAC for this file does not match' );
				continue;
			}

			$_FILES['.jetpack.upload.'] = $file;
			$post_id = isset( $_POST['post_id'][$index] ) ? absint( $_POST['post_id'][$index] ) : 0;
			if ( ! current_user_can( 'edit_post', $post_id ) ) {
				$post_id = 0;
			}

			if ( $update_media_item ) {
				if ( ! isset( $post_id ) || $post_id === 0 ) {
					return new Jetpack_Error( 'invalid_input', 'Media ID must be defined.', 400 );
				}

				$media_array = $_FILES['media'];

				$file_array['name'] = $media_array['name'][0];
				$file_array['type'] = $media_array['type'][0];
				$file_array['tmp_name'] = $media_array['tmp_name'][0];
				$file_array['error'] = $media_array['error'][0];
				$file_array['size'] = $media_array['size'][0];

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
				$uploaded_files[$index] = (object) array( 'error' => 'unknown', 'error_description' => 'An unknown problem occurred processing the upload on the Jetpack site' );
			} elseif ( is_wp_error( $attachment_id ) ) {
				$uploaded_files[$index] = (object) array( 'error' => 'attachment_' . $attachment_id->get_error_code(), 'error_description' => $attachment_id->get_error_message() );
			} else {
				$attachment = get_post( $attachment_id );
				$uploaded_files[$index] = (object) array(
					'id'   => (string) $attachment_id,
					'file' => $attachment->post_title,
					'url'  => wp_get_attachment_url( $attachment_id ),
					'type' => $attachment->post_mime_type,
					'meta' => wp_get_attachment_metadata( $attachment_id ),
				);
				// Zip files uploads are not supported unless they are done for installation purposed
				// lets delete them in case something goes wrong in this whole process
				if ( 'application/zip' === $attachment->post_mime_type ) {
					// Schedule a cleanup for 2 hours from now in case of failed install.
					wp_schedule_single_event( time() + 2 * HOUR_IN_SECONDS, 'upgrader_scheduled_cleanup', array( $attachment_id ) );
				}
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
				'id'		=> 'home',
				'title'		=> __( 'Home', 'jetpack' ),
				'content'	=>
					'<p><strong>' . __( 'Jetpack by WordPress.com', 'jetpack' ) . '</strong></p>' .
					'<p>' . __( 'Jetpack supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.', 'jetpack' ) . '</p>' .
					'<p>' . __( 'On this page, you are able to view the modules available within Jetpack, learn more about them, and activate or deactivate them as needed.', 'jetpack' ) . '</p>',
			)
		);

		// Screen Content
		if ( current_user_can( 'manage_options' ) ) {
			$current_screen->add_help_tab(
				array(
					'id'		=> 'settings',
					'title'		=> __( 'Settings', 'jetpack' ),
					'content'	=>
						'<p><strong>' . __( 'Jetpack by WordPress.com',                                              'jetpack' ) . '</strong></p>' .
						'<p>' . __( 'You can activate or deactivate individual Jetpack modules to suit your needs.', 'jetpack' ) . '</p>' .
						'<ol>' .
							'<li>' . __( 'Each module has an Activate or Deactivate link so you can toggle one individually.',														'jetpack' ) . '</li>' .
							'<li>' . __( 'Using the checkboxes next to each module, you can select multiple modules to toggle via the Bulk Actions menu at the top of the list.',	'jetpack' ) . '</li>' .
						'</ol>' .
						'<p>' . __( 'Using the tools on the right, you can search for specific modules, filter by module categories or which are active, or change the sorting order.', 'jetpack' ) . '</p>'
				)
			);
		}

		// Help Sidebar
		$current_screen->set_help_sidebar(
			'<p><strong>' . __( 'For more information:', 'jetpack' ) . '</strong></p>' .
			'<p><a href="https://jetpack.com/faq/" target="_blank">'     . __( 'Jetpack FAQ',     'jetpack' ) . '</a></p>' .
			'<p><a href="https://jetpack.com/support/" target="_blank">' . __( 'Jetpack Support', 'jetpack' ) . '</a></p>' .
			'<p><a href="' . Jetpack::admin_url( array( 'page' => 'jetpack-debugger' )  ) .'">' . __( 'Jetpack Debugging Center', 'jetpack' ) . '</a></p>'
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

	function admin_head() {
		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) )
			/** This action is documented in class.jetpack-admin-page.php */
			do_action( 'jetpack_module_configuration_head_' . $_GET['configure'] );
	}

	function admin_banner_styles() {
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		if ( ! wp_style_is( 'jetpack-dops-style' ) ) {
			wp_register_style(
				'jetpack-dops-style',
				plugins_url( '_inc/build/admin.dops-style.css', JETPACK__PLUGIN_FILE ),
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

		$jetpack_home = array( 'jetpack-home' => sprintf( '<a href="%s">%s</a>', Jetpack::admin_url( 'page=jetpack' ), __( 'Jetpack', 'jetpack' ) ) );

		if( current_user_can( 'jetpack_manage_modules' ) && ( Jetpack::is_active() || Jetpack::is_development_mode() ) ) {
			return array_merge(
				$jetpack_home,
				array( 'settings' => sprintf( '<a href="%s">%s</a>', Jetpack::admin_url( 'page=jetpack#/settings' ), __( 'Settings', 'jetpack' ) ) ),
				array( 'support' => sprintf( '<a href="%s">%s</a>', Jetpack::admin_url( 'page=jetpack-debugger '), __( 'Support', 'jetpack' ) ) ),
				$actions
				);
			}

		return array_merge( $jetpack_home, $actions );
	}

	/**
	 * This is the first banner
	 * It should be visible only to user that can update the option
	 * Are not connected
	 *
	 * @return null
	 */
	function admin_jetpack_manage_notice() {
		$screen = get_current_screen();

		// Don't show the connect notice on the jetpack settings page.
		if ( ! in_array( $screen->base, array( 'dashboard' ) ) || $screen->is_network || $screen->action ) {
			return;
		}

		$opt_out_url = $this->opt_out_jetpack_manage_url();
		$opt_in_url  = $this->opt_in_jetpack_manage_url();
		/**
		 * I think it would be great to have different wordsing depending on where you are
		 * for example if we show the notice on dashboard and a different one if we show it on Plugins screen
		 * etc..
		 */

		?>
		<div id="message" class="updated jp-banner">
				<a href="<?php echo esc_url( $opt_out_url ); ?>" class="notice-dismiss" title="<?php esc_attr_e( 'Dismiss this notice', 'jetpack' ); ?>"></a>
				<div class="jp-banner__description-container">
					<h2 class="jp-banner__header"><?php esc_html_e( 'Jetpack Centralized Site Management', 'jetpack' ); ?></h2>
					<p class="jp-banner__description"><?php printf( __( 'Manage multiple Jetpack enabled sites from one single dashboard at wordpress.com. Allows all existing, connected Administrators to modify your site.', 'jetpack' ), 'https://jetpack.com/support/site-management' ); ?></p>
					<p class="jp-banner__button-container">
						<a href="<?php echo esc_url( $opt_in_url ); ?>" class="button button-primary" id="wpcom-connect"><?php _e( 'Activate Jetpack Manage', 'jetpack' ); ?></a>
						<a href="https://jetpack.com/support/site-management" class="button" target="_blank" title="<?php esc_attr_e( 'Learn more about Jetpack Manage on Jetpack.com', 'jetpack' ); ?>"><?php _e( 'Learn more', 'jetpack' ); ?></a>
					</p>
				</div>
		</div>
		<?php
	}

	/**
	 * Returns the url that the user clicks to remove the notice for the big banner
	 * @return string
	 */
	function opt_out_jetpack_manage_url() {
		$referer = '&_wp_http_referer=' . add_query_arg( '_wp_http_referer', null );
		return wp_nonce_url( Jetpack::admin_url( 'jetpack-notice=jetpack-manage-opt-out' . $referer ), 'jetpack_manage_banner_opt_out' );
	}
	/**
	 * Returns the url that the user clicks to opt in to Jetpack Manage
	 * @return string
	 */
	function opt_in_jetpack_manage_url() {
		return wp_nonce_url( Jetpack::admin_url( 'jetpack-notice=jetpack-manage-opt-in' ), 'jetpack_manage_banner_opt_in' );
	}

	function opt_in_jetpack_manage_notice() {
		?>
		<div class="wrap">
			<div id="message" class="jetpack-message is-opt-in">
				<?php echo sprintf( __( '<p><a href="%1$s" title="Opt in to WordPress.com Site Management" >Activate Site Management</a> to manage multiple sites from our centralized dashboard at wordpress.com/sites. <a href="%2$s" target="_blank">Learn more</a>.</p><a href="%1$s" class="jp-button">Activate Now</a>', 'jetpack' ), $this->opt_in_jetpack_manage_url(), 'https://jetpack.com/support/site-management' ); ?>
			</div>
		</div>
		<?php

	}
	/**
	 * Determines whether to show the notice of not true = display notice
	 * @return bool
	 */
	function can_display_jetpack_manage_notice() {
		// never display the notice to users that can't do anything about it anyways
		if( ! current_user_can( 'jetpack_manage_modules' ) )
			return false;

		// don't display if we are in development more
		if( Jetpack::is_development_mode() ) {
			return false;
		}
		// don't display if the site is private
		if(  ! Jetpack_Options::get_option( 'public' ) )
			return false;

		/**
		 * Should the Jetpack Remote Site Management notice be displayed.
		 *
		 * @since 3.3.0
		 *
		 * @param bool ! self::is_module_active( 'manage' ) Is the Manage module inactive.
		 */
		return apply_filters( 'can_display_jetpack_manage_notice', ! self::is_module_active( 'manage' ) );
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
	 *		- Jetpack_Client_Server::authorize()
	 *		- Jetpack_Client_Server::get_token()
	 *		- GET https://jetpack.wordpress.com/jetpack.token/1/ with
	 *        client_id, client_secret, grant_type, code, redirect_uri:action=authorize, state, scope, user_email, user_login
	 *			- which responds with access_token, token_type, scope
	 *		- Jetpack_Client_Server::authorize() stores jetpack_options: user_token => access_token.$user_id
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
		add_filter( 'admin_body_class', array( __CLASS__, 'add_jetpack_pagestyles' ) );

		if ( ! empty( $_GET['jetpack_restate'] ) ) {
			// Should only be used in intermediate redirects to preserve state across redirects
			Jetpack::restate();
		}

		if ( isset( $_GET['connect_url_redirect'] ) ) {
			// User clicked in the iframe to link their accounts
			if ( ! Jetpack::is_user_connected() ) {
				$connect_url = $this->build_connect_url( true, false, 'iframe' );
				if ( isset( $_GET['notes_iframe'] ) )
					$connect_url .= '&notes_iframe';
				wp_redirect( $connect_url );
				exit;
			} else {
				if ( ! isset( $_GET['calypso_env'] ) ) {
					Jetpack::state( 'message', 'already_authorized' );
					wp_safe_redirect( Jetpack::admin_url() );
					exit;
				} else {
					$connect_url = $this->build_connect_url( true, false, 'iframe' );
					$connect_url .= '&already_authorized=true';
					wp_redirect( $connect_url );
					exit;
				}
			}
		}


		if ( isset( $_GET['action'] ) ) {
			switch ( $_GET['action'] ) {
			case 'authorize':
				if ( Jetpack::is_active() && Jetpack::is_user_connected() ) {
					Jetpack::state( 'message', 'already_authorized' );
					wp_safe_redirect( Jetpack::admin_url() );
					exit;
				}
				Jetpack::log( 'authorize' );
				$client_server = new Jetpack_Client_Server;
				$client_server->client_authorize();
				exit;
			case 'register' :
				if ( ! current_user_can( 'jetpack_connect' ) ) {
					$error = 'cheatin';
					break;
				}
				check_admin_referer( 'jetpack-register' );
				Jetpack::log( 'register' );
				Jetpack::maybe_set_version_option();
				$registered = Jetpack::try_registration();
				if ( is_wp_error( $registered ) ) {
					$error = $registered->get_error_code();
					Jetpack::state( 'error', $error );
					Jetpack::state( 'error', $registered->get_error_message() );
					JetpackTracking::record_user_event( 'jpc_register_fail', array(
						'error_code' => $error,
						'error_message' => $registered->get_error_message()
					) );
					break;
				}

				$from = isset( $_GET['from'] ) ? $_GET['from'] : false;
				$redirect = isset( $_GET['redirect'] ) ? $_GET['redirect'] : false;

				JetpackTracking::record_user_event( 'jpc_register_success', array(
					'from' => $from
				) );

				wp_redirect( $this->build_connect_url( true, $redirect, $from ) );
				exit;
			case 'activate' :
				if ( ! current_user_can( 'jetpack_activate_modules' ) ) {
					$error = 'cheatin';
					break;
				}

				$module = stripslashes( $_GET['module'] );
				check_admin_referer( "jetpack_activate-$module" );
				Jetpack::log( 'activate', $module );
				Jetpack::activate_module( $module );
				// The following two lines will rarely happen, as Jetpack::activate_module normally exits at the end.
				wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
				exit;
			case 'activate_default_modules' :
				check_admin_referer( 'activate_default_modules' );
				Jetpack::log( 'activate_default_modules' );
				Jetpack::restate();
				$min_version   = isset( $_GET['min_version'] ) ? $_GET['min_version'] : false;
				$max_version   = isset( $_GET['max_version'] ) ? $_GET['max_version'] : false;
				$other_modules = isset( $_GET['other_modules'] ) && is_array( $_GET['other_modules'] ) ? $_GET['other_modules'] : array();
				Jetpack::activate_default_modules( $min_version, $max_version, $other_modules );
				wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
				exit;
			case 'disconnect' :
				if ( ! current_user_can( 'jetpack_disconnect' ) ) {
					$error = 'cheatin';
					break;
				}

				check_admin_referer( 'jetpack-disconnect' );
				Jetpack::log( 'disconnect' );
				Jetpack::disconnect();
				wp_safe_redirect( Jetpack::admin_url( 'disconnected=true' ) );
				exit;
			case 'reconnect' :
				if ( ! current_user_can( 'jetpack_reconnect' ) ) {
					$error = 'cheatin';
					break;
				}

				check_admin_referer( 'jetpack-reconnect' );
				Jetpack::log( 'reconnect' );
				$this->disconnect();
				wp_redirect( $this->build_connect_url( true, false, 'reconnect' ) );
				exit;
			case 'deactivate' :
				if ( ! current_user_can( 'jetpack_deactivate_modules' ) ) {
					$error = 'cheatin';
					break;
				}

				$modules = stripslashes( $_GET['module'] );
				check_admin_referer( "jetpack_deactivate-$modules" );
				foreach ( explode( ',', $modules ) as $module ) {
					Jetpack::log( 'deactivate', $module );
					Jetpack::deactivate_module( $module );
					Jetpack::state( 'message', 'module_deactivated' );
				}
				Jetpack::state( 'module', $modules );
				wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
				exit;
			case 'unlink' :
				$redirect = isset( $_GET['redirect'] ) ? $_GET['redirect'] : '';
				check_admin_referer( 'jetpack-unlink' );
				Jetpack::log( 'unlink' );
				$this->unlink_user();
				Jetpack::state( 'message', 'unlinked' );
				if ( 'sub-unlink' == $redirect ) {
					wp_safe_redirect( admin_url() );
				} else {
					wp_safe_redirect( Jetpack::admin_url( array( 'page' => $redirect ) ) );
				}
				exit;
			case 'onboard' :
				if ( ! current_user_can( 'manage_options' ) ) {
					wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
				} else {
					Jetpack::create_onboarding_token();
					$url = $this->build_connect_url( true );
					$calypso_env = ! empty( $_GET[ 'calypso_env' ] ) ? $_GET[ 'calypso_env' ] : false;
					if ( $calypso_env ) {
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

		if ( ! $error = $error ? $error : Jetpack::state( 'error' ) ) {
			self::activate_new_modules( true );
		}

		$message_code = Jetpack::state( 'message' );
		if ( Jetpack::state( 'optin-manage' ) ) {
			$activated_manage = $message_code;
			$message_code = 'jetpack-manage';
		}

		switch ( $message_code ) {
		case 'jetpack-manage':
			$this->message = '<strong>' . sprintf( __( 'You are all set! Your site can now be managed from <a href="%s" target="_blank">wordpress.com/sites</a>.', 'jetpack' ), 'https://wordpress.com/sites' ) . '</strong>';
			if ( $activated_manage ) {
				$this->message .= '<br /><strong>' . __( 'Manage has been activated for you!', 'jetpack'  ) . '</strong>';
			}
			break;

		}

		$deactivated_plugins = Jetpack::state( 'deactivated_plugins' );

		if ( ! empty( $deactivated_plugins ) ) {
			$deactivated_plugins = explode( ',', $deactivated_plugins );
			$deactivated_titles  = array();
			foreach ( $deactivated_plugins as $deactivated_plugin ) {
				if ( ! isset( $this->plugins_to_deactivate[$deactivated_plugin] ) ) {
					continue;
				}

				$deactivated_titles[] = '<strong>' . str_replace( ' ', '&nbsp;', $this->plugins_to_deactivate[$deactivated_plugin][1] ) . '</strong>';
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

		$this->privacy_checks = Jetpack::state( 'privacy_checks' );

		if ( $this->message || $this->error || $this->privacy_checks || $this->can_display_jetpack_manage_notice() ) {
			add_action( 'jetpack_notices', array( $this, 'admin_notices' ) );
		}

		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) ) {
			/**
			 * Fires when a module configuration page is loaded.
			 * The dynamic part of the hook is the configure parameter from the URL.
			 *
			 * @since 1.1.0
			 */
			do_action( 'jetpack_module_configuration_load_' . $_GET['configure'] );
		}

		add_filter( 'jetpack_short_module_description', 'wptexturize' );
	}

	function admin_notices() {

		if ( $this->error ) {
?>
<div id="message" class="jetpack-message jetpack-err">
	<div class="squeezer">
		<h2><?php echo wp_kses( $this->error, array( 'a' => array( 'href' => array() ), 'small' => true, 'code' => true, 'strong' => true, 'br' => true, 'b' => true ) ); ?></h2>
<?php	if ( $desc = Jetpack::state( 'error_description' ) ) : ?>
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
		<h2><?php echo wp_kses( $this->message, array( 'strong' => array(), 'a' => array( 'href' => true ), 'br' => true ) ); ?></h2>
	</div>
</div>
<?php
		}

		if ( $this->privacy_checks ) :
			$module_names = $module_slugs = array();

			$privacy_checks = explode( ',', $this->privacy_checks );
			$privacy_checks = array_filter( $privacy_checks, array( 'Jetpack', 'is_module' ) );
			foreach ( $privacy_checks as $module_slug ) {
				$module = Jetpack::get_module( $module_slug );
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
		<p><?php
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
						Jetpack::admin_url(
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
				array( 'a' => array( 'href' => true, 'title' => true ) )
			);
		?></p>
	</div>
</div>
<?php endif;
	// only display the notice if the other stuff is not there
	if( $this->can_display_jetpack_manage_notice() && !  $this->error && ! $this->message && ! $this->privacy_checks ) {
		if( isset( $_GET['page'] ) && 'jetpack' != $_GET['page'] )
			$this->opt_in_jetpack_manage_notice();
		}
	}

	/**
	 * Record a stat for later output.  This will only currently output in the admin_footer.
	 */
	function stat( $group, $detail ) {
		if ( ! isset( $this->stats[ $group ] ) )
			$this->stats[ $group ] = array();
		$this->stats[ $group ][] = $detail;
	}

	/**
	 * Load stats pixels. $group is auto-prefixed with "x_jetpack-"
	 */
	function do_stats( $method = '' ) {
		if ( is_array( $this->stats ) && count( $this->stats ) ) {
			foreach ( $this->stats as $group => $stats ) {
				if ( is_array( $stats ) && count( $stats ) ) {
					$args = array( "x_jetpack-{$group}" => implode( ',', $stats ) );
					if ( 'server_side' === $method ) {
						self::do_server_side_stat( $args );
					} else {
						echo '<img src="' . esc_url( self::build_stats_url( $args ) ) . '" width="1" height="1" style="display:none;" />';
					}
				}
				unset( $this->stats[ $group ] );
			}
		}
	}

	/**
	 * Runs stats code for a one-off, server-side.
	 *
	 * @param $args array|string The arguments to append to the URL. Should include `x_jetpack-{$group}={$stats}` or whatever we want to store.
	 *
	 * @return bool If it worked.
	 */
	static function do_server_side_stat( $args ) {
		$response = wp_remote_get( esc_url_raw( self::build_stats_url( $args ) ) );
		if ( is_wp_error( $response ) )
			return false;

		if ( 200 !== wp_remote_retrieve_response_code( $response ) )
			return false;

		return true;
	}

	/**
	 * Builds the stats url.
	 *
	 * @param $args array|string The arguments to append to the URL.
	 *
	 * @return string The URL to be pinged.
	 */
	static function build_stats_url( $args ) {
		$defaults = array(
			'v'    => 'wpcom2',
			'rand' => md5( mt_rand( 0, 999 ) . time() ),
		);
		$args     = wp_parse_args( $args, $defaults );
		/**
		 * Filter the URL used as the Stats tracking pixel.
		 *
		 * @since 2.3.2
		 *
		 * @param string $url Base URL used as the Stats tracking pixel.
		 */
		$base_url = apply_filters(
			'jetpack_stats_base_url',
			'https://pixel.wp.com/g.gif'
		);
		$url      = add_query_arg( $args, $base_url );
		return $url;
	}

	static function translate_current_user_to_role() {
		foreach ( self::$capability_translations as $role => $cap ) {
			if ( current_user_can( $role ) || current_user_can( $cap ) ) {
				return $role;
			}
		}

		return false;
	}

	static function translate_user_to_role( $user ) {
		foreach ( self::$capability_translations as $role => $cap ) {
			if ( user_can( $user, $role ) || user_can( $user, $cap ) ) {
				return $role;
			}
		}

		return false;
    }

	static function translate_role_to_cap( $role ) {
		if ( ! isset( self::$capability_translations[$role] ) ) {
			return false;
		}

		return self::$capability_translations[$role];
	}

	static function sign_role( $role, $user_id = null ) {
		if ( empty( $user_id ) ) {
			$user_id = (int) get_current_user_id();
		}

		if ( ! $user_id  ) {
			return false;
		}

		$token = Jetpack_Data::get_access_token();
		if ( ! $token || is_wp_error( $token ) ) {
			return false;
		}

		return $role . ':' . hash_hmac( 'md5', "{$role}|{$user_id}", $token->secret );
	}


	/**
	 * Builds a URL to the Jetpack connection auth page
	 *
	 * @since 3.9.5
	 *
	 * @param bool $raw If true, URL will not be escaped.
	 * @param bool|string $redirect If true, will redirect back to Jetpack wp-admin landing page after connection.
	 *                              If string, will be a custom redirect.
	 * @param bool|string $from If not false, adds 'from=$from' param to the connect URL.
	 * @param bool $register If true, will generate a register URL regardless of the existing token, since 4.9.0
	 *
	 * @return string Connect URL
	 */
	function build_connect_url( $raw = false, $redirect = false, $from = false, $register = false ) {
		$site_id = Jetpack_Options::get_option( 'id' );
		$token = Jetpack_Options::get_option( 'blog_token' );

		if ( $register || ! $token || ! $site_id ) {
			$url = Jetpack::nonce_url_no_esc( Jetpack::admin_url( 'action=register' ), 'jetpack-register' );

			if ( ! empty( $redirect ) ) {
				$url = add_query_arg(
					'redirect',
					urlencode( wp_validate_redirect( esc_url_raw( $redirect ) ) ),
					$url
				);
			}

			if( is_network_admin() ) {
				$url = add_query_arg( 'is_multisite', network_admin_url( 'admin.php?page=jetpack-settings' ), $url );
			}
		} else {

			// Let's check the existing blog token to see if we need to re-register. We only check once per minute
			// because otherwise this logic can get us in to a loop.
			$last_connect_url_check = intval( Jetpack_Options::get_raw_option( 'jetpack_last_connect_url_check' ) );
			if ( ! $last_connect_url_check || ( time() - $last_connect_url_check ) > MINUTE_IN_SECONDS ) {
				Jetpack_Options::update_raw_option( 'jetpack_last_connect_url_check', time() );

				$response = Jetpack_Client::wpcom_json_api_request_as_blog(
					sprintf( '/sites/%d', $site_id ) .'?force=wpcom',
					'1.1'
				);

				if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
					// Generating a register URL instead to refresh the existing token
					return $this->build_connect_url( $raw, $redirect, $from, true );
				}
			}

			if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && include_once JETPACK__GLOTPRESS_LOCALES_PATH ) {
				$gp_locale = GP_Locales::by_field( 'wp_locale', get_locale() );
			}

			$role = self::translate_current_user_to_role();
			$signed_role = self::sign_role( $role );

			$user = wp_get_current_user();

			$jetpack_admin_page = esc_url_raw( admin_url( 'admin.php?page=jetpack' ) );
			$redirect = $redirect
				? wp_validate_redirect( esc_url_raw( $redirect ), $jetpack_admin_page )
				: $jetpack_admin_page;

			if( isset( $_REQUEST['is_multisite'] ) ) {
				$redirect = Jetpack_Network::init()->get_url( 'network_admin_page' );
			}

			$secrets = Jetpack::generate_secrets( 'authorize', false, 2 * HOUR_IN_SECONDS );

			$site_icon = ( function_exists( 'has_site_icon') && has_site_icon() )
				? get_site_icon_url()
				: false;

			/**
			 * Filter the type of authorization.
			 * 'calypso' completes authorization on wordpress.com/jetpack/connect
			 * while 'jetpack' ( or any other value ) completes the authorization at jetpack.wordpress.com.
			 *
			 * @since 4.3.3
			 *
			 * @param string $auth_type Defaults to 'calypso', can also be 'jetpack'.
			 */
			$auth_type = apply_filters( 'jetpack_auth_type', 'calypso' );

			$tracks_identity = jetpack_tracks_get_identity( get_current_user_id() );

			$args = urlencode_deep(
				array(
					'response_type' => 'code',
					'client_id'     => Jetpack_Options::get_option( 'id' ),
					'redirect_uri'  => add_query_arg(
						array(
							'action'   => 'authorize',
							'_wpnonce' => wp_create_nonce( "jetpack-authorize_{$role}_{$redirect}" ),
							'redirect' => urlencode( $redirect ),
						),
						esc_url( admin_url( 'admin.php?page=jetpack' ) )
					),
					'state'         => $user->ID,
					'scope'         => $signed_role,
					'user_email'    => $user->user_email,
					'user_login'    => $user->user_login,
					'is_active'     => Jetpack::is_active(),
					'jp_version'    => JETPACK__VERSION,
					'auth_type'     => $auth_type,
					'secret'        => $secrets['secret_1'],
					'locale'        => ( isset( $gp_locale ) && isset( $gp_locale->slug ) ) ? $gp_locale->slug : '',
					'blogname'      => get_option( 'blogname' ),
					'site_url'      => site_url(),
					'home_url'      => home_url(),
					'site_icon'     => $site_icon,
					'site_lang'     => get_locale(),
					'_ui'           => $tracks_identity['_ui'],
					'_ut'           => $tracks_identity['_ut']
				)
			);

			self::apply_activation_source_to_args( $args );

			$url = add_query_arg( $args, Jetpack::api_url( 'authorize' ) );
		}

		if ( $from ) {
			$url = add_query_arg( 'from', $from, $url );
		}


		if ( isset( $_GET['calypso_env'] ) ) {
			$url = add_query_arg( 'calypso_env', sanitize_key( $_GET['calypso_env'] ), $url );
		}

		if ( false !== ( $token = Jetpack_Options::get_option( 'onboarding' ) ) ) {
			$url = add_query_arg( 'onboarding', $token, $url );

			// Remove this once https://github.com/Automattic/wp-calypso/pull/17094 is merged.
			// Uncomment for development until it's merged.
			//$url = add_query_arg( 'calypso_env', 'development', $url );
		}

		return $raw ? $url : esc_url( $url );
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
		$url = wp_nonce_url( Jetpack::admin_url( 'action=reconnect' ), 'jetpack-reconnect' );
		return $raw ? $url : esc_url( $url );
	}

	public static function admin_url( $args = null ) {
		$args = wp_parse_args( $args, array( 'page' => 'jetpack' ) );
		$url = add_query_arg( $args, admin_url( 'admin.php' ) );
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

		switch( $_GET['jetpack-notice'] ) {
			case 'dismiss':
				if ( check_admin_referer( 'jetpack-deactivate' ) && ! is_plugin_active_for_network( plugin_basename( JETPACK__PLUGIN_DIR . 'jetpack.php' ) ) ) {

					require_once ABSPATH . 'wp-admin/includes/plugin.php';
					deactivate_plugins( JETPACK__PLUGIN_DIR . 'jetpack.php', false, false );
					wp_safe_redirect( admin_url() . 'plugins.php?deactivate=true&plugin_status=all&paged=1&s=' );
				}
				break;
			case 'jetpack-manage-opt-out':

				if ( check_admin_referer( 'jetpack_manage_banner_opt_out' ) ) {
					// Don't show the banner again

					Jetpack_Options::update_option( 'dismissed_manage_banner', true );
					// redirect back to the page that had the notice
					if ( wp_get_referer() ) {
						wp_safe_redirect( wp_get_referer() );
					} else {
						// Take me to Jetpack
						wp_safe_redirect( admin_url( 'admin.php?page=jetpack' ) );
					}
				}
				break;
			case 'jetpack-protect-multisite-opt-out':

				if ( check_admin_referer( 'jetpack_protect_multisite_banner_opt_out' ) ) {
					// Don't show the banner again

					update_site_option( 'jetpack_dismissed_protect_multisite_banner', true );
					// redirect back to the page that had the notice
					if ( wp_get_referer() ) {
						wp_safe_redirect( wp_get_referer() );
					} else {
						// Take me to Jetpack
						wp_safe_redirect( admin_url( 'admin.php?page=jetpack' ) );
					}
				}
				break;
			case 'jetpack-manage-opt-in':
				if ( check_admin_referer( 'jetpack_manage_banner_opt_in' ) ) {
					// This makes sure that we are redirect to jetpack home so that we can see the Success Message.

					$redirection_url = Jetpack::admin_url();
					remove_action( 'jetpack_pre_activate_module',   array( Jetpack_Admin::init(), 'fix_redirect' ) );

					// Don't redirect form the Jetpack Setting Page
					$referer_parsed = parse_url ( wp_get_referer() );
					// check that we do have a wp_get_referer and the query paramater is set orderwise go to the Jetpack Home
					if ( isset( $referer_parsed['query'] ) && false !== strpos( $referer_parsed['query'], 'page=jetpack_modules' ) ) {
						// Take the user to Jetpack home except when on the setting page
						$redirection_url = wp_get_referer();
						add_action( 'jetpack_pre_activate_module',   array( Jetpack_Admin::init(), 'fix_redirect' ) );
					}
					// Also update the JSON API FULL MANAGEMENT Option
					Jetpack::activate_module( 'manage', false, false );

					// Special Message when option in.
					Jetpack::state( 'optin-manage', 'true' );
					// Activate the Module if not activated already

					// Redirect properly
					wp_safe_redirect( $redirection_url );

				}
				break;
		}
	}

	public static function admin_screen_configure_module( $module_id ) {

		// User that doesn't have 'jetpack_configure_modules' will never end up here since Jetpack Landing Page woun't let them.
		if ( ! in_array( $module_id, Jetpack::get_active_modules() ) && current_user_can( 'manage_options' ) ) {
			if ( has_action( 'display_activate_module_setting_' . $module_id ) ) {
				/**
				 * Fires to diplay a custom module activation screen.
				 *
				 * To add a module actionation screen use Jetpack::module_configuration_activation_screen method.
				 * Example: Jetpack::module_configuration_activation_screen( 'manage', array( $this, 'manage_activate_screen' ) );
				 *
				 * @module manage
				 *
				 * @since 3.8.0
				 *
				 * @param int $module_id Module ID.
				 */
				do_action( 'display_activate_module_setting_' . $module_id );
			} else {
				self::display_activate_module_link( $module_id );
			}

			return false;
		} ?>

		<div id="jp-settings-screen" style="position: relative">
			<h3>
			<?php
				$module = Jetpack::get_module( $module_id );
				echo '<a href="' . Jetpack::admin_url( 'page=jetpack_modules' ) . '">' . __( 'Jetpack by WordPress.com', 'jetpack' ) . '</a> &rarr; ';
				printf( __( 'Configure %s', 'jetpack' ), $module['name'] );
			?>
			</h3>
			<?php
				/**
				 * Fires within the displayed message when a feature configuation is updated.
				 *
				 * @since 3.4.0
				 *
				 * @param int $module_id Module ID.
				 */
				do_action( 'jetpack_notices_update_settings', $module_id );
				/**
				 * Fires when a feature configuation screen is loaded.
				 * The dynamic part of the hook, $module_id, is the module ID.
				 *
				 * @since 1.1.0
				 */
				do_action( 'jetpack_module_configuration_screen_' . $module_id );
			?>
		</div><?php
	}

	/**
	 * Display link to activate the module to see the settings screen.
	 * @param  string $module_id
	 * @return null
	 */
	public static function display_activate_module_link( $module_id ) {

		$info =  Jetpack::get_module( $module_id );
		$extra = '';
		$activate_url = wp_nonce_url(
				Jetpack::admin_url(
					array(
						'page'   => 'jetpack',
						'action' => 'activate',
						'module' => $module_id,
					)
				),
				"jetpack_activate-$module_id"
			);

		?>

		<div class="wrap configure-module">
			<div id="jp-settings-screen">
				<?php
				if ( $module_id == 'json-api' ) {

					$info['name'] = esc_html__( 'Activate Site Management and JSON API', 'jetpack' );

					$activate_url = Jetpack::init()->opt_in_jetpack_manage_url();

					$info['description'] = sprintf( __( 'Manage your multiple Jetpack sites from our centralized dashboard at wordpress.com/sites. <a href="%s" target="_blank">Learn more</a>.', 'jetpack' ), 'https://jetpack.com/support/site-management' );

					// $extra = __( 'To use Site Management, you need to first activate JSON API to allow remote management of your site. ', 'jetpack' );
				} ?>

				<h3><?php echo esc_html( $info['name'] ); ?></h3>
				<div class="narrow">
					<p><?php echo  $info['description']; ?></p>
					<?php if( $extra ) { ?>
					<p><?php echo esc_html( $extra ); ?></p>
					<?php } ?>
					<p>
						<?php
						if( wp_get_referer() ) {
							printf( __( '<a class="button-primary" href="%s">Activate Now</a> or <a href="%s" >return to previous page</a>.', 'jetpack' ) , $activate_url, wp_get_referer() );
						} else {
							printf( __( '<a class="button-primary" href="%s">Activate Now</a>', 'jetpack' ) , $activate_url  );
						} ?>
					</p>
				</div>

			</div>
		</div>

		<?php
	}

	public static function sort_modules( $a, $b ) {
		if ( $a['sort'] == $b['sort'] )
			return 0;

		return ( $a['sort'] < $b['sort'] ) ? -1 : 1;
	}

	function ajax_recheck_ssl() {
		check_ajax_referer( 'recheck-ssl', 'ajax-nonce' );
		$result = Jetpack::permit_ssl( true );
		wp_send_json( array(
			'enabled' => $result,
			'message' => get_transient( 'jetpack_https_test_message' )
		) );
	}

/* Client API */

	/**
	 * Returns the requested Jetpack API URL
	 *
	 * @return string
	 */
	public static function api_url( $relative_url ) {
		return trailingslashit( JETPACK__API_BASE . $relative_url  ) . JETPACK__API_VERSION . '/';
	}

	/**
	 * Some hosts disable the OpenSSL extension and so cannot make outgoing HTTPS requsets
	 */
	public static function fix_url_for_bad_hosts( $url ) {
		if ( 0 !== strpos( $url, 'https://' ) ) {
			return $url;
		}

		switch ( JETPACK_CLIENT__HTTPS ) {
			case 'ALWAYS' :
				return $url;
			case 'NEVER' :
				return set_url_scheme( $url, 'http' );
			// default : case 'AUTO' :
		}

		// we now return the unmodified SSL URL by default, as a security precaution
		return $url;
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

		// Whitelist the action
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
				switch ( JETPACK_CLIENT__HTTPS ) {
					case 'NEVER':
						$ssl = 0;
						$message = __( 'JETPACK_CLIENT__HTTPS is set to NEVER', 'jetpack' );
						break;
					case 'ALWAYS':
					case 'AUTO':
					default:
						$ssl = 1;
						break;
				}

				// If it's not 'NEVER', test to see
				if ( $ssl ) {
					if ( ! wp_http_supports( array( 'ssl' => true ) ) ) {
						$ssl = 0;
						$message = __( 'WordPress reports no SSL support', 'jetpack' );
					} else {
						$response = wp_remote_get( JETPACK__API_BASE . 'test/1/' );
						if ( is_wp_error( $response ) ) {
							$ssl = 0;
							$message = __( 'WordPress reports no SSL support', 'jetpack' );
						} elseif ( 'OK' !== wp_remote_retrieve_body( $response ) ) {
							$ssl = 0;
							$message = __( 'Response was not OK: ', 'jetpack' ) . wp_remote_retrieve_body( $response );
						}
					}
				}
			}
			set_transient( 'jetpack_https_test', $ssl, DAY_IN_SECONDS );
			set_transient( 'jetpack_https_test_message', $message, DAY_IN_SECONDS );
		}

		return (bool) $ssl;
	}

	/*
	 * Displays an admin_notice, alerting the user to their JETPACK_CLIENT__HTTPS constant being 'AUTO' but SSL isn't working.
	 */
	public function alert_auto_ssl_fail() {
		if ( ! current_user_can( 'manage_options' ) )
			return;

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
					<?php printf( __( 'For more help, try our <a href="%1$s">connection debugger</a> or <a href="%2$s" target="_blank">troubleshooting tips</a>.', 'jetpack' ),
							esc_url( Jetpack::admin_url( array( 'page' => 'jetpack-debugger' )  ) ),
							esc_url( 'https://jetpack.com/support/getting-started-with-jetpack/troubleshooting-tips/' ) ); ?>
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
	 * @return string
	 */
	public static function xmlrpc_api_url() {
		$base = preg_replace( '#(https?://[^?/]+)(/?.*)?$#', '\\1', JETPACK__API_BASE );
		return untrailingslashit( $base ) . '/xmlrpc.php';
	}

	/**
	 * Creates two secret tokens and the end of life timestamp for them.
	 *
	 * Note these tokens are unique per call, NOT static per site for connecting.
	 *
	 * @since 2.6
	 * @return array
	 */
	public static function generate_secrets( $action, $user_id = false, $exp = 600 ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		$secret_name  = 'jetpack_' . $action . '_' . $user_id;
		$secrets      = Jetpack_Options::get_raw_option( 'jetpack_secrets', array() );

		if (
			isset( $secrets[ $secret_name ] ) &&
			$secrets[ $secret_name ]['exp'] > time()
		) {
			return $secrets[ $secret_name ];
		}

		$secret_value = array(
			'secret_1'  => wp_generate_password( 32, false ),
			'secret_2'  => wp_generate_password( 32, false ),
			'exp'       => time() + $exp,
		);

		$secrets[ $secret_name ] = $secret_value;

		Jetpack_Options::update_raw_option( 'jetpack_secrets', $secrets );
		return $secrets[ $secret_name ];
	}

	public static function get_secrets( $action, $user_id ) {
		$secret_name = 'jetpack_' . $action . '_' . $user_id;
		$secrets = Jetpack_Options::get_raw_option( 'jetpack_secrets', array() );

		if ( ! isset( $secrets[ $secret_name ] ) ) {
			return new WP_Error( 'verify_secrets_missing', 'Verification secrets not found' );
		}

		if ( $secrets[ $secret_name ]['exp'] < time() ) {
			self::delete_secrets( $action, $user_id );
			return new WP_Error( 'verify_secrets_expired', 'Verification took too long' );
		}

		return $secrets[ $secret_name ];
	}

	public static function delete_secrets( $action, $user_id ) {
		$secret_name = 'jetpack_' . $action . '_' . $user_id;
		$secrets = Jetpack_Options::get_raw_option( 'jetpack_secrets', array() );
		if ( isset( $secrets[ $secret_name ] ) ) {
			unset( $secrets[ $secret_name ] );
			Jetpack_Options::update_raw_option( 'jetpack_secrets', $secrets );
		}
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
		return Jetpack::get_max_execution_time();
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
	 * @return string|Jetpack_Error A JSON object on success or Jetpack_Error on failures
	 **/
	public function validate_remote_register_response( $response ) {
	  if ( is_wp_error( $response ) ) {
			return new Jetpack_Error( 'register_http_request_failed', $response->get_error_message() );
		}

		$code   = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );
		if ( $entity )
			$registration_response = json_decode( $entity );
		else
			$registration_response = false;

		$code_type = intval( $code / 100 );
		if ( 5 == $code_type ) {
			return new Jetpack_Error( 'wpcom_5??', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		} elseif ( 408 == $code ) {
			return new Jetpack_Error( 'wpcom_408', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		} elseif ( ! empty( $registration_response->error ) ) {
			if ( 'xml_rpc-32700' == $registration_response->error && ! function_exists( 'xml_parser_create' ) ) {
				$error_description = __( "PHP's XML extension is not available. Jetpack requires the XML extension to communicate with WordPress.com. Please contact your hosting provider to enable PHP's XML extension.", 'jetpack' );
			} else {
				$error_description = isset( $registration_response->error_description ) ? sprintf( __( 'Error Details: %s', 'jetpack' ), (string) $registration_response->error_description ) : '';
			}

			return new Jetpack_Error( (string) $registration_response->error, $error_description, $code );
		} elseif ( 200 != $code ) {
			return new Jetpack_Error( 'wpcom_bad_response', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		}

		// Jetpack ID error block
		if ( empty( $registration_response->jetpack_id ) ) {
			return new Jetpack_Error( 'jetpack_id', sprintf( __( 'Error Details: Jetpack ID is empty. Do not publicly post this error message! %s', 'jetpack' ), $entity ), $entity );
		} elseif ( ! is_scalar( $registration_response->jetpack_id ) ) {
			return new Jetpack_Error( 'jetpack_id', sprintf( __( 'Error Details: Jetpack ID is not a scalar. Do not publicly post this error message! %s', 'jetpack' ) , $entity ), $entity );
		} elseif ( preg_match( '/[^0-9]/', $registration_response->jetpack_id ) ) {
			return new Jetpack_Error( 'jetpack_id', sprintf( __( 'Error Details: Jetpack ID begins with a numeral. Do not publicly post this error message! %s', 'jetpack' ) , $entity ), $entity );
		}

	    return $registration_response;
	}
	/**
	 * @return bool|WP_Error
	 */
	public static function register() {
		JetpackTracking::record_user_event( 'jpc_register_begin' );
		add_action( 'pre_update_jetpack_option_register', array( 'Jetpack_Options', 'delete_option' ) );
		$secrets = Jetpack::generate_secrets( 'register' );

		if (
			empty( $secrets['secret_1'] ) ||
			empty( $secrets['secret_2'] ) ||
			empty( $secrets['exp'] )
		) {
			return new Jetpack_Error( 'missing_secrets' );
		}

		// better to try (and fail) to set a higher timeout than this system
		// supports than to have register fail for more users than it should
		$timeout = Jetpack::set_min_time_limit( 60 ) / 2;

		$gmt_offset = get_option( 'gmt_offset' );
		if ( ! $gmt_offset ) {
			$gmt_offset = 0;
		}

		$stats_options = get_option( 'stats_options' );
		$stats_id = isset($stats_options['blog_id']) ? $stats_options['blog_id'] : null;

		$tracks_identity = jetpack_tracks_get_identity( get_current_user_id() );

		$args = array(
			'method'  => 'POST',
			'body'    => array(
				'siteurl'         => site_url(),
				'home'            => home_url(),
				'gmt_offset'      => $gmt_offset,
				'timezone_string' => (string) get_option( 'timezone_string' ),
				'site_name'       => (string) get_option( 'blogname' ),
				'secret_1'        => $secrets['secret_1'],
				'secret_2'        => $secrets['secret_2'],
				'site_lang'       => get_locale(),
				'timeout'         => $timeout,
				'stats_id'        => $stats_id,
				'state'           => get_current_user_id(),
				'_ui'             => $tracks_identity['_ui'],
				'_ut'             => $tracks_identity['_ut'],
				'jetpack_version' => JETPACK__VERSION
			),
			'headers' => array(
				'Accept' => 'application/json',
			),
			'timeout' => $timeout,
		);

		self::apply_activation_source_to_args( $args['body'] );

		$response = Jetpack_Client::_wp_remote_request( Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'register' ) ), $args, true );

		// Make sure the response is valid and does not contain any Jetpack errors
		$registration_details = Jetpack::init()->validate_remote_register_response( $response );
		if ( is_wp_error( $registration_details ) ) {
			return $registration_details;
		} elseif ( ! $registration_details ) {
			return new Jetpack_Error( 'unknown_error', __( 'Unknown error registering your Jetpack site', 'jetpack' ), wp_remote_retrieve_response_code( $response ) );
		}

		if ( empty( $registration_details->jetpack_secret ) || ! is_string( $registration_details->jetpack_secret ) ) {
			return new Jetpack_Error( 'jetpack_secret', '', wp_remote_retrieve_response_code( $response ) );
		}

		if ( isset( $registration_details->jetpack_public ) ) {
			$jetpack_public = (int) $registration_details->jetpack_public;
		} else {
			$jetpack_public = false;
		}

		Jetpack_Options::update_options(
			array(
				'id'         => (int)    $registration_details->jetpack_id,
				'blog_token' => (string) $registration_details->jetpack_secret,
				'public'     => $jetpack_public,
			)
		);

		/**
		 * Fires when a site is registered on WordPress.com.
		 *
		 * @since 3.7.0
		 *
		 * @param int $json->jetpack_id Jetpack Blog ID.
		 * @param string $json->jetpack_secret Jetpack Blog Token.
		 * @param int|bool $jetpack_public Is the site public.
		 */
		do_action( 'jetpack_site_registered', $registration_details->jetpack_id, $registration_details->jetpack_secret, $jetpack_public );

		// Initialize Jump Start for the first and only time.
		if ( ! Jetpack_Options::get_option( 'jumpstart' ) ) {
			Jetpack_Options::update_option( 'jumpstart', 'new_connection' );

			$jetpack = Jetpack::init();

			$jetpack->stat( 'jumpstart', 'unique-views' );
			$jetpack->do_stats( 'server_side' );
		};

		return true;
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
	 * Loads the Jetpack XML-RPC client
	 */
	public static function load_xml_rpc_client() {
		require_once ABSPATH . WPINC . '/class-IXR.php';
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-ixr-client.php';
	}

	/**
	 * Resets the saved authentication state in between testing requests.
	 */
	public function reset_saved_auth_state() {
		$this->xmlrpc_verification = null;
		$this->rest_authentication_status = null;
	}

	function verify_xml_rpc_signature() {
		if ( $this->xmlrpc_verification ) {
			return $this->xmlrpc_verification;
		}

		// It's not for us
		if ( ! isset( $_GET['token'] ) || empty( $_GET['signature'] ) ) {
			return false;
		}

		@list( $token_key, $version, $user_id ) = explode( ':', $_GET['token'] );
		if (
			empty( $token_key )
		||
			empty( $version ) || strval( JETPACK__API_VERSION ) !== $version
		) {
			return false;
		}

		if ( '0' === $user_id ) {
			$token_type = 'blog';
			$user_id = 0;
		} else {
			$token_type = 'user';
			if ( empty( $user_id ) || ! ctype_digit( $user_id ) ) {
				return false;
			}
			$user_id = (int) $user_id;

			$user = new WP_User( $user_id );
			if ( ! $user || ! $user->exists() ) {
				return false;
			}
		}

		$token = Jetpack_Data::get_access_token( $user_id );
		if ( ! $token ) {
			return false;
		}

		$token_check = "$token_key.";
		if ( ! hash_equals( substr( $token->secret, 0, strlen( $token_check ) ), $token_check ) ) {
			return false;
		}

		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-signature.php';

		$jetpack_signature = new Jetpack_Signature( $token->secret, (int) Jetpack_Options::get_option( 'time_diff' ) );
		if ( isset( $_POST['_jetpack_is_multipart'] ) ) {
			$post_data   = $_POST;
			$file_hashes = array();
			foreach ( $post_data as $post_data_key => $post_data_value ) {
				if ( 0 !== strpos( $post_data_key, '_jetpack_file_hmac_' ) ) {
					continue;
				}
				$post_data_key = substr( $post_data_key, strlen( '_jetpack_file_hmac_' ) );
				$file_hashes[$post_data_key] = $post_data_value;
			}

			foreach ( $file_hashes as $post_data_key => $post_data_value ) {
				unset( $post_data["_jetpack_file_hmac_{$post_data_key}"] );
				$post_data[$post_data_key] = $post_data_value;
			}

			ksort( $post_data );

			$body = http_build_query( stripslashes_deep( $post_data ) );
		} elseif ( is_null( $this->HTTP_RAW_POST_DATA ) ) {
			$body = file_get_contents( 'php://input' );
		} else {
			$body = null;
		}

		$signature = $jetpack_signature->sign_current_request(
			array( 'body' => is_null( $body ) ? $this->HTTP_RAW_POST_DATA : $body, )
		);

		if ( ! $signature ) {
			return false;
		} else if ( is_wp_error( $signature ) ) {
			return $signature;
		} else if ( ! hash_equals( $signature, $_GET['signature'] ) ) {
			return false;
		}

		$timestamp = (int) $_GET['timestamp'];
		$nonce     = stripslashes( (string) $_GET['nonce'] );

		if ( ! $this->add_nonce( $timestamp, $nonce ) ) {
			return false;
		}

		// Let's see if this is onboarding. In such case, use user token type and the provided user id.
		if ( isset( $this->HTTP_RAW_POST_DATA ) ) {
			$jpo = json_decode( $this->HTTP_RAW_POST_DATA );
			if (
				isset( $jpo->onboarding ) &&
				isset( $jpo->onboarding->jpUser ) && isset( $jpo->onboarding->token ) &&
				is_email( $jpo->onboarding->jpUser ) && ctype_alnum( $jpo->onboarding->token ) &&
				isset( $_GET['rest_route'] ) &&
				self::validate_onboarding_token_action( $jpo->onboarding->token, $_GET['rest_route'] )
			) {
				$jpUser = get_user_by( 'email', $jpo->onboarding->jpUser );
				if ( is_a( $jpUser, 'WP_User' ) ) {
					wp_set_current_user( $jpUser->ID );
					$user_can = is_multisite()
						? current_user_can_for_blog( get_current_blog_id(), 'manage_options' )
						: current_user_can( 'manage_options' );
					if ( $user_can ) {
						$token_type = 'user';
						$token->external_user_id = $jpUser->ID;
					}
				}
			}
		}

		$this->xmlrpc_verification = array(
			'type'    => $token_type,
			'user_id' => $token->external_user_id,
		);

		return $this->xmlrpc_verification;
	}

	/**
	 * Authenticates XML-RPC and other requests from the Jetpack Server
	 */
	function authenticate_jetpack( $user, $username, $password ) {
		if ( is_a( $user, 'WP_User' ) ) {
			return $user;
		}

		$token_details = $this->verify_xml_rpc_signature();

		if ( ! $token_details || is_wp_error( $token_details ) ) {
			return $user;
		}

		if ( 'user' !== $token_details['type'] ) {
			return $user;
		}

		if ( ! $token_details['user_id'] ) {
			return $user;
		}

		nocache_headers();

		return new WP_User( $token_details['user_id'] );
	}

	// Authenticates requests from Jetpack server to WP REST API endpoints.
	// Uses the existing XMLRPC request signing implementation.
	function wp_rest_authenticate( $user ) {
		if ( ! empty( $user ) ) {
			// Another authentication method is in effect.
			return $user;
		}

		if ( ! isset( $_GET['_for'] ) || $_GET['_for'] !== 'jetpack' ) {
			// Nothing to do for this authentication method.
			return null;
		}

		if ( ! isset( $_GET['token'] ) && ! isset( $_GET['signature'] ) ) {
			// Nothing to do for this authentication method.
			return null;
		}

		// Ensure that we always have the request body available.  At this
		// point, the WP REST API code to determine the request body has not
		// run yet.  That code may try to read from 'php://input' later, but
		// this can only be done once per request in PHP versions prior to 5.6.
		// So we will go ahead and perform this read now if needed, and save
		// the request body where both the Jetpack signature verification code
		// and the WP REST API code can see it.
		if ( ! isset( $GLOBALS['HTTP_RAW_POST_DATA'] ) ) {
			$GLOBALS['HTTP_RAW_POST_DATA'] = file_get_contents( 'php://input' );
		}
		$this->HTTP_RAW_POST_DATA = $GLOBALS['HTTP_RAW_POST_DATA'];

		// Only support specific request parameters that have been tested and
		// are known to work with signature verification.  A different method
		// can be passed to the WP REST API via the '?_method=' parameter if
		// needed.
		if ( $_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST' ) {
			$this->rest_authentication_status = new WP_Error(
				'rest_invalid_request',
				__( 'This request method is not supported.', 'jetpack' ),
				array( 'status' => 400 )
			);
			return null;
		}
		if ( $_SERVER['REQUEST_METHOD'] !== 'POST' && ! empty( $this->HTTP_RAW_POST_DATA ) ) {
			$this->rest_authentication_status = new WP_Error(
				'rest_invalid_request',
				__( 'This request method does not support body parameters.', 'jetpack' ),
				array( 'status' => 400 )
			);
			return null;
		}

		if ( ! empty( $_SERVER['CONTENT_TYPE'] ) ) {
			$content_type = $_SERVER['CONTENT_TYPE'];
		} elseif ( ! empty( $_SERVER['HTTP_CONTENT_TYPE'] ) ) {
			$content_type = $_SERVER['HTTP_CONTENT_TYPE'];
		}

		if (
			isset( $content_type ) &&
			$content_type !== 'application/x-www-form-urlencoded' &&
			$content_type !== 'application/json'
		) {
			$this->rest_authentication_status = new WP_Error(
				'rest_invalid_request',
				__( 'This Content-Type is not supported.', 'jetpack' ),
				array( 'status' => 400 )
			);
			return null;
		}

		$verified = $this->verify_xml_rpc_signature();

		if ( is_wp_error( $verified ) ) {
			$this->rest_authentication_status = $verified;
			return null;
		}

		if (
			$verified &&
			isset( $verified['type'] ) &&
			'user' === $verified['type'] &&
			! empty( $verified['user_id'] )
		) {
			// Authentication successful.
			$this->rest_authentication_status = true;
			return $verified['user_id'];
		}

		// Something else went wrong.  Probably a signature error.
		$this->rest_authentication_status = new WP_Error(
			'rest_invalid_signature',
			__( 'The request is not signed correctly.', 'jetpack' ),
			array( 'status' => 400 )
		);
		return null;
	}

	/**
	 * Report authentication status to the WP REST API.
	 *
	 * @param  WP_Error|mixed $result Error from another authentication handler, null if we should handle it, or another value if not
	 * @return WP_Error|boolean|null {@see WP_JSON_Server::check_authentication}
	 */
	public function wp_rest_authentication_errors( $value ) {
		if ( $value !== null ) {
			return $value;
		}
		return $this->rest_authentication_status;
	}

	function add_nonce( $timestamp, $nonce ) {
		global $wpdb;
		static $nonces_used_this_request = array();

		if ( isset( $nonces_used_this_request["$timestamp:$nonce"] ) ) {
			return $nonces_used_this_request["$timestamp:$nonce"];
		}

		// This should always have gone through Jetpack_Signature::sign_request() first to check $timestamp an $nonce
		$timestamp = (int) $timestamp;
		$nonce     = esc_sql( $nonce );

		// Raw query so we can avoid races: add_option will also update
		$show_errors = $wpdb->show_errors( false );

		$old_nonce = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM `$wpdb->options` WHERE option_name = %s", "jetpack_nonce_{$timestamp}_{$nonce}" )
		);

		if ( is_null( $old_nonce ) ) {
			$return = $wpdb->query(
				$wpdb->prepare(
					"INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload`) VALUES (%s, %s, %s)",
					"jetpack_nonce_{$timestamp}_{$nonce}",
					time(),
					'no'
				)
			);
		} else {
			$return = false;
		}

		$wpdb->show_errors( $show_errors );

		$nonces_used_this_request["$timestamp:$nonce"] = $return;

		return $return;
	}

	/**
	 * In some setups, $HTTP_RAW_POST_DATA can be emptied during some IXR_Server paths since it is passed by reference to various methods.
	 * Capture it here so we can verify the signature later.
	 */
	function xmlrpc_methods( $methods ) {
		$this->HTTP_RAW_POST_DATA = $GLOBALS['HTTP_RAW_POST_DATA'];
		return $methods;
	}

	function public_xmlrpc_methods( $methods ) {
		if ( array_key_exists( 'wp.getOptions', $methods ) ) {
			$methods['wp.getOptions'] = array( $this, 'jetpack_getOptions' );
		}
		return $methods;
	}

	function jetpack_getOptions( $args ) {
		global $wp_xmlrpc_server;

		$wp_xmlrpc_server->escape( $args );

		$username	= $args[1];
		$password	= $args[2];

		if ( !$user = $wp_xmlrpc_server->login($username, $password) ) {
			return $wp_xmlrpc_server->error;
		}

		$options = array();
		$user_data = $this->get_connected_user_data();
		if ( is_array( $user_data ) ) {
			$options['jetpack_user_id'] = array(
				'desc'          => __( 'The WP.com user ID of the connected user', 'jetpack' ),
				'readonly'      => true,
				'value'         => $user_data['ID'],
			);
			$options['jetpack_user_login'] = array(
				'desc'          => __( 'The WP.com username of the connected user', 'jetpack' ),
				'readonly'      => true,
				'value'         => $user_data['login'],
			);
			$options['jetpack_user_email'] = array(
				'desc'          => __( 'The WP.com user email of the connected user', 'jetpack' ),
				'readonly'      => true,
				'value'         => $user_data['email'],
			);
			$options['jetpack_user_site_count'] = array(
				'desc'          => __( 'The number of sites of the connected WP.com user', 'jetpack' ),
				'readonly'      => true,
				'value'         => $user_data['site_count'],
			);
		}
		$wp_xmlrpc_server->blog_options = array_merge( $wp_xmlrpc_server->blog_options, $options );
		$args = stripslashes_deep( $args );
		return $wp_xmlrpc_server->wp_getOptions( $args );
	}

	function xmlrpc_options( $options ) {
		$jetpack_client_id = false;
		if ( self::is_active() ) {
			$jetpack_client_id = Jetpack_Options::get_option( 'id' );
		}
		$options['jetpack_version'] = array(
				'desc'          => __( 'Jetpack Plugin Version', 'jetpack' ),
				'readonly'      => true,
				'value'         => JETPACK__VERSION,
		);

		$options['jetpack_client_id'] = array(
				'desc'          => __( 'The Client ID/WP.com Blog ID of this site', 'jetpack' ),
				'readonly'      => true,
				'value'         => $jetpack_client_id,
		);
		return $options;
	}

	public static function clean_nonces( $all = false ) {
		global $wpdb;

		$sql = "DELETE FROM `$wpdb->options` WHERE `option_name` LIKE %s";
		$sql_args = array( $wpdb->esc_like( 'jetpack_nonce_' ) . '%' );

		if ( true !== $all ) {
			$sql .= ' AND CAST( `option_value` AS UNSIGNED ) < %d';
			$sql_args[] = time() - 3600;
		}

		$sql .= ' ORDER BY `option_id` LIMIT 100';

		$sql = $wpdb->prepare( $sql, $sql_args );

		for ( $i = 0; $i < 1000; $i++ ) {
			if ( ! $wpdb->query( $sql ) ) {
				break;
			}
		}
	}

	/**
	 * State is passed via cookies from one request to the next, but never to subsequent requests.
	 * SET: state( $key, $value );
	 * GET: $value = state( $key );
	 *
	 * @param string $key
	 * @param string $value
	 * @param bool $restate private
	 */
	public static function state( $key = null, $value = null, $restate = false ) {
		static $state = array();
		static $path, $domain;
		if ( ! isset( $path ) ) {
			require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
			$admin_url = Jetpack::admin_url();
			$bits      = parse_url( $admin_url );

			if ( is_array( $bits ) ) {
				$path   = ( isset( $bits['path'] ) ) ? dirname( $bits['path'] ) : null;
				$domain = ( isset( $bits['host'] ) ) ? $bits['host'] : null;
			} else {
				$path = $domain = null;
			}
		}

		// Extract state from cookies and delete cookies
		if ( isset( $_COOKIE[ 'jetpackState' ] ) && is_array( $_COOKIE[ 'jetpackState' ] ) ) {
			$yum = $_COOKIE[ 'jetpackState' ];
			unset( $_COOKIE[ 'jetpackState' ] );
			foreach ( $yum as $k => $v ) {
				if ( strlen( $v ) )
					$state[ $k ] = $v;
				setcookie( "jetpackState[$k]", false, 0, $path, $domain );
			}
		}

		if ( $restate ) {
			foreach ( $state as $k => $v ) {
				setcookie( "jetpackState[$k]", $v, 0, $path, $domain );
			}
			return;
		}

		// Get a state variable
		if ( isset( $key ) && ! isset( $value ) ) {
			if ( array_key_exists( $key, $state ) )
				return $state[ $key ];
			return null;
		}

		// Set a state variable
		if ( isset ( $key ) && isset( $value ) ) {
			if( is_array( $value ) && isset( $value[0] ) ) {
				$value = $value[0];
			}
			$state[ $key ] = $value;
			setcookie( "jetpackState[$key]", $value, 0, $path, $domain );
		}
	}

	public static function restate() {
		Jetpack::state( null, null, true );
	}

	public static function check_privacy( $file ) {
		static $is_site_publicly_accessible = null;

		if ( is_null( $is_site_publicly_accessible ) ) {
			$is_site_publicly_accessible = false;

			Jetpack::load_xml_rpc_client();
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

		$privacy_checks = Jetpack::state( 'privacy_checks' );
		if ( ! $privacy_checks ) {
			$privacy_checks = $module_slug;
		} else {
			$privacy_checks .= ",$module_slug";
		}

		Jetpack::state( 'privacy_checks', $privacy_checks );
	}

	/**
	 * Helper method for multicall XMLRPC.
	 */
	public static function xmlrpc_async_call() {
		global $blog_id;
		static $clients = array();

		$client_blog_id = is_multisite() ? $blog_id : 0;

		if ( ! isset( $clients[$client_blog_id] ) ) {
			Jetpack::load_xml_rpc_client();
			$clients[$client_blog_id] = new Jetpack_IXR_ClientMulticall( array( 'user_id' => JETPACK_MASTER_USER, ) );
			if ( function_exists( 'ignore_user_abort' ) ) {
				ignore_user_abort( true );
			}
			add_action( 'shutdown', array( 'Jetpack', 'xmlrpc_async_call' ) );
		}

		$args = func_get_args();

		if ( ! empty( $args[0] ) ) {
			call_user_func_array( array( $clients[$client_blog_id], 'addCall' ), $args );
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

	public static function staticize_subdomain( $url ) {

		// Extract hostname from URL
		$host = parse_url( $url, PHP_URL_HOST );

		// Explode hostname on '.'
		$exploded_host = explode( '.', $host );

		// Retrieve the name and TLD
		if ( count( $exploded_host ) > 1 ) {
			$name = $exploded_host[ count( $exploded_host ) - 2 ];
			$tld = $exploded_host[ count( $exploded_host ) - 1 ];
			// Rebuild domain excluding subdomains
			$domain = $name . '.' . $tld;
		} else {
			$domain = $host;
		}
		// Array of Automattic domains
		$domain_whitelist = array( 'wordpress.com', 'wp.com' );

		// Return $url if not an Automattic domain
		if ( ! in_array( $domain, $domain_whitelist ) ) {
			return $url;
		}

		if ( is_ssl() ) {
			return preg_replace( '|https?://[^/]++/|', 'https://s-ssl.wordpress.com/', $url );
		}

		srand( crc32( basename( $url ) ) );
		$static_counter = rand( 0, 2 );
		srand(); // this resets everything that relies on this, like array_rand() and shuffle()

		return preg_replace( '|://[^/]+?/|', "://s$static_counter.wp.com/", $url );
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

		$parsed_url = parse_url( $url );
		$url = strtok( $url, '?' );
		$url = "$url?{$_SERVER['QUERY_STRING']}";
		if ( ! empty( $parsed_url['query'] ) )
			$url .= "&{$parsed_url['query']}";

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

	// Add public-api.wordpress.com to the safe redirect whitelist - only added when someone allows API access
	function allow_wpcom_public_api_domain( $domains ) {
		$domains[] = 'public-api.wordpress.com';
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
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-signature.php';

		$environment = is_null( $environment )
			? $_REQUEST
			: $environment;

		list( $envToken, $envVersion, $envUserId ) = explode( ':', $environment['token'] );
		$token = Jetpack_Data::get_access_token( $envUserId );
		if ( ! $token || empty( $token->secret ) ) {
			wp_die( __( 'You must connect your Jetpack plugin to WordPress.com to use this feature.' , 'jetpack' ) );
		}

		$die_error = __( 'Someone may be trying to trick you into giving them access to your site.  Or it could be you just encountered a bug :).  Either way, please close this window.', 'jetpack' );

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
			$signature = $jetpack_signature->sign_current_request( array( 'body' => null, 'method' => 'GET' ) );
		}

		if ( ! $signature ) {
			wp_die( $die_error );
		} else if ( is_wp_error( $signature ) ) {
			wp_die( $die_error );
		} else if ( ! hash_equals( $signature, $environment['signature'] ) ) {
			if ( is_ssl() ) {
				// If we signed an HTTP request on the Jetpack Servers, but got redirected to HTTPS by the local blog, check the HTTP signature as well
				$signature = $jetpack_signature->sign_current_request( array( 'scheme' => 'http', 'body' => null, 'method' => 'GET' ) );
				if ( ! $signature || is_wp_error( $signature ) || ! hash_equals( $signature, $environment['signature'] ) ) {
					wp_die( $die_error );
				}
			} else {
				wp_die( $die_error );
			}
		}

		$timestamp = (int) $environment['timestamp'];
		$nonce     = stripslashes( (string) $environment['nonce'] );

		if ( ! $this->add_nonce( $timestamp, $nonce ) ) {
			// De-nonce the nonce, at least for 5 minutes.
			// We have to reuse this nonce at least once (used the first time when the initial request is made, used a second time when the login form is POSTed)
			$old_nonce_time = get_option( "jetpack_nonce_{$timestamp}_{$nonce}" );
			if ( $old_nonce_time < time() - 300 ) {
				wp_die( __( 'The authorization process expired.  Please go back and try again.' , 'jetpack' ) );
			}
		}

		$data = json_decode( base64_decode( stripslashes( $environment['data'] ) ) );
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
			case 'int' :
				$this->json_api_authorization_request[$key] = (int) $data->$key;
				break;
			case 'opaque' :
				$this->json_api_authorization_request[$key] = (string) $data->$key;
				break;
			case 'string' :
				$this->json_api_authorization_request[$key] = wp_kses( (string) $data->$key, array() );
				break;
			case 'url' :
				$this->json_api_authorization_request[$key] = esc_url_raw( (string) $data->$key );
				break;
			}
		}

		if ( empty( $this->json_api_authorization_request['client_id'] ) ) {
			wp_die( $die_error );
		}
	}

	function login_message_json_api_authorization( $message ) {
		return '<p class="message">' . sprintf(
			esc_html__( '%s wants to access your site&#8217;s data.  Log in to authorize that access.' , 'jetpack' ),
			'<strong>' . esc_html( $this->json_api_authorization_request['client_title'] ) . '</strong>'
		) . '<img src="' . esc_url( $this->json_api_authorization_request['client_image'] ) . '" /></p>';
	}

	/**
	 * Get $content_width, but with a <s>twist</s> filter.
	 */
	public static function get_content_width() {
		$content_width = isset( $GLOBALS['content_width'] ) ? $GLOBALS['content_width'] : false;
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

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array( 'user_id' => JETPACK_MASTER_USER, ) );
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
		if ( ! Jetpack::is_active() || Jetpack::is_development_mode() || ! self::validate_sync_error_idc_option() ) {
			return false;
		}

		return Jetpack_Options::get_option( 'sync_error_idc' );
	}

	/**
	 * Checks whether the home and siteurl specifically are whitelisted
	 * Written so that we don't have re-check $key and $value params every time
	 * we want to check if this site is whitelisted, for example in footer.php
	 *
	 * @since  3.8.0
	 * @return bool True = already whitelisted False = not whitelisted
	 */
	public static function is_staging_site() {
		$is_staging = false;

		$known_staging = array(
			'urls' => array(
				'#\.staging\.wpengine\.com$#i', // WP Engine
				'#\.staging\.kinsta\.com$#i',   // Kinsta.com
				),
			'constants' => array(
				'IS_WPE_SNAPSHOT',      // WP Engine
				'KINSTA_DEV_ENV',       // Kinsta.com
				'WPSTAGECOACH_STAGING', // WP Stagecoach
				'JETPACK_STAGING_MODE', // Generic
				)
			);
		/**
		 * Filters the flags of known staging sites.
		 *
		 * @since 3.9.0
		 *
		 * @param array $known_staging {
		 *     An array of arrays that each are used to check if the current site is staging.
		 *     @type array $urls      URLs of staging sites in regex to check against site_url.
		 *     @type array $constants PHP constants of known staging/developement environments.
		 *  }
		 */
		$known_staging = apply_filters( 'jetpack_known_staging', $known_staging );

		if ( isset( $known_staging['urls'] ) ) {
			foreach ( $known_staging['urls'] as $url ){
				if ( preg_match( $url, site_url() ) ) {
					$is_staging = true;
					break;
				}
			}
		}

		if ( isset( $known_staging['constants'] ) ) {
			foreach ( $known_staging['constants'] as $constant ) {
				if ( defined( $constant ) && constant( $constant ) ) {
					$is_staging = true;
				}
			}
		}

		// Last, let's check if sync is erroring due to an IDC. If so, set the site to staging mode.
		if ( ! $is_staging && self::validate_sync_error_idc_option() ) {
			$is_staging = true;
		}

		/**
		 * Filters is_staging_site check.
		 *
		 * @since 3.9.0
		 *
		 * @param bool $is_staging If the current site is a staging site.
		 */
		return apply_filters( 'jetpack_is_staging_site', $is_staging );
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
		$is_valid = false;

		$idc_allowed = get_transient( 'jetpack_idc_allowed' );
		if ( false === $idc_allowed ) {
			$response = wp_remote_get( 'https://jetpack.com/is-idc-allowed/' );
			if ( 200 === (int) wp_remote_retrieve_response_code( $response ) ) {
				$json = json_decode( wp_remote_retrieve_body( $response ) );
				$idc_allowed = isset( $json, $json->result ) && $json->result ? '1' : '0';
				$transient_duration = HOUR_IN_SECONDS;
			} else {
				// If the request failed for some reason, then assume IDC is allowed and set shorter transient.
				$idc_allowed = '1';
				$transient_duration = 5 * MINUTE_IN_SECONDS;
			}

			set_transient( 'jetpack_idc_allowed', $idc_allowed, $transient_duration );
		}

		// Is the site opted in and does the stored sync_error_idc option match what we now generate?
		$sync_error = Jetpack_Options::get_option( 'sync_error_idc' );
		if ( $idc_allowed && $sync_error && self::sync_idc_optin() ) {
			$local_options = self::get_sync_error_idc_option();
			if ( $sync_error['home'] === $local_options['home'] && $sync_error['siteurl'] === $local_options['siteurl'] ) {
				$is_valid = true;
			}
		}

		/**
		 * Filters whether the sync_error_idc option is valid.
		 *
		 * @since 4.4.0
		 *
		 * @param bool $is_valid If the sync_error_idc is valid or not.
		 */
		$is_valid = (bool) apply_filters( 'jetpack_sync_error_idc_validation', $is_valid );

		if ( ! $idc_allowed || ( ! $is_valid && $sync_error ) ) {
			// Since the option exists, and did not validate, delete it
			Jetpack_Options::delete_option( 'sync_error_idc' );
		}

		return $is_valid;
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
		// Since the local options will hit the database directly, store the values
		// in a transient to allow for autoloading and caching on subsequent views.
		$local_options = get_transient( 'jetpack_idc_local' );
		if ( false === $local_options ) {
			require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-functions.php';
			$local_options = array(
				'home'    => Jetpack_Sync_Functions::home_url(),
				'siteurl' => Jetpack_Sync_Functions::site_url(),
			);
			set_transient( 'jetpack_idc_local', $local_options, MINUTE_IN_SECONDS );
		}

		$options = array_merge( $local_options, $response );

		$returned_values = array();
		foreach( $options as $key => $option ) {
			if ( 'error_code' === $key ) {
				$returned_values[ $key ] = $option;
				continue;
			}

			if ( is_wp_error( $normalized_url = self::normalize_url_protocol_agnostic( $option ) ) ) {
				continue;
			}

			$returned_values[ $key ] = $normalized_url;
		}

		set_transient( 'jetpack_idc_option', $returned_values, MINUTE_IN_SECONDS );

		return $returned_values;
	}

	/**
	 * Returns the value of the jetpack_sync_idc_optin filter, or constant.
	 * If set to true, the site will be put into staging mode.
	 *
	 * @since 4.3.2
	 * @return bool
	 */
	public static function sync_idc_optin() {
		if ( Jetpack_Constants::is_defined( 'JETPACK_SYNC_IDC_OPTIN' ) ) {
			$default = Jetpack_Constants::get_constant( 'JETPACK_SYNC_IDC_OPTIN' );
		} else {
			$default = ! Jetpack_Constants::is_defined( 'SUNRISE' ) && ! is_multisite();
		}

		/**
		 * Allows sites to optin to IDC mitigation which blocks the site from syncing to WordPress.com when the home
		 * URL or site URL do not match what WordPress.com expects. The default value is either false, or the value of
		 * JETPACK_SYNC_IDC_OPTIN constant if set.
		 *
		 * @since 4.3.2
		 *
		 * @param bool $default Whether the site is opted in to IDC mitigation.
		 */
		return (bool) apply_filters( 'jetpack_sync_idc_optin', $default );
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
					$key = str_replace( JETPACK__PLUGIN_DIR, 'jetpack/', $min_full_path );
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
		$css  = Jetpack::absolutize_css_urls( file_get_contents( $file ), $href );
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
	 * @param array $data - Any data to pass along to the template
	 * @return boolean - If template file was found
	 **/
	public function load_view( $template, $data = array() ) {
		$views_dir = JETPACK__PLUGIN_DIR . 'views/';

		if( file_exists( $views_dir . $template ) ) {
			require_once( $views_dir . $template );
			return true;
		}

		error_log( "Jetpack: Unable to find view file $views_dir$template" );
		return false;
	}

	/**
	 * Throws warnings for deprecated hooks to be removed from Jetpack
	 */
	public function deprecated_hooks() {
		global $wp_filter;

		/*
		 * Format:
		 * deprecated_filter_name => replacement_name
		 *
		 * If there is no replacement, use null for replacement_name
		 */
		$deprecated_list = array(
			'jetpack_bail_on_shortcode'                              => 'jetpack_shortcodes_to_include',
			'wpl_sharing_2014_1'                                     => null,
			'jetpack-tools-to-include'                               => 'jetpack_tools_to_include',
			'jetpack_identity_crisis_options_to_check'               => null,
			'update_option_jetpack_single_user_site'                 => null,
			'audio_player_default_colors'                            => null,
			'add_option_jetpack_featured_images_enabled'             => null,
			'add_option_jetpack_update_details'                      => null,
			'add_option_jetpack_updates'                             => null,
			'add_option_jetpack_network_name'                        => null,
			'add_option_jetpack_network_allow_new_registrations'     => null,
			'add_option_jetpack_network_add_new_users'               => null,
			'add_option_jetpack_network_site_upload_space'           => null,
			'add_option_jetpack_network_upload_file_types'           => null,
			'add_option_jetpack_network_enable_administration_menus' => null,
			'add_option_jetpack_is_multi_site'                       => null,
			'add_option_jetpack_is_main_network'                     => null,
			'add_option_jetpack_main_network_site'                   => null,
			'jetpack_sync_all_registered_options'                    => null,
			'jetpack_has_identity_crisis'                            => 'jetpack_sync_error_idc_validation',
			'jetpack_is_post_mailable'                               => null,
			'jetpack_seo_site_host'                                  => null,
		);

		// This is a silly loop depth. Better way?
		foreach( $deprecated_list AS $hook => $hook_alt ) {
			if ( has_action( $hook ) ) {
				foreach( $wp_filter[ $hook ] AS $func => $values ) {
					foreach( $values AS $hooked ) {
						if ( is_callable( $hooked['function'] ) ) {
							$function_name = 'an anonymous function';
						} else {
							$function_name = $hooked['function'];
						}
						_deprecated_function( $hook . ' used for ' . $function_name, null, $hook_alt );
					}
				}
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
		$p       = parse_url( $css_dir );
		$domain  = sprintf(
					'%1$s//%2$s%3$s%4$s',
					isset( $p['scheme'] )           ? "{$p['scheme']}:" : '',
					isset( $p['user'], $p['pass'] ) ? "{$p['user']}:{$p['pass']}@" : '',
					$p['host'],
					isset( $p['port'] )             ? ":{$p['port']}" : ''
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
	 *		should not cause any issues with themes.
	 * - Plugins/themes dequeuing styles no longer do anything. See
	 *		jetpack_implode_frontend_css filter for a workaround
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

		/**
		 * Allow CSS to be concatenated into a single jetpack.css file.
		 *
		 * @since 3.2.0
		 *
		 * @param bool $do_implode Should CSS be concatenated? Default to true.
		 */
		$do_implode = apply_filters( 'jetpack_implode_frontend_css', $do_implode );

		// Do not use the imploded file when default behaviour was altered through the filter
		if ( ! $do_implode ) {
			return;
		}

		// We do not want to use the imploded file in dev mode, or if not connected
		if ( Jetpack::is_development_mode() || ! self::is_active() ) {
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

		$version = Jetpack::is_development_version() ? filemtime( JETPACK__PLUGIN_DIR . 'css/jetpack.css' ) : JETPACK__VERSION;

		wp_enqueue_style( 'jetpack_css', plugins_url( 'css/jetpack.css', __FILE__ ), array(), $version );
		wp_style_add_data( 'jetpack_css', 'rtl', 'replace' );
	}

	function concat_remove_style_loader_tag( $tag, $handle ) {
		if ( in_array( $handle, $this->concatenated_style_handles ) ) {
			$tag = '';
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				$tag = "<!-- `" . esc_html( $handle ) . "` is included in the concatenated jetpack.css -->\r\n";
			}
		}

		return $tag;
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
					$caution[ $stat ] = $value . " - min supported is " . JETPACK__VERSION;
					continue;
				}
			}

			// Check WP version
			if ( 'wp-version' == $stat ) {
				if ( version_compare( $value, JETPACK__MINIMUM_WP_VERSION, '<' ) ) {
					$caution[ $stat ] = $value . " - min supported is " . JETPACK__MINIMUM_WP_VERSION;
					continue;
				}
			}

			// Check PHP version
			if ( 'php-version' == $stat ) {
				if ( version_compare( PHP_VERSION, '5.2.4', '<' ) ) {
					$caution[ $stat ] = $value . " - min supported is 5.2.4";
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
			'bad'     => $bad
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

	/**
	 * Check if an option of a Jetpack module has been updated.
	 *
	 * If any module option has been updated before Jump Start has been dismissed,
	 * update the 'jumpstart' option so we can hide Jump Start.
	 *
	 * @param string $option_name
	 *
	 * @return bool
	 */
	public static function jumpstart_has_updated_module_option( $option_name = '' ) {
		// Bail if Jump Start has already been dismissed
		if ( 'new_connection' !== Jetpack_Options::get_option( 'jumpstart' ) ) {
			return false;
		}

		$jetpack = Jetpack::init();

		// Manual build of module options
		$option_names = self::get_jetpack_options_for_reset();

		if ( in_array( $option_name, $option_names['wp_options'] ) ) {
			Jetpack_Options::update_option( 'jumpstart', 'jetpack_action_taken' );

			//Jump start is being dismissed send data to MC Stats
			$jetpack->stat( 'jumpstart', 'manual,'.$option_name );

			$jetpack->do_stats( 'server_side' );
		}

	}

	/*
	 * Strip http:// or https:// from a url, replaces forward slash with ::,
	 * so we can bring them directly to their site in calypso.
	 *
	 * @param string | url
	 * @return string | url without the guff
	 */
	public static function build_raw_urls( $url ) {
		$strip_http = '/.*?:\/\//i';
		$url = preg_replace( $strip_http, '', $url  );
		$url = str_replace( '/', '::', $url );
		return $url;
	}

	/**
	 * Stores and prints out domains to prefetch for page speed optimization.
	 *
	 * @param mixed $new_urls
	 */
	public static function dns_prefetch( $new_urls = null ) {
		static $prefetch_urls = array();
		if ( empty( $new_urls ) && ! empty( $prefetch_urls ) ) {
			echo "\r\n";
			foreach ( $prefetch_urls as $this_prefetch_url ) {
				printf( "<link rel='dns-prefetch' href='%s'/>\r\n", esc_attr( $this_prefetch_url ) );
			}
		} elseif ( ! empty( $new_urls ) ) {
			if ( ! has_action( 'wp_head', array( __CLASS__, __FUNCTION__ ) ) ) {
				add_action( 'wp_head', array( __CLASS__, __FUNCTION__ ) );
			}
			foreach ( (array) $new_urls as $this_new_url ) {
				$prefetch_urls[] = strtolower( untrailingslashit( preg_replace( '#^https?://#i', '//', $this_new_url ) ) );
			}
			$prefetch_urls = array_unique( $prefetch_urls );
		}
	}

	public function wp_dashboard_setup() {
		if ( self::is_active() ) {
			add_action( 'jetpack_dashboard_widget', array( __CLASS__, 'dashboard_widget_footer' ), 999 );
		}

		if ( has_action( 'jetpack_dashboard_widget' ) ) {
			wp_add_dashboard_widget(
				'jetpack_summary_widget',
				esc_html__( 'Site Stats', 'jetpack' ),
				array( __CLASS__, 'dashboard_widget' )
			);
			wp_enqueue_style( 'jetpack-dashboard-widget', plugins_url( 'css/dashboard-widget.css', JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );

			// If we're inactive and not in development mode, sort our box to the top.
			if ( ! self::is_active() && ! self::is_development_mode() ) {
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
			$key = array_search( 'dashboard_stats', $ids_array );

			if ( false !== $key ) {
				// If we've found that exact value in the option (and not `google_dashboard_stats` for example)
				$ids_array[ $key ] = 'jetpack_summary_widget';
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
			<?php if ( Jetpack::is_module_active( 'protect' ) ) : ?>
				<h3><?php echo number_format_i18n( get_site_option( 'jetpack_protect_blocked_attempts', 0 ) ); ?></h3>
				<p><?php echo esc_html_x( 'Blocked malicious login attempts', '{#} Blocked malicious login attempts -- number is on a prior line, text is a caption.', 'jetpack' ); ?></p>
			<?php elseif ( current_user_can( 'jetpack_activate_modules' ) && ! self::is_development_mode() ) : ?>
				<a href="<?php echo esc_url( wp_nonce_url( Jetpack::admin_url( array( 'action' => 'activate', 'module' => 'protect' ) ), 'jetpack_activate-protect' ) ); ?>" class="button button-jetpack" title="<?php esc_attr_e( 'Protect helps to keep you secure from brute-force login attacks.', 'jetpack' ); ?>">
					<?php esc_html_e( 'Activate Protect', 'jetpack' ); ?>
				</a>
			<?php else : ?>
				<?php esc_html_e( 'Protect is inactive.', 'jetpack' ); ?>
			<?php endif; ?>
		</div>

		<div class="akismet">
			<?php if ( is_plugin_active( 'akismet/akismet.php' ) ) : ?>
				<h3><?php echo number_format_i18n( get_option( 'akismet_spam_count', 0 ) ); ?></h3>
				<p><?php echo esc_html_x( 'Spam comments blocked by Akismet.', '{#} Spam comments blocked by Akismet -- number is on a prior line, text is a caption.', 'jetpack' ); ?></p>
			<?php elseif ( current_user_can( 'activate_plugins' ) && ! is_wp_error( validate_plugin( 'akismet/akismet.php' ) ) ) : ?>
				<a href="<?php echo esc_url( wp_nonce_url( add_query_arg( array( 'action' => 'activate', 'plugin' => 'akismet/akismet.php' ), admin_url( 'plugins.php' ) ), 'activate-plugin_akismet/akismet.php' ) ); ?>" class="button button-jetpack">
					<?php esc_html_e( 'Activate Akismet', 'jetpack' ); ?>
				</a>
			<?php else : ?>
				<p><a href="<?php echo esc_url( 'https://akismet.com/?utm_source=jetpack&utm_medium=link&utm_campaign=Jetpack%20Dashboard%20Widget%20Footer%20Link' ); ?>"><?php esc_html_e( 'Akismet can help to keep your blog safe from spam!', 'jetpack' ); ?></a></p>
			<?php endif; ?>
		</div>

		</footer>
		<?php
	}

	/**
	 * Return string containing the Jetpack logo.
	 *
	 * @since 3.9.0
	 *
	 * @return string
	 */
	public static function get_jp_emblem() {
		return '<svg id="jetpack-logo__icon" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32"><path fill="#00BE28" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16c8.8,0,16-7.2,16-16S24.8,0,16,0z M15.2,18.7h-8l8-15.5V18.7z M16.8,28.8 V13.3h8L16.8,28.8z"/></svg>';
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
		if ( 'user_jetpack' == $col && Jetpack::is_user_connected( $user_id ) ) {
			$emblem_html = sprintf(
				'<a title="%1$s" class="jp-emblem-user-admin">%2$s</a>',
				esc_attr__( 'This user is linked and ready to fly with Jetpack.', 'jetpack' ),
				Jetpack::get_jp_emblem()
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
		if ( ! empty( $current_screen->base ) && 'users' == $current_screen->base ) { ?>
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
		<?php }
	}

	/**
	 * Checks if Akismet is active and working.
	 *
	 * @since  5.1.0
	 * @return bool True = Akismet available. False = Aksimet not available.
	 */
	public static function is_akismet_active() {
		if ( method_exists( 'Akismet' , 'http_post' ) || function_exists( 'akismet_http_post' ) ) {
			return true;
		}
		return false;
	}

	/**
	 * Checks if one or more function names is in debug_backtrace
	 *
	 * @param $names Mixed string name of function or array of string names of functions
	 *
	 * @return bool
	 */
	public static function is_function_in_backtrace( $names ) {
		$backtrace = debug_backtrace( false );
		if ( ! is_array( $names ) ) {
			$names = array( $names );
		}
		$names_as_keys = array_flip( $names );

		//Do check in constant O(1) time for PHP5.5+
		if ( function_exists( 'array_column' ) ) {
			$backtrace_functions = array_column( $backtrace, 'function' );
			$backtrace_functions_as_keys = array_flip( $backtrace_functions );
			$intersection = array_intersect_key( $backtrace_functions_as_keys, $names_as_keys );
			return ! empty ( $intersection );
		}

		//Do check in linear O(n) time for < PHP5.5 ( using isset at least prevents O(n^2) )
		foreach ( $backtrace as $call ) {
			if ( isset( $names_as_keys[ $call['function'] ] ) ) {
				return true;
			}
		}
		return false;
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
		$path = ( Jetpack_Constants::is_defined( 'SCRIPT_DEBUG' ) && Jetpack_Constants::get_constant( 'SCRIPT_DEBUG' ) )
			? $non_min_path
			: $min_path;

		return plugins_url( $path, JETPACK__PLUGIN_FILE );
	}
}
