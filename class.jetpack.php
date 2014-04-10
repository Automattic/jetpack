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
	var $xmlrpc_server = null;

	private $xmlrpc_verification = null;

	var $HTTP_RAW_POST_DATA = null; // copy of $GLOBALS['HTTP_RAW_POST_DATA']

	var $plugins_to_deactivate = array(
		'stats'              	 => array( 'stats/stats.php', 'WordPress.com Stats' ),
		'shortlinks'         	 => array( 'stats/stats.php', 'WordPress.com Stats' ),
		'sharedaddy'         	 => array( 'sharedaddy/sharedaddy.php', 'Sharedaddy' ),
		'twitter-widget'     	 => array( 'wickett-twitter-widget/wickett-twitter-widget.php', 'Wickett Twitter Widget' ),
		'after-the-deadline'	 => array( 'after-the-deadline/after-the-deadline.php', 'After The Deadline' ),
		'contact-form'		 => array( 'grunion-contact-form/grunion-contact-form.php', 'Grunion Contact Form' ),
		'custom-css'		 => array( 'safecss/safecss.php', 'WordPress.com Custom CSS' ),
		'random-redirect'	 => array( 'random-redirect/random-redirect.php', 'Random Redirect' ),
		'videopress'		 => array( 'video/video.php', 'VideoPress' ),
		'widget-visibility'	 => array( 'jetpack-widget-visibility/widget-visibility.php', 'Jetpack Widget Visibility' ),
		'widget-visibility'	 => array( 'widget-visibility-without-jetpack/widget-visibility-without-jetpack.php', 'Widget Visibility Without Jetpack' ),
		'sharedaddy'		 => array( 'jetpack-sharing/sharedaddy.php', 'Jetpack Sharing' ),
		'omnisearch'		 => array( 'jetpack-omnisearch/omnisearch.php', 'Jetpack Omnisearch' ),
		'gravatar-hovercards'	 => array( 'jetpack-gravatar-hovercards/gravatar-hovercards.php', 'Jetpack Gravatar Hovercards' ),
		'latex'			 => array( 'wp-latex/wp-latex.php', 'WP LaTeX' ),
	);

	var $capability_translations = array(
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
			'Intense Debate'                 => 'intensedebate/intensedebate.php',
			'Disqus'                         => 'disqus-comment-system/disqus.php',
			'Livefyre'                       => 'livefyre-comments/livefyre.php',
			'Comments Evolved for WordPress' => 'gplus-comments/comments-evolved.php',
			'Google+ Comments'               => 'google-plus-comments/google-plus-comments.php',
		),
		'contact-form'      => array(
			'Contact Form 7'                 => 'contact-form-7/wp-contact-form-7.php',
			'Gravity Forms'                  => 'gravityforms/gravityforms.php',
			'Contact Form Plugin'            => 'contact-form-plugin/contact_form.php',
			'Easy Contact Forms'             => 'easy-contact-forms/easy-contact-forms.php',
			'Fast Secure Contact Form'       => 'si-contact-form/si-contact-form.php',
		),
		'gplus-authorship'  => array(
			'WP SEO by Yoast'                => 'wordpress-seo/wp-seo.php',
		),
		'minileven'         => array(
			'WPtouch'                        => 'wptouch/wptouch.php',
		),
		'latex'		    => array(
			'LaTeX for WordPress'            => 'latex/latex.php',
			'Youngwhans Simple Latex'        => 'youngwhans-simple-latex/yw-latex.php',
			'Easy WP LaTeX'                  => 'easy-wp-latex-lite/easy-wp-latex-lite.php',
			'MathJax-LaTeX'                  => 'mathjax-latex/mathjax-latex.php',
			'Enable Latex'                   => 'enable-latex/enable-latex.php',
			'WP QuickLaTeX'                  => 'wp-quicklatex/wp-quicklatex.php',
		),
		'random-redirect' => array(
			'Random Redirect 2'              => 'random-redirect-2/random-redirect.php',
		),
		'related-posts'     => array(
			'YARPP'                          => 'yet-another-related-posts-plugin/yarpp.php',
			'WordPress Related Posts'        => 'wordpress-23-related-posts-plugin/wp_related_posts.php',
			'nrelate Related Content'        => 'nrelate-related-content/nrelate-related.php',
			'Contextual Related Posts'       => 'contextual-related-posts/contextual-related-posts.php',
			'Related Posts for WordPress'    => 'microkids-related-posts/microkids-related-posts.php',
			'outbrain'                       => 'outbrain/outbrain.php',
			'Shareaholic'                    => 'shareaholic/shareaholic.php',
			'Sexybookmarks'                  => 'sexybookmarks/shareaholic.php',
		),
		'sharedaddy'        => array(
			'AddThis'                        => 'addthis/addthis_social_widget.php',
			'Add To Any'                     => 'add-to-any/add-to-any.php',
			'ShareThis'                      => 'share-this/sharethis.php',
			'Shareaholic'                    => 'shareaholic/shareaholic.php',
		),
		'widget-visibility' => array(
			'Widget Logic'                   => 'widget-logic/widget_logic.php',
			'Dynamic Widgets'                => 'dynamic-widgets/dynamic-widgets.php',
		),
	);

	/**
	 * Message to display in admin_notice
	 * @var string
	 */
	var $message = '';

	/**
	 * Error to display in admin_notice
	 * @var string
	 */
	var $error = '';

	/**
	 * Modules that need more privacy description.
	 * @var string
	 */
	var $privacy_checks = '';

	/**
	 * Stats to record once the page loads
	 *
	 * @var array
	 */
	var $stats = array();

	/**
	 * Jetpack_Sync object
	 */
	var $sync;

	/**
	 * Verified data for JSON authorization request
	 */
	var $json_api_authorization_request = array();

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
				add_action( 'plugins_loaded', array( __CLASS__, 'plugin_textdomain' ) );

			self::$instance = new Jetpack;

			self::$instance->plugin_upgrade();
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
	}

	/**
	 * Constructor.  Initializes WordPress hooks
	 */
	private function Jetpack() {
		
		/*
		 * Load things that should only be in Network Admin.
		 *
		 * For now blow away everything else until a more full
		 * understanding of what is needed at the network level is
		 * available
		 */
		if( is_multisite() ) {
			$jpms = Jetpack_Network::init();

			if( is_network_admin() ) 
			    return; // End here to prevent single site actions from firing
		}		
		
		
		
		$this->sync = new Jetpack_Sync;

		// Modules should do Jetpack_Sync::sync_options( __FILE__, $option, ... ); instead
		// We access the "internal" method here only because the Jetpack object isn't instantiated yet
		$this->sync->options(
			JETPACK__PLUGIN_DIR . 'jetpack.php',
			'home',
			'siteurl',
			'blogname',
			'gmt_offset',
			'timezone_string'
		);

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

		add_action( 'admin_menu', array( $this, 'admin_menu' ), 999 ); // run late so that other plugins hooking into this menu don't get left out
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_init', array( $this, 'dismiss_jetpack_notice' ) );

		add_filter( 'admin_body_class', array( $this, 'admin_body_class' ) );

		add_action( 'wp_ajax_jetpack-check-news-subscription', array( $this, 'check_news_subscription' ) );
		add_action( 'wp_ajax_jetpack-subscribe-to-news', array( $this, 'subscribe_to_news' ) );

		add_action( 'wp_ajax_jetpack-sync-reindex-trigger', array( $this, 'sync_reindex_trigger' ) );
		add_action( 'wp_ajax_jetpack-sync-reindex-status', array( $this, 'sync_reindex_status' ) );

		add_action( 'wp_loaded', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'devicepx' ) );
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'devicepx' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'devicepx' ) );

		add_filter( 'jetpack_require_lib_dir', array( $this, 'require_lib_dir' ) );

		// add_action( 'jetpack_admin_menu', array( $this, 'admin_menu_modules' ) );

		add_action( 'jetpack_activate_module', array( $this, 'activate_module_actions' ) );

		add_action( 'plugins_loaded', array( $this, 'extra_oembed_providers' ) );

		/**
		 * These actions run checks to load additional files.
		 * They check for external files or plugins, so they need to run as late as possible.
		 */
		add_action( 'wp_head', array( $this, 'check_open_graph' ),       1 );
		add_action( 'plugins_loaded', array( $this, 'check_twitter_tags' ),     999 );
		add_action( 'plugins_loaded', array( $this, 'check_rest_api_compat' ), 1000 );

		add_filter( 'map_meta_cap', array( $this, 'jetpack_custom_caps' ), 1, 4 );

		add_filter( 'jetpack_get_default_modules', array( $this, 'filter_default_modules' ) );
		add_filter( 'jetpack_get_default_modules', array( $this, 'handle_deprecated_modules' ), 99 );
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
			case 'jetpack_disconnect' :
			case 'jetpack_reconnect' :
				$caps = array( 'manage_options' );
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
		load_plugin_textdomain( 'jetpack', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
	}

	/**
	 * Register assets for use in various modules and the Jetpack admin page.
	 *
	 * @uses wp_script_is, wp_register_script, plugins_url
	 * @action wp_loaded
	 * @return null
	 */
	public function register_assets() {
		if ( ! wp_script_is( 'spin', 'registered' ) )
			wp_register_script( 'spin', plugins_url( '_inc/spin.js', __FILE__ ), false, '1.3' );

		if ( ! wp_script_is( 'jquery.spin', 'registered' ) )
			wp_register_script( 'jquery.spin', plugins_url( '_inc/jquery.spin.js', __FILE__ ) , array( 'jquery', 'spin' ), '1.3' );

		if ( ! wp_script_is( 'jetpack-gallery-settings', 'registered' ) )
			wp_register_script( 'jetpack-gallery-settings', plugins_url( '_inc/gallery-settings.js', __FILE__ ), array( 'media-views' ), '20121225' );

		/**
		 * As jetpack_register_genericons is by default fired off a hook,
		 * the hook may have already fired by this point.
		 * So, let's just trigger it manually.
		 */
		require_once( JETPACK__PLUGIN_DIR . '_inc/genericons.php' );
		jetpack_register_genericons();

		if ( ! wp_style_is( 'jetpack-icons', 'registered' ) )
			wp_register_style( 'jetpack-icons', plugins_url( '_inc/jetpack-icons/jetpack-icons.css', __FILE__ ), false, JETPACK__VERSION );
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
	function require_lib_dir( $lib_dir ) {
		return JETPACK__PLUGIN_DIR . '_inc/lib';
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

		return apply_filters( 'jetpack_development_mode', $development_mode );
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
	 * Get the wpcom email of the current connected user.
	 */
	public static function get_connected_user_email() {
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'wpcom.getUserEmail' );
		if ( ! $xml->isError() ) {
			return $xml->getResponse();
		}
		return false;
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

		/*
		if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
			return;
		}
		*/

		$version = Jetpack_Options::get_option( 'version' );
		if ( ! $version ) {
			$version = $old_version = JETPACK__VERSION . ':' . time();
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

		foreach ( $modules as $module ) {
			// If not connected and we're in dev mode, disable modules requiring a connection
			if ( ! Jetpack::is_active() ) {
				if ( empty( $modules_data[ $module ] ) ) {
					$modules_data[ $module ] = Jetpack::get_module( $module );
				}
				if ( $modules_data[ $module ]['requires_connection'] || ! Jetpack::is_development_mode() ) {
					continue;
				}
			}

			if ( did_action( 'jetpack_module_loaded_' . $module ) ) {
				continue;
			}

			require Jetpack::get_module_path( $module );
			do_action( 'jetpack_module_loaded_' . $module );
		}

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
		$_jetpack_rest_api_compat_includes = apply_filters( 'jetpack_rest_api_compat', array() );

		if ( function_exists( 'bbpress' ) )
			$_jetpack_rest_api_compat_includes[] = JETPACK__PLUGIN_DIR . 'class.jetpack-bbpress-json-api-compat.php';

		foreach ( $_jetpack_rest_api_compat_includes as $_jetpack_rest_api_compat_include )
			require_once $_jetpack_rest_api_compat_include;
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
		if ( in_array( 'publicize', Jetpack::get_active_modules() ) || in_array( 'sharedaddy', Jetpack::get_active_modules() ) )
			add_filter( 'jetpack_enable_open_graph', '__return_true', 0 );

		$active_plugins = get_option( 'active_plugins', array() );

		if ( is_multisite() ) {
			// Due to legacy code, active_sitewide_plugins stores them in the keys,
			// whereas active_plugins stores them in the values.
			$network_plugins = array_keys( get_site_option( 'active_sitewide_plugins', array() ) );
			if ( $network_plugins ) {
				$active_plugins = array_merge( $active_plugins, $network_plugins );
			}
		}

		$conflicting_plugins = array(
			'facebook/facebook.php',                                                		// Official Facebook plugin
			'wordpress-seo/wp-seo.php',                                             		// WordPress SEO by Yoast
			'add-link-to-facebook/add-link-to-facebook.php',                        		// Add Link to Facebook
			'facebook-awd/AWD_facebook.php',                                        		// Facebook AWD All in one
			'header-footer/plugin.php',                                             		// Header and Footer
			'nextgen-facebook/nextgen-facebook.php',                                		// NextGEN Facebook OG
			'seo-facebook-comments/seofacebook.php',                                		// SEO Facebook Comments
			'seo-ultimate/seo-ultimate.php',                                        		// SEO Ultimate
			'sexybookmarks/sexy-bookmarks.php',                                     		// Shareaholic
			'shareaholic/sexy-bookmarks.php',                                       		// Shareaholic
			'social-discussions/social-discussions.php',                            		// Social Discussions
			'social-networks-auto-poster-facebook-twitter-g/NextScripts_SNAP.php',			// NextScripts SNAP
			'wordbooker/wordbooker.php',                                            		// Wordbooker
			'socialize/socialize.php',                                              		// Socialize
			'simple-facebook-connect/sfc.php',                                      		// Simple Facebook Connect
			'social-sharing-toolkit/social_sharing_toolkit.php',                    		// Social Sharing Toolkit
			'wp-facebook-open-graph-protocol/wp-facebook-ogp.php',                  		// WP Facebook Open Graph protocol
			'opengraph/opengraph.php',                                              		// Open Graph
			'sharepress/sharepress.php',                                            		// SharePress
			'wp-facebook-like-send-open-graph-meta/wp-facebook-like-send-open-graph-meta.php',	// WP Facebook Like Send & Open Graph Meta
			'network-publisher/networkpub.php',							// Network Publisher
			'wp-ogp/wp-ogp.php',									// WP-OGP
			'open-graph-protocol-framework/open-graph-protocol-framework.php',			// Open Graph Protocol Framework
			'all-in-one-seo-pack/all_in_one_seo_pack.php',						// All in One SEO Pack
			'facebook-featured-image-and-open-graph-meta-tags/fb-featured-image.php',		// Facebook Featured Image & OG Meta Tags
			'add-meta-tags/add-meta-tags.php',							// Add Meta Tags
			'only-tweet-like-share-and-google-1/tweet-like-plusone.php',				// Tweet, Like, Google +1 and Share
			'easy-facebook-share-thumbnails/esft.php',						// Easy Facebook Share Thumbnail
			'2-click-socialmedia-buttons/2-click-socialmedia-buttons.php',				// 2 Click Social Media Buttons
			'facebook-thumb-fixer/_facebook-thumb-fixer.php',					// Facebook Thumb Fixer
			'zoltonorg-social-plugin/zosp.php',							// Zolton.org Social Plugin
			'wp-caregiver/wp-caregiver.php',							// WP Caregiver
			'facebook-revised-open-graph-meta-tag/index.php',					// Facebook Revised Open Graph Meta Tag
			'facebook-and-digg-thumbnail-generator/facebook-and-digg-thumbnail-generator.php',	// Fedmich's Facebook Open Graph Meta
			'facebook-meta-tags/facebook-metatags.php',						// Facebook Meta Tags
		);

		foreach ( $conflicting_plugins as $plugin ) {
			if ( in_array( $plugin, $active_plugins ) ) {
				add_filter( 'jetpack_enable_open_graph', '__return_false', 99 );
				break;
			}
		}

		if ( apply_filters( 'jetpack_enable_open_graph', false ) )
			require_once JETPACK__PLUGIN_DIR . 'functions.opengraph.php';
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

		$active_plugins = get_option( 'active_plugins', array() );

		if ( is_multisite() ) {
			// Due to legacy code, active_sitewide_plugins stores them in the keys,
			// whereas active_plugins stores them in the values.
			$network_plugins = array_keys( get_site_option( 'active_sitewide_plugins', array() ) );
			if ( $network_plugins ) {
				$active_plugins = array_merge( $active_plugins, $network_plugins );
			}
		}

		$conflicting_plugins = array(
			'twitter-cards/twitter-cards.php',		// Twitter Cards
			'twitter-cards-meta/twitter-cards-meta.php',	// Twitter Cards Meta
			'ig-twitter-cards/ig-twitter-cards.php',	// IG:Twitter Cards
			'jm-twitter-cards/jm-twitter-cards.php',	// JM Twitter Cards
			'wp-twitter-cards/twitter_cards.php',		// WP Twitter Cards
			'eewee-twitter-card/index.php',			// Eewee Twitter Card
			'kevinjohn-gallagher-pure-web-brilliants-social-graph-twitter-cards-extention/kevinjohn_gallagher___social_graph_twitter_output.php',	// Pure Web Brilliant's Social Graph Twitter Cards Extention
		);

		foreach ( $conflicting_plugins as $plugin ) {
			if ( in_array( $plugin, $active_plugins ) ) {
				add_filter( 'jetpack_disable_twitter_cards', '__return_true', 99 );
				break;
			}
		}

		if ( apply_filters( 'jetpack_disable_twitter_cards', true ) )
			require_once JETPACK__PLUGIN_DIR . 'functions.twitter-cards.php';
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
	* Does some extra verification so urls (such as those to public-api, register, etc) cant just be crafted
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
	 * @param string $name  Option name
	 * @param mixed  $value Option value
	 */
	public static function update_option( $name, $value ) {
		return Jetpack_Options::update_option( $name, $value );
	}

	/**
	 * Updates the multiple given options.  Updates jetpack_options and/or jetpack_$name as appropriate.
 	 *
	 * @param array $array array( option name => option value, ... )
	 */
	public static function update_options( $array ) {
		return Jetpack_Options::update_options( $array );
	}

	/**
	 * Deletes the given option.  May be passed multiple option names as an array.
	 * Updates jetpack_options and/or deletes jetpack_$name as appropriate.
 	 *
	 * @param string|array $names
	 */
	public static function delete_option( $names ) {
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

	public function activate_new_modules() {
		if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
			return;
		}

		$jetpack_old_version = Jetpack_Options::get_option( 'version' ); // [sic]
		if ( ! $jetpack_old_version ) {
			$jetpack_old_version = $version = $old_version = '1.1:' . time();
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

		if ( version_compare( $jetpack_version, '1.9.2', '<' ) && version_compare( '1.9-something', JETPACK__VERSION, '<' ) ) {
			add_action( 'jetpack_activate_default_modules', array( $this->sync, 'sync_all_registered_options' ), 1000 );
		}

		Jetpack_Options::update_options(
			array(
				'version'     => JETPACK__VERSION . ':' . time(),
				'old_version' => $jetpack_old_version,
			)
		);

		Jetpack::state( 'message', 'modules_activated' );
		Jetpack::activate_default_modules( $jetpack_version, JETPACK__VERSION, $reactivate_modules );
		wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
		exit;
	}

	/**
	 * List available Jetpack modules. Simply lists .php files in /modules/.
	 * Make sure to tuck away module "library" files in a sub-directory.
	 */
	public static function get_available_modules( $min_version = false, $max_version = false ) {
		static $modules = null;

		if ( ! isset( $modules ) ) {
			$files = Jetpack::glob_php( JETPACK__PLUGIN_DIR . 'modules' );

			$modules = array();

			foreach ( $files as $file ) {
				if ( ! $headers = Jetpack::get_module( $file ) ) {
					continue;
				}

				$modules[ Jetpack::get_module_slug( $file ) ] = $headers['introduced'];
			}
		}

		$modules = apply_filters( 'jetpack_get_available_modules', $modules, $min_version, $max_version );

		if ( ! $min_version && ! $max_version ) {
			return array_keys( $modules );
		}

		$r = array();
		foreach ( $modules as $slug => $introduced ) {
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
			'debug' => null,  // Closed out and moved to ./class.jetpack-debugger.php
			'wpcc'  => 'sso', // Closed out in 2.6 -- SSO provides the same functionality.
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
		$active_plugins = get_option( 'active_plugins', array() );
		if ( is_multisite() ) {
			// Due to legacy code, active_sitewide_plugins stores them in the keys,
			// whereas active_plugins stores them in the values.
			$network_plugins = array_keys( get_site_option( 'active_sitewide_plugins', array() ) );
			if ( $network_plugins ) {
				$active_plugins = array_merge( $active_plugins, $network_plugins );
			}
		}
		sort( $active_plugins );

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
			'name'                => 'Module Name',
			'description'         => 'Module Description',
			'sort'                => 'Sort Order',
			'introduced'          => 'First Introduced',
			'changed'             => 'Major Changes In',
			'deactivate'          => 'Deactivate',
			'free'                => 'Free',
			'requires_connection' => 'Requires Connection',
			'auto_activate'       => 'Auto Activate',
			'module_tags'         => 'Module Tags',
		);

		$file = Jetpack::get_module_path( Jetpack::get_module_slug( $module ) );
		if ( ! file_exists( $file ) )
			return false;

		$mod = get_file_data( $file, $headers );
		if ( empty( $mod['name'] ) )
			return false;

		$mod['name']                = translate( $mod['name'], 'jetpack' );
		$mod['description']         = translate( $mod['description'], 'jetpack' );
		$mod['sort']                = empty( $mod['sort'] ) ? 10 : (int) $mod['sort'];
		$mod['deactivate']          = empty( $mod['deactivate'] );
		$mod['free']                = empty( $mod['free'] );
		$mod['requires_connection'] = ( ! empty( $mod['requires_connection'] ) && 'No' == $mod['requires_connection'] ) ? false : true;

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

		return $mod;
	}

	public static function translate_module_tag( $untranslated_tag ) {
		return _x( $untranslated_tag, 'Module Tag', 'jetpack' );

		// Calls here are to populate translation files.
		_x( 'Photos and Videos',   'Module Tag', 'jetpack' );
		_x( 'Social',              'Module Tag', 'jetpack' );
		_x( 'WordPress.com Stats', 'Module Tag', 'jetpack' );
		_x( 'Writing',             'Module Tag', 'jetpack' );
		_x( 'Appearance',          'Module Tag', 'jetpack' );
		_x( 'Developers',          'Module Tag', 'jetpack' );
		_x( 'Mobile',              'Module Tag', 'jetpack' );
		_x( 'Other',               'Module Tag', 'jetpack' );
	}

	/**
	 * Get a list of activated modules as an array of module slugs.
	 */
	public static function get_active_modules() {
		$active = Jetpack_Options::get_option( 'active_modules' );
		if ( ! is_array( $active ) )
			$active = array();
		if ( is_admin() ) {
			$active[] = 'vaultpress';
		} else {
			$active = array_diff( $active, array( 'vaultpress' ) );
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
			remove_action( 'shutdown', array( 'Jetpack', 'catch_errors_on_shutdown' ), 1 );
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

		do_action( 'jetpack_before_activate_default_modules', $min_version, $max_version, $other_modules );

		// Check each module for fatal errors, a la wp-admin/plugins.php::activate before activating
		Jetpack::restate();
		Jetpack::catch_errors( true );
		foreach ( $modules as $module ) {
			if ( did_action( "jetpack_module_loaded_$module" ) ) {
				$active[] = $module;
				Jetpack_Options::update_option( 'active_modules', array_unique( $active ) );
				continue;
			}
			$active = Jetpack::get_active_modules();
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
		do_action( 'jetpack_activate_default_modules', $min_version, $max_version, $other_modules );
	}

	public static function activate_module( $module, $exit = true ) {
		do_action( 'jetpack_pre_activate_module', $module, $exit );

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
			if ( ! Jetpack::is_development_mode() )
				return false;

			// If we're not connected but in development mode, make sure the module doesn't require a connection
			if ( Jetpack::is_development_mode() && $module_data['requires_connection'] )
					return false;
		}

		// Check and see if the old plugin is active
		if ( isset( $jetpack->plugins_to_deactivate[$module] ) ) {
			// Deactivate the old plugin
			if ( Jetpack_Client_Server::deactivate_plugin( $jetpack->plugins_to_deactivate[$module][0], $jetpack->plugins_to_deactivate[$module][1] ) ) {
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
		wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );

		Jetpack::catch_errors( true );
		ob_start();
		require Jetpack::get_module_path( $module );
		do_action( 'jetpack_activate_module', $module );
		$active[] = $module;
		Jetpack_Options::update_option( 'active_modules', array_unique( $active ) );
		Jetpack::state( 'error', false ); // the override
		Jetpack::state( 'message', 'module_activated' );
		Jetpack::state( 'module', $module );
		ob_end_clean();
		Jetpack::catch_errors( false );

		if ( $exit ) {
			exit;
		}
	}

	function activate_module_actions( $module ) {
		do_action( "jetpack_activate_module_$module" );

		$this->sync->sync_all_module_options( $module );
	}

	public static function deactivate_module( $module ) {
		do_action( 'jetpack_pre_deactivate_module', $module );

		$active = Jetpack::get_active_modules();
		$new    = array_filter( array_diff( $active, (array) $module ) );

		do_action( "jetpack_deactivate_module_$module" );
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
	 * Sets the internal version number and activation state.
	 * @static
	 */
	public static function plugin_initialize() {
		if ( ! Jetpack_Options::get_option( 'activated' ) ) {
			Jetpack_Options::update_option( 'activated', 2 );
		}

		if ( ! Jetpack_Options::get_option( 'version' ) ) {
			$version = $old_version = JETPACK__VERSION . ':' . time();
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
	 * [Everyone Loves a Log!](http://www.youtube.com/watch?v=8L6Dpq5kY_A)
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
	}

	/**
	 * Get the internal event log.
	 */
	public static function get_log() {
		return Jetpack_Options::get_option( 'log', array() );
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
		}
/* Toggle this off as it's not ready for prime time just yet.
		if( current_user_can( 'manage_options' ) && self::check_identity_crisis() ) {
			add_action( 'admin_notices', array( $this, 'alert_identity_crisis' ) );
		}
/**/

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

		// Handle pre-mp6 styling by adding a 'pre-mp6' body class.
		include( ABSPATH . WPINC . '/version.php' );
		if ( version_compare( $wp_version, '3.8-alpha', '<' ) ) {
			$classes[] = 'pre-mp6';
		}

		return implode( ' ', array_unique( $classes ) );
	}

	static function add_jetpack_pagestyles( $admin_body_class = '' ) {
		return $admin_body_class . ' jetpack-pagestyles';
	}

	function prepare_connect_notice() {
		add_action( 'admin_print_styles', array( $this, 'admin_styles' ) );

		add_action( 'admin_notices', array( $this, 'admin_connect_notice' ) );

		if ( Jetpack::state( 'network_nag' ) )
			add_action( 'network_admin_notices', array( $this, 'network_connect_notice' ) );
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

	function admin_menu() {
		list( $jetpack_version ) = explode( ':', Jetpack_Options::get_option( 'version' ) );
		if (
			$jetpack_version
		&&
			$jetpack_version != JETPACK__VERSION
		&&
			( $new_modules = Jetpack::get_default_modules( $jetpack_version, JETPACK__VERSION ) )
		&&
			is_array( $new_modules )
		&&
			( $new_modules_count = count( $new_modules ) )
		&&
			( Jetpack::is_active() || Jetpack::is_development_mode() )
		) {
			$new_modules_count_i18n = number_format_i18n( $new_modules_count );
			$span_title = esc_attr( sprintf( _n( 'One New Jetpack Module', '%s New Jetpack Modules', $new_modules_count, 'jetpack' ), $new_modules_count_i18n ) );
			$title = sprintf( 'Jetpack %s', "<span class='update-plugins count-{$new_modules_count}' title='$span_title'><span class='update-count'>$new_modules_count_i18n</span></span>" );
		} else {
			$title = __( 'Jetpack', 'jetpack' );
		}

		$hook = add_menu_page( 'Jetpack', $title, 'read', 'jetpack', array( $this, 'admin_page' ), 'div' );

		$debugger_hook = add_submenu_page( null, __( 'Jetpack Debugging Center', 'jetpack' ), '', 'manage_options', 'jetpack-debugger', array( $this, 'debugger_page' ) );
		add_action( "admin_head-$debugger_hook", array( 'Jetpack_Debugger', 'jetpack_debug_admin_head' ) );

		add_action( "load-$hook", array( $this, 'admin_page_load' ) );

		if ( version_compare( $GLOBALS['wp_version'], '3.3', '<' ) ) {
			if ( isset( $_GET['page'] ) && 'jetpack' == $_GET['page'] ) {
				add_contextual_help( $hook, $this->jetpack_help() );
			}
		} else {
			add_action( "load-$hook", array( $this, 'admin_help' ) );
		}
		add_action( "admin_head-$hook", array( $this, 'admin_head' ) );
		add_filter( 'custom_menu_order', array( $this, 'admin_menu_order' ) );
		add_filter( 'menu_order', array( $this, 'jetpack_menu_order' ) );

		add_action( "admin_print_styles-$hook", array( $this, 'admin_styles' ) );

		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts' ) );

		do_action( 'jetpack_admin_menu', $hook );
	}
/*
	function admin_menu_modules() {
		$hook = add_submenu_page( 'jetpack', __( 'Jetpack Modules', 'jetpack' ), __( 'Modules', 'jetpack' ), 'edit_posts', 'jetpack_modules', array( $this, 'admin_page_modules' ) );

		add_action( "load-$hook",                array( $this, 'admin_page_load' ) );
		add_action( "load-$hook",                array( $this, 'admin_help'      ) );
		add_action( "admin_head-$hook",          array( $this, 'admin_head'      ) );
		add_action( "admin_print_styles-$hook",  array( $this, 'admin_styles'    ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts'   ) );
	}
/**/
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
	 * Deprecated.  Remove when Jetpack requires WP 3.3+
	 */
	function jetpack_help() {
		return
			'<p><strong>' . __( 'Jetpack by WordPress.com', 'jetpack' ) . '</strong></p>' .
			'<p>' . __( 'Jetpack supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.', 'jetpack' ) . '</p>' .
			'<p>' . __( 'On this page, you are able to view the modules available within Jetpack, learn more about them, and activate or deactivate them as needed.', 'jetpack' ) . '</p>' .
			'<p><strong>' . __( 'Jetpack Module Options', 'jetpack' ) . '</strong></p>' .
			'<p>' . __( '<strong>To Activate/Deactivate a Module</strong> - Click on Learn More. An Activate or Deactivate button will now appear next to the Learn More button. Click the Activate/Deactivate button.', 'jetpack' ) . '</p>' .
			'<p><strong>' . __( 'For more information:', 'jetpack' ) . '</strong></p>' .
			'<p><a href="http://jetpack.me/faq/" target="_blank">'     . __( 'Jetpack FAQ',     'jetpack' ) . '</a></p>' .
			'<p><a href="http://jetpack.me/support/" target="_blank">' . __( 'Jetpack Support', 'jetpack' ) . '</a></p>';
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
				'id'		=> 'overview',
				'title'		=> __( 'Overview', 'jetpack' ),
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
					'id'		=> 'modules',
					'title'		=> __( 'Modules', 'jetpack' ),
					'content'	=>
						'<p><strong>' . __( 'Jetpack by WordPress.com',                                              'jetpack' ) . '</strong></p>' .
						'<p>' . __( 'You can activate or deactivate individual Jetpack modules to suit your needs.', 'jetpack' ) . '</p>' .
						'<ol>' .
							'<li>' . __( 'Find the component you want to manage',                            'jetpack' ) . '</li>' .
							'<li>' . __( 'Click on Learn More',                                              'jetpack' ) . '</li>' .
							'<li>' . __( 'An Activate or Deactivate button will appear',                     'jetpack' ) . '</li>' .
							'<li>' . __( 'If additional settings are available, a link to them will appear', 'jetpack' ) . '</li>' .
						'</ol>',
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
		// Make sure we're working off a clean version.
		include( ABSPATH . WPINC . '/version.php' );
		if ( version_compare( $wp_version, '3.8-alpha', '>=' ) ) {
			wp_enqueue_style( 'jetpack-icons' );
			$css = "
				#toplevel_page_jetpack .wp-menu-image:before {
					font-family: 'Jetpack' !important;
					content: '\\e600';
				}
				#toplevel_page_jetpack .wp-menu-image {
					background-repeat: no-repeat;
				}
				#menu-posts-feedback .wp-menu-image:before {
					font-family: dashicons !important;
					content: '\\f175';
				}
				#adminmenu #menu-posts-feedback div.wp-menu-image {
					background: none !important;
					background-repeat: no-repeat;
				}";
		} else {
			$css = "
				#toplevel_page_jetpack .wp-menu-image {
					background: url( " . plugins_url( '_inc/images/menuicon-sprite.png', __FILE__ ) . " ) 0 90% no-repeat;
				}
				/* Retina Jetpack Menu Icon */
				@media  only screen and (-moz-min-device-pixel-ratio: 1.5),
						only screen and (-o-min-device-pixel-ratio: 3/2),
						only screen and (-webkit-min-device-pixel-ratio: 1.5),
						only screen and (min-device-pixel-ratio: 1.5) {
					#toplevel_page_jetpack .wp-menu-image {
						background: url( " . plugins_url( '_inc/images/menuicon-sprite-2x.png', __FILE__ ) . " ) 0 90% no-repeat;
						background-size:30px 64px;
					}
				}
				#toplevel_page_jetpack.current .wp-menu-image,
				#toplevel_page_jetpack.wp-has-current-submenu .wp-menu-image,
				#toplevel_page_jetpack:hover .wp-menu-image {
					background-position: top left;
				}";
		}
		wp_add_inline_style( 'wp-admin', $css );
	}

	function admin_menu_order() {
		return true;
	}

	function jetpack_menu_order( $menu_order ) {
		$jp_menu_order = array();

		foreach ( $menu_order as $index => $item ) {
			if ( $item != 'jetpack' )
				$jp_menu_order[] = $item;

			if ( $index == 0 )
				$jp_menu_order[] = 'jetpack';
		}

		return $jp_menu_order;
	}

	function admin_head() {
		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) )
			do_action( 'jetpack_module_configuration_head_' . $_GET['configure'] );
	}

	function admin_styles() {
		global $wp_styles;
		wp_enqueue_style( 'jetpack', plugins_url( '_inc/jetpack.css', __FILE__ ), false, JETPACK__VERSION . '-20121016' );
		$wp_styles->add_data( 'jetpack', 'rtl', true );
	}

	function admin_scripts() {
		wp_enqueue_script( 'jetpack-js', plugins_url( '_inc/jetpack.js', __FILE__ ), array( 'jquery' ), JETPACK__VERSION . '-20121111' );
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
		return array_merge(
			array( 'settings' => sprintf( '<a href="%s">%s</a>', Jetpack::admin_url(), __( 'Settings', 'jetpack' ) ) ),
			$actions
		);
		return $actions;
	}

	function admin_connect_notice() {
		// Don't show the connect notice on the jetpack settings page. @todo: must be a better way?
		if ( false !== strpos( $_SERVER['QUERY_STRING'], 'page=jetpack' ) )
			return;

		if ( ! current_user_can( 'manage_options' ) )
			return;
		?>

		<div id="message" class="updated jetpack-message jp-connect" style="display:block !important;">
			<div id="jp-dismiss" class="jetpack-close-button-container">
				<a class="jetpack-close-button" href="?page=jetpack&jetpack-notice=dismiss" title="<?php _e( 'Dismiss this notice and deactivate Jetpack.', 'jetpack' ); ?>"><?php _e( 'Dismiss this notice and deactivate Jetpack.', 'jetpack' ); ?></a>
			</div>
			<div class="jetpack-wrap-container">
				<div class="jetpack-text-container">
					<h4>
						<?php if ( 1 == Jetpack_Options::get_option( 'activated' ) ) : ?>
							<p><?php _e( '<strong>Your Jetpack is almost ready</strong> &#8211; A connection to WordPress.com is needed to enable features like Stats, Contact Forms, and Subscriptions. Connect now to get fueled up!', 'jetpack' ); ?></p>
						<?php else : ?>
							<p><?php _e( '<strong>Jetpack is installed</strong> and ready to bring awesome, WordPress.com cloud-powered features to your site.', 'jetpack' ) ?></p>
						<?php endif; ?>
					</h4>
				</div>
				<div class="jetpack-install-container">
					<?php if ( 1 == Jetpack_Options::get_option( 'activated' ) ) : ?>
						<p class="submit"><a href="<?php echo $this->build_connect_url() ?>" class="button-connector" id="wpcom-connect"><?php _e( 'Connect to WordPress.com', 'jetpack' ); ?></a></p>
					<?php else : ?>
						<p class="submit"><a href="<?php echo Jetpack::admin_url() ?>" class="button-connector" id="wpcom-connect"><?php _e( 'Learn More', 'jetpack' ); ?></a></p>
					<?php endif; ?>
				</div>
			</div>
		</div>

		<?php
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
			__( 'Jetpack now includes Jetpack Comments, which enables your visitors to use their WordPress.com, Twitter, or Facebook accounts when commenting on your site. To activate Jetpack Comments, <a href="%s">%s</a>.', 'jetpack' ),
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
				check_admin_referer( 'jetpack-register' );
				Jetpack::log( 'register' );
				$registered = Jetpack::try_registration();
				if ( is_wp_error( $registered ) ) {
					$error = $registered->get_error_code();
					Jetpack::state( 'error_description', $registered->get_error_message() );
					break;
				}

				wp_redirect( $this->build_connect_url( true ) );
				exit;
			case 'activate' :
				if ( ! current_user_can( 'manage_options' ) ) {
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
				wp_safe_redirect( Jetpack::admin_url() );
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
				if ( ! current_user_can( 'manage_options' ) ) {
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
				check_admin_referer( 'jetpack-unlink' );
				Jetpack::log( 'unlink' );
				$this->unlink_user();
				Jetpack::state( 'message', 'unlinked' );
				wp_safe_redirect( Jetpack::admin_url() );
				exit;
			default:
				do_action( 'jetpack_unrecognized_action', sanitize_key( $_GET['action'] ) );
			}
		}

		if ( ! $error = $error ? $error : Jetpack::state( 'error' ) ) {
			$this->activate_new_modules();
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

		case 'module_activated' :
			if ( $module = Jetpack::get_module( Jetpack::state( 'module' ) ) ) {
				$this->message = sprintf( __( '<strong>%s Activated!</strong> You can deactivate at any time by clicking Learn More and then Deactivate on the module card.', 'jetpack' ), $module['name'] );
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
					'<strong>%l Deactivated!</strong> You can activate it again at any time using the activate button on the module card.',
					'<strong>%l Deactivated!</strong> You can activate them again at any time using the activate buttons on their module cards.',
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
			$this->message  = __( '<strong>You&#8217;re fueled up and ready to go.</strong> ', 'jetpack' );
			$this->message .= "<br />\n";
			$this->message .= __( 'The features below are now active. Click the learn more buttons to explore each feature.', 'jetpack' );
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

		if ( $this->message || $this->error || $this->privacy_checks ) {
			add_action( 'jetpack_notices', array( $this, 'admin_notices' ) );
		}

		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) ) {
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
		$response = wp_remote_get( self::build_stats_url( $args ) );
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
		$base_url = apply_filters( 'jetpack_stats_base_url', ( is_ssl() ? 'https' : 'http' ) . '://stats.wordpress.com/g.gif' );
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
		if ( ! Jetpack_Options::get_option( 'blog_token' ) ) {
			$url = $this->nonce_url_no_esc( $this->admin_url( 'action=register' ), 'jetpack-register' );
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
		$url = wp_nonce_url( $this->admin_url( 'action=reconnect' ), 'jetpack-reconnect' );
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
		if ( isset( $_GET['jetpack-notice'] ) && 'dismiss' == $_GET['jetpack-notice'] && ! is_plugin_active_for_network( plugin_basename( JETPACK__PLUGIN_DIR . 'jetpack.php' ) ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';

			deactivate_plugins( JETPACK__PLUGIN_DIR . 'jetpack.php', false, false );

			wp_safe_redirect( admin_url() . 'plugins.php?deactivate=true&plugin_status=all&paged=1&s=' );
			exit;
		}
	}

	function admin_page() {
		global $current_user;

		$is_connected      = Jetpack::is_active();
		$user_token        = Jetpack_Data::get_access_token( $current_user->ID );
		$is_user_connected = $user_token && ! is_wp_error( $user_token );
		$is_master_user    = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
	
		$can_reconnect_jpms = true;
		if( is_plugin_active_for_network( 'jetpack/jetpack.php' ) ) {
		    $jpms = Jetpack_Network::init();
		    $can_reconnect_jpms = ( $jpms->get_option( 'sub-site-connection-override' ) )? 1: 0;
		}
	
	
	
	
	?>
		<div class="wrap" id="jetpack-settings">

			<div id="jp-header"<?php if ( $is_connected ) : ?> class="small"<?php endif; ?>>
				<div id="jp-clouds">
					<?php if ( $is_connected && $can_reconnect_jpms ) : ?>
					<div id="jp-disconnectors">
						<?php if ( current_user_can( 'jetpack_disconnect' ) ) : ?>
						<div id="jp-disconnect" class="jp-disconnect">
							<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=disconnect' ), 'jetpack-disconnect' ); ?>"><div class="deftext"><?php _e( 'Connected to WordPress.com', 'jetpack' ); ?></div><div class="hovertext"><?php _e( 'Disconnect from WordPress.com', 'jetpack' ) ?></div></a>
						</div>
						<?php endif; ?>
						<?php if ( $is_user_connected && ! $is_master_user ) : ?>
						<div id="jp-unlink" class="jp-disconnect">
							<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=unlink' ), 'jetpack-unlink' ); ?>"><div class="deftext"><?php _e( 'User linked to WordPress.com', 'jetpack' ); ?></div><div class="hovertext"><?php _e( 'Unlink user from WordPress.com', 'jetpack' ) ?></div></a>
						</div>
						<?php endif; ?>
					</div>
					<?php endif; ?>
					<h3><?php _e( 'Jetpack by WordPress.com', 'jetpack' ) ?></h3>
					<?php if ( ! $is_connected ) : ?>
					<div id="jp-notice">
						<p><?php _e( 'Jetpack supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.', 'jetpack' ); ?></p>
					</div>
					<?php endif; ?>
				</div>
			</div>

			<h2 style="display: none"></h2> <!-- For WP JS message relocation -->

			<?php if ( isset( $_GET['jetpack-notice'] ) && 'dismiss' == $_GET['jetpack-notice'] ) : ?>
				<div id="message" class="error">
					<p><?php _e( 'Jetpack is network activated. Notices cannot be dismissed.', 'jetpack' ); ?></p>
				</div>
			<?php endif; ?>

			<?php do_action( 'jetpack_notices' ) ?>

			<?php
			// If the connection has not been made then show the marketing text.
			if( !$can_reconnect_jpms && !$is_connected ) {
			?>
			<div id="message" class="updated jetpack-message jp-connect jp-multisite" style="display:block !important">
				<div class="jetpack-wrap-container">
					<div class="jetpack-text-container">
						<h4>
							<p><?php _e( 'To use Jetpack please contact your WordPress administrator to connect it for you.', 'jetpack' ) ?></p>
						</h4>
					</div>
				</div>
			</div> <?php
			}
			if ( ! Jetpack::is_development_mode() && $can_reconnect_jpms ) :
			?>
				<?php if ( ! $is_connected ) : ?>

				<div id="message" class="updated jetpack-message jp-connect" style="display:block !important;">
					<div id="jp-dismiss" class="jetpack-close-button-container">
						<a class="jetpack-close-button" href="?page=jetpack&jetpack-notice=dismiss" title="<?php _e( 'Dismiss this notice.', 'jetpack' ); ?>"><?php _e( 'Dismiss this notice.', 'jetpack' ); ?></a>
					</div>
					<div class="jetpack-wrap-container">
						<div class="jetpack-text-container">
							<h4>
								<p><?php _e( 'To enable all of the Jetpack features you&#8217;ll need to connect your website to WordPress.com using the button to the right. Once you&#8217;ve made the connection you&#8217;ll activate all the delightful features below.', 'jetpack' ) ?></p>
							</h4>
						</div>
						<div class="jetpack-install-container">
							<p class="submit"><a href="<?php echo $this->build_connect_url() ?>" class="button-connector" id="wpcom-connect"><?php _e( 'Connect to WordPress.com', 'jetpack' ); ?></a></p>
						</div>
					</div>
				</div>

				<?php else /* blog and user are connected */ : ?>
					<?php /* TODO: if not master user, show user disconnect button? */ ?>
				<?php endif; ?>
			<?php endif; // ! Jetpack::is_development_mode() ?>





			<?php if ( Jetpack::is_active() && !Jetpack::is_development_mode() && ! $is_user_connected ) : ?>

				<div id="message" class="updated jetpack-message jp-connect" style="display:block !important;">
					<div class="jetpack-wrap-container">
						<div class="jetpack-text-container">
							<h4>
								<p><?php _e( 'To enable all of the Jetpack features you&#8217;ll need to link your account here to your WordPress.com account using the button to the right.', 'jetpack' ) ?></p>
							</h4>
						</div>
						<div class="jetpack-install-container">
							<p class="submit"><a href="<?php echo $this->build_connect_url() ?>" class="button-connector" id="wpcom-connect"><?php _e( 'Link account with WordPress.com', 'jetpack' ); ?></a></p>
						</div>
					</div>
				</div>

			<?php endif; ?>




			<?php
			if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) ) {
				$this->admin_screen_configure_module( $_GET['configure'] );
			} else {
				$this->admin_screen_list_modules();
			}
			?>

			<div id="survey" class="jp-survey">
				<div class="jp-survey-container">
					<div class="jp-survey-text">
						<h4><?php _e( 'Have feedback on Jetpack?', 'jetpack' ); ?></h4>
						<br />
						<?php _e( 'Answer a short survey to let us know how we&#8217;re doing and what to add in the future.', 'jetpack' ); ?>
					</div>
					<div class="jp-survey-button-container">
						<p class="submit"><?php printf( '<a id="jp-survey-button" class="button-primary" target="_blank" href="%1$s">%2$s</a>', 'http://jetpack.me/survey/?rel=' . JETPACK__VERSION, __( 'Take Survey', 'jetpack' ) ); ?></p>
					</div>
				</div>
			</div>

			<?php if ( $is_connected && $this->current_user_is_connection_owner() ) : ?>
				<p id="news-sub"><?php _e( 'Checking email updates status&hellip;', 'jetpack' ); ?></p>
				<script type="text/javascript">
				jQuery(document).ready(function($){
					$.get( ajaxurl, { action: 'jetpack-check-news-subscription', rand: jQuery.now().toString() + Math.random().toString() }, function( data ) {
						if ( 'subscribed' == data ) {
							$( '#news-sub' ).html( '<?php printf(
														esc_js( _x( 'You are currently subscribed to email updates. %s', '%s = Unsubscribe link', 'jetpack' ) ),
														'<a href="#" class="jp-news-link button">' . esc_js( __( 'Unsubscribe', 'jetpack' ) ) . '</a>'
													); ?>' );
						} else {
							$( '#news-sub' ).html( '<?php printf(
														esc_js( _x( 'Want to receive updates about Jetpack by email? %s', '%s = Subscribe link', 'jetpack' ) ),
														'<a href="#" class="jp-news-link button-primary">' . esc_js( __( 'Subscribe', 'jetpack' ) ) . '</a>'
													); ?>' );
						}
						$( '.jp-news-link' ).click( function() {
							$( '#news-sub' ).append( ' <img src="<?php echo esc_js( esc_url( admin_url( 'images/loading.gif' ) ) ); ?>" align="absmiddle" id="jp-news-loading" />' );
							$.get( ajaxurl, { action: 'jetpack-subscribe-to-news', rand: jQuery.now().toString() + Math.random().toString() }, function( data ) {
								if ( 'subscribed' == data ) {
									$( '#news-sub' ).text( '<?php echo esc_js( __( 'You have been subscribed to receive email updates.', 'jetpack' ) ); ?>' );
								} else {
									$( '#news-sub' ).text( '<?php echo esc_js( __( 'You will no longer receive email updates about Jetpack.', 'jetpack' ) ); ?>' );
								}
								$( '#jp-news-loading' ).remove();
							} );
							return false;
						} );
					} );
				} );
				</script>
			<?php endif; ?>

			<div id="jp-footer">
				<p class="automattic"><?php _e( 'An <span>Automattic</span> Airline', 'jetpack' ) ?></p>
				<p class="small">
					<a href="http://jetpack.me/" target="_blank">Jetpack <?php echo esc_html( JETPACK__VERSION ); ?></a> |
					<a href="http://automattic.com/privacy/" target="_blank"><?php _e( 'Privacy Policy', 'jetpack' ); ?></a> |
					<a href="http://wordpress.com/tos/" target="_blank"><?php _e( 'Terms of Service', 'jetpack' ); ?></a> |
<?php if ( current_user_can( 'manage_options' ) ) : ?>
					<a href="<?php echo Jetpack::admin_url( array(	'page' => 'jetpack-debugger' ) ); ?>"><?php _e( 'Debug', 'jetpack' ); ?></a> |
<?php endif; ?>
					<a href="http://jetpack.me/support/" target="_blank"><?php _e( 'Support', 'jetpack' ); ?></a>
				</p>
			</div>

			<div id="jetpack-configuration" style="display:none;">
				<p><img width="16" src="<?php echo esc_url( plugins_url( '_inc/images/wpspin_light-2x.gif', __FILE__ ) ); ?>" alt="Loading ..." /></p>
			</div>
		</div>
	<?php
	}
/*
	function admin_page_modules() {
		global $current_user;

		$role = $this->translate_current_user_to_role();
		$is_connected = Jetpack::is_active();
		$user_token = Jetpack_Data::get_access_token($current_user->ID);
		$is_user_connected = $user_token && !is_wp_error($user_token);
		$is_master_user = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
		$module = false;
	?>
		<div class="wrap" id="jetpack-settings">

			<h2 style="display: none"></h2> <!-- For WP JS message relocation -->

			<div id="jp-header"<?php if ( $is_connected ) : ?> class="small"<?php endif; ?>>
				<div id="jp-clouds">
					<?php if ( $is_connected ) : ?>
					<div id="jp-disconnectors">
						<?php if ( current_user_can( 'manage_options' ) ) : ?>
						<div id="jp-disconnect" class="jp-disconnect">
							<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=disconnect' ), 'jetpack-disconnect' ); ?>"><div class="deftext"><?php _e( 'Connected to WordPress.com', 'jetpack' ); ?></div><div class="hovertext"><?php _e( 'Disconnect from WordPress.com', 'jetpack' ) ?></div></a>
						</div>
						<?php endif; ?>
						<?php if ( $is_user_connected && !$is_master_user ) : ?>
						<div id="jp-unlink" class="jp-disconnect">
							<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=unlink' ), 'jetpack-unlink' ); ?>"><div class="deftext"><?php _e( 'User linked to WordPress.com', 'jetpack' ); ?></div><div class="hovertext"><?php _e( 'Unlink user from WordPress.com', 'jetpack' ) ?></div></a>
						</div>
						<?php endif; ?>
					</div>
					<?php endif; ?>
					<h3><?php _e( 'Jetpack by WordPress.com', 'jetpack' ) ?></h3>
					<?php if ( !$is_connected ) : ?>
					<div id="jp-notice">
						<p><?php _e( 'Jetpack supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.', 'jetpack' ); ?></p>
					</div>
					<?php endif; ?>
				</div>
			</div>

			<?php if ( isset( $_GET['jetpack-notice'] ) && 'dismiss' == $_GET['jetpack-notice'] ) : ?>
				<div id="message" class="error">
					<p><?php _e( 'Jetpack is network activated and notices can not be dismissed.', 'jetpack' ); ?></p>
				</div>
			<?php endif; ?>

			<?php do_action( 'jetpack_notices' ) ?>

			<?php
			// If the connection has not been made then show the marketing text.
			if ( ! Jetpack::is_development_mode() ) :
			?>
				<?php if ( ! $is_connected ) : ?>

				<div id="message" class="updated jetpack-message jp-connect">
					<div id="jp-dismiss" class="jetpack-close-button-container">
						<a class="jetpack-close-button" href="?page=jetpack&jetpack-notice=dismiss" title="<?php _e( 'Dismiss this notice.', 'jetpack' ); ?>"><?php _e( 'Dismiss this notice.', 'jetpack' ); ?></a>
					</div>
					<div class="jetpack-wrap-container">
						<div class="jetpack-text-container">
							<h4>
								<p><?php _e( "To enable all of the Jetpack features you&#8217;ll need to connect your website to WordPress.com using the button to the right. Once you&#8217;ve made the connection you&#8217;ll activate all the delightful features below.", 'jetpack' ) ?></p>
							</h4>
						</div>
						<div class="jetpack-install-container">
							<p class="submit"><a href="<?php echo $this->build_connect_url() ?>" class="button-connector" id="wpcom-connect"><?php _e( 'Connect to WordPress.com', 'jetpack' ); ?></a></p>
						</div>
					</div>
				</div>

				<?php elseif ( ! $is_user_connected ) : ?>

				<div id="message" class="updated jetpack-message jp-connect">
					<div class="jetpack-wrap-container">
						<div class="jetpack-text-container">
							<h4>
								<p><?php _e( "To enable all of the Jetpack features you&#8217;ll need to link your account here to your WordPress.com account using the button to the right.", 'jetpack' ) ?></p>
							</h4>
						</div>
						<div class="jetpack-install-container">
							<p class="submit"><a href="<?php echo $this->build_connect_url() ?>" class="button-connector" id="wpcom-connect"><?php _e( 'Link account with WordPress.com', 'jetpack' ); ?></a></p>
						</div>
					</div>
				</div>

				<?php else: // blog and user are connected ?>
					<?php // TODO: if not master user, show user disconnect button? ?>
				<?php endif; ?>
			<?php endif; // ! Jetpack::is_development_mode() ?>

			<?php
			if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) ) {
				$this->admin_screen_configure_module( $_GET['configure'] );
			} else {
				$this->admin_screen_list_modules();
			}
			?>

		</div>
	<?php
	}
/**/
	function debugger_page() {
		nocache_headers();
		if ( ! current_user_can( 'manage_options' ) ) {
			die( '-1' );
		}
		Jetpack_Debugger::jetpack_debug_display_handler();
		exit;
	}

	function admin_screen_configure_module( $module_id ) {
		if ( ! in_array( $module_id, Jetpack::get_active_modules() ) || ! current_user_can( 'manage_options' ) )
			return false; ?>

		<div id="jp-settings-screen" style="position: relative">
			<h3>
			<?php
				$module = Jetpack::get_module( $module_id );
				echo '<a href="' . menu_page_url( 'jetpack', false ) . '">' . __( 'Jetpack by WordPress.com', 'jetpack' ) . '</a> &rarr; ';
				printf( __( 'Configure %s', 'jetpack' ), $module['name'] );
			?>
			</h3>

			<?php do_action( 'jetpack_module_configuration_screen_' . $module_id ); ?>
		</div><?php
	}

	public static function sort_modules( $a, $b ) {
		if ( $a['sort'] == $b['sort'] )
			return 0;

		return ( $a['sort'] < $b['sort'] ) ? -1 : 1;
	}

	function admin_screen_list_modules() {
		require_once JETPACK__PLUGIN_DIR . 'modules/module-info.php';
		$jetpack_connected = true;
		if ( ! Jetpack::is_active() )
			$jetpack_connected = false;

		?>
		<div class="module-container">
		<?php

		$avail_raw = Jetpack::get_available_modules();
		$available = array();
		$active    = Jetpack::get_active_modules();
		$counter   = 0;

		foreach ( (array) $avail_raw as $module ) {
			if ( $plugin = Jetpack::get_module( $module ) ) {
				$plugin['module'] = $module;
				$available[] = $plugin;
			}
		}
		unset( $avail_raw );
		usort( $available, array( 'Jetpack', 'sort_modules' ) );
		$jetpack_version = Jetpack_Options::get_option( 'version' );
		if ( $jetpack_version ) {
			list( $jetpack_version, $jetpack_version_time ) = explode( ':', $jetpack_version );
		} else {
			$jetpack_version = 0;
			$jetpack_version_time = 0;
		}

		$jetpack_old_version = Jetpack_Options::get_option( 'old_version' );
		if ( $jetpack_old_version ) {
			list( $jetpack_old_version ) = explode( ':', $jetpack_old_version );
		} else {
			$jetpack_old_version = 0;
		}
		$now = time();

		foreach ( (array) $available as $module_data ) {
			$module    = $module_data['module'];
			$activated = in_array( $module, $active );
			if ( $activated ) {
				$css        = 'active';
				$toggle     = __( 'Deactivate', 'jetpack' );
				$toggle_url = wp_nonce_url(
					Jetpack::admin_url(
						array(
							'page'   => 'jetpack',
							'action' => 'deactivate',
							'module' => $module,
						)
					),
					"jetpack_deactivate-$module"
				);
			} else {
				$css        = 'inactive';
				$toggle     = __( 'Activate', 'jetpack' );
				$toggle_url = wp_nonce_url(
					Jetpack::admin_url(
						array(
							'page'   => 'jetpack',
							'action' => 'activate',
							'module' => $module,
						)
					),
					"jetpack_activate-$module"
				);
			}

			if ( $counter % 4 == 0 ) {
				$classes = $css . ' jetpack-newline';
				$counter = 0;
			} else {
				$classes = $css;
			}

			$free_text  = esc_html( $module_data['free'] ?  __( 'Free', 'jetpack' ) : __( 'Purchase', 'jetpack' ) );
			$free_text  = apply_filters( 'jetpack_module_free_text_' . $module, $free_text );
			$badge_text = $free_text;

			if ( ( ! $jetpack_connected && ! Jetpack::is_development_mode() ) ) {
				$classes = 'x disabled';
			} elseif ( $jetpack_version_time + 604800 > $now ) {	// 1 week
				if ( version_compare( $module_data['introduced'], $jetpack_old_version, '>' ) ) {
					$badge_text = esc_html__( 'New', 'jetpack' );
					$classes   .= ' jetpack-new-module';
				} elseif ( isset( $module_data['changed'] ) && version_compare( $module_data['changed'], $jetpack_old_version, '>' ) ) {
					$badge_text = esc_html__( 'Updated', 'jetpack' );
					$classes   .= ' jetpack-updated-module';
				} else {
					$badge_text = $free_text;
				}
			}

			?>
			<div class="jetpack-module jetpack-<?php echo $classes; ?>" id="<?php echo $module ?>">
				<h3><?php echo esc_html( $module_data['name'] ); ?></h3>
				<div class="jetpack-module-description">
						<div class="module-image">
							<p><span class="module-image-badge"><?php echo $badge_text; ?></span><span class="module-image-free" style="display: none"><?php echo $free_text; ?></span></p>
						</div>

						<p><?php echo apply_filters( 'jetpack_short_module_description', $module_data['description'], $module ); ?></p>
				</div>

				<div class="jetpack-module-actions">
				<?php if ( $jetpack_connected || ( Jetpack::is_development_mode() && ! $module_data['requires_connection'] ) ) : ?>
					<?php if ( ! $activated && current_user_can( 'manage_options' ) && apply_filters( 'jetpack_can_activate_' . $module, true ) ) : ?>
						<a href="<?php echo esc_url( $toggle_url ); ?>" class="<?php echo ( 'inactive' == $css ? ' button-primary' : ' button-secondary' ); ?>"><?php echo $toggle; ?></a>&nbsp;
					<?php endif; ?>

					<?php do_action( 'jetpack_learn_more_button_' . $module ) ?>

					<?php
					if ( current_user_can( 'manage_options' ) && apply_filters( 'jetpack_module_configurable_' . $module, false ) ) {
						echo '<a href="' . esc_url( Jetpack::module_configuration_url( $module ) ) . '" class="jetpack-configure-button button-secondary">' . __( 'Configure', 'jetpack' ) . '</a>';
					}
					?><?php if ( $activated && $module_data['deactivate'] && current_user_can( 'manage_options' ) ) : ?><a style="display: none;" href="<?php echo esc_url( $toggle_url ); ?>" class="jetpack-deactivate-button button-secondary"><?php echo $toggle; ?></a>&nbsp;<?php endif; ?>

				<?php else : ?>
					<?php do_action( 'jetpack_learn_more_button_' . $module ) ?>
				<?php endif; ?>
				</div>
			</div>
			<?php if ( 'inactive' == $css && $jetpack_connected && current_user_can( 'manage_options' ) && apply_filters( 'jetpack_can_activate_' . $module, true ) ) : ?>
			<script type="text/javascript">
			jQuery( '#<?php echo esc_js( $module ); ?>' ).bind( 'click', function(e){
				if ( ! jQuery(e.target).hasClass('more-info-link') )
					document.location.href = '<?php echo str_replace( '&amp;', '&', esc_js( esc_url( $toggle_url ) ) ); ?>';
			} );
			</script>
			<?php else : ?>
			<style>
				#<?php echo $module; ?> { cursor: default; }
			</style>
			<?php endif; ?>

			<div id="jp-more-info-<?php echo esc_attr( $module ); ?>" style="display:none;">
				<?php
				if ( $jetpack_connected && has_action( 'jetpack_module_more_info_connected_' . $module ) )
					do_action( 'jetpack_module_more_info_connected_' . $module );
				else
					do_action( 'jetpack_module_more_info_' . $module );
				?>
			</div>

			<?php
			$counter++;
		}

		// Add in some "Coming soon..." placeholders to fill up the current row and one more
		for ( $i = 0; $i < 4; $i++ ) { ?>
			<div class="jetpack-module placeholder"<?php if ( $i > 8 - $counter ) echo ' style="display: none;"'; ?>>
				<h3><?php _e( 'Coming soon&#8230;', 'jetpack' ) ?></h3>
			</div>
		<?php
		}

		echo '</div><!-- .module-container -->';
	}

	function check_news_subscription() {
		if ( ! $this->current_user_is_connection_owner() ) {
			exit;
		}

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client(
			array(
				'user_id' => JETPACK_MASTER_USER,
			)
		);
		$xml->query( 'jetpack.checkNewsSubscription' );
		if ( $xml->isError() ) {
			printf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() );
		} else {
			print_r( $xml->getResponse() );
		}
		exit;
	}

	function subscribe_to_news() {
		if ( ! $this->current_user_is_connection_owner() ) {
			exit;
		}

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client(
			array(
				'user_id' => JETPACK_MASTER_USER,
			)
		);
		$xml->query( 'jetpack.subscribeToNews' );
		if ( $xml->isError() ) {
			printf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() );
		} else {
			print_r( $xml->getResponse() );
		}
		exit;
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
				return self::force_url_to_non_ssl( $url );
			// default : case 'AUTO' :
		}

		// Yay! Your host is good!
		if ( self::permit_ssl() && wp_http_supports( array( 'ssl' => true ) ) ) {
			return $url;
		}

		// Boo! Your host is bad and makes Jetpack cry!
		return self::force_url_to_non_ssl( $url );
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

	/**
	 * Take any URL, and if it starts with https:// change it to http://
	 */
	public static function force_url_to_non_ssl( $url ) {
		return preg_replace( '#^https://#i', 'http://', $url );
	}

	/*
	 * Displays an admin_notice, alerting the user to their JETPACK_CLIENT__HTTPS constant being 'ALWAYS' but SSL isn't working.
	 */
	public function alert_required_ssl_fail() {
		if ( ! current_user_can( 'manage_options' ) )
			return;
		?>

		<div id="message" class="error jetpack-message jp-identity-crisis">
			<div class="jetpack-wrap-container">
				<div class="jetpack-text-container">
					<h3><?php _e( 'Something is being cranky!', 'jetpack' ); ?></h3>
					<p><?php _e( 'Your site is configured to only permit SSL connections to Jetpack, but SSL connections don\'t seem to be functional!', 'jetpack' ); ?></p>
				</div>
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

		Jetpack_Options::update_option( 'register', $secrets[0] . ':' . $secrets[1].
		':' . $secrets[2] );

		@list( $secret_1, $secret_2, $secret_eol ) = explode( ':', Jetpack_Options::get_option( 'register' ) );
		if ( empty( $secret_1 ) || empty( $secret_2 ) || empty( $secret_eol ) || $secret_eol < time() )
			return new Jetpack_Error( 'missing_secrets' );

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

		return true;
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
			if ( empty( $user_id ) || ! ctype_digit( $user_id ) || ! get_userdata( $user_id ) ) {
				return false;
			}
			$user_id = (int) $user_id;
		}

		$token = Jetpack_Data::get_access_token( $user_id );
		if ( ! $token ) {
			return false;
		}

		if ( 0 !== strpos( $token->secret, "$token_key." ) ) {
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
		} else if ( $signature !== $_GET['signature'] ) {
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
        $nonce       = esc_sql( $nonce );

		// Raw query so we can avoid races: add_option will also update
		$show_errors = $wpdb->show_errors( false );
		$return = $wpdb->query(
			$wpdb->prepare(
				"INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload`) VALUES (%s, %s, %s)",
				"jetpack_nonce_{$timestamp}_{$nonce}",
				time(),
				'no'
			)
		);
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

	function xmlrpc_options( $options ) {
		$options['jetpack_version'] = array(
				'desc'          => __( 'Jetpack Plugin Version', 'jetpack' ),
				'readonly'      => true,
				'value'         => JETPACK__VERSION,
		);

		$options['jetpack_client_id'] = array(
				'desc'          => __( 'The Client ID/WP.com Blog ID of this site', 'jetpack' ),
				'readonly'      => true,
				'value'         => Jetpack_Options::get_option( 'id' ),
		);
		return $options;
	}

	public static function clean_nonces( $all = false ) {
		global $wpdb;

		$sql = "DELETE FROM `$wpdb->options` WHERE `option_name` LIKE %s";
		$sql_args = array( like_escape( 'jetpack_nonce_' ) . '%' );

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
		$host = parse_url( $url, PHP_URL_HOST );
		if ( ! preg_match( '/.?(?:wordpress|wp)\.com$/', $host ) ) {
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

		return "$url?{$_SERVER['QUERY_STRING']}";
	}

	// Make sure the POSTed request is handled by the same action
	function preserve_action_in_login_form_for_json_api_authorization() {
		echo "<input type='hidden' name='action' value='jetpack_json_api_authorization' />\n";
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
		$signature = $jetpack_signature->sign_current_request( array( 'body' => null, 'method' => 'GET' ) );
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
	public static function get_cloud_site_options( $option_names ) {
		$option_names = array_filter( (array) $option_names, 'is_string' );

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array( 'user_id' => JETPACK_MASTER_USER, ) );
		$xml->query( 'jetpack.fetchSiteOptions', $option_names );
		if ( $xml->isError() ) {
			return array_flip( $option_names );
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
			$cloud_options = self::get_cloud_site_options( $options_to_check );
			$errors        = array();
			foreach ( $cloud_options as $cloud_key => $cloud_value ) {
				// If it's not the same as the local value...
				if ( $cloud_value !== get_option( $cloud_key ) ) {
					// And it's not been added to the whitelist...
					if ( ! self::is_identity_crisis_value_whitelisted( $cloud_key, $cloud_value ) ) {
						// Then kick an error!
						$errors[ $cloud_key ] = $cloud_value;
					}
				}
			}
		}
		return apply_filters( 'jetpack_has_identity_crisis', $errors, $force_recheck );
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
		if ( self::is_identity_crisis_url_whitelisted( $key, $value ) ) {
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
	 * Displays an admin_notice, alerting the user to an identity crisis.
	 */
	public function alert_identity_crisis() {
		if ( ! current_user_can( 'manage_options' ) )
			return;

		if ( ! $errors = self::check_identity_crisis() )
			return;
		?>

		<div id="message" class="updated jetpack-message jp-identity-crisis">
			<div class="jetpack-wrap-container">
				<div class="jetpack-text-container">
					<h3><?php _e( 'Something has gotten mixed up!', 'jetpack' ); ?></h3>
					<?php foreach ( $errors as $key => $value ) : ?>
						<p><?php printf( __( 'Your <code>%1$s</code> option is set up as <strong>%2$s</strong>, but your WordPress.com connection lists it as <strong>%3$s</strong>!', 'jetpack' ), $key, (string) get_option( $key ), $value ); ?></p>
					<?php endforeach; ?>
					<p><a href="<?php echo $this->build_reconnect_url() ?>"><?php _e( 'The data listed above is not for my current site. Please disconnect, and then form a new connection to WordPress.com for this site using my current settings.', 'jetpack' ); ?></a></p>
					<p><a href="#"><?php _e( 'Ignore the difference. This is just a staging site for the real site referenced above.', 'jetpack' ); ?></a></p>
					<p><a href="#"><?php _e( 'That used to be my URL for this site before I changed it. Update the WordPress.com Cloud\'s data to match my current settings.', 'jetpack' ); ?></a></p>
				</div>
			</div>
		</div>

		<?php
	}
}
