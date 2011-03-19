<?php

/*
 * Plugin Name: Jetpack by WordPress.com
 * Plugin URI: http://wordpress.org/extend/plugins/jetpack/
 * Description: Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.
 * Author: Automattic
 * Version: 1.1.1
 * Author URI: http://jetpack.me
 * License: GPL2+
 * Text Domain: jetpack
 * Domain Path: /languages/
 */

defined( 'JETPACK__API_BASE' ) or define( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
define( 'JETPACK__API_VERSION', 1 );
define( 'JETPACK__MINIMUM_WP_VERSION', '3.0.5' );
defined( 'JETPACK_CLIENT__AUTH_LOCATION' ) or define( 'JETPACK_CLIENT__AUTH_LOCATION', 'header' );
defined( 'JETPACK_CLIENT__HTTPS' ) or define( 'JETPACK_CLIENT__HTTPS', 'AUTO' );

/*
Options:
jetpack_activated (int)
	1: the plugin was activated normally
	2: the plugin was activated on this site because of a network-wide activation
	3: the plugin was auto-installed
	4: the plugin was manually disconnected (but is still installed)

jetpack_register (string)
	verification secrets

jetpack_id (int)
	The Client ID/WP.com Blog ID of this site.

jetpack_blog_token (string)
	The Client Secret/Blog Token of this site.

jetpack_user_token (string)
	The User Token of this site.

jetpack_active_modules (array)
	Array of active module slugs.

jetpack_do_activate (bool)
	Flag for "activating" the plugin on sites where the activation hook never fired (auto-installs)

jetpack_fallback_no_verify_ssl_certs (int)
	Flag for determining if this host must skip SSL Certificate verification due to misconfigured SSL.
*/

class Jetpack {
	var $xmlrpc_server = null;

	var $HTTP_RAW_POST_DATA = null; // copy of $GLOBALS['HTTP_RAW_POST_DATA']

	var $plugins_to_deactivate = array(
		'stats/stats.php' => 'WordPress.com Stats',
		'sharedaddy/sharedaddy.php' => 'Sharedaddy',
		'wickett-twitter-widget/wickett-twitter-widget.php' => 'Wickett Twitter Widget',
		'after-the-deadline/after-the-deadline.php' => 'After The Deadline',
	);

	var $capability_translations = array(
		'administrator' => 'manage_options',
//		'editor' => 'edit_others_posts',
//		'author' => 'publish_posts',
//		'contributor' => 'edit_posts',
	);

	var $use_ssl = array();

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
	 * Singleton
	 * @static
	 */
	function &init() {
		static $instance = false;

		if ( !$instance ) {
			load_plugin_textdomain( 'jetpack', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
			$instance = new Jetpack;
		}

		return $instance;
	}

	/**
	 * Constructor.  Initializes WordPress hooks
	 */
	function Jetpack() {
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

		add_action( 'http_transport_post_debug', array( $this, 'http_transport_detector' ) );
		add_action( 'http_transport_get_debug',  array( $this, 'http_transport_detector' ) );

		add_action( 'wp_ajax_jetpack-check-news-subscription', array( $this, 'check_news_subscription' ) );
		add_action( 'wp_ajax_jetpack-subscribe-to-news', array( $this, 'subscribe_to_news' ) );
	}

	/**
	 * Is Jetpack active?
	 */
	function is_active() {
		return (bool) Jetpack_Data::get_access_token( 1 ); // 1 just means user token
	}

	/**
	 * Loads the currently active modules.
	 */
	function load_modules() {
		if ( !Jetpack::is_active() ) {
			return;
		}

		$modules = Jetpack::get_active_modules();
		foreach ( $modules as $module ) {
			if ( empty( $module ) || !Jetpack::is_module( $module ) || did_action( 'jetpack_module_loaded_' . $module ) )
				continue;
			require Jetpack::get_module_path( $module );
			do_action( 'jetpack_module_loaded_' . $module );
		}

		do_action( 'jetpack_modules_loaded' );
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

	/**
	 * List available Jetpack modules. Simply lists .php files in /modules/.
	 * Make sure to tuck away module "library" files in a sub-directory.
	 */
	function get_available_modules() {
		static $modules = null;

		if ( isset( $modules ) )
			return $modules;

		$files = Jetpack::glob_php( dirname( __FILE__ ) . '/modules' );

		foreach ( $files as $file ) {
			if ( $headers = Jetpack::get_module( $file ) ) {
				$modules[] = Jetpack::get_module_slug( $file );
			}
		}

		return $modules;
	}

	/**
	 * Default modules loaded on activation.
	 */
	function get_default_modules() {
		$return = array();

		foreach ( Jetpack::get_available_modules() as $module ) {
			// Add special cases here for modules to avoid auto-activation
			switch ( $module ) {
			case 'sharedaddy' :
				if ( version_compare( PHP_VERSION, '5', '<' ) ) {
					continue;
				} // else no break
			default :
				$return[] = $module;
			}
		}

		return $return;
	}

	/**
	 * Extract a module's full path from its slug.
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
			'name' => 'Module Name',
			'description' => 'Module Description',
			'sort' => 'Sort Order',
		);
		$file = Jetpack::get_module_path( Jetpack::get_module_slug( $module ) );
		$mod = get_file_data( $file, $headers );
		if ( empty( $mod['sort'] ) )
			$mod['sort'] = 10;
		if ( !empty( $mod['name'] ) )
			return $mod;
		return false;
	}

	/**
	 * Get a list of activated modules as an array. The array contains full
	 * filenames (with extension), so you'll want to do something with it before
	 * display in most cases.
	 */
	function get_active_modules() {
		$active = get_option( 'jetpack_active_modules' );
		return $active && is_array( $active ) ? array_unique( $active ) : array();
	}

	function is_module( $module ) {
		return !validate_file( $module, Jetpack::get_available_modules() );
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

	function activate_default_modules() {
		$modules = Jetpack::get_default_modules();

		// Check each module for fatal errors, a la wp-admin/plugins.php::activate before activating
		$redirect = menu_page_url( 'jetpack', false );
		Jetpack::catch_errors( true );
		foreach ( $modules as $module ) {
			$active = Jetpack::get_active_modules();
			wp_redirect( add_query_arg( array( 'error' => 'module_activation_failed', 'module' => urlencode( $module ) ), $redirect ) ); // we'll override this later if the plugin can be included without fatal error
			ob_start();
			require Jetpack::get_module_path( $module );
			$active[] = $module;
			if ( $active_state = Jetpack::state( 'activated_modules' ) ) {
				$active_state = explode( ',', $active_state );
			} else {
				$active_state = array();
			}
			$active_state[] = $module;
			Jetpack::state( 'activated_modules', implode( ',', $active_state ) );
			update_option( 'jetpack_active_modules', array_unique( $active ) );
			ob_end_clean();
		}
		Jetpack::catch_errors( false );
	}

	function activate_module( $module ) {
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

		// Check the file for fatal errors, a la wp-admin/plugins.php::activate
		Jetpack::state( 'module', $module );
		Jetpack::state( 'error', 'module_activation_failed' ); // we'll override this later if the plugin can be included without fatal error
		wp_redirect( Jetpack::admin_url() );

		if ( 'sharedaddy' == $module && version_compare( PHP_VERSION, '5', '<' ) ) {
			exit;
		}

		Jetpack::catch_errors( true );
		ob_start();
		require Jetpack::get_module_path( $module );
		$active[] = $module;
		update_option( 'jetpack_active_modules', array_unique( $active ) );
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

		return update_option( 'jetpack_active_modules', array_unique( $new ) );
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
		update_option( 'jetpack_activated', 1 );

		if ( version_compare( $GLOBALS['wp_version'], JETPACK__MINIMUM_WP_VERSION, '<' ) ) {
			Jetpack::bail_on_activation( sprintf( __( 'Jetpack requires WordPress version %s or later.', 'jetpack' ), JETPACK__MINIMUM_WP_VERSION ) );
		}

		if ( $network_wide )
			Jetpack::state( 'network_nag', true );

		Jetpack::plugin_initialize();
	}

	/**
	 * Starts the nonce cleaner
	 * @static
	 */
	function plugin_initialize() {
		if ( !get_option( 'jetpack_activated' ) ) {
			update_option( 'jetpack_activated', 2 );
		}

		Jetpack::load_modules();

		delete_option( 'jetpack_do_activate' );
	}

	/**
	 * Removes all options.
	 * @static
	 */
	function plugin_deactivation( $network_wide ) {
		global $wpdb;

		wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
		do_action( 'jetpack_clean_nonces' );

		/* @todo Move the rest to a uninstall hook? */
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.deregister' );

		delete_option( 'jetpack_register'       );
		delete_option( 'jetpack_id'             );
		delete_option( 'jetpack_blog_token'     );
		delete_option( 'jetpack_user_token'     );
		delete_option( 'jetpack_active_modules' );
		delete_option( 'jetpack_do_activate'    );
		delete_option( 'jetpack_activated'      );
		delete_option( 'jetpack_fallback_no_verify_ssl_certs' );

		// Legacy
		delete_option( 'jetpack_was_activated'  );
		delete_option( 'jetpack_auto_installed' );
		delete_transient( 'jetpack_register'    );
	}

	/**
	 * Attemps Jetpack registration, if it fails then set a DB flag to show a persistent re-try message.
	 * @static
	 */
	function try_registration() {
		$result = JetPack::register();

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
			get_option( 'jetpack_do_activate' )
		||
			// the plugin is active, but was never activated.  Probably came from a site-wide network activation
			!get_option( 'jetpack_activated' )
		) {
			Jetpack::plugin_initialize();
		}

		if ( !JetPack::is_active() ) {
			add_action( 'admin_print_styles', array( $this, 'admin_styles' ) );

			if ( 4 != get_option( 'jetpack_activated' ) ) {
				foreach ( array( 'user_admin_notices', 'admin_notices' ) as $filter )
					add_action( $filter, array( $this, 'admin_connect_notice' ) );

				if ( Jetpack::state( 'network_nag' ) )
					add_action( 'network_admin_notices', array( $this, 'network_connect_notice' ) );
			}
		} elseif ( false === get_option( 'jetpack_fallback_no_verify_ssl_certs' ) ) {
			Jetpack_Client::_wp_remote_request(
				Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'test', 'get' ) ),
				array(),
				true
			);
		}

		add_action( 'load-plugins.php', array( $this, 'intercept_plugin_error_scrape_init' ) );
		add_action( 'admin_head', array( $this, 'admin_menu_css' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( $this, 'plugin_action_links' ) );
	}

	function intercept_plugin_error_scrape_init() {
		add_action( 'check_admin_referer', array( $this, 'intercept_plugin_error_scrape' ), 10, 2 );
	}

	function intercept_plugin_error_scrape( $action, $result ) {
		if ( !$result ) {
			return;
		}

		foreach ( $this->plugins_to_deactivate as $plugin => $title ) {
			if ( "plugin-activation-error_$plugin" == $action ) {
				$this->bail_on_activation( sprintf( __( 'Jetpack contains the most recent version of the &#8220;%1$s&#8221; plugin.', 'jetpack' ), $title ), false );
			}
		}
	}

	function admin_menu() {
		$hook = add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', array( $this, 'admin_page' ), '' );
		add_action( "load-$hook", array( $this, 'admin_page_load' ) );
		add_action( "admin_head-$hook", array( $this, 'admin_head' ) );
		add_filter( 'custom_menu_order', array( $this, 'admin_menu_order' ) );
		add_filter( 'menu_order', array( $this, 'jetpack_menu_order' ) );

		if ( JetPack::is_active() )
			add_action( "admin_print_styles-$hook", array( $this, 'admin_styles' ) );

		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts' ) );

		do_action( 'jetpack_admin_menu' );
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
		wp_enqueue_style( 'jetpack', plugins_url( basename( dirname( __FILE__ ) ) . '/_inc/jetpack.css' ), false, '20110307' );
	}

	function admin_scripts() {
		wp_enqueue_script( 'jetpack-js', plugins_url( basename( dirname( __FILE__ ) ) ) . '/_inc/jetpack.js', array( 'jquery' ), '20110307' );
		add_action( 'admin_footer', array( $this, 'do_stats' ) );
	}

	function plugin_action_links( $actions ) {
		return array_merge(
			array( 'settings' => sprintf( '<a href="%s">%s</a>', Jetpack::admin_url(), __( 'Settings' , 'jetpack' ) ) ),
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
			<div class="squeezer">
				<?php if ( 1 == get_option( 'jetpack_activated' ) ) : ?>
					<h4><?php _e( '<strong>Your Jetpack is almost ready</strong> &#8211; Connect to WordPress.com to enable all features.', 'jetpack' ); ?></h4>
					<p class="submit"><a href="<?php echo $this->build_connect_url() ?>" class="button-primary" id="wpcom-connect"><?php _e( 'Connect to WordPress.com', 'jetpack' ); ?></a></p>
				<?php else : ?>
					<h4><?php _e( '<strong>JetPack is installed</strong> and ready to bring awesome, WordPress.com cloud-powered features to your site.', 'jetpack' ) ?></h4>
					<p class="submit"><a href="<?php echo Jetpack::admin_url() ?>" class="button-primary" id="wpcom-connect"><?php _e( 'Learn More', 'jetpack' ); ?></a></p>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	function network_connect_notice() {
		?>
		<div id="message" class="updated jetpack-message">
			<div class="squeezer">
				<h4><?php _e( '<strong>JetPack is activated!</strong> Each site on your network must be connected individually by an admin on that site.', 'jetpack' ) ?></h4>
			</div>
		</div>
		<?php
	}

	function admin_page_load() {
		$error = false;

		if ( isset( $_GET['action'] ) ) {
			switch ( $_GET['action'] ) {
			case 'authorize' :
				if ( Jetpack::is_active() ) {
					Jetpack::state( 'message', 'already_authorized' );
					wp_redirect( Jetpack::admin_url() );
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
				wp_redirect( Jetpack::admin_url() );
				exit;
			case 'activate_default_modules' :
				check_admin_referer( 'activate_default_modules' );
				Jetpack::restate();
				Jetpack::activate_default_modules();
				wp_redirect( Jetpack::admin_url() );
				exit;
			case 'disconnect' :
				check_admin_referer( 'jetpack-disconnect' );
				$this->plugin_deactivation( false );
				update_option( 'jetpack_activated', 4 );
				wp_redirect( Jetpack::admin_url() );
				exit;
			case 'deactivate' :
				$module = stripslashes( $_GET['module'] );
				check_admin_referer( "jetpack_deactivate-$module" );
				Jetpack::deactivate_module( $module );
				Jetpack::state( 'message', 'module_deactivated' );
				Jetpack::state( 'module', $module );
				wp_redirect( Jetpack::admin_url() );
				exit;
			}
		}

		$error = $error ? $error : Jetpack::state( 'error' );
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
				if ( 'sharedaddy' == $module && version_compare( PHP_VERSION, '5', '<' ) ) {
					$this->error = sprintf( __( 'The %1$s module requires <strong>PHP version %2$s</strong> or higher.' ), '<strong>' . $mod['name'] . '</strong>', '5' );
				} else {
					$this->error = sprintf( __( '%s could not be activated because it triggered a <strong>fatal error</strong>. Perhaps there is a conflict with another plugin you have installed?', 'jetpack' ), $mod['name'] );
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

		switch ( $message_code ) {
		case 'module_activated' :
			if ( $module = Jetpack::get_module( Jetpack::state( 'module' ) ) ) {
				$this->message = sprintf( __( '<strong>%s Activated!</strong> You can deactivate at any time using the deactivate button on the module card.', 'jetpack' ), $module['name'] );
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
			$this->message = __( '<strong>Success!</strong> Module settings were saved.', 'jetpack' );
			break;

		case 'already_authorized' :
			$this->message = __( '<strong>Whoops!</strong> Your Jetpack is already connected.', 'jetpack' );
			break;

		case 'authorized' :
			$this->message  = __( "<strong>All Done!</strong> You&#8217;re fueled up and ready to go!", 'jetpack' );
			$this->message .= "<br />\n";
			$this->message .= __( 'The features below are now active. Click the learn more buttons to explore each feature.', 'jetpack' );
			break;
		}

		$active_state = Jetpack::state( 'activated_modules' );
		if ( !empty( $active_state ) ) {
			$mods = explode( ',', $active_state );
			if ( count( $mods ) ) {
				$available = Jetpack::get_available_modules();
				foreach ( $mods as $mod ) {
					if ( in_array( $mod, $available ) )
						$this->stat( 'module-activated', $mod );
				}
			}
		}

		$deactivated_plugins = Jetpack::state( 'deactivated_plugins' );

		if ( !empty( $deactivated_plugins ) ) {
			$deactivated_plugins = explode( ',', $deactivated_plugins );
			$deactivated_titles = array();
			foreach ( $deactivated_plugins as $deactivated_plugin ) {
				if ( !isset( $this->plugins_to_deactivate[$deactivated_plugin] ) ) {
					continue;
				}

				$deactivated_titles[] = '<strong>' . str_replace( ' ', '&nbsp;', $this->plugins_to_deactivate[$deactivated_plugin] ) . '</strong>';
			}

			if ( $deactivated_titles ) {
				if ( $this->message ) {
					$this->message .= "<br /><br />\n";
				}

				$this->message .= wp_sprintf( _n(
					'Jetpack contains the most recent version of the %l plugin.',
					'Jetpack contains the most recent versions of the %l plugins.',
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

		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) )
			do_action( 'jetpack_module_configuration_load_' . $_GET['configure'] );
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
					echo '<img src="' . ( is_ssl() ? 'https' : 'http' ) . '://stats.wordpress.com/g.gif?v=wpcom&x_jetpack-' . esc_attr( $group ) . '=' . esc_attr( implode( ',', $stats ) ) . '&rand=' . md5( mt_rand( 0, 999 ) . time() ) . '" width="1" height="1" style="display:none;" />';
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
		if ( !get_option( 'jetpack_blog_token' ) ) {
			$url = wp_nonce_url( add_query_arg( 'action', 'register', menu_page_url( 'jetpack', false ) ), 'jetpack-register' );
		} else {
			$role = $this->translate_current_user_to_role();
			$signed_role = $this->sign_role( $role );

			$user = wp_get_current_user();

			$args = urlencode_deep( array(
				'response_type' => 'code',
				'client_id' => get_option( 'jetpack_id' ),
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

	function admin_page() {
		global $current_user;

		$role = $this->translate_current_user_to_role();
		$is_connected = JetPack::is_active();
		$module = false;
	?>
		<div class="wrap" id="jetpack-settings">

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
						<p><?php _e( 'Jetpack supercharges your self-hosted WordPress site with the awesome cloud power of WordPress.com.' , 'jetpack' ); ?></p>
					</div>
					<?php endif; ?>
				</div>
			</div>
			
			<h2 style="display: none"></h2> <!-- For WP JS message relocation -->

			<?php do_action( 'jetpack_notices' ) ?>

			<?php // If the connection has not been made then show the marketing text. ?>
			<?php if ( !$is_connected ) : ?>

				<div id="jp-info">
					<a href="<?php echo $this->build_connect_url() ?>" class="jp-button" id="wpcom-connect"><?php _e( 'Connect to WordPress.com', 'jetpack' ); ?></a>
					<p><?php _e( "To enable all of the Jetpack features you&#8217;ll need to connect your website to WordPress.com using the button to the right. Once you&#8217;ve made the connection you&#8217;ll activate all the delightful features below.", 'jetpack' ) ?></p>
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

				<?php if ( $is_connected ) : ?>
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
					<a href="http://automattic.com/privacy/" target="_blank"><?php _e( 'Privacy Policy' , 'jetpack' ); ?></a> |
					<a href="http://wordpress.com/tos/" target="_blank"><?php _e( 'Terms of Service' , 'jetpack' ); ?></a> |
					<a href="" id="jp-debug"><?php _e( 'Debug' , 'jetpack' ); ?></a> |
					<a href="http://jetpack.me/support/" target="_blank"><?php _e( 'Support' , 'jetpack' ); ?></a>
				</p>
			</div>

			<div id="jetpack-configuration" style="display:none;">
				<h4>Debug</h4>
				<ul>
					<li>CLIENT_ID:  <code style="font-size: 14px;"><?php echo esc_html( get_option( 'jetpack_id' ) ); ?></code></li>
					<li>BLOG_TOKEN: <code style="font-size: 14px;"><?php echo esc_html( get_option( 'jetpack_blog_token' ) ); ?></code></li>
					<li>USER_TOKEN: <code style="font-size: 14px;"><?php echo esc_html( get_option( 'jetpack_user_token' ) ); ?></code></li>
				</ul>
			</div>
		</div>
	<?php
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
		if ( !JetPack::is_active() )
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

		foreach ( (array) $available as $module_data ) {
			$module = $module_data['module'];
			if ( in_array( $module, $active ) ) {
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
			if ( !$jetpack_connected ) {
				$classes = 'x disabled';
			}

			?>
			<div class="jetpack-module jetpack-<?php echo $classes; ?>" id="<?php echo $module ?>">
				<h3><?php echo $module_data['name']; ?></h3>
				<div class="jetpack-module-description">
						<div class="module-image">
							<img src="<?php echo esc_url( $module_img ); ?>" align="right" width="71" height="45" />
							<p><?php _e( 'Free' , 'jetpack' ); ?></p>
						</div>
						
						<p><?php echo apply_filters( 'jetpack_short_module_description_' . $module, $module_data['description'] ); ?></p>
				</div>

				<div class="jetpack-module-actions">
				<?php if ( $jetpack_connected ) :
					$activated = in_array( $module, $active );
				?>
					<?php if ( !$activated ) : ?>
						<a href="<?php echo esc_url( $toggle_url ); ?>" class="jetpack-toggle-button<?php echo ( 'inactive' == $css ? ' button-primary' : ' button' ); ?>"><?php echo $toggle; ?></a>&nbsp;
					<?php endif; ?>

					<?php do_action( 'jetpack_learn_more_button_' . $module ) ?>

					<?php
					if ( apply_filters( 'jetpack_module_configurable_' . $module, false ) ) {
						echo '<a href="' . esc_attr( Jetpack::module_configuration_url( $module ) ) . '" class="jetpack-configure-button button">' . __( 'Configure', 'jetpack' ) . '</a>';
					}
					?><?php if ( $activated ) : ?><a style="display: none;" href="<?php echo esc_url( $toggle_url ); ?>" class="jetpack-deactivate-button button"><?php echo $toggle; ?></a>&nbsp;<?php endif; ?>

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
		for ( $i = 0; $i < 15; $i++ ) { ?>
			<div class="jetpack-module placeholder"<?php if ( $i > 8 - $counter ) echo ' style="display: none;"'; ?>>
				<h3><?php _e( 'Coming soon&#8230;', 'jetpack' ) ?></h3>
			</div>
		<?php
		}

		echo '</div><!-- .module-container -->';
	}

	function check_news_subscription() {
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
	 * Determines which WP_Http transport will be used for wp_remote_request() calls.
	 * Detect if that transport has SSL capability on this host.
	 *
	 * Attached to http_transport_post_debug and http_transport_post_debug.
	 *
	 * Supports POST, GET, probably HEAD.  Does not currently support PUT, etc.
	 */
	function http_transport_detector( $transport ) {
		$method = 'http_transport_post_debug' == current_filter() ? 'post' : 'get';

		$transport = strtolower( get_class( array_pop( array_values( $transport ) ) ) );

		switch ( $transport ) {
		// The HTTP and cURL extensions both use cURL and so use cURL's linked OpenSSL for SSL connections.
		case 'wp_http_exthttp' :
		case 'wp_http_curl' :
			if ( is_callable( 'curl_version' ) && $curl_version = curl_version() ) {
				$use_ssl = CURL_VERSION_SSL & $curl_version['features']; // bitwise
				break;
			} // else no break
		// Everything else uses PHP's linked OpenSSL for SSL connections.
		default :
			$use_ssl = extension_loaded( 'openssl' );
		}

		$this->use_ssl[$method] = (bool) $use_ssl;
	}

	/**
	 * Some hosts disable the OpenSSL extension and so cannot make outgoing HTTPS requsets
	 */
	function fix_url_for_bad_hosts( $url, $method = 'post' ) {
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

		$method = 'post' == strtolower( $method ) ? 'post' : 'get';
		$jetpack = Jetpack::init();

		if ( empty( $jetpack->use_ssl ) ) {
			if ( function_exists( '_wp_http_get_object' ) ) {
				_wp_http_get_object();
			} else {
				new WP_Http;
			}
		}

		// Yay! Your host is good!
		if ( $jetpack->use_ssl[$method] ) {
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
		update_option( 'jetpack_register', wp_generate_password( 32, false ) . ':' . wp_generate_password( 32, false ) . ':' . ( time() + 600 ) );

		@list( $secret_1, $secret_2, $secret_eol ) = explode( ':', get_option( 'jetpack_register' ) );
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

		$response = Jetpack_Client::_wp_remote_request( Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'register' ) ), array(
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
		), true );

		if ( is_wp_error( $response ) ) {
			return new Jetpack_Error( 'register_http_request_failed', $response->get_error_message() );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );

		if ( $entity )
			$json = json_decode( $entity );
		else
			$json = false;

		if ( 200 != $code || !empty( $json->error ) ) {
			if ( empty( $json->error ) )
				return new Jetpack_Error( 'not_public', '', $code );

			$error_description = isset( $json->error_description ) ? sprintf( __( 'Error Details: %s' ), (string) $json->error_description ) : '';

			return new Jetpack_Error( (string) $json->error, $error_description, $code );
		}

		if ( empty( $json->jetpack_id ) || !is_scalar( $json->jetpack_id ) || preg_match( '/[^0-9]/', $json->jetpack_id ) )
			return new Jetpack_Error( 'jetpack_id', '', $code );
		if ( empty( $json->jetpack_secret ) || !is_string( $json->jetpack_secret ) )
			return new Jetpack_Error( 'jetpack_secret', '', $code );

		update_option( 'jetpack_id', (int) $json->jetpack_id );
		update_option( 'jetpack_blog_token', $json->jetpack_secret );

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

		$jetpack_signature = new Jetpack_Signature( $token->secret );
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
		return $wpdb->query( $wpdb->prepare(
			"INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload`) VALUES (%s, %s, %s)",
			"jetpack_nonce_{$timestamp}_{$nonce}",
			time(),
			'no'
		) );
	}

	/**
	 * In some setups, $HTTP_RAW_POST_DATA can be emptied during some IXR_Server paths since it is passed by reference to various methods.
	 * Capture it here so we can verify the signature later.
	 */
	function xmlrpc_methods( $methods ) {
		$this->HTTP_RAW_POST_DATA = $GLOBALS['HTTP_RAW_POST_DATA'];
		return $methods;
	}

	function clean_nonces() {
		global $wpdb;

		$wpdb->query( $wpdb->prepare(
			"DELETE FROM `$wpdb->options` WHERE `option_name` LIKE %s AND CAST( `option_value` AS UNSIGNED ) < %d",
			like_escape( 'jetpack_nonce_' ) . '%',
			time() - 3600
		) );
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
			$path = dirname( $bits['path'] );
			$domain = $bits['host'];
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
		static $client = null;

		if ( !isset( $client ) ) {
			Jetpack::load_xml_rpc_client();
			$client = new Jetpack_IXR_ClientMulticall( array(
				'user_id' => get_current_user_id()
			) );
			ignore_user_abort(true);
			add_action( 'shutdown', array( 'Jetpack', 'xmlrpc_async_call' ) );
		}

		$args = func_get_args();
		if ( !empty( $args[0] ) ) {
			call_user_func_array( array( &$client, 'addCall' ), $args );
		} elseif ( !empty( $client->calls ) ) {
			$client->query();
		}
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

		$request = compact( 'method', 'body', 'timeout' );

		@list( $token_key, $secret ) = explode( '.', $token->secret );
		if ( empty( $token ) || empty( $secret ) ) {
			return new Jetpack_Error( 'malformed_token' );
		}

		$token_key = sprintf( '%s:%d:%d', $token_key, JETPACK__API_VERSION, $token->external_user_id );

		require_once dirname( __FILE__ ) . '/class.jetpack-signature.php';

		$jetpack_signature = new Jetpack_Signature( $token->secret );

		$timestamp = time();
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
		$url = Jetpack::fix_url_for_bad_hosts( $url, $method );

		$signature = $jetpack_signature->sign_request( $token_key, $timestamp, $nonce, $body_hash, $method, $url, $body, false );

		if ( !$signature || is_wp_error( $signature ) ) {
			return $signature;
		}

		// Send an Authorization header so various caches/proxies do the right thing
		$auth['signature'] = $signature;
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
	 * 1. a certificate error is found and
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
		$fallback = get_option( 'jetpack_fallback_no_verify_ssl_certs' );
		if ( false === $fallback ) {
			update_option( 'jetpack_fallback_no_verify_ssl_certs', 0 );
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
			return $response;
		}

		// At this point, we're not flagged to fallback and we are allowed to set the flag on this request.

		$message = $response->get_error_message();

		// Is it an SSL Certificate verification error?
		if (
			( false === strpos( $message, 'SSL3_GET_SERVER_CERTIFICATE' ) || false === strpos( $message, '14090086' ) ) // OpenSSL SSL3
		&&
			( false === strpos( $message, 'SSL2_SET_CERTIFICATE' ) || false === strpos( $message, '1407E086' ) ) // OpenSSL SSL2
		) {
			// No, it is not.
			return $response;
		}

		// Redo the request without SSL certificate verification.
		$args['sslverify'] = false;
		$response = wp_remote_request( $url, $args );

		if ( !is_wp_error( $response ) ) {
			// The request went through this time, flag for future fallbacks
			update_option( 'jetpack_fallback_no_verify_ssl_certs', time() );
		}

		return $response;
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
			if ( !$token = get_option( 'jetpack_user_token' ) ) {
				return false;
			}
			$token_chunks = explode( '.', $token );
			if ( empty( $token_chunks[1] ) || empty( $token_chunks[2] ) ) {
				return false;
			}
			$args['user_id'] = $token_chunks[2];
			$token = "{$token_chunks[0]}.{$token_chunks[1]}";
		} else {
			$token = get_option( 'jetpack_blog_token' );
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

			update_option( 'jetpack_user_token', sprintf( '%s.%d', $token, $current_user_id ), true );
			Jetpack::state( 'message', 'authorized' );

			// Now look for standalone plugins and disable if active.

			$deactivated = array();
			foreach ( $jetpack->plugins_to_deactivate as $probable_file => $probable_title ) {
				if ( $this->deactivate_plugin( $probable_file, $probable_title ) ) {
					$deactivated[] = $probable_file;
				}
			}

			if ( $deactivated ) {
				Jetpack::state( 'deactivated_plugins', join( ',', $deactivated ) );

				$url = add_query_arg( array(
					'action' => 'activate_default_modules',
					'_wpnonce' => wp_create_nonce( 'activate_default_modules' ),
				), Jetpack::admin_url() );
				wp_safe_redirect( $url );
				exit;
			}

			Jetpack::activate_default_modules();

			// Start nonce cleaner
			wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
			wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );
		} while ( false );

		wp_redirect( Jetpack::admin_url() );
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
			'client_id' => get_option( 'jetpack_id' ),
			'client_secret' => $client_secret->secret,
			'grant_type' => 'authorization_code',
			'code' => $data['code'],
			'redirect_uri' => add_query_arg( array(
				'action' => 'authorize',
				'_wpnonce' => wp_create_nonce( "jetpack-authorize_$role" ),
			), menu_page_url( 'jetpack', false ) ),
		);

		$response = Jetpack_Client::_wp_remote_request( Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'token' ) ), array(
			'method' => 'POST',
			'body' => $body,
			'headers' => array(
				'Accept' => 'application/json',
			),
		) );

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

			$error_description = isset( $json->error_description ) ? sprintf( __( 'Error Details: %s' ), (string) $json->error_description ) : '';

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

class Jetpack_Error extends WP_Error {}

register_activation_hook( __FILE__, array( 'Jetpack', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack', 'plugin_deactivation' ) );

add_action( 'init', array( 'Jetpack', 'init' ) );
add_action( 'plugins_loaded', array( 'Jetpack', 'load_modules' ), 100 );
