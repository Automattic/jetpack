<?php

/*
 * Plugin Name: Jetpack by WordPress.com
 * Plugin URI: http://wordpress.org/extend/plugins/jetpack/
 * Description: Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.
 * Author: Automattic
 * Version: 1.5
 * Author URI: http://jetpack.me
 * License: GPL2+
 * Text Domain: jetpack
 * Domain Path: /languages/
 */

defined( 'JETPACK__API_BASE' ) or define( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
define( 'JETPACK__API_VERSION', 1 );
define( 'JETPACK__MINIMUM_WP_VERSION', '3.2' );
defined( 'JETPACK_CLIENT__AUTH_LOCATION' ) or define( 'JETPACK_CLIENT__AUTH_LOCATION', 'header' );
defined( 'JETPACK_CLIENT__HTTPS' ) or define( 'JETPACK_CLIENT__HTTPS', 'AUTO' );
define( 'JETPACK__VERSION', '1.5' );
define( 'JETPACK__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
/*
Options:
jetpack_options (array)
	An array of options.
	@see Jetpack::get_option_names()

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

	var $HTTP_RAW_POST_DATA = null; // copy of $GLOBALS['HTTP_RAW_POST_DATA']

	var $plugins_to_deactivate = array(
		'stats' => array( 'stats/stats.php', 'WordPress.com Stats' ),
		'shortlinks' => array( 'stats/stats.php', 'WordPress.com Stats' ),
		'sharedaddy' => array( 'sharedaddy/sharedaddy.php', 'Sharedaddy' ),
		'twitter-widget' => array( 'wickett-twitter-widget/wickett-twitter-widget.php', 'Wickett Twitter Widget' ),
		'after-the-deadline' => array( 'after-the-deadline/after-the-deadline.php', 'After The Deadline' ),
		'contact-form' => array( 'grunion-contact-form/grunion-contact-form.php', 'Grunion Contact Form' ),
	);

	var $capability_translations = array(
		'administrator' => 'manage_options',
//		'editor' => 'edit_others_posts',
//		'author' => 'publish_posts',
//		'contributor' => 'edit_posts',
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
	 * Singleton
	 * @static
	 */
	function init() {
		static $instance = false;

		if ( !$instance ) {
			load_plugin_textdomain( 'jetpack', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
			$instance = new Jetpack;

			$instance->plugin_upgrade();
		}

		return $instance;
	}

	/**
	 * Must never be called statically
	 */
	function plugin_upgrade() {
		// Upgrade: 1.1 -> 1.2
		if ( get_option( 'jetpack_id' ) ) {
			// Move individual jetpack options to single array of options
			$options = array();
			foreach ( Jetpack::get_option_names() as $option ) {
				if ( false !== $value = get_option( "jetpack_$option" ) ) {
					$options[$option] = $value;
				}
			}

			if ( $options ) {
				Jetpack::update_options( $options );

				foreach ( array_keys( $options ) as $option ) {
					delete_option( "jetpack_$option" );
				}
			}

			// Add missing version and old_version options
			if ( !$version = Jetpack::get_option( 'version' ) ) {
				$version = $old_version = '1.1:' . time();
				Jetpack::update_options( compact( 'version', 'old_version' ) );
			}
		}

		// Future: switch on version? If so, think twice before updating version/old_version.
	}

	/**
	 * Constructor.  Initializes WordPress hooks
	 */
	function Jetpack() {
		$this->sync = new Jetpack_Sync;

		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST && isset( $_GET['for'] ) && 'jetpack' == $_GET['for'] ) {
			require_once dirname( __FILE__ ) . '/class.jetpack-xmlrpc-server.php';
			$this->xmlrpc_server = new Jetpack_XMLRPC_Server( $GLOBALS['wp_xmlrpc_server'] );

			// Don't let anyone authenticate
			remove_all_filters( 'authenticate' );

			if ( $this->is_active() ) {
				// Allow Jetpack authentication
				add_filter( 'authenticate', array( $this, 'authenticate_xml_rpc' ), 10, 3 );

				// Hack to preserve $HTTP_RAW_POST_DATA
				add_filter( 'xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );

				// The actual API methods.
				add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'xmlrpc_methods' ) );
			} else {
				// The bootstrap API methods.
				add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'bootstrap_xmlrpc_methods' ) );
			}

			// Now that no one can authenticate, and we're whitelisting all XML-RPC methods, force enable_xmlrpc on.
			add_filter( 'pre_option_enable_xmlrpc', '__return_true' );
		}

		add_action( 'jetpack_clean_nonces', array( $this, 'clean_nonces' ) );

		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_init', array( $this, 'dismiss_jetpack_notice' ) );

		add_action( 'wp_ajax_jetpack-check-news-subscription', array( $this, 'check_news_subscription' ) );
		add_action( 'wp_ajax_jetpack-subscribe-to-news', array( $this, 'subscribe_to_news' ) );
	}

	/**
	 * Is Jetpack active?
	 */
	function is_active() {
		return (bool) Jetpack_Data::get_access_token( 1 ); // 1 just means user token
	}

	function current_user_is_connection_owner() {
		$user_token = Jetpack_Data::get_access_token( 1 );
		return $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) && get_current_user_id() === $user_token->external_user_id;
	}

	/**
	 * Loads the currently active modules.
	 */
	function load_modules() {
		if ( !Jetpack::is_active() ) {
			return;
		}

		$version = Jetpack::get_option( 'version' );
		if ( !$version ) {
			$version = $old_version = JETPACK__VERSION . ':' . time();
			Jetpack::update_options( compact( 'version', 'old_version' ) );
		}
		list( $version ) = explode( ':', $version );

		$modules = array_filter( Jetpack::get_active_modules(), array( 'Jetpack', 'is_module' ) );

		// Don't load modules that have had "Major" changes since the stored version until they have been deactivated/reactivated through the lint check.
		if ( version_compare( $version, JETPACK__VERSION, '<' ) ) {
			$updated_modules = array();
			foreach ( $modules as $module ) {
				$module_data = Jetpack::get_module( $module );
				if ( !isset( $module_data['changed'] ) ) {
					continue;
				}

				if ( version_compare( $module_data['changed'], $version, '<=' ) ) {
					continue;
				}

				$updated_modules[] = $module;
			}

			$modules = array_diff( $modules, $updated_modules );
		}

		foreach ( $modules as $module ) {
			if ( did_action( 'jetpack_module_loaded_' . $module ) ) {
				continue;
			}
			require Jetpack::get_module_path( $module );
			do_action( 'jetpack_module_loaded_' . $module );
		}

		do_action( 'jetpack_modules_loaded' );
	}

/* Jetpack Options API */

	function get_option_names( $type = 'compact' ) {
		switch ( $type ) {
		case 'non-compact' :
		case 'non_compact' :
			return array(
				'register',
				'activated',
				'active_modules',
				'do_activate',
			);
		}

		return array(
			'id',                           // (int)    The Client ID/WP.com Blog ID of this site.
			'blog_token',                   // (string) The Client Secret/Blog Token of this site.
			'user_token',                   // (string) The User Token of this site.
			'version',                      // (string) Used during upgrade procedure to auto-activate new modules. version:time
			'old_version',                  // (string) Used to determine which modules are the most recently added. previous_version:time
			'fallback_no_verify_ssl_certs', // (int)    Flag for determining if this host must skip SSL Certificate verification due to misconfigured SSL.
			'time_diff',                    // (int)    Offset between Jetpack server's clocks and this server's clocks. Jetpack Server Time = time() + (int) Jetpack::get_option( 'time_diff' )
		);
	}

	/**
	 * Returns the requested option.  Looks in jetpack_options or jetpack_$name as appropriate.
 	 *
	 * @param string $name    Option name
	 * @param mixed  $default (optional)
	 */
	function get_option( $name, $default = false ) {
		if ( in_array( $name, Jetpack::get_option_names( 'non_compact' ) ) ) {
			return get_option( "jetpack_$name" );
		} else if ( !in_array( $name, Jetpack::get_option_names() ) ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $name ), E_USER_WARNING );
			return false;
		}

		$options = get_option( 'jetpack_options' );
		if ( is_array( $options ) && isset( $options[$name] ) ) {
			return $options[$name];
		}

		return $default;
	}

	/**
	 * Get a post and associated data in the standard JP format.
	 * Cannot be called statically
	 *
	 * @param int $id Post ID
	 * @param bool|array $columns Columns/fields to get.
	 * @return Array containing full post details
	 */
	function get_post( $id, $columns = true ) {
		$post_obj = get_post( $id );
		if ( !$post_obj )
			return false;
		$post = get_object_vars( $post_obj );

		// Only send specific columns if requested
		if ( is_array( $columns ) ) {
			$keys = array_keys( $post );
			foreach ( $keys as $column ) {
				if ( !in_array( $column, $columns ) ) {
					unset( $post[$column] );
				}
			}
			if ( in_array( '_jetpack_backfill', $columns ) ) {
				$post['_jetpack_backfill'] = true;
			}
		}

		if ( true === $columns || in_array( 'tax', $columns ) ) {
			$tax = array();
			$taxonomies = get_object_taxonomies( $post_obj );
			foreach ( $taxonomies as $taxonomy ) {
				$t = get_taxonomy( $taxonomy );
				$terms = get_object_term_cache( $post_obj->ID, $taxonomy );
				if ( empty( $terms ) )
					$terms = wp_get_object_terms( $post_obj->ID, $taxonomy );
				$term_names = array();
				foreach ( $terms as $term ) {
					$term_names[] = $term->name;
				}
				$tax[$taxonomy] = $term_names;
			}
			$post['tax'] = $tax;
		}

		// Include all postmeta for requests that specifically ask for it, or ask for everything
		if ( true == $columns || in_array( 'meta', $columns ) ) {
			$meta = get_post_meta( $post_obj->ID, false );
			$post['meta'] = array();
			foreach ( $meta as $key => $value ) {
				$post['meta'][$key] = array_map( 'maybe_unserialize', $value );
			}
		}

		$post['extra'] = array(
			'author' => get_the_author_meta( 'display_name', $post_obj->post_author ),
			'author_email' => get_the_author_meta( 'email', $post_obj->post_author ),
		);

		$post['permalink'] = get_permalink( $post_obj->ID );
		return $post;
	}

	/**
	 * Decide whether a post/page/attachment is visible to the public.
	 *
	 * @param array $post
	 * @return bool
	 */
	function is_post_public( $post ) {
		if ( ! is_array( $post ) )
			return false;
		if ( ! empty( $post['post_password'] ) )
			return false;
		if ( ! in_array( $post['post_type'], get_post_types( array( 'public' => true ) ) ) )
			return false;
		$post_status = get_post_status( $post['ID'] ); // Inherited status is resolved here.
		if ( ! in_array( $post_status, get_post_stati( array( 'public' => true ) ) ) )
			return false;
		return true;
	}

	/**
	 * Get a comment and associated data in the standard JP format.
	 * Cannot be called statically
	 *
	 * @param int $id Comment ID
	 * @param array $columns Columns/fields to get.
	 * @return Array containing full comment details
	 */
	function get_comment( $id, $columns = true ) {
		$comment_obj = get_comment( $id );
		if ( !$comment_obj )
			return false;
		$comment = get_object_vars( $comment_obj );

		// Only send specific columns if requested
		if ( is_array( $columns ) ) {
			$keys = array_keys( $comment );
			foreach ( $keys as $column ) {
				if ( !in_array( $column, $columns ) ) {
					unset( $comment[$column] );
				}
			}
		}

		// Include all commentmeta for requests that specifically ask for it, or ask for everything
		if ( isset( $columns['meta'] ) || true == $columns ) {
			$meta = get_comment_meta( $id, false );
			$comment['meta'] = array();
			foreach ( $meta as $key => $value ) {
				$comment['meta'][$key] = array_map( 'maybe_unserialize', $value );
			}
		}

		return $comment;
	}

	function get_taxonomy( $id, $columns = true, $type ) {
		$taxonomy_obj = get_term_by( 'slug', $id, $type );

		if ( !$taxonomy_obj )
			return false;
		$taxonomy = get_object_vars( $taxonomy_obj );

		// Only send specific columns if requested
		if ( is_array( $columns ) ) {
			$keys = array_keys( $taxonomy );
			foreach ( $keys as $column ) {
				if ( !in_array( $column, $columns ) ) {
					unset( $taxonomy[$column] );
				}
			}
		}

		$taxonomy['type'] = $type;
		return $taxonomy;
	}

	/**
	 * Updates the single given option.  Updates jetpack_options or jetpack_$name as appropriate.
 	 *
	 * @param string $name  Option name
	 * @param mixed  $value Option value
	 */
	function update_option( $name, $value ) {
		if ( in_array( $name, Jetpack::get_option_names( 'non_compact' ) ) ) {
			return update_option( "jetpack_$name", $value );
		} else if ( !in_array( $name, Jetpack::get_option_names() ) ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $name ), E_USER_WARNING );
			return false;
		}

		$options = get_option( 'jetpack_options' );
		if ( !is_array( $options ) ) {
			$options = array();
		}

		$options[$name] = $value;

		return update_option( 'jetpack_options', $options );
	}

	/**
	 * Updates the multiple given options.  Updates jetpack_options and/or jetpack_$name as appropriate.
 	 *
	 * @param array $array array( option name => option value, ... )
	 */
	function update_options( $array ) {
		$names = array_keys( $array );

		foreach ( array_diff( $names, Jetpack::get_option_names(), Jetpack::get_option_names( 'non_compact' ) ) as $unknown_name ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $unknown_name ), E_USER_WARNING );
			unset( $array[$unknown_name] );
		}

		foreach ( array_intersect( $names, Jetpack::get_option_names( 'non_compact' ) ) as $name ) {
			update_option( "jetpack_$name", $array[$name] );
			unset( $array[$name] );
		}

		$options = get_option( 'jetpack_options' );
		if ( !is_array( $options ) ) {
			$options = array();
		}

		return update_option( 'jetpack_options', array_merge( $options, $array ) );
	}

	/**
	 * Deletes the given option.  May be passed multiple option names as an array.
	 * Updates jetpack_options and/or deletes jetpack_$name as appropriate.
 	 *
	 * @param string|array $names
	 */
	function delete_option( $names ) {
		$names = (array) $names;

		foreach ( array_diff( $names, Jetpack::get_option_names(), Jetpack::get_option_names( 'non_compact' ) ) as $unknown_name ) {
			trigger_error( sprintf( 'Invalid Jetpack option name: %s', $unknown_name ), E_USER_WARNING );
		}

		foreach ( array_intersect( $names, Jetpack::get_option_names( 'non_compact' ) ) as $name ) {
			delete_option( "jetpack_$name" );
		}

		$options = get_option( 'jetpack_options' );
		if ( !is_array( $options ) ) {
			$options = array();
		}

		$to_delete = array_intersect( $names, Jetpack::get_option_names(), array_keys( $options ) );
		if ( $to_delete ) {
			foreach ( $to_delete as $name ) {
				unset( $options[$name] );
			}

			return update_option( 'jetpack_options', $options );;
		}

		return true;
	}

	/**
	 * Returns an array of all PHP files in the specified absolute path.
	 * Equivalent to glob( "$absolute_path/*.php" ).
	 *
	 * @param string $absolute_path The absolute path of the directory to search.
	 * @return array Array of absolute paths to the PHP files.
	 */
	function glob_php( $absolute_path ) {
		$absolute_path = untrailingslashit( $absolute_path );
		$files = array();
		if ( !$dir = @opendir( $absolute_path ) ) {
			return $files;
		}

		while ( false !== $file = readdir( $dir ) ) {
			if ( '.' == substr( $file, 0, 1 ) || '.php' != substr( $file, -4 ) ) {
				continue;
			}

			$file = "$absolute_path/$file";

			if ( !is_file( $file ) ) {
				continue;
			}

			$files[] = $file;
		}

		closedir( $dir );

		return $files;
	}

	function activate_new_modules() {
		if ( !$this->is_active() ) {
			return;
		}

		$jetpack_old_version = Jetpack::get_option( 'version' ); // [sic]
		if ( !$jetpack_old_version ) {
			$jetpack_old_version = $version = $old_version = '1.1:' . time();
			Jetpack::update_options( compact( 'version', 'old_version' ) );
		}

		list( $jetpack_version ) = explode( ':', $jetpack_old_version ); // [sic]

		if ( version_compare( JETPACK__VERSION, $jetpack_version, '<=' ) ) {
			return;
		}

		$active_modules = Jetpack::get_active_modules();
		$reactivate_modules = array();
		foreach ( $active_modules as $active_module ) {
			$module = Jetpack::get_module( $active_module );
			if ( !isset( $module['changed'] ) ) {
				continue;
			}

			if ( version_compare( $module['changed'], $jetpack_version, '<=' ) ) {
				continue;
			}

			$reactivate_modules[] = $active_module;
			Jetpack::deactivate_module( $active_module );
		}

		Jetpack::update_options( array(
			'version'     => JETPACK__VERSION . ':' . time(),
			'old_version' => $jetpack_old_version,
		) );

		Jetpack::state( 'message', 'modules_activated' );
		Jetpack::activate_default_modules( $jetpack_version, JETPACK__VERSION, $reactivate_modules );
		wp_safe_redirect( Jetpack::admin_url() );
		exit;
	}

	/**
	 * List available Jetpack modules. Simply lists .php files in /modules/.
	 * Make sure to tuck away module "library" files in a sub-directory.
	 */
	function get_available_modules( $min_version = false, $max_version = false ) {
		static $modules = null;

		if ( !isset( $modules ) ) {
			$files = Jetpack::glob_php( dirname( __FILE__ ) . '/modules' );

			$modules = array();

			foreach ( $files as $file ) {
				if ( !$headers = Jetpack::get_module( $file ) ) {
					continue;
				}

				$modules[ Jetpack::get_module_slug( $file ) ] = $headers['introduced'];
			}
		}

		if ( !$min_version && !$max_version ) {
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
	function get_default_modules( $min_version = false, $max_version = false ) {
		$return = array();

		foreach ( Jetpack::get_available_modules( $min_version, $max_version ) as $module ) {
			// Add special cases here for modules to avoid auto-activation
			switch ( $module ) {
			case 'comments' :
				continue;
			default :
				$return[] = $module;
			}
		}

		return $return;
	}

	/**
	 * Extract a module's slug from its full path.
	 */
	function get_module_slug( $file ) {
		return str_replace( '.php', '', basename( $file ) );
	}

	/**
	 * Generate a module's path from its slug.
	 */
	function get_module_path( $slug ) {
		return dirname( __FILE__ ) . "/modules/$slug.php";
	}

	/**
	 * Load module data from module file. Headers differ from WordPress
	 * plugin headers to avoid them being identified as standalone
	 * plugins on the WordPress plugins page.
	 */
	function get_module( $module ) {
		$headers = array(
			'name'        => 'Module Name',
			'description' => 'Module Description',
			'sort'        => 'Sort Order',
			'introduced'  => 'First Introduced',
			'changed'     => 'Major Changes In',
			'deactivate'  => 'Deactivate',
			'free'        => 'Free',
		);

		$file = Jetpack::get_module_path( Jetpack::get_module_slug( $module ) );
		if ( !file_exists( $file ) )
			return false;

		$mod = get_file_data( $file, $headers );
		if ( empty( $mod['name'] ) )
			return false;

		$mod['name'] = translate( $mod['name'], 'jetpack' );
		$mod['description'] = translate( $mod['description'], 'jetpack' );
		if ( empty( $mod['sort'] ) )
			$mod['sort'] = 10;
		$mod['deactivate'] = empty( $mod['deactivate'] );
		$mod['free'] = empty( $mod['free'] );
		return $mod;
	}

	/**
	 * Get a list of activated modules as an array of module slugs.
	 */
	function get_active_modules() {
		$active = Jetpack::get_option( 'active_modules' );
		if ( !is_array( $active ) )
			$active = array();
		if ( is_admin() ) {
			$active[] = 'vaultpress';
		} else {
			$active = array_diff( $active, array( 'vaultpress' ) );
		}
		return array_unique( $active );
	}

	function is_module( $module ) {
		return !empty( $module ) && !validate_file( $module, Jetpack::get_available_modules() );
	}

	/**
	 * Catches PHP errors.  Must be used in conjunction with output buffering.
	 *
	 * @param bool $catch True to start catching, False to stop.
	 *
	 * @static
	 */
	function catch_errors( $catch ) {
		static $display_errors, $error_reporting;

		if ( $catch ) {
			$display_errors = @ini_set( 'display_errors', 1 );
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
	function catch_errors_on_shutdown() {
		Jetpack::state( 'php_errors', ob_get_clean() );
	}

	function activate_default_modules( $min_version = false, $max_version = false, $other_modules = array() ) {
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

			$url = add_query_arg( array(
				'action' => 'activate_default_modules',
				'_wpnonce' => wp_create_nonce( 'activate_default_modules' ),
			), add_query_arg( compact( 'min_version', 'max_version', 'other_modules' ), Jetpack::admin_url() ) );
			wp_safe_redirect( $url );
			exit;
		}

		// Check each module for fatal errors, a la wp-admin/plugins.php::activate before activating
		$redirect = menu_page_url( 'jetpack', false );
		Jetpack::restate();
		Jetpack::catch_errors( true );
		foreach ( $modules as $module ) {
			$active = Jetpack::get_active_modules();
			if ( in_array( $module, $active ) ) {
				$module_info = Jetpack::get_module( $module );
				if ( !$module_info['deactivate'] ) {
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
			if ( !file_exists( $file ) ) {
				continue;
			}

			// we'll override this later if the plugin can be included without fatal error
			wp_safe_redirect( Jetpack::admin_url() );
			Jetpack::state( 'error', 'module_activation_failed' );
			Jetpack::state( 'module', $module );
			ob_start();
			require $file;
			$active[] = $module;
			$state = in_array( $module, $other_modules ) ? 'reactivated_modules' : 'activated_modules';
			if ( $active_state = Jetpack::state( $state ) ) {
				$active_state = explode( ',', $active_state );
			} else {
				$active_state = array();
			}
			$active_state[] = $module;
			Jetpack::state( $state, implode( ',', $active_state ) );
			Jetpack::update_option( 'active_modules', array_unique( $active ) );
			ob_end_clean();
		}
		Jetpack::state( 'error', false );
		Jetpack::state( 'module', false );
		Jetpack::catch_errors( false );
	}

	function activate_module( $module ) {
		$jetpack = Jetpack::init();

		if ( !Jetpack::is_active() )
			return false;

		if ( !strlen( $module ) )
			return false;

		if ( !Jetpack::is_module( $module ) )
			return false;

		// If it's already active, then don't do it again
		$active = Jetpack::get_active_modules();
		foreach ( $active as $act ) {
			if ( $act == $module )
				return true;
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
		wp_safe_redirect( Jetpack::admin_url() );

		Jetpack::catch_errors( true );
		ob_start();
		require Jetpack::get_module_path( $module );
		do_action( "jetpack_activate_module_$module" );
		$active[] = $module;
		Jetpack::update_option( 'active_modules', array_unique( $active ) );
		Jetpack::state( 'error', false ); // the override
		Jetpack::state( 'message', 'module_activated' );
		Jetpack::state( 'module', $module );
		ob_end_clean();
		Jetpack::catch_errors( false );
		exit;
	}

	function deactivate_module( $module ) {
		$active = Jetpack::get_active_modules();
		$new = array();
		foreach ( $active as $check ) {
			if ( !empty( $check ) && $module != $check )
				$new[] = $check;
		}

		do_action( "jetpack_deactivate_module_$module" );
		return Jetpack::update_option( 'active_modules', array_unique( $new ) );
	}

	function enable_module_configurable( $module ) {
		$module = Jetpack::get_module_slug( $module );
		add_filter( 'jetpack_module_configurable_' . $module, '__return_true' );
	}

	function module_configuration_url( $module ) {
		$module = Jetpack::get_module_slug( $module );
		return Jetpack::admin_url( array( 'configure' => $module ) );
	}

	function module_configuration_load( $module, $method ) {
		$module = Jetpack::get_module_slug( $module );
		add_action( 'jetpack_module_configuration_load_' . $module, $method );
	}

	function module_configuration_head( $module, $method ) {
		$module = Jetpack::get_module_slug( $module );
		add_action( 'jetpack_module_configuration_head_' . $module, $method );
	}

	function module_configuration_screen( $module, $method ) {
		$module = Jetpack::get_module_slug( $module );
		add_action( 'jetpack_module_configuration_screen_' . $module, $method );
	}

/* Installation */

	function bail_on_activation( $message, $deactivate = true ) {
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
			$jetpack = plugin_basename( __FILE__ );
			$update = false;
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
	function plugin_activation( $network_wide ) {
		Jetpack::update_option( 'activated', 1 );

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
	function plugin_initialize() {
		if ( !Jetpack::get_option( 'activated' ) ) {
			Jetpack::update_option( 'activated', 2 );
		}

		if ( !Jetpack::get_option( 'version' ) ) {
			$version = $old_version = JETPACK__VERSION . ':' . time();
			Jetpack::update_options( compact( 'version', 'old_version' ) );
		}

		Jetpack::load_modules();

		Jetpack::delete_option( 'do_activate' );
	}

	/**
	 * Removes all connection options
	 * @static
	 */
	function plugin_deactivation( $network_wide ) {
		Jetpack::disconnect( false );
	}

	/**
	 * Disconnects from the Jetpack servers.
	 * Forgets all connection details and tells the Jetpack servers to do the same.
	 * @static
	 */
	function disconnect( $update_activated_state = true ) {
		wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
		Jetpack::clean_nonces( true );

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.deregister' );

		Jetpack::delete_option( array(
			'register',
			'blog_token',
			'user_token',
			'time_diff',
			'fallback_no_verify_ssl_certs',
		) );

		if ( $update_activated_state ) {
			Jetpack::update_option( 'activated', 4 );
		}
	}

	/**
	 * Attempts Jetpack registration.  If it fail, a state flag is set: @see ::admin_page_load()
	 * @static
	 */
	function try_registration() {
		$result = Jetpack::register();

		// If there was an error with registration and the site was not registered, record this so we can show a message.
		if ( !$result || is_wp_error( $result ) ) {
			return $result;
		} else {
			return true;
		}
	}

/* Admin Pages */

	function admin_init() {
		// If the plugin is not connected, display a connect message.
		if (
			// the plugin was auto-activated and needs its candy
			Jetpack::get_option( 'do_activate' )
		||
			// the plugin is active, but was never activated.  Probably came from a site-wide network activation
			!Jetpack::get_option( 'activated' )
		) {
			Jetpack::plugin_initialize();
		}

		$is_active = Jetpack::is_active();

		if ( !$is_active ) {
			if ( 4 != Jetpack::get_option( 'activated' ) ) {
				// Show connect notice on dashboard and plugins pages
				add_action( 'load-index.php', array( $this, 'prepare_connect_notice' ) );
				add_action( 'load-plugins.php', array( $this, 'prepare_connect_notice' ) );
			}
		} elseif ( false === Jetpack::get_option( 'fallback_no_verify_ssl_certs' ) ) {
			// Upgrade: 1.1 -> 1.1.1
			// Check and see if host can verify the Jetpack servers' SSL certificate
			$args = array();
			Jetpack_Client::_wp_remote_request(
				Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'test' ), $args ),
				$args,
				true
			);
		}

		add_action( 'load-plugins.php', array( $this, 'intercept_plugin_error_scrape_init' ) );
		add_action( 'admin_head', array( $this, 'admin_menu_css' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( $this, 'plugin_action_links' ) );

		add_action( 'wp_ajax_jetpack_debug', array( $this, 'ajax_debug' ) );

		if ( $is_active ) {
			// Artificially throw errors in certain whitelisted cases during plugin activation
			add_action( 'activate_plugin', array( $this, 'throw_error_on_activate_plugin' ) );
		}
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
			if ( !class_exists( 'ReflectionFunction' ) ) {
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
		if ( !$result ) {
			return;
		}

		foreach ( $this->plugins_to_deactivate as $module => $deactivate_me ) {
			if ( "plugin-activation-error_{$deactivate_me[0]}" == $action ) {
				$this->bail_on_activation( sprintf( __( 'Jetpack contains the most recent version of the old &#8220;%1$s&#8221; plugin.', 'jetpack' ), $deactivate_me[1] ), false );
			}
		}
	}

	function admin_menu() {
		list( $jetpack_version ) = explode( ':', Jetpack::get_option( 'version' ) );
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
			$this->is_active()
		) {
			$new_modules_count_i18n = number_format_i18n( $new_modules_count );
			$span_title = esc_attr( sprintf( _n( 'One New Jetpack Module', '%s New Jetpack Modules', $new_modules_count, 'jetpack' ), $new_modules_count_i18n ) );
			$title = sprintf( 'Jetpack %s', "<span class='update-plugins count-{$new_modules_count}' title='$span_title'><span class='update-count'>$new_modules_count_i18n</span></span>" );
		} else {
			$title = __( 'Jetpack', 'jetpack' );
		}

		$hook = add_menu_page( 'Jetpack', $title, 'manage_options', 'jetpack', array( $this, 'admin_page' ), '' );

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

		do_action( 'jetpack_admin_menu' );
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
		$current_screen->add_help_tab( array(
			'id'		=> 'overview',
			'title'		=> __( 'Overview', 'jetpack' ),
			'content'	=>
				'<p><strong>' . __( 'Jetpack by WordPress.com', 'jetpack' ) . '</strong></p>' .
				'<p>' . __( 'Jetpack supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.', 'jetpack' ) . '</p>' .
				'<p>' . __( 'On this page, you are able to view the modules available within Jetpack, learn more about them, and activate or deactivate them as needed.', 'jetpack' ) . '</p>'
		) );

		// Screen Content
		$current_screen->add_help_tab( array(
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
				'</ol>'
		) );

		// Help Sidebar
		$current_screen->set_help_sidebar(
			'<p><strong>' . __( 'For more information:', 'jetpack' ) . '</strong></p>' .
			'<p><a href="http://jetpack.me/faq/" target="_blank">'     . __( 'Jetpack FAQ',     'jetpack' ) . '</a></p>' .
			'<p><a href="http://jetpack.me/support/" target="_blank">' . __( 'Jetpack Support', 'jetpack' ) . '</a></p>'
		);
	}

	function admin_menu_css() { ?>
		<style type="text/css" id="jetpack-menu-css">
			#toplevel_page_jetpack .wp-menu-image img { visibility: hidden; }
			#toplevel_page_jetpack .wp-menu-image { background: url( <?php echo plugins_url( basename( dirname( __FILE__ ) ) . '/_inc/images/jp-icon.png' ) ?> ) 0 90% no-repeat; }
			#toplevel_page_jetpack.current .wp-menu-image, #toplevel_page_jetpack.wp-has-current-submenu .wp-menu-image, #toplevel_page_jetpack:hover .wp-menu-image { background-position: top left; }
		</style><?php
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
		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) )
			do_action( 'jetpack_module_configuration_head_' . $_GET['configure'] );
	}

	function admin_styles() {
		global $wp_styles;
		wp_enqueue_style( 'jetpack', plugins_url( basename( dirname( __FILE__ ) ) . '/_inc/jetpack.css' ), false, JETPACK__VERSION . '-20111115' );
		$wp_styles->add_data( 'jetpack', 'rtl', true );
	}

	function admin_scripts() {
		wp_enqueue_script( 'jetpack-js', plugins_url( basename( dirname( __FILE__ ) ) ) . '/_inc/jetpack.js', array( 'jquery' ), JETPACK__VERSION . '-20111115' );
		wp_localize_script( 'jetpack-js', 'jetpackL10n', array(
				'ays_disconnect' => "This will deactivate all Jetpack modules.\nAre you sure you want to disconnect?",
				'ays_dismiss'    => "This will deactivate Jetpack.\nAre you sure you want to deactivate Jetpack?",
			) );
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

		if ( !current_user_can( 'manage_options' ) )
			return;
		?>

		<div id="message" class="updated jetpack-message jp-connect">
			<div id="jp-dismiss" class="jetpack-close-button-container">
				<a class="jetpack-close-button" href="?page=jetpack&jetpack-notice=dismiss" title="<?php _e( 'Dismiss this notice and deactivate Jetpack.', 'jetpack' ); ?>"><?php _e( 'Dismiss this notice and deactivate Jetpack.', 'jetpack' ); ?></a>
			</div>
			<div class="jetpack-wrap-container">
				<div class="jetpack-text-container">
					<h4>
						<?php if ( 1 == Jetpack::get_option( 'activated' ) ) : ?>
							<p><?php _e( '<strong>Your Jetpack is almost ready</strong> &#8211; A connection to WordPress.com is needed to enabled features like Comments, Stats, Contact Forms, and Subscriptions. Connect now to get fueled up!', 'jetpack' ); ?></p>
						<?php else : ?>
							<p><?php _e( '<strong>Jetpack is installed</strong> and ready to bring awesome, WordPress.com cloud-powered features to your site.', 'jetpack' ) ?></p>
						<?php endif; ?>
					</h4>
				</div>
				<div class="jetpack-install-container">
					<?php if ( 1 == Jetpack::get_option( 'activated' ) ) : ?>
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
	
	function jetpack_comment_notice() {
		if ( in_array( 'comments', Jetpack::get_active_modules() ) ) {
			return '';
		}

		$jetpack_old_version = explode( ':', Jetpack::get_option( 'old_version' ) );
		$jetpack_new_version = explode( ':', Jetpack::get_option( 'version' ) );

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
				Jetpack::admin_url( array(
					'action' => 'activate',
					'module' => 'comments',
				) ),
				"jetpack_activate-comments"
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
	 *       jetpack_id, jetpack_secret
	 *     - ::register() then stores jetpack_options: id => jetpack_id, blog_token => jetpack_secret
	 * 4 - redirect to https://jetpack.wordpress.com/jetpack.authorize/1/
	 * 5 - user logs in with WP.com account
	 * 6 - redirect to this site's wp-admin/index.php?page=jetpack&action=authorize with
	 *     code <-- OAuth2 style authorization code    
	 * 7 - ::admin_page_load() action=authorize
	 * 8 - Jetpack_Client_Server::authorize()
	 * 9 - Jetpack_Client_Server::get_token()
	 * 10- GET https://jetpack.wordpress.com/jetpack.token/1/ with
	 *     client_id, client_secret, grant_type, code, redirect_uri:action=authorize, state, scope, user_email
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

		if ( !empty( $_GET['jetpack_restate'] ) ) {
			// Should only be used in intermediate redirects to preserve state across redirects
			Jetpack::restate();
		}

		if ( isset( $_GET['action'] ) ) {
			switch ( $_GET['action'] ) {
			case 'authorize' :
				if ( Jetpack::is_active() ) {
					Jetpack::state( 'message', 'already_authorized' );
					wp_safe_redirect( Jetpack::admin_url() );
					exit;
				}
				$client_server = new Jetpack_Client_Server;
				$client_server->authorize();
				exit;
			case 'register' :
				check_admin_referer( 'jetpack-register' );
				$registered = Jetpack::try_registration();
				if ( is_wp_error( $registered ) ) {
					$error = $registered->get_error_code();
					Jetpack::state( 'error_description', $registered->get_error_message() );
					break;
				}

				wp_redirect( $this->build_connect_url( true ) );
				exit;
			case 'activate' :
				$module = stripslashes( $_GET['module'] );
				check_admin_referer( "jetpack_activate-$module" );
				Jetpack::activate_module( $module );
				wp_safe_redirect( Jetpack::admin_url() );
				exit;
			case 'activate_default_modules' :
				check_admin_referer( 'activate_default_modules' );
				Jetpack::restate();
				$min_version = isset( $_GET['min_version'] ) ? $_GET['min_version'] : false;
				$max_version = isset( $_GET['max_version'] ) ? $_GET['max_version'] : false;
				$other_modules = isset( $_GET['other_modules'] ) && is_array( $_GET['other_modules'] ) ? $_GET['other_modules'] : array();
				Jetpack::activate_default_modules( $min_version, $max_version, $other_modules );
				wp_safe_redirect( Jetpack::admin_url() );
				exit;
			case 'disconnect' :
				check_admin_referer( 'jetpack-disconnect' );
				$this->disconnect();
				wp_safe_redirect( Jetpack::admin_url() );
				exit;
			case 'deactivate' :
				$module = stripslashes( $_GET['module'] );
				check_admin_referer( "jetpack_deactivate-$module" );
				Jetpack::deactivate_module( $module );
				Jetpack::state( 'message', 'module_deactivated' );
				Jetpack::state( 'module', $module );
				wp_safe_redirect( Jetpack::admin_url() );
				exit;
			}
		}

		if ( !$error = $error ? $error : Jetpack::state( 'error' ) ) {
			Jetpack::activate_new_modules();
		}

		switch ( $error ) {
		case 'access_denied' :
			$this->error = __( 'You need to authorize the Jetpack connection between your site and WordPress.com to enable the awesome features.', 'jetpack' );
			break;
		case 'wrong_state' :
			$this->error =  __( "Don&#8217;t cross the streams!  You need to stay logged in to your WordPress blog while you authorize Jetpack.", 'jetpack' );
			break;
		case 'invalid_client' :
			// @todo re-register instead of deactivate/reactivate
			$this->error = __( 'Return to sender.  Whoops! It looks like you got the wrong Jetpack in the mail; deactivate then reactivate the Jetpack plugin to get a new one.', 'jetpack' );
			break;
		case 'invalid_grant' :
			$this->error = __( "Wrong size.  Hm&#8230; it seems your Jetpack doesn&#8217;t quite fit.  Have you lost weight? Click &#8220;Connect to WordPress.com&#8221; again to get your Jetpack adjusted.", 'jetpack' );
			break;
		case 'site_inaccessible' :
		case 'site_requires_authorization' :
			$this->error = sprintf( __( 'Your website needs to be publicly accessible to use Jetpack: %s', 'jetpack' ), "<code>$error</code>" );
			break;
		case 'module_activation_failed' :
			$module = Jetpack::state( 'module' );
			if ( !empty( $module ) && $mod = Jetpack::get_module( $module ) ) {
				$this->error = sprintf( __( '%s could not be activated because it triggered a <strong>fatal error</strong>. Perhaps there is a conflict with another plugin you have installed?', 'jetpack' ), $mod['name'] );
				if ( isset( $this->plugins_to_deactivate[$module] ) ) {
					$this->error .= ' ' . sprintf( __( 'Do you still have the %s plugin installed?', 'jetpack' ), $this->plugins_to_deactivate[$module][1] );
				}
			} else {
				$this->error  = __( 'Module could not be activated because it triggered a <strong>fatal error</strong>. Perhaps there is a conflict with another plugin you have installed?', 'jetpack' );
			}
			if ( $php_errors = Jetpack::state( 'php_errors' ) ) {
				$this->error .= "<br />\n";
				$this->error .= $php_errors;
			}
			break;
		case 'not_public' :
			$this->error = __( "<strong>Your Jetpack has a glitch.</strong> Connecting this site with WordPress.com is not possible. This usually means your site is not publicly accessible (localhost).", 'jetpack' );
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
			$this->error = sprintf( __( "<strong>Your Jetpack has a glitch.</strong>  Something went wrong that&#8217;s never supposed to happen.  Guess you&#8217;re just lucky: %s", 'jetpack' ), "<code>$error</code>" );
			if ( !Jetpack::is_active() ) {
				$this->error .= '<br />';
				$this->error .= sprintf( __( 'Try connecting again.', 'jetpack' ) );
			}
			break;
		}

		$message_code = Jetpack::state( 'message' );

		$active_state = Jetpack::state( 'activated_modules' );
		if ( !empty( $active_state ) ) {
			$available = Jetpack::get_available_modules();
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
			if ( $module = Jetpack::get_module( Jetpack::state( 'module' ) ) ) {
				$this->message = sprintf( __( '<strong>%s Deactivated!</strong> You can activate it again at any time using the activate button on the module card.', 'jetpack' ), $module['name']  );
				$this->stat( 'module-deactivated', Jetpack::state( 'module' ) );
			}
			break;

		case 'module_configured' :
			$this->message = __( '<strong>Module settings were saved.</strong> ', 'jetpack' );
			break;

		case 'already_authorized' :
			$this->message = __( '<strong>Your Jetpack is already connected.</strong> ', 'jetpack' );
			break;

		case 'authorized' :
			$this->message  = __( "<strong>You&#8217;re fueled up and ready to go.</strong> ", 'jetpack' );
			$this->message .= "<br />\n";
			$this->message .= __( 'The features below are now active. Click the learn more buttons to explore each feature.', 'jetpack' );
			$this->message .= Jetpack::jetpack_comment_notice();
			break;
		}

		$deactivated_plugins = Jetpack::state( 'deactivated_plugins' );

		if ( !empty( $deactivated_plugins ) ) {
			$deactivated_plugins = explode( ',', $deactivated_plugins );
			$deactivated_titles = array();
			foreach ( $deactivated_plugins as $deactivated_plugin ) {
				if ( !isset( $this->plugins_to_deactivate[$deactivated_plugin] ) ) {
					continue;
				}

				$deactivated_titles[] = '<strong>' . str_replace( ' ', '&nbsp;', $this->plugins_to_deactivate[$deactivated_plugin][1] ) . '</strong>';
			}

			if ( $deactivated_titles ) {
				if ( $this->message ) {
					$this->message .= "<br /><br />\n";
				}

				$this->message .= wp_sprintf( _n(
					'Jetpack contains the most recent version of the old %l plugin.',
					'Jetpack contains the most recent versions of the old %l plugins.',
					count( $deactivated_titles ),
					'jetpack'
				), $deactivated_titles );

				$this->message .= "<br />\n";

				$this->message .= _n(
					'The old version has been deactivated and can be removed from your site.',
					'The old versions have been deactivated and can be removed from your site.',
					count( $deactivated_titles ),
					'jetpack'
				);
			}
		}

		if ( $this->message || $this->error ) {
			add_action( 'jetpack_notices', array( $this, 'admin_notices' ) );
		}

		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) ) {
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
	}

	/**
	 * Record a stat for later output
	 */
	function stat( $group, $detail ) {
		if ( !isset( $this->stats[ $group ] ) )
			$this->stats[ $group ] = array();
		$this->stats[ $group ][] = $detail;
	}

	/**
	 * Load stats pixels. $group is auto-prefixed with "jetpack-"
	 */
	function do_stats() {
		if ( is_array( $this->stats ) && count( $this->stats ) ) {
			foreach ( $this->stats as $group => $stats ) {
				if ( is_array( $stats ) && count( $stats ) )
					echo '<img src="' . ( is_ssl() ? 'https' : 'http' ) . '://stats.wordpress.com/g.gif?v=wpcom2&x_jetpack-' . esc_attr( $group ) . '=' . esc_attr( implode( ',', $stats ) ) . '&rand=' . md5( mt_rand( 0, 999 ) . time() ) . '" width="1" height="1" style="display:none;" />';
			}
		}
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
		if ( !isset( $this->capability_translations[$role] ) ) {
			return false;
		}

		return $this->capability_translations[$role];
	}

	function sign_role( $role ) {
		if ( !$user_id = (int) get_current_user_id() ) {
			return false;
		}

		$token = Jetpack_Data::get_access_token( 0 );
		if ( !$token || is_wp_error( $token ) ) {
			return false;
		}

		return $role . ':' . hash_hmac( 'md5', "{$role}|{$user_id}", $token->secret );
	}

	function build_connect_url( $raw = false ) {
		if ( !Jetpack::get_option( 'blog_token' ) ) {
			$url = wp_nonce_url( add_query_arg( 'action', 'register', menu_page_url( 'jetpack', false ) ), 'jetpack-register' );
		} else {
			$role = $this->translate_current_user_to_role();
			$signed_role = $this->sign_role( $role );

			$user = wp_get_current_user();

			$args = urlencode_deep( array(
				'response_type' => 'code',
				'client_id' => Jetpack::get_option( 'id' ),
				'redirect_uri' => add_query_arg( array(
					'action' => 'authorize',
					'_wpnonce' => wp_create_nonce( "jetpack-authorize_$role" ),
				), menu_page_url( 'jetpack', false ) ),
				'state' => $user->ID,
				'scope' => $signed_role,
				'user_email' => $user->user_email,
			) );

			$url = add_query_arg( $args, Jetpack::api_url( 'authorize' ) );
		}

		return $raw ? $url : esc_url( $url );
	}

	function admin_url( $args = null ) {
		$url = menu_page_url( 'jetpack', false );
		if ( is_array( $args ) )
			$url = add_query_arg( $args, $url );
		return $url;
	}

	function dismiss_jetpack_notice() {
		if ( isset( $_GET['jetpack-notice'] ) && 'dismiss' == $_GET['jetpack-notice'] && ! is_plugin_active_for_network( plugin_basename( __FILE__ ) ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';

			deactivate_plugins( plugin_basename( __FILE__ ), false, false );

			wp_safe_redirect( admin_url() . 'plugins.php?deactivate=true&plugin_status=all&paged=1&s=' );
			exit;
		}
	}

	function admin_page() {
		global $current_user;

		$role = $this->translate_current_user_to_role();
		$is_connected = Jetpack::is_active();
		$module = false;
	?>
		<div class="wrap" id="jetpack-settings">

			<h2 style="display: none"></h2> <!-- For WP JS message relocation -->

			<div id="jp-header"<?php if ( $is_connected ) : ?> class="small"<?php endif; ?>>
				<div id="jp-clouds">
					<?php if ( $is_connected ) : ?>
					<div id="jp-disconnect">
						<a href="<?php echo wp_nonce_url( Jetpack::admin_url( array( 'action' => 'disconnect' ) ), 'jetpack-disconnect' ); ?>"><?php _e( 'Connected to WordPress.com', 'jetpack' ); ?></a>
						<span><?php _e( 'Disconnect from WordPress.com', 'jetpack' ) ?></span>
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

			<?php // If the connection has not been made then show the marketing text. ?>
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

			<?php endif; ?>

			<?php
			// If we select the configure option for a module, show the configuration screen.
			if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) ) :
				$this->admin_screen_configure_module( $_GET['configure'] );

			// List all the available modules.
			else :
				$this->admin_screen_list_modules();
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
			<?php endif; ?>

			<div id="jp-footer">
				<p class="automattic"><?php _e( 'An <span>Automattic</span> Airline', 'jetpack' ) ?></p>
				<p class="small">
					<a href="http://jetpack.me/" target="_blank">Jetpack <?php echo esc_html( JETPACK__VERSION ); ?></a> |
					<a href="http://automattic.com/privacy/" target="_blank"><?php _e( 'Privacy Policy', 'jetpack' ); ?></a> |
					<a href="http://wordpress.com/tos/" target="_blank"><?php _e( 'Terms of Service', 'jetpack' ); ?></a> |
					<a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-ajax.php?action=jetpack_debug' ), 'jetpack_debug' ) ); ?>" id="jp-debug"><?php _e( 'Debug', 'jetpack' ); ?></a> |
					<a href="http://jetpack.me/support/" target="_blank"><?php _e( 'Support', 'jetpack' ); ?></a>
				</p>
			</div>

			<div id="jetpack-configuration" style="display:none;">
				<p><img src="<?php echo esc_url( admin_url( 'images/wpspin_dark.gif' ) ); ?>" alt="Loading ..." /></p>
			</div>
		</div>
	<?php
	}

	function ajax_debug() {
		check_ajax_referer( 'jetpack_debug' );

		if ( !current_user_can( 'manage_options' ) ) {
			die( '-1' );
		}
?>
		<p><?php esc_html_e( 'This is sensitive information.  Please do not post your BLOG_TOKEN or USER_TOKEN publicly; they are like passwords.', 'jetpack' ); ?></p>
		<ul>
		<?php
		foreach ( array(
			'CLIENT_ID'   => 'id',
			'BLOG_TOKEN'  => 'blog_token',
			'USER_TOKEN'  => 'user_token',
			'CERT'        => 'fallback_no_verify_ssl_certs',
			'TIME_DIFF'   => 'time_diff',
			'VERSION'     => 'version',
			'OLD_VERSION' => 'old_version',
		) as $label => $option_name ) :
		?>
			<li><?php echo esc_html( $label ); ?>: <code><?php echo esc_html( Jetpack::get_option( $option_name ) ); ?></code></li>
		<?php endforeach; ?>
			<li>PHP_VERSION: <code><?php echo esc_html( PHP_VERSION ); ?></code></li>
			<li>WORDPRESS_VERSION: <code><?php echo esc_html( $GLOBALS['wp_version'] ); ?></code></li>
		</ul>
<?php
		exit;
	}

	function admin_screen_configure_module( $module_id ) {
		if ( !in_array( $module_id, $this->get_active_modules() ) )
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

	function sort_modules( $a, $b ) {
		if ( $a['sort'] == $b['sort'] )
			return 0;

		return ( $a['sort'] < $b['sort'] ) ? -1 : 1;
	}

	function admin_screen_list_modules() {
		require_once dirname( __FILE__ ) . '/modules/module-info.php';
		$jetpack_connected = true;
		if ( !Jetpack::is_active() )
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
		$jetpack_version = Jetpack::get_option( 'version' );
		if ( $jetpack_version ) {
			list( $jetpack_version, $jetpack_version_time ) = explode( ':', $jetpack_version );
		} else {
			$jetpack_version = 0;
			$jetpack_version_time = 0;
		}

		$jetpack_old_version = Jetpack::get_option( 'old_version' );
		if ( $jetpack_old_version ) {
			list( $jetpack_old_version ) = explode( ':', $jetpack_old_version );
		} else {
			$jetpack_old_version = 0;
		}
		$now = time();

		foreach ( (array) $available as $module_data ) {
			$module = $module_data['module'];
			$activated = in_array( $module, $active );
			if ( $activated ) {
				$css        = 'active';
				$toggle     = __( 'Deactivate', 'jetpack' );
				$toggle_url = wp_nonce_url(
					Jetpack::admin_url( array(
						'action' => 'deactivate',
						'module' => $module
					) ),
					"jetpack_deactivate-$module"
				);
			} else {
				$css        = 'inactive';
				$toggle     = __( 'Activate', 'jetpack' );
				$toggle_url = wp_nonce_url(
					Jetpack::admin_url( array(
						'action' => 'activate',
						'module' => $module
					) ),
					"jetpack_activate-$module"
				);
			}
			$file = Jetpack::get_module_path( $module );
			$png = str_replace( '.php', '.png', $file );
			if ( is_readable( dirname( __FILE__ ) . '/_inc/images/icons/' . basename( $png ) ) )
				$module_img = plugins_url( basename( dirname( __FILE__ ) ) . '/_inc/images/icons/' . basename( $png ) );
			else
				$module_img = plugins_url( basename( dirname( __FILE__ ) ) . '/_inc/images/module-blank.png' );

			if ( $counter % 4 == 0 ) {
				$classes = $css . ' jetpack-newline';
				$counter = 0;
			} else {
				$classes = $css;
			}

			$free_text = esc_html( $module_data['free'] ?  __( 'Free', 'jetpack' ) : __( 'Purchase', 'jetpack' ) );
			$free_text = apply_filters( 'jetpack_module_free_text_' . $module, $free_text );
			$badge_text = $free_text;

			if ( !$jetpack_connected ) {
				$classes = 'x disabled';
			} else if ( $jetpack_version_time + 604800 > $now ) { // 1 week
				if ( version_compare( $module_data['introduced'], $jetpack_old_version, '>' ) ) {
					$badge_text = esc_html__( 'New', 'jetpack' );
					$classes .= ' jetpack-new-module';
				} elseif ( isset( $module_data['changed'] ) && version_compare( $module_data['changed'], $jetpack_old_version, '>' ) ) {
					$badge_text = esc_html__( 'Updated', 'jetpack' );
					$classes .= ' jetpack-updated-module';
				} else {
					$badge_text = $free_text;
				}
			}

			?>
			<div class="jetpack-module jetpack-<?php echo $classes; ?>" id="<?php echo $module ?>">
				<h3><?php echo $module_data['name']; ?></h3>
				<div class="jetpack-module-description">
						<div class="module-image">
							<img src="<?php echo esc_url( $module_img ); ?>" align="right" width="71" height="45" />
							<p><span class="module-image-badge"><?php echo $badge_text; ?></span><span class="module-image-free" style="display: none"><?php echo $free_text; ?></span></p>
						</div>

						<p><?php echo apply_filters( 'jetpack_short_module_description', $module_data['description'], $module ); ?></p>
				</div>

				<div class="jetpack-module-actions">
				<?php if ( $jetpack_connected ) : ?>
					<?php if ( !$activated ) : ?>
						<a href="<?php echo esc_url( $toggle_url ); ?>" class="jetpack-toggle-button<?php echo ( 'inactive' == $css ? ' button-primary' : ' button' ); ?>"><?php echo $toggle; ?></a>&nbsp;
					<?php endif; ?>

					<?php do_action( 'jetpack_learn_more_button_' . $module ) ?>

					<?php
					if ( apply_filters( 'jetpack_module_configurable_' . $module, false ) ) {
						echo '<a href="' . esc_attr( Jetpack::module_configuration_url( $module ) ) . '" class="jetpack-configure-button button">' . __( 'Configure', 'jetpack' ) . '</a>';
					}
					?><?php if ( $activated && $module_data['deactivate'] ) : ?><a style="display: none;" href="<?php echo esc_url( $toggle_url ); ?>" class="jetpack-deactivate-button button"><?php echo $toggle; ?></a>&nbsp;<?php endif; ?>

				<?php else : ?>
					<?php do_action( 'jetpack_learn_more_button_' . $module ) ?>
				<?php endif; ?>
				</div>
			</div>
			<?php if ( 'inactive' == $css && $jetpack_connected ) : ?>
			<script type="text/javascript">
			jQuery( '#<?php echo esc_js( $module ); ?>' ).bind( 'click', function(e){
				if ( !jQuery(e.target).hasClass('more-info-link') )
					document.location.href = '<?php echo str_replace( '&amp;', '&', esc_js( esc_url( $toggle_url ) ) ); ?>';
			} );
			</script>
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
		if ( !$this->current_user_is_connection_owner() ) {
			exit;
		}

		$this->load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => $GLOBALS['current_user']->ID
		) );
		$xml->query( 'jetpack.checkNewsSubscription' );
		if ( $xml->isError() ) {
			printf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() );
		} else {
			print_r( $xml->getResponse() );
		}
		exit;
	}

	function subscribe_to_news() {
		if ( !$this->current_user_is_connection_owner() ) {
			exit;
		}

		$this->load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => $GLOBALS['current_user']->ID
		) );
		$xml->query( 'jetpack.subscribeToNews' );
		if ( $xml->isError() ) {
			printf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() );
		} else {
			print_r( $xml->getResponse() );
		}
		exit;
	}

/* Client API */

	/**
	 * Returns the requested Jetpack API URL
	 *
	 * @static
	 * @return string
	 */
	function api_url( $relative_url ) {
		return trailingslashit( JETPACK__API_BASE . $relative_url  ) . JETPACK__API_VERSION . '/';
	}

	/**
	 * Some hosts disable the OpenSSL extension and so cannot make outgoing HTTPS requsets
	 */
	function fix_url_for_bad_hosts( $url, &$args ) {
		if ( 0 !== strpos( $url, 'https://' ) ) {
			return $url;
		}

		switch ( JETPACK_CLIENT__HTTPS ) {
		case 'ALWAYS' :
			return $url;
		case 'NEVER' :
			return substr_replace( $url, '', 4, 1 );
		// default : case 'AUTO' :
		}

		$jetpack = Jetpack::init();

		// Yay! Your host is good!
		if ( wp_http_supports( array( 'ssl' => true ) ) ) {
			return $url;
		}

		// Boo! Your host is bad and makes Jetpack cry!
		return substr_replace( $url, '', 4, 1 );
	}

	/**
	 * Returns the Jetpack XML-RPC API
	 *
	 * @static
	 * @return string
	 */
	function xmlrpc_api_url() {
		$base = preg_replace( '#(https?://[^?/]+)(/?.*)?$#', '\\1', JETPACK__API_BASE );
		return untrailingslashit( $base ) . '/xmlrpc.php';
	}

	/**
	 * @static
	 * @return bool|WP_Error
	 */
	function register() {
		Jetpack::update_option( 'register', wp_generate_password( 32, false ) . ':' . wp_generate_password( 32, false ) . ':' . ( time() + 600 ) );

		@list( $secret_1, $secret_2, $secret_eol ) = explode( ':', Jetpack::get_option( 'register' ) );
		if ( empty( $secret_1 ) || empty( $secret_2 ) || empty( $secret_eol ) || $secret_eol < time() )
			return new Jetpack_Error( 'missing_secrets' );

		$timeout = (int) ini_get( 'max_execution_time' );
		if ( !$timeout )
			$timeout = 30;
		$timeout = intval( $timeout / 2 );

		$gmt_offset = get_option( 'gmt_offset' );
		if ( !$gmt_offset ) {
			$gmt_offset = 0;
		}

		$stats_options = get_option( 'stats_options' );
		$stats_id = isset($stats_options['blog_id']) ? $stats_options['blog_id'] : null;

		$args = array(
			'method' => 'POST',
			'body' => array(
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
		$response = Jetpack_Client::_wp_remote_request( Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'register' ), $args ), $args, true );

		if ( is_wp_error( $response ) ) {
			return new Jetpack_Error( 'register_http_request_failed', $response->get_error_message() );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );

		if ( $entity )
			$json = json_decode( $entity );
		else
			$json = false;

		$code_type = intval( $code / 100 );
		if ( 5 == $code_type ) {
			return new Jetpack_error( 'wpcom_5??', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		} elseif ( 408 == $code ) {
			return new Jetpack_error( 'wpcom_408', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		} elseif ( !empty( $json->error ) ) {
			$error_description = isset( $json->error_description ) ? sprintf( __( 'Error Details: %s', 'jetpack' ), (string) $json->error_description ) : '';
			return new Jetpack_Error( (string) $json->error, $error_description, $code );
		} elseif ( 200 != $code ) {
			return new Jetpack_error( 'wpcom_bad_response', sprintf( __( 'Error Details: %s', 'jetpack' ), $code ), $code );
		}

		if ( empty( $json->jetpack_id ) || !is_scalar( $json->jetpack_id ) || preg_match( '/[^0-9]/', $json->jetpack_id ) )
			return new Jetpack_Error( 'jetpack_id', '', $code );
		if ( empty( $json->jetpack_secret ) || !is_string( $json->jetpack_secret ) )
			return new Jetpack_Error( 'jetpack_secret', '', $code );

		Jetpack::update_options( array(
			'id'         => (int)    $json->jetpack_id,
			'blog_token' => (string) $json->jetpack_secret,
		) );

		return true;
	}


/* Client Server API */

	/**
	 * Loads the Jetpack XML-RPC client
	 */
	function load_xml_rpc_client() {
		require_once ABSPATH . WPINC . '/class-IXR.php';
		require_once dirname( __FILE__ ) . '/class.jetpack-ixr-client.php';
	}

	/**
	 * Authenticates XML-RPC requests from the Jetpack Server
	 *
	 * We don't actually know who the real user is; we set it to the account that created the connection.
	 */
	function authenticate_xml_rpc( $user, $username, $password ) {
		if ( is_a( $user, 'WP_User' ) ) {
			return $user;
		}

		// It's not for us
		if ( !isset( $_GET['for'] ) || 'jetpack' != $_GET['for'] || !isset( $_GET['token'] ) || empty( $_GET['signature'] ) ) {
			return $user;
		}

		@list( $token_key, $version, $user_id ) = explode( ':', $_GET['token'] );
		if (
			empty( $token_key )
		||
			empty( $version ) || strval( JETPACK__API_VERSION ) !== $version
		||
			empty( $user_id ) || !ctype_digit( $user_id ) || !get_userdata( $user_id ) // only handle user_tokens for now, not blog_tokens
		) {
			return $user;
		}

		$token = Jetpack_Data::get_access_token( $user_id );
		if ( !$token ) {
			return $user;
		}

		if ( 0 !== strpos( $token->secret, "$token_key." ) ) {
			return $user;
		}

		require_once dirname( __FILE__ ) . '/class.jetpack-signature.php';

		$jetpack_signature = new Jetpack_Signature( $token->secret, (int) Jetpack::get_option( 'time_diff' ) );
		$signature = $jetpack_signature->sign_current_request( array( 'body' => $this->HTTP_RAW_POST_DATA ) );
		if ( !$signature ) {
			return $user;
		} else if ( is_wp_error( $signature ) ) {
			return $signature;
		} else if ( $signature !== $_GET['signature'] ) {
			return $user;
		}

		if ( !$this->add_nonce( $_GET['timestamp'], $_GET['nonce'] ) ) {
			return $user;
		}

		nocache_headers();

		return new WP_User( $token->external_user_id );
	}

	function add_nonce( $timestamp, $nonce ) {
		global $wpdb;

		// This should always have gone through Jetpack_Signature::sign_request() first to check $timestamp an $nonce

		// Raw query so we can avoid races: add_option will also update
		$show_errors = $wpdb->show_errors( false );
		$return = $wpdb->query( $wpdb->prepare(
			"INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload`) VALUES (%s, %s, %s)",
			"jetpack_nonce_{$timestamp}_{$nonce}",
			time(),
			'no'
		) );
		$wpdb->show_errors( $show_errors );
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

	function clean_nonces( $all = false ) {
		global $wpdb;

		$sql = "DELETE FROM `$wpdb->options` WHERE `option_name` LIKE %s";
		$sql_args = array( like_escape( 'jetpack_nonce_' ) . '%' );

		if ( true !== $all ) {
			$sql .= ' AND CAST( `option_value` AS UNSIGNED ) < %d';
			$sql_args[] = time() - 3600;
		}

		$wpdb->query( $wpdb->prepare( $sql, $sql_args ) );
	}

	/**
	 * State is passed via cookies from one request to the next, but never to subsequent requests.
	 * SET: state( $key, $value );
	 * GET: $value = state( $key );
	 *
	 * @param string $key
	 * @param string $value
	 * @param bool $restate private
	 *
	 * @static
	 */
	function state( $key = null, $value = null, $restate = false ) {
		static $state = array();
		static $path, $domain;
		if ( !isset( $path ) ) {
			require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
			$admin_url = Jetpack::admin_url();
			$bits = parse_url( $admin_url );

			if ( is_array( $bits ) ) {
				$path = ( isset( $bits['path'] ) ) ? dirname( $bits['path'] ) : null;
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
		if ( isset( $key ) && !isset( $value ) ) {
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

	/**
	 * @static
	 */
	function restate() {
		Jetpack::state( null, null, true );
	}

	/**
	 * Helper method for multicall XMLRPC.
	 */
	function xmlrpc_async_call() {
		global $blog_id;
		static $clients = array();

		$client_blog_id = is_multisite() ? $blog_id : 0;

		if ( !isset( $clients[$client_blog_id] ) ) {
			Jetpack::load_xml_rpc_client();
			$clients[$client_blog_id] = new Jetpack_IXR_ClientMulticall( array(
				'user_id' => get_current_user_id()
			) );
			ignore_user_abort( true );
			add_action( 'shutdown', array( 'Jetpack', 'xmlrpc_async_call' ) );
		}

		$args = func_get_args();

		if ( !empty( $args[0] ) ) {
			call_user_func_array( array( $clients[$client_blog_id], 'addCall' ), $args );
		} elseif ( is_multisite() ) {
			foreach ( $clients as $client_blog_id => $client ) {
				if ( !$client_blog_id || empty( $client->calls ) ) {
					continue;
				}

				$switch_success = switch_to_blog( $client_blog_id, true );
				if ( !$switch_success ) {
					continue;
				}

				flush();
				$client->query();

				restore_current_blog();
			}
		} else {
			if ( isset( $clients[0] ) && !empty( $clients[0]->calls ) ) {
				flush();
				$clients[0]->query();
			}
		}
	}

	function staticize_subdomain( $url ) {
		if ( is_ssl() ) {
			return preg_replace( '|https?://[^/]++/|', 'https://s-ssl.wordpress.com/', $url );
		}

	       	srand( crc32( basename( $url ) ) );
		$static_counter = rand( 0, 2 );
		srand(); // this resets everything that relies on this, like array_rand() and shuffle()

		return preg_replace( '|://[^/]+?/|', "://s$static_counter.wp.com/", $url );
	}
}

class Jetpack_Client {
	/**
	 * Makes an authorized remote request using Jetpack_Signature
	 *
	 * @static
	 * @return array|WP_Error WP HTTP response on success
	 */
	function remote_request( $args, $body = null ) {
		$defaults = array(
			'url' => '',
			'user_id' => 0,
			'blog_id' => 0,
			'auth_location' => JETPACK_CLIENT__AUTH_LOCATION,
			'method' => 'POST',
			'timeout' => 10,
			'redirection' => 0,
		);

		$args = wp_parse_args( $args, $defaults );

		$args['user_id'] = (int) $args['user_id'];
		$args['blog_id'] = (int) $args['blog_id'];

		if ( 'header' != $args['auth_location'] ) {
			$args['auth_location'] = 'query_string';
		}

		$token = Jetpack_Data::get_access_token( $args );
		if ( !$token ) {
			return new Jetpack_Error( 'missing_token' );
		}

		$method = strtoupper( $args['method'] );

		$timeout = intval( $args['timeout'] );

		$redirection = $args['redirection'];

		$request = compact( 'method', 'body', 'timeout', 'redirection' );

		@list( $token_key, $secret ) = explode( '.', $token->secret );
		if ( empty( $token ) || empty( $secret ) ) {
			return new Jetpack_Error( 'malformed_token' );
		}

		$token_key = sprintf( '%s:%d:%d', $token_key, JETPACK__API_VERSION, $token->external_user_id );

		require_once dirname( __FILE__ ) . '/class.jetpack-signature.php';

		$time_diff = (int) Jetpack::get_option( 'time_diff' );
		$jetpack_signature = new Jetpack_Signature( $token->secret, $time_diff );

		$timestamp = time() + $time_diff;
		$nonce = wp_generate_password( 10, false );

		// Kind of annoying.  Maybe refactor Jetpack_Signature to handle body-hashing
		if ( is_null( $body ) ) {
			$body_hash = '';
		} else {
			if ( !is_string( $body ) ) {
				return new Jetpack_Error( 'invalid_body', 'Body is malformed.' );
			}
			$body_hash = jetpack_sha1_base64( $body );
		}

		$auth = array(
			'token' => $token_key,
			'timestamp' => $timestamp,
			'nonce' => $nonce,
			'body-hash' => $body_hash,
		);

		if ( false !== strpos( $args['url'], 'xmlrpc.php' ) ) {
			$url_args = array( 'for' => 'jetpack' );
		} else {
			$url_args = array();
		}

		if ( 'header' != $args['auth_location'] ) {
			$url_args += $auth;
		}

		$url = add_query_arg( urlencode_deep( $url_args ), $args['url'] );
		$url = Jetpack::fix_url_for_bad_hosts( $url, $request );

		$signature = $jetpack_signature->sign_request( $token_key, $timestamp, $nonce, $body_hash, $method, $url, $body, false );

		if ( !$signature || is_wp_error( $signature ) ) {
			return $signature;
		}

		// Send an Authorization header so various caches/proxies do the right thing
		$auth['signature'] = $signature;
		$auth['version'] = JETPACK__VERSION;
		$header_pieces = array();
		foreach ( $auth as $key => $value ) {
			$header_pieces[] = sprintf( '%s="%s"', $key, $value );
		}
		$request['headers'] = array(
			'Authorization' => "X_JETPACK " . join( ' ', $header_pieces ),
		);

		if ( 'header' != $args['auth_location'] ) {
			$url = add_query_arg( 'signature', urlencode( $signature ), $url );
		}

		return Jetpack_Client::_wp_remote_request( $url, $request );
	}

	/**
	 * Wrapper for wp_remote_request().  Turns off SSL verification for certain SSL errors.
	 * This is lame, but many, many, many hosts have misconfigured SSL.
	 *
	 * When Jetpack is registered, the jetpack_fallback_no_verify_ssl_certs option is set to the current time if:
	 * 1. a certificate error is found AND
	 * 2. not verifying the certificate works around the problem.
	 *
	 * The option is checked on each request.
	 *
	 * @internal
	 * @todo: Better fallbacks (bundled certs?), feedback, UI, ....
	 * @see Jetpack::fix_url_for_bad_hosts()
	 *
	 * @static
	 * @return array|WP_Error WP HTTP response on success
	 */
	function _wp_remote_request( $url, $args, $set_fallback = false ) {
		$fallback = Jetpack::get_option( 'fallback_no_verify_ssl_certs' );
		if ( false === $fallback ) {
			Jetpack::update_option( 'fallback_no_verify_ssl_certs', 0 );
		}

		if ( (int) $fallback ) {
			// We're flagged to fallback
			$args['sslverify'] = false;
		}

		$response = wp_remote_request( $url, $args );

		if (
			!$set_fallback                                     // We're not allowed to set the flag on this request, so whatever happens happens
		||
			isset( $args['sslverify'] ) && !$args['sslverify'] // No verification - no point in doing it again
		||
			!is_wp_error( $response )                          // Let it ride
		) {
			Jetpack_Client::set_time_diff( $response, $set_fallback );
			return $response;
		}

		// At this point, we're not flagged to fallback and we are allowed to set the flag on this request.

		$message = $response->get_error_message();

		// Is it an SSL Certificate verification error?
		if (
			false === strpos( $message, '14090086' ) // OpenSSL SSL3 certificate error
		&&
			false === strpos( $message, '1407E086' ) // OpenSSL SSL2 certificate error
		&&
			false === strpos( $message, 'error setting certificate verify locations' ) // cURL CA bundle not found
		&&
			false === strpos( $message, 'Peer certificate cannot be authenticated with' ) // cURL CURLE_SSL_CACERT: CA bundle found, but not helpful
			                                                                              // different versions of curl have different error messages
			                                                                              // this string should catch them all
		&&
			false === strpos( $message, 'Problem with the SSL CA cert' ) // cURL CURLE_SSL_CACERT_BADFILE: probably access rights
		) {
			// No, it is not.
			return $response;
		}

		// Redo the request without SSL certificate verification.
		$args['sslverify'] = false;
		$response = wp_remote_request( $url, $args );

		if ( !is_wp_error( $response ) ) {
			// The request went through this time, flag for future fallbacks
			Jetpack::update_option( 'fallback_no_verify_ssl_certs', time() );
			Jetpack_Client::set_time_diff( $response, $set_fallback );
		}

		return $response;
	}

	function set_time_diff( &$response, $force_set = false ) {
		$code = wp_remote_retrieve_response_code( $response );

		// Only trust the Date header on some responses
		if ( 200 != $code && 304 != $code && 400 != $code && 401 != $code ) {
			return;
		}

		if ( !$date = wp_remote_retrieve_header( $response, 'date' ) ) {
			return;
		}

		if ( 0 >= $time = (int) strtotime( $date ) ) {
			return;
		}

		$time_diff = $time - time();

		if ( $force_set ) { // during register
			Jetpack::update_option( 'time_diff', $time_diff );
		} else { // otherwise
			$old_diff = Jetpack::get_option( 'time_diff' );
			if ( false === $old_diff || abs( $time_diff - (int) $old_diff ) > 10 ) {
				Jetpack::update_option( 'time_diff', $time_diff );
			}
		}
	}
}

class Jetpack_Data {
	/**
	 * Gets locally stored token
	 *
	 * @static
	 * @return object|false
	 */
	function get_access_token( $args ) {
		if ( is_numeric( $args ) ) {
			$args = array( 'user_id' => $args );
		}

		if ( $args['user_id'] ) {
			if ( !$token = Jetpack::get_option( 'user_token' ) ) {
				return false;
			}
			$token_chunks = explode( '.', $token );
			if ( empty( $token_chunks[1] ) || empty( $token_chunks[2] ) ) {
				return false;
			}
			$args['user_id'] = $token_chunks[2];
			$token = "{$token_chunks[0]}.{$token_chunks[1]}";
		} else {
			$token = Jetpack::get_option( 'blog_token' );
			if ( empty( $token ) ) {
				return false;
			}
		}

		return (object) array(
			'secret' => $token,
			'external_user_id' => (int) $args['user_id'],
		);
	}
}

/**
 * Client = Plugin
 * Client Server = API Methods the Plugin must respond to
 *
 * @todo Roll this into Jetpack?  There's only one 'public' method now: ::authorize().
 */
class Jetpack_Client_Server {
	function authorize() {
		$data = stripslashes_deep( $_GET );

		$args = array();

		do {
			$jetpack = Jetpack::init();
			$role = $jetpack->translate_current_user_to_role();
			if ( !$role ) {
				Jetpack::state( 'error', 'no_role' );
				break;
			}

			$cap = $jetpack->translate_role_to_cap( $role );
			if ( !$cap ) {
				Jetpack::state( 'error', 'no_cap' );
				break;
			}

			check_admin_referer( "jetpack-authorize_$role" );

			if ( !empty( $data['error'] ) ) {
				Jetpack::state( 'error', $data['error'] );
				break;
			}

			if ( empty( $data['state'] ) ) {
				Jetpack::state( 'error', 'no_state' );
				break;
			}

			if ( !ctype_digit( $data['state'] ) ) {
				Jetpack::state( 'error', 'invalid_state' );
				break;
			}

			$current_user_id = get_current_user_id();
			if ( $current_user_id != $data['state'] ) {
				Jetpack::state( 'error', 'wrong_state' );
				break;
			}

			if ( empty( $data['code'] ) ) {
				Jetpack::state( 'error', 'no_code' );
				break;
			}

			$token = $this->get_token( $data );

			if ( is_wp_error( $token ) ) {
				if ( $error = $token->get_error_code() )
					Jetpack::state( 'error', $error );
				else
					Jetpack::state( 'error', 'invalid_token' );

				Jetpack::state( 'error_description', $token->get_error_message() );

				break;
			}

			if ( !$token ) {
				Jetpack::state( 'error', 'no_token' );
				break;
			}

			Jetpack::update_option( 'user_token', sprintf( '%s.%d', $token, $current_user_id ), true );
			Jetpack::state( 'message', 'authorized' );

			if ( $active_modules = Jetpack::get_option( 'active_modules' ) ) {
				Jetpack::delete_option( 'active_modules' );

				Jetpack::activate_default_modules( 999, 1, $active_modules );
			} else {
				Jetpack::activate_default_modules();
			}

			// Start nonce cleaner
			wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
			wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );
		} while ( false );

		wp_safe_redirect( Jetpack::admin_url() );
		exit;
	}

	function deactivate_plugin( $probable_file, $probable_title ) {
		if ( is_plugin_active( $probable_file ) ) {
			deactivate_plugins( $probable_file );
			return 1;
		} else {
			// If the plugin is not in the usual place, try looking through all active plugins.
			$active_plugins = get_option( 'active_plugins', array() );
			foreach ( $active_plugins as $plugin ) {
				$data = get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin );
				if ( $data['Name'] == $probable_title ) {
					deactivate_plugins( $plugin );
					return 1;
				}
			}
		}

		return 0;
	}

	/**
	 * @return object|WP_Error
	 */
	function get_token( $data ) {
		$jetpack = Jetpack::init();
		$role = $jetpack->translate_current_user_to_role();

		if ( !$role ) {
			return new Jetpack_Error( 'role', __( 'An administrator for this blog must set up the Jetpack connection.', 'jetpack' ) );
		}

		$client_secret = Jetpack_Data::get_access_token( 0 );
		if ( !$client_secret ) {
			return new Jetpack_Error( 'client_secret', __( 'You need to register your Jetpack before connecting it.', 'jetpack' ) );
		}

		$body = array(
			'client_id' => Jetpack::get_option( 'id' ),
			'client_secret' => $client_secret->secret,
			'grant_type' => 'authorization_code',
			'code' => $data['code'],
			'redirect_uri' => add_query_arg( array(
				'action' => 'authorize',
				'_wpnonce' => wp_create_nonce( "jetpack-authorize_$role" ),
			), menu_page_url( 'jetpack', false ) ),
		);

		$args = array(
			'method' => 'POST',
			'body' => $body,
			'headers' => array(
				'Accept' => 'application/json',
			),
		);
		$response = Jetpack_Client::_wp_remote_request( Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'token' ), $args ), $args );

		if ( is_wp_error( $response ) ) {
			return new Jetpack_Error( 'token_http_request_failed', $response->get_error_message() );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );

		if ( $entity )
			$json = json_decode( $entity );
		else
			$json = false;

		if ( 200 != $code || !empty( $json->error ) ) {
			if ( empty( $json->error ) )
				return new Jetpack_Error( 'unknown', '', $code );

			$error_description = isset( $json->error_description ) ? sprintf( __( 'Error Details: %s', 'jetpack' ), (string) $json->error_description ) : '';

			return new Jetpack_Error( (string) $json->error, $error_description, $code );
		}

		if ( empty( $json->access_token ) || !is_scalar( $json->access_token ) ) {
			return new Jetpack_Error( 'access_token', '', $code );
		}

		if ( empty( $json->token_type ) || 'X_JETPACK' != strtoupper( $json->token_type ) ) {
			return new Jetpack_Error( 'token_type', '', $code );
		}

		if ( empty( $json->scope ) ) {
			return new Jetpack_Error( 'scope', 'No Scope', $code );
		}
		@list( $role, $hmac ) = explode( ':', $json->scope );
		if ( empty( $role ) || empty( $hmac ) ) {
			return new Jetpack_Error( 'scope', 'Malformed Scope', $code );
		}
		if ( $jetpack->sign_role( $role ) !== $json->scope ) {
			return new Jetpack_Error( 'scope', 'Invalid Scope', $code );
		}

		if ( !$cap = $jetpack->translate_role_to_cap( $role ) )
			return new Jetpack_Error( 'scope', 'No Cap', $code );
		if ( !current_user_can( $cap ) )
			return new Jetpack_Error( 'scope', 'current_user_cannot', $code );

		return (string) $json->access_token;
	}
}


/**
 * Request that a piece of data on this WordPress install be synced back to the
 * Jetpack server for remote processing/notifications/etc
 */
class Jetpack_Sync {
	var $sync = array();
	var $post_transitions = array();

	function Jetpack_Sync() {
		add_action( 'transition_post_status', array( $this, 'track_post_transition' ), 1, 3 );
	}

	function track_post_transition( $new_status, $old_status, $post ) {
		if ( empty( $post->ID ) ) {
			return;
		}

		if ( isset( $this->post_transitions[$post->ID] ) ) {
			$this->post_transitions[$post->ID][0] = $new_status;
			return;
		}

		$this->post_transitions[$post->ID] = array( $new_status, $old_status );
	}

	/**
	 * Create a sync object/request
	 *
	 * @param string $object Type of object to sync -- [ post | comment ]
	 * @param int $id Unique identifier
	 * @param array $specifics Specific fields/elements of that object to sync. Defaults to syncing all data for the $object
	 */
	function register( $object, $id = false, $specifics = true ) {
		// Since we've registered something for sync, hook it up to execute on shutdown if we haven't already
		if ( !$this->sync ) {
			ignore_user_abort( true );
			add_action( 'shutdown', array( $this, 'sync' ), 9 ); // Right before async XML-RPC
		}

		$this->add_to_array( $this->sync, $object, $id, $specifics );
		return true;
	}

	function add_to_array( &$array, $object, $id, $data ) {
		if ( !isset( $array[$object] ) ) {
			$array[$object] = array( $id => $data );
		} else if ( !isset( $array[$object][$id] ) ) {
			$array[$object][$id] = $data;
		} else {
			if ( true === $array[$object][$id] || true === $data )
				$array[$object][$id] = true;
			else
				$array[$object][$id] = array_merge( $array[$object][$id], $data );
		}
	}

	/**
	 * Set up all the data and queue it for the outgoing XML-RPC request
	 */
	function sync() {
		global $wpdb;
		$jetpack = Jetpack::init();

		$available_modules = Jetpack::get_available_modules();
		$active_modules = Jetpack::get_active_modules();
		$modules = array();
		foreach ( $available_modules as $available_module ) {
			$modules[$available_module] = in_array( $available_module, $active_modules );
		}
		$modules['vaultpress'] = class_exists( 'VaultPress' ) || function_exists( 'vaultpress_contact_service' );

		$sync_data = compact( 'modules' );

		if ( count( $this->sync ) ) {
			foreach ( $this->sync as $obj => $data ) {
				switch ( $obj ) {
				case 'post':
					$global_post = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
					$GLOBALS['post'] = null;
					foreach ( $data as $post => $columns ) {
						$sync_data['post'][$post] = $jetpack->get_post( $post, $columns );
						if ( isset( $this->post_transitions[$post] ) ) {
							$sync_data['post'][$post]['transitions'] = $this->post_transitions[$post];
						} else {
							$sync_data['post'][$post]['transitions'] = array( false, false );
						}
					}
					$GLOBALS['post'] = $global_post;
					unset( $global_post );
					break;

				case 'delete_post':
					foreach ( $data as $post => $true ) {
						$sync_data['delete_post'][$post] = true;
					}
					break;

				case 'comment':
					$global_comment = isset( $GLOBALS['comment'] ) ? $GLOBALS['comment'] : null;
					unset( $GLOBALS['comment'] );
					foreach ( $data as $comment => $columns ) {
						$sync_data['comment'][$comment] = $jetpack->get_comment( $comment, $columns );
					}
					$GLOBALS['comment'] = $global_comment;
					unset( $global_comment );
					break;

				case 'delete_comment':
					foreach ( $data as $comment => $true ) {
						$sync_data['delete_comment'][$comment] = true;
					}
					break;

				case 'tag':
					foreach ( $data as $taxonomy => $columns ) {
						$sync_data['tag'][$taxonomy] = $jetpack->get_taxonomy( $taxonomy, $columns, 'post_tag' );
					}
					break;

				case 'delete_tag':
					foreach ( $data as $taxonomy => $columns ) {
						$sync_data['delete_tag'][$taxonomy] = $columns;
					}
					break;

				case 'category':
					foreach ( $data as $taxonomy => $columns ) {
						$sync_data['category'][$taxonomy] = $jetpack->get_taxonomy( $taxonomy, $columns, 'category' );
					}
					break;

				case 'delete_category':
					foreach ( $data as $taxonomy => $columns ) {
						$sync_data['delete_category'][$taxonomy] = $columns;
					}
					break;
				}
			}

			Jetpack::xmlrpc_async_call( 'jetpack.syncContent', $sync_data );
		}
	}

	function taxonomy( $slug, $fields = true, $type ) {
		if ( !get_term_by( 'slug', $slug, $type ) ) {
			return false;
		}

		if ( 'post_tag' == $type )
			return $this->register( 'tag', $slug, $fields );
		else
			return $this->register( 'category', $slug, $fields );
	}

	/**
	 * Request that a post be deleted remotely
	 *
	 * @param int $id The post_ID
	 */
	function delete_taxonomy( $slugs, $type ) {
		if ( 'post_tag' == $type )
			return $this->register( 'delete_tag', 1, $slugs );
		else
			return $this->register( 'delete_category', 1, $slugs );
	}

	/**
	 * Helper method for easily requesting a sync of a post.
	 *
	 * @param int $id wp_posts.ID
	 * @param array $fields Array containing field/column names to sync (optional, defaults to all fields)
	 */
	function post( $id, $fields = true ) {
		if ( !$id = (int) $id ) {
			return false;
		}

		if ( false === $fields ) {
			$fields = array( '_jetpack_backfill' );
		}
		if ( is_array( $fields ) ) {
			$fields = array_merge( $fields, array( 'ID', 'post_title', 'post_name', 'guid', 'post_date', 'post_date_gmt', 'post_parent', 'post_type', 'post_status' ) );
		}

		if ( !$post = get_post( $id ) ) {
			return false;
		}

		if (
			!empty( $post->post_password )
		||
			!in_array( $post->post_type, get_post_types( array( 'public' => true ) ) )
		||
			!in_array( $post->post_status, get_post_stati( array( 'public' => true ) ) )
		) {
			return false;
		}

		return $this->register( 'post', (int) $id, $fields );
	}

	/**
	 * Request that a post be deleted remotely
	 *
	 * @param int $id The post_ID
	 */
	function delete_post( $id ) {
		return $this->register( 'delete_post', (int) $id, true );
	}

	/**
	 * Helper method for easily requesting a sync of a comment.
	 *
	 * @param int $id wp_comments.ID
	 * @param array $fields Array containing field/column names to sync (optional, defaults to all fields).  Should always use default.
	 */
	function comment( $id, $fields = true ) {
		if ( !$comment = get_comment( $id ) ) {
			return false;
		}
		if ( !$comment->comment_post_ID ) {
			return false;
		}
		if ( !$this->post( $comment->comment_post_ID, false ) ) {
			return false;
		}
		return $this->register( 'comment', (int) $id, $fields );
	}

	/**
	 * Request that a comment be deleted remotely
	 *
	 * @param int $id The comment_ID
	 */
	function delete_comment( $id ) {
		return $this->register( 'delete_comment', (int) $id, true );
	}
}

class Jetpack_Error extends WP_Error {}

register_activation_hook( __FILE__, array( 'Jetpack', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack', 'plugin_deactivation' ) );

add_action( 'init', array( 'Jetpack', 'init' ) );
add_action( 'plugins_loaded', array( 'Jetpack', 'load_modules' ), 100 );
add_filter( 'jetpack_static_url', array( 'Jetpack', 'staticize_subdomain' ) );
