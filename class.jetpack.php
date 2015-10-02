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

class Jetpack {
	public $xmlrpc_server = null;

	private $xmlrpc_verification = null;

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
		'tiled-gallery',
		'widget-conditions',
		'jetpack_display_posts_widget',
		'gravatar-profile-widget',
		'widget-grid-and-list',
		'jetpack-widgets',
		'goodreads-widget',
	);

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
		'omnisearch'          => array( 'jetpack-omnisearch/omnisearch.php', 'Jetpack Omnisearch' ),
		'gravatar-hovercards' => array( 'jetpack-gravatar-hovercards/gravatar-hovercards.php', 'Jetpack Gravatar Hovercards' ),
		'latex'               => array( 'wp-latex/wp-latex.php', 'WP LaTeX' )
	);

	public $capability_translations = array(
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
			'Intense Debate'                    => 'intensedebate/intensedebate.php',
			'Disqus'                            => 'disqus-comment-system/disqus.php',
			'Livefyre'                          => 'livefyre-comments/livefyre.php',
			'Comments Evolved for WordPress'    => 'gplus-comments/comments-evolved.php',
			'Google+ Comments'                  => 'google-plus-comments/google-plus-comments.php',
			'WP-SpamShield Anti-Spam'           => 'wp-spamshield/wp-spamshield.php',
		),
		'contact-form'      => array(
			'Contact Form 7'                    => 'contact-form-7/wp-contact-form-7.php',
			'Gravity Forms'                     => 'gravityforms/gravityforms.php',
			'Contact Form Plugin'               => 'contact-form-plugin/contact_form.php',
			'Easy Contact Forms'                => 'easy-contact-forms/easy-contact-forms.php',
			'Fast Secure Contact Form'          => 'si-contact-form/si-contact-form.php',
		),
		'minileven'         => array(
			'WPtouch'                           => 'wptouch/wptouch.php',
		),
		'latex'             => array(
			'LaTeX for WordPress'               => 'latex/latex.php',
			'Youngwhans Simple Latex'           => 'youngwhans-simple-latex/yw-latex.php',
			'Easy WP LaTeX'                     => 'easy-wp-latex-lite/easy-wp-latex-lite.php',
			'MathJax-LaTeX'                     => 'mathjax-latex/mathjax-latex.php',
			'Enable Latex'                      => 'enable-latex/enable-latex.php',
			'WP QuickLaTeX'                     => 'wp-quicklatex/wp-quicklatex.php',
		),
		'protect'           => array(
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
		'random-redirect'   => array(
			'Random Redirect 2'                 => 'random-redirect-2/random-redirect.php',
		),
		'related-posts'     => array(
			'YARPP'                             => 'yet-another-related-posts-plugin/yarpp.php',
			'WordPress Related Posts'           => 'wordpress-23-related-posts-plugin/wp_related_posts.php',
			'nrelate Related Content'           => 'nrelate-related-content/nrelate-related.php',
			'Contextual Related Posts'          => 'contextual-related-posts/contextual-related-posts.php',
			'Related Posts for WordPress'       => 'microkids-related-posts/microkids-related-posts.php',
			'outbrain'                          => 'outbrain/outbrain.php',
			'Shareaholic'                       => 'shareaholic/shareaholic.php',
			'Sexybookmarks'                     => 'sexybookmarks/shareaholic.php',
		),
		'sharedaddy'        => array(
			'AddThis'                           => 'addthis/addthis_social_widget.php',
			'Add To Any'                        => 'add-to-any/add-to-any.php',
			'ShareThis'                         => 'share-this/sharethis.php',
			'Shareaholic'                       => 'shareaholic/shareaholic.php',
		),
		'verification-tools' => array(
			'WordPress SEO by Yoast'            => 'wordpress-seo/wp-seo.php',
			'WordPress SEO Premium by Yoast'    => 'wordpress-seo-premium/wp-seo-premium.php',
			'All in One SEO Pack'               => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
		),
		'widget-visibility' => array(
			'Widget Logic'                      => 'widget-logic/widget_logic.php',
			'Dynamic Widgets'                   => 'dynamic-widgets/dynamic-widgets.php',
		),
	);

	/**
	 * Plugins for which we turn off our Facebook OG Tags implementation.
	 *
	 * Note: WordPress SEO by Yoast and WordPress SEO Premium by Yoast automatically deactivate
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
		'easy-facebook-share-thumbnails/esft.php',               // Easy Facebook Share Thumbnail
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
		'header-footer/plugin.php',                              // Header and Footer
		'network-publisher/networkpub.php',                      // Network Publisher
		'nextgen-facebook/nextgen-facebook.php',                 // NextGEN Facebook OG
		'social-networks-auto-poster-facebook-twitter-g/NextScripts_SNAP.php',
		                                                         // NextScripts SNAP
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
	 * Allows us to build a temporary security report
	 *
	 * @var array
	 */
	static $security_report = array();

	/**
	 * Jetpack_Sync object
	 */
	public $sync;

	/**
	 * Verified data for JSON authorization request
	 */
	public $json_api_authorization_request = array();

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
			if ( did_action( 'plugins_loaded' ) )
				self::plugin_textdomain();
			else
				add_action( 'plugins_loaded', array( __CLASS__, 'plugin_textdomain' ), 99 );

			self::$instance = new Jetpack;

			self::$instance->plugin_upgrade();

			add_action( 'init', array( __CLASS__, 'perform_security_reporting' ) );

		}

		return self::$instance;
	}

	/**
	 * Must never be called statically
	 */
	function plugin_upgrade() {
		// Upgrade: 1.1 -> 1.2
		if ( get_option( 'jetpack_id' ) ) {
			// Move individual jetpack options to single array of options
			$options = array();
			foreach ( Jetpack_Options::get_option_names() as $option ) {
				if ( false !== $value = get_option( "jetpack_$option" ) ) {
					$options[$option] = $value;
				}
			}

			if ( $options ) {
				Jetpack_Options::update_options( $options );

				foreach ( array_keys( $options ) as $option ) {
					delete_option( "jetpack_$option" );
				}
			}

			// Add missing version and old_version options
			if ( ! $version = Jetpack_Options::get_option( 'version' ) ) {
				$version = $old_version = '1.1:' . time();
				/**
				 * Fires on update, before bumping version numbers up to a new version.
				 *
				 * @since 3.4.0
				 *
				 * @param string $version Jetpack version number.
				 * @param bool false Does an old version exist. Default is false.
				 */
				do_action( 'updating_jetpack_version', $version, false );
				Jetpack_Options::update_options( compact( 'version', 'old_version' ) );
			}
		}

		// Upgrade from a single user token to a user_id-indexed array and a master_user ID
		if ( ! Jetpack_Options::get_option( 'user_tokens' ) ) {
			if ( $user_token = Jetpack_Options::get_option( 'user_token' ) ) {
				$token_parts = explode( '.', $user_token );
				if ( isset( $token_parts[2] ) ) {
					$master_user = $token_parts[2];
					$user_tokens = array( $master_user => $user_token );
					Jetpack_Options::update_options( compact( 'master_user', 'user_tokens' ) );
					Jetpack_Options::delete_option( 'user_token' );
				} else {
					// @todo: is this even possible?
					trigger_error( sprintf( 'Jetpack::plugin_upgrade found no user_id in user_token "%s"', $user_token ), E_USER_WARNING );
				}
			}
		}

		// Clean up legacy G+ Authorship data.
		if ( get_option( 'gplus_authors' ) ) {
			delete_option( 'gplus_authors' );
			delete_option( 'hide_gplus' );
			delete_metadata( 'post', 0, 'gplus_authorship_disabled', null, true );
		}

		if ( ! get_option( 'jetpack_private_options' ) ) {
			$jetpack_options = get_option( 'jetpack_options', array() );
			foreach( Jetpack_Options::get_option_names( 'private' ) as $option_name ) {
				if ( isset( $jetpack_options[ $option_name ] ) ) {
					Jetpack_Options::update_option( $option_name, $jetpack_options[ $option_name ] );
					unset( $jetpack_options[ $option_name ] );
				}
			}
			update_option( 'jetpack_options', $jetpack_options );
		}

		if ( Jetpack::is_active() ) {
			list( $version ) = explode( ':', Jetpack_Options::get_option( 'version' ) );
			if ( JETPACK__VERSION != $version ) {
				add_action( 'init', array( __CLASS__, 'activate_new_modules' ) );
				/**
				 * Fires when synchronizing all registered options and constants.
				 *
				 * @since 3.3.0
				 */
				do_action( 'jetpack_sync_all_registered_options' );
			}
			//if Jetpack is connected check if jetpack_unique_connection exists and if not then set it
			$jetpack_unique_connection = get_option( 'jetpack_unique_connection' );
			$is_unique_connection = $jetpack_unique_connection && array_key_exists( 'version', $jetpack_unique_connection );
			if ( ! $is_unique_connection ) {
				$jetpack_unique_connection = array(
					'connected'     => 1,
					'disconnected'  => -1,
					'version'       => '3.6.1'
				);
				update_option( 'jetpack_unique_connection', $jetpack_unique_connection );
			}
		}

		if ( get_option( 'jetpack_json_api_full_management' ) ) {
			delete_option( 'jetpack_json_api_full_management' );
			self::activate_manage();
		}

	}

	static function activate_manage( ) {

		if ( did_action( 'init' ) || current_filter() == 'init' ) {
			self::activate_module( 'manage', false, false );
		} else if ( !  has_action( 'init' , array( __CLASS__, 'activate_manage' ) ) ) {
			add_action( 'init', array( __CLASS__, 'activate_manage' ) );
		}

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
		 * Do things that should run even in the network admin
		 * here, before we potentially fail out.
		 */
		add_filter( 'jetpack_require_lib_dir', array( $this, 'require_lib_dir' ) );

		/**
		 * We need sync object even in Multisite mode
		 */
		$this->sync = new Jetpack_Sync;

		/**
		 * Trigger a wp_version sync when updating WP versions
		 **/
		add_action( 'upgrader_process_complete', array( 'Jetpack', 'update_get_wp_version' ), 10, 2 );
		$this->sync->mock_option( 'wp_version', array( 'Jetpack', 'get_wp_version' ) );

		add_action( 'init', array( $this, 'sync_update_data') );

		/*
		 * Load things that should only be in Network Admin.
		 *
		 * For now blow away everything else until a more full
		 * understanding of what is needed at the network level is
		 * available
		 */
		if( is_multisite() ) {
			Jetpack_Network::init();

			// Only sync this info if we are on a multi site
			// @since  3.7
			$this->sync->mock_option( 'network_name', array( 'Jetpack', 'network_name' ) );
			$this->sync->mock_option( 'network_allow_new_registrations', array( 'Jetpack', 'network_allow_new_registrations' ) );
			$this->sync->mock_option( 'network_add_new_users', array( 'Jetpack', 'network_add_new_users' ) );
			$this->sync->mock_option( 'network_site_upload_space', array( 'Jetpack', 'network_site_upload_space' ) );
			$this->sync->mock_option( 'network_upload_file_types', array( 'Jetpack', 'network_upload_file_types' ) );
			$this->sync->mock_option( 'network_enable_administration_menus', array( 'Jetpack', 'network_enable_administration_menus' ) );

			if( is_network_admin() ) {
				// Sync network site data if it is updated or not.
				add_action( 'update_wpmu_options', array( $this, 'update_jetpack_network_settings' ) );
				return; // End here to prevent single site actions from firing
			}
		}


		$theme_slug = get_option( 'stylesheet' );


		// Modules should do Jetpack_Sync::sync_options( __FILE__, $option, ... ); instead
		// We access the "internal" method here only because the Jetpack object isn't instantiated yet
		$this->sync->options(
			JETPACK__PLUGIN_DIR . 'jetpack.php',
			'home',
			'siteurl',
			'blogname',
			'gmt_offset',
			'timezone_string',
			'security_report',
			'stylesheet',
			"theme_mods_{$theme_slug}",
			'jetpack_sync_non_public_post_stati',
			'jetpack_options',
			'site_icon' // (int) - ID of core's Site Icon attachment ID
		);

		foreach( Jetpack_Options::get_option_names( 'non-compact' ) as $option ) {
			$this->sync->options( __FILE__, 'jetpack_' . $option );
		}

		/**
		 * Sometimes you want to sync data to .com without adding options to .org sites.
		 * The mock option allows you to do just that.
		 */
		$this->sync->mock_option( 'is_main_network',   array( $this, 'is_main_network_option' ) );
		$this->sync->mock_option( 'is_multi_site', array( $this, 'is_multisite' ) );
		$this->sync->mock_option( 'main_network_site', array( $this, 'jetpack_main_network_site_option' ) );
		$this->sync->mock_option( 'single_user_site', array( 'Jetpack', 'is_single_user_site' ) );

		$this->sync->mock_option( 'has_file_system_write_access', array( 'Jetpack', 'file_system_write_access' ) );
		$this->sync->mock_option( 'is_version_controlled', array( 'Jetpack', 'is_version_controlled' ) );

		/**
		 * Trigger an update to the main_network_site when we update the blogname of a site.
		 *
		 */
		add_action( 'update_option_siteurl', array( $this, 'update_jetpack_main_network_site_option' ) );

		add_action( 'update_option', array( $this, 'log_settings_change' ), 10, 3 );

		// Update the settings everytime the we register a new user to the site or we delete a user.
		add_action( 'user_register', array( $this, 'is_single_user_site_invalidate' ) );
		add_action( 'deleted_user', array( $this, 'is_single_user_site_invalidate' ) );

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
					add_filter( 'xmlrpc_methods', '__return_empty_array' );
				}
			} else {
				// The bootstrap API methods.
				add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'bootstrap_xmlrpc_methods' ) );
			}

			// Now that no one can authenticate, and we're whitelisting all XML-RPC methods, force enable_xmlrpc on.
			add_filter( 'pre_option_enable_xmlrpc', '__return_true' );
		} elseif ( is_admin() && isset( $_POST['action'] ) && 'jetpack_upload_file' == $_POST['action'] ) {
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

		add_action( 'wp_ajax_jetpack-sync-reindex-trigger', array( $this, 'sync_reindex_trigger' ) );
		add_action( 'wp_ajax_jetpack-sync-reindex-status', array( $this, 'sync_reindex_status' ) );

		// Jump Start AJAX callback function
		add_action( 'wp_ajax_jetpack_jumpstart_ajax',  array( $this, 'jetpack_jumpstart_ajax_callback' ) );
		add_action( 'update_option', array( $this, 'jumpstart_has_updated_module_option' ) );

		// Identity Crisis AJAX callback function
		add_action( 'wp_ajax_jetpack_resolve_identity_crisis', array( $this, 'resolve_identity_crisis_ajax_callback' ) );

		// JITM AJAX callback function
		add_action( 'wp_ajax_jitm_ajax',  array( $this, 'jetpack_jitm_ajax_callback' ) );

		add_action( 'wp_ajax_jetpack_admin_ajax',          array( $this, 'jetpack_admin_ajax_callback' ) );
		add_action( 'wp_ajax_jetpack_admin_ajax_refresh',  array( $this, 'jetpack_admin_ajax_refresh_data' ) );

		add_action( 'wp_loaded', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'devicepx' ) );
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'devicepx' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'devicepx' ) );

		add_action( 'jetpack_activate_module', array( $this, 'activate_module_actions' ) );

		add_action( 'plugins_loaded', array( $this, 'extra_oembed_providers' ), 100 );

		add_action( 'jetpack_notices', array( $this, 'show_development_mode_notice' ) );

		/**
		 * These actions run checks to load additional files.
		 * They check for external files or plugins, so they need to run as late as possible.
		 */
		add_action( 'wp_head', array( $this, 'check_open_graph' ),       1 );
		add_action( 'plugins_loaded', array( $this, 'check_twitter_tags' ),     999 );
		add_action( 'plugins_loaded', array( $this, 'check_rest_api_compat' ), 1000 );

		add_filter( 'plugins_url',      array( 'Jetpack', 'maybe_min_asset' ),     1, 3 );
		add_filter( 'style_loader_tag', array( 'Jetpack', 'maybe_inline_style' ), 10, 2 );

		add_filter( 'map_meta_cap', array( $this, 'jetpack_custom_caps' ), 1, 4 );

		add_filter( 'jetpack_get_default_modules', array( $this, 'filter_default_modules' ) );
		add_filter( 'jetpack_get_default_modules', array( $this, 'handle_deprecated_modules' ), 99 );

		// A filter to control all just in time messages
		add_filter( 'jetpack_just_in_time_msgs', '__return_true' );

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

		// Sync Core Icon: Detect changes in Core's Site Icon and make it syncable.
		add_action( 'add_option_site_icon',    array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'update_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'delete_option_site_icon', array( $this, 'jetpack_sync_core_icon' ) );
		add_action( 'jetpack_heartbeat',       array( $this, 'jetpack_sync_core_icon' ) );

	}

	/*
	 * Make sure any site icon added to core can get
	 * synced back to dotcom, so we can display it there.
	 */
	function jetpack_sync_core_icon() {
		if ( function_exists( 'get_site_icon_url' ) ) {
			$url = get_site_icon_url();
		} else {
			return;
		}

		require_once( JETPACK__PLUGIN_DIR . 'modules/site-icon/site-icon-functions.php' );
		// If there's a core icon, maybe update the option.  If not, fall back to Jetpack's.
		if ( ! empty( $url ) && $url !== jetpack_site_icon_url() ) {
			// This is the option that is synced with dotcom
			Jetpack_Options::update_option( 'site_icon_url', $url );
		} else if ( empty( $url ) && did_action( 'delete_option_site_icon' ) ) {
			Jetpack_Options::delete_option( 'site_icon_url' );
		}
	}

	function jetpack_admin_ajax_callback() {
		// Check for nonce
		if ( ! isset( $_REQUEST['adminNonce'] ) || ! wp_verify_nonce( $_REQUEST['adminNonce'], 'jetpack-admin-nonce' ) || ! current_user_can( 'jetpack_manage_modules' ) ) {
			wp_die( 'permissions check failed' );
		}

		if ( isset( $_REQUEST['toggleModule'] ) && 'nux-toggle-module' == $_REQUEST['toggleModule'] ) {
			$slug = $_REQUEST['thisModuleSlug'];

			if ( ! in_array( $slug, Jetpack::get_available_modules() ) ) {
				wp_die( 'That is not a Jetpack module slug' );
			}

			if ( Jetpack::is_module_active( $slug ) ) {
				Jetpack::deactivate_module( $slug );
			} else {
				Jetpack::activate_module( $slug, false, false );
			}

			$modules = Jetpack_Admin::init()->get_modules();
			echo json_encode( $modules[ $slug ] );

			exit;
		}

		wp_die();
	}

	/*
	 * Sometimes we need to refresh the data,
	 * especially if the page is visited via a 'history'
	 * event like back/forward
	 */
	function jetpack_admin_ajax_refresh_data() {
		// Check for nonce
		if ( ! isset( $_REQUEST['adminNonce'] ) || ! wp_verify_nonce( $_REQUEST['adminNonce'], 'jetpack-admin-nonce' ) ) {
			wp_die( 'permissions check failed' );
		}

		if ( isset( $_REQUEST['refreshData'] ) && 'refresh' == $_REQUEST['refreshData'] ) {
			$modules = Jetpack_Admin::init()->get_modules();
			echo json_encode( $modules );
			exit;
		}

		wp_die();
	}

	/**
	 * The callback for the Jump Start ajax requests.
	 */
	function jetpack_jumpstart_ajax_callback() {
		// Check for nonce
		if ( ! isset( $_REQUEST['jumpstartNonce'] ) || ! wp_verify_nonce( $_REQUEST['jumpstartNonce'], 'jetpack-jumpstart-nonce' ) )
			wp_die( 'permissions check failed' );

		if ( isset( $_REQUEST['jumpStartActivate'] ) && 'jump-start-activate' == $_REQUEST['jumpStartActivate'] ) {
			// Update the jumpstart option
			if ( 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) ) {
				Jetpack_Options::update_option( 'jumpstart', 'jumpstart_activated' );
			}

			// Loops through the requested "Jump Start" modules, and activates them.
			// Custom 'no_message' state, so that no message will be shown on reload.
			$modules = $_REQUEST['jumpstartModSlug'];
			$module_slugs = array();
			foreach( $modules as $module => $value ) {
				$module_slugs[] = $value['module_slug'];
			}

			// Check for possible conflicting plugins
			$module_slugs_filtered = $this->filter_default_modules( $module_slugs );

			foreach ( $module_slugs_filtered as $module_slug ) {
				Jetpack::log( 'activate', $module_slug );
				Jetpack::activate_module( $module_slug, false, false );
				Jetpack::state( 'message', 'no_message' );
			}

			// Set the default sharing buttons and set to display on posts if none have been set.
			$sharing_services = get_option( 'sharing-services' );
			$sharing_options  = get_option( 'sharing-options' );
			if ( empty( $sharing_services['visible'] ) ) {
				// Default buttons to set
				$visible = array(
					'twitter',
					'facebook',
					'google-plus-1',
				);
				$hidden = array();

				// Set some sharing settings
				$sharing = new Sharing_Service();
				$sharing_options['global'] = array(
					'button_style'  => 'icon',
					'sharing_label' => $sharing->default_sharing_label,
					'open_links'    => 'same',
					'show'          => array( 'post' ),
					'custom'        => isset( $sharing_options['global']['custom'] ) ? $sharing_options['global']['custom'] : array()
				);

				update_option( 'sharing-options', $sharing_options );

				// Send a success response so that we can display an error message.
				$success = update_option( 'sharing-services', array( 'visible' => $visible, 'hidden' => $hidden ) );
				echo json_encode( $success );
				exit;
			}

		} elseif ( isset( $_REQUEST['disableJumpStart'] ) && true == $_REQUEST['disableJumpStart'] ) {
			// If dismissed, flag the jumpstart option as such.
			// Send a success response so that we can display an error message.
			if ( 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) ) {
				$success = Jetpack_Options::update_option( 'jumpstart', 'jumpstart_dismissed' );
				echo json_encode( $success );
				exit;
			}

		} elseif ( isset( $_REQUEST['jumpStartDeactivate'] ) && 'jump-start-deactivate' == $_REQUEST['jumpStartDeactivate'] ) {

			// FOR TESTING ONLY
			// @todo remove
			$modules = (array) $_REQUEST['jumpstartModSlug'];
			foreach( $modules as $module => $value ) {
				if ( !in_array( $value['module_slug'], Jetpack::get_default_modules() ) ) {
					Jetpack::log( 'deactivate', $value['module_slug'] );
					Jetpack::deactivate_module( $value['module_slug'] );
					Jetpack::state( 'message', 'no_message' );
				} else {
					Jetpack::log( 'activate', $value['module_slug'] );
					Jetpack::activate_module( $value['module_slug'], false, false );
					Jetpack::state( 'message', 'no_message' );
				}
			}

			Jetpack_Options::update_option( 'jumpstart', 'new_connection' );
			echo "reload the page";
		}

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
	}

	/**
	 * If there are any stats that need to be pushed, but haven't been, push them now.
	 */
	function __destruct() {
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
				}

				// Don't ever show to subscribers, but allow access to the page if they're trying to unlink.
				if ( ! current_user_can( 'edit_posts' ) ) {
					if ( isset( $_GET['redirect'] ) && 'sub-unlink' == $_GET['redirect'] ) {
						// We need this in order to unlink the user.
						$this->admin_page_load();
					}
					if ( ! wp_verify_nonce( 'jetpack-unlink' ) ) {
						$caps = array( 'do_not_allow' );
						break;
					}
				}

				if ( ! self::is_active() && ! current_user_can( 'jetpack_connect' ) ) {
					$caps = array( 'do_not_allow' );
					break;
				}
				/**
				 * Pass through. If it's not development mode, these should match the admin page.
				 * Let users disconnect if it's development mode, just in case things glitch.
				 */
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

		/**
		 * For the moment, remove Limit Login Attempts if its xmlrpc for Jetpack.
		 * If Limit Login Attempts is installed as a mu-plugin, it can occasionally
		 * generate false-positives.
		 */
		remove_filter( 'wp_login_failed', 'limit_login_failed' );

		if ( Jetpack::is_active() ) {
			// Allow Jetpack authentication
			add_filter( 'authenticate', array( $this, 'authenticate_jetpack' ), 10, 3 );
		}
	}

	/**
	 * Load language files
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
			wp_register_script( 'spin', plugins_url( '_inc/spin.js', JETPACK__PLUGIN_FILE ), false, '1.3' );
		}

		if ( ! wp_script_is( 'jquery.spin', 'registered' ) ) {
			wp_register_script( 'jquery.spin', plugins_url( '_inc/jquery.spin.js', JETPACK__PLUGIN_FILE ) , array( 'jquery', 'spin' ), '1.3' );
		}

		if ( ! wp_script_is( 'jetpack-gallery-settings', 'registered' ) ) {
			wp_register_script( 'jetpack-gallery-settings', plugins_url( '_inc/gallery-settings.js', JETPACK__PLUGIN_FILE ), array( 'media-views' ), '20121225' );
		}

		/**
		 * As jetpack_register_genericons is by default fired off a hook,
		 * the hook may have already fired by this point.
		 * So, let's just trigger it manually.
		 */
		require_once( JETPACK__PLUGIN_DIR . '_inc/genericons.php' );
		jetpack_register_genericons();

		if ( ! wp_style_is( 'jetpack-icons', 'registered' ) )
			wp_register_style( 'jetpack-icons', plugins_url( 'css/jetpack-icons.min.css', JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION );
	}

	/**
	 * Device Pixels support
	 * This improves the resolution of gravatars and wordpress.com uploads on hi-res and zoomed browsers.
	 */
	function devicepx() {
		if ( Jetpack::is_active() ) {
			wp_enqueue_script( 'devicepx', set_url_scheme( 'http://s0.wp.com/wp-content/js/devicepx-jetpack.js' ), array(), gmdate( 'oW' ), true );
		}
	}

	/*
	 * Returns the location of Jetpack's lib directory. This filter is applied
	 * in require_lib().
	 *
	 * @filter require_lib_dir
	 */
	function require_lib_dir() {
		return JETPACK__PLUGIN_DIR . '_inc/lib';
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
		// do_action( 'add_option_$option', '$option', '$value-of-the-option' );
		/**
		 * Fires when the site URL is updated.
		 * Determines if the site is the main site of a Mulitiste network.
		 *
		 * @since 3.3.0
		 *
		 * @param string jetpack_main_network_site.
		 * @param string network_site_url() Site URL for the "main" site of the current Multisite network.
		 */
		do_action( 'add_option_jetpack_main_network_site', 'jetpack_main_network_site', network_site_url() );
		/**
		 * Fires when the site URL is updated.
		 * Determines if the is part of a multi network.
		 *
		 * @since 3.3.0
		 *
		 * @param string jetpack_is_main_network.
		 * @param bool Jetpack::is_multi_network() Is the site part of a multi network.
		 */
		do_action( 'add_option_jetpack_is_main_network', 'jetpack_is_main_network', (string) (bool) Jetpack::is_multi_network() );
		/**
		 * Fires when the site URL is updated.
		 * Determines if the site is part of a multisite network.
		 *
		 * @since 3.4.0
		 *
		 * @param string jetpack_is_multi_site.
		 * @param bool is_multisite() Is the site part of a mutlisite network.
		 */
		do_action( 'add_option_jetpack_is_multi_site', 'jetpack_is_multi_site', (string) (bool) is_multisite() );
	}
	/**
	 * Triggered after a user updates the network settings via Network Settings Admin Page
	 *
	 */
	function update_jetpack_network_settings() {
		// Only sync this info for the main network site.
		do_action( 'add_option_jetpack_network_name', 'jetpack_network_name', Jetpack::network_name() );
		do_action( 'add_option_jetpack_network_allow_new_registrations', 'jetpack_network_allow_new_registrations', Jetpack::network_allow_new_registrations() );
		do_action( 'add_option_jetpack_network_add_new_users', 'jetpack_network_add_new_users', Jetpack::network_add_new_users() );
		do_action( 'add_option_jetpack_network_site_upload_space', 'jetpack_network_site_upload_space', Jetpack::network_site_upload_space() );
		do_action( 'add_option_jetpack_network_upload_file_types', 'jetpack_network_upload_file_types', Jetpack::network_upload_file_types() );
		do_action( 'add_option_jetpack_network_enable_administration_menus', 'jetpack_network_enable_administration_menus', Jetpack::network_enable_administration_menus() );

	}

	/**
	 * Get back if the current site is single user site.
	 *
	 * @return bool
	 */
	public static function is_single_user_site() {

		$user_query = new WP_User_Query( array(
			'blog_id' => get_current_blog_id(),
			'fields'  => 'ID',
			'number' => 2
		) );
		return 1 === (int) $user_query->get_total();
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

		if ( !class_exists( 'WP_Automatic_Updater' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/class-wp-upgrader.php' );
		}
		$updater = new WP_Automatic_Updater();
		$is_version_controlled = strval( $updater->is_vcs_checkout( $context = ABSPATH ) );
		// transients should not be empty
		if ( empty( $is_version_controlled ) ) {
			$is_version_controlled = '0';
		}
		return $is_version_controlled;
	}
	/*
	 * Sync back wp_version
	 */
	public static function get_wp_version() {
		global $wp_version;
		return $wp_version;
	}
	/**
	 * Keeps wp_version in sync with .com when WordPress core updates
	 **/
	public static function update_get_wp_version( $update, $meta_data ) {
		if ( 'update' === $meta_data['action'] && 'core' === $meta_data['type'] ) {
			/** This action is documented in wp-includes/option.php */
			/**
			 * This triggers the sync for the jetpack version
			 * See Jetpack_Sync options method for more info.
			 */
			do_action( 'add_option_jetpack_wp_version', 'jetpack_wp_version', (string) Jetpack::get_wp_version() );
		}
	}

	/**
	 * Triggers a sync of update counts and update details
	 */
	function sync_update_data() {
		// Anytime WordPress saves update data, we'll want to sync update data
		add_action( 'set_site_transient_update_plugins', array( 'Jetpack', 'refresh_update_data' ) );
		add_action( 'set_site_transient_update_themes', array( 'Jetpack', 'refresh_update_data' ) );
		add_action( 'set_site_transient_update_core', array( 'Jetpack', 'refresh_update_data' ) );
		// Anytime a connection to jetpack is made, sync the update data
		add_action( 'jetpack_site_registered', array( 'Jetpack', 'refresh_update_data' ) );
		// Anytime the Jetpack Version changes, sync the the update data
		add_action( 'updating_jetpack_version', array( 'Jetpack', 'refresh_update_data' ) );

		if ( current_user_can( 'update_core' ) && current_user_can( 'update_plugins' ) && current_user_can( 'update_themes' ) ) {
			$this->sync->mock_option( 'updates', array( 'Jetpack', 'get_updates' ) );
		}

		$this->sync->mock_option( 'update_details', array( 'Jetpack', 'get_update_details' ) );
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
		if ( current_user_can( 'update_core' ) && current_user_can( 'update_plugins' ) && current_user_can( 'update_themes' ) ) {
			/**
			 * Fires whenever the amount of updates needed for a site changes.
			 * Syncs an array that includes the number of theme, plugin, and core updates available, as well as the latest core version available.
			 *
			 * @since 3.7.0
			 *
			 * @param string jetpack_updates
			 * @param array Update counts calculated by Jetpack::get_updates
			 */
			do_action( 'add_option_jetpack_updates', 'jetpack_updates', Jetpack::get_updates() );
		}
		/**
		 * Fires whenever the amount of updates needed for a site changes.
		 * Syncs an array of core, theme, and plugin data, and which of each is out of date
		 *
		 * @since 3.7.0
		 *
		 * @param string jetpack_update_details
		 * @param array Update details calculated by Jetpack::get_update_details
		 */
		do_action( 'add_option_jetpack_update_details', 'jetpack_update_details', Jetpack::get_update_details() );
	}

	/**
	 * Invalides the transient as well as triggers the update of the mock option.
	 *
	 * @return null
	 */
	function is_single_user_site_invalidate() {
		/**
		 * Fires when a user is added or removed from a site.
		 * Determines if the site is a single user site.
		 *
		 * @since 3.4.0
		 *
		 * @param string jetpack_single_user_site.
		 * @param bool Jetpack::is_single_user_site() Is the current site a single user site.
		 */
		do_action( 'update_option_jetpack_single_user_site', 'jetpack_single_user_site', (bool) Jetpack::is_single_user_site() );
	}

	/**
	 * Is Jetpack active?
	 */
	public static function is_active() {
		return (bool) Jetpack_Data::get_access_token( JETPACK_MASTER_USER );
	}

	/**
	 * Is Jetpack in development (offline) mode?
	 */
	public static function is_development_mode() {
		$development_mode = false;

		if ( defined( 'JETPACK_DEV_DEBUG' ) ) {
			$development_mode = JETPACK_DEV_DEBUG;
		}

		elseif ( site_url() && false === strpos( site_url(), '.' ) ) {
			$development_mode = true;
		}
		/**
		 * Filters Jetpack's development mode.
		 *
		 * @see http://jetpack.me/support/development-mode/
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
					'http://jetpack.me/support/development-mode/'
				);
			} elseif ( site_url() && false === strpos( site_url(), '.' ) ) {
				$notice = sprintf(
					/* translators: %s is a URL */
					__( 'In <a href="%s" target="_blank">Development Mode</a>, via site URL lacking a dot (e.g. http://localhost).', 'jetpack' ),
					'http://jetpack.me/support/development-mode/'
				);
			} else {
				$notice = sprintf(
					/* translators: %s is a URL */
					__( 'In <a href="%s" target="_blank">Development Mode</a>, via the jetpack_development_mode filter.', 'jetpack' ),
					'http://jetpack.me/support/development-mode/'
				);
			}

			echo '<div class="updated" style="border-color: #f0821e;"><p>' . $notice . '</p></div>';
		}

		// Throw up a notice if using a development version and as for feedback.
		if ( Jetpack::is_development_version() ) {
			/* translators: %s is a URL */
			$notice = sprintf( __( 'You are currently running a development version of Jetpack. <a href="%s" target="_blank">Submit your feedback</a>', 'jetpack' ), 'https://jetpack.me/contact-support/beta-group/' );

			echo '<div class="updated" style="border-color: #f0821e;"><p>' . $notice . '</p></div>';
		}
	}

	/**
	 * Whether Jetpack's version maps to a public release, or a development version.
	 */
	public static function is_development_version() {
		return ! preg_match( '/^\d+(\.\d+)+$/', JETPACK__VERSION );
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
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => $user_id,
		) );
		$xml->query( 'wpcom.getUser' );
		if ( ! $xml->isError() ) {
			return $xml->getResponse();
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
	}

	/**
	 * Synchronize connected user role changes
	 */
	function user_role_change( $user_id ) {
		if ( Jetpack::is_active() && Jetpack::is_user_connected( $user_id ) ) {
			$current_user_id = get_current_user_id();
			wp_set_current_user( $user_id );
			$role = $this->translate_current_user_to_role();
			$signed_role = $this->sign_role( $role );
			wp_set_current_user( $current_user_id );

			$master_token   = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );
			$master_user_id = absint( $master_token->external_user_id );

			if ( ! $master_user_id )
				return; // this shouldn't happen

			Jetpack::xmlrpc_async_call( 'jetpack.updateRole', $user_id, $signed_role );
			//@todo retry on failure

			//try to choose a new master if we're demoting the current one
			if ( $user_id == $master_user_id && 'administrator' != $role ) {
				$query = new WP_User_Query(
					array(
						'fields'  => array( 'id' ),
						'role'    => 'administrator',
						'orderby' => 'id',
						'exclude' => array( $master_user_id ),
					)
				);
				$new_master = false;
				foreach ( $query->results as $result ) {
					$uid = absint( $result->id );
					if ( $uid && Jetpack::is_user_connected( $uid ) ) {
						$new_master = $uid;
						break;
					}
				}

				if ( $new_master ) {
					Jetpack_Options::update_option( 'master_user', $new_master );
				}
				// else disconnect..?
			}
		}
	}

	/**
	 * Loads the currently active modules.
	 */
	public static function load_modules() {
		if ( ! self::is_active() && !self::is_development_mode() ) {
			if ( ! is_multisite() || ! get_site_option( 'jetpack_protect_active' ) ) {
				return;
			}
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

		foreach ( $modules as $module ) {
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

			require Jetpack::get_module_path( $module );
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
		if ( Jetpack::is_active() || Jetpack::is_development_mode() )
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

		return $active_plugins;
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
		if ( apply_filters( 'jetpack_disable_twitter_cards', true ) ) {
			require_once JETPACK__PLUGIN_DIR . 'class.jetpack-twitter-cards.php';
		}
	}




	/*
	 *
	 * Jetpack Security Reports
	 *
	 * Allowed types: login_form, backup, file_scanning, spam
	 *
	 * Args for login_form and spam: 'blocked'=>(int)(optional), 'status'=>(string)(ok, warning, error), 'message'=>(optional, disregarded if status is ok, allowed tags: a, em, strong)
	 *
	 * Args for backup and file_scanning: 'last'=>(timestamp)(optional), 'next'=>(timestamp)(optional), 'status'=>(string)(ok, warning, error), 'message'=>(optional, disregarded if status is ok, allowed tags: a, em, strong)
	 *
	 *
	 * Example code to submit a security report:
	 *
	 *  function akismet_submit_jetpack_security_report() {
	 *  	Jetpack::submit_security_report( 'spam', __FILE__, $args = array( 'blocked' => 138284, status => 'ok' ) );
	 *  }
	 *  add_action( 'jetpack_security_report', 'akismet_submit_jetpack_security_report' );
	 *
	 */


	/**
	 * Calls for security report submissions.
	 *
	 * @return null
	 */
	public static function perform_security_reporting() {
		$no_check_needed = get_site_transient( 'security_report_performed_recently' );

		if ( $no_check_needed ) {
			return;
		}

		/**
		 * Fires before a security report is created.
		 *
		 * @since 3.4.0
		 */
		do_action( 'jetpack_security_report' );

		Jetpack_Options::update_option( 'security_report', self::$security_report );
		set_site_transient( 'security_report_performed_recently', 1, 15 * MINUTE_IN_SECONDS );
	}

	/**
	 * Allows plugins to submit security reports.
 	 *
	 * @param string  $type         Report type (login_form, backup, file_scanning, spam)
	 * @param string  $plugin_file  Plugin __FILE__, so that we can pull plugin data
	 * @param array   $args         See definitions above
	 */
	public static function submit_security_report( $type = '', $plugin_file = '', $args = array() ) {

		if( !doing_action( 'jetpack_security_report' ) ) {
			return new WP_Error( 'not_collecting_report', 'Not currently collecting security reports.  Please use the jetpack_security_report hook.' );
		}

		if( !is_string( $type ) || !is_string( $plugin_file ) ) {
			return new WP_Error( 'invalid_security_report', 'Invalid Security Report' );
		}

		if( !function_exists( 'get_plugin_data' ) ) {
			include( ABSPATH . 'wp-admin/includes/plugin.php' );
		}

		//Get rid of any non-allowed args
		$args = array_intersect_key( $args, array_flip( array( 'blocked', 'last', 'next', 'status', 'message' ) ) );

		$plugin = get_plugin_data( $plugin_file );

		if ( !$plugin['Name'] ) {
			return new WP_Error( 'security_report_missing_plugin_name', 'Invalid Plugin File Provided' );
		}

		// Sanitize everything to make sure we're not syncing something wonky
		$type = sanitize_key( $type );

		$args['plugin'] = $plugin;

		// Cast blocked, last and next as integers.
		// Last and next should be in unix timestamp format
		if ( isset( $args['blocked'] ) ) {
			$args['blocked'] = (int) $args['blocked'];
		}
		if ( isset( $args['last'] ) ) {
			$args['last'] = (int) $args['last'];
		}
		if ( isset( $args['next'] ) ) {
			$args['next'] = (int) $args['next'];
		}
		if ( !in_array( $args['status'], array( 'ok', 'warning', 'error' ) ) ) {
			$args['status'] = 'ok';
		}
		if ( isset( $args['message'] ) ) {

			if( $args['status'] == 'ok' ) {
				unset( $args['message'] );
			}

			$allowed_html = array(
			    'a' => array(
			        'href' => array(),
			        'title' => array()
			    ),
			    'em' => array(),
			    'strong' => array(),
			);

			$args['message'] = wp_kses( $args['message'], $allowed_html );
		}

		$plugin_name = $plugin[ 'Name' ];

		self::$security_report[ $type ][ $plugin_name ] = $args;
	}

	/**
	 * Collects a new report if needed, then returns it.
	 */
	public function get_security_report() {
		self::perform_security_reporting();
		return Jetpack_Options::get_option( 'security_report' );
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
	* Stores two secrets and a timestamp so WordPress.com can make a request back and verify an action
	* Does some extra verification so urls (such as those to public-api, register, etc) can't just be crafted
	* $name must be a registered option name.
	*/
	public static function create_nonce( $name ) {
		$secret = wp_generate_password( 32, false ) . ':' . wp_generate_password( 32, false ) . ':' . ( time() + 600 );

		Jetpack_Options::update_option( $name, $secret );
		@list( $secret_1, $secret_2, $eol ) = explode( ':', Jetpack_Options::get_option( $name ) );
		if ( empty( $secret_1 ) || empty( $secret_2 ) || $eol < time() )
			return new Jetpack_Error( 'missing_secrets' );

		return array(
			'secret_1' => $secret_1,
			'secret_2' => $secret_2,
			'eol'      => $eol,
		);
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
			'name'                  => 'Module Name',
			'description'           => 'Module Description',
			'jumpstart_desc'        => 'Jumpstart Description',
			'sort'                  => 'Sort Order',
			'recommendation_order'  => 'Recommendation Order',
			'introduced'            => 'First Introduced',
			'changed'               => 'Major Changes In',
			'deactivate'            => 'Deactivate',
			'free'                  => 'Free',
			'requires_connection'   => 'Requires Connection',
			'auto_activate'         => 'Auto Activate',
			'module_tags'           => 'Module Tags',
			'feature'               => 'Feature',
		);

		$file = Jetpack::get_module_path( Jetpack::get_module_slug( $module ) );

		$mod = Jetpack::get_file_data( $file, $headers );
		if ( empty( $mod['name'] ) ) {
			return false;
		}

		$mod['jumpstart_desc']          = _x( $mod['jumpstart_desc'], 'Jumpstart Description', 'jetpack' );
		$mod['name']                    = _x( $mod['name'], 'Module Name', 'jetpack' );
		$mod['description']             = _x( $mod['description'], 'Module Description', 'jetpack' );
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
		$file_data_option = Jetpack_Options::get_option( 'file_data', array() );
		$key              = md5( $file_name . serialize( $headers ) );
		$refresh_cache    = is_admin() && isset( $_GET['page'] ) && 'jetpack' === substr( $_GET['page'], 0, 7 );

		// If we don't need to refresh the cache, and already have the value, short-circuit!
		if ( ! $refresh_cache && isset( $file_data_option[ JETPACK__VERSION ][ $key ] ) ) {
			return $file_data_option[ JETPACK__VERSION ][ $key ];
		}

		$data = get_file_data( $file, $headers );

		// Strip out any old Jetpack versions that are cluttering the option.
		$file_data_option = array_intersect_key( (array) $file_data_option, array( JETPACK__VERSION => null ) );
		$file_data_option[ JETPACK__VERSION ][ $key ] = $data;
		Jetpack_Options::update_option( 'file_data', $file_data_option );

		return $data;
	}

	public static function translate_module_tag( $untranslated_tag ) {
		// Tags are aggregated by tools/build-module-headings-translations.php
		// and output in modules/module-headings.php
		return _x( $untranslated_tag, 'Module Tag', 'jetpack' );
	}

	/**
	 * Get a list of activated modules as an array of module slugs.
	 */
	public static function get_active_modules() {
		$active = Jetpack_Options::get_option( 'active_modules' );
		if ( ! is_array( $active ) )
			$active = array();
		if ( is_admin() && ( class_exists( 'VaultPress' ) || function_exists( 'vaultpress_contact_service' ) ) ) {
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
		Jetpack::state( 'php_errors', ob_get_clean() );
	}

	public static function activate_default_modules( $min_version = false, $max_version = false, $other_modules = array() ) {
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

		if ( $deactivated ) {
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
				Jetpack_Options::update_option( 'active_modules', array_unique( $active ) );
				continue;
			}

			if ( in_array( $module, $active ) ) {
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
			wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
			Jetpack::state( 'error', 'module_activation_failed' );
			Jetpack::state( 'module', $module );
			ob_start();
			require $file;
			/**
			 * Fires when a specific module is activated.
			 *
			 * @since 1.9.0
			 *
			 * @param string $module Module slug.
			 */
			do_action( 'jetpack_activate_module', $module );
			$active[] = $module;
			$state    = in_array( $module, $other_modules ) ? 'reactivated_modules' : 'activated_modules';
			if ( $active_state = Jetpack::state( $state ) ) {
				$active_state = explode( ',', $active_state );
			} else {
				$active_state = array();
			}
			$active_state[] = $module;
			Jetpack::state( $state, implode( ',', $active_state ) );
			Jetpack_Options::update_option( 'active_modules', array_unique( $active ) );
			ob_end_clean();
		}
		Jetpack::state( 'error', false );
		Jetpack::state( 'module', false );
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

		// Check the file for fatal errors, a la wp-admin/plugins.php::activate
		Jetpack::state( 'module', $module );
		Jetpack::state( 'error', 'module_activation_failed' ); // we'll override this later if the plugin can be included without fatal error

		Jetpack::catch_errors( true );
		ob_start();
		require Jetpack::get_module_path( $module );
		/** This action is documented in class.jetpack.php */
		do_action( 'jetpack_activate_module', $module );
		$active[] = $module;
		Jetpack_Options::update_option( 'active_modules', array_unique( $active ) );
		Jetpack::state( 'error', false ); // the override
		Jetpack::state( 'message', 'module_activated' );
		Jetpack::state( 'module', $module );
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
	}

	function activate_module_actions( $module ) {
		/**
		 * Fires when a module is activated.
		 * The dynamic part of the filter, $module, is the module slug.
		 *
		 * @since 1.9.0
		 *
		 * @param string $module Module slug.
		 */
		do_action( "jetpack_activate_module_$module", $module );

		$this->sync->sync_all_module_options( $module );
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

		/**
		 * Fires when a module is deactivated.
		 * The dynamic part of the filter, $module, is the module slug.
		 *
		 * @since 1.9.0
		 *
		 * @param string $module Module slug.
		 */
		do_action( "jetpack_deactivate_module_$module", $module );

		// A flag for Jump Start so it's not shown again.
		if ( 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) ) {
			Jetpack_Options::update_option( 'jumpstart', 'jetpack_action_taken' );

			//Jump start is being dismissed send data to MC Stats
			$jetpack->stat( 'jumpstart', 'manual,deactivated-'.$module );

			$jetpack->do_stats( 'server_side' );
		}

		return Jetpack_Options::update_option( 'active_modules', array_unique( $new ) );
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

		Jetpack::plugin_initialize();
	}
	/**
	 * Runs before bumping version numbers up to a new version
	 * @param  (string) $version    Version:timestamp
	 * @param  (string) $old_version Old Version:timestamp or false if not set yet.
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

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.deregister' );

		Jetpack_Options::delete_option(
			array(
				'register',
				'blog_token',
				'user_token',
				'user_tokens',
				'master_user',
				'time_diff',
				'fallback_no_verify_ssl_certs',
			)
		);

		if ( $update_activated_state ) {
			Jetpack_Options::update_option( 'activated', 4 );
		}

		$jetpack_unique_connection = Jetpack_Options::get_option( 'unique_connection' );
		// Check then record unique disconnection if site has never been disconnected previously
		if ( -1 == $jetpack_unique_connection['disconnected'] ) {
			$jetpack_unique_connection['disconnected'] = 1;
		}
		else {
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
		$log = Jetpack_Options::get_option( 'log', array() );

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
	 * @param $num   (int)    - get specific number of latest results
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

	/* Admin Pages */

	function admin_init() {
		// If the plugin is not connected, display a connect message.
		if (
			// the plugin was auto-activated and needs its candy
			Jetpack_Options::get_option( 'do_activate' )
		||
			// the plugin is active, but was never activated.  Probably came from a site-wide network activation
			! Jetpack_Options::get_option( 'activated' )
		) {
			Jetpack::plugin_initialize();
		}

		if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
			if ( 4 != Jetpack_Options::get_option( 'activated' ) ) {
				// Show connect notice on dashboard and plugins pages
				add_action( 'load-index.php', array( $this, 'prepare_connect_notice' ) );
				add_action( 'load-plugins.php', array( $this, 'prepare_connect_notice' ) );
			}
		} elseif ( false === Jetpack_Options::get_option( 'fallback_no_verify_ssl_certs' ) ) {
			// Upgrade: 1.1 -> 1.1.1
			// Check and see if host can verify the Jetpack servers' SSL certificate
			$args = array();
			Jetpack_Client::_wp_remote_request(
				Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'test' ) ),
				$args,
				true
			);
		} else {
			// Show the notice on the Dashboard only for now

			add_action( 'load-index.php', array( $this, 'prepare_manage_jetpack_notice' ) );

			// Identity crisis notices
			add_action( 'jetpack_notices', array( $this, 'alert_identity_crisis' ) );
			add_action( 'admin_notices',   array( $this, 'alert_identity_crisis' ) );
		}

		// If the plugin has just been disconnected from WP.com, show the survey notice
		if ( isset( $_GET['disconnected'] ) && 'true' === $_GET['disconnected'] ) {
			add_action( 'jetpack_notices', array( $this, 'disconnect_survey_notice' ) );
		}

		if ( current_user_can( 'manage_options' ) && 'ALWAYS' == JETPACK_CLIENT__HTTPS && ! self::permit_ssl() ) {
			add_action( 'admin_notices', array( $this, 'alert_required_ssl_fail' ) );
		}

		add_action( 'load-plugins.php', array( $this, 'intercept_plugin_error_scrape_init' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_menu_css' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( JETPACK__PLUGIN_DIR . 'jetpack.php' ), array( $this, 'plugin_action_links' ) );

		if ( Jetpack::is_active() || Jetpack::is_development_mode() ) {
			// Artificially throw errors in certain whitelisted cases during plugin activation
			add_action( 'activate_plugin', array( $this, 'throw_error_on_activate_plugin' ) );

			// Kick off synchronization of user role when it changes
			add_action( 'set_user_role', array( $this, 'user_role_change' ) );
		}
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

	function prepare_connect_notice() {
		add_action( 'admin_print_styles', array( $this, 'admin_banner_styles' ) );

		add_action( 'admin_notices', array( $this, 'admin_connect_notice' ) );

		if ( Jetpack::state( 'network_nag' ) )
			add_action( 'network_admin_notices', array( $this, 'network_connect_notice' ) );
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
	}

	function remote_request_handlers() {
		switch ( current_filter() ) {
		case 'wp_ajax_nopriv_jetpack_upload_file' :
			$response = $this->upload_handler();
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

	function upload_handler() {
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
			'<p><a href="http://jetpack.me/faq/" target="_blank">'     . __( 'Jetpack FAQ',     'jetpack' ) . '</a></p>' .
			'<p><a href="http://jetpack.me/support/" target="_blank">' . __( 'Jetpack Support', 'jetpack' ) . '</a></p>' .
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

		wp_enqueue_style( 'jetpack', plugins_url( "css/jetpack-banners{$min}.css", JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION . '-20121016' );
		wp_style_add_data( 'jetpack', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack', 'suffix', $min );
	}

	function admin_scripts() {
		wp_enqueue_script( 'jetpack-js', plugins_url( '_inc/jp.js', JETPACK__PLUGIN_FILE ), array( 'jquery', 'wp-util' ), JETPACK__VERSION . '-20121111' );
		wp_localize_script(
			'jetpack-js',
			'jetpackL10n',
			array(
				'ays_disconnect' => "This will deactivate all Jetpack modules.\nAre you sure you want to disconnect?",
				'ays_unlink'     => "This will prevent user-specific modules such as Publicize, Notifications and Post By Email from working.\nAre you sure you want to unlink?",
				'ays_dismiss'    => "This will deactivate Jetpack.\nAre you sure you want to deactivate Jetpack?",
			)
		);
		add_action( 'admin_footer', array( $this, 'do_stats' ) );
	}

	function plugin_action_links( $actions ) {

		$jetpack_home = array( 'jetpack-home' => sprintf( '<a href="%s">%s</a>', Jetpack::admin_url( 'page=jetpack' ), __( 'Jetpack', 'jetpack' ) ) );

		if( current_user_can( 'jetpack_manage_modules' ) && ( Jetpack::is_active() || Jetpack::is_development_mode() ) ) {
			return array_merge(
				$jetpack_home,
				array( 'settings' => sprintf( '<a href="%s">%s</a>', Jetpack::admin_url( 'page=jetpack_modules' ), __( 'Settings', 'jetpack' ) ) ),
				array( 'support' => sprintf( '<a href="%s">%s</a>', Jetpack::admin_url( 'page=jetpack-debugger '), __( 'Support', 'jetpack' ) ) ),
				$actions
				);
			}

		return array_merge( $jetpack_home, $actions );
	}

	function admin_connect_notice() {
		// Don't show the connect notice anywhere but the plugins.php after activating
		$current = get_current_screen();
		if ( 'plugins' !== $current->parent_base )
			return;

		if ( ! current_user_can( 'jetpack_connect' ) )
			return;

		$dismiss_and_deactivate_url = wp_nonce_url( Jetpack::admin_url( '?page=jetpack&jetpack-notice=dismiss' ), 'jetpack-deactivate' );
		?>
		<div id="message" class="updated jetpack-message jp-banner" style="display:block !important;">
			<a class="jp-banner__dismiss" href="<?php echo esc_url( $dismiss_and_deactivate_url ); ?>" title="<?php esc_attr_e( 'Dismiss this notice and deactivate Jetpack.', 'jetpack' ); ?>"></a>
			<?php if ( in_array( Jetpack_Options::get_option( 'activated' ) , array( 1, 2, 3 ) ) ) : ?>
				<div class="jp-banner__content is-connection">
					<h4><?php _e( 'Your Jetpack is almost ready!', 'jetpack' ); ?></h4>
					<p><?php _e( 'Connect now to enable features like Stats, Likes, and Social Sharing.', 'jetpack' ); ?></p>
				</div>
				<div class="jp-banner__action-container is-connection">
						<a href="<?php echo $this->build_connect_url() ?>" class="jp-banner__button" id="wpcom-connect"><?php _e( 'Connect to WordPress.com', 'jetpack' ); ?></a>
				</div>
			<?php else : ?>
				<div class="jp-banner__content">
					<h4><?php _e( 'Jetpack is installed!', 'jetpack' ) ?></h4>
					<p><?php _e( 'It\'s ready to bring awesome, WordPress.com cloud-powered features to your site.', 'jetpack' ) ?></p>
				</div>
				<div class="jp-banner__action-container">
					<a href="<?php echo Jetpack::admin_url() ?>" class="jp-banner__button" id="wpcom-connect"><?php _e( 'Learn More', 'jetpack' ); ?></a>
				</div>
			<?php endif; ?>
		</div>

		<?php
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
		if ( ! in_array( $screen->base, array( 'dashboard' ) ) || $screen->is_network || $screen->action )
			return;

		// Only show it if don't have the managment option set.
		// And not dismissed it already.
		if ( ! $this->can_display_jetpack_manage_notice() || Jetpack_Options::get_option( 'dismissed_manage_banner' ) ) {
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
		<div id="message" class="updated jetpack-message jp-banner is-opt-in" style="display:block !important;">
			<a class="jp-banner__dismiss" href="<?php echo esc_url( $opt_out_url ); ?>" title="<?php esc_attr_e( 'Dismiss this notice for now.', 'jetpack' ); ?>"></a>
			<div class="jp-banner__content">
				<h4><?php esc_html_e( 'New in Jetpack: Centralized Site Management', 'jetpack' ); ?></h4>
				<p><?php printf( __( 'Manage multiple sites from one dashboard at wordpress.com/sites. Enabling allows all existing, connected Administrators to modify your site from WordPress.com. <a href="%s" target="_blank">Learn More</a>.', 'jetpack' ), 'http://jetpack.me/support/site-management' ); ?></p>
			</div>
			<div class="jp-banner__action-container is-opt-in">
				<a href="<?php echo esc_url( $opt_in_url ); ?>" class="jp-banner__button" id="wpcom-connect"><?php _e( 'Activate now', 'jetpack' ); ?></a>
			</div>
		</div>
		<?php
	}

	/**
	 * Returns the url that the user clicks to remove the notice for the big banner
	 * @return (string)
	 */
	function opt_out_jetpack_manage_url() {
		$referer = '&_wp_http_referer=' . add_query_arg( '_wp_http_referer', null );
		return wp_nonce_url( Jetpack::admin_url( 'jetpack-notice=jetpack-manage-opt-out' . $referer ), 'jetpack_manage_banner_opt_out' );
	}
	/**
	 * Returns the url that the user clicks to opt in to Jetpack Manage
	 * @return (string)
	 */
	function opt_in_jetpack_manage_url() {
		return wp_nonce_url( Jetpack::admin_url( 'jetpack-notice=jetpack-manage-opt-in' ), 'jetpack_manage_banner_opt_in' );
	}

	function opt_in_jetpack_manage_notice() {
		?>
		<div class="wrap">
			<div id="message" class="jetpack-message is-opt-in">
				<?php echo sprintf( __( '<p><a href="%1$s" title="Opt in to WordPress.com Site Management" >Activate Site Management</a> to manage multiple sites from our centralized dashboard at wordpress.com/sites. <a href="%2$s" target="_blank">Learn more</a>.</p><a href="%1$s" class="jp-button">Activate Now</a>', 'jetpack' ), $this->opt_in_jetpack_manage_url(), 'http://jetpack.me/support/site-management' ); ?>
			</div>
		</div>
		<?php

	}
	/**
	 * Determines whether to show the notice of not true = display notice
	 * @return (bool)
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

	function network_connect_notice() {
		?>
		<div id="message" class="updated jetpack-message">
			<div class="squeezer">
				<h4><?php _e( '<strong>Jetpack is activated!</strong> Each site on your network must be connected individually by an admin on that site.', 'jetpack' ) ?></h4>
			</div>
		</div>
		<?php
	}

	public static function jetpack_comment_notice() {
		if ( in_array( 'comments', Jetpack::get_active_modules() ) ) {
			return '';
		}

		$jetpack_old_version = explode( ':', Jetpack_Options::get_option( 'old_version' ) );
		$jetpack_new_version = explode( ':', Jetpack_Options::get_option( 'version' ) );

		if ( $jetpack_old_version ) {
			if ( version_compare( $jetpack_old_version[0], '1.4', '>=' ) ) {
				return '';
			}
		}

		if ( $jetpack_new_version ) {
			if ( version_compare( $jetpack_new_version[0], '1.4-something', '<' ) ) {
				return '';
			}
		}

		return '<br /><br />' . sprintf(
			__( 'Jetpack now includes Comments, which enables your visitors to use their WordPress.com, Twitter, or Facebook accounts when commenting on your site. To activate Comments, <a href="%s">%s</a>.', 'jetpack' ),
			wp_nonce_url(
				Jetpack::admin_url(
					array(
						'page'   => 'jetpack',
						'action' => 'activate',
						'module' => 'comments',
					)
				),
				'jetpack_activate-comments'
			),
			__( 'click here', 'jetpack' )
		);
	}

	/**
	 * Show the survey link when the user has just disconnected Jetpack.
	 */
	function disconnect_survey_notice() {
		?>
		<div class="wrap">
			<div id="message" class="jetpack-message stay-visible">
				<div class="squeezer">
					<h4>
						<?php _e( 'You have successfully disconnected Jetpack.', 'jetpack' ); ?>
						<br />
						<?php echo sprintf(
							__( 'Would you tell us why? Just <a href="%1$s" target="%2$s">answering two simple questions</a> would help us improve Jetpack.', 'jetpack' ),
							'https://jetpack.me/survey-disconnected/',
							'_blank'
						); ?>
					</h4>
				</div>
			</div>
		</div>
		<?php
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
	 * 4 - redirect to https://jetpack.wordpress.com/jetpack.authorize/1/
	 * 5 - user logs in with WP.com account
	 * 6 - redirect to this site's wp-admin/index.php?page=jetpack&action=authorize with
	 *     code <-- OAuth2 style authorization code
	 * 7 - ::admin_page_load() action=authorize
	 * 8 - Jetpack_Client_Server::authorize()
	 * 9 - Jetpack_Client_Server::get_token()
	 * 10- GET https://jetpack.wordpress.com/jetpack.token/1/ with
	 *     client_id, client_secret, grant_type, code, redirect_uri:action=authorize, state, scope, user_email, user_login
	 * 11- which responds with
	 *     access_token, token_type, scope
	 * 12- Jetpack_Client_Server::authorize() stores jetpack_options: user_token => access_token.$user_id
	 * 13- Jetpack::activate_default_modules()
	 *     Deactivates deprecated plugins
	 *     Activates all default modules
	 *     Catches errors: redirects to wp-admin/index.php?page=jetpack state:error=something
	 * 14- redirect to this site's wp-admin/index.php?page=jetpack with state:message=authorized
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
				$connect_url = $this->build_connect_url( true );
				if ( isset( $_GET['notes_iframe'] ) )
					$connect_url .= '&notes_iframe';
				wp_redirect( $connect_url );
				exit;
			} else {
				Jetpack::state( 'message', 'already_authorized' );
				wp_safe_redirect( Jetpack::admin_url() );
				exit;
			}
		}


		if ( isset( $_GET['action'] ) ) {
			switch ( $_GET['action'] ) {
			case 'authorize' :
				if ( Jetpack::is_active() && Jetpack::is_user_connected() ) {
					Jetpack::state( 'message', 'already_authorized' );
					wp_safe_redirect( Jetpack::admin_url() );
					exit;
				}
				Jetpack::log( 'authorize' );
				$client_server = new Jetpack_Client_Server;
				$client_server->authorize();
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
					Jetpack::state( 'error_description', $registered->get_error_message() );
					break;
				}

				wp_redirect( $this->build_connect_url( true ) );
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
				wp_redirect( $this->build_connect_url( true ) );
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

		switch ( $error ) {
		case 'cheatin' :
			$this->error = __( 'Cheatin&#8217; uh?', 'jetpack' );
			break;
		case 'access_denied' :
			$this->error = __( 'You need to authorize the Jetpack connection between your site and WordPress.com to enable the awesome features.', 'jetpack' );
			break;
		case 'wrong_state' :
			$this->error = __( 'Don&#8217;t cross the streams!  You need to stay logged in to your WordPress blog while you authorize Jetpack.', 'jetpack' );
			break;
		case 'invalid_client' :
			// @todo re-register instead of deactivate/reactivate
			$this->error = __( 'Return to sender.  Whoops! It looks like you got the wrong Jetpack in the mail; deactivate then reactivate the Jetpack plugin to get a new one.', 'jetpack' );
			break;
		case 'invalid_grant' :
			$this->error = __( 'Wrong size.  Hm&#8230; it seems your Jetpack doesn&#8217;t quite fit.  Have you lost weight? Click &#8220;Connect to WordPress.com&#8221; again to get your Jetpack adjusted.', 'jetpack' );
			break;
		case 'site_inaccessible' :
		case 'site_requires_authorization' :
			$this->error = sprintf( __( 'Your website needs to be publicly accessible to use Jetpack: %s', 'jetpack' ), "<code>$error</code>" );
			break;
		case 'module_activation_failed' :
			$module = Jetpack::state( 'module' );
			if ( ! empty( $module ) && $mod = Jetpack::get_module( $module ) ) {
				$this->error = sprintf( __( '%s could not be activated because it triggered a <strong>fatal error</strong>. Perhaps there is a conflict with another plugin you have installed?', 'jetpack' ), $mod['name'] );
				if ( isset( $this->plugins_to_deactivate[$module] ) ) {
					$this->error .= ' ' . sprintf( __( 'Do you still have the %s plugin installed?', 'jetpack' ), $this->plugins_to_deactivate[$module][1] );
				}
			} else {
				$this->error = __( 'Module could not be activated because it triggered a <strong>fatal error</strong>. Perhaps there is a conflict with another plugin you have installed?', 'jetpack' );
			}
			if ( $php_errors = Jetpack::state( 'php_errors' ) ) {
				$this->error .= "<br />\n";
				$this->error .= $php_errors;
			}
			break;
		case 'master_user_required' :
			$module = Jetpack::state( 'module' );
			$module_name = '';
			if ( ! empty( $module ) && $mod = Jetpack::get_module( $module ) ) {
				$module_name = $mod['name'];
			}

			$master_user = Jetpack_Options::get_option( 'master_user' );
			$master_userdata = get_userdata( $master_user ) ;
			if ( $master_userdata ) {
				if ( ! in_array( $module, Jetpack::get_active_modules() ) ) {
					$this->error = sprintf( __( '%s was not activated.' , 'jetpack' ), $module_name );
				} else {
					$this->error = sprintf( __( '%s was not deactivated.' , 'jetpack' ), $module_name );
				}
				$this->error .= '  ' . sprintf( __( 'This module can only be altered by %s, the user who initiated the Jetpack connection on this site.' , 'jetpack' ), esc_html( $master_userdata->display_name ) );

			} else {
				$this->error = sprintf( __( 'Only the user who initiated the Jetpack connection on this site can toggle %s, but that user no longer exists. This should not happen.', 'jetpack' ), $module_name );
			}
			break;
		case 'not_public' :
			$this->error = __( '<strong>Your Jetpack has a glitch.</strong> Connecting this site with WordPress.com is not possible. This usually means your site is not publicly accessible (localhost).', 'jetpack' );
			break;
		case 'wpcom_408' :
		case 'wpcom_5??' :
		case 'wpcom_bad_response' :
		case 'wpcom_outage' :
			$this->error = __( 'WordPress.com is currently having problems and is unable to fuel up your Jetpack.  Please try again later.', 'jetpack' );
			break;
		case 'register_http_request_failed' :
		case 'token_http_request_failed' :
			$this->error = sprintf( __( 'Jetpack could not contact WordPress.com: %s.  This usually means something is incorrectly configured on your web host.', 'jetpack' ), "<code>$error</code>" );
			break;
		default :
			if ( empty( $error ) ) {
				break;
			}
			$error = trim( substr( strip_tags( $error ), 0, 20 ) );
			// no break: fall through
		case 'no_role' :
		case 'no_cap' :
		case 'no_code' :
		case 'no_state' :
		case 'invalid_state' :
		case 'invalid_request' :
		case 'invalid_scope' :
		case 'unsupported_response_type' :
		case 'invalid_token' :
		case 'no_token' :
		case 'missing_secrets' :
		case 'home_missing' :
		case 'siteurl_missing' :
		case 'gmt_offset_missing' :
		case 'site_name_missing' :
		case 'secret_1_missing' :
		case 'secret_2_missing' :
		case 'site_lang_missing' :
		case 'home_malformed' :
		case 'siteurl_malformed' :
		case 'gmt_offset_malformed' :
		case 'timezone_string_malformed' :
		case 'site_name_malformed' :
		case 'secret_1_malformed' :
		case 'secret_2_malformed' :
		case 'site_lang_malformed' :
		case 'secrets_mismatch' :
		case 'verify_secret_1_missing' :
		case 'verify_secret_1_malformed' :
		case 'verify_secrets_missing' :
		case 'verify_secrets_mismatch' :
			$error = esc_html( $error );
			$this->error = sprintf( __( '<strong>Your Jetpack has a glitch.</strong>  Something went wrong that&#8217;s never supposed to happen.  Guess you&#8217;re just lucky: %s', 'jetpack' ), "<code>$error</code>" );
			if ( ! Jetpack::is_active() ) {
				$this->error .= '<br />';
				$this->error .= sprintf( __( 'Try connecting again.', 'jetpack' ) );
			}
			break;
		}

		$message_code = Jetpack::state( 'message' );

		$active_state = Jetpack::state( 'activated_modules' );
		if ( ! empty( $active_state ) ) {
			$available    = Jetpack::get_available_modules();
			$active_state = explode( ',', $active_state );
			$active_state = array_intersect( $active_state, $available );
			if ( count( $active_state ) ) {
				foreach ( $active_state as $mod ) {
					$this->stat( 'module-activated', $mod );
				}
			} else {
				$active_state = false;
			}
		}
		if( Jetpack::state( 'optin-manage' ) ) {
			$activated_manage = $message_code;
			$message_code = 'jetpack-manage';

		}
		switch ( $message_code ) {
		case 'modules_activated' :
			$this->message = sprintf(
				__( 'Welcome to <strong>Jetpack %s</strong>!', 'jetpack' ),
				JETPACK__VERSION
			);

			if ( $active_state ) {
				$titles = array();
				foreach ( $active_state as $mod ) {
					if ( $mod_headers = Jetpack::get_module( $mod ) ) {
						$titles[] = '<strong>' . preg_replace( '/\s+(?![^<>]++>)/', '&nbsp;', $mod_headers['name'] ) . '</strong>';
					}
				}
				if ( $titles ) {
					$this->message .= '<br /><br />' . wp_sprintf( __( 'The following new modules have been activated: %l.', 'jetpack' ), $titles );
				}
			}

			if ( $reactive_state = Jetpack::state( 'reactivated_modules' ) ) {
				$titles = array();
				foreach ( explode( ',',  $reactive_state ) as $mod ) {
					if ( $mod_headers = Jetpack::get_module( $mod ) ) {
						$titles[] = '<strong>' . preg_replace( '/\s+(?![^<>]++>)/', '&nbsp;', $mod_headers['name'] ) . '</strong>';
					}
				}
				if ( $titles ) {
					$this->message .= '<br /><br />' . wp_sprintf( __( 'The following modules have been updated: %l.', 'jetpack' ), $titles );
				}
			}

			$this->message .= Jetpack::jetpack_comment_notice();
			break;
		case 'jetpack-manage':
			$this->message = '<strong>' . sprintf( __( 'You are all set! Your site can now be managed from <a href="%s" target="_blank">wordpress.com/sites</a>.', 'jetpack' ), 'https://wordpress.com/sites' ) . '</strong>';
			if ( $activated_manage ) {
				$this->message .= '<br /><strong>' . __( 'Manage has been activated for you!', 'jetpack'  ) . '</strong>';
			}
			break;
		case 'module_activated' :
			if ( $module = Jetpack::get_module( Jetpack::state( 'module' ) ) ) {
				$this->message = sprintf( __( '<strong>%s Activated!</strong> You can deactivate at any time by clicking the Deactivate link next to each module.', 'jetpack' ), $module['name'] );
				$this->stat( 'module-activated', Jetpack::state( 'module' ) );
			}
			break;

		case 'module_deactivated' :
			$modules = Jetpack::state( 'module' );
			if ( ! $modules ) {
				break;
			}

			$module_names = array();
			foreach ( explode( ',', $modules ) as $module_slug ) {
				$module = Jetpack::get_module( $module_slug );
				if ( $module ) {
					$module_names[] = $module['name'];
				}

				$this->stat( 'module-deactivated', $module_slug );
			}

			if ( ! $module_names ) {
				break;
			}

			$this->message = wp_sprintf(
				_nx(
					'<strong>%l Deactivated!</strong> You can activate it again at any time using the activate link next to each module.',
					'<strong>%l Deactivated!</strong> You can activate them again at any time using the activate links next to each module.',
					count( $module_names ),
					'%l = list of Jetpack module/feature names',
					'jetpack'
				),
				$module_names
			);
			break;

		case 'module_configured' :
			$this->message = __( '<strong>Module settings were saved.</strong> ', 'jetpack' );
			break;

		case 'already_authorized' :
			$this->message = __( '<strong>Your Jetpack is already connected.</strong> ', 'jetpack' );
			break;

		case 'authorized' :
			$this->message  = __( '<strong>You&#8217;re fueled up and ready to go, Jetpack is now active.</strong> ', 'jetpack' );
			$this->message .= Jetpack::jetpack_comment_notice();
			break;

		case 'linked' :
			$this->message  = __( '<strong>You&#8217;re fueled up and ready to go.</strong> ', 'jetpack' );
			$this->message .= Jetpack::jetpack_comment_notice();
			break;

		case 'unlinked' :
			$user = wp_get_current_user();
			$this->message = sprintf( __( '<strong>You have unlinked your account (%s) from WordPress.com.</strong>', 'jetpack' ), $user->user_login );
			break;

		case 'switch_master' :
			global $current_user;
			$is_master_user = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
			$master_userdata = get_userdata( Jetpack_Options::get_option( 'master_user' ) );
			if ( $is_master_user ) {
				$this->message = __( 'You have successfully set yourself as Jetpack’s primary user.', 'jetpack' );
			} else {
				$this->message = sprintf( _x( 'You have successfully set %s as Jetpack’s primary user.', '%s is a username', 'jetpack' ), $master_userdata->user_login );
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
		<h4><?php echo wp_kses( $this->error, array( 'code' => true, 'strong' => true, 'br' => true, 'b' => true ) ); ?></h4>
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
		<h4><?php echo wp_kses( $this->message, array( 'strong' => array(), 'a' => array( 'href' => true ), 'br' => true ) ); ?></h4>
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
		<h4><strong><?php esc_html_e( 'Is this site private?', 'jetpack' ); ?></strong></h4><br />
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
			set_url_scheme( 'http://pixel.wp.com/g.gif' )
		);
		$url      = add_query_arg( $args, $base_url );
		return $url;
	}

	function translate_current_user_to_role() {
		foreach ( $this->capability_translations as $role => $cap ) {
			if ( current_user_can( $role ) || current_user_can( $cap ) ) {
				return $role;
			}
		}

		return false;
	}

	function translate_role_to_cap( $role ) {
		if ( ! isset( $this->capability_translations[$role] ) ) {
			return false;
		}

		return $this->capability_translations[$role];
	}

	function sign_role( $role ) {
		if ( ! $user_id = (int) get_current_user_id() ) {
			return false;
		}

		$token = Jetpack_Data::get_access_token();
		if ( ! $token || is_wp_error( $token ) ) {
			return false;
		}

		return $role . ':' . hash_hmac( 'md5', "{$role}|{$user_id}", $token->secret );
	}

	function build_connect_url( $raw = false, $redirect = false ) {
		if ( ! Jetpack_Options::get_option( 'blog_token' ) || ! Jetpack_Options::get_option( 'id' ) ) {
			$url = Jetpack::nonce_url_no_esc( Jetpack::admin_url( 'action=register' ), 'jetpack-register' );
			if( is_network_admin() ) {
			    $url = add_query_arg( 'is_multisite', network_admin_url(
			    'admin.php?page=jetpack-settings' ), $url );
			}
		} else {
			$role = $this->translate_current_user_to_role();
			$signed_role = $this->sign_role( $role );

			$user = wp_get_current_user();

			$redirect = $redirect ? esc_url_raw( $redirect ) : '';

			if( isset( $_REQUEST['is_multisite'] ) ) {
				$redirect = Jetpack_Network::init()->get_url( 'network_admin_page' );
			}

			$args = urlencode_deep(
				array(
					'response_type' => 'code',
					'client_id'     => Jetpack_Options::get_option( 'id' ),
					'redirect_uri'  => add_query_arg(
						array(
							'action'   => 'authorize',
							'_wpnonce' => wp_create_nonce( "jetpack-authorize_{$role}_{$redirect}" ),
							'redirect' => $redirect ? urlencode( $redirect ) : false,
						),
						menu_page_url( 'jetpack', false )
					),
					'state'         => $user->ID,
					'scope'         => $signed_role,
					'user_email'    => $user->user_email,
					'user_login'    => $user->user_login,
					'is_active'     => Jetpack::is_active(),
					'jp_version'    => JETPACK__VERSION,
				)
			);

			$url = add_query_arg( $args, Jetpack::api_url( 'authorize' ) );
		}

		return $raw ? $url : esc_url( $url );
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

	function debugger_page() {
		nocache_headers();
		if ( ! current_user_can( 'manage_options' ) ) {
			die( '-1' );
		}
		Jetpack_Debugger::jetpack_debug_display_handler();
		exit;
	}

	public static function admin_screen_configure_module( $module_id ) {

		// User that doesn't have 'jetpack_configure_modules' will never end up here since Jetpack Landing Page woun't let them.
		if ( ! in_array( $module_id, Jetpack::get_active_modules() ) && current_user_can( 'manage_options' ) ) {
			self::display_activate_module_link( $module_id );
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

					$info['description'] = sprintf( __( 'Manage your multiple Jetpack sites from our centralized dashboard at wordpress.com/sites. <a href="%s" target="_blank">Learn more</a>.', 'jetpack' ), 'http://jetpack.me/support/site-management' );

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

	function sync_reindex_trigger() {
		if ( $this->current_user_is_connection_owner() && current_user_can( 'manage_options' ) ) {
			echo json_encode( $this->sync->reindex_trigger() );
		} else {
			echo '{"status":"ERROR"}';
		}
		exit;
	}

	function sync_reindex_status(){
		if ( $this->current_user_is_connection_owner() && current_user_can( 'manage_options' ) ) {
			echo json_encode( $this->sync->reindex_status() );
		} else {
			echo '{"status":"ERROR"}';
		}
		exit;
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

		// Yay! Your host is good!
		if ( self::permit_ssl() && wp_http_supports( array( 'ssl' => true ) ) ) {
			return $url;
		}

		// Boo! Your host is bad and makes Jetpack cry!
		return set_url_scheme( $url, 'http' );
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
			if ( 'https' !== substr( JETPACK__API_BASE, 0, 5 ) ) {
				$ssl = 0;
			} else {
				switch ( JETPACK_CLIENT__HTTPS ) {
					case 'NEVER':
						$ssl = 0;
						break;
					case 'ALWAYS':
					case 'AUTO':
					default:
						$ssl = 1;
						break;
				}

				// If it's not 'NEVER', test to see
				if ( $ssl ) {
					$response = wp_remote_get( JETPACK__API_BASE . 'test/1/' );
					if ( is_wp_error( $response ) || ( 'OK' !== wp_remote_retrieve_body( $response ) ) ) {
						$ssl = 0;
					}
				}
			}
			set_transient( 'jetpack_https_test', $ssl, DAY_IN_SECONDS );
		}

		return (bool) $ssl;
	}

	/*
	 * Displays an admin_notice, alerting the user to their JETPACK_CLIENT__HTTPS constant being 'ALWAYS' but SSL isn't working.
	 */
	public function alert_required_ssl_fail() {
		if ( ! current_user_can( 'manage_options' ) )
			return;
		?>

		<div id="message" class="error jetpack-message jp-identity-crisis">
			<div class="jp-banner__content">
				<h4><?php _e( 'Something is being cranky!', 'jetpack' ); ?></h4>
				<p><?php _e( 'Your site is configured to only permit SSL connections to Jetpack, but SSL connections don\'t seem to be functional!', 'jetpack' ); ?></p>
			</div>
		</div>

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
	public function generate_secrets() {
	    $secrets = array(
		wp_generate_password( 32, false ), // secret_1
		wp_generate_password( 32, false ), // secret_2
		( time() + 600 ), // eol ( End of Life )
	    );

	    return $secrets;
	}

	/**
	 * Builds the timeout limit for queries talking with the wpcom servers.
	 *
	 * Based on local php max_execution_time in php.ini
	 *
	 * @since 2.6
	 * @return int
	 **/
	public function get_remote_query_timeout_limit() {
	    $timeout = (int) ini_get( 'max_execution_time' );
	    if ( ! $timeout ) // Ensure exec time set in php.ini
		$timeout = 30;
	    return intval( $timeout / 2 );
	}


	/**
	 * Takes the response from the Jetpack register new site endpoint and
	 * verifies it worked properly.
	 *
	 * @since 2.6
	 * @return true or Jetpack_Error
	 **/
	public function validate_remote_register_response( $response ) {
	    	if ( is_wp_error( $response ) ) {
			return new Jetpack_Error( 'register_http_request_failed', $response->get_error_message() );
		}

		$code   = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );
		if ( $entity )
			$json = json_decode( $entity );
		else
			$json = false;

		$code_type = intval( $code / 100 );
		if ( 5 == $code_type ) {
			return new Jetpack_Error( 'wpcom_5??', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		} elseif ( 408 == $code ) {
			return new Jetpack_Error( 'wpcom_408', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		} elseif ( ! empty( $json->error ) ) {
			$error_description = isset( $json->error_description ) ? sprintf( __( 'Error Details: %s', 'jetpack' ), (string) $json->error_description ) : '';
			return new Jetpack_Error( (string) $json->error, $error_description, $code );
		} elseif ( 200 != $code ) {
			return new Jetpack_Error( 'wpcom_bad_response', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		}

		// Jetpack ID error block
		if ( empty( $json->jetpack_id ) ) {
			return new Jetpack_Error( 'jetpack_id', sprintf( __( 'Error Details: Jetpack ID is empty. Do not publicly post this error message! %s', 'jetpack' ), $entity ), $entity );
		} elseif ( ! is_scalar( $json->jetpack_id ) ) {
			return new Jetpack_Error( 'jetpack_id', sprintf( __( 'Error Details: Jetpack ID is not a scalar. Do not publicly post this error message! %s', 'jetpack' ) , $entity ), $entity );
		} elseif ( preg_match( '/[^0-9]/', $json->jetpack_id ) ) {
			return new Jetpack_Error( 'jetpack_id', sprintf( __( 'Error Details: Jetpack ID begins with a numeral. Do not publicly post this error message! %s', 'jetpack' ) , $entity ), $entity );
		}

	    return true;
	}
	/**
	 * @return bool|WP_Error
	 */
	public static function register() {
		add_action( 'pre_update_jetpack_option_register', array( 'Jetpack_Options', 'delete_option' ) );
		$secrets = Jetpack::init()->generate_secrets();

		Jetpack_Options::update_option( 'register', $secrets[0] . ':' . $secrets[1] . ':' . $secrets[2] );

		@list( $secret_1, $secret_2, $secret_eol ) = explode( ':', Jetpack_Options::get_option( 'register' ) );
		if ( empty( $secret_1 ) || empty( $secret_2 ) || empty( $secret_eol ) || $secret_eol < time() ) {
			return new Jetpack_Error( 'missing_secrets' );
		}

		$timeout = Jetpack::init()->get_remote_query_timeout_limit();

		$gmt_offset = get_option( 'gmt_offset' );
		if ( ! $gmt_offset ) {
			$gmt_offset = 0;
		}

		$stats_options = get_option( 'stats_options' );
		$stats_id = isset($stats_options['blog_id']) ? $stats_options['blog_id'] : null;

		$args = array(
			'method'  => 'POST',
			'body'    => array(
				'siteurl'         => site_url(),
				'home'            => home_url(),
				'gmt_offset'      => $gmt_offset,
				'timezone_string' => (string) get_option( 'timezone_string' ),
				'site_name'       => (string) get_option( 'blogname' ),
				'secret_1'        => $secret_1,
				'secret_2'        => $secret_2,
				'site_lang'       => get_locale(),
				'timeout'         => $timeout,
				'stats_id'        => $stats_id,
			),
			'headers' => array(
				'Accept' => 'application/json',
			),
			'timeout' => $timeout,
		);
		$response = Jetpack_Client::_wp_remote_request( Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'register' ) ), $args, true );


		// Make sure the response is valid and does not contain any Jetpack errors
		$valid_response = Jetpack::init()->validate_remote_register_response( $response );
		if( is_wp_error( $valid_response ) || !$valid_response ) {
		    return $valid_response;
		}


		// Grab the response values to work with
		$code   = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );

		if ( $entity )
			$json = json_decode( $entity );
		else
			$json = false;

		if ( empty( $json->jetpack_secret ) || ! is_string( $json->jetpack_secret ) )
			return new Jetpack_Error( 'jetpack_secret', '', $code );

		if ( isset( $json->jetpack_public ) ) {
			$jetpack_public = (int) $json->jetpack_public;
		} else {
			$jetpack_public = false;
		}

		Jetpack_Options::update_options(
			array(
				'id'         => (int)    $json->jetpack_id,
				'blog_token' => (string) $json->jetpack_secret,
				'public'     => $jetpack_public,
			)
		);

		do_action( 'jetpack_site_registered', $json->jetpack_id, $json->jetpack_secret, $jetpack_public );

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
		if ( method_exists ( $wpdb , 'esc_like' ) ) {
			$sql_args = array( $wpdb->esc_like( 'jetpack_nonce_' ) . '%' );
		} else {
			$sql_args = array( like_escape( 'jetpack_nonce_' ) . '%' );
		}

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
		if ( 'wp-login.php' !== $path || 'login_post' !== $scheme ) {
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

	// Verifies the request by checking the signature
	function verify_json_api_authorization_request() {
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-signature.php';

		$token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );
		if ( ! $token || empty( $token->secret ) ) {
			wp_die( __( 'You must connect your Jetpack plugin to WordPress.com to use this feature.' , 'jetpack' ) );
		}

		$die_error = __( 'Someone may be trying to trick you into giving them access to your site.  Or it could be you just encountered a bug :).  Either way, please close this window.', 'jetpack' );

		$jetpack_signature = new Jetpack_Signature( $token->secret, (int) Jetpack_Options::get_option( 'time_diff' ) );

		if ( isset( $_POST['jetpack_json_api_original_query'] ) ) {
			$signature = $jetpack_signature->sign_request( $_GET['token'], $_GET['timestamp'], $_GET['nonce'], '', 'GET', $_POST['jetpack_json_api_original_query'], null, true );
		} else {
			$signature = $jetpack_signature->sign_current_request( array( 'body' => null, 'method' => 'GET' ) );
		}

		if ( ! $signature ) {
			wp_die( $die_error );
		} else if ( is_wp_error( $signature ) ) {
			wp_die( $die_error );
		} else if ( $signature !== $_GET['signature'] ) {
			if ( is_ssl() ) {
				// If we signed an HTTP request on the Jetpack Servers, but got redirected to HTTPS by the local blog, check the HTTP signature as well
				$signature = $jetpack_signature->sign_current_request( array( 'scheme' => 'http', 'body' => null, 'method' => 'GET' ) );
				if ( ! $signature || is_wp_error( $signature ) || $signature !== $_GET['signature'] ) {
					wp_die( $die_error );
				}
			} else {
				wp_die( $die_error );
			}
		}

		$timestamp = (int) $_GET['timestamp'];
		$nonce     = stripslashes( (string) $_GET['nonce'] );

		if ( ! $this->add_nonce( $timestamp, $nonce ) ) {
			// De-nonce the nonce, at least for 5 minutes.
			// We have to reuse this nonce at least once (used the first time when the initial request is made, used a second time when the login form is POSTed)
			$old_nonce_time = get_option( "jetpack_nonce_{$timestamp}_{$nonce}" );
			if ( $old_nonce_time < time() - 300 ) {
				wp_die( __( 'The authorization process expired.  Please go back and try again.' , 'jetpack' ) );
			}
		}

		$data = json_decode( base64_decode( stripslashes( $_GET['data'] ) ) );
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
	 * Centralize the function here until it gets added to core.
	 *
	 * @param int|string|object $id_or_email A user ID,  email address, or comment object
	 * @param int $size Size of the avatar image
	 * @param string $default URL to a default image to use if no avatar is available
	 * @param bool $force_display Whether to force it to return an avatar even if show_avatars is disabled
	 *
	 * @return array First element is the URL, second is the class.
	 */
	public static function get_avatar_url( $id_or_email, $size = 96, $default = '', $force_display = false ) {
		// Don't bother adding the __return_true filter if it's already there.
		$has_filter = has_filter( 'pre_option_show_avatars', '__return_true' );

		if ( $force_display && ! $has_filter )
			add_filter( 'pre_option_show_avatars', '__return_true' );

		$avatar = get_avatar( $id_or_email, $size, $default );

		if ( $force_display && ! $has_filter )
			remove_filter( 'pre_option_show_avatars', '__return_true' );

		// If no data, fail out.
		if ( is_wp_error( $avatar ) || ! $avatar )
			return array( null, null );

		// Pull out the URL.  If it's not there, fail out.
		if ( ! preg_match( '/src=["\']([^"\']+)["\']/', $avatar, $url_matches ) )
			return array( null, null );
		$url = wp_specialchars_decode( $url_matches[1], ENT_QUOTES );

		// Pull out the class, but it's not a big deal if it's missing.
		$class = '';
		if ( preg_match( '/class=["\']([^"\']+)["\']/', $avatar, $class_matches ) )
			$class = wp_specialchars_decode( $class_matches[1], ENT_QUOTES );

		return array( $url, $class );
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
	 * Fetch the filtered array of options that we should compare to determine an identity crisis.
	 *
	 * @return array An array of options to check.
	 */
	public static function identity_crisis_options_to_check() {
		$options = array(
			'siteurl',
			'home',
		);
		/**
		 * Filter the options that we should compare to determine an identity crisis.
		 *
		 * @since 2.5.0
		 *
		 * @param array $options Array of options to compare to determine an identity crisis.
		 */
		return apply_filters( 'jetpack_identity_crisis_options_to_check', $options );
	}

	/**
	 * Checks to make sure that local options have the same values as remote options.  Will cache the results for up to 24 hours.
	 *
	 * @param bool $force_recheck Whether to ignore any cached transient and manually re-check.
	 *
	 * @return array An array of options that do not match.  If everything is good, it will evaluate to false.
	 */
	public static function check_identity_crisis( $force_recheck = false ) {
		if ( ! Jetpack::is_active() || Jetpack::is_development_mode() )
			return false;

		if ( $force_recheck || false === ( $errors = get_transient( 'jetpack_has_identity_crisis' ) ) ) {
			$options_to_check = self::identity_crisis_options_to_check();
			$cloud_options = Jetpack::init()->get_cloud_site_options( $options_to_check );
			$errors        = array();

			foreach ( $cloud_options as $cloud_key => $cloud_value ) {

				// If it's not the same as the local value...
				if ( $cloud_value !== get_option( $cloud_key ) ) {

					// Break out if we're getting errors.  We are going to check the error keys later when we alert.
					if ( 'error_code' == $cloud_key ) {
						$errors[ $cloud_key ] = $cloud_value;
						break;
					}

					$parsed_cloud_value = parse_url( $cloud_value );
					// If the current options is an IP address
					if ( filter_var( $parsed_cloud_value['host'], FILTER_VALIDATE_IP ) ) {
						// Give the new value a Jetpack to fly in to the clouds
						Jetpack::resolve_identity_crisis( $cloud_key );
						continue;
					}

					// And it's not been added to the whitelist...
					if ( ! self::is_identity_crisis_value_whitelisted( $cloud_key, $cloud_value ) ) {
						/*
						 * This should be a temporary hack until a cleaner solution is found.
						 *
						 * The siteurl and home can be set to use http in General > Settings
						 * however some constants can be defined that can force https in wp-admin
						 * when this happens wpcom can confuse wporg with a fake identity
						 * crisis with a mismatch of http vs https when it should be allowed.
						 * we need to check that here.
						 *
						 * @see https://github.com/Automattic/jetpack/issues/1006
						 */
						if ( ( 'home' == $cloud_key || 'siteurl' == $cloud_key )
							&& ( substr( $cloud_value, 0, 8 ) == "https://" )
							&& Jetpack::init()->is_ssl_required_to_visit_site() ) {
							// Ok, we found a mismatch of http and https because of wp-config, not an invalid url
							continue;
						}


						// Then kick an error!
						$errors[ $cloud_key ] = $cloud_value;
					}
				}
			}
		}

		/**
		 * Filters the errors returned when checking for an Identity Crisis.
		 *
		 * @since 2.3.2
		 *
		 * @param array $errors Array of Identity Crisis errors.
		 * @param bool $force_recheck Ignore any cached transient and manually re-check. Default to false.
		 */
		return apply_filters( 'jetpack_has_identity_crisis', $errors, $force_recheck );
	}

	/*
	 * Resolve ID crisis
	 *
	 * If the URL has changed, but the rest of the options are the same (i.e. blog/user tokens)
	 * The user has the option to update the shadow site with the new URL before a new
	 * token is created.
	 *
	 * @param $key : Which option to sync.  null defautlts to home and siteurl
	 */
	public static function resolve_identity_crisis( $key = null ) {
		if ( $key ) {
			$identity_options = array( $key );
		} else {
			$identity_options = self::identity_crisis_options_to_check();
		}

		if ( is_array( $identity_options ) ) {
			foreach( $identity_options as $identity_option ) {
				Jetpack_Sync::sync_options( __FILE__, $identity_option );

				// Fire off the sync manually
				do_action( "update_option_{$identity_option}" );
			}
		}
	}

	/*
	 * Whitelist URL
	 *
	 * Ignore the URL differences between the blog and the shadow site.
	 */
	public static function whitelist_current_url() {
		$options_to_check = Jetpack::identity_crisis_options_to_check();
		$cloud_options = Jetpack::init()->get_cloud_site_options( $options_to_check );

		foreach ( $cloud_options as $cloud_key => $cloud_value ) {
			Jetpack::whitelist_identity_crisis_value( $cloud_key, $cloud_value );
		}
	}

	/*
	 * Ajax callbacks for ID crisis resolutions
	 *
	 * Things that could happen here:
	 *  - site_migrated : Update the URL on the shadow blog to match new domain
	 *  - whitelist     : Ignore the URL difference
	 *  - default       : Error message
	 */
	public static function resolve_identity_crisis_ajax_callback() {
		check_ajax_referer( 'resolve-identity-crisis', 'ajax-nonce' );

		switch ( $_POST[ 'crisis_resolution_action' ] ) {
			case 'site_migrated':
				Jetpack::resolve_identity_crisis();
				echo 'resolved';
				break;

			case 'whitelist':
				Jetpack::whitelist_current_url();
				echo 'whitelisted';
				break;

			case 'reset_connection':
				// Delete the options first so it doesn't get confused which site to disconnect dotcom-side
				Jetpack_Options::delete_option(
					array(
						'register',
						'blog_token',
						'user_token',
						'user_tokens',
						'master_user',
						'time_diff',
						'fallback_no_verify_ssl_certs',
						'id',
					)
				);
				delete_transient( 'jetpack_has_identity_crisis' );

				echo 'reset-connection-success';
				break;

			default:
				echo 'missing action';
				break;
		}

		wp_die();
	}

	/**
	 * Adds a value to the whitelist for the specified key.
	 *
	 * @param string $key The option name that we're whitelisting the value for.
	 * @param string $value The value that we're intending to add to the whitelist.
	 *
	 * @return bool Whether the value was added to the whitelist, or false if it was already there.
	 */
	public static function whitelist_identity_crisis_value( $key, $value ) {
		if ( Jetpack::is_identity_crisis_value_whitelisted( $key, $value ) ) {
			return false;
		}

		$whitelist = Jetpack_Options::get_option( 'identity_crisis_whitelist', array() );
		if ( empty( $whitelist[ $key ] ) || ! is_array( $whitelist[ $key ] ) ) {
			$whitelist[ $key ] = array();
		}
		array_push( $whitelist[ $key ], $value );

		Jetpack_Options::update_option( 'identity_crisis_whitelist', $whitelist );
		return true;
	}

	/**
	 * Checks whether a value is already whitelisted.
	 *
	 * @param string $key The option name that we're checking the value for.
	 * @param string $value The value that we're curious to see if it's on the whitelist.
	 *
	 * @return bool Whether the value is whitelisted.
	 */
	public static function is_identity_crisis_value_whitelisted( $key, $value ) {
		$whitelist = Jetpack_Options::get_option( 'identity_crisis_whitelist', array() );
		if ( ! empty( $whitelist[ $key ] ) && is_array( $whitelist[ $key ] ) && in_array( $value, $whitelist[ $key ] ) ) {
			return true;
		}
		return false;
	}

	/**
	 * Checks whether the home and siteurl specifically are whitelisted
	 * Written so that we don't have re-check $key and $value params every time
	 * we want to check if this site is whitelisted, for example in footer.php
	 *
	 * @return bool True = already whitelsisted False = not whitelisted
	 */
	public static function jetpack_is_staging_site() {
		$current_whitelist = Jetpack_Options::get_option( 'identity_crisis_whitelist' );
		if ( ! $current_whitelist ) {
			return false;
		}

		$options_to_check  = Jetpack::identity_crisis_options_to_check();
		$cloud_options     = Jetpack::init()->get_cloud_site_options( $options_to_check );

		foreach ( $cloud_options as $cloud_key => $cloud_value ) {
			if ( ! self::is_identity_crisis_value_whitelisted( $cloud_key, $cloud_value ) ) {
				return false;
			}
		}
		return true;
	}

	public function identity_crisis_js( $nonce ) {
?>
<script>
(function( $ ) {
	var SECOND_IN_MS = 1000;

	function contactSupport( e ) {
		e.preventDefault();
		$( '.jp-id-crisis-question' ).hide();
		$( '#jp-id-crisis-contact-support' ).show();
	}

	function autodismissSuccessBanner() {
		$( '.jp-identity-crisis' ).fadeOut(600); //.addClass( 'dismiss' );
	}

	var data = { action: 'jetpack_resolve_identity_crisis', 'ajax-nonce': '<?php echo $nonce; ?>' };

	$( document ).ready(function() {

		// Site moved: Update the URL on the shadow blog
		$( '.site-moved' ).click(function( e ) {
			e.preventDefault();
			data.crisis_resolution_action = 'site_migrated';
			$( '#jp-id-crisis-question-1 .spinner' ).show();
			$.post( ajaxurl, data, function() {
				$( '.jp-id-crisis-question' ).hide();
				$( '.banner-title' ).hide();
				$( '#jp-id-crisis-success' ).show();
				setTimeout( autodismissSuccessBanner, 6 * SECOND_IN_MS );
			});

		});

		// URL hasn't changed, next question please.
		$( '.site-not-moved' ).click(function( e ) {
			e.preventDefault();
			$( '.jp-id-crisis-question' ).hide();
			$( '#jp-id-crisis-question-2' ).show();
		});

		// Reset connection: two separate sites.
		$( '.reset-connection' ).click(function( e ) {
			data.crisis_resolution_action = 'reset_connection';
			$.post( ajaxurl, data, function( response ) {
				if ( 'reset-connection-success' === response ) {
					window.location.replace( '<?php echo Jetpack::admin_url(); ?>' );
				}
			});
		});

		// It's a dev environment.  Ignore.
		$( '.is-dev-env' ).click(function( e ) {
			data.crisis_resolution_action = 'whitelist';
			$( '#jp-id-crisis-question-2 .spinner' ).show();
			$.post( ajaxurl, data, function() {
				$( '.jp-id-crisis-question' ).hide();
				$( '.banner-title' ).hide();
				$( '#jp-id-crisis-success' ).show();
				setTimeout( autodismissSuccessBanner, 4 * SECOND_IN_MS );
			});
		});

		$( '.not-reconnecting' ).click(contactSupport);
		$( '.not-staging-or-dev' ).click(contactSupport);
	});
})( jQuery );
</script>
<?php
	}

	/**
	 * Displays an admin_notice, alerting the user to an identity crisis.
	 */
	public function alert_identity_crisis() {
		// @todo temporary copout for dealing with domain mapping
		// @see https://github.com/Automattic/jetpack/issues/2702
		if ( is_multisite() && defined( 'SUNRISE' ) && ! Jetpack::is_development_version() ) {
			return;
		}

		if ( ! current_user_can( 'jetpack_disconnect' ) ) {
			return;
		}

		if ( ! $errors = self::check_identity_crisis() ) {
			return;
		}

		// Only show on dashboard and jetpack pages
		$screen = get_current_screen();
		if ( 'dashboard' !== $screen->base && ! did_action( 'jetpack_notices' ) ) {
			return;
		}

		// Include the js!
		$ajax_nonce = wp_create_nonce( 'resolve-identity-crisis' );
		$this->identity_crisis_js( $ajax_nonce );

		// Include the CSS!
		if ( ! wp_script_is( 'jetpack', 'done' ) ) {
			$this->admin_banner_styles();
		}

		if ( ! array_key_exists( 'error_code', $errors ) ) {
			$key = 'siteurl';
			if ( ! $errors[ $key ] ) {
				$key = 'home';
			}
		} else {
			$key = 'error_code';
			// 401 is the only error we care about.  Any other errors should not trigger the alert.
			if ( 401 !== $errors[ $key ] ) {
				return;
			}
		}

		?>

		<style>
			.jp-identity-crisis .jp-btn-group {
					margin: 15px 0;
				}
			.jp-identity-crisis strong {
					color: #518d2a;
				}
			.jp-identity-crisis.dismiss {
				display: none;
			}
			.jp-identity-crisis .button {
				margin-right: 4px;
			}
		</style>

		<div id="message" class="error jetpack-message jp-identity-crisis stay-visible">
			<div class="service-mark"></div>
			<div class="jp-id-banner__content">
				<!-- <h3 class="banner-title"><?php _e( 'Something\'s not quite right with your Jetpack connection! Let\'s fix that.', 'jetpack' ); ?></h3> -->

				<div class="jp-id-crisis-question" id="jp-id-crisis-question-1">
					<?php
					// 401 means that this site has been disconnected from wpcom, but the remote site still thinks it's connected.
					if ( 'error_code' == $key && '401' == $errors[ $key ] ) : ?>
						<div class="banner-content">
							<p><?php
								/* translators: %s is a URL */
								printf( __( 'Our records show that this site does not have a valid connection to WordPress.com. Please reset your connection to fix this. <a href="%s" target="_blank">What caused this?</a>', 'jetpack' ), 'https://jetpack.me/support/no-valid-wordpress-com-connection/' );
							?></p>
						</div>
						<div class="jp-btn-group">
							<a href="#" class="reset-connection"><?php _e( 'Reset the connection', 'jetpack' ); ?></a>
							<span class="idc-separator">|</span>
							<a href="<?php echo esc_url( wp_nonce_url( Jetpack::admin_url( 'jetpack-notice=dismiss' ), 'jetpack-deactivate' ) ); ?>"><?php _e( 'Deactivate Jetpack', 'jetpack' ); ?></a>
						</div>
					<?php else : ?>
							<div class="banner-content">
							<p><?php printf( __( 'It looks like you may have changed your domain. Is <strong>%1$s</strong> still your site\'s domain, or have you updated it to <strong> %2$s </strong>?', 'jetpack' ), $errors[ $key ], (string) get_option( $key ) ); ?></p>
							</div>
						<div class="jp-btn-group">
							<a href="#" class="regular site-moved"><?php _e( 'I\'ve updated it.', 'jetpack' ); ?></a> <span class="idc-separator">|</span> <a href="#" class="site-not-moved" ><?php _e( 'That\'s still my domain.', 'jetpack' ); ?></a>
							<span class="spinner"></span>
						</div>
					<?php endif ; ?>
				</div>

				<div class="jp-id-crisis-question" id="jp-id-crisis-question-2" style="display: none;">
					<div class="banner-content">
						<p><?php printf(
							/* translators: %1$s, %2$s and %3$s are URLs */
							__(
								'Are <strong> %2$s </strong> and <strong> %1$s </strong> two completely separate websites? If so we should create a new connection, which will reset your followers and linked services. <a href="%3$s"><em>What does this mean?</em></a>',
								'jetpack'
							),
							$errors[ $key ],
							(string) get_option( $key ),
							'https://jetpack.me/support/what-does-resetting-the-connection-mean/'
						); ?></p>
					</div>
					<div class="jp-btn-group">
						<a href="#" class="reset-connection"><?php _e( 'Reset the connection', 'jetpack' ); ?></a> <span class="idc-separator">|</span>
						<a href="#" class="is-dev-env"><?php _e( 'This is a development environment', 'jetpack' ); ?></a> <span class="idc-separator">|</span>
						<a href="https://jetpack.me/contact-support/" class="contact-support"><?php _e( 'Submit a support ticket', 'jetpack' ); ?></a>
						<span class="spinner"></span>
					</div>
				</div>

				<div class="jp-id-crisis-success" id="jp-id-crisis-success" style="display: none;">
					<h3 class="success-notice"><?php printf( __( 'Thanks for taking the time to sort things out. We&#039;ve updated our records accordingly!', 'jetpack' ) ); ?></h3>
				</div>
			</div>
		</div>

		<?php
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
			}
		}

		return $url;
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
	 * Sends a ping to the Jetpack servers to toggle on/off remote portions
	 * required by some modules.
	 *
	 * @param string $module_slug
	 */
	public function toggle_module_on_wpcom( $module_slug ) {
		Jetpack::init()->sync->register( 'noop' );

		if ( false !== strpos( current_filter(), 'jetpack_activate_module_' ) ) {
			self::check_privacy( $module_slug );
		}

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
		 * If there is no replacement us null for replacement_name
		 */
		$deprecated_list = array(
			'jetpack_bail_on_shortcode' => 'jetpack_shortcodes_to_include',
			'wpl_sharing_2014_1'        => null,
		);

		// This is a silly loop depth. Better way?
		foreach( $deprecated_list AS $hook => $hook_alt ) {
			if( isset( $wp_filter[ $hook ] ) && is_array( $wp_filter[ $hook ] ) ) {
				foreach( $wp_filter[$hook] AS $func => $values ) {
					foreach( $values AS $hooked ) {
						_deprecated_function( $hook . ' used for ' . $hooked['function'], null, $hook_alt );
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
	 * This method checks to see if SSL is required by the site in
	 * order to visit it in some way other than only setting the
	 * https value in the home or siteurl values.
	 *
	 * @since 3.2
	 * @return boolean
	 **/
	private function is_ssl_required_to_visit_site() {
		global $wp_version;
		$ssl = is_ssl();

		if ( version_compare( $wp_version, '4.4-alpha', '<=' ) && force_ssl_login() ) { // force_ssl_login deprecated WP 4.4.
			$ssl = true;
		} else if ( force_ssl_admin() ) {
			$ssl = true;
		}
		return $ssl;
	}

	/**
	 * This methods removes all of the registered css files on the frontend
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
	 * @return array of options to delete.
	 */
	public static function get_jetpack_options_for_reset() {
		$jetpack_options            = Jetpack_Options::get_option_names();
		$jetpack_options_non_compat = Jetpack_Options::get_option_names( 'non_compact' );
		$jetpack_options_private    = Jetpack_Options::get_option_names( 'private' );

		$all_jp_options = array_merge( $jetpack_options, $jetpack_options_non_compat, $jetpack_options_private );

		// A manual build of the wp options
		$wp_options = array(
			'sharing-options',
			'disabled_likes',
			'disabled_reblogs',
			'jetpack_comments_likes_enabled',
			'wp_mobile_excerpt',
			'wp_mobile_featured_images',
			'wp_mobile_app_promos',
			'stats_options',
			'stats_dashboard_widget',
			'safecss_preview_rev',
			'safecss_rev',
			'safecss_revision_migrated',
			'nova_menu_order',
			'jetpack_portfolio',
			'jetpack_portfolio_posts_per_page',
			'jetpack_testimonial',
			'jetpack_testimonial_posts_per_page',
			'wp_mobile_custom_css',
			'sharedaddy_disable_resources',
			'sharing-options',
			'sharing-services',
			'site_icon_temp_data',
			'featured-content',
			'site_logo',
		);

		// Flag some Jetpack options as unsafe
		$unsafe_options = array(
			'id',                           // (int)    The Client ID/WP.com Blog ID of this site.
			'master_user',                  // (int)    The local User ID of the user who connected this site to jetpack.wordpress.com.
			'version',                      // (string) Used during upgrade procedure to auto-activate new modules. version:time
			'jumpstart',                    // (string) A flag for whether or not to show the Jump Start.  Accepts: new_connection, jumpstart_activated, jetpack_action_taken, jumpstart_dismissed.

			// non_compact
			'activated',

			// private
			'register',
			'blog_token',                  // (string) The Client Secret/Blog Token of this site.
			'user_token',                  // (string) The User Token of this site. (deprecated)
			'user_tokens'
		);

		// Remove the unsafe Jetpack options
		foreach ( $unsafe_options as $unsafe_option ) {
			if ( false !== ( $key = array_search( $unsafe_option, $all_jp_options ) ) ) {
				unset( $all_jp_options[ $key ] );
			}
		}

		$options = array(
			'jp_options' => $all_jp_options,
			'wp_options' => $wp_options
		);

		return $options;
	}

	/*
	 * Check if an option of a Jetpack module has been updated.
	 *
	 * If any module option has been updated before Jump Start has been dismissed,
	 * update the 'jumpstart' option so we can hide Jump Start.
	 */
	public static function jumpstart_has_updated_module_option( $option_name = '' ) {
		// Bail if Jump Start has already been dismissed
		if ( 'new_connection' !== Jetpack::get_option( 'jumpstart' ) ) {
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
				printf( "<link rel='dns-prefetch' href='%s'>\r\n", esc_attr( $this_prefetch_url ) );
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
			$widget_title = __( 'Jetpack', 'jetpack' );
		} elseif ( ! self::is_development_mode() && current_user_can( 'jetpack_connect' ) ) {
			add_action( 'jetpack_dashboard_widget', array( $this, 'dashboard_widget_connect_to_wpcom' ) );
			$widget_title = __( 'Please Connect Jetpack', 'jetpack' );
		}

		if ( has_action( 'jetpack_dashboard_widget' ) ) {
			wp_add_dashboard_widget(
				'jetpack_summary_widget',
				$widget_title,
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


		<?php if ( ! current_user_can( 'edit_posts' ) && self::is_user_connected() ) : ?>
			<div style="width: 100%; text-align: center; padding-top: 20px; clear: both;"><a class="button" title="<?php esc_attr_e( 'Unlink your account from WordPress.com', 'jetpack' ); ?>" href="<?php echo esc_url( wp_nonce_url( add_query_arg( array( 'action' => 'unlink', 'redirect' => 'sub-unlink' ), admin_url( 'index.php' ) ), 'jetpack-unlink' ) ); ?>"><?php esc_html_e( 'Unlink your account from WordPress.com', 'jetpack' ); ?></a></div>
		<?php endif; ?>

		</footer>
		<?php
	}

	public function dashboard_widget_connect_to_wpcom() {
		if ( Jetpack::is_active() || Jetpack::is_development_mode() || ! current_user_can( 'jetpack_connect' ) ) {
			return;
		}
		?>
		<div class="wpcom-connect">
			<div class="jp-emblem">
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0" y="0" viewBox="0 0 172.9 172.9" enable-background="new 0 0 172.9 172.9" xml:space="preserve">
				<path d="M86.4 0C38.7 0 0 38.7 0 86.4c0 47.7 38.7 86.4 86.4 86.4s86.4-38.7 86.4-86.4C172.9 38.7 134.2 0 86.4 0zM83.1 106.6l-27.1-6.9C49 98 45.7 90.1 49.3 84l33.8-58.5V106.6zM124.9 88.9l-33.8 58.5V66.3l27.1 6.9C125.1 74.9 128.4 82.8 124.9 88.9z"/>
			</svg>
			</div>
			<h3><?php esc_html_e( 'Please Connect Jetpack', 'jetpack' ); ?></h3>
			<p><?php echo wp_kses( __( 'Connecting Jetpack will show you <strong>stats</strong> about your traffic, <strong>protect</strong> you from brute force attacks, <strong>speed up</strong> your images and photos, and enable other <strong>traffic and security</strong> features.', 'jetpack' ), 'jetpack' ) ?></p>

			<div class="actions">
				<a href="<?php echo $this->build_connect_url() ?>" class="button button-primary">
					<?php esc_html_e( 'Connect Jetpack', 'jetpack' ); ?>
				</a>
			</div>
		</div>
		<?php
	}

	/*
	 * A graceful transition to using Core's site icon.
	 *
	 * All of the hard work has already been done with the image
	 * in all_done_page(). All that needs to be done now is update
	 * the option and display proper messaging.
	 *
	 * @todo remove when WP 4.3 is minimum
	 *
	 * @since 3.6.1
	 *
	 * @return bool false = Core's icon not available || true = Core's icon is available
	 */
	public static function jetpack_site_icon_available_in_core() {
		global $wp_version;
		$core_icon_available = function_exists( 'has_site_icon' ) && version_compare( $wp_version, '4.3-beta' ) >= 0;

		if ( ! $core_icon_available ) {
			return false;
		}

		// No need for Jetpack's site icon anymore if core's is already set
		if ( has_site_icon() ) {
			if ( Jetpack::is_module_active( 'site-icon' ) ) {
				Jetpack::log( 'deactivate', 'site-icon' );
				Jetpack::deactivate_module( 'site-icon' );
			}
			return true;
		}

		// Transfer Jetpack's site icon to use core.
		$site_icon_id = Jetpack::get_option( 'site_icon_id' );
		if ( $site_icon_id ) {
			// Update core's site icon
			update_option( 'site_icon', $site_icon_id );

			// Delete Jetpack's icon option. We still want the blavatar and attached data though.
			delete_option( 'site_icon_id' );
		}

		// No need for Jetpack's site icon anymore
		if ( Jetpack::is_module_active( 'site-icon' ) ) {
			Jetpack::log( 'deactivate', 'site-icon' );
			Jetpack::deactivate_module( 'site-icon' );
		}

		return true;
	}

}
